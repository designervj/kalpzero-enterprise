from __future__ import annotations

from datetime import date

from beanie.operators import In

from app.models.travel import TravelDeparture, TravelItineraryDay, TravelLead, TravelPackage


async def list_packages(db_name: str) -> list[TravelPackage]:
    return await TravelPackage.find().sort("-created_at").to_list()


async def get_package(db_name: str, *, package_id: str) -> TravelPackage | None:
    return await TravelPackage.find_one(TravelPackage.id == package_id)


async def find_package_by_code(db_name: str, *, code: str) -> TravelPackage | None:
    return await TravelPackage.find_one(TravelPackage.code == code)


async def find_package_by_slug(db_name: str, *, slug: str) -> TravelPackage | None:
    return await TravelPackage.find_one(TravelPackage.slug == slug)


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
    status: str,
) -> TravelPackage:
    model = TravelPackage(
        code=code,
        slug=slug,
        title=title,
        summary=summary,
        origin_city=origin_city,
        destination_city=destination_city,
        destination_country=destination_country,
        duration_days=duration_days,
        base_price_minor=base_price_minor,
        currency=currency,
        status=status,
    )
    await model.insert()
    return model


async def list_itinerary_days(db_name: str, *, package_ids: list[str]) -> list[TravelItineraryDay]:
    if not package_ids:
        return []
    return await TravelItineraryDay.find(In(TravelItineraryDay.package_id, package_ids)).sort(
        "package_id",
        "day_number",
    ).to_list()


async def create_itinerary_day(
    db_name: str,
    *,
    package_id: str,
    day_number: int,
    title: str,
    summary: str,
    hotel_ref_id: str | None,
    activity_ref_ids: list[str],
    transfer_ref_ids: list[str],
) -> TravelItineraryDay:
    model = TravelItineraryDay(
        package_id=package_id,
        day_number=day_number,
        title=title,
        summary=summary,
        hotel_ref_id=hotel_ref_id,
        activity_ref_ids=activity_ref_ids,
        transfer_ref_ids=transfer_ref_ids,
    )
    await model.insert()
    return model


async def list_departures(
    db_name: str,
    *,
    package_id: str | None = None,
    status: str | None = None,
) -> list[TravelDeparture]:
    query = TravelDeparture.find()
    if package_id:
        query = query.find(TravelDeparture.package_id == package_id)
    if status:
        query = query.find(TravelDeparture.status == status)
    return await query.sort("departure_date", "created_at").to_list()


async def get_departure(db_name: str, *, departure_id: str) -> TravelDeparture | None:
    return await TravelDeparture.find_one(TravelDeparture.id == departure_id)


async def create_departure(
    db_name: str,
    *,
    package_id: str,
    departure_date: date,
    return_date: date,
    seats_total: int,
    seats_available: int,
    price_override_minor: int | None,
    status: str,
) -> TravelDeparture:
    model = TravelDeparture(
        package_id=package_id,
        departure_date=departure_date,
        return_date=return_date,
        seats_total=seats_total,
        seats_available=seats_available,
        price_override_minor=price_override_minor,
        status=status,
    )
    await model.insert()
    return model


async def update_departure_status(db_name: str, *, departure_id: str, status: str) -> TravelDeparture | None:
    departure = await get_departure(db_name, departure_id=departure_id)
    if departure is None:
        return None
    departure.status = status
    await departure.save()
    return departure


async def list_leads(
    db_name: str,
    *,
    status: str | None = None,
    interested_package_id: str | None = None,
) -> list[TravelLead]:
    query = TravelLead.find()
    if status:
        query = query.find(TravelLead.status == status)
    if interested_package_id:
        query = query.find(TravelLead.interested_package_id == interested_package_id)
    return await query.sort("-created_at").to_list()


async def get_lead(db_name: str, *, lead_id: str) -> TravelLead | None:
    return await TravelLead.find_one(TravelLead.id == lead_id)


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
    desired_departure_date: date | None,
    budget_minor: int | None,
    currency: str,
    status: str,
    notes: str | None,
) -> TravelLead:
    model = TravelLead(
        source=source,
        interested_package_id=interested_package_id,
        departure_id=departure_id,
        customer_id=customer_id,
        contact_name=contact_name,
        contact_phone=contact_phone,
        travelers_count=travelers_count,
        desired_departure_date=desired_departure_date,
        budget_minor=budget_minor,
        currency=currency,
        status=status,
        notes=notes,
    )
    await model.insert()
    return model


async def update_lead_status(db_name: str, *, lead_id: str, status: str) -> TravelLead | None:
    lead = await get_lead(db_name, lead_id=lead_id)
    if lead is None:
        return None
    lead.status = status
    await lead.save()
    return lead
