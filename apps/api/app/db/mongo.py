from collections import defaultdict
from datetime import UTC, datetime
from functools import lru_cache
import re
from typing import Protocol

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import PyMongoError
from motor.motor_asyncio import AsyncIOMotorClient
from motor.core import AgnosticDatabase, AgnosticCollection
from fastapi import Depends

from app.core.config import Settings, get_settings

# Patch MotorClient to avoid issues with some libraries incorrectly checking for attributes.
if not hasattr(AsyncIOMotorClient, "append_metadata"):
    AsyncIOMotorClient.append_metadata = lambda self, metadata: None

RUNTIME_COLLECTIONS = {
    "business_blueprints": "business_blueprints",
    "site_pages": "site_pages",
    "discovery_profiles": "discovery_profiles",
    "builder_pages": "builder_pages",
    "form_responses": "form_responses",
    "ai_knowledge": "ai_knowledge_documents",
    "import_staging": "import_staging_documents",
    "discovery_ snapshots": "discovery_snapshots",
}

VERTICAL_COLLECTIONS: dict[str, list[str]] = {
    "commerce": [
        "commerce_categories",
        "commerce_brands",
        "commerce_vendors",
        "commerce_collections",
        "commerce_attributes",
        "commerce_attribute_sets",
        "commerce_products",
        "commerce_variants",
        "commerce_warehouses",
        "commerce_warehouse_stocks",
        "commerce_stock_ledger_entries",
        "commerce_product_attribute_values",
        "commerce_variant_attribute_values",
        "commerce_tax_profiles",
        "commerce_price_lists",
        "commerce_price_list_items",
        "commerce_coupons",
        "commerce_orders",
        "commerce_order_lines",
        "commerce_fulfillments",
        "commerce_fulfillment_lines",
        "commerce_shipments",
        "commerce_payments",
        "commerce_refunds",
        "commerce_invoices",
        "commerce_returns",
        "commerce_return_lines",
        "commerce_settlements",
        "commerce_settlement_entries",
    ],
    "hotel": [
        "hotel_properties",
        "hotel_room_types",
        "hotel_rooms",
        "hotel_meal_plans",
        "hotel_guest_profiles",
        "hotel_rate_plans",
        "hotel_availability_rules",
        "hotel_reservations",
        "hotel_stays",
        "hotel_room_moves",
        "hotel_guest_documents",
        "hotel_folios",
        "hotel_folio_charges",
        "hotel_payments",
        "hotel_refunds",
        "hotel_staff_members",
        "hotel_shifts",
        "hotel_night_audits",
        "hotel_housekeeping_tasks",
        "hotel_maintenance_tickets",
        "hotel_property_profiles",
        "hotel_amenity_catalogs",
        "hotel_nearby_places",
    ],
    "travel": [
        "travel_packages",
        "travel_itinerary_days",
        "travel_departures",
        "travel_leads",
    ],
}


@lru_cache
def get_mongo_client(mongo_url: str) -> MongoClient:
    return MongoClient(mongo_url, tz_aware=True)


@lru_cache
def get_motor_client(mongo_url: str) -> AsyncIOMotorClient:
    return AsyncIOMotorClient(mongo_url)


def _normalize_mongo_name_segment(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "_", value.strip().lower()).strip("_")
    return normalized or "tenant"


def build_runtime_database_name(settings: Settings, *, tenant_slug: str) -> str:
    base_name = _normalize_mongo_name_segment(settings.runtime_mongo_db)
    if tenant_slug.startswith("kp_") or tenant_slug.startswith(f"{base_name}__tenant__"):
        return tenant_slug

    tenant_name = _normalize_mongo_name_segment(tenant_slug)
    return f"{base_name}__tenant__{tenant_name}"


def get_runtime_mongo_database(settings: Settings, *, database_name: str | None = None) -> Database:
    resolved_db_name = database_name or settings.runtime_mongo_db
    return get_mongo_client(settings.runtime_mongo_url)[resolved_db_name]


