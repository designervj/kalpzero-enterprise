from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from app.repositories import platform as platform_repository
from app.repositories import travel as travel_repository
from app.services.errors import ConflictError, NotFoundError
from app.services.platform import get_tenant_or_raise


async def _db_name(tenant_slug: str, db_name: str | None = None) -> str:
    from app.db.mongo import ensure_tenant_vertical_initialized
    from app.models.travel import TRAVEL_MODELS
    from app.core.config import get_settings
    
    resolved_db_name = db_name or tenant_slug
    await ensure_tenant_vertical_initialized(
        get_settings(),
        database_name=resolved_db_name,
        vertical="travel",
        document_models=TRAVEL_MODELS
    )
    return resolved_db_name


async def _package_or_raise(db_name: str, *, tenant_id: str, package_id: str):

    db_name = await _db_name(tenant_id, db_name)
    package = await travel_repository.get_package(db_name, package_id=package_id)
    if package is None:
        raise NotFoundError(f"Travel package '{package_id}' was not found.")
    return package


async def _departure_or_raise(db_name: str, *, tenant_id: str, departure_id: str):

    db_name = await _db_name(tenant_id, db_name)
    departure = await travel_repository.get_departure(db_name, departure_id=departure_id)
    if departure is None:
        raise NotFoundError(f"Travel departure '{departure_id}' was not found.")
    return departure


async def _lead_or_raise(db_name: str, *, tenant_id: str, lead_id: str):

    db_name = await _db_name(tenant_id, db_name)
    lead = await travel_repository.get_lead(db_name, lead_id=lead_id)
    if lead is None:
        raise NotFoundError(f"Travel lead '{lead_id}' was not found.")
    return lead


def _tenant_record_id(db: Session, tenant_slug: str) -> str:
    return str(get_tenant_or_raise(db, tenant_slug=tenant_slug).id)


def _serialize_itinerary_day(model) -> dict[str, object]:
    # Support both object and dict (models return dicts now)
    if isinstance(model, dict):
        res = model.copy()
        res["id"] = str(res["id"])
        res["package_id"] = str(res["package_id"])
        return res
    return {
        "id": str(model.id),
                "package_id": str(model.package_id),
        "day_number": model.day_number,
        "title": model.title,
        "summary": model.summary,
        "hotel_ref_id": str(model.hotel_ref_id) if model.hotel_ref_id else None,
        "activity_ref_ids": [str(rid) for rid in model.activity_ref_ids] if model.activity_ref_ids else [],
        "transfer_ref_ids": [str(rid) for rid in model.transfer_ref_ids] if model.transfer_ref_ids else [],
    }


def _serialize_package(model, itinerary_by_package: dict[str, list[dict[str, object]]]) -> dict[str, object]:
    return {
        "id": str(model.id),
                "code": model.code,
        "slug": model.slug,
        "title": model.title,
        "summary": model.summary,
        "origin_city": model.origin_city,
        "destination_city": model.destination_city,
        "destination_country": model.destination_country,
        "duration_days": model.duration_days,
        "base_price_minor": model.base_price_minor,
        "currency": model.currency,
        "status": model.status,
        "itinerary_days": itinerary_by_package.get(str(model.id), []),
        "created_at": model.created_at.isoformat(),
    }


