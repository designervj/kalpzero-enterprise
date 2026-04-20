from datetime import UTC, datetime

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.mongo import RuntimeDocumentStore, get_runtime_mongo_database
from app.repositories import commerce as commerce_repository
from app.repositories import platform as platform_repository
from app.repositories import travel as travel_repository
from app.services.errors import NotFoundError
from app.services.platform import get_tenant_or_raise
from typing import Any

BLUEPRINT_COLLECTION = "business_blueprints"
PAGE_COLLECTION = "site_pages"
DISCOVERY_COLLECTION = "discovery_profiles"
HOTEL_PROFILE_COLLECTION = "hotel_property_profiles"
HOTEL_AMENITY_COLLECTION = "hotel_amenity_catalogs"
HOTEL_NEARBY_COLLECTION = "hotel_nearby_places"


def _tenant_runtime_database(db: Session, *, tenant_id: str):
    tenant = platform_repository.get_tenant_by_id(db, tenant_id)
    if tenant is None or not tenant.mongo_db_name:
        raise NotFoundError(f"Tenant '{tenant_id}' runtime database was not found.")
    return get_runtime_mongo_database(get_settings(), database_name=tenant.mongo_db_name)


def _normalize_runtime_document(document: dict[str, object] | None) -> dict[str, object] | None:
    if document is None:
        return None
    normalized = dict(document)
    identifier = normalized.pop("_id", normalized.get("id"))
    normalized["id"] = str(identifier) if identifier is not None else None
    return normalized


def _travel_runtime_snapshot(db: Session, *, tenant_id: str) -> tuple[list[dict[str, object]], list[dict[str, object]]]:
    runtime_db = _tenant_runtime_database(db, tenant_id=tenant_id)
    packages = [
        _normalize_runtime_document(item)
        for item in runtime_db["travel_packages"].find({"status": "active"}).sort("created_at", -1)
    ]
    departures = [
        _normalize_runtime_document(item)
        for item in runtime_db["travel_departures"].find({"status": "scheduled"}).sort("departure_date", 1)
    ]
    return [item for item in packages if item is not None], [item for item in departures if item is not None]


def _commerce_runtime_snapshot(
    db: Session, *, tenant_id: str
) -> tuple[list[dict[str, object]], dict[str, dict[str, object]], list[dict[str, object]]]:
    runtime_db = _tenant_runtime_database(db, tenant_id=tenant_id)
    products = [
        _normalize_runtime_document(item)
        for item in runtime_db["commerce_products"].find({"status": "active"}).sort("created_at", -1)
    ]
    products = [item for item in products if item is not None]
    categories = [
        _normalize_runtime_document(item)
        for item in runtime_db["commerce_categories"].find({}).sort("created_at", -1)
    ]
    category_lookup = {
        str(item["id"]): item
        for item in categories
        if item is not None and item.get("id") is not None
    }
    product_ids = [str(item["id"]) for item in products if item.get("id") is not None]
    variants = [
        _normalize_runtime_document(item)
        for item in runtime_db["commerce_variants"].find({"product_id": {"$in": product_ids}}).sort("created_at", 1)
    ] if product_ids else []
    return products, category_lookup, [item for item in variants if item is not None]


def _format_minor_currency(amount_minor: int, currency: str) -> str:
    normalized_currency = currency.upper()
    major_value = amount_minor / 100
    if normalized_currency == "INR":
        return f"INR {major_value:,.2f}"
    return f"{normalized_currency} {major_value:,.2f}"


def _theme_for_vertical(vertical_pack: str, *, admin: bool) -> dict[str, object]:
    presets = {
        "commerce": {
            "public": {
                "primary_color": "#be3f14",
                "accent_color": "#0f766e",
                "surface_color": "#fff8f1",
                "ink_color": "#102033",
                "muted_color": "#5a6776",
                "heading_font": "Fraunces",
                "body_font": "Space Grotesk",
                "radius_scale": "rounded",
                "density": "comfortable",
                "motion_profile": "lively",
            },
            "admin": {
                "primary_color": "#102033",
                "accent_color": "#be3f14",
                "surface_color": "#f7f8fb",
                "ink_color": "#102033",
                "muted_color": "#6a7481",
                "heading_font": "Space Grotesk",
                "body_font": "Space Grotesk",
                "radius_scale": "soft",
                "density": "compact",
                "motion_profile": "minimal",
            },
        },
        "travel": {
            "public": {
                "primary_color": "#0f766e",
                "accent_color": "#d97706",
                "surface_color": "#effcf8",
                "ink_color": "#0c1e28",
                "muted_color": "#56707e",
                "heading_font": "Fraunces",
                "body_font": "Space Grotesk",
                "radius_scale": "rounded",
                "density": "comfortable",
                "motion_profile": "calm",
            },
            "admin": {
                "primary_color": "#0c1e28",
                "accent_color": "#0f766e",
                "surface_color": "#f4fbfa",
                "ink_color": "#0c1e28",
                "muted_color": "#5d717e",
                "heading_font": "Space Grotesk",
                "body_font": "Space Grotesk",
                "radius_scale": "soft",
                "density": "compact",
                "motion_profile": "minimal",
            },
        },
        "hotel": {
            "public": {
                "primary_color": "#7c3e1d",
                "accent_color": "#215c4f",
                "surface_color": "#fbf5ee",
                "ink_color": "#20150f",
                "muted_color": "#6d625c",
                "heading_font": "Fraunces",
                "body_font": "Space Grotesk",
                "radius_scale": "soft",
                "density": "spacious",
                "motion_profile": "calm",
            },
            "admin": {
                "primary_color": "#20150f",
                "accent_color": "#7c3e1d",
                "surface_color": "#f8f4ef",
                "ink_color": "#20150f",
                "muted_color": "#746b64",
                "heading_font": "Space Grotesk",
                "body_font": "Space Grotesk",
                "radius_scale": "soft",
                "density": "comfortable",
                "motion_profile": "minimal",
            },
        },
    }
    preset = presets.get(vertical_pack, presets["commerce"])
    return preset["admin" if admin else "public"]


