from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session
from beanie.operators import In

from app.core.config import get_settings
from app.db.mongo import get_runtime_motor_database
from app.models.commerce import (
    CommerceCategory,
    CommerceBrand,
    CommerceVendor,
    CommerceCollection,
    CommerceAttribute,
    CommerceAttributeSet,
    CommerceProduct,
    CommerceVariant,
    CommerceWarehouse,
    CommerceWarehouseStock,
    CommerceProductAttributeValue,
    CommerceVariantAttributeValue,
    CommerceStockLedgerEntry,
    CommerceTaxProfile,
    CommercePriceList,
    CommercePriceListItem,
    CommerceCoupon,
    CommerceOrder,
    CommerceOrderLine,
    CommerceFulfillment,
    CommerceFulfillmentLine,
    CommerceShipment,
    CommercePayment,
    CommerceRefund,
    CommerceInvoice,
    CommerceReturn,
    CommerceReturnLine,
    CommerceSettlement,
    CommerceSettlementEntry,
)

def _get_tenant_database_id(db: Session, tenant_id: str) -> str:
    """
    Resolves the MongoDB database identifier (slug or custom name) from PostgreSQL.
    """
    from app.db.models import TenantModel
    query = select(TenantModel.slug, TenantModel.mongo_db_name).where(TenantModel.id == tenant_id)
    result = db.execute(query).first()
    if not result:
        raise ValueError(f"Tenant with ID {tenant_id} not found")
    
    slug, mongo_db_name = result
    return mongo_db_name or slug

def _now_iso() -> str:
    return datetime.now(tz=UTC).isoformat()

