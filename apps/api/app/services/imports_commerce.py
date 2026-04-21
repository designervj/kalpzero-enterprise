from __future__ import annotations

from collections import defaultdict
from types import SimpleNamespace
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import TenantModel
from app.repositories import commerce as commerce_repository
from app.services import commerce as commerce_service
from app.services.errors import ConflictError, NotFoundError, ValidationError

SUPPORTED_COMMERCE_IMPORT_KEYS = (
    "categories",
    "brands",
    "vendors",
    "collections",
    "warehouses",
    "tax_profiles",
    "attribute_sets",
    "products",
    "price_lists",
    "coupons",
)


def _tenant_context(db: Session, *, tenant_id: str) -> tuple[str, str]:
    tenant_row = db.execute(
        select(TenantModel.slug, TenantModel.mongo_db_name).where(TenantModel.id == tenant_id)
    ).first()
    if tenant_row is None:
        raise NotFoundError(f"Tenant with ID '{tenant_id}' not found.")
    tenant_slug, tenant_db_name = tenant_row
    resolved_db_name = str(tenant_db_name or tenant_slug)
    return str(tenant_slug), resolved_db_name


async def _repo_call(db_name: str, operation: str, /, **kwargs):
    return await getattr(commerce_repository, operation)(db_name, **kwargs)


async def run_commerce_import_job(
    db: Session,
    *,
    tenant_id: str,
    source,
    actor_user_id: str,
    job_id: str,
    mode: str,
) -> tuple[str, dict[str, object]]:
    # Removed Beanie JIT initialization

    dataset = source.config_json.get("dataset", {})
    if not isinstance(dataset, dict):
        raise ValidationError("Commerce import source config requires a dataset object.")

    tenant_slug, tenant_db_name = _tenant_context(db, tenant_id=tenant_id)

    report = _make_report(source=source, mode=mode, dataset=dataset)
    plan = await _build_commerce_import_plan(
        db,
        tenant_id=tenant_id,
        db_name=tenant_db_name,
        dataset=dataset,
        report=report,
    )
    _finalize_report_counts(report)

    if report["errors"]:
        report["stage"] = "validation_failed"
        report["executed"] = False
        _finalize_report_summary(report)
        return "failed", report

    if mode == "dry_run":
        report["stage"] = "dry_run_complete"
        report["executed"] = False
        _finalize_report_summary(report)
        return "completed", report

    try:
        # Since we're using MongoDB via Beanie, SQLAlchemy transactions don't apply,
        # but we might still have Postgres side-effects (audit/outbox).
        # However, for pure Mongo imports, we don't need begin_nested() for Mongo safety.
        await _execute_commerce_import_plan(
            db,
            tenant_id=tenant_id,
            db_name=tenant_db_name,
            actor_user_id=actor_user_id,
            job_id=job_id,
            plan=plan,
            report=report,
        )
    except Exception as exc:
        _add_global_error(report, f"Execution failed: {exc}")
        report["stage"] = "execute_failed"
        report["executed"] = False
        _finalize_report_counts(report)
        _finalize_report_summary(report)
        return "failed", report

    report["stage"] = "execute_complete"
    report["executed"] = True
    _finalize_report_counts(report)
    _finalize_report_summary(report)
    return "completed", report


def _make_report(*, source, mode: str, dataset: dict[str, object]) -> dict[str, object]:
    adapter_id = str(
        source.config_json.get("adapter_id")
        or source.config_json.get("plan_adapter_id")
        or "legacy-kalpzero-commerce"
    )
    entities = {
        key: {
            "source_records": _source_record_count(dataset.get(key)),
            "create_candidates": 0,
            "created": 0,
            "skipped_existing": 0,
            "errors": [],
        }
        for key in SUPPORTED_COMMERCE_IMPORT_KEYS
    }
    unsupported_entities = [
        key for key in dataset.keys() if key not in SUPPORTED_COMMERCE_IMPORT_KEYS
    ]
    warnings: list[str] = []
    if unsupported_entities:
        warnings.append(
            "Unsupported commerce dataset sections were ignored: "
            + ", ".join(sorted(str(key) for key in unsupported_entities))
            + "."
        )
    return {
        "stage": "validation",
        "summary": "",
        "supports_dry_run": True,
        "adapter_id": adapter_id,
        "vertical_pack": "commerce",
        "source_type": source.source_type,
        "source_name": source.name,
        "mode": mode,
        "dry_run": mode == "dry_run",
        "executed": False,
        "warnings": warnings,
        "errors": [],
        "entities": entities,
        "totals": {
            "source_records": 0,
            "create_candidates": 0,
            "created": 0,
            "skipped_existing": 0,
            "errors": 0,
        },
    }


def _source_record_count(value: object) -> int:
    return len(value) if isinstance(value, list) else 0


def _dataset_list(dataset: dict[str, object], key: str, report: dict[str, object]) -> list[dict[str, Any]]:
    value = dataset.get(key, [])
    if value is None:
        return []
    if not isinstance(value, list):
        _add_entity_error(report, key, "Dataset section must be a list.")
        return []
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(value, start=1):
        if not isinstance(item, dict):
            _add_entity_error(report, key, f"Record #{index} must be an object.")
            continue
        normalized.append(item)
    return normalized


def _norm_slug(value: object) -> str:
    return str(value or "").strip().lower()


def _norm_code(value: object) -> str:
    return str(value or "").strip().upper()