def _default_vocabulary(vertical_pack: str) -> dict[str, str]:
    vocabulary = {
        "customer": "Customer",
        "order": "Order",
        "booking": "Booking",
        "staff": "Staff",
        "location": "Location",
    }
    if vertical_pack == "hotel":
        vocabulary.update({"customer": "Guest", "booking": "Reservation", "location": "Property"})
    if vertical_pack == "travel":
        vocabulary.update({"booking": "Itinerary", "order": "Trip"})
    if vertical_pack == "commerce":
        vocabulary.update({"order": "Order", "location": "Storefront"})
    return vocabulary


def _default_routes(vertical_pack: str) -> list[dict[str, object]]:
    routes = [
        {"key": "home", "path": "/", "page_slug": "home", "visibility": "public"},
        {"key": "about", "path": "/about", "page_slug": "about", "visibility": "public"},
        {"key": "contact", "path": "/contact", "page_slug": "contact", "visibility": "public"},
    ]
    if vertical_pack == "commerce":
        routes.append({"key": "catalog", "path": "/catalog", "page_slug": "catalog", "visibility": "public"})
    if vertical_pack == "travel":
        routes.append({"key": "packages", "path": "/packages", "page_slug": "packages", "visibility": "public"})
    if vertical_pack == "hotel":
        routes.append({"key": "stay", "path": "/stay", "page_slug": "stay", "visibility": "public"})
    return routes


def _default_dashboard_widgets(vertical_pack: str) -> list[dict[str, object]]:
    widgets = [
        {
            "key": "traffic",
            "title": "Traffic Overview",
            "metric": "Sessions",
            "description": "Track demand, page reach, and conversion intent.",
        },
        {
            "key": "forms",
            "title": "Lead Capture",
            "metric": "Responses",
            "description": "Monitor inquiry and funnel health across forms.",
        },
    ]
    if vertical_pack == "commerce":
        widgets.append(
            {
                "key": "orders",
                "title": "Commerce Ops",
                "metric": "Orders",
                "description": "Observe order throughput and stock impact.",
            }
        )
    if vertical_pack == "travel":
        widgets.append(
            {
                "key": "departures",
                "title": "Trip Pipeline",
                "metric": "Departures",
                "description": "Track departures, quotes, and conversion flow.",
            }
        )
    if vertical_pack == "hotel":
        widgets.append(
            {
                "key": "occupancy",
                "title": "Property Ops",
                "metric": "Occupancy",
                "description": "Surface room status and reservation flow.",
            }
        )
    return widgets


def _default_blueprint(tenant, extra_metadata: dict[str, Any] | None = None) -> dict[str, object]:
    primary_vertical = tenant.vertical_packs or "commerce"
    public_theme = {"brand_name": tenant.display_name, **_theme_for_vertical(primary_vertical, admin=False)}
    admin_theme = {
        "brand_name": f"{tenant.display_name} Admin",
        **_theme_for_vertical(primary_vertical, admin=True),
    }

    public_navigation = [
        {"label": "Home", "href": "/", "kind": "link", "icon": "home"},
        {"label": "About", "href": "/about", "kind": "link", "icon": "spark"},
        {"label": "Contact", "href": "/contact", "kind": "cta", "icon": "mail"},
    ]
    if tenant.vertical_packs == "commerce":
        public_navigation.insert(1, {"label": "Catalog", "href": "/catalog", "kind": "link", "icon": "bag"})
    if tenant.vertical_packs == "travel":
        public_navigation.insert(1, {"label": "Packages", "href": "/packages", "kind": "link", "icon": "compass"})
    if tenant.vertical_packs == "hotel":
        public_navigation.insert(1, {"label": "Stay", "href": "/stay", "kind": "link", "icon": "key"})

    admin_navigation = [
        {"label": "Overview", "href": "/admin", "kind": "module", "icon": "dashboard"},
        {"label": "Publishing", "href": "/admin/publishing", "kind": "module", "icon": "paintbrush"},
        {"label": "Customers", "href": "/admin/customers", "kind": "module", "icon": "users"},
    ]
    if tenant.vertical_packs:
        admin_navigation.append(
            {
                "label": tenant.vertical_packs.replace("_", " ").title(),
                "href": f"/admin/{tenant.vertical_packs.replace('_', '-')}",
                "kind": "module",
                "icon": "stack",
            }
        )

    enabled_modules = [
        "publishing.pages",
        "publishing.discovery",
        "publishing.blueprints",
    ]
    if tenant.vertical_packs:
        enabled_modules.append(tenant.vertical_packs)

    return {
        "tenant_id": str(tenant.id),
        "tenant_slug": tenant.slug,
        "version": 1,
        "business_label": tenant.display_name,
        "vertical_packs": tenant.vertical_packs,
        "enabled_modules": enabled_modules,
        "public_theme": public_theme,
        "admin_theme": admin_theme,
        "public_navigation": public_navigation,
        "admin_navigation": admin_navigation,
        "routes": _default_routes(tenant.vertical_packs),
        "dashboard_widgets": _default_dashboard_widgets(tenant.vertical_packs),
        "vocabulary": _default_vocabulary(tenant.vertical_packs),
        "mobile_capabilities": ["push_notifications", "saved_searches", "booking_status"],
        **(extra_metadata or {}),
    }