def _serialize_departure(model) -> dict[str, object]:
    return {
        "id": str(model.id),
                "package_id": str(model.package_id),
        "departure_date": model.departure_date.isoformat(),
        "return_date": model.return_date.isoformat(),
        "seats_total": model.seats_total,
        "seats_available": model.seats_available,
        "price_override_minor": model.price_override_minor,
        "status": model.status,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_lead(model) -> dict[str, object]:
    return {
        "id": str(model.id),
                "source": model.source,
        "interested_package_id": str(model.interested_package_id) if model.interested_package_id else None,
        "departure_id": str(model.departure_id) if model.departure_id else None,
        "customer_id": str(model.customer_id) if model.customer_id else None,
        "contact_name": model.contact_name,
        "contact_phone": model.contact_phone,
        "travelers_count": model.travelers_count,
        "desired_departure_date": model.desired_departure_date.isoformat() if model.desired_departure_date else None,
        "budget_minor": model.budget_minor,
        "currency": model.currency,
        "status": model.status,
        "notes": model.notes,
        "created_at": model.created_at.isoformat(),
    }


def _audit(db: Session, *, tenant_id: str, actor_user_id: str, action: str, subject_type: str, subject_id: str, metadata: dict[str, object]) -> None:
    platform_repository.create_audit_event(
        db,
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        action=action,
        subject_type=subject_type,
        subject_id=subject_id,
        metadata_json=metadata)


def _outbox_lead(db: Session, *, tenant_id: str, lead) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=tenant_id,
        aggregate_id=str(lead.id),
        event_name="travel.lead.updated",
        payload_json={
            "lead_id": str(lead.id),
            "interested_package_id": str(lead.interested_package_id) if lead.interested_package_id else None,
            "departure_id": str(lead.departure_id) if lead.departure_id else None,
            "status": lead.status,
        })


def _normalize_departure_status(*, requested_status: str, seats_available: int) -> str:
    if requested_status == "closed":
        return "closed"
    if seats_available == 0:
        return "sold_out"
    return "scheduled"


def _build_itinerary_map(itinerary_days: list) -> dict[str, list[dict[str, object]]]:
    itinerary_by_package: dict[str, list[dict[str, object]]] = defaultdict(list)
    for item in itinerary_days:
        itinerary_by_package[str(item.package_id)].append(_serialize_itinerary_day(item))
    return itinerary_by_package


async def get_overview(db: Session, *, db_name: str, tenant_slug: str) -> dict[str, object]:

    db_name = await _db_name(tenant_slug, db_name)
    tenant = get_tenant_or_raise(db, tenant_slug=tenant_slug)
    packages = await travel_repository.list_packages(db_name)
    departures = await travel_repository.list_departures(db_name)
    leads = await travel_repository.list_leads(db_name)

    departure_statuses = Counter(item.status for item in departures)
    lead_pipeline = Counter(item.status for item in leads)
    package_statuses = Counter(item.status for item in packages)
    upcoming_departures = sum(1 for item in departures if item.status == "scheduled" and item.departure_date >= date.today())

    return {
        "tenant_id": tenant.slug,
        "tenant_record_id": str(tenant.id),
        "packages": len(packages),
        "package_statuses": dict(package_statuses),
        "departures": dict(departure_statuses),
        "lead_pipeline": dict(lead_pipeline),
        "upcoming_departures": upcoming_departures,
        "focus": [
            "package and itinerary governance",
            "departure seat control",
            "lead qualification and quote workflow",
        ],
    }


async def list_packages(db: Session, *, db_name: str, tenant_slug: str) -> list[dict[str, object]]:

    db_name = await _db_name(tenant_slug, db_name)
    packages = await travel_repository.list_packages(db_name)
    itinerary = await travel_repository.list_itinerary_days(db_name, package_ids=[item.id for item in packages])
    itinerary_by_package = _build_itinerary_map(itinerary)
    return [_serialize_package(item, itinerary_by_package) for item in packages]