def _opt_str(value: object | None) -> str | None:
    if value is None:
        return None
    normalized = str(value).strip()
    return normalized or None


def _positive_int(value: object, *, field: str) -> int:
    try:
        normalized = int(value)
    except (TypeError, ValueError) as exc:
        raise ValidationError(f"{field} must be an integer.") from exc
    if normalized < 0:
        raise ValidationError(f"{field} must be non-negative.")
    return normalized


async def _build_commerce_import_plan(
    db: Session,
    *,
    tenant_id: str,
    db_name: str,
    dataset: dict[str, object],
    report: dict[str, object],
) -> dict[str, list[dict[str, Any]]]:
    import asyncio

    # Use asyncio.gather for parallel lookups
    (
        categories,
        brands,
        vendors,
        collections,
        warehouses,
        tax_profiles,
        attribute_sets,
        products_result,
        price_lists,
        coupons,
    ) = await asyncio.gather(
        _repo_call(db_name, "list_categories"),
        _repo_call(db_name, "list_brands"),
        _repo_call(db_name, "list_vendors"),
        _repo_call(db_name, "list_collections"),
        _repo_call(db_name, "list_warehouses"),
        _repo_call(db_name, "list_tax_profiles"),
        _repo_call(db_name, "list_attribute_sets"),
        commerce_repository.list_products(db_name, skip=0, limit=5000),
        _repo_call(db_name, "list_price_lists"),
        _repo_call(db_name, "list_coupons"),
    )
    products, _ = products_result

    existing_categories_by_slug = {_norm_slug(item["slug"]): item for item in categories}
    existing_brands_by_slug = {_norm_slug(item["slug"]): item for item in brands}
    existing_vendors_by_slug = {_norm_slug(item["slug"]): item for item in vendors}
    existing_collections_by_slug = {_norm_slug(item["slug"]): item for item in collections}
    existing_warehouses_by_slug = {_norm_slug(item["slug"]): item for item in warehouses}
    existing_tax_profiles_by_code = {_norm_code(item["code"]): item for item in tax_profiles}
    

    
    existing_attribute_sets_by_slug = {
        _norm_slug(item.get("slug") or item.get("key")): item for item in attribute_sets
    }
    existing_products_by_slug = {_norm_slug(item["slug"]): item for item in products}
    
    existing_variants = await _repo_call(
        db_name,
        "list_variants_for_products",
        product_ids=[item["id"] for item in products],
    )
    existing_variants_by_sku = {_norm_code(item["sku"]): item for item in existing_variants}
    
    existing_price_lists_by_slug = {_norm_slug(item["slug"]): item for item in price_lists}
    existing_coupons_by_code = {_norm_code(item["code"]): item for item in coupons}

    plan: dict[str, list[dict[str, Any]]] = {key: [] for key in SUPPORTED_COMMERCE_IMPORT_KEYS}

    category_records = _dataset_list(dataset, "categories", report)
    planned_category_slugs: set[str] = set()
    for index, item in enumerate(category_records, start=1):
        slug = _norm_slug(item.get("slug"))
        name = _opt_str(item.get("name"))
        if not slug or not name:
            _add_entity_error(report, "categories", f"Record #{index} requires name and slug.")
            continue
        if slug in planned_category_slugs:
            _add_entity_error(report, "categories", f"Duplicate category slug '{slug}' in dataset.")
            continue
        planned_category_slugs.add(slug)
        if slug in existing_categories_by_slug:
            report["entities"]["categories"]["skipped_existing"] += 1
            continue
        plan["categories"].append(
            {
                "name": name,
                "slug": slug,
                "description": _opt_str(item.get("description")),
                "parent_slug": _norm_slug(item.get("parent_slug")) or None,
            }
        )
        report["entities"]["categories"]["create_candidates"] += 1

    known_category_slugs = set(existing_categories_by_slug) | {item["slug"] for item in plan["categories"]}
    for item in plan["categories"]:
        if item["parent_slug"] and item["parent_slug"] not in known_category_slugs:
            _add_entity_error(
                report,
                "categories",
                f"Parent category '{item['parent_slug']}' was not found for '{item['slug']}'.",
            )

    brand_records = _dataset_list(dataset, "brands", report)
    planned_brand_slugs: set[str] = set()
    planned_brand_codes: set[str] = set()
    for index, item in enumerate(brand_records, start=1):
        slug = _norm_slug(item.get("slug"))
        code = _norm_code(item.get("code"))
        name = _opt_str(item.get("name"))
        if not slug or not code or not name:
            _add_entity_error(report, "brands", f"Record #{index} requires name, slug, and code.")
            continue
        if slug in planned_brand_slugs or code in planned_brand_codes:
            _add_entity_error(report, "brands", f"Duplicate brand slug/code in record #{index}.")
            continue
        planned_brand_slugs.add(slug)
        planned_brand_codes.add(code)
        if slug in existing_brands_by_slug:
            report["entities"]["brands"]["skipped_existing"] += 1
            continue
        plan["brands"].append(
            {
                "name": name,
                "slug": slug,
                "code": code,
                "description": _opt_str(item.get("description")),
                "status": _norm_slug(item.get("status") or "active"),
            }
        )
        report["entities"]["brands"]["create_candidates"] += 1

    vendor_records = _dataset_list(dataset, "vendors", report)
    planned_vendor_slugs: set[str] = set()
    planned_vendor_codes: set[str] = set()
    for index, item in enumerate(vendor_records, start=1):
        slug = _norm_slug(item.get("slug"))
        code = _norm_code(item.get("code"))
        name = _opt_str(item.get("name"))
        if not slug or not code or not name:
            _add_entity_error(report, "vendors", f"Record #{index} requires name, slug, and code.")
            continue
        if slug in planned_vendor_slugs or code in planned_vendor_codes:
            _add_entity_error(report, "vendors", f"Duplicate vendor slug/code in record #{index}.")
            continue
        planned_vendor_slugs.add(slug)
        planned_vendor_codes.add(code)
        if slug in existing_vendors_by_slug:
            report["entities"]["vendors"]["skipped_existing"] += 1
            continue
        plan["vendors"].append(
            {
                "name": name,
                "slug": slug,
                "code": code,
                "description": _opt_str(item.get("description")),
                "contact_name": _opt_str(item.get("contact_name")),
                "contact_email": _opt_str(item.get("contact_email")),
                "contact_phone": _opt_str(item.get("contact_phone")),
                "status": _norm_slug(item.get("status") or "active"),
            }
        )
        report["entities"]["vendors"]["create_candidates"] += 1

    collection_records = _dataset_list(dataset, "collections", report)
    planned_collection_slugs: set[str] = set()
    for index, item in enumerate(collection_records, start=1):
        slug = _norm_slug(item.get("slug"))
        name = _opt_str(item.get("name"))
        if not slug or not name:
            _add_entity_error(report, "collections", f"Record #{index} requires name and slug.")
            continue
        if slug in planned_collection_slugs:
            _add_entity_error(report, "collections", f"Duplicate collection slug '{slug}' in dataset.")
            continue
        planned_collection_slugs.add(slug)
        if slug in existing_collections_by_slug:
            report["entities"]["collections"]["skipped_existing"] += 1
            continue
        plan["collections"].append(
            {
                "name": name,
                "slug": slug,
                "description": _opt_str(item.get("description")),
                "status": _norm_slug(item.get("status") or "active"),
                "sort_order": _positive_int(item.get("sort_order", 0), field="collection.sort_order"),
            }
        )
        report["entities"]["collections"]["create_candidates"] += 1

    warehouse_records = _dataset_list(dataset, "warehouses", report)
    planned_warehouse_slugs: set[str] = set()
    planned_warehouse_codes: set[str] = set()
    default_warehouse_count = 0
    for index, item in enumerate(warehouse_records, start=1):
        slug = _norm_slug(item.get("slug"))
        code = _norm_code(item.get("code"))
        name = _opt_str(item.get("name"))
        if not slug or not code or not name:
            _add_entity_error(report, "warehouses", f"Record #{index} requires name, slug, and code.")
            continue
        if slug in planned_warehouse_slugs or code in planned_warehouse_codes:
            _add_entity_error(report, "warehouses", f"Duplicate warehouse slug/code in record #{index}.")
            continue
        planned_warehouse_slugs.add(slug)
        planned_warehouse_codes.add(code)
        if slug in existing_warehouses_by_slug:
            report["entities"]["warehouses"]["skipped_existing"] += 1
            continue
        is_default = bool(item.get("is_default", False))
        if is_default:
            default_warehouse_count += 1
        plan["warehouses"].append(
            {
                "name": name,
                "slug": slug,
                "code": code,
                "city": _opt_str(item.get("city")),
                "country": _opt_str(item.get("country")),
                "status": _norm_slug(item.get("status") or "active"),
                "is_default": is_default,
            }
        )
        report["entities"]["warehouses"]["create_candidates"] += 1
    if default_warehouse_count > 1:
        _add_entity_error(report, "warehouses", "Only one imported warehouse can be marked as default.")

    tax_profile_records = _dataset_list(dataset, "tax_profiles", report)
    planned_tax_codes: set[str] = set()
    for index, item in enumerate(tax_profile_records, start=1):
        code = _norm_code(item.get("code"))
        name = _opt_str(item.get("name"))
        if not code or not name:
            _add_entity_error(report, "tax_profiles", f"Record #{index} requires name and code.")
            continue
        if code in planned_tax_codes:
            _add_entity_error(report, "tax_profiles", f"Duplicate tax profile code '{code}' in dataset.")
            continue
        planned_tax_codes.add(code)
        if code in existing_tax_profiles_by_code:
            report["entities"]["tax_profiles"]["skipped_existing"] += 1
            continue
        try:
            rules = commerce_service._normalize_tax_rules(list(item.get("rules", [])))
        except (TypeError, ValidationError) as exc:
            _add_entity_error(report, "tax_profiles", f"Tax profile '{code}': {exc}")
            continue
        plan["tax_profiles"].append(
            {
                "name": name,
                "code": code,
                "description": _opt_str(item.get("description")),
                "prices_include_tax": bool(item.get("prices_include_tax", False)),
                "rules": rules,
                "status": _norm_slug(item.get("status") or "active"),
            }
        )
        report["entities"]["tax_profiles"]["create_candidates"] += 1



    attribute_set_records = _dataset_list(dataset, "attribute_sets", report)
    planned_attribute_sets_by_slug: dict[str, Any] = {}
    for index, item in enumerate(attribute_set_records, start=1):
        slug = _norm_slug(item.get("slug"))
        name = _opt_str(item.get("name"))
        if not slug or not name:
            _add_entity_error(report, "attribute_sets", f"Record #{index} requires name and slug.")
            continue
        if slug in planned_attribute_sets_by_slug:
            _add_entity_error(report, "attribute_sets", f"Duplicate attribute set slug '{slug}' in dataset.")
            continue
        if slug in existing_attribute_sets_by_slug:
            report["entities"]["attribute_sets"]["skipped_existing"] += 1
            continue
        attributes = item.get("attributes", [])
        payload = {
            "name": name,
            "slug": slug,
            "appliesTo": _opt_str(item.get("appliesTo", "product")),
            "description": _opt_str(item.get("description")),
            "attributes": attributes,
            "vertical_bindings": commerce_service._dedupe_strings(
                [str(entry) for entry in item.get("vertical_bindings", ["commerce"])],
                default=["commerce"],
            ),
            "status": _norm_slug(item.get("status") or "active"),
        }
        plan["attribute_sets"].append(payload)
        planned_attribute_sets_by_slug[slug] = SimpleNamespace(
            id=f"import-attribute-set:{slug}",
            slug=slug,
            appliesTo=payload["appliesTo"],
            attributes=attributes,
            status=payload["status"],
        )
        report["entities"]["attribute_sets"]["create_candidates"] += 1

    known_attribute_sets_by_slug = {**existing_attribute_sets_by_slug, **planned_attribute_sets_by_slug}

    product_records = _dataset_list(dataset, "products", report)
    planned_product_slugs: set[str] = set()
    planned_variant_skus: set[str] = set()
    for index, item in enumerate(product_records, start=1):
        slug = _norm_slug(item.get("slug"))
        name = _opt_str(item.get("name"))
        if not slug or not name:
            _add_entity_error(report, "products", f"Record #{index} requires name and slug.")
            continue
        if slug in planned_product_slugs:
            _add_entity_error(report, "products", f"Duplicate product slug '{slug}' in dataset.")
            continue
        planned_product_slugs.add(slug)
        if slug in existing_products_by_slug:
            report["entities"]["products"]["skipped_existing"] += 1
            continue

        category_slugs = commerce_service._dedupe_strings(
            [_norm_slug(entry) for entry in item.get("category_slugs", [])]
        )
        if not category_slugs:
            _add_entity_error(report, "products", f"Product '{slug}' requires category_slugs.")
            continue
        missing_categories = [entry for entry in category_slugs if entry not in known_category_slugs]
        if missing_categories:
            _add_entity_error(
                report,
                "products",
                f"Product '{slug}' references unknown categories: {', '.join(missing_categories)}.",
            )
            continue

        brand_slug = _norm_slug(item.get("brand_slug")) or None
        if brand_slug and brand_slug not in (set(existing_brands_by_slug) | planned_brand_slugs):
            _add_entity_error(report, "products", f"Product '{slug}' references unknown brand '{brand_slug}'.")
            continue
        vendor_slug = _norm_slug(item.get("vendor_slug")) or None
        if vendor_slug and vendor_slug not in (set(existing_vendors_by_slug) | planned_vendor_slugs):
            _add_entity_error(report, "products", f"Product '{slug}' references unknown vendor '{vendor_slug}'.")
            continue
        collection_slugs = commerce_service._dedupe_strings(
            [_norm_slug(entry) for entry in item.get("collection_slugs", [])]
        )
        missing_collections = [
            entry for entry in collection_slugs if entry not in (set(existing_collections_by_slug) | planned_collection_slugs)
        ]
        if missing_collections:
            _add_entity_error(
                report,
                "products",
                f"Product '{slug}' references unknown collections: {', '.join(missing_collections)}.",
            )
            continue
        attribute_set_slug = _norm_slug(item.get("attribute_set_slug")) or None
        if attribute_set_slug and attribute_set_slug not in known_attribute_sets_by_slug:
            _add_entity_error(
                report,
                "products",
                f"Product '{slug}' references unknown attribute set '{attribute_set_slug}'.",
            )
            continue



        raw_variants = item.get("variants", [])
        if not isinstance(raw_variants, list) or not raw_variants:
            _add_entity_error(report, "products", f"Product '{slug}' requires variants.")
            continue
        normalized_variants: list[dict[str, Any]] = []
        variant_attribute_payloads: list[list[dict[str, object]]] = []
        variant_sku_keys: list[str] = []
        valid_variants = True
        for variant_index, variant_item in enumerate(raw_variants, start=1):
            if not isinstance(variant_item, dict):
                _add_entity_error(report, "products", f"Product '{slug}' variant #{variant_index} must be an object.")
                valid_variants = False
                continue
            sku = _norm_code(variant_item.get("sku"))
            label = _opt_str(variant_item.get("label"))
            if not sku or not label:
                _add_entity_error(report, "products", f"Product '{slug}' variant #{variant_index} requires sku and label.")
                valid_variants = False
                continue
            if sku in planned_variant_skus or sku in variant_sku_keys or sku in existing_variants_by_sku:
                _add_entity_error(report, "products", f"Variant SKU '{sku}' already exists.")
                valid_variants = False
                continue
            price_minor = _positive_int(variant_item.get("price_minor", 0), field=f"{slug}.{sku}.price_minor")
            inventory_quantity = _positive_int(
                variant_item.get("inventory_quantity", 0),
                field=f"{slug}.{sku}.inventory_quantity",
            )


            warehouse_stock_payloads: list[dict[str, Any]] = []
            raw_warehouse_stocks = variant_item.get("warehouse_stock", [])
            if raw_warehouse_stocks:
                if not isinstance(raw_warehouse_stocks, list):
                    _add_entity_error(
                        report,
                        "products",
                        f"Product '{slug}' variant '{sku}' warehouse_stock must be a list.",
                    )
                    valid_variants = False
                    continue
                total_allocated = 0
                seen_variant_warehouses: set[str] = set()
                for stock_index, stock_item in enumerate(raw_warehouse_stocks, start=1):
                    if not isinstance(stock_item, dict):
                        _add_entity_error(
                            report,
                            "products",
                            f"Product '{slug}' variant '{sku}' warehouse stock #{stock_index} must be an object.",
                        )
                        valid_variants = False
                        continue
                    warehouse_slug = _norm_slug(stock_item.get("warehouse_slug"))
                    if not warehouse_slug:
                        _add_entity_error(
                            report,
                            "products",
                            f"Product '{slug}' variant '{sku}' warehouse stock #{stock_index} requires warehouse_slug.",
                        )
                        valid_variants = False
                        continue
                    if warehouse_slug in seen_variant_warehouses:
                        _add_entity_error(
                            report,
                            "products",
                            f"Product '{slug}' variant '{sku}' repeats warehouse '{warehouse_slug}'.",
                        )
                        valid_variants = False
                        continue
                    seen_variant_warehouses.add(warehouse_slug)
                    if warehouse_slug not in (set(existing_warehouses_by_slug) | planned_warehouse_slugs):
                        _add_entity_error(
                            report,
                            "products",
                            f"Product '{slug}' variant '{sku}' references unknown warehouse '{warehouse_slug}'.",
                        )
                        valid_variants = False
                        continue
                    on_hand_quantity = _positive_int(
                        stock_item.get("on_hand_quantity", 0),
                        field=f"{slug}.{sku}.{warehouse_slug}.on_hand_quantity",
                    )
                    low_stock_threshold = _positive_int(
                        stock_item.get("low_stock_threshold", 0),
                        field=f"{slug}.{sku}.{warehouse_slug}.low_stock_threshold",
                    )
                    total_allocated += on_hand_quantity
                    warehouse_stock_payloads.append(
                        {
                            "warehouse_slug": warehouse_slug,
                            "on_hand_quantity": on_hand_quantity,
                            "low_stock_threshold": low_stock_threshold,
                        }
                    )
                if warehouse_stock_payloads and total_allocated != inventory_quantity:
                    _add_entity_error(
                        report,
                        "products",
                        f"Product '{slug}' variant '{sku}' inventory_quantity must equal warehouse_stock total.",
                    )
                    valid_variants = False
            normalized_variants.append(
                {
                    "sku": sku,
                    "label": label,
                    "price_minor": price_minor,
                    "currency": str(variant_item.get("currency", "INR")).strip().upper(),
                    "inventory_quantity": inventory_quantity,
                    "warehouse_stock": warehouse_stock_payloads,
                }
            )
            variant_attribute_payloads.append([])
            variant_sku_keys.append(sku)

        if not valid_variants:
            continue



        plan["products"].append(
            {
                "name": name,
                "slug": slug,
                "description": _opt_str(item.get("description")),
                "brand_slug": brand_slug,
                "vendor_slug": vendor_slug,
                "collection_slugs": collection_slugs,
                "attribute_set_slug": attribute_set_slug,
                "category_slugs": category_slugs,
                "seo_title": _opt_str(item.get("seo_title")),
                "seo_description": _opt_str(item.get("seo_description")),
                "status": _norm_slug(item.get("status") or "active"),
                "variants": normalized_variants,
            }
        )
        planned_variant_skus.update(variant_sku_keys)
        report["entities"]["products"]["create_candidates"] += 1

    known_variant_skus = set(existing_variants_by_sku) | planned_variant_skus

    price_list_records = _dataset_list(dataset, "price_lists", report)
    planned_price_list_slugs: set[str] = set()
    for index, item in enumerate(price_list_records, start=1):
        error_count_before = len(report["errors"])
        slug = _norm_slug(item.get("slug"))
        name = _opt_str(item.get("name"))
        if not slug or not name:
            _add_entity_error(report, "price_lists", f"Record #{index} requires name and slug.")
            continue
        if slug in planned_price_list_slugs:
            _add_entity_error(report, "price_lists", f"Duplicate price list slug '{slug}' in dataset.")
            continue
        planned_price_list_slugs.add(slug)
        if slug in existing_price_lists_by_slug:
            report["entities"]["price_lists"]["skipped_existing"] += 1
            continue
        raw_items = item.get("items", [])
        if not isinstance(raw_items, list) or not raw_items:
            _add_entity_error(report, "price_lists", f"Price list '{slug}' requires items.")
            continue
        normalized_items: list[dict[str, Any]] = []
        for item_index, price_item in enumerate(raw_items, start=1):
            if not isinstance(price_item, dict):
                _add_entity_error(report, "price_lists", f"Price list '{slug}' item #{item_index} must be an object.")
                continue
            variant_sku = _norm_code(price_item.get("variant_sku"))
            if variant_sku not in known_variant_skus:
                _add_entity_error(
                    report,
                    "price_lists",
                    f"Price list '{slug}' references unknown variant SKU '{variant_sku}'.",
                )
                continue
            normalized_items.append(
                {
                    "variant_sku": variant_sku,
                    "price_minor": _positive_int(
                        price_item.get("price_minor", 0),
                        field=f"{slug}.{variant_sku}.price_minor",
                    ),
                }
            )
        if not normalized_items:
            continue
        if len(report["errors"]) != error_count_before:
            continue
        plan["price_lists"].append(
            {
                "name": name,
                "slug": slug,
                "currency": str(item.get("currency", "INR")).strip().upper(),
                "customer_segment": _opt_str(item.get("customer_segment")),
                "description": _opt_str(item.get("description")),
                "status": _norm_slug(item.get("status") or "active"),
                "items": normalized_items,
            }
        )
        report["entities"]["price_lists"]["create_candidates"] += 1

    coupon_records = _dataset_list(dataset, "coupons", report)
    planned_coupon_codes: set[str] = set()
    for index, item in enumerate(coupon_records, start=1):
        code = _norm_code(item.get("code"))
        if not code:
            _add_entity_error(report, "coupons", f"Record #{index} requires code.")
            continue
        if code in planned_coupon_codes:
            _add_entity_error(report, "coupons", f"Duplicate coupon code '{code}' in dataset.")
            continue
        planned_coupon_codes.add(code)
        if code in existing_coupons_by_code:
            report["entities"]["coupons"]["skipped_existing"] += 1
            continue
        discount_type = _norm_slug(item.get("discount_type"))
        if discount_type not in commerce_service.COUPON_DISCOUNT_TYPES:
            _add_entity_error(report, "coupons", f"Coupon '{code}' has unsupported discount_type.")
            continue
        category_slugs = commerce_service._dedupe_strings(
            [_norm_slug(entry) for entry in item.get("applicable_category_slugs", [])]
        )
        missing_category_refs = [entry for entry in category_slugs if entry not in known_category_slugs]
        if missing_category_refs:
            _add_entity_error(
                report,
                "coupons",
                f"Coupon '{code}' references unknown categories: {', '.join(missing_category_refs)}.",
            )
            continue
        variant_skus = commerce_service._dedupe_strings(
            [_norm_code(entry) for entry in item.get("applicable_variant_skus", [])]
        )
        missing_variant_refs = [entry for entry in variant_skus if entry not in known_variant_skus]
        if missing_variant_refs:
            _add_entity_error(
                report,
                "coupons",
                f"Coupon '{code}' references unknown variants: {', '.join(missing_variant_refs)}.",
            )
            continue
        plan["coupons"].append(
            {
                "code": code,
                "description": _opt_str(item.get("description")),
                "discount_type": discount_type,
                "discount_value": _positive_int(item.get("discount_value", 0), field=f"{code}.discount_value"),
                "minimum_subtotal_minor": _positive_int(
                    item.get("minimum_subtotal_minor", 0),
                    field=f"{code}.minimum_subtotal_minor",
                ),
                "maximum_discount_minor": (
                    _positive_int(item.get("maximum_discount_minor", 0), field=f"{code}.maximum_discount_minor")
                    if item.get("maximum_discount_minor") is not None
                    else None
                ),
                "applicable_category_slugs": category_slugs,
                "applicable_variant_skus": variant_skus,
                "status": _norm_slug(item.get("status") or "active"),
            }
        )
        report["entities"]["coupons"]["create_candidates"] += 1

    return plan