def _default_page(tenant, blueprint: dict[str, object], page_slug: str) -> dict[str, object]:
    headline = f"{tenant.display_name} runs on a blueprint-driven digital stack."
    body = (
        "This public experience is composed from theme tokens, route rules, and reusable "
        "React blocks, so each business can look distinct without forking the platform."
    )
    items = [
        {
            "title": "Theme Tokens",
            "description": "Brand, typography, motion, and density rules shape the UI.",
        },
        {
            "title": "Page Schemas",
            "description": "Pages are assembled from composable blocks with SEO-aware metadata.",
        },
        {
            "title": "Common API",
            "description": "Frontend, admin, and future mobile apps share one backend contract.",
        },
    ]
    if page_slug == "catalog":
        headline = f"{tenant.display_name} storefront, without a separate codebase."
        body = "Catalog pages, offers, and interactions are driven by the commerce pack and the blueprint theme."
    elif page_slug == "packages":
        headline = f"{tenant.display_name} destination pages, designed for conversion."
        body = "Travel pages use the same blueprint model while binding to itinerary and departure data."
    elif page_slug == "stay":
        headline = f"{tenant.display_name} booking pages, styled for hospitality."
        body = "Property discovery and reservations can live on the same tenant-branded public runtime."
    elif page_slug == "about":
        headline = f"Why {tenant.display_name} can change design without changing architecture."
        body = "Business blueprints separate design, vocabulary, navigation, and workflow exposure from the platform core."
    elif page_slug == "contact":
        headline = f"Give {tenant.display_name} a channel for inquiries and onboarding."
        body = "Forms, lead capture, and CTA flows can be themed while still landing in one common backend."

    return {
        "tenant_slug": tenant.slug,
        "page_slug": page_slug,
        "route_path": "/" if page_slug == "home" else f"/{page_slug}",
        "title": f"{tenant.display_name} {page_slug.replace('-', ' ').title()}",
        "status": "live" if page_slug == "home" else "preview",
        "seo_title": f"{tenant.display_name} | {page_slug.replace('-', ' ').title()}",
        "seo_description": body,
        "layout": "catalog" if page_slug in {"catalog", "packages", "stay"} else "landing",
        "blocks": [
            {
                "id": "hero-main",
                "kind": "hero",
                "eyebrow": blueprint["business_label"],
                "headline": headline,
                "body": body,
                "cta_label": "Open Admin",
                "cta_href": "/admin",
                "items": [],
            },
            {
                "id": "feature-core",
                "kind": "feature_grid",
                "headline": "Flexibility without fragmentation",
                "body": "The same blueprint governs design, route exposure, and module access.",
                "items": items,
            },
            {
                "id": "stats-strip",
                "kind": "stat_strip",
                "headline": "Blueprint Signals",
                "items": [
                    {"title": "Vertical Pack", "value": tenant.vertical_packs or "None"},
                    {"title": "Routes", "value": str(len(blueprint["routes"]))},
                    {"title": "Widgets", "value": str(len(blueprint["dashboard_widgets"]))},
                ],
            },
            {
                "id": "cta-main",
                "kind": "cta",
                "headline": "Extend to web, admin, and mobile from the same rules.",
                "body": "The blueprint is the contract between design freedom and platform control.",
                "cta_label": "Plan Native App",
                "cta_href": "/mobile",
            },
        ],
    }


def _default_discovery(tenant, blueprint: dict[str, object]) -> dict[str, object]:
    cards = []
    for route in blueprint["routes"]:
        if route["visibility"] == "public":
            cards.append(
                {
                    "title": route["key"].replace("_", " ").title(),
                    "summary": f"Public route {route['path']} derived from the tenant blueprint.",
                    "href": route["path"],
                    "tags": [tenant.vertical_packs] if tenant.vertical_packs else [],
                }
            )
    return {
        "tenant_slug": tenant.slug,
        "headline": f"{tenant.display_name} is discoverable through a canonical public runtime.",
        "summary": "Discovery cards are materialized from runtime docs so Kalp controls SEO and public routing centrally.",
        "tags": [tenant.vertical_packs] if tenant.vertical_packs else [],
        "cards": cards,
    }


