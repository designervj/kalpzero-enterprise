from datetime import datetime, UTC
from uuid import uuid4
from typing import Any

from app.core.config import get_settings
from app.db.mongo import get_runtime_motor_database
from app.models.travel import (
    TravelPackage,
    TravelItineraryDay,
    TravelDeparture,
    TravelLead,
    TRAVEL_MODELS
)

def _map_id(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    # Support both _id as ObjectId and _id as string
    doc["id"] = str(doc.pop("_id"))
    return doc

def _map_ids(docs: list[dict]) -> list[dict]:
    return [_map_id(doc) for doc in docs]


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
    update_data["updatedAt"] = datetime.now(tz=UTC)
    for candidate in _id_candidates(document_id):
        result = await collection.update_one({"_id": candidate}, {"$set": update_data})
        if result.matched_count:
            return await _find_one_by_id(db_name, collection_name, document_id)
    return None


async def list_packages(db_name: str) -> list[TravelPackage]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["travel_packages"].find().sort("createdAt", -1)
    packages = await cursor.to_list(length=1000)
    return [TravelPackage(**_map_id(doc)) for doc in packages]

async def get_package(db_name: str, *, package_id: str) -> TravelPackage | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(package_id)
        doc = await db["travel_packages"].find_one({"_id": oid})
    except Exception:
        doc = await db["travel_packages"].find_one({"_id": package_id})
    return TravelPackage(**_map_id(doc)) if doc else None

async def find_package_by_code(db_name: str, *, code: str) -> TravelPackage | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["travel_packages"].find_one({"code": code})
    return TravelPackage(**_map_id(doc)) if doc else None

async def find_package_by_slug(db_name: str, *, slug: str) -> TravelPackage | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["travel_packages"].find_one({"slug": slug})
    return TravelPackage(**_map_id(doc)) if doc else None

async def create_package(
    db_name: str,
    *,
    code: str,
    slug: str,
    title: str,
    summary: str | None,
    origin_city: str,
    destination_city: str,
    destination_country: str,
    duration_days: int,
    base_price_minor: int,
    currency: str,
    status: str) -> TravelPackage:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    pkg_id = str(uuid4())
    doc = {
        "_id": pkg_id,
        "code": code,
        "slug": slug,
        "title": title,
        "summary": summary,
        "origin_city": origin_city,
        "destination_city": destination_city,
        "destination_country": destination_country,
        "duration_days": duration_days,
        "base_price_minor": base_price_minor,
        "currency": currency,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["travel_packages"].insert_one(doc)
    return TravelPackage(**_map_id(doc))

async def list_itinerary_days(
    db_name: str,
    *,
    package_ids: list[str]) -> list[TravelItineraryDay]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["travel_itinerary_days"].find({"package_id": {"$in": package_ids}}).sort("day_number", 1)
    days = await cursor.to_list(length=1000)
    return [TravelItineraryDay(**_map_id(doc)) for doc in days]

async def create_itinerary_day(
    db_name: str,
    *,
    package_id: str,
    day_number: int,
    title: str,
    summary: str,
    hotel_ref_id: str | None,
    activity_ref_ids: list[str],
    transfer_ref_ids: list[str]) -> TravelItineraryDay:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    day_id = str(uuid4())
    doc = {
        "_id": day_id,
        "package_id": package_id,
        "day_number": day_number,
        "title": title,
        "summary": summary,
        "hotel_ref_id": hotel_ref_id,
        "activity_ref_ids": activity_ref_ids,
        "transfer_ref_ids": transfer_ref_ids,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["travel_itinerary_days"].insert_one(doc)
    return TravelItineraryDay(**_map_id(doc))

async def list_departures(
    db_name: str,
    *,
    package_id: str | None = None,
    status: str | None = None) -> list[TravelDeparture]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if package_id:
        filter_query["package_id"] = package_id
    if status:
        filter_query["status"] = status
    cursor = db["travel_departures"].find(filter_query).sort("departure_date", 1)
    departures = await cursor.to_list(length=1000)
    return [TravelDeparture(**_map_id(doc)) for doc in departures]

async def get_departure(db_name: str, *, departure_id: str) -> TravelDeparture | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(departure_id)
        doc = await db["travel_departures"].find_one({"_id": oid})
    except Exception:
        doc = await db["travel_departures"].find_one({"_id": departure_id})
    return TravelDeparture(**_map_id(doc)) if doc else None

async def create_departure(
    db_name: str,
    *,
    package_id: str,
    departure_date: datetime,
    return_date: datetime,
    seats_total: int,
    seats_available: int,
    price_override_minor: int | None,
    status: str) -> TravelDeparture:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    dep_id = str(uuid4())
    doc = {
        "_id": dep_id,
        "package_id": package_id,
        "departure_date": departure_date.isoformat() if hasattr(departure_date, "isoformat") else departure_date,
        "return_date": return_date.isoformat() if hasattr(return_date, "isoformat") else return_date,
        "seats_total": seats_total,
        "seats_available": seats_available,
        "price_override_minor": price_override_minor,
        "status": status,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["travel_departures"].insert_one(doc)
    return TravelDeparture(**_map_id(doc))


async def update_departure(db_name: str, *, departure_id: str, data: dict[str, Any]) -> TravelDeparture | None:
    doc = await _update_by_id(db_name, "travel_departures", document_id=departure_id, data=data)
    return TravelDeparture(**doc) if doc else None

async def list_leads(
    db_name: str,
    *,
    status: str | None = None,
    interested_package_id: str | None = None) -> list[TravelLead]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if status:
        filter_query["status"] = status
    if interested_package_id:
        filter_query["interested_package_id"] = interested_package_id
    cursor = db["travel_leads"].find(filter_query).sort("createdAt", -1)
    leads = await cursor.to_list(length=1000)
    return [TravelLead(**_map_id(doc)) for doc in leads]

async def get_lead(db_name: str, *, lead_id: str) -> TravelLead | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(lead_id)
        doc = await db["travel_leads"].find_one({"_id": oid})
    except Exception:
        doc = await db["travel_leads"].find_one({"_id": lead_id})
    return TravelLead(**_map_id(doc)) if doc else None

async def create_lead(
    db_name: str,
    *,
    source: str,
    interested_package_id: str | None,
    departure_id: str | None,
    customer_id: str | None,
    contact_name: str,
    contact_phone: str,
    travelers_count: int,
    desired_departure_date: datetime | None,
    budget_minor: int | None,
    currency: str,
    status: str,
    notes: str | None) -> TravelLead:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    lead_id = str(uuid4())
    doc = {
        "_id": lead_id,
        "source": source,
        "interested_package_id": interested_package_id,
        "departure_id": departure_id,
        "customer_id": customer_id,
        "contact_name": contact_name,
        "contact_phone": contact_phone,
        "travelers_count": travelers_count,
        "desired_departure_date": desired_departure_date.isoformat() if hasattr(desired_departure_date, "isoformat") else desired_departure_date,
        "budget_minor": budget_minor,
        "currency": currency,
        "status": status,
        "notes": notes,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["travel_leads"].insert_one(doc)
    return TravelLead(**_map_id(doc))


async def update_lead(db_name: str, *, lead_id: str, data: dict[str, Any]) -> TravelLead | None:
    doc = await _update_by_id(db_name, "travel_leads", document_id=lead_id, data=data)
    return TravelLead(**doc) if doc else None