async def _execute_commerce_import_plan(
    db: Session,
    *,
    tenant_id: str,
    db_name: str,
    actor_user_id: str,
    job_id: str,
    plan: dict[str, list[dict[str, Any]]],
    report: dict[str, object],
) -> None:
    category_lookup = {
        _norm_slug(item["slug"]): item for item in await _repo_call(db_name, "list_categories")
    }
    unresolved_categories = list(plan["categories"])
    while unresolved_categories:
        remaining: list[dict[str, Any]] = []
        progressed = False
        for item in unresolved_categories:
            parent = category_lookup.get(item["parent_slug"]) if item["parent_slug"] else None
            if item["parent_slug"] and parent is None:
                remaining.append(item)
                continue
            created = await _repo_call(
                db_name,
                "create_category",
                name=item["name"],
                slug=item["slug"],
                type="standard",
                parentId=parent["id"] if parent is not None else None,
                description=item["description"] or "",
                pageStatus="published",
                bannerImageUrl="",
                metaTitle="",
                metaDescription="",
            )
            category_lookup[item["slug"]] = created
            report["entities"]["categories"]["created"] += 1
            progressed = True
        if not progressed:
            raise ValidationError("Category hierarchy could not be resolved during execution.")
        unresolved_categories = remaining

    brands_list = await _repo_call(db_name, "list_brands")
    brand_lookup = {_norm_slug(item["slug"]): item for item in brands_list}
    for item in plan["brands"]:
        created = await _repo_call(
            db_name,
            "create_brand",
            name=item["name"],
            slug=item["slug"],
            code=item["code"],
            description=item["description"],
            status=item["status"],
        )
        brand_lookup[item["slug"]] = created
        report["entities"]["brands"]["created"] += 1

    vendors_list = await _repo_call(db_name, "list_vendors")
    vendor_lookup = {_norm_slug(item["slug"]): item for item in vendors_list}
    for item in plan["vendors"]:
        created = await _repo_call(
            db_name,
            "create_vendor",
            name=item["name"],
            slug=item["slug"],
            code=item["code"],
            description=item["description"],
            contact_name=item["contact_name"],
            contact_email=item["contact_email"],
            contact_phone=item["contact_phone"],
            status=item["status"],
        )
        vendor_lookup[item["slug"]] = created
        report["entities"]["vendors"]["created"] += 1

    collections_list = await _repo_call(db_name, "list_collections")
    collection_lookup = {_norm_slug(item["slug"]): item for item in collections_list}
    for item in plan["collections"]:
        created = await _repo_call(
            db_name,
            "create_collection",
            name=item["name"],
            slug=item["slug"],
            description=item["description"],
            status=item["status"],
            sort_order=item["sort_order"],
        )
        collection_lookup[item["slug"]] = created
        report["entities"]["collections"]["created"] += 1

    warehouses_list = await _repo_call(db_name, "list_warehouses")
    warehouse_lookup = {_norm_slug(item["slug"]): item for item in warehouses_list}
    for item in plan["warehouses"]:
        created = await _repo_call(
            db_name,
            "create_warehouse",
            name=item["name"],
            slug=item["slug"],
            code=item["code"],
            city=item["city"],
            country=item["country"],
            status=item["status"],
            is_default=item["is_default"],
        )
        warehouse_lookup[item["slug"]] = created
        report["entities"]["warehouses"]["created"] += 1

    tax_profiles_list = await _repo_call(db_name, "list_tax_profiles")
    tax_profile_lookup = {_norm_code(item["code"]): item for item in tax_profiles_list}
    for item in plan["tax_profiles"]:
        created = await _repo_call(
            db_name,
            "create_tax_profile",
            name=item["name"],
            code=item["code"],
            description=item["description"],
            prices_include_tax=item["prices_include_tax"],
            rules_json=item["rules"],
            status=item["status"],
        )
        tax_profile_lookup[item["code"]] = created
        report["entities"]["tax_profiles"]["created"] += 1



    attribute_sets_list = await _repo_call(db_name, "list_attribute_sets")
    attribute_set_lookup = {
        _norm_slug(item.get("slug") or item.get("key")): item for item in attribute_sets_list
    }
    for item in plan["attribute_sets"]:
        created = await _repo_call(
            db_name,
            "create_attribute_set",
            name=item["name"],
            key=item["slug"],
            appliesTo=item["appliesTo"],
            description=item["description"],
            attributes=item["attributes"],
            vertical_bindings=item["vertical_bindings"],
        )
        attribute_set_lookup[item["slug"]] = created
        report["entities"]["attribute_sets"]["created"] += 1

    products_list, _ = await commerce_repository.list_products(db_name, skip=0, limit=5000)
    product_lookup = {_norm_slug(item["slug"]): item for item in products_list}
    
    variants_list = await _repo_call(
        db_name,
        "list_variants_for_products",
        product_ids=[item["id"] for item in product_lookup.values()],
    )
    variant_lookup_by_sku = {_norm_code(item["sku"]): item for item in variants_list}

    for item in plan["products"]:
        created_product, created_variants = await _create_product_from_import(
            db,
            tenant_id=tenant_id,
            db_name=db_name,
            actor_user_id=actor_user_id,
            job_id=job_id,
            payload=item,
            category_lookup=category_lookup,
            brand_lookup=brand_lookup,
            vendor_lookup=vendor_lookup,
            collection_lookup=collection_lookup,
            attribute_set_lookup=attribute_set_lookup,
            warehouse_lookup=warehouse_lookup,
        )
        product_lookup[item["slug"]] = created_product
        for variant in created_variants:
            variant_lookup_by_sku[_norm_code(variant["sku"])] = variant
        report["entities"]["products"]["created"] += 1

    price_lists_list = await _repo_call(db_name, "list_price_lists")
    price_list_lookup = {_norm_slug(item["slug"]): item for item in price_lists_list}
    for item in plan["price_lists"]:
        created = await _repo_call(
            db_name,
            "create_price_list",
            name=item["name"],
            slug=item["slug"],
            currency=item["currency"],
            customer_segment=item["customer_segment"],
            description=item["description"],
            status=item["status"],
        )
        for price_item in item["items"]:
            variant = variant_lookup_by_sku[price_item["variant_sku"]]
            await _repo_call(
                db_name,
                "create_price_list_item",
                price_list_id=created["id"],
                variant_id=variant["id"],
                price_minor=price_item["price_minor"],
            )
        price_list_lookup[item["slug"]] = created
        report["entities"]["price_lists"]["created"] += 1

    for item in plan["coupons"]:
        cat_ids = [category_lookup[slug]["id"] for slug in item["applicable_category_slugs"]]
        var_ids = [variant_lookup_by_sku[sku]["id"] for sku in item["applicable_variant_skus"]]
        await _repo_call(
            db_name,
            "create_coupon",
            code=item["code"],
            description=item["description"],
            discount_type=item["discount_type"],
            discount_value=item["discount_value"],
            minimum_subtotal_minor=item["minimum_subtotal_minor"],
            maximum_discount_minor=item["maximum_discount_minor"],
            applicable_category_ids=cat_ids,
            applicable_variant_ids=var_ids,
            status=item["status"],
        )
        report["entities"]["coupons"]["created"] += 1