async def create_package(db: Session, *, db_name: str, tenant_slug: str, actor_user_id: str, code: str, slug: str, title: str, summary: str | None, origin_city: str, destination_city: str, destination_country: str, duration_days: int, base_price_minor: int, currency: str, status: str, itinerary_days: list[dict[str, object]]) -> dict[str, object]:

    db_name = await _db_name(tenant_slug, db_name)
    tenant_record_id = _tenant_record_id(db, tenant_slug)
    if await travel_repository.find_package_by_code(db_name, code=code):
        raise ConflictError(f"Travel package code '{code}' already exists.")
    if await travel_repository.find_package_by_slug(db_name, slug=slug):
        raise ConflictError(f"Travel package slug '{slug}' already exists.")

    if not itinerary_days:
        raise ConflictError("Travel packages require at least one itinerary day.")

    seen_day_numbers: set[int] = set()
    for item in itinerary_days:
        day_number = int(item["day_number"])
        if day_number > duration_days:
            raise ConflictError("Itinerary day number cannot exceed package duration.")
        if day_number in seen_day_numbers:
            raise ConflictError("Itinerary day numbers must be unique within a package.")
        seen_day_numbers.add(day_number)

    package = await travel_repository.create_package(
        db_name,
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
        status=status)

    created_itinerary = [
        await travel_repository.create_itinerary_day(
            db_name,
            package_id=str(package.id),
            day_number=int(item["day_number"]),
            title=str(item["title"]),
            summary=str(item["summary"]),
            hotel_ref_id=str(item["hotel_ref_id"]) if item.get("hotel_ref_id") else None,
            activity_ref_ids=[str(ref_id) for ref_id in item.get("activity_ref_ids", [])],
            transfer_ref_ids=[str(ref_id) for ref_id in item.get("transfer_ref_ids", [])])
        for item in sorted(itinerary_days, key=lambda entry: int(entry["day_number"]))
    ]

    _audit(
        db,
        tenant_id=tenant_record_id,
        actor_user_id=actor_user_id,
        action="travel.package.created",
        subject_type="travel_package",
        subject_id=str(package.id),
        metadata={"code": code, "slug": slug, "itinerary_days": len(created_itinerary)})
    db.commit()
    return _serialize_package(package, {str(package.id): [_serialize_itinerary_day(item) for item in created_itinerary]})


async def list_departures(db: Session, *, db_name: str, tenant_slug: str, package_id: str | None, status: str | None) -> list[dict[str, object]]:

    db_name = await _db_name(tenant_slug, db_name)
    if package_id:
        await _package_or_raise(db_name, tenant_id=tenant_slug, package_id=package_id)
    return [
        _serialize_departure(item)
        for item in await travel_repository.list_departures(db_name, package_id=package_id, status=status)
    ]


async def create_departure(db: Session, *, db_name: str, tenant_slug: str, actor_user_id: str, package_id: str, departure_date: date, return_date: date, seats_total: int, seats_available: int, price_override_minor: int | None, status: str) -> dict[str, object]:

    db_name = await _db_name(tenant_slug, db_name)
    tenant_record_id = _tenant_record_id(db, tenant_slug)
    await _package_or_raise(db_name, tenant_id=tenant_slug, package_id=package_id)

    if return_date <= departure_date:
        raise ConflictError("Return date must be later than departure date.")
    if seats_available > seats_total:
        raise ConflictError("Available seats cannot exceed total seats.")

    effective_status = _normalize_departure_status(requested_status=status, seats_available=seats_available)
    departure = await travel_repository.create_departure(
        db_name,
        package_id=package_id,
        departure_date=departure_date,
        return_date=return_date,
        seats_total=seats_total,
        seats_available=seats_available,
        price_override_minor=price_override_minor,
        status=effective_status)
    _audit(
        db,
        tenant_id=tenant_record_id,
        actor_user_id=actor_user_id,
        action="travel.departure.created",
        subject_type="travel_departure",
        subject_id=str(departure.id),
        metadata={"package_id": str(package_id), "status": effective_status})
    db.commit()
    return _serialize_departure(departure)


async def update_departure_status(db: Session, *, db_name: str, tenant_slug: str, actor_user_id: str, departure_id: str, status: str) -> dict[str, object]:

    db_name = await _db_name(tenant_slug, db_name)
    tenant_record_id = _tenant_record_id(db, tenant_slug)
    departure = await _departure_or_raise(db_name, tenant_id=tenant_slug, departure_id=departure_id)
    if status == "scheduled" and departure.seats_available == 0:
        raise ConflictError("A departure with zero available seats cannot be scheduled.")

    departure.status = _normalize_departure_status(requested_status=status, seats_available=departure.seats_available)
    await departure.save()
    _audit(
        db,
        tenant_id=tenant_record_id,
        actor_user_id=actor_user_id,
        action="travel.departure.updated",
        subject_type="travel_departure",
        subject_id=str(departure.id),
        metadata={"status": departure.status})
    db.commit()
    return _serialize_departure(departure)