def _store_default_documents(store: RuntimeDocumentStore, tenant, blueprint: dict[str, object]) -> None:
    db_name = tenant.mongo_db_name
    store.upsert_document(
        collection=BLUEPRINT_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="blueprint",
        payload=blueprint,
        database_name=db_name
    )
    for route in blueprint["routes"]:
        page_slug = route["page_slug"]
        page = _default_page(tenant, blueprint, page_slug)
        store.upsert_document(
            collection=PAGE_COLLECTION,
            tenant_slug=tenant.slug,
            document_key=page_slug,
            payload=page,
            database_name=db_name
        )
    store.upsert_document(
        collection=DISCOVERY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="discovery",
        payload=_default_discovery(tenant, blueprint),
        database_name=db_name
    )


def bootstrap_tenant_runtime_documents(
    store: RuntimeDocumentStore, tenant, extra_metadata: dict[str, Any] | None = None
) -> dict[str, object]:
    db_name = tenant.mongo_db_name
    blueprint_document = store.get_document(
        collection=BLUEPRINT_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="blueprint",
        database_name=db_name
    )
    blueprint = (
        blueprint_document["payload"]
        if blueprint_document is not None
        else _default_blueprint(tenant, extra_metadata=extra_metadata)
    )
    seeded_documents: list[dict[str, str]] = []

    if blueprint_document is None:
        store.upsert_document(
            collection=BLUEPRINT_COLLECTION,
            tenant_slug=tenant.slug,
            document_key="blueprint",
            payload=blueprint,
            database_name=db_name
        )
        seeded_documents.append({"collection": BLUEPRINT_COLLECTION, "document_key": "blueprint"})

    for route in blueprint["routes"]:
        page_slug = route["page_slug"]
        existing_page = store.get_document(
            collection=PAGE_COLLECTION,
            tenant_slug=tenant.slug,
            document_key=page_slug,
            database_name=db_name
        )
        if existing_page is None:
            store.upsert_document(
                collection=PAGE_COLLECTION,
                tenant_slug=tenant.slug,
                document_key=page_slug,
                payload=_default_page(tenant, blueprint, page_slug),
                database_name=db_name
            )
            seeded_documents.append({"collection": PAGE_COLLECTION, "document_key": page_slug})

    existing_discovery = store.get_document(
        collection=DISCOVERY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="discovery",
        database_name=db_name
    )
    if existing_discovery is None:
        store.upsert_document(
            collection=DISCOVERY_COLLECTION,
            tenant_slug=tenant.slug,
            document_key="discovery",
            payload=_default_discovery(tenant, blueprint),
            database_name=db_name
        )
        seeded_documents.append({"collection": DISCOVERY_COLLECTION, "document_key": "discovery"})

    return {
        "seeded_documents": seeded_documents,
        "seeded_document_count": len(seeded_documents),
        "page_slugs": [route["page_slug"] for route in blueprint["routes"]],
    }


def summarize_tenant_runtime_documents(store: RuntimeDocumentStore, *, tenant_slug: str, database_name: str | None = None) -> dict[str, object]:
    seeded_documents: list[dict[str, str]] = []
    blueprint_document = store.get_document(
        collection=BLUEPRINT_COLLECTION,
        tenant_slug=tenant_slug,
        document_key="blueprint",
        database_name=database_name
    )
    
    if blueprint_document is not None:
        seeded_documents.append({"collection": BLUEPRINT_COLLECTION, "document_key": "blueprint"})

    page_documents = sorted(
        store.list_documents(collection=PAGE_COLLECTION, tenant_slug=tenant_slug, database_name=database_name),
        key=lambda item: str(item["document_key"]),
    )
    for document in page_documents:
        seeded_documents.append({"collection": PAGE_COLLECTION, "document_key": str(document["document_key"])})

    discovery_document = store.get_document(
        collection=DISCOVERY_COLLECTION,
        tenant_slug=tenant_slug,
        document_key="discovery",
        database_name=database_name
    )
    if discovery_document is not None:
        seeded_documents.append({"collection": DISCOVERY_COLLECTION, "document_key": "discovery"})

    return {
        "seeded_documents": seeded_documents,
        "seeded_document_count": len(seeded_documents),
        "page_slugs": [str(document["document_key"]) for document in page_documents],
    }


def _ensure_seeded(db: Session, store: RuntimeDocumentStore, tenant_slug: str):
    tenant = get_tenant_or_raise(db, tenant_slug=tenant_slug)
    db_name = tenant.mongo_db_name
    blueprint_doc = store.get_document(
        collection=BLUEPRINT_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="blueprint",
        database_name=db_name
    )
    if blueprint_doc is None:
        blueprint = _default_blueprint(tenant)
        _store_default_documents(store, tenant, blueprint)
        blueprint_doc = store.get_document(
            collection=BLUEPRINT_COLLECTION,
            tenant_slug=tenant.slug,
            document_key="blueprint",
            database_name=db_name
        )
    if blueprint_doc is None:
        raise RuntimeError("Runtime publishing documents were not initialized.")
    return tenant, blueprint_doc["payload"]