async def _create_product_from_import(
    db: Session,
    *,
    tenant_id: str,
    db_name: str,
    actor_user_id: str,
    job_id: str,
    payload: dict[str, Any],
    category_lookup: dict[str, Any],
    brand_lookup: dict[str, Any],
    vendor_lookup: dict[str, Any],
    collection_lookup: dict[str, Any],
    attribute_set_lookup: dict[str, Any],
    warehouse_lookup: dict[str, Any],
):
    attribute_set = attribute_set_lookup.get(payload["attribute_set_slug"]) if payload["attribute_set_slug"] else None
    product = await commerce_service.create_product(
        db,
        db_name=db_name,
        tenant_slug=str(tenant_id),
        actor_user_id=actor_user_id,
        payload={
            "name": payload["name"],
            "slug": payload["slug"],
            "description": payload["description"],
            "brand_id": brand_lookup[payload["brand_slug"]]["id"] if payload["brand_slug"] else None,
            "vendor_id": vendor_lookup[payload["vendor_slug"]]["id"] if payload["vendor_slug"] else None,
            "collection_ids": [collection_lookup[slug]["id"] for slug in payload["collection_slugs"]],
            "attribute_set_id": attribute_set["id"] if attribute_set is not None else None,
            "category_ids": [category_lookup[slug]["id"] for slug in payload["category_slugs"]],
            "seo_title": payload["seo_title"],
            "seo_description": payload["seo_description"],
            "status": payload["status"],
            "product_attributes": [],
            "variants": payload["variants"],
        },
    )

    created_variants = list(product["variants"])
    variants_by_sku = {_norm_code(item["sku"]): item for item in created_variants}
    for variant_payload in payload["variants"]:
        variant = variants_by_sku[_norm_code(variant_payload["sku"])]
        await _seed_variant_warehouse_stock(
            db,
            tenant_id=tenant_id,
            db_name=db_name,
            actor_user_id=actor_user_id,
            job_id=job_id,
            variant=variant,
            warehouse_stock_payloads=variant_payload["warehouse_stock"],
            warehouse_lookup=warehouse_lookup,
        )
    return product, created_variants