def get_runtime_motor_database(settings: Settings, *, database_name: str | None = None) -> AgnosticDatabase:
    resolved_db_name = database_name or settings.runtime_mongo_db
    return get_motor_client(settings.runtime_mongo_url)[resolved_db_name]


def get_tenant_collection(settings: Settings, database_name: str, collection_name: str):
    db = get_runtime_mongo_database(settings, database_name=database_name)
    return db[collection_name]


def get_tenant_motor_collection(settings: Settings, database_name: str, collection_name: str) -> AgnosticCollection:
    db = get_runtime_motor_database(settings, database_name=database_name)
    return db[collection_name]


class RuntimeDocumentStore(Protocol):
    def get_document(self, *, collection: str, tenant_slug: str, document_key: str, database_name: str | None = None) -> dict[str, object] | None: ...

    def upsert_document(
        self,
        *,
        collection: str,
        tenant_slug: str,
        document_key: str,
        payload: dict[str, object],
        database_name: str | None = None,
    ) -> dict[str, object]: ...

    def list_documents(self, *, collection: str, tenant_slug: str, database_name: str | None = None) -> list[dict[str, object]]: ...


class MemoryRuntimeDocumentStore:
    def __init__(self) -> None:
        self._collections: dict[str, dict[str, dict[str, object]]] = defaultdict(dict)

    def _composite_key(self, tenant_slug: str, document_key: str) -> str:
        return f"{tenant_slug}:{document_key}"

    def get_document(self, *, collection: str, tenant_slug: str, document_key: str, database_name: str | None = None) -> dict[str, object] | None:
        return self._collections[collection].get(self._composite_key(tenant_slug, document_key))

    def upsert_document(
        self,
        *,
        collection: str,
        tenant_slug: str,
        document_key: str,
        payload: dict[str, object],
        database_name: str | None = None,
    ) -> dict[str, object]:
        record = {
            "_id": self._composite_key(tenant_slug, document_key),
            "tenant_slug": tenant_slug,
            "document_key": document_key,
            "payload": payload,
            "updated_at": datetime.now(tz=UTC).isoformat(),
        }
        self._collections[collection][self._composite_key(tenant_slug, document_key)] = record
        return record

    def list_documents(self, *, collection: str, tenant_slug: str, database_name: str | None = None) -> list[dict[str, object]]:
        prefix = f"{tenant_slug}:"
        return [
            record
            for key, record in self._collections[collection].items()
            if key.startswith(prefix)
        ]

    def clear(self) -> None:
        self._collections.clear()


class MongoRuntimeDocumentStore:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def _collection_name(self, collection: str) -> str:
        if collection in RUNTIME_COLLECTIONS:
            return RUNTIME_COLLECTIONS[collection]
        # Allow passing the direct collection name for vertical-specific collections
        return collection

    def _database(self, database_name: str | None = None) -> Database:
        return get_runtime_mongo_database(self.settings, database_name=database_name)

    def get_document(self, *, collection: str, tenant_slug: str, document_key: str, database_name: str | None = None) -> dict[str, object] | None:
        document = self._database(database_name=database_name)[self._collection_name(collection)].find_one(
            {"tenant_slug": tenant_slug, "document_key": document_key}
        )
        return document

    def upsert_document(
        self,
        *,
        collection: str,
        tenant_slug: str,
        document_key: str,
        payload: dict[str, object],
        database_name: str | None = None,
    ) -> dict[str, object]:
        updated_at = datetime.now(tz=UTC).isoformat()
        self._database(database_name=database_name)[self._collection_name(collection)].update_one(
            {"tenant_slug": tenant_slug, "document_key": document_key},
            {
                "$set": {
                    "tenant_slug": tenant_slug,
                    "document_key": document_key,
                    "payload": payload,
                    "updated_at": updated_at,
                }
            },
            upsert=True,
        )
        document = self.get_document(collection=collection, tenant_slug=tenant_slug, document_key=document_key, database_name=database_name)
        if document is None:
            raise RuntimeError("Mongo runtime document upsert did not return a document.")
        return document

    def list_documents(self, *, collection: str, tenant_slug: str, database_name: str | None = None) -> list[dict[str, object]]:
        cursor = self._database(database_name=database_name)[self._collection_name(collection)].find({"tenant_slug": tenant_slug})
        return list(cursor)