def _travel_package_items(db: Session, *, tenant_id: str) -> list[dict[str, object]]:
    packages, departures = _travel_runtime_snapshot(db, tenant_id=tenant_id)
    departures_by_package: dict[str, int] = {}
    for departure in departures:
        package_id = str(departure.get("package_id"))
        departures_by_package[package_id] = departures_by_package.get(package_id, 0) + 1

    items: list[dict[str, object]] = []
    for package in packages[:6]:
        items.append(
            {
                "title": str(package["title"]),
                "description": (
                    f"{package['destination_city']}, {package['destination_country']} · "
                    f"{package['duration_days']} days · {departures_by_package.get(str(package['id']), 0)} scheduled departures"
                ),
                "value": f"{package['currency']} {int(package['base_price_minor']):,}",
            }
        )
    return items


def _commerce_catalog_snapshot(
    db: Session, *, tenant_id: str
) -> tuple[list[dict[str, object]], dict[str, dict[str, object]], list[dict[str, object]]]:
    return _commerce_runtime_snapshot(db, tenant_id=tenant_id)


def _commerce_category_items(
    products: list[dict[str, object]], category_lookup: dict[str, dict[str, object]]
) -> list[dict[str, object]]:
    counts_by_category: dict[str, int] = {}
    for product in products:
        for category_id in product.get("category_ids", []):
            normalized_category_id = str(category_id)
            counts_by_category[normalized_category_id] = counts_by_category.get(normalized_category_id, 0) + 1

    items: list[dict[str, object]] = []
    for category_id, count in sorted(counts_by_category.items(), key=lambda item: (-item[1], item[0]))[:6]:
        category = category_lookup.get(category_id)
        if category is None:
            continue
        items.append(
            {
                "title": str(category["name"]),
                "description": str(category.get("description") or "Commerce catalog category"),
                "value": f"{count} active products",
                "href": "/catalog",
            }
        )
    return items


def _commerce_product_items(
    products: list[dict[str, object]],
    variants: list[dict[str, object]],
    category_lookup: dict[str, dict[str, object]],
) -> list[dict[str, object]]:
    variants_by_product: dict[str, list[dict[str, object]]] = {}
    for variant in variants:
        variants_by_product.setdefault(str(variant["product_id"]), []).append(variant)

    items: list[dict[str, object]] = []
    for product in products[:8]:
        product_variants = variants_by_product.get(str(product["id"]), [])
        if product_variants:
            min_price = min(int(variant["price_minor"]) for variant in product_variants)
            max_price = max(int(variant["price_minor"]) for variant in product_variants)
            currency = str(product_variants[0]["currency"])
            if min_price == max_price:
                price_label = _format_minor_currency(min_price, currency)
            else:
                price_label = f"{_format_minor_currency(min_price, currency)} to {_format_minor_currency(max_price, currency)}"
        else:
            price_label = "Price on request"

        category_names = [
            str(category_lookup[str(category_id)]["name"])
            for category_id in product.get("category_ids", [])
            if str(category_id) in category_lookup
        ]
        items.append(
            {
                "title": str(product["name"]),
                "description": (
                    str(product.get("description") or "")
                    or ", ".join(category_names)
                    or "Live product synchronized from the commerce catalog."
                ),
                "value": price_label,
                "href": f"/catalog/{product['slug']}",
            }
        )
    return items


