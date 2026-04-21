import re
from datetime import date, datetime, UTC
from uuid import uuid4
from typing import Any

from app.core.config import get_settings
from app.db.mongo import get_runtime_motor_database
from app.models.hotel import (
    HotelAvailabilityRule,
    HotelFolio,
    HotelFolioCharge,
    HotelGuestDocument,
    HotelGuestProfile,
    HotelHousekeepingTask,
    HotelMaintenanceTicket,
    HotelMealPlan,
    HotelNightAudit,
    HotelPayment,
    HotelProperty,
    HotelRatePlan,
    HotelRefund,
    HotelReservation,
    HotelRoom,
    HotelRoomMove,
    HotelRoomType,
    HotelStaffMember,
    HotelStay,
    HotelShift,
    HotelNightAudit,
    HOTEL_MODELS,
    HotelStay,
    HotelStaffMember,
)

def _map_id(doc: dict | None) -> dict | None:
    if doc is None:
        return None
    # Ensure id mapping for Pydantic (aliases or direct)
    doc["id"] = str(doc.pop("_id"))
    return doc

def _map_ids(docs: list[dict]) -> list[dict]:
    return [_map_id(doc) for doc in docs]

async def list_properties(db_name: str) -> list[HotelProperty]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["hotel_properties"].find().sort("createdAt", -1)
    properties = await cursor.to_list(length=1000)
    return [HotelProperty(**_map_id(doc)) for doc in properties]

async def get_property(db_name: str, *, property_id: str) -> HotelProperty | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(property_id)
        prop = await db["hotel_properties"].find_one({"_id": oid})
    except Exception:
        prop = await db["hotel_properties"].find_one({"_id": property_id})
    return HotelProperty(**_map_id(prop)) if prop else None

async def find_property_by_code(db_name: str, *, code: str) -> HotelProperty | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    prop = await db["hotel_properties"].find_one({"code": code})
    return HotelProperty(**_map_id(prop)) if prop else None