async def list_categories(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=slug)
    categories = await CommerceCategory.find(CommerceCategory.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [c.model_dump() for c in categories]

async def get_category(db_name: str, category_id: str) -> dict[str, Any] | None:

    mongo_db = get_runtime_motor_database(get_settings(), database_name=db_name)
    category = await CommerceCategory.find_one(
        CommerceCategory.id == category_id
    )
    return category.model_dump() if category else None

async def find_category_by_slug(db_name: str, slug: str) -> dict[str, Any] | None:

    mongo_db = get_runtime_motor_database(get_settings(), database_name=db_name)
    category = await CommerceCategory.find_one(
        CommerceCategory.slug == slug
    )
    return category.model_dump() if category else None

async def create_category(
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    parent_category_id: str | None,
    db_name: str,
) -> dict[str, Any]:

    mongo_db = get_runtime_motor_database(get_settings(), database_name=db_name)
    category = CommerceCategory(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        parent_category_id=parent_category_id,
    )
    await category.insert(link_rule=None, session=None)
    return category.model_dump()

async def list_brands(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    brands = await CommerceBrand.find(CommerceBrand.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [b.model_dump() for b in brands]

async def get_brand(db: Session, *, tenant_id: str, brand_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    brand = await CommerceBrand.find_one(
        CommerceBrand.tenant_id == tenant_id, 
        CommerceBrand.id == brand_id
    ).set_database(mongo_db)
    return brand.model_dump() if brand else None

async def find_brand_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    brand = await CommerceBrand.find_one(
        CommerceBrand.tenant_id == tenant_id, 
        CommerceBrand.slug == slug
    ).set_database(mongo_db)
    return brand.model_dump() if brand else None

async def find_brand_by_code(db: Session, *, tenant_id: str, code: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    brand = await CommerceBrand.find_one(
        CommerceBrand.tenant_id == tenant_id, 
        CommerceBrand.code == code
    ).set_database(mongo_db)
    return brand.model_dump() if brand else None

async def create_brand(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    brand = CommerceBrand(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        code=code,
        description=description,
        status=status,
    )
    await brand.insert().set_database(mongo_db)
    return brand.model_dump()

async def list_vendors(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    vendors = await CommerceVendor.find(CommerceVendor.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [v.model_dump() for v in vendors]

async def get_vendor(db: Session, *, tenant_id: str, vendor_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    vendor = await CommerceVendor.find_one(
        CommerceVendor.tenant_id == tenant_id, 
        CommerceVendor.id == vendor_id
    ).set_database(mongo_db)
    return vendor.model_dump() if vendor else None

async def find_vendor_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    vendor = await CommerceVendor.find_one(
        CommerceVendor.tenant_id == tenant_id, 
        CommerceVendor.slug == slug
    ).set_database(mongo_db)
    return vendor.model_dump() if vendor else None

async def find_vendor_by_code(db: Session, *, tenant_id: str, code: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    vendor = await CommerceVendor.find_one(
        CommerceVendor.tenant_id == tenant_id, 
        CommerceVendor.code == code
    ).set_database(mongo_db)
    return vendor.model_dump() if vendor else None

async def create_vendor(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    contact_name: str | None,
    contact_email: str | None,
    contact_phone: str | None,
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    vendor = CommerceVendor(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        code=code,
        description=description,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        status=status,
    )
    await vendor.insert().set_database(mongo_db)
    return vendor.model_dump()

async def list_collections(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    collections = await CommerceCollection.find(CommerceCollection.tenant_id == tenant_id).sort("sort_order", "-created_at").set_database(mongo_db).to_list()
    return [c.model_dump() for c in collections]

async def list_collections_by_ids(db: Session, *, tenant_id: str, collection_ids: list[str]) -> list[dict[str, Any]]:
    if not collection_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    collections = await CommerceCollection.find(
        CommerceCollection.tenant_id == tenant_id,
        In(CommerceCollection.id, collection_ids)
    ).set_database(mongo_db).to_list()
    return [c.model_dump() for c in collections]

async def get_collection(db: Session, *, tenant_id: str, collection_id: str) -> dict[str, Any] | None:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    collection = await CommerceCollection.find_one(
        CommerceCollection.tenant_id == tenant_id, 
        CommerceCollection.id == collection_id
    ).set_database(mongo_db)
    return collection.model_dump() if collection else None

async def find_collection_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    collection = await CommerceCollection.find_one(
        CommerceCollection.tenant_id == tenant_id, 
        CommerceCollection.slug == slug
    ).set_database(mongo_db)
    return collection.model_dump() if collection else None

async def create_collection(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    status: str,
    sort_order: int,
) -> dict[str, Any]:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    collection = CommerceCollection(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        status=status,
        sort_order=sort_order,
    )
    await collection.insert().set_database(mongo_db)
    return collection.model_dump()

async def list_tax_profiles(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    profiles = await CommerceTaxProfile.find(CommerceTaxProfile.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [p.model_dump() for p in profiles]

async def get_tax_profile(db: Session, *, tenant_id: str, tax_profile_id: str) -> dict[str, Any] | None:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    profile = await CommerceTaxProfile.find_one(
        CommerceTaxProfile.tenant_id == tenant_id, 
        CommerceTaxProfile.id == tax_profile_id
    ).set_database(mongo_db)
    return profile.model_dump() if profile else None

async def find_tax_profile_by_code(db: Session, *, tenant_id: str, code: str) -> dict[str, Any] | None:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    profile = await CommerceTaxProfile.find_one(
        CommerceTaxProfile.tenant_id == tenant_id, 
        CommerceTaxProfile.code == code
    ).set_database(mongo_db)
    return profile.model_dump() if profile else None

async def create_tax_profile(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    code: str,
    description: str | None,
    prices_include_tax: bool,
    rules_json: list[dict[str, object]],
    status: str,
) -> dict[str, Any]:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    profile = CommerceTaxProfile(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        code=code,
        description=description,
        prices_include_tax=prices_include_tax,
        rules=rules_json,
        status=status,
    )
    await profile.insert().set_database(mongo_db)
    return profile.model_dump()

async def list_price_lists(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    price_lists = await CommercePriceList.find(CommercePriceList.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [p.model_dump() for p in price_lists]

async def get_price_list(db: Session, *, tenant_id: str, price_list_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    price_list = await CommercePriceList.find_one(
        CommercePriceList.tenant_id == tenant_id, 
        CommercePriceList.id == price_list_id
    ).set_database(mongo_db)
    return price_list.model_dump() if price_list else None

async def find_price_list_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    price_list = await CommercePriceList.find_one(
        CommercePriceList.tenant_id == tenant_id, 
        CommercePriceList.slug == slug
    ).set_database(mongo_db)
    return price_list.model_dump() if price_list else None

async def create_price_list(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    currency: str,
    customer_segment: str | None,
    description: str | None,
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    price_list = CommercePriceList(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        currency=currency,
        customer_segment=customer_segment,
        description=description,
        status=status,
    )
    await price_list.insert().set_database(mongo_db)
    return price_list.model_dump()

async def list_price_list_items(db: Session, *, tenant_id: str, price_list_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    items = await CommercePriceListItem.find(
        CommercePriceListItem.tenant_id == tenant_id, 
        CommercePriceListItem.price_list_id == price_list_id
    ).sort("created_at").set_database(mongo_db).to_list()
    return [i.model_dump() for i in items]

async def list_price_list_items_for_variants(
    db: Session,
    *,
    tenant_id: str,
    price_list_id: str,
    variant_ids: list[str],
) -> list[dict[str, Any]]:
    if not variant_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    items = await CommercePriceListItem.find(
        CommercePriceListItem.tenant_id == tenant_id,
        CommercePriceListItem.price_list_id == price_list_id,
        In(CommercePriceListItem.variant_id, variant_ids)
    ).set_database(mongo_db).to_list()
    return [i.model_dump() for i in items]

async def create_price_list_item(
    db: Session,
    *,
    tenant_id: str,
    price_list_id: str,
    variant_id: str,
    price_minor: int,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    item = CommercePriceListItem(
        id=str(uuid4()),
        tenant_id=tenant_id,
        price_list_id=price_list_id,
        variant_id=variant_id,
        price_minor=price_minor,
    )
    await item.insert().set_database(mongo_db)
    return item.model_dump()

async def list_coupons(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    coupons = await CommerceCoupon.find(CommerceCoupon.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [c.model_dump() for c in coupons]

async def find_coupon_by_code(db: Session, *, tenant_id: str, code: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    coupon = await CommerceCoupon.find_one(
        CommerceCoupon.tenant_id == tenant_id, 
        CommerceCoupon.code == code
    ).set_database(mongo_db)
    return coupon.model_dump() if coupon else None

async def create_coupon(
    db: Session,
    *,
    tenant_id: str,
    code: str,
    description: str | None,
    discount_type: str,
    discount_value: int,
    minimum_subtotal_minor: int,
    maximum_discount_minor: int | None,
    applicable_category_ids: list[str],
    applicable_variant_ids: list[str],
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    coupon = CommerceCoupon(
        id=str(uuid4()),
        tenant_id=tenant_id,
        code=code,
        description=description,
        discount_type=discount_type,
        discount_value=discount_value,
        minimum_subtotal_minor=minimum_subtotal_minor,
        maximum_discount_minor=maximum_discount_minor,
        applicable_category_ids=applicable_category_ids,
        applicable_variant_ids=applicable_variant_ids,
        status=status,
    )
    await coupon.insert().set_database(mongo_db)
    return coupon.model_dump()
    #     tenant_id=tenant_id,
    #     code=code,
    #     description=description,
    #     discount_type=discount_type,
    #     discount_value=discount_value,
    #     minimum_subtotal_minor=minimum_subtotal_minor,
    #     maximum_discount_minor=maximum_discount_minor,
    #     applicable_category_ids=applicable_category_ids,
    #     applicable_variant_ids=applicable_variant_ids,
    #     status=status,
    # )
    # db.add(model)
    # db.flush()
    # return model

async def list_attributes(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attributes = await CommerceAttribute.find(CommerceAttribute.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [a.model_dump() for a in attributes]

async def list_attributes_by_ids(db: Session, *, tenant_id: str, attribute_ids: list[str]) -> list[dict[str, Any]]:
    if not attribute_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attributes = await CommerceAttribute.find(
        CommerceAttribute.tenant_id == tenant_id, 
        In(CommerceAttribute.id, attribute_ids)
    ).set_database(mongo_db).to_list()
    return [a.model_dump() for a in attributes]

async def get_attribute(db: Session, *, tenant_id: str, attribute_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attribute = await CommerceAttribute.find_one(
        CommerceAttribute.tenant_id == tenant_id, 
        CommerceAttribute.id == attribute_id
    ).set_database(mongo_db)
    return attribute.model_dump() if attribute else None

async def find_attribute_by_code(db: Session, *, tenant_id: str, code: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attribute = await CommerceAttribute.find_one(
        CommerceAttribute.tenant_id == tenant_id, 
        CommerceAttribute.code == code
    ).set_database(mongo_db)
    return attribute.model_dump() if attribute else None

async def find_attribute_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attribute = await CommerceAttribute.find_one(
        CommerceAttribute.tenant_id == tenant_id, 
        CommerceAttribute.slug == slug
    ).set_database(mongo_db)
    return attribute.model_dump() if attribute else None

async def create_attribute(
    db: Session,
    *,
    tenant_id: str,
    code: str,
    slug: str,
    label: str,
    description: str | None,
    value_type: str,
    scope: str,
    options_json: list[dict[str, object]],
    unit_label: str | None,
    is_required: bool,
    is_filterable: bool,
    is_variation_axis: bool,
    vertical_bindings: list[str],
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attribute = CommerceAttribute(
        id=str(uuid4()),
        tenant_id=tenant_id,
        code=code,
        slug=slug,
        label=label,
        description=description,
        value_type=value_type,
        scope=scope,
        options=options_json,
        unit_label=unit_label,
        is_required=is_required,
        is_filterable=is_filterable,
        is_variation_axis=is_variation_axis,
        vertical_bindings=vertical_bindings,
        status=status,
    )
    await attribute.insert().set_database(mongo_db)
    return attribute.model_dump()

async def list_attribute_sets(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    sets = await CommerceAttributeSet.find(CommerceAttributeSet.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [s.model_dump() for s in sets]

async def get_attribute_set(db: Session, *, tenant_id: str, attribute_set_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attr_set = await CommerceAttributeSet.find_one(
        CommerceAttributeSet.tenant_id == tenant_id, 
        CommerceAttributeSet.id == attribute_set_id
    ).set_database(mongo_db)
    return attr_set.model_dump() if attr_set else None

async def find_attribute_set_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attr_set = await CommerceAttributeSet.find_one(
        CommerceAttributeSet.tenant_id == tenant_id, 
        CommerceAttributeSet.slug == slug
    ).set_database(mongo_db)
    return attr_set.model_dump() if attr_set else None

async def create_attribute_set(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    attribute_ids: list[str],
    vertical_bindings: list[str],
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    attr_set = CommerceAttributeSet(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        attribute_ids=attribute_ids,
        vertical_bindings=vertical_bindings,
        status=status,
    )
    await attr_set.insert().set_database(mongo_db)
    return attr_set.model_dump()

async def list_products(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    products = await CommerceProduct.find(CommerceProduct.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [p.model_dump() for p in products]

async def get_product(db: Session, *, tenant_id: str, product_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    product = await CommerceProduct.find_one(
        CommerceProduct.tenant_id == tenant_id, 
        CommerceProduct.id == product_id
    ).set_database(mongo_db)
    return product.model_dump() if product else None

async def find_product_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    product = await CommerceProduct.find_one(
        CommerceProduct.tenant_id == tenant_id, 
        CommerceProduct.slug == slug
    ).set_database(mongo_db)
    return product.model_dump() if product else None

async def create_product(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    brand_id: str | None,
    vendor_id: str | None,
    collection_ids: list[str],
    attribute_set_id: str | None,
    category_ids: list[str],
    seo_title: str | None,
    seo_description: str | None,
    status: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    product = CommerceProduct(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        brand_id=brand_id,
        vendor_id=vendor_id,
        collection_ids=collection_ids,
        attribute_set_id=attribute_set_id,
        category_ids=category_ids,
        seo_title=seo_title,
        seo_description=seo_description,
        status=status,
    )
    await product.insert().set_database(mongo_db)
    return product.model_dump()

async def list_variants(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    variants = await CommerceVariant.find(CommerceVariant.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [v.model_dump() for v in variants]

async def list_variants_for_products(db: Session, *, tenant_id: str, product_ids: list[str]) -> list[dict[str, Any]]:
    if not product_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    variants = await CommerceVariant.find(
        CommerceVariant.tenant_id == tenant_id, 
        In(CommerceVariant.product_id, product_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [v.model_dump() for v in variants]

async def get_variant(db: Session, *, tenant_id: str, variant_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    variant = await CommerceVariant.find_one(
        CommerceVariant.tenant_id == tenant_id, 
        CommerceVariant.id == variant_id
    ).set_database(mongo_db)
    return variant.model_dump() if variant else None

async def find_variant_by_sku(db: Session, *, tenant_id: str, sku: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    variant = await CommerceVariant.find_one(
        CommerceVariant.tenant_id == tenant_id, 
        CommerceVariant.sku == sku
    ).set_database(mongo_db)
    return variant.model_dump() if variant else None

async def create_variant(
    db: Session,
    *,
    tenant_id: str,
    product_id: str,
    sku: str,
    label: str,
    price_minor: int,
    currency: str,
    inventory_quantity: int,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    variant = CommerceVariant(
        id=str(uuid4()),
        tenant_id=tenant_id,
        product_id=product_id,
        sku=sku,
        label=label,
        price_minor=price_minor,
        currency=currency,
        inventory_quantity=inventory_quantity,
    )
    await variant.insert().set_database(mongo_db)
    return variant.model_dump()

async def list_warehouses(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    warehouses = await CommerceWarehouse.find(CommerceWarehouse.tenant_id == tenant_id).sort("-is_default", "created_at").set_database(mongo_db).to_list()
    return [w.model_dump() for w in warehouses]

async def get_warehouse(db: Session, *, tenant_id: str, warehouse_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    warehouse = await CommerceWarehouse.find_one(
        CommerceWarehouse.tenant_id == tenant_id, 
        CommerceWarehouse.id == warehouse_id
    ).set_database(mongo_db)
    return warehouse.model_dump() if warehouse else None

async def find_warehouse_by_slug(db: Session, *, tenant_id: str, slug: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    warehouse = await CommerceWarehouse.find_one(
        CommerceWarehouse.tenant_id == tenant_id, 
        CommerceWarehouse.slug == slug
    ).set_database(mongo_db)
    return warehouse.model_dump() if warehouse else None

async def find_warehouse_by_code(db: Session, *, tenant_id: str, code: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    warehouse = await CommerceWarehouse.find_one(
        CommerceWarehouse.tenant_id == tenant_id, 
        CommerceWarehouse.code == code
    ).set_database(mongo_db)
    return warehouse.model_dump() if warehouse else None

async def create_warehouse(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    code: str,
    city: str | None,
    country: str | None,
    status: str,
    is_default: bool,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    warehouse = CommerceWarehouse(
        id=str(uuid4()),
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        code=code,
        city=city,
        country=country,
        status=status,
        is_default=is_default,
    )
    await warehouse.insert().set_database(mongo_db)
    return warehouse.model_dump()

async def list_warehouse_stocks(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str | None = None,
    variant_id: str | None = None,
) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceWarehouseStock.find(CommerceWarehouseStock.tenant_id == tenant_id)
    if warehouse_id:
        query = query.find(CommerceWarehouseStock.warehouse_id == warehouse_id)
    if variant_id:
        query = query.find(CommerceWarehouseStock.variant_id == variant_id)
    stocks = await query.sort("created_at").set_database(mongo_db).to_list()
    return [s.model_dump() for s in stocks]

async def list_warehouse_stocks_for_variants(
    db: Session,
    *,
    tenant_id: str,
    variant_ids: list[str],
) -> list[dict[str, Any]]:
    if not variant_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    stocks = await CommerceWarehouseStock.find(
        CommerceWarehouseStock.tenant_id == tenant_id,
        In(CommerceWarehouseStock.variant_id, variant_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [s.model_dump() for s in stocks]

async def get_warehouse_stock(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str,
    variant_id: str,
) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    stock = await CommerceWarehouseStock.find_one(
        CommerceWarehouseStock.tenant_id == tenant_id, 
        CommerceWarehouseStock.warehouse_id == warehouse_id,
        CommerceWarehouseStock.variant_id == variant_id
    ).set_database(mongo_db)
    return stock.model_dump() if stock else None

async def create_warehouse_stock(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str,
    variant_id: str,
    on_hand_quantity: int,
    reserved_quantity: int,
    low_stock_threshold: int,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    stock = CommerceWarehouseStock(
        id=str(uuid4()),
        tenant_id=tenant_id,
        warehouse_id=warehouse_id,
        variant_id=variant_id,
        on_hand_quantity=on_hand_quantity,
        reserved_quantity=reserved_quantity,
        low_stock_threshold=low_stock_threshold,
    )
    await stock.insert().set_database(mongo_db)
    return stock.model_dump()

async def list_stock_ledger_entries(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str | None = None,
    variant_id: str | None = None,
) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceStockLedgerEntry.find(CommerceStockLedgerEntry.tenant_id == tenant_id)
    if warehouse_id:
        query = query.find(CommerceStockLedgerEntry.warehouse_id == warehouse_id)
    if variant_id:
        query = query.find(CommerceStockLedgerEntry.variant_id == variant_id)
    entries = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [e.model_dump() for e in entries]

async def create_stock_ledger_entry(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str,
    variant_id: str,
    entry_type: str,
    quantity_delta: int,
    balance_after: int,
    reserved_after: int,
    reference_type: str | None,
    reference_id: str | None,
    notes: str | None,
    recorded_by_user_id: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    entry = CommerceStockLedgerEntry(
        id=str(uuid4()),
        tenant_id=tenant_id,
        warehouse_id=warehouse_id,
        variant_id=variant_id,
        entry_type=entry_type,
        quantity_delta=quantity_delta,
        balance_after=balance_after,
        reserved_after=reserved_after,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        recorded_by_user_id=recorded_by_user_id,
    )
    await entry.insert().set_database(mongo_db)
    return entry.model_dump()

async def list_product_attribute_values_for_products(
    db: Session,
    *,
    tenant_id: str,
    product_ids: list[str],
) -> list[dict[str, Any]]:
    if not product_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    values = await CommerceProductAttributeValue.find(
        CommerceProductAttributeValue.tenant_id == tenant_id,
        In(CommerceProductAttributeValue.product_id, product_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [v.model_dump() for v in values]

async def create_product_attribute_value(
    db: Session,
    *,
    tenant_id: str,
    product_id: str,
    attribute_id: str,
    value_json: object,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    val = CommerceProductAttributeValue(
        id=str(uuid4()),
        tenant_id=tenant_id,
        product_id=product_id,
        attribute_id=attribute_id,
        value=value_json,
    )
    await val.insert().set_database(mongo_db)
    return val.model_dump()

async def list_variant_attribute_values_for_variants(
    db: Session,
    *,
    tenant_id: str,
    variant_ids: list[str],
) -> list[dict[str, Any]]:
    if not variant_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    values = await CommerceVariantAttributeValue.find(
        CommerceVariantAttributeValue.tenant_id == tenant_id,
        In(CommerceVariantAttributeValue.variant_id, variant_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [v.model_dump() for v in values]

async def create_variant_attribute_value(
    db: Session,
    *,
    tenant_id: str,
    variant_id: str,
    attribute_id: str,
    value_json: object,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    val = CommerceVariantAttributeValue(
        id=str(uuid4()),
        tenant_id=tenant_id,
        variant_id=variant_id,
        attribute_id=attribute_id,
        value=value_json,
    )
    await val.insert().set_database(mongo_db)
    return val.model_dump()

async def list_orders(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    orders = await CommerceOrder.find(CommerceOrder.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [o.model_dump() for o in orders]

async def get_order(db: Session, *, tenant_id: str, order_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    order = await CommerceOrder.find_one(
        CommerceOrder.tenant_id == tenant_id, 
        CommerceOrder.id == order_id
    ).set_database(mongo_db)
    return order.model_dump() if order else None

async def list_order_lines_for_orders(db: Session, *, tenant_id: str, order_ids: list[str]) -> list[dict[str, Any]]:
    if not order_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    lines = await CommerceOrderLine.find(
        CommerceOrderLine.tenant_id == tenant_id,
        In(CommerceOrderLine.order_id, order_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [l.model_dump() for l in lines]

async def create_order(
    db: Session,
    *,
    tenant_id: str,
    customer_id: str,
    price_list_id: str | None,
    tax_profile_id: str | None,
    coupon_code: str | None,
    status: str,
    currency: str,
    subtotal_minor: int,
    discount_minor: int,
    tax_minor: int,
    total_minor: int,
    payment_status: str,
    paid_minor: int,
    refunded_minor: int,
    balance_minor: int,
    invoice_number: str | None,
    invoice_issued_at: str | None,
    inventory_reserved: bool,
    placed_at: str | None,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    order = CommerceOrder(
        id=str(uuid4()),
        tenant_id=tenant_id,
        customer_id=customer_id,
        price_list_id=price_list_id,
        tax_profile_id=tax_profile_id,
        coupon_code=coupon_code,
        status=status,
        currency=currency,
        subtotal_minor=subtotal_minor,
        discount_minor=discount_minor,
        tax_minor=tax_minor,
        total_minor=total_minor,
        payment_status=payment_status,
        paid_minor=paid_minor,
        refunded_minor=refunded_minor,
        balance_minor=balance_minor,
        invoice_number=invoice_number,
        invoice_issued_at=invoice_issued_at,
        inventory_reserved=inventory_reserved,
        placed_at=placed_at,
    )
    await order.insert().set_database(mongo_db)
    return order.model_dump()

async def create_order_line(
    db: Session,
    *,
    order_id: str,
    tenant_id: str,
    product_id: str,
    variant_id: str,
    allocated_warehouse_id: str | None,
    quantity: int,
    fulfilled_quantity: int,
    unit_price_minor: int,
    line_total_minor: int,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    line = CommerceOrderLine(
        id=str(uuid4()),
        order_id=order_id,
        tenant_id=tenant_id,
        product_id=product_id,
        variant_id=variant_id,
        allocated_warehouse_id=allocated_warehouse_id,
        quantity=quantity,
        fulfilled_quantity=fulfilled_quantity,
        unit_price_minor=unit_price_minor,
        line_total_minor=line_total_minor,
    )
    await line.insert().set_database(mongo_db)
    return line.model_dump()

async def list_fulfillments(db: Session, *, tenant_id: str, order_id: str | None = None) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceFulfillment.find(CommerceFulfillment.tenant_id == tenant_id)
    if order_id:
        query = query.find(CommerceFulfillment.order_id == order_id)
    fulfillments = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [f.model_dump() for f in fulfillments]

async def get_fulfillment(db: Session, *, tenant_id: str, fulfillment_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    fulfillment = await CommerceFulfillment.find_one(
        CommerceFulfillment.tenant_id == tenant_id, 
        CommerceFulfillment.id == fulfillment_id
    ).set_database(mongo_db)
    return fulfillment.model_dump() if fulfillment else None

async def create_fulfillment(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    warehouse_id: str | None,
    fulfillment_number: str,
    status: str,
    created_by_user_id: str,
    packed_at: str | None,
    shipped_at: str | None,
    delivered_at: str | None,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    fulfillment = CommerceFulfillment(
        id=str(uuid4()),
        tenant_id=tenant_id,
        order_id=order_id,
        warehouse_id=warehouse_id,
        fulfillment_number=fulfillment_number,
        status=status,
        created_by_user_id=created_by_user_id,
        packed_at=packed_at,
        shipped_at=shipped_at,
        delivered_at=delivered_at,
    )
    await fulfillment.insert().set_database(mongo_db)
    return fulfillment.model_dump()

async def list_fulfillment_lines(
    db: Session,
    *,
    tenant_id: str,
    fulfillment_ids: list[str],
) -> list[dict[str, Any]]:
    if not fulfillment_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    lines = await CommerceFulfillmentLine.find(
        CommerceFulfillmentLine.tenant_id == tenant_id,
        In(CommerceFulfillmentLine.fulfillment_id, fulfillment_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [l.model_dump() for l in lines]

async def create_fulfillment_line(
    db: Session,
    *,
    tenant_id: str,
    fulfillment_id: str,
    order_line_id: str,
    variant_id: str,
    quantity: int,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    line = CommerceFulfillmentLine(
        id=str(uuid4()),
        tenant_id=tenant_id,
        fulfillment_id=fulfillment_id,
        order_line_id=order_line_id,
        variant_id=variant_id,
        quantity=quantity,
    )
    await line.insert().set_database(mongo_db)
    return line.model_dump()

async def list_shipments(
    db: Session,
    *,
    tenant_id: str,
    fulfillment_id: str | None = None,
) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceShipment.find(CommerceShipment.tenant_id == tenant_id)
    if fulfillment_id:
        query = query.find(CommerceShipment.fulfillment_id == fulfillment_id)
    shipments = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [s.model_dump() for s in shipments]

async def get_shipment(db: Session, *, tenant_id: str, shipment_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    shipment = await CommerceShipment.find_one(
        CommerceShipment.tenant_id == tenant_id, 
        CommerceShipment.id == shipment_id
    ).set_database(mongo_db)
    return shipment.model_dump() if shipment else None

async def create_shipment(
    db: Session,
    *,
    tenant_id: str,
    fulfillment_id: str,
    carrier: str,
    service_level: str | None,
    tracking_number: str,
    status: str,
    shipped_at: str | None,
    delivered_at: str | None,
    metadata_json: dict[str, object],
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    shipment = CommerceShipment(
        id=str(uuid4()),
        tenant_id=tenant_id,
        fulfillment_id=fulfillment_id,
        carrier=carrier,
        service_level=service_level,
        tracking_number=tracking_number,
        status=status,
        shipped_at=shipped_at,
        delivered_at=delivered_at,
        metadata=metadata_json,
    )
    await shipment.insert().set_database(mongo_db)
    return shipment.model_dump()

async def list_payments(db: Session, *, tenant_id: str, order_id: str | None = None) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommercePayment.find(CommercePayment.tenant_id == tenant_id)
    if order_id:
        query = query.find(CommercePayment.order_id == order_id)
    payments = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [p.model_dump() for p in payments]

async def get_payment(db: Session, *, tenant_id: str, payment_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    payment = await CommercePayment.find_one(
        CommercePayment.tenant_id == tenant_id, 
        CommercePayment.id == payment_id
    ).set_database(mongo_db)
    return payment.model_dump() if payment else None

async def create_payment(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    amount_minor: int,
    currency: str,
    provider: str | None,
    payment_method: str,
    status: str,
    reference: str | None,
    notes: str | None,
    received_at: str,
    recorded_by_user_id: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    payment = CommercePayment(
        id=str(uuid4()),
        tenant_id=tenant_id,
        order_id=order_id,
        amount_minor=amount_minor,
        currency=currency,
        provider=provider,
        payment_method=payment_method,
        status=status,
        reference=reference,
        notes=notes,
        received_at=received_at,
        recorded_by_user_id=recorded_by_user_id,
    )
    await payment.insert().set_database(mongo_db)
    return payment.model_dump()

async def list_refunds(db: Session, *, tenant_id: str, order_id: str | None = None) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceRefund.find(CommerceRefund.tenant_id == tenant_id)
    if order_id:
        query = query.find(CommerceRefund.order_id == order_id)
    refunds = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [r.model_dump() for r in refunds]

async def create_refund(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    payment_id: str,
    amount_minor: int,
    currency: str,
    reason: str,
    reference: str | None,
    status: str,
    refunded_at: str,
    recorded_by_user_id: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    refund = CommerceRefund(
        id=str(uuid4()),
        tenant_id=tenant_id,
        order_id=order_id,
        payment_id=payment_id,
        amount_minor=amount_minor,
        currency=currency,
        reason=reason,
        reference=reference,
        status=status,
        refunded_at=refunded_at,
        recorded_by_user_id=recorded_by_user_id,
    )
    await refund.insert().set_database(mongo_db)
    return refund.model_dump()

async def list_invoices(db: Session, *, tenant_id: str, order_id: str | None = None) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceInvoice.find(CommerceInvoice.tenant_id == tenant_id)
    if order_id:
        query = query.find(CommerceInvoice.order_id == order_id)
    invoices = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [i.model_dump() for i in invoices]

async def list_returns(db: Session, *, tenant_id: str, order_id: str | None = None) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    query = CommerceReturn.find(CommerceReturn.tenant_id == tenant_id)
    if order_id:
        query = query.find(CommerceReturn.order_id == order_id)
    returns = await query.sort("-created_at").set_database(mongo_db).to_list()
    return [r.model_dump() for r in returns]

async def get_return(db: Session, *, tenant_id: str, return_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    ret = await CommerceReturn.find_one(
        CommerceReturn.tenant_id == tenant_id, 
        CommerceReturn.id == return_id
    ).set_database(mongo_db)
    return ret.model_dump() if ret else None

async def create_return(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    return_number: str,
    status: str,
    reason_summary: str | None,
    notes: str | None,
    inventory_restocked: bool,
    requested_at: str,
    approved_at: str | None,
    received_at: str | None,
    closed_at: str | None,
    created_by_user_id: str,
    closed_by_user_id: str | None,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    ret = CommerceReturn(
        id=str(uuid4()),
        tenant_id=tenant_id,
        order_id=order_id,
        return_number=return_number,
        status=status,
        reason_summary=reason_summary,
        notes=notes,
        inventory_restocked=inventory_restocked,
        requested_at=requested_at,
        approved_at=approved_at,
        received_at=received_at,
        closed_at=closed_at,
        created_by_user_id=created_by_user_id,
        closed_by_user_id=closed_by_user_id,
    )
    await ret.insert().set_database(mongo_db)
    return ret.model_dump()

async def list_return_lines(
    db: Session,
    *,
    tenant_id: str,
    return_ids: list[str],
) -> list[dict[str, Any]]:
    if not return_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    lines = await CommerceReturnLine.find(
        CommerceReturnLine.tenant_id == tenant_id,
        In(CommerceReturnLine.return_id, return_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [l.model_dump() for l in lines]

async def create_return_line(
    db: Session,
    *,
    tenant_id: str,
    return_id: str,
    order_line_id: str,
    variant_id: str,
    quantity: int,
    resolution_type: str,
    replacement_variant_id: str | None,
    restock_on_receive: bool,
    line_amount_minor: int,
    notes: str | None,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    line = CommerceReturnLine(
        id=str(uuid4()),
        tenant_id=tenant_id,
        return_id=return_id,
        order_line_id=order_line_id,
        variant_id=variant_id,
        quantity=quantity,
        resolution_type=resolution_type,
        replacement_variant_id=replacement_variant_id,
        restock_on_receive=restock_on_receive,
        line_amount_minor=line_amount_minor,
        notes=notes,
    )
    await line.insert().set_database(mongo_db)
    return line.model_dump()

async def list_settlements(db: Session, *, tenant_id: str) -> list[dict[str, Any]]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    settlements = await CommerceSettlement.find(CommerceSettlement.tenant_id == tenant_id).sort("-created_at").set_database(mongo_db).to_list()
    return [s.model_dump() for s in settlements]

async def get_settlement(db: Session, *, tenant_id: str, settlement_id: str) -> dict[str, Any] | None:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    settlement = await CommerceSettlement.find_one(
        CommerceSettlement.tenant_id == tenant_id, 
        CommerceSettlement.id == settlement_id
    ).set_database(mongo_db)
    return settlement.model_dump() if settlement else None

async def create_settlement(
    db: Session,
    *,
    tenant_id: str,
    settlement_number: str,
    provider: str,
    settlement_reference: str | None,
    currency: str,
    status: str,
    payments_minor: int,
    refunds_minor: int,
    fees_minor: int,
    adjustments_minor: int,
    net_minor: int,
    reported_at: str,
    reconciled_at: str | None,
    closed_at: str | None,
    notes: str | None,
    created_by_user_id: str,
    closed_by_user_id: str | None,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    settlement = CommerceSettlement(
        id=str(uuid4()),
        tenant_id=tenant_id,
        settlement_number=settlement_number,
        provider=provider,
        settlement_reference=settlement_reference,
        currency=currency,
        status=status,
        payments_minor=payments_minor,
        refunds_minor=refunds_minor,
        fees_minor=fees_minor,
        adjustments_minor=adjustments_minor,
        net_minor=net_minor,
        reported_at=reported_at,
        reconciled_at=reconciled_at,
        closed_at=closed_at,
        notes=notes,
        created_by_user_id=created_by_user_id,
        closed_by_user_id=closed_by_user_id,
    )
    await settlement.insert().set_database(mongo_db)
    return settlement.model_dump()

async def list_settlement_entries(
    db: Session,
    *,
    tenant_id: str,
    settlement_ids: list[str],
) -> list[dict[str, Any]]:
    if not settlement_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    entries = await CommerceSettlementEntry.find(
        CommerceSettlementEntry.tenant_id == tenant_id,
        In(CommerceSettlementEntry.settlement_id, settlement_ids)
    ).sort("created_at").set_database(mongo_db).to_list()
    return [e.model_dump() for e in entries]

async def list_settlement_entries_for_payment_ids(
    db: Session,
    *,
    tenant_id: str,
    payment_ids: list[str],
) -> list[dict[str, Any]]:
    if not payment_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    entries = await CommerceSettlementEntry.find(
        CommerceSettlementEntry.tenant_id == tenant_id,
        In(CommerceSettlementEntry.payment_id, payment_ids)
    ).set_database(mongo_db).to_list()
    return [e.model_dump() for e in entries]

async def list_settlement_entries_for_refund_ids(
    db: Session,
    *,
    tenant_id: str,
    refund_ids: list[str],
) -> list[dict[str, Any]]:
    if not refund_ids:
        return []

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    entries = await CommerceSettlementEntry.find(
        CommerceSettlementEntry.tenant_id == tenant_id,
        In(CommerceSettlementEntry.refund_id, refund_ids)
    ).set_database(mongo_db).to_list()
    return [e.model_dump() for e in entries]

async def create_settlement_entry(
    db: Session,
    *,
    tenant_id: str,
    settlement_id: str,
    entry_type: str,
    payment_id: str | None,
    refund_id: str | None,
    amount_minor: int,
    label: str | None,
    notes: str | None,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    entry = CommerceSettlementEntry(
        id=str(uuid4()),
        tenant_id=tenant_id,
        settlement_id=settlement_id,
        entry_type=entry_type,
        payment_id=payment_id,
        refund_id=refund_id,
        amount_minor=amount_minor,
        label=label,
        notes=notes,
    )
    await entry.insert().set_database(mongo_db)
    return entry.model_dump()

async def create_invoice(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    customer_id: str,
    invoice_number: str,
    status: str,
    currency: str,
    subtotal_minor: int,
    discount_minor: int,
    tax_minor: int,
    total_minor: int,
    issued_at: str,
    issued_by_user_id: str,
) -> dict[str, Any]:

    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    invoice = CommerceInvoice(
        id=str(uuid4()),
        tenant_id=tenant_id,
        order_id=order_id,
        customer_id=customer_id,
        invoice_number=invoice_number,
        status=status,
        currency=currency,
        subtotal_minor=subtotal_minor,
        discount_minor=discount_minor,
        tax_minor=tax_minor,
        total_minor=total_minor,
        issued_at=issued_at,
        issued_by_user_id=issued_by_user_id,
    )
    await invoice.insert().set_database(mongo_db)
    return invoice.model_dump()

async def _update_document(
    db: Session,
    collection_name: str,
    *,
    tenant_id: str,
    document_id: str,
    data: dict[str, Any],
) -> dict[str, Any] | None:
    tenant_slug = _get_tenant_database_id(db, tenant_id)
    mongo_db = get_runtime_motor_database(get_settings(), tenant_slug=tenant_slug)
    
    # Map collection names to Beanie models
    from app.models.commerce import (
        CommerceCategory, CommerceBrand, CommerceVendor, CommerceCollection,
        CommerceTaxProfile, CommercePriceList, CommerceCoupon, CommerceAttribute,
        CommerceAttributeSet, CommerceProduct, CommerceVariant, CommerceWarehouse,
        CommerceWarehouseStock, CommerceOrder, CommerceFulfillment, CommerceShipment,
        CommerceReturn, CommerceSettlement, CommerceInvoice
    )
    
    model_map = {
        "commerce_categories": CommerceCategory,
        "commerce_brands": CommerceBrand,
        "commerce_vendors": CommerceVendor,
        "commerce_collections": CommerceCollection,
        "commerce_tax_profiles": CommerceTaxProfile,
        "commerce_price_lists": CommercePriceList,
        "commerce_coupons": CommerceCoupon,
        "commerce_attributes": CommerceAttribute,
        "commerce_attribute_sets": CommerceAttributeSet,
        "commerce_products": CommerceProduct,
        "commerce_variants": CommerceVariant,
        "commerce_warehouses": CommerceWarehouse,
        "commerce_warehouse_stocks": CommerceWarehouseStock,
        "commerce_orders": CommerceOrder,
        "commerce_fulfillments": CommerceFulfillment,
        "commerce_shipments": CommerceShipment,
        "commerce_returns": CommerceReturn,
        "commerce_settlements": CommerceSettlement,
        "commerce_invoices": CommerceInvoice,
    }
    
    model_cls = model_map.get(collection_name)
    if not model_cls:
        # Fallback to direct motor if no beanie model is matched
        coll = mongo_db[collection_name]
        update_data = {**data, "updated_at": _now_iso()}
        doc = await coll.find_one_and_update(
            {"tenant_id": tenant_id, "id": document_id},
            {"$set": update_data},
            return_document=True,
        )
        return doc

    doc = await model_cls.find_one(
        model_cls.tenant_id == tenant_id, 
        model_cls.id == document_id
    ).set_database(mongo_db)
    
    if not doc:
        return None
        
    await doc.update({"$set": data}).set_database(mongo_db)
    return doc.model_dump()

async def update_product(db: Session, *, tenant_id: str, product_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_products", tenant_id=tenant_id, document_id=product_id, data=data)

async def update_variant(db: Session, *, tenant_id: str, variant_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_variants", tenant_id=tenant_id, document_id=variant_id, data=data)

async def update_warehouse(db: Session, *, tenant_id: str, warehouse_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_warehouses", tenant_id=tenant_id, document_id=warehouse_id, data=data)

async def update_warehouse_stock(db: Session, *, tenant_id: str, stock_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_warehouse_stocks", tenant_id=tenant_id, document_id=stock_id, data=data)

async def update_order(db: Session, *, tenant_id: str, order_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_orders", tenant_id=tenant_id, document_id=order_id, data=data)

async def update_fulfillment(db: Session, *, tenant_id: str, fulfillment_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_fulfillments", tenant_id=tenant_id, document_id=fulfillment_id, data=data)

async def update_shipment(db: Session, *, tenant_id: str, shipment_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_shipments", tenant_id=tenant_id, document_id=shipment_id, data=data)

async def update_return(db: Session, *, tenant_id: str, return_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_returns", tenant_id=tenant_id, document_id=return_id, data=data)

async def update_settlement(db: Session, *, tenant_id: str, settlement_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_settlements", tenant_id=tenant_id, document_id=settlement_id, data=data)

async def update_category(db: Session, *, tenant_id: str, category_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_categories", tenant_id=tenant_id, document_id=category_id, data=data)

async def update_brand(db: Session, *, tenant_id: str, brand_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_brands", tenant_id=tenant_id, document_id=brand_id, data=data)

async def update_vendor(db: Session, *, tenant_id: str, vendor_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_vendors", tenant_id=tenant_id, document_id=vendor_id, data=data)

async def update_collection(db: Session, *, tenant_id: str, collection_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_collections", tenant_id=tenant_id, document_id=collection_id, data=data)

async def update_tax_profile(db: Session, *, tenant_id: str, tax_profile_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_tax_profiles", tenant_id=tenant_id, document_id=tax_profile_id, data=data)

async def update_price_list(db: Session, *, tenant_id: str, price_list_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_price_lists", tenant_id=tenant_id, document_id=price_list_id, data=data)

async def update_coupon(db: Session, *, tenant_id: str, coupon_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_coupons", tenant_id=tenant_id, document_id=coupon_id, data=data)

async def update_attribute(db: Session, *, tenant_id: str, attribute_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_attributes", tenant_id=tenant_id, document_id=attribute_id, data=data)

async def update_attribute_set(db: Session, *, tenant_id: str, attribute_set_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_document(db, "commerce_attribute_sets", tenant_id=tenant_id, document_id=attribute_set_id, data=data)