async def list_leads(db: Session, *, db_name: str, tenant_slug: str, status: str | None, interested_package_id: str | None) -> list[dict[str, object]]:

    db_name = await _db_name(tenant_slug, db_name)
    if interested_package_id:
        await _package_or_raise(db_name, tenant_id=tenant_slug, package_id=interested_package_id)
    return [
        _serialize_lead(item)
        for item in await travel_repository.list_leads(
            db_name,
            status=status,
            interested_package_id=interested_package_id)
    ]


async def create_lead(db: Session, *, db_name: str, tenant_slug: str, actor_user_id: str, source: str, interested_package_id: str | None, departure_id: str | None, customer_id: str | None, contact_name: str, contact_phone: str, travelers_count: int, desired_departure_date: date | None, budget_minor: int | None, currency: str, status: str, notes: str | None) -> dict[str, object]:

    db_name = await _db_name(tenant_slug, db_name)
    tenant_record_id = _tenant_record_id(db, tenant_slug)
    package = None
    departure = None
    if interested_package_id:
        package = await _package_or_raise(db_name, tenant_id=tenant_slug, package_id=interested_package_id)
    if departure_id:
        departure = await _departure_or_raise(db_name, tenant_id=tenant_slug, departure_id=departure_id)
    if package and departure and departure.package_id != str(package.id):
        raise ConflictError("Travel lead departure does not belong to the selected package.")

    lead = await travel_repository.create_lead(
        db_name,
        source=source,
        interested_package_id=str(package.id) if package else None,
        departure_id=str(departure.id) if departure else None,
        customer_id=customer_id,
        contact_name=contact_name,
        contact_phone=contact_phone,
        travelers_count=travelers_count,
        desired_departure_date=desired_departure_date,
        budget_minor=budget_minor,
        currency=currency,
        status=status,
        notes=notes)
    _audit(
        db,
        tenant_id=tenant_record_id,
        actor_user_id=actor_user_id,
        action="travel.lead.created",
        subject_type="travel_lead",
        subject_id=str(lead.id),
        metadata={"source": source, "status": status})
    _outbox_lead(db, tenant_id=tenant_record_id, lead=lead)
    db.commit()
    return _serialize_lead(lead)


async def update_lead_status(db: Session, *, db_name: str, tenant_slug: str, actor_user_id: str, lead_id: str, status: str) -> dict[str, object]:

    db_name = await _db_name(tenant_slug, db_name)
    tenant_record_id = _tenant_record_id(db, tenant_slug)
    lead = await _lead_or_raise(db_name, tenant_id=tenant_slug, lead_id=lead_id)
    lead.status = status
    await lead.save()
    _audit(
        db,
        tenant_id=tenant_record_id,
        actor_user_id=actor_user_id,
        action="travel.lead.updated",
        subject_type="travel_lead",
        subject_id=str(lead.id),
        metadata={"status": status})
    _outbox_lead(db, tenant_id=tenant_record_id, lead=lead)
    db.commit()
    return _serialize_lead(lead)


def load_legacy_travel_plan() -> dict[str, object]:
    repo_root = Path(__file__).resolve().parents[4]
    adapter_file = repo_root / "adapters" / "legacy-kalpzero" / "travel-packages.yaml"
    manifest = yaml.safe_load(adapter_file.read_text(encoding="utf-8"))
    return {
        "adapter_id": manifest["adapter_id"],
        "source_root": manifest["source_root"],
        "mode": manifest["mode"],
        "entities": manifest["entities"],
    }