def _commerce_dynamic_page(
    db: Session,
    *,
    tenant,
    blueprint: dict[str, object],
    page_slug: str,
    base_page: dict[str, object],
) -> dict[str, object] | None:
    products, category_lookup, variants = _commerce_catalog_snapshot(db, tenant_id=tenant.id)

    if page_slug == "catalog":
        category_items = _commerce_category_items(products, category_lookup)
        product_items = _commerce_product_items(products, variants, category_lookup)
        dynamic_blocks: list[dict[str, object]] = []
        if category_items:
            dynamic_blocks.append(
                {
                    "id": "commerce-live-categories",
                    "kind": "feature_grid",
                    "eyebrow": "Catalog taxonomy",
                    "headline": "Shop by category",
                    "body": "These category summaries are materialized from the canonical commerce catalog.",
                    "items": category_items,
                }
            )
        if product_items:
            dynamic_blocks.append(
                {
                    "id": "commerce-live-products",
                    "kind": "feature_grid",
                    "eyebrow": "Live catalog",
                    "headline": "Products from the commerce runtime",
                    "body": "The storefront is fed from the shared commerce pack, not hardcoded page content.",
                    "items": product_items,
                }
            )
        if not dynamic_blocks:
            return None
        return {**base_page, "blocks": [*base_page["blocks"], *dynamic_blocks]}

    if not page_slug.startswith("catalog/"):
        return None

    product_slug = page_slug.split("/", 1)[1].strip().lower()
    if not product_slug:
        return None
    runtime_db = _tenant_runtime_database(db, tenant_id=str(tenant.id))
    product = _normalize_runtime_document(
        runtime_db["commerce_products"].find_one({"slug": product_slug, "status": "active"})
    )
    if product is None:
        return None
    product_variants = [item for item in variants if item["product_id"] == product["id"]]
    category_names = [
        str(category_lookup[str(category_id)]["name"])
        for category_id in product.get("category_ids", [])
        if str(category_id) in category_lookup
    ]
    primary_currency = str(product_variants[0]["currency"]) if product_variants else "INR"
    if product_variants:
        min_price = min(int(item["price_minor"]) for item in product_variants)
        max_price = max(int(item["price_minor"]) for item in product_variants)
        if min_price == max_price:
            price_label = _format_minor_currency(min_price, primary_currency)
        else:
            price_label = f"{_format_minor_currency(min_price, primary_currency)} to {_format_minor_currency(max_price, primary_currency)}"
    else:
        price_label = "Price on request"

    variant_items = [
        {
            "title": str(variant["label"]),
            "description": f"SKU {variant['sku']}",
            "value": _format_minor_currency(int(variant["price_minor"]), str(variant["currency"])),
        }
        for variant in product_variants[:6]
    ]
    detail_page = {
        "id": f"{tenant.slug}:{page_slug}",
        "tenant_slug": tenant.slug,
        "page_slug": page_slug,
        "route_path": f"/{page_slug}",
        "title": str(product["name"]),
        "status": "live",
        "seo_title": str(product.get("seo_title") or product["name"]),
        "seo_description": str(
            product.get("seo_description") or product.get("description") or f"{product['name']} on {tenant.display_name}"
        ),
        "layout": "catalog",
        "blocks": [
            {
                "id": "commerce-product-hero",
                "kind": "hero",
                "eyebrow": category_names[0] if category_names else blueprint["business_label"],
                "headline": str(product["name"]),
                "body": str(product.get("description") or "Product detail materialized from the commerce runtime."),
                "cta_label": "Back to Catalog",
                "cta_href": "/catalog",
                "items": [],
            },
            {
                "id": "commerce-product-stats",
                "kind": "stat_strip",
                "headline": "Product Snapshot",
                "items": [
                    {"title": "Price", "value": price_label},
                    {"title": "Variants", "value": str(len(product_variants) or 1)},
                    {"title": "Categories", "value": str(len(category_names) or 1)},
                ],
            },
            {
                "id": "commerce-product-variants",
                "kind": "feature_grid",
                "headline": "Available variants",
                "body": "Variant pricing and SKU structure are served from the commerce pack.",
                "items": variant_items
                or [
                    {
                        "title": "Catalog item",
                        "description": "This product does not currently expose multiple variants.",
                        "value": price_label,
                    }
                ],
            },
        ],
    }
    return detail_page


def _commerce_discovery_cards(db: Session, *, tenant_id: str) -> list[dict[str, object]]:
    products, category_lookup, variants = _commerce_catalog_snapshot(db, tenant_id=tenant_id)
    product_items = _commerce_product_items(products, variants, category_lookup)
    return [
        {
            "title": item["title"],
            "summary": f"{item.get('value', '')} · {item.get('description', '')}".strip(" ·"),
            "href": str(item["href"]),
            "tags": ["commerce", "catalog"],
        }
        for item in product_items[:6]
    ]


def _travel_dynamic_blocks(db: Session, *, tenant_id: str, page_slug: str) -> list[dict[str, object]]:
    if page_slug != "packages":
        return []

    package_items = _travel_package_items(db, tenant_id=tenant_id)
    if not package_items:
        return []

    return [
        {
            "id": "travel-live-packages",
            "kind": "feature_grid",
            "eyebrow": "Live inventory",
            "headline": "Packages from the canonical travel runtime",
            "body": "These package summaries are materialized from the transactional travel pack, not hardcoded page content.",
            "cta_label": None,
            "cta_href": None,
            "items": package_items,
        }
    ]


def _travel_discovery_cards(db: Session, *, tenant_id: str) -> list[dict[str, object]]:
    cards: list[dict[str, object]] = []
    packages, _ = _travel_runtime_snapshot(db, tenant_id=tenant_id)
    for package in packages[:6]:
        cards.append(
            {
                "title": str(package["title"]),
                "summary": (
                    f"{package['destination_city']}, {package['destination_country']} · "
                    f"{package['duration_days']} days from {package['currency']} {int(package['base_price_minor']):,}"
                ),
                "href": "/packages",
                "tags": ["travel", str(package["destination_city"]).lower().replace(" ", "-")],
            }
        )
    return cards