@lru_cache
def get_memory_document_store() -> MemoryRuntimeDocumentStore:
    return MemoryRuntimeDocumentStore()


def get_runtime_document_store(
    settings: Settings = Depends(get_settings),
) -> RuntimeDocumentStore:
    if settings.runtime_doc_store_mode == "memory":
        return get_memory_document_store()
    return MongoRuntimeDocumentStore(settings)


def provision_runtime_document_store_for_tenant(
    settings: Settings,
    *,
    tenant_slug: str,
    vertical_pack: str | None = None,
) -> dict[str, object]:
    target_collections = list(RUNTIME_COLLECTIONS.values())
    if vertical_pack and vertical_pack in VERTICAL_COLLECTIONS:
        target_collections.extend(VERTICAL_COLLECTIONS[vertical_pack])

    database_name = build_runtime_database_name(settings, tenant_slug=tenant_slug)
    if settings.runtime_doc_store_mode == "memory":
        return {
            "kind": "memory",
            "database": database_name,
            "collections": target_collections,
            "collections_created": target_collections,
            "index_strategy": "in_memory",
        }

    database = get_runtime_mongo_database(settings, database_name=database_name)
    existing_collections = set(database.list_collection_names())
    created_collections: list[str] = []

    for collection_name in target_collections:
        if collection_name not in existing_collections:
            database.create_collection(collection_name)
            created_collections.append(collection_name)

        if collection_name in RUNTIME_COLLECTIONS.values():
            database[collection_name].create_index(
                [("tenant_slug", 1), ("document_key", 1)],
                unique=True,
                name="tenant_slug_document_key_uq",
            )

    return {
        "kind": "mongo",
        "database": database.name,
        "collections": target_collections,
        "collections_created": created_collections,
        "index_strategy": "tenant_slug_document_key_unique",
    }


def describe_tenant_runtime_document_store(settings: Settings, *, tenant_slug: str) -> dict[str, object]:
    return {
        "kind": "mongo" if settings.runtime_doc_store_mode == "mongo" else "memory",
        "mode": settings.runtime_doc_store_mode,
        "database": build_runtime_database_name(settings, tenant_slug=tenant_slug),
        "collection_count": len(RUNTIME_COLLECTIONS),
        "collections": RUNTIME_COLLECTIONS,
    }


def describe_runtime_document_store(settings: Settings) -> dict[str, object]:
    return {
        "kind": "mongo",
        "mode": settings.runtime_doc_store_mode,
        "database": settings.runtime_mongo_db,
        "tenant_database_strategy": "per_tenant_database",
        "tenant_database_pattern": f"{_normalize_mongo_name_segment(settings.runtime_mongo_db)}__tenant__{{tenant_slug}}",
        "collections": RUNTIME_COLLECTIONS,
    }


def _drop_test_mongo_databases(settings: Settings) -> None:
    if settings.env not in {"test", "testing"}:
        return
    if settings.runtime_doc_store_mode != "mongo":
        return

    base_runtime_db = _normalize_mongo_name_segment(settings.runtime_mongo_db)
    tenant_prefix = f"{base_runtime_db}__tenant__"
    target_names = {
        settings.runtime_mongo_db,
        settings.ai_mongo_db,
        base_runtime_db,
        _normalize_mongo_name_segment(settings.ai_mongo_db),
    }

    client = get_mongo_client(settings.runtime_mongo_url)

    try:
        for database_name in client.list_database_names():
            if database_name in target_names or database_name.startswith(tenant_prefix):
                client.drop_database(database_name)
    except PyMongoError:
        # Keep cache clearing resilient when Mongo is unavailable; tests that
        # require Mongo will still fail at their actual call sites.
        return


def clear_mongo_cache() -> None:
    settings = get_settings()
    _drop_test_mongo_databases(settings)
    get_mongo_client.cache_clear()
    get_motor_client.cache_clear()
    get_memory_document_store.cache_clear()