async def _seed_variant_warehouse_stock(
    db: Session,
    *,
    tenant_id: str,
    db_name: str,
    actor_user_id: str,
    job_id: str,
    variant,
    warehouse_stock_payloads: list[dict[str, Any]],
    warehouse_lookup: dict[str, Any],
) -> None:
    payloads = list(warehouse_stock_payloads)
    if not payloads and variant["inventory_quantity"] > 0:
        default_warehouse = next(
            (item for item in warehouse_lookup.values() if item["is_default"] and item["status"] == "active"),
            None,
        )
        if default_warehouse is not None:
            payloads = [
                {
                    "warehouse_slug": _norm_slug(default_warehouse["slug"]),
                    "on_hand_quantity": variant["inventory_quantity"],
                    "low_stock_threshold": 0,
                }
            ]
    if not payloads:
        return
    for item in payloads:
        warehouse = warehouse_lookup[item["warehouse_slug"]]
        stock = await _repo_call(
            db_name,
            "create_warehouse_stock",
            warehouse_id=warehouse["id"],
            variant_id=variant["id"],
            on_hand_quantity=item["on_hand_quantity"],
            reserved_quantity=0,
            low_stock_threshold=item["low_stock_threshold"],
        )
        await _repo_call(
            db_name,
            "create_stock_ledger_entry",
            warehouse_id=warehouse["id"],
            variant_id=variant["id"],
            entry_type="adjustment",
            quantity_delta=item["on_hand_quantity"],
            balance_after=stock["on_hand_quantity"],
            reserved_after=stock["reserved_quantity"],
            reference_type="import_job",
            reference_id=job_id,
            notes="Imported opening inventory.",
            recorded_by_user_id=actor_user_id,
        )
    await commerce_service._sync_variant_inventory_from_stocks(
        db_name,
        tenant_id=tenant_id,
        variant_ids=[variant["id"]],
    )