def _hotel_dynamic_blocks(
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    page_slug: str,
    database_name: str | None = None,
) -> list[dict[str, object]]:
    if page_slug != "stay":
        return []

    profiles = [item["payload"] for item in store.list_documents(collection=HOTEL_PROFILE_COLLECTION, tenant_slug=tenant_slug, database_name=database_name)]
    amenity_catalogs = {
        item["payload"]["property_id"]: item["payload"]
        for item in store.list_documents(collection=HOTEL_AMENITY_COLLECTION, tenant_slug=tenant_slug, database_name=database_name)
    }
    nearby_catalogs = {
        item["payload"]["property_id"]: item["payload"]
        for item in store.list_documents(collection=HOTEL_NEARBY_COLLECTION, tenant_slug=tenant_slug, database_name=database_name)
    }
    if not profiles:
        return []

    primary_profile = profiles[0]
    amenity_catalog = amenity_catalogs.get(primary_profile["property_id"], {"categories": []})
    nearby_catalog = nearby_catalogs.get(primary_profile["property_id"], {"places": []})

    amenity_items = []
    for category in amenity_catalog.get("categories", [])[:4]:
        amenity_items.append(
            {
                "title": category["label"],
                "description": ", ".join(item["label"] for item in category.get("amenities", [])[:4]) or "Configured in the hotel catalog.",
            }
        )

    nearby_items = [
        {
            "title": place["name"],
            "description": f"{place['kind']} · {place['distance_km']} km · {place['travel_minutes']} mins",
        }
        for place in nearby_catalog.get("places", [])[:4]
    ]

    blocks = [
        {
            "id": "hotel-profile",
            "kind": "rich_text",
            "headline": primary_profile.get("hero_title") or primary_profile["brand_name"],
            "body": primary_profile.get("description") or primary_profile.get("hero_summary") or "",
            "items": [],
        }
    ]
    if amenity_items:
        blocks.append(
            {
                "id": "hotel-amenities",
                "kind": "feature_grid",
                "headline": "Amenities",
                "body": "Amenity presentation is materialized from the hotel content catalog.",
                "items": amenity_items,
            }
        )
    if nearby_items:
        blocks.append(
            {
                "id": "hotel-nearby",
                "kind": "feature_grid",
                "headline": "Nearby",
                "body": "Help guests understand the local context before they book.",
                "items": nearby_items,
            }
        )
    return blocks


def _hotel_discovery_cards(
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    database_name: str | None = None,
) -> list[dict[str, object]]:
    profiles = [item["payload"] for item in store.list_documents(collection=HOTEL_PROFILE_COLLECTION, tenant_slug=tenant_slug, database_name=database_name)]
    nearby_catalogs = {
        item["payload"]["property_id"]: item["payload"]
        for item in store.list_documents(collection=HOTEL_NEARBY_COLLECTION, tenant_slug=tenant_slug, database_name=database_name)
    }
    cards: list[dict[str, object]] = []
    for profile in profiles[:6]:
        nearby_count = len(nearby_catalogs.get(profile["property_id"], {}).get("places", []))
        cards.append(
            {
                "title": profile.get("brand_name", "Property"),
                "summary": (
                    f"{profile.get('city', '')}, {profile.get('country', '')} · "
                    f"{profile.get('star_rating') or 'Boutique'} star · {nearby_count} nearby highlights"
                ),
                "href": "/stay",
                "tags": ["hotel", "stay"],
            }
        )
    return cards


def get_blueprint(db: Session, store: RuntimeDocumentStore, *, tenant_slug: str) -> dict[str, object]:
    tenant, blueprint = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    return blueprint


def update_blueprint(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    actor_user_id: str,
    payload: dict[str, object],
) -> dict[str, object]:
    tenant, blueprint = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    next_payload = {
        **blueprint,
        **payload,
        "tenant_id": str(tenant.id),
        "tenant_slug": tenant.slug,
        "version": int(blueprint["version"]) + 1,
        "updated_at": datetime.now(tz=UTC).isoformat(),
    }
    store.upsert_document(
        collection=BLUEPRINT_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="blueprint",
        payload=next_payload,
        database_name=db_name
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="publishing.blueprint.updated",
        subject_type="business_blueprint",
        subject_id=tenant.slug,
        metadata_json={"version": next_payload["version"]},
    )
    db.commit()
    return next_payload