async def create_property(
    db_name: str,
    *,
    name: str,
    code: str,
    city: str,
    country: str,
    timezone: str) -> HotelProperty:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    prop_id = str(uuid4())
    doc = {
        "_id": prop_id,
        "name": name,
        "code": code,
        "city": city,
        "country": country,
        "timezone": timezone,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_properties"].insert_one(doc)
    return HotelProperty(**_map_id(doc))

async def list_room_types(
    db_name: str,
    *,
    property_id: str | None = None) -> list[HotelRoomType]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    cursor = db["hotel_room_types"].find(filter_query).sort("createdAt", -1)
    room_types = await cursor.to_list(length=1000)
    return [HotelRoomType(**_map_id(doc)) for doc in room_types]

async def get_room_type(db_name: str, *, room_type_id: str) -> HotelRoomType | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(room_type_id)
        rt = await db["hotel_room_types"].find_one({"_id": oid})
    except Exception:
        rt = await db["hotel_room_types"].find_one({"_id": room_type_id})
    return HotelRoomType(**_map_id(rt)) if rt else None

async def find_room_type_by_code(
    db_name: str,
    *,
    property_id: str,
    code: str) -> HotelRoomType | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    rt = await db["hotel_room_types"].find_one({
        "property_id": property_id,
        "code": code
    })
    return HotelRoomType(**_map_id(rt)) if rt else None

async def create_room_type(
    db_name: str,
    *,
    property_id: str,
    name: str,
    code: str,
    category: str | None,
    bed_type: str | None,
    occupancy: int,
    room_size_sqm: int | None,
    base_rate_minor: int,
    extra_bed_price_minor: int,
    refundable: bool,
    currency: str,
    amenity_ids: list[str]) -> HotelRoomType:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    rt_id = str(uuid4())
    doc = {
        "_id": rt_id,
        "property_id": property_id,
        "name": name,
        "code": code,
        "category": category,
        "bed_type": bed_type,
        "occupancy": occupancy,
        "room_size_sqm": room_size_sqm,
        "base_rate_minor": base_rate_minor,
        "extra_bed_price_minor": extra_bed_price_minor,
        "refundable": refundable,
        "currency": currency,
        "amenity_ids": amenity_ids,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_room_types"].insert_one(doc)
    return HotelRoomType(**_map_id(doc))

async def list_rooms(
    db_name: str,
    *,
    property_id: str | None = None) -> list[HotelRoom]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    cursor = db["hotel_rooms"].find(filter_query).sort("createdAt", -1)
    rooms = await cursor.to_list(length=1000)
    return [HotelRoom(**_map_id(doc)) for doc in rooms]

async def get_room(db_name: str, *, room_id: str) -> HotelRoom | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(room_id)
        rm = await db["hotel_rooms"].find_one({"_id": oid})
    except Exception:
        rm = await db["hotel_rooms"].find_one({"_id": room_id})
    return HotelRoom(**_map_id(rm)) if rm else None

async def find_room_by_number(
    db_name: str,
    *,
    property_id: str,
    room_number: str) -> HotelRoom | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    rm = await db["hotel_rooms"].find_one({
        "property_id": property_id,
        "room_number": room_number
    })
    return HotelRoom(**_map_id(rm)) if rm else None

async def create_room(
    db_name: str,
    *,
    property_id: str,
    room_type_id: str,
    room_number: str,
    status: str,
    occupancy_status: str,
    housekeeping_status: str,
    sell_status: str,
    is_active: bool,
    feature_tags: list[str],
    notes: str | None,
    last_cleaned_at: str | None,
    floor_label: str | None) -> HotelRoom:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    rm_id = str(uuid4())
    doc = {
        "_id": rm_id,
        "property_id": property_id,
        "room_type_id": room_type_id,
        "room_number": room_number,
        "status": status,
        "occupancy_status": occupancy_status,
        "housekeeping_status": housekeeping_status,
        "sell_status": sell_status,
        "is_active": is_active,
        "feature_tags": feature_tags,
        "notes": notes,
        "last_cleaned_at": last_cleaned_at,
        "floor_label": floor_label,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_rooms"].insert_one(doc)
    return HotelRoom(**_map_id(doc))

async def list_meal_plans(
    db_name: str,
    *,
    property_id: str | None = None) -> list[HotelMealPlan]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    cursor = db["hotel_meal_plans"].find(filter_query).sort("createdAt", -1)
    meal_plans = await cursor.to_list(length=1000)
    return [HotelMealPlan(**_map_id(doc)) for doc in meal_plans]

async def get_meal_plan(db_name: str, *, meal_plan_id: str) -> HotelMealPlan | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(meal_plan_id)
        item = await db["hotel_meal_plans"].find_one({"_id": oid})
    except Exception:
        item = await db["hotel_meal_plans"].find_one({"_id": meal_plan_id})
    return HotelMealPlan(**_map_id(item)) if item else None

async def find_meal_plan_by_code(
    db_name: str,
    *,
    property_id: str,
    code: str) -> HotelMealPlan | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    item = await db["hotel_meal_plans"].find_one({
        "property_id": property_id,
        "code": code
    })
    return HotelMealPlan(**_map_id(item)) if item else None

async def create_meal_plan(
    db_name: str,
    *,
    property_id: str,
    code: str,
    name: str,
    description: str | None,
    price_per_person_per_night_minor: int,
    currency: str,
    included_meals: list[str],
    is_active: bool) -> HotelMealPlan:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    mp_id = str(uuid4())
    doc = {
        "_id": mp_id,
        "property_id": property_id,
        "code": code,
        "name": name,
        "description": description,
        "price_per_person_per_night_minor": price_per_person_per_night_minor,
        "currency": currency,
        "included_meals": included_meals,
        "is_active": is_active,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_meal_plans"].insert_one(doc)
    return HotelMealPlan(**_map_id(doc))

async def list_guest_profiles(db_name: str) -> list[HotelGuestProfile]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["hotel_guest_profiles"].find().sort("createdAt", -1)
    profiles = await cursor.to_list(length=1000)
    return [HotelGuestProfile(**_map_id(doc)) for doc in profiles]

async def get_guest_profile(db_name: str, *, profile_id: str) -> HotelGuestProfile | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(profile_id)
        p = await db["hotel_guest_profiles"].find_one({"_id": oid})
    except Exception:
        p = await db["hotel_guest_profiles"].find_one({"_id": profile_id})
    return HotelGuestProfile(**_map_id(p)) if p else None

async def find_guest_profile_by_email(db_name: str, *, email: str) -> HotelGuestProfile | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    p = await db["hotel_guest_profiles"].find_one({"email": email})
    return HotelGuestProfile(**_map_id(p)) if p else None

async def create_guest_profile(
    db_name: str,
    *,
    first_name: str,
    last_name: str,
    email: str,
    phone: str,
    nationality: str | None,
    loyalty_tier: str | None,
    vip: bool,
    preferred_room_type_id: str | None,
    dietary_preference: str | None,
    company_name: str | None,
    identity_document_number: str | None,
    notes: str | None) -> HotelGuestProfile:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    p_id = str(uuid4())
    doc = {
        "_id": p_id,
        "first_name": first_name,
        "last_name": last_name,
        "email": email,
        "phone": phone,
        "nationality": nationality,
        "loyalty_tier": loyalty_tier,
        "vip": vip,
        "preferred_room_type_id": preferred_room_type_id,
        "dietary_preference": dietary_preference,
        "company_name": company_name,
        "identity_document_number": identity_document_number,
        "notes": notes,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_guest_profiles"].insert_one(doc)
    return HotelGuestProfile(**_map_id(doc))

async def list_rate_plans(
    db_name: str,
    *,
    property_id: str | None = None,
    room_type_id: str | None = None) -> list[HotelRatePlan]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if room_type_id:
        filter_query["room_type_id"] = room_type_id
    cursor = db["hotel_rate_plans"].find(filter_query).sort("createdAt", -1)
    plans = await cursor.to_list(length=1000)
    return [HotelRatePlan(**_map_id(doc)) for doc in plans]

async def get_rate_plan(db_name: str, *, rate_plan_id: str) -> HotelRatePlan | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(rate_plan_id)
        p = await db["hotel_rate_plans"].find_one({"_id": oid})
    except Exception:
        p = await db["hotel_rate_plans"].find_one({"_id": rate_plan_id})
    return HotelRatePlan(**_map_id(p)) if p else None

async def create_rate_plan(
    db_name: str,
    *,
    property_id: str,
    room_type_id: str,
    label: str,
    currency: str,
    weekend_enabled: bool,
    weekend_rate_minor: int | None,
    seasonal_overrides: list[dict[str, Any]],
    is_active: bool) -> HotelRatePlan:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    rp_id = str(uuid4())
    doc = {
        "_id": rp_id,
        "property_id": property_id,
        "room_type_id": room_type_id,
        "label": label,
        "currency": currency,
        "weekend_enabled": weekend_enabled,
        "weekend_rate_minor": weekend_rate_minor,
        "seasonal_overrides": seasonal_overrides,
        "is_active": is_active,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_rate_plans"].insert_one(doc)
    return HotelRatePlan(**_map_id(doc))

async def list_availability_rules(
    db_name: str,
    *,
    property_id: str | None = None,
    room_type_id: str | None = None) -> list[HotelAvailabilityRule]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if room_type_id:
        filter_query["room_type_id"] = room_type_id
    cursor = db["hotel_availability_rules"].find(filter_query).sort("createdAt", -1)
    rules = await cursor.to_list(length=1000)
    return [HotelAvailabilityRule(**_map_id(doc)) for doc in rules]

async def get_availability_rule(db_name: str, *, rule_id: str) -> HotelAvailabilityRule | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(rule_id)
        r = await db["hotel_availability_rules"].find_one({"_id": oid})
    except Exception:
        r = await db["hotel_availability_rules"].find_one({"_id": rule_id})
    return HotelAvailabilityRule(**_map_id(r)) if r else None

async def create_availability_rule(
    db_name: str,
    *,
    property_id: str,
    room_type_id: str,
    total_units: int,
    available_units_snapshot: int | None = None,
    minimum_stay_nights: int = 1,
    maximum_stay_nights: int = 14,
    blackout_dates: list[str] = None,
    is_active: bool = True) -> HotelAvailabilityRule:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    rule_id = str(uuid4())
    doc = {
        "_id": rule_id,
        "property_id": property_id,
        "room_type_id": room_type_id,
        "total_units": total_units,
        "available_units_snapshot": available_units_snapshot,
        "minimum_stay_nights": minimum_stay_nights,
        "maximum_stay_nights": maximum_stay_nights,
        "blackout_dates": blackout_dates or [],
        "is_active": is_active,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_availability_rules"].insert_one(doc)
    return HotelAvailabilityRule(**_map_id(doc))

# Add missing methods for hotel service compatibility
async def list_reservations(db_name: str, *, property_id: str | None = None, status: str | None = None) -> list[HotelReservation]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_reservations"].find(filter_query).sort("createdAt", -1)
    reservations = await cursor.to_list(length=1000)
    return [HotelReservation(**_map_id(doc)) for doc in reservations]

async def get_reservation(db_name: str, *, reservation_id: str) -> HotelReservation | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(reservation_id)
        r = await db["hotel_reservations"].find_one({"_id": oid})
    except Exception:
        r = await db["hotel_reservations"].find_one({"_id": reservation_id})
    return HotelReservation(**_map_id(r)) if r else None

async def create_reservation(db_name: str, **kwargs) -> HotelReservation:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    res_id = str(uuid4())
    doc = {
        "_id": res_id,
        **kwargs,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC)
    }
    await db["hotel_reservations"].insert_one(doc)
    return HotelReservation(**_map_id(doc))

async def list_stays(db_name: str, *, property_id: str | None = None, status: str | None = None) -> list[HotelStay]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_stays"].find(filter_query).sort("createdAt", -1)
    stays = await cursor.to_list(length=1000)
    return [HotelStay(**_map_id(doc)) for doc in stays]

async def get_stay(db_name: str, *, stay_id: str) -> HotelStay | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(stay_id)
        s = await db["hotel_stays"].find_one({"_id": oid})
    except Exception:
        s = await db["hotel_stays"].find_one({"_id": stay_id})
    return HotelStay(**_map_id(s)) if s else None

async def list_folios(db_name: str, *, property_id: str | None = None, reservation_id: str | None = None, status: str | None = None) -> list[HotelFolio]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if reservation_id:
        filter_query["reservation_id"] = reservation_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_folios"].find(filter_query).sort("createdAt", -1)
    folios = await cursor.to_list(length=1000)
    return [HotelFolio(**_map_id(doc)) for doc in folios]

async def get_folio(db_name: str, *, folio_id: str) -> HotelFolio | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(folio_id)
        f = await db["hotel_folios"].find_one({"_id": oid})
    except Exception:
        f = await db["hotel_folios"].find_one({"_id": folio_id})
    return HotelFolio(**_map_id(f)) if f else None

async def list_folio_charges(db_name: str, *, folio_id: str) -> list[HotelFolioCharge]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["hotel_folio_charges"].find({"folio_id": folio_id}).sort("createdAt", 1)
    charges = await cursor.to_list(length=1000)
    return [HotelFolioCharge(**_map_id(doc)) for doc in charges]

async def list_payments(db_name: str, *, property_id: str | None = None, folio_id: str | None = None) -> list[HotelPayment]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if folio_id:
        filter_query["folio_id"] = folio_id
    cursor = db["hotel_payments"].find(filter_query).sort("createdAt", -1)
    payments = await cursor.to_list(length=1000)
    return [HotelPayment(**_map_id(doc)) for doc in payments]

async def get_payment(db_name: str, *, payment_id: str) -> HotelPayment | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(payment_id)
        p = await db["hotel_payments"].find_one({"_id": oid})
    except Exception:
        p = await db["hotel_payments"].find_one({"_id": payment_id})
    return HotelPayment(**_map_id(p)) if p else None

async def list_refunds(db_name: str, *, property_id: str | None = None, folio_id: str | None = None) -> list[HotelPayment]:
    # Reuse HotelPayment for refunds if appropriate or use specific model
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if folio_id:
        filter_query["folio_id"] = folio_id
    cursor = db["hotel_refunds"].find(filter_query).sort("createdAt", -1)
    refunds = await cursor.to_list(length=1000)
    return [HotelPayment(**_map_id(doc)) for doc in refunds]

async def list_staff_members(db_name: str, *, property_id: str | None = None) -> list[HotelStaffMember]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    cursor = db["hotel_staff_members"].find(filter_query).sort("createdAt", -1)
    staff = await cursor.to_list(length=1000)
    return [HotelStaffMember(**_map_id(doc)) for doc in staff]

async def get_staff_member(db_name: str, *, staff_member_id: str) -> HotelStaffMember | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    from bson import ObjectId
    try:
        oid = ObjectId(staff_member_id)
        s = await db["hotel_staff_members"].find_one({"_id": oid})
    except Exception:
        s = await db["hotel_staff_members"].find_one({"_id": staff_member_id})
    return HotelStaffMember(**_map_id(s)) if s else None

async def list_shifts(db_name: str, *, property_id: str | None = None, staff_member_id: str | None = None, shift_date: date | None = None) -> list[HotelShift]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if staff_member_id:
        filter_query["staff_member_id"] = staff_member_id
    if shift_date:
        filter_query["shift_date"] = datetime.combine(shift_date, datetime.min.time())
    cursor = db["hotel_shifts"].find(filter_query).sort("createdAt", -1)
    shifts = await cursor.to_list(length=1000)
    return [HotelShift(**_map_id(doc)) for doc in shifts]

async def list_night_audits(db_name: str, *, property_id: str | None = None) -> list[HotelNightAudit]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    cursor = db["hotel_night_audits"].find(filter_query).sort("createdAt", -1)
    audits = await cursor.to_list(length=1000)
    return [HotelNightAudit(**_map_id(doc)) for doc in audits]

async def list_housekeeping_tasks(db_name: str, *, property_id: str | None = None, status: str | None = None) -> list[dict]:
    # Using dict for some complex operational models if they don't have Pydantic models yet
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_housekeeping_tasks"].find(filter_query).sort("createdAt", -1)
    tasks = await cursor.to_list(length=1000)
    return _map_ids(tasks)

async def list_maintenance_tickets(db_name: str, *, property_id: str | None = None, status: str | None = None) -> list[dict]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_maintenance_tickets"].find(filter_query).sort("createdAt", -1)
    tickets = await cursor.to_list(length=1000)
    return _map_ids(tickets)

async def list_guest_documents(db_name: str, *, guest_profile_id: str) -> list[HotelGuestDocument]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["hotel_guest_documents"].find({"guest_profile_id": guest_profile_id}).sort("createdAt", -1)
    docs = await cursor.to_list(length=1000)
    return [HotelGuestDocument(**_map_id(doc)) for doc in docs]


def _id_candidates(document_id: str) -> list[object]:
    candidates: list[object] = [document_id]
    try:
        from bson import ObjectId

        candidates.insert(0, ObjectId(document_id))
    except Exception:
        pass
    return candidates


def _normalize_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _normalize_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_normalize_value(item) for item in value]
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def _normalize_payload(data: dict[str, Any]) -> dict[str, Any]:
    return {key: _normalize_value(value) for key, value in data.items()}


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
    update_data = _normalize_payload(data)
    update_data["updatedAt"] = datetime.now(tz=UTC)
    for candidate in _id_candidates(document_id):
        result = await collection.update_one({"_id": candidate}, {"$set": update_data})
        if result.matched_count:
            return await _find_one_by_id(db_name, collection_name, document_id)
    return None


async def get_guest_profile(
    db_name: str,
    *,
    guest_profile_id: str | None = None,
    profile_id: str | None = None,
) -> HotelGuestProfile | None:
    resolved_id = guest_profile_id or profile_id
    if resolved_id is None:
        return None
    doc = await _find_one_by_id(db_name, "hotel_guest_profiles", resolved_id)
    return HotelGuestProfile(**doc) if doc else None


async def find_rate_plan_by_label(db_name: str, *, room_type_id: str, label: str) -> HotelRatePlan | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["hotel_rate_plans"].find_one({"room_type_id": room_type_id, "label": label})
    return HotelRatePlan(**_map_id(doc)) if doc else None


async def find_availability_rule_by_room_type(db_name: str, *, room_type_id: str) -> HotelAvailabilityRule | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["hotel_availability_rules"].find_one({"room_type_id": room_type_id})
    return HotelAvailabilityRule(**_map_id(doc)) if doc else None


async def find_conflicting_reservation(
    db_name: str,
    *,
    room_id: str,
    check_in_date: date,
    check_out_date: date,
    exclude_reservation_id: str | None = None,
) -> HotelReservation | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    query: dict[str, Any] = {
        "room_id": room_id,
        "status": {"$in": ["pending", "reserved", "checked_in"]},
        "check_in_date": {"$lt": check_out_date.isoformat()},
        "check_out_date": {"$gt": check_in_date.isoformat()},
    }
    if exclude_reservation_id is not None:
        query["_id"] = {"$ne": exclude_reservation_id}
    doc = await db["hotel_reservations"].find_one(query)
    return HotelReservation(**_map_id(doc)) if doc else None


async def create_reservation(db_name: str, **kwargs: Any) -> HotelReservation:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    reservation_id = str(uuid4())
    payload = _normalize_payload(dict(kwargs))
    payload["booking_reference"] = payload.get("booking_reference") or f"HK-{reservation_id[:8].upper()}"
    doc = {
        "_id": reservation_id,
        **payload,
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_reservations"].insert_one(doc)
    return HotelReservation(**_map_id(doc))


async def update_reservation(db_name: str, *, reservation_id: str, data: dict[str, Any]) -> HotelReservation | None:
    doc = await _update_by_id(db_name, "hotel_reservations", document_id=reservation_id, data=data)
    return HotelReservation(**doc) if doc else None


async def create_folio(db_name: str, **kwargs: Any) -> HotelFolio:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    folio_id = str(uuid4())
    doc = {
        "_id": folio_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_folios"].insert_one(doc)
    return HotelFolio(**_map_id(doc))


async def update_folio(db_name: str, *, folio_id: str, data: dict[str, Any]) -> HotelFolio | None:
    doc = await _update_by_id(db_name, "hotel_folios", document_id=folio_id, data=data)
    return HotelFolio(**doc) if doc else None


async def create_folio_charge(db_name: str, **kwargs: Any) -> HotelFolioCharge:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    charge_id = str(uuid4())
    doc = {
        "_id": charge_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_folio_charges"].insert_one(doc)
    return HotelFolioCharge(**_map_id(doc))


async def create_payment(db_name: str, **kwargs: Any) -> HotelPayment:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    payment_id = str(uuid4())
    doc = {
        "_id": payment_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_payments"].insert_one(doc)
    return HotelPayment(**_map_id(doc))


async def create_refund(db_name: str, **kwargs: Any) -> HotelRefund:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    refund_id = str(uuid4())
    doc = {
        "_id": refund_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_refunds"].insert_one(doc)
    return HotelRefund(**_map_id(doc))


async def list_refunds(db_name: str, *, property_id: str | None = None, folio_id: str | None = None) -> list[HotelRefund]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if folio_id:
        filter_query["folio_id"] = folio_id
    cursor = db["hotel_refunds"].find(filter_query).sort("createdAt", -1)
    refunds = await cursor.to_list(length=1000)
    return [HotelRefund(**_map_id(doc)) for doc in refunds]


async def create_staff_member(db_name: str, **kwargs: Any) -> HotelStaffMember:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    staff_member_id = str(uuid4())
    doc = {
        "_id": staff_member_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_staff_members"].insert_one(doc)
    return HotelStaffMember(**_map_id(doc))


async def find_staff_member_by_code(db_name: str, *, property_id: str, staff_code: str) -> HotelStaffMember | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["hotel_staff_members"].find_one({"property_id": property_id, "staff_code": staff_code})
    return HotelStaffMember(**_map_id(doc)) if doc else None


async def create_shift(db_name: str, **kwargs: Any) -> HotelShift:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    shift_id = str(uuid4())
    doc = {
        "_id": shift_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_shifts"].insert_one(doc)
    return HotelShift(**_map_id(doc))


async def list_shifts(
    db_name: str,
    *,
    property_id: str | None = None,
    staff_member_id: str | None = None,
    shift_date: date | None = None,
) -> list[HotelShift]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if staff_member_id:
        filter_query["staff_member_id"] = staff_member_id
    if shift_date:
        filter_query["shift_date"] = shift_date.isoformat()
    cursor = db["hotel_shifts"].find(filter_query).sort("createdAt", -1)
    shifts = await cursor.to_list(length=1000)
    return [HotelShift(**_map_id(doc)) for doc in shifts]


async def create_night_audit(db_name: str, **kwargs: Any) -> HotelNightAudit:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    audit_id = str(uuid4())
    doc = {
        "_id": audit_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_night_audits"].insert_one(doc)
    return HotelNightAudit(**_map_id(doc))


async def find_night_audit_by_date(db_name: str, *, property_id: str, audit_date: date) -> HotelNightAudit | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["hotel_night_audits"].find_one({"property_id": property_id, "audit_date": audit_date.isoformat()})
    return HotelNightAudit(**_map_id(doc)) if doc else None


async def create_housekeeping_task(db_name: str, **kwargs: Any) -> HotelHousekeepingTask:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    task_id = str(uuid4())
    doc = {
        "_id": task_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_housekeeping_tasks"].insert_one(doc)
    return HotelHousekeepingTask(**_map_id(doc))


async def get_housekeeping_task(db_name: str, *, task_id: str) -> HotelHousekeepingTask | None:
    doc = await _find_one_by_id(db_name, "hotel_housekeeping_tasks", task_id)
    return HotelHousekeepingTask(**doc) if doc else None


async def update_housekeeping_task(db_name: str, *, task_id: str, data: dict[str, Any]) -> HotelHousekeepingTask | None:
    doc = await _update_by_id(db_name, "hotel_housekeeping_tasks", document_id=task_id, data=data)
    return HotelHousekeepingTask(**doc) if doc else None


async def list_housekeeping_tasks(
    db_name: str,
    *,
    property_id: str | None = None,
    status: str | None = None,
) -> list[HotelHousekeepingTask]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_housekeeping_tasks"].find(filter_query).sort("createdAt", -1)
    tasks = await cursor.to_list(length=1000)
    return [HotelHousekeepingTask(**_map_id(doc)) for doc in tasks]


async def find_open_housekeeping_task(db_name: str, *, room_id: str) -> HotelHousekeepingTask | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["hotel_housekeeping_tasks"].find_one(
        {"room_id": room_id, "status": {"$in": ["pending", "in_progress"]}}
    )
    return HotelHousekeepingTask(**_map_id(doc)) if doc else None


async def create_maintenance_ticket(db_name: str, **kwargs: Any) -> HotelMaintenanceTicket:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    ticket_id = str(uuid4())
    doc = {
        "_id": ticket_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_maintenance_tickets"].insert_one(doc)
    return HotelMaintenanceTicket(**_map_id(doc))


async def get_maintenance_ticket(db_name: str, *, ticket_id: str) -> HotelMaintenanceTicket | None:
    doc = await _find_one_by_id(db_name, "hotel_maintenance_tickets", ticket_id)
    return HotelMaintenanceTicket(**doc) if doc else None


async def update_maintenance_ticket(
    db_name: str,
    *,
    ticket_id: str,
    data: dict[str, Any],
) -> HotelMaintenanceTicket | None:
    doc = await _update_by_id(db_name, "hotel_maintenance_tickets", document_id=ticket_id, data=data)
    return HotelMaintenanceTicket(**doc) if doc else None


async def list_maintenance_tickets(
    db_name: str,
    *,
    property_id: str | None = None,
    status: str | None = None,
) -> list[HotelMaintenanceTicket]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    filter_query = {}
    if property_id:
        filter_query["property_id"] = property_id
    if status:
        filter_query["status"] = status
    cursor = db["hotel_maintenance_tickets"].find(filter_query).sort("createdAt", -1)
    tickets = await cursor.to_list(length=1000)
    return [HotelMaintenanceTicket(**_map_id(doc)) for doc in tickets]


async def find_open_maintenance_tickets_for_room(db_name: str, *, room_id: str) -> list[HotelMaintenanceTicket]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["hotel_maintenance_tickets"].find(
        {"room_id": room_id, "status": {"$in": ["open", "in_progress"]}}
    ).sort("createdAt", -1)
    tickets = await cursor.to_list(length=1000)
    return [HotelMaintenanceTicket(**_map_id(doc)) for doc in tickets]


async def create_stay(db_name: str, **kwargs: Any) -> HotelStay:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    stay_id = str(uuid4())
    doc = {
        "_id": stay_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_stays"].insert_one(doc)
    return HotelStay(**_map_id(doc))


async def update_stay(db_name: str, *, stay_id: str, data: dict[str, Any]) -> HotelStay | None:
    doc = await _update_by_id(db_name, "hotel_stays", document_id=stay_id, data=data)
    return HotelStay(**doc) if doc else None


async def find_stay_by_reservation(db_name: str, *, reservation_id: str) -> HotelStay | None:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    doc = await db["hotel_stays"].find_one({"reservation_id": reservation_id})
    return HotelStay(**_map_id(doc)) if doc else None


async def create_room_move(db_name: str, **kwargs: Any) -> HotelRoomMove:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    room_move_id = str(uuid4())
    doc = {
        "_id": room_move_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_room_moves"].insert_one(doc)
    return HotelRoomMove(**_map_id(doc))


async def list_room_moves(db_name: str, *, stay_id: str) -> list[HotelRoomMove]:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    cursor = db["hotel_room_moves"].find({"stay_id": stay_id}).sort("createdAt", 1)
    room_moves = await cursor.to_list(length=1000)
    return [HotelRoomMove(**_map_id(doc)) for doc in room_moves]


async def create_guest_document(db_name: str, **kwargs: Any) -> HotelGuestDocument:
    db = get_runtime_motor_database(get_settings(), database_name=db_name)
    document_id = str(uuid4())
    doc = {
        "_id": document_id,
        **_normalize_payload(dict(kwargs)),
        "createdAt": datetime.now(tz=UTC),
        "updatedAt": datetime.now(tz=UTC),
    }
    await db["hotel_guest_documents"].insert_one(doc)
    return HotelGuestDocument(**_map_id(doc))


async def update_room(db_name: str, *, room_id: str, data: dict[str, Any]) -> HotelRoom | None:
    doc = await _update_by_id(db_name, "hotel_rooms", document_id=room_id, data=data)
    return HotelRoom(**doc) if doc else None