def _add_entity_error(report: dict[str, object], entity_key: str, message: str) -> None:
    entity_bucket = report["entities"][entity_key]
    entity_bucket["errors"].append(message)
    report["errors"].append(f"{entity_key}: {message}")


def _add_global_error(report: dict[str, object], message: str) -> None:
    report["errors"].append(message)



def _finalize_report_counts(report: dict[str, object]) -> None:
    totals = report["totals"]
    totals["source_records"] = sum(
        int(entity_report["source_records"]) for entity_report in report["entities"].values()
    )
    totals["create_candidates"] = sum(
        int(entity_report["create_candidates"]) for entity_report in report["entities"].values()
    )
    totals["created"] = sum(int(entity_report["created"]) for entity_report in report["entities"].values())
    totals["skipped_existing"] = sum(
        int(entity_report["skipped_existing"]) for entity_report in report["entities"].values()
    )
    totals["errors"] = len(report["errors"])


def _finalize_report_summary(report: dict[str, object]) -> None:
    totals = report["totals"]
    if report["errors"]:
        report["summary"] = (
            f"Commerce import {report['mode']} finished with {totals['errors']} error(s), "
            f"{totals['create_candidates']} create candidate(s), and {totals['skipped_existing']} existing record(s)."
        )
        return
    if report["mode"] == "dry_run":
        report["summary"] = (
            f"Commerce import dry run validated {totals['source_records']} source record(s) with "
            f"{totals['create_candidates']} create candidate(s) and {totals['skipped_existing']} existing record(s)."
        )
        return
    report["summary"] = (
        f"Commerce import executed successfully: {totals['created']} record(s) created and "
        f"{totals['skipped_existing']} existing record(s) skipped."
    )