def list_pages(db: Session, store: RuntimeDocumentStore, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant, _ = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    documents = store.list_documents(collection=PAGE_COLLECTION, tenant_slug=tenant.slug, database_name=db_name)
    return [document["payload"] for document in sorted(documents, key=lambda item: str(item["document_key"]))]


def get_page(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    page_slug: str,
) -> dict[str, object]:
    tenant, blueprint = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    document = store.get_document(collection=PAGE_COLLECTION, tenant_slug=tenant.slug, document_key=page_slug, database_name=db_name)
    if document is None:
        page = _default_page(tenant, blueprint, page_slug)
        if "/" not in page_slug:
            store.upsert_document(
                collection=PAGE_COLLECTION,
                tenant_slug=tenant.slug,
                document_key=page_slug,
                payload=page,
                database_name=db_name
            )
        return page
    return document["payload"]


def upsert_page(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    actor_user_id: str,
    page_slug: str,
    payload: dict[str, object],
) -> dict[str, object]:
    tenant, _ = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    page_payload = {
        "tenant_slug": tenant.slug,
        "page_slug": page_slug,
        "id": f"{tenant.slug}:{page_slug}",
        **payload,
        "updated_at": datetime.now(tz=UTC).isoformat(),
    }
    store.upsert_document(
        collection=PAGE_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=page_slug,
        payload=page_payload,
        database_name=db_name
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="publishing.page.upserted",
        subject_type="published_page",
        subject_id=page_slug,
        metadata_json={"status": page_payload["status"], "route_path": page_payload["route_path"]},
    )
    if page_payload["status"] == "live":
        platform_repository.enqueue_outbox_event(
            db,
            tenant_id=str(tenant.id),
            aggregate_id=page_slug,
            event_name="publishing.content.published",
            payload_json={"page_slug": page_slug, "route_path": page_payload["route_path"]},
        )
    db.commit()
    return page_payload


def get_discovery(db: Session, store: RuntimeDocumentStore, *, tenant_slug: str) -> dict[str, object]:
    tenant, blueprint = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    document = store.get_document(
        collection=DISCOVERY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="discovery",
        database_name=db_name
    )
    if document is None:
        payload = _default_discovery(tenant, blueprint)
        store.upsert_document(
            collection=DISCOVERY_COLLECTION,
            tenant_slug=tenant.slug,
            document_key="discovery",
            payload=payload,
            database_name=db_name
        )
        return payload
    return document["payload"]


def upsert_discovery(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    actor_user_id: str,
    payload: dict[str, object],
) -> dict[str, object]:
    tenant, _ = _ensure_seeded(db, store, tenant_slug)
    db_name = tenant.mongo_db_name
    discovery_payload = {
        "tenant_slug": tenant.slug,
        **payload,
        "updated_at": datetime.now(tz=UTC).isoformat(),
    }
    store.upsert_document(
        collection=DISCOVERY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key="discovery",
        payload=discovery_payload,
        database_name=db_name
    )
    platform_repository.create_audit_event(
        db,
        tenant_id=str(tenant.id),
        actor_user_id=actor_user_id,
        action="publishing.discovery.updated",
        subject_type="discovery_document",
        subject_id=tenant.slug,
        metadata_json={"card_count": len(discovery_payload["cards"])},
    )
    db.commit()
    return discovery_payload


def get_public_site_payload(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    page_slug: str,
) -> dict[str, object]:
    tenant = get_tenant_or_raise(db, tenant_slug=tenant_slug)
    blueprint = get_blueprint(db, store, tenant_slug=tenant_slug)
    page = get_page(db, store, tenant_slug=tenant_slug, page_slug=page_slug)
    discovery = get_discovery(db, store, tenant_slug=tenant_slug)

    resolved_page = page
    resolved_discovery = discovery

    if "travel" in tenant.vertical_packs:
        dynamic_blocks = _travel_dynamic_blocks(db, tenant_id=str(tenant.id), page_slug=page_slug)
        if dynamic_blocks:
            resolved_page = {**page, "blocks": [*page["blocks"], *dynamic_blocks]}

        dynamic_cards = _travel_discovery_cards(db, tenant_id=str(tenant.id))
        if dynamic_cards:
            resolved_discovery = {**discovery, "cards": [*discovery["cards"], *dynamic_cards]}

    if "commerce" in tenant.vertical_packs:
        commerce_page = _commerce_dynamic_page(
            db,
            tenant=tenant,
            blueprint=blueprint,
            page_slug=page_slug,
            base_page=resolved_page,
        )
        if commerce_page is not None:
            resolved_page = commerce_page

        commerce_cards = _commerce_discovery_cards(db, tenant_id=str(tenant.id))
        if commerce_cards:
            resolved_discovery = {**resolved_discovery, "cards": [*resolved_discovery["cards"], *commerce_cards]}

    if "hotel" in tenant.vertical_packs:
        hotel_blocks = _hotel_dynamic_blocks(store, tenant_slug=tenant_slug, page_slug=page_slug, database_name=tenant.mongo_db_name)
        if hotel_blocks:
            resolved_page = {**resolved_page, "blocks": [*resolved_page["blocks"], *hotel_blocks]}

        hotel_cards = _hotel_discovery_cards(store, tenant_slug=tenant_slug, database_name=tenant.mongo_db_name)
        if hotel_cards:
            resolved_discovery = {**resolved_discovery, "cards": [*resolved_discovery["cards"], *hotel_cards]}

    return {
        "tenant_slug": tenant_slug,
        "business_label": blueprint["business_label"],
        "public_theme": blueprint["public_theme"],
        "public_navigation": blueprint["public_navigation"],
        "vocabulary": blueprint["vocabulary"],
        "page": resolved_page,
        "discovery": resolved_discovery,
    }


def get_publishing_overview(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
) -> dict[str, object]:
    tenant, blueprint = _ensure_seeded(db, store, tenant_slug)
    pages = list_pages(db, store, tenant_slug=tenant_slug)
    live_pages = [page for page in pages if page["status"] == "live"]
    preview_pages = [page for page in pages if page["status"] == "preview"]
    discovery = get_discovery(db, store, tenant_slug=tenant_slug)
    return {
        "tenant_id": tenant.slug,
        "tenant_record_id": str(tenant.id),
        "blueprint_version": blueprint["version"],
        "routes": len(blueprint["routes"]),
        "public_navigation_items": len(blueprint["public_navigation"]),
        "admin_navigation_items": len(blueprint["admin_navigation"]),
        "live_pages": len(live_pages),
        "preview_pages": len(preview_pages),
        "discovery_cards": len(discovery["cards"]),
        "seo_indexing_state": "ready" if live_pages else "draft_only",
    }
