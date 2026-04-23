from datetime import UTC, datetime
from typing import Any
from uuid import uuid4
from app.utlis.utlis import serialize_mongo

from app.core.config import get_settings
from app.db.mongo import get_runtime_motor_database

def _map_id(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    # Support both _id as ObjectId and _id as string
    doc["id"] = str(doc.pop("_id"))
    return doc

def _map_ids(docs: list[dict]) -> list[dict]:
    return [_map_id(doc) for doc in docs]

# --- Category ---
async def list_categories(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_categories"].find().sort("createdAt", -1)
    categories = await cursor.to_list(length=1000)
    return _map_ids(categories)

async def get_category(db_name: str, category_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    print(category_id, "category_id")
    try:
        oid = ObjectId(category_id)
        doc = await db["commerce_categories"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_categories"].find_one({"_id": category_id})
    return _map_id(doc)

async def find_category_by_slug(db_name: str, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_categories"].find_one({"slug": slug})
    return _map_id(doc)

async def create_category(
    *,
    name: str,
    slug: str,
    type: str,
    parentId: str | None,
    description: str,
    pageStatus: str,
    bannerImageUrl: str | None,
    metaTitle: str | None,
    metaDescription: str | None,
    db_name: str,
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "name": name,
        "slug": slug,
        "type": type,
        "parentId": parentId,
        "description": description,
        "pageStatus": pageStatus,
        "bannerImageUrl": bannerImageUrl,
        "metaTitle": metaTitle,
        "metaDescription": metaDescription,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_categories"].insert_one(doc)
    doc["id"] = str(doc["_id"])
    return doc

async def update_category(db_name: str, category_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    data["updatedAt"] = datetime.now(tz=UTC)
    try:
        oid = ObjectId(category_id)
        await db["commerce_categories"].update_one({"_id": oid}, {"$set": data})
    except Exception:
        await db["commerce_categories"].update_one({"_id": category_id}, {"$set": data})
    return await get_category(db_name, category_id)

async def delete_category(db_name: str, category_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(category_id)
        result = await db["commerce_categories"].delete_one({"_id": oid})
    except Exception:
        result = await db["commerce_categories"].delete_one({"_id": category_id})
    return result.deleted_count > 0

async def has_subcategories(db_name: str, category_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_categories"].find_one({"parentId": category_id})
    return doc is not None

# --- Brand ---
async def list_brands(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_brands"].find().sort("createdAt", -1)
    brands = await cursor.to_list(length=1000)
    return _map_ids(brands)

async def get_brand(db_name: str, *, brand_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(brand_id)
        doc = await db["commerce_brands"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_brands"].find_one({"_id": brand_id})
    return _map_id(doc)

async def find_brand_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_brands"].find_one({"slug": slug})
    return _map_id(doc)

async def find_brand_by_code(db_name: str, *, code: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_brands"].find_one({"code": code})
    return _map_id(doc)

async def create_brand(
    db_name: str,
    *,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    status: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "name": name,
        "slug": slug,
        "code": code,
        "description": description,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_brands"].insert_one(doc)
    return _map_id(doc)

# --- Vendor ---
async def list_vendors(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_vendors"].find().sort("createdAt", -1)
    vendors = await cursor.to_list(length=1000)
    return _map_ids(vendors)

async def get_vendor(db_name: str, *, vendor_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(vendor_id)
        doc = await db["commerce_vendors"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_vendors"].find_one({"_id": vendor_id})
    return _map_id(doc)

async def find_vendor_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_vendors"].find_one({"slug": slug})
    return _map_id(doc)

async def find_vendor_by_code(db_name: str, *, code: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_vendors"].find_one({"code": code})
    return _map_id(doc)

async def create_vendor(
    db_name: str,
    *,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    contact_name: str | None,
    contact_email: str | None,
    contact_phone: str | None,
    status: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "name": name,
        "slug": slug,
        "code": code,
        "description": description,
        "contact_name": contact_name,
        "contact_email": contact_email,
        "contact_phone": contact_phone,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_vendors"].insert_one(doc)
    return _map_id(doc)

# --- Collection ---
async def list_collections(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_collections"].find().sort([("sort_order", 1), ("createdAt", -1)])
    collections = await cursor.to_list(length=1000)
    return _map_ids(collections)

async def list_collections_by_ids(db_name: str, *, collection_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not collection_ids:
        return []
    from bson import ObjectId
    oids = []
    for cid in collection_ids:
        try:
            oids.append(ObjectId(cid))
        except Exception:
            oids.append(cid)
    cursor = db["commerce_collections"].find({"_id": {"$in": oids}})
    collections = await cursor.to_list(length=1000)
    return _map_ids(collections)

async def get_collection(db_name: str, *, collection_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(collection_id)
        doc = await db["commerce_collections"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_collections"].find_one({"_id": collection_id})
    return _map_id(doc)

async def find_collection_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_collections"].find_one({"slug": slug})
    return _map_id(doc)

async def create_collection(
    db_name: str,
    *,
    name: str,
    slug: str,
    description: str | None,
    status: str,
    sort_order: int) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "name": name,
        "slug": slug,
        "description": description,
        "status": status,
        "sort_order": sort_order,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_collections"].insert_one(doc)
    return _map_id(doc)

# --- Tax Profile ---
async def list_tax_profiles(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_tax_profiles"].find().sort("createdAt", -1)
    profiles = await cursor.to_list(length=1000)
    return _map_ids(profiles)

async def get_tax_profile(db_name: str, *, tax_profile_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(tax_profile_id)
        doc = await db["commerce_tax_profiles"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_tax_profiles"].find_one({"_id": tax_profile_id})
    return _map_id(doc)

async def find_tax_profile_by_code(db_name: str, *, code: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_tax_profiles"].find_one({"code": code})
    return _map_id(doc)

async def create_tax_profile(
    db_name: str,
    *,
    name: str,
    code: str,
    description: str | None,
    prices_include_tax: bool,
    rules_json: list[dict[str, object]],
    status: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    tax_profile_id = str(uuid4())
    doc = {
        "_id": tax_profile_id,
        "name": name,
        "code": code,
        "description": description,
        "prices_include_tax": prices_include_tax,
        "rules": rules_json,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_tax_profiles"].insert_one(doc)
    return _map_id(doc)

# --- Price List ---
async def list_price_lists(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_price_lists"].find().sort("createdAt", -1)
    price_lists = await cursor.to_list(length=1000)
    return _map_ids(price_lists)

async def get_price_list(db_name: str, *, price_list_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(price_list_id)
        doc = await db["commerce_price_lists"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_price_lists"].find_one({"_id": price_list_id})
    return _map_id(doc)

async def find_price_list_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_price_lists"].find_one({"slug": slug})
    return _map_id(doc)

async def create_price_list(
    db_name: str,
    *,
    name: str,
    slug: str,
    currency: str,
    customer_segment: str | None,
    description: str | None,
    status: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    price_list_id = str(uuid4())
    doc = {
        "_id": price_list_id,
        "name": name,
        "slug": slug,
        "currency": currency,
        "customer_segment": customer_segment,
        "description": description,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_price_lists"].insert_one(doc)
    return _map_id(doc)

async def list_price_list_items(db_name: str, *, price_list_id: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_price_list_items"].find({"price_list_id": price_list_id}).sort("createdAt", 1)
    items = await cursor.to_list(length=5000)
    return _map_ids(items)

async def list_price_list_items_for_variants(
    db_name: str,
    *,
    price_list_id: str,
    variant_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not variant_ids:
        return []
    cursor = db["commerce_price_list_items"].find({
        "price_list_id": price_list_id,
        "variant_id": {"$in": variant_ids}
    })
    items = await cursor.to_list(length=5000)
    return _map_ids(items)

async def create_price_list_item(
    db_name: str,
    *,
    price_list_id: str,
    variant_id: str,
    price_minor: int) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    item_id = str(uuid4())
    doc = {
        "_id": item_id,
        "price_list_id": price_list_id,
        "variant_id": variant_id,
        "price_minor": price_minor,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_price_list_items"].insert_one(doc)
    return _map_id(doc)

# --- Coupon ---
async def list_coupons(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_coupons"].find().sort("createdAt", -1)
    coupons = await cursor.to_list(length=1000)
    return _map_ids(coupons)

async def find_coupon_by_code(db_name: str, *, code: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_coupons"].find_one({"code": code})
    return _map_id(doc)

async def create_coupon(
    db_name: str,
    *,
    code: str,
    description: str | None,
    discount_type: str,
    discount_value: int,
    minimum_subtotal_minor: int,
    maximum_discount_minor: int | None,
    applicable_category_ids: list[str],
    applicable_variant_ids: list[str],
    status: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    coupon_id = str(uuid4())
    doc = {
        "_id": coupon_id,
        "code": code,
        "description": description,
        "discount_type": discount_type,
        "discount_value": discount_value,
        "minimum_subtotal_minor": minimum_subtotal_minor,
        "maximum_discount_minor": maximum_discount_minor,
        "applicable_category_ids": applicable_category_ids,
        "applicable_variant_ids": applicable_variant_ids,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_coupons"].insert_one(doc)
    return _map_id(doc)

# --- Attribute ---


async def list_attributes_by_ids(db_name: str, *, attribute_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not attribute_ids:
        return []
    cursor = db["commerce_attributes"].find({"_id": {"$in": attribute_ids}})
    attributes = await cursor.to_list(length=1000)
    return _map_ids(attributes)





# --- Attribute Set ---
async def list_attribute_sets(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_attribute_sets"].find().sort("createdAt", -1)
    sets = await cursor.to_list(length=1000)
    return _map_ids(sets)

async def get_attribute_set(db_name: str, *, attribute_set_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(attribute_set_id)
        doc = await db["commerce_attribute_sets"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_attribute_sets"].find_one({"_id": attribute_set_id})
    return _map_id(doc)

async def find_attribute_set_by_key(db_name: str, *, key: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_attribute_sets"].find_one({"key": key})
    return _map_id(doc)

async def create_attribute_set(
    db_name: str,
    *,
    name: str,
    key: str,
    appliesTo: str | None,
    description: str | None,
    attributes: list[dict[str, Any]],
    vertical_bindings: list[str]) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)

    doc = {
        "name": name,
        "key": key,
        "appliesTo": appliesTo,
        "description": description,
        "attributes": attributes,
        "vertical_bindings": vertical_bindings,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_attribute_sets"].insert_one(doc)
    doc["id"] = str(doc["_id"])
    return doc

async def update_attribute_set(
    db_name: str,
    *,
    attribute_set_id: str,
    **updates: Any
) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not updates:
        return await get_attribute_set(db_name, attribute_set_id=attribute_set_id)
    
    updates["updatedAt"] = datetime.now(tz=UTC)
    
    from bson import ObjectId
    try:
        query = {"_id": ObjectId(attribute_set_id)}
    except Exception:
        query = {"_id": attribute_set_id}

    result = await db["commerce_attribute_sets"].find_one_and_update(
        query,
        {"$set": updates},
        return_document=True
    )
    return _map_id(result) if result else None

async def delete_attribute_set(db_name: str, *, attribute_set_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        query = {"_id": ObjectId(attribute_set_id)}
    except Exception:
        query = {"_id": attribute_set_id}

    result = await db["commerce_attribute_sets"].delete_one(query)
    return result.deleted_count > 0

async def count_products_by_attribute_set(db_name: str, *, attribute_set_id: str) -> int:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(attribute_set_id)
        count = await db["commerce_products"].count_documents({"attribute_set_id": oid})
        if count > 0: return count
    except Exception:
        pass
    return await db["commerce_products"].count_documents({"attribute_set_id": attribute_set_id})


# --- Product ---
async def list_products(
    db_name: str,
    *,
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    product_type: str | None = None,
    variant_filters: list[dict[str, Any]] | None = None,
    skip: int = 0,
    limit: int = 50
) -> tuple[list[dict[str, Any]], int]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query: dict[str, Any] = {}
    
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if category and category != "all":
        query["categoryIds"] = category
    if status:
        query["status"] = status
    if product_type:
        query["type"] = product_type
    
    if variant_filters:
        query["$and"] = variant_filters

    total = await db["commerce_products"].count_documents(query)
    cursor = db["commerce_products"].find(query).sort("createdAt", -1).skip(skip).limit(limit)
    products = await cursor.to_list(length=limit)
    return serialize_mongo(products), total

async def aggregate_product_filters(db_name: str, query: dict[str, Any]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    # The Node.js logic is simpler than a full aggregation pipeline for small datasets
    # but a pipeline is better for performance. Let's do a pipeline.
    pipeline = [
        {"$match": query},
        {"$project": {"options": 1}},
        {"$unwind": "$options"},
        {"$match": {"options.useForVariants": True}},
        {"$group": {
            "_id": "$options.key",
            "label": {"$first": "$options.label"},
            "selectedValues": {"$addToSet": "$options.selectedValues"}
        }},
        {"$project": {
            "key": "$_id",
            "label": 1,
            "selectedValues": {
                "$reduce": {
                    "input": "$selectedValues",
                    "initialValue": [],
                    "in": {"$setUnion": ["$$value", "$$this"]}
                }
            }
        }}
    ]
    cursor = db["commerce_products"].aggregate(pipeline)
    return await cursor.to_list(length=100)

async def get_product(db_name: str, *, product_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(product_id)
        doc = await db["commerce_products"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_products"].find_one({"_id": product_id})
    return serialize_mongo(doc)

async def find_product_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_products"].find_one({"slug": slug})
    return serialize_mongo(doc)

async def create_product(db_name: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    now = datetime.now(tz=UTC)
    data["createdAt"] = now
    data["created_at"] = now
    data["updatedAt"] = now
    data["updated_at"] = now
    data.pop("_id", None)
    result = await db["commerce_products"].insert_one(data)
    data["id"] = str(result.inserted_id)
    return data

async def update_product(db_name: str, product_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    now = datetime.now(tz=UTC)
    data["updatedAt"] = now
    data["updated_at"] = now
    data.pop("_id", None)
    try:
        oid = ObjectId(product_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": product_id}
    
    result = await db["commerce_products"].find_one_and_update(
        query,
        {"$set": data},
        return_document=True
    )
    return _map_id(result) if result else None

async def archive_product(db_name: str, product_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(product_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": product_id}
    
    # Soft delete product
    now = datetime.now(tz=UTC)
    result = await db["commerce_products"].update_one(query, {"$set": {"status": "archived", "updatedAt": now}})
    
    # Soft delete variants
    # Note: variants use productId which can be ObjectId or string
    await db["commerce_variants"].update_many(
        {"productId": {"$in": [product_id, oid] if isinstance(product_id, str) else [product_id]}},
        {"$set": {"status": "inactive", "updatedAt": now}}
    )
    
    return result.modified_count > 0
    

async def hard_delete_product(db_name: str, product_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(product_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": product_id}
    
    result = await db["commerce_products"].delete_one(query)
    return result.deleted_count > 0


async def delete_variants_for_product(db_name: str, product_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(product_id)
        query = {"productId": {"$in": [product_id, oid]}}
    except Exception:
        query = {"productId": product_id}
    
    result = await db["commerce_variants"].delete_many(query)
    return result.deleted_count > 0

# --- Variant ---
async def list_variants_for_products(db_name: str, *, product_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not product_ids:
        return []
    
    from bson import ObjectId
    oids = []
    for pid in product_ids:
        try:
            oids.append(ObjectId(pid))
        except Exception:
            oids.append(pid)
            
    cursor = db["commerce_variants"].find({"productId": {"$in": oids + product_ids}}).sort("createdAt", 1)
    variants = await cursor.to_list(length=5000)
    return serialize_mongo(variants)

async def get_variant(db_name: str, *, variant_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(variant_id)
        doc = await db["commerce_variants"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_variants"].find_one({"_id": variant_id})
    return _map_id(doc)

async def sync_variants(db_name: str, product_id: str, variants_data: list[dict[str, Any]]):
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    
    try:
        pid_oid = ObjectId(product_id)
    except Exception:
        pid_oid = product_id

    # Match Node.js: replace entire variant list
    await db["commerce_variants"].delete_many({"productId": pid_oid})

    for v in variants_data:
        v["productId"] = pid_oid
        v["updatedAt"] = datetime.now(tz=UTC)
        v["createdAt"] = datetime.now(tz=UTC)
        v.pop("id", None)
        v.pop("_id", None)
        await db["commerce_variants"].insert_one(v)

# --- Warehouse ---
async def list_warehouses(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_warehouses"].find().sort([("is_default", -1), ("createdAt", 1)])
    warehouses = await cursor.to_list(length=1000)
    return _map_ids(warehouses)

async def get_warehouse(db_name: str, *, warehouse_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(warehouse_id)
        doc = await db["commerce_warehouses"].find_one({"_id": oid})
    except Exception:
        doc = await db["commerce_warehouses"].find_one({"_id": warehouse_id})
    return _map_id(doc)

async def find_warehouse_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_warehouses"].find_one({"slug": slug})
    return _map_id(doc)

async def find_warehouse_by_code(db_name: str, *, code: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_warehouses"].find_one({"code": code})
    return _map_id(doc)

async def create_warehouse(
    db_name: str,
    *,
    name: str,
    slug: str,
    code: str,
    city: str | None,
    country: str | None,
    status: str,
    is_default: bool) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    warehouse_id = str(uuid4())
    doc = {
        "_id": warehouse_id,
        "name": name,
        "slug": slug,
        "code": code,
        "city": city,
        "country": country,
        "status": status,
        "is_default": is_default,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_warehouses"].insert_one(doc)
    return _map_id(doc)

# --- Warehouse Stock ---
async def list_warehouse_stocks(
    db_name: str,
    *,
    warehouse_id: str | None = None,
    variant_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if warehouse_id:
        filter_query["warehouse_id"] = warehouse_id
    if variant_id:
        filter_query["variant_id"] = variant_id
    cursor = db["commerce_warehouse_stocks"].find(filter_query).sort("createdAt", 1)
    stocks = await cursor.to_list(length=5000)
    return _map_ids(stocks)

async def list_warehouse_stocks_for_variants(
    db_name: str,
    *,
    variant_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not variant_ids:
        return []
    cursor = db["commerce_warehouse_stocks"].find({"variant_id": {"$in": variant_ids}}).sort("createdAt", 1)
    stocks = await cursor.to_list(length=5000)
    return _map_ids(stocks)

async def get_warehouse_stock(
    db_name: str,
    *,
    warehouse_id: str,
    variant_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    stock = await db["commerce_warehouse_stocks"].find_one({
        "warehouse_id": warehouse_id,
        "variant_id": variant_id
    })
    return _map_id(stock)

async def create_warehouse_stock(
    db_name: str,
    *,
    warehouse_id: str,
    variant_id: str,
    on_hand_quantity: int,
    reserved_quantity: int,
    low_stock_threshold: int) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    stock_id = str(uuid4())
    doc = {
        "_id": stock_id,
        "warehouse_id": warehouse_id,
        "variant_id": variant_id,
        "on_hand_quantity": on_hand_quantity,
        "reserved_quantity": reserved_quantity,
        "low_stock_threshold": low_stock_threshold,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_warehouse_stocks"].insert_one(doc)
    return _map_id(doc)

# --- Stock Ledger ---
async def list_stock_ledger_entries(
    db_name: str,
    *,
    warehouse_id: str | None = None,
    variant_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if warehouse_id:
        filter_query["warehouse_id"] = warehouse_id
    if variant_id:
        filter_query["variant_id"] = variant_id
    cursor = db["commerce_stock_ledger_entries"].find(filter_query).sort("createdAt", -1)
    entries = await cursor.to_list(length=5000)
    return _map_ids(entries)

async def create_stock_ledger_entry(
    db_name: str,
    *,
    warehouse_id: str,
    variant_id: str,
    entry_type: str,
    quantity_delta: int,
    balance_after: int,
    reserved_after: int,
    reference_type: str | None,
    reference_id: str | None,
    notes: str | None,
    recorded_by_user_id: str) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    entry_id = str(uuid4())
    doc = {
        "_id": entry_id,
        "warehouse_id": warehouse_id,
        "variant_id": variant_id,
        "entry_type": entry_type,
        "quantity_delta": quantity_delta,
        "balance_after": balance_after,
        "reserved_after": reserved_after,
        "reference_type": reference_type,
        "reference_id": reference_id,
        "notes": notes,
        "recorded_by_user_id": recorded_by_user_id,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["commerce_stock_ledger_entries"].insert_one(doc)
    return _map_id(doc)

# --- Order & Finance ---
async def get_order(db_name: str, *, order_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_orders"].find_one({"_id": order_id})
    return _map_id(doc)

async def list_payments(db_name: str, *, order_id: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_payments"].find({"order_id": order_id}).sort("createdAt", 1)
    items = await cursor.to_list(length=1000)
    return _map_ids(items)

async def get_payment(db_name: str, *, payment_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_payments"].find_one({"_id": payment_id})
    return _map_id(doc)

async def list_refunds(db_name: str, *, order_id: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_refunds"].find({"order_id": order_id}).sort("createdAt", 1)
    items = await cursor.to_list(length=1000)
    return _map_ids(items)

async def list_fulfillments(db_name: str, *, order_id: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_fulfillments"].find({"order_id": order_id}).sort("createdAt", 1)
    items = await cursor.to_list(length=1000)
    return _map_ids(items)

async def get_fulfillment(db_name: str, *, fulfillment_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_fulfillments"].find_one({"_id": fulfillment_id})
    return _map_id(doc)

async def get_shipment(db_name: str, *, shipment_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_shipments"].find_one({"_id": shipment_id})
    return _map_id(doc)

async def get_return(db_name: str, *, return_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_returns"].find_one({"_id": return_id})
    return _map_id(doc)

async def get_settlement(db_name: str, *, settlement_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_settlements"].find_one({"_id": settlement_id})
    return _map_id(doc)


def _id_candidates(document_id: str) -> list[object]:
    candidates: list[object] = [document_id]
    try:
        from bson import ObjectId

        candidates.insert(0, ObjectId(document_id))
    except Exception:
        pass
    return candidates


async def _find_one_by_id(db_name: str, collection_name: str, document_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    collection = db[collection_name]
    for candidate in _id_candidates(document_id):
        doc = await collection.find_one({"_id": candidate})
        if doc is not None:
            return _map_id(doc)
    return None


async def _update_by_id(
    db_name: str,
    collection_name: str,
    *,
    document_id: str,
    data: dict[str, Any],
) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    collection = db[collection_name]
    update_data = dict(data)
    update_data["updated_at"] = datetime.now(tz=UTC)
    for candidate in _id_candidates(document_id):
        result = await collection.update_one({"_id": candidate}, {"$set": update_data})
        if result.matched_count:
            return await _find_one_by_id(db_name, collection_name, document_id)
    return None


async def list_attributes(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_attributes"].find().sort("createdAt", -1)
    return _map_ids(await cursor.to_list(length=1000))


async def aggregate_product_filters(db_name: str, query: dict[str, Any]) -> list[dict[str, Any]]:
    return []


async def list_products(
    db_name: str,
    *,
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    product_type: str | None = None,
    variant_filters: list[dict[str, Any]] | None = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[list[dict[str, Any]], int]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query: dict[str, Any] = {}
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    if category and category != "all":
        query["categoryIds"] = {"$in": [category]}
    if status:
        query["status"] = status

    
    total = await db["commerce_products"].count_documents(query)


    
    cursor = db["commerce_products"].find(query).sort("created_at", -1).skip(skip).limit(limit)

    products = await cursor.to_list(length=limit)
    return _map_ids(products), total


async def get_product(db_name: str, *, product_id: str) -> dict[str, Any] | None:
    return await _find_one_by_id(db_name, "commerce_products", product_id)


async def find_product_by_slug(db_name: str, *, slug: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_products"].find_one({"slug": slug})
    return _map_id(doc)


# async def create_product(
#     db_name: str,
#     data: dict[str, Any] | None = None,
#     **kwargs: Any,
# ) -> dict[str, Any]:
#     db = get_runtime_motor_database(get_settings(), database_name=db_name)
#     payload = dict(data or {})
#     payload.update(kwargs)
#     product_id = str(payload.pop("id", None) or uuid4())
#     doc = {
#         "_id": product_id,
#         "name": payload["name"],
#         "slug": payload["slug"],
#         "description": payload.get("description"),
#         "brand_id": payload.get("brand_id"),
#         "vendor_id": payload.get("vendor_id"),
#         "collection_ids": list(payload.get("collection_ids", [])),
#         "attribute_set_id": payload.get("attribute_set_id"),
#         "category_ids": list(payload.get("category_ids", [])),
#         "seo_title": payload.get("seo_title"),
#         "seo_description": payload.get("seo_description"),
#         "status": payload.get("status", "active"),
#         "product_attributes": list(payload.get("product_attributes", [])),
#         "created_at": datetime.now(tz=UTC),
#         "updated_at": datetime.now(tz=UTC),
#     }
#     await db["commerce_products"].insert_one(doc)
#     return _map_id(doc)


async def update_product(db_name: str, product_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_products", document_id=product_id, data=data)


async def delete_variants_for_product(db_name: str, product_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    result = await db["commerce_variants"].delete_many(
        {"$or": [{"product_id": product_id}, {"productId": product_id}]}
    )
    return result.deleted_count > 0


async def list_variants(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_variants"].find().sort("created_at", -1)
    return _map_ids(await cursor.to_list(length=5000))


async def list_variants_for_products(db_name: str, *, product_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not product_ids:
        return []
    cursor = db["commerce_variants"].find(
        {"$or": [{"product_id": {"$in": product_ids}}, {"productId": {"$in": product_ids}}]}
    ).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=5000))


async def get_variant(db_name: str, *, variant_id: str) -> dict[str, Any] | None:
    return await _find_one_by_id(db_name, "commerce_variants", variant_id)


async def find_variant_by_sku(db_name: str, *, sku: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_variants"].find_one({"sku": sku})
    return _map_id(doc)


async def create_variant(
    db_name: str,
    *,
    product_id: str,
    sku: str,
    label: str,
    price_minor: int,
    currency: str,
    inventory_quantity: int,
    attribute_values: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "product_id": product_id,
        "sku": sku,
        "label": label,
        "price_minor": price_minor,
        "currency": currency,
        "inventory_quantity": inventory_quantity,
        "attribute_values": list(attribute_values or []),
        "status": "active",
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_variants"].insert_one(doc)
    return _map_id(doc)


async def update_variant(db_name: str, *, variant_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_variants", document_id=variant_id, data=data)


async def sync_variants(db_name: str, product_id: str, variants_data: list[dict[str, Any]]) -> None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    await db["commerce_variants"].delete_many(
        {"$or": [{"product_id": product_id}, {"productId": product_id}]}
    )
    for variant in variants_data:
        await create_variant(
            db_name,
            product_id=product_id,
            sku=str(variant["sku"]),
            label=str(variant.get("label") or variant.get("title") or variant["sku"]),
            price_minor=int(variant.get("price_minor", variant.get("price", 0))),
            currency=str(variant.get("currency", "INR")).upper(),
            inventory_quantity=int(variant.get("inventory_quantity", variant.get("stock", 0))),
            attribute_values=list(variant.get("attribute_values", [])),
        )


async def update_warehouse(db_name: str, *, warehouse_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_warehouses", document_id=warehouse_id, data=data)


async def update_warehouse_stock(db_name: str, *, stock_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_warehouse_stocks", document_id=stock_id, data=data)


async def count_orders(db_name: str, query: dict[str, Any] = {}) -> int:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    return await db["commerce_orders"].count_documents(query)

async def list_orders(db_name: str, query: dict[str, Any] = {}, skip: int = 0, limit: int = 50) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_orders"].find(query).sort("createdAt", -1).skip(skip).limit(limit)
    return _map_ids(await cursor.to_list(length=limit))

async def get_order(db_name: str, *, order_id: str) -> dict[str, Any] | None:
    return await _find_one_by_id(db_name, "commerce_orders", order_id)

async def get_todays_orders_count(db_name: str) -> int:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from datetime import datetime, time
    import pytz
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    start_of_day = ist.localize(datetime.combine(now.date(), time.min))
    return await db["commerce_orders"].count_documents({"createdAt": {"$gte": start_of_day}})


async def list_order_lines_for_orders(db_name: str, *, order_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not order_ids:
        return []
    cursor = db["commerce_order_lines"].find({"order_id": {"$in": order_ids}}).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=5000))


async def create_order(db_name: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    result = await db["commerce_orders"].insert_one(data)
    data["id"] = str(result.inserted_id)
    return data


async def create_order_line(
    db_name: str,
    *,
    order_id: str,
    product_id: str,
    variant_id: str,
    allocated_warehouse_id: str | None,
    quantity: int,
    fulfilled_quantity: int,
    unit_price_minor: int,
    line_total_minor: int,
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "order_id": order_id,
        "product_id": product_id,
        "variant_id": variant_id,
        "allocated_warehouse_id": allocated_warehouse_id,
        "quantity": quantity,
        "fulfilled_quantity": fulfilled_quantity,
        "unit_price_minor": unit_price_minor,
        "line_total_minor": line_total_minor,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_order_lines"].insert_one(doc)
    return _map_id(doc)


async def update_order(db_name: str, *, order_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_orders", document_id=order_id, data=data)


async def update_order_line(db_name: str, *, line_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_order_lines", document_id=line_id, data=data)


async def list_fulfillments(db_name: str, *, order_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query = {"order_id": order_id} if order_id else {}
    cursor = db["commerce_fulfillments"].find(query).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_fulfillment(
    db_name: str,
    *,
    order_id: str,
    warehouse_id: str | None,
    fulfillment_number: str,
    status: str,
    created_by_user_id: str,
    packed_at: str | None,
    shipped_at: str | None,
    delivered_at: str | None,
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "order_id": order_id,
        "warehouse_id": warehouse_id,
        "fulfillment_number": fulfillment_number,
        "status": status,
        "created_by_user_id": created_by_user_id,
        "packed_at": packed_at,
        "shipped_at": shipped_at,
        "delivered_at": delivered_at,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_fulfillments"].insert_one(doc)
    return _map_id(doc)


async def list_fulfillment_lines(db_name: str, *, fulfillment_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not fulfillment_ids:
        return []
    cursor = db["commerce_fulfillment_lines"].find({"fulfillment_id": {"$in": fulfillment_ids}}).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=5000))


async def create_fulfillment_line(
    db_name: str,
    *,
    fulfillment_id: str,
    order_line_id: str,
    variant_id: str,
    quantity: int,
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "fulfillment_id": fulfillment_id,
        "order_line_id": order_line_id,
        "variant_id": variant_id,
        "quantity": quantity,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_fulfillment_lines"].insert_one(doc)
    return _map_id(doc)


async def update_fulfillment(db_name: str, *, fulfillment_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_fulfillments", document_id=fulfillment_id, data=data)


async def list_shipments(db_name: str, *, fulfillment_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query = {"fulfillment_id": fulfillment_id} if fulfillment_id else {}
    cursor = db["commerce_shipments"].find(query).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_shipment(
    db_name: str,
    *,
    fulfillment_id: str,
    carrier: str,
    service_level: str | None,
    tracking_number: str,
    status: str,
    shipped_at: str | None,
    delivered_at: str | None,
    metadata_json: dict[str, object],
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "fulfillment_id": fulfillment_id,
        "carrier": carrier,
        "service_level": service_level,
        "tracking_number": tracking_number,
        "status": status,
        "shipped_at": shipped_at,
        "delivered_at": delivered_at,
        "metadata_json": metadata_json,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_shipments"].insert_one(doc)
    return _map_id(doc)


async def update_shipment(db_name: str, *, shipment_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_shipments", document_id=shipment_id, data=data)


async def list_payments(db_name: str, *, order_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query = {"order_id": order_id} if order_id else {}
    cursor = db["commerce_payments"].find(query).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_payment(
    db_name: str,
    *,
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
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "order_id": order_id,
        "amount_minor": amount_minor,
        "currency": currency,
        "provider": provider,
        "payment_method": payment_method,
        "status": status,
        "reference": reference,
        "notes": notes,
        "received_at": received_at,
        "recorded_by_user_id": recorded_by_user_id,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_payments"].insert_one(doc)
    return _map_id(doc)


async def update_payment(db_name: str, *, payment_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_payments", document_id=payment_id, data=data)


async def list_refunds(db_name: str, *, order_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query = {"order_id": order_id} if order_id else {}
    cursor = db["commerce_refunds"].find(query).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_refund(
    db_name: str,
    *,
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
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "order_id": order_id,
        "payment_id": payment_id,
        "amount_minor": amount_minor,
        "currency": currency,
        "reason": reason,
        "reference": reference,
        "status": status,
        "refunded_at": refunded_at,
        "recorded_by_user_id": recorded_by_user_id,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_refunds"].insert_one(doc)
    return _map_id(doc)


async def list_invoices(db_name: str, *, order_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query = {"order_id": order_id} if order_id else {}
    cursor = db["commerce_invoices"].find(query).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_invoice(
    db_name: str,
    *,
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
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "order_id": order_id,
        "customer_id": customer_id,
        "invoice_number": invoice_number,
        "status": status,
        "currency": currency,
        "subtotal_minor": subtotal_minor,
        "discount_minor": discount_minor,
        "tax_minor": tax_minor,
        "total_minor": total_minor,
        "issued_at": issued_at,
        "issued_by_user_id": issued_by_user_id,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_invoices"].insert_one(doc)
    return _map_id(doc)


async def list_returns(db_name: str, *, order_id: str | None = None) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query = {"order_id": order_id} if order_id else {}
    cursor = db["commerce_returns"].find(query).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_return(
    db_name: str,
    *,
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
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "order_id": order_id,
        "return_number": return_number,
        "status": status,
        "reason_summary": reason_summary,
        "notes": notes,
        "inventory_restocked": inventory_restocked,
        "requested_at": requested_at,
        "approved_at": approved_at,
        "received_at": received_at,
        "closed_at": closed_at,
        "created_by_user_id": created_by_user_id,
        "closed_by_user_id": closed_by_user_id,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_returns"].insert_one(doc)
    return _map_id(doc)


async def list_return_lines(db_name: str, *, return_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not return_ids:
        return []
    cursor = db["commerce_return_lines"].find({"return_id": {"$in": return_ids}}).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=5000))


async def create_return_line(
    db_name: str,
    *,
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
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "return_id": return_id,
        "order_line_id": order_line_id,
        "variant_id": variant_id,
        "quantity": quantity,
        "resolution_type": resolution_type,
        "replacement_variant_id": replacement_variant_id,
        "restock_on_receive": restock_on_receive,
        "line_amount_minor": line_amount_minor,
        "notes": notes,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_return_lines"].insert_one(doc)
    return _map_id(doc)


async def update_return(db_name: str, *, return_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_returns", document_id=return_id, data=data)


async def list_settlements(db_name: str) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["commerce_settlements"].find().sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=1000))


async def create_settlement(
    db_name: str,
    *,
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
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "settlement_number": settlement_number,
        "provider": provider,
        "settlement_reference": settlement_reference,
        "currency": currency,
        "status": status,
        "payments_minor": payments_minor,
        "refunds_minor": refunds_minor,
        "fees_minor": fees_minor,
        "adjustments_minor": adjustments_minor,
        "net_minor": net_minor,
        "reported_at": reported_at,
        "reconciled_at": reconciled_at,
        "closed_at": closed_at,
        "notes": notes,
        "created_by_user_id": created_by_user_id,
        "closed_by_user_id": closed_by_user_id,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_settlements"].insert_one(doc)
    return _map_id(doc)


async def list_settlement_entries(db_name: str, *, settlement_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not settlement_ids:
        return []
    cursor = db["commerce_settlement_entries"].find({"settlement_id": {"$in": settlement_ids}}).sort("created_at", 1)
    return _map_ids(await cursor.to_list(length=5000))


async def list_settlement_entries_for_payment_ids(db_name: str, *, payment_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not payment_ids:
        return []
    cursor = db["commerce_settlement_entries"].find({"payment_id": {"$in": payment_ids}})
    return _map_ids(await cursor.to_list(length=5000))


async def list_settlement_entries_for_refund_ids(db_name: str, *, refund_ids: list[str]) -> list[dict[str, Any]]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    if not refund_ids:
        return []
    cursor = db["commerce_settlement_entries"].find({"refund_id": {"$in": refund_ids}})
    return _map_ids(await cursor.to_list(length=5000))


async def create_settlement_entry(
    db_name: str,
    *,
    settlement_id: str,
    entry_type: str,
    payment_id: str | None,
    refund_id: str | None,
    amount_minor: int,
    label: str | None,
    notes: str | None,
) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = {
        "_id": str(uuid4()),
        "settlement_id": settlement_id,
        "entry_type": entry_type,
        "payment_id": payment_id,
        "refund_id": refund_id,
        "amount_minor": amount_minor,
        "label": label,
        "notes": notes,
        "created_at": datetime.now(tz=UTC),
        "updated_at": datetime.now(tz=UTC),
    }
    await db["commerce_settlement_entries"].insert_one(doc)
    return _map_id(doc)


async def update_settlement(db_name: str, *, settlement_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    return await _update_by_id(db_name, "commerce_settlements", document_id=settlement_id, data=data)
# --- Cart ---
async def get_cart_by_session_id(db_name: str, session_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["commerce_carts"].find_one({"sessionId": session_id})
    return _map_id(doc)

async def get_cart_by_user_id(db_name: str, user_id: str) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
        doc = await db["commerce_carts"].find_one({"userId": oid})
    except Exception:
        doc = await db["commerce_carts"].find_one({"userId": user_id})
    return _map_id(doc)

async def create_cart(db_name: str, data: dict[str, Any]) -> dict[str, Any]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    data["createdAt"] = datetime.now(tz=UTC)
    data["updatedAt"] = datetime.now(tz=UTC)
    if "userId" in data and isinstance(data["userId"], str):
        from bson import ObjectId
        try:
            data["userId"] = ObjectId(data["userId"])
        except Exception:
            pass
            
    result = await db["commerce_carts"].insert_one(data)
    data["id"] = str(result.inserted_id)
    return data

async def update_cart(db_name: str, cart_id: str, data: dict[str, Any]) -> dict[str, Any] | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    data["updatedAt"] = datetime.now(tz=UTC)
    try:
        oid = ObjectId(cart_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": cart_id}
    
    result = await db["commerce_carts"].find_one_and_update(
        query,
        {"$set": data},
        return_document=True
    )
    return _map_id(result)

async def delete_cart(db_name: str, cart_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(cart_id)
        query = {"_id": oid}
    except Exception:
        query = {"_id": cart_id}
    result = await db["commerce_carts"].delete_one(query)
    return result.deleted_count > 0

async def delete_cart_by_session_id(db_name: str, session_id: str) -> bool:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    result = await db["commerce_carts"].delete_one({"sessionId": session_id})
    return result.deleted_count > 0
