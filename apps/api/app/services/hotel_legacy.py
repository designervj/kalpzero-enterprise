from collections import Counter
from datetime import UTC, date, datetime
from pathlib import Path

import yaml
from sqlalchemy.orm import Session

from app.db.mongo import RuntimeDocumentStore
from app.repositories import hotel as hotel_repository
from app.repositories import platform as platform_repository
from app.services.errors import ConflictError, NotFoundError
from app.services.platform import get_tenant_or_raise

HOTEL_PROFILE_COLLECTION = "hotel_property_profiles"
HOTEL_AMENITY_COLLECTION = "hotel_amenity_catalogs"
HOTEL_NEARBY_COLLECTION = "hotel_nearby_places"


def _tenant(db: Session, tenant_slug: str):
    return get_tenant_or_raise(db, tenant_slug=tenant_slug)


def _property_or_raise(db: Session, *, tenant_id: str, property_id: str):
    property_model = hotel_repository.get_property(db, tenant_id=tenant_id, property_id=property_id)
    if property_model is None:
        raise NotFoundError(f"Hotel property '{property_id}' was not found.")
    return property_model


def _room_type_or_raise(db: Session, *, tenant_id: str, room_type_id: str):
    room_type = hotel_repository.get_room_type(db, tenant_id=tenant_id, room_type_id=room_type_id)
    if room_type is None:
        raise NotFoundError(f"Hotel room type '{room_type_id}' was not found.")
    return room_type


def _room_or_raise(db: Session, *, tenant_id: str, room_id: str):
    room = hotel_repository.get_room(db, tenant_id=tenant_id, room_id=room_id)
    if room is None:
        raise NotFoundError(f"Hotel room '{room_id}' was not found.")
    return room


def _meal_plan_or_raise(db: Session, *, tenant_id: str, meal_plan_id: str):
    meal_plan = hotel_repository.get_meal_plan(db, tenant_id=tenant_id, meal_plan_id=meal_plan_id)
    if meal_plan is None:
        raise NotFoundError(f"Hotel meal plan '{meal_plan_id}' was not found.")
    return meal_plan


def _guest_profile_or_raise(db: Session, *, tenant_id: str, guest_profile_id: str):
    guest_profile = hotel_repository.get_guest_profile(db, tenant_id=tenant_id, guest_profile_id=guest_profile_id)
    if guest_profile is None:
        raise NotFoundError(f"Hotel guest profile '{guest_profile_id}' was not found.")
    return guest_profile


def _reservation_or_raise(db: Session, *, tenant_id: str, reservation_id: str):
    reservation = hotel_repository.get_reservation(db, tenant_id=tenant_id, reservation_id=reservation_id)
    if reservation is None:
        raise NotFoundError(f"Hotel reservation '{reservation_id}' was not found.")
    return reservation


def _stay_or_raise(db: Session, *, tenant_id: str, stay_id: str):
    stay = hotel_repository.get_stay(db, tenant_id=tenant_id, stay_id=stay_id)
    if stay is None:
        raise NotFoundError(f"Hotel stay '{stay_id}' was not found.")
    return stay


def _folio_or_raise(db: Session, *, tenant_id: str, folio_id: str):
    folio = hotel_repository.get_folio(db, tenant_id=tenant_id, folio_id=folio_id)
    if folio is None:
        raise NotFoundError(f"Hotel folio '{folio_id}' was not found.")
    return folio


def _payment_or_raise(db: Session, *, tenant_id: str, payment_id: str):
    payment = hotel_repository.get_payment(db, tenant_id=tenant_id, payment_id=payment_id)
    if payment is None:
        raise NotFoundError(f"Hotel payment '{payment_id}' was not found.")
    return payment


def _staff_member_or_raise(db: Session, *, tenant_id: str, staff_member_id: str):
    staff_member = hotel_repository.get_staff_member(db, tenant_id=tenant_id, staff_member_id=staff_member_id)
    if staff_member is None:
        raise NotFoundError(f"Hotel staff member '{staff_member_id}' was not found.")
    return staff_member


def _housekeeping_or_raise(db: Session, *, tenant_id: str, task_id: str):
    task = hotel_repository.get_housekeeping_task(db, tenant_id=tenant_id, task_id=task_id)
    if task is None:
        raise NotFoundError(f"Housekeeping task '{task_id}' was not found.")
    return task


def _maintenance_or_raise(db: Session, *, tenant_id: str, ticket_id: str):
    ticket = hotel_repository.get_maintenance_ticket(db, tenant_id=tenant_id, ticket_id=ticket_id)
    if ticket is None:
        raise NotFoundError(f"Maintenance ticket '{ticket_id}' was not found.")
    return ticket


def _serialize_property(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "name": model.name,
        "code": model.code,
        "city": model.city,
        "country": model.country,
        "timezone": model.timezone,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_room_type(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "name": model.name,
        "code": model.code,
        "category": model.category,
        "bed_type": model.bed_type,
        "occupancy": model.occupancy,
        "room_size_sqm": model.room_size_sqm,
        "base_rate_minor": model.base_rate_minor,
        "extra_bed_price_minor": model.extra_bed_price_minor,
        "refundable": model.refundable,
        "currency": model.currency,
        "amenity_ids": [str(aid) for aid in model.amenity_ids] if model.amenity_ids else [],
        "created_at": model.created_at.isoformat(),
    }


def _serialize_room(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "room_type_id": str(model.room_type_id),
        "room_number": model.room_number,
        "status": model.status,
        "occupancy_status": model.occupancy_status,
        "housekeeping_status": model.housekeeping_status,
        "sell_status": model.sell_status,
        "is_active": model.is_active,
        "feature_tags": model.feature_tags,
        "notes": model.notes,
        "last_cleaned_at": model.last_cleaned_at,
        "floor_label": model.floor_label,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_meal_plan(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "code": model.code,
        "name": model.name,
        "description": model.description,
        "price_per_person_per_night_minor": model.price_per_person_per_night_minor,
        "currency": model.currency,
        "included_meals": model.included_meals,
        "is_active": model.is_active,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_guest_profile(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "first_name": model.first_name,
        "last_name": model.last_name,
        "full_name": f"{model.first_name} {model.last_name}".strip(),
        "email": model.email,
        "phone": model.phone,
        "nationality": model.nationality,
        "loyalty_tier": model.loyalty_tier,
        "vip": model.vip,
        "preferred_room_type_id": str(model.preferred_room_type_id) if model.preferred_room_type_id else None,
        "dietary_preference": model.dietary_preference,
        "company_name": model.company_name,
        "identity_document_number": model.identity_document_number,
        "notes": model.notes,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_rate_plan(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "room_type_id": str(model.room_type_id),
        "label": model.label,
        "currency": model.currency,
        "weekend_enabled": model.weekend_enabled,
        "weekend_rate_minor": model.weekend_rate_minor,
        "seasonal_overrides": model.seasonal_overrides,
        "is_active": model.is_active,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_availability_rule(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "room_type_id": str(model.room_type_id),
        "total_units": model.total_units,
        "available_units_snapshot": model.available_units_snapshot,
        "minimum_stay_nights": model.minimum_stay_nights,
        "maximum_stay_nights": model.maximum_stay_nights,
        "blackout_dates": model.blackout_dates,
        "is_active": model.is_active,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_reservation(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "room_type_id": str(model.room_type_id),
        "room_id": str(model.room_id) if model.room_id else None,
        "meal_plan_id": str(model.meal_plan_id) if model.meal_plan_id else None,
        "booking_reference": model.booking_reference,
        "booking_source": model.booking_source,
        "guest_customer_id": str(model.guest_customer_id) if model.guest_customer_id else None,
        "guest_name": model.guest_name,
        "check_in_date": model.check_in_date.isoformat(),
        "check_out_date": model.check_out_date.isoformat(),
        "status": model.status,
        "special_requests": model.special_requests,
        "early_check_in": model.early_check_in,
        "late_check_out": model.late_check_out,
        "actual_check_in_at": model.actual_check_in_at,
        "actual_check_out_at": model.actual_check_out_at,
        "total_amount_minor": model.total_amount_minor,
        "currency": model.currency,
        "adults": model.adults,
        "children": model.children,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_stay(model, *, room_moves=None) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "reservation_id": str(model.reservation_id),
        "room_type_id": str(model.room_type_id),
        "room_id": str(model.room_id) if model.room_id else None,
        "guest_customer_id": str(model.guest_customer_id) if model.guest_customer_id else None,
        "guest_name": model.guest_name,
        "status": model.status,
        "checked_in_at": model.checked_in_at,
        "checked_out_at": model.checked_out_at,
        "notes": model.notes,
        "room_moves": [_serialize_room_move(item) for item in room_moves] if room_moves is not None else None,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_room_move(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "stay_id": str(model.stay_id),
        "reservation_id": str(model.reservation_id),
        "from_room_id": str(model.from_room_id),
        "to_room_id": str(model.to_room_id),
        "moved_at": model.moved_at,
        "reason": model.reason,
        "moved_by_user_id": str(model.moved_by_user_id) if model.moved_by_user_id else None,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_guest_document(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "guest_profile_id": str(model.guest_profile_id),
        "document_kind": model.document_kind,
        "document_number": model.document_number,
        "issuing_country": model.issuing_country,
        "expires_on": model.expires_on.isoformat() if model.expires_on else None,
        "verification_status": model.verification_status,
        "storage_key": model.storage_key,
        "notes": model.notes,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_folio_charge(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "folio_id": str(model.folio_id),
        "reservation_id": str(model.reservation_id),
        "category": model.category,
        "label": model.label,
        "service_date": model.service_date.isoformat(),
        "quantity": model.quantity,
        "unit_amount_minor": model.unit_amount_minor,
        "line_amount_minor": model.line_amount_minor,
        "tax_amount_minor": model.tax_amount_minor,
        "gross_amount_minor": model.line_amount_minor + model.tax_amount_minor,
        "notes": model.notes,
        "created_by_user_id": str(model.created_by_user_id),
        "created_at": model.created_at.isoformat(),
    }


def _serialize_payment(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "folio_id": str(model.folio_id),
        "reservation_id": str(model.reservation_id),
        "amount_minor": model.amount_minor,
        "currency": model.currency,
        "payment_method": model.payment_method,
        "status": model.status,
        "reference": model.reference,
        "notes": model.notes,
        "received_at": model.received_at,
        "recorded_by_user_id": str(model.recorded_by_user_id),
        "created_at": model.created_at.isoformat(),
    }


def _serialize_refund(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "folio_id": str(model.folio_id),
        "payment_id": str(model.payment_id),
        "reservation_id": str(model.reservation_id),
        "amount_minor": model.amount_minor,
        "currency": model.currency,
        "reason": model.reason,
        "reference": model.reference,
        "status": model.status,
        "refunded_at": model.refunded_at,
        "recorded_by_user_id": str(model.recorded_by_user_id),
        "created_at": model.created_at.isoformat(),
    }


def _serialize_folio(model, *, charges=None, payments=None, refunds=None) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "reservation_id": str(model.reservation_id),
        "guest_customer_id": str(model.guest_customer_id) if model.guest_customer_id else None,
        "guest_name": model.guest_name,
        "status": model.status,
        "currency": model.currency,
        "subtotal_minor": model.subtotal_minor,
        "tax_minor": model.tax_minor,
        "total_minor": model.total_minor,
        "paid_minor": model.paid_minor,
        "balance_minor": model.balance_minor,
        "invoice_number": model.invoice_number,
        "invoice_issued_at": model.invoice_issued_at,
        "closed_at": model.closed_at,
        "charges": [_serialize_folio_charge(item) for item in charges] if charges is not None else None,
        "payments": [_serialize_payment(item) for item in payments] if payments is not None else None,
        "refunds": [_serialize_refund(item) for item in refunds] if refunds is not None else None,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_staff_member(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "staff_code": model.staff_code,
        "first_name": model.first_name,
        "last_name": model.last_name,
        "full_name": f"{model.first_name} {model.last_name}".strip(),
        "role": model.role,
        "department": model.department,
        "phone": model.phone,
        "email": model.email,
        "employment_status": model.employment_status,
        "is_active": model.is_active,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_shift(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "staff_member_id": str(model.staff_member_id),
        "shift_date": model.shift_date.isoformat(),
        "shift_kind": model.shift_kind,
        "start_time": model.start_time,
        "end_time": model.end_time,
        "status": model.status,
        "notes": model.notes,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_night_audit(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "audit_date": model.audit_date.isoformat(),
        "status": model.status,
        "report": model.report_json,
        "completed_at": model.completed_at,
        "completed_by_user_id": str(model.completed_by_user_id) if model.completed_by_user_id else None,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_housekeeping_task(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "room_id": str(model.room_id),
        "status": model.status,
        "priority": model.priority,
        "notes": model.notes,
        "assigned_staff_id": str(model.assigned_staff_id) if model.assigned_staff_id else None,
        "assigned_to": model.assigned_to,
        "created_at": model.created_at.isoformat(),
    }


def _serialize_maintenance_ticket(model) -> dict[str, object]:
    return {
        "id": str(model.id),
        "tenant_id": str(model.tenant_id),
        "property_id": str(model.property_id),
        "room_id": str(model.room_id) if model.room_id else None,
        "title": model.title,
        "description": model.description,
        "status": model.status,
        "priority": model.priority,
        "assigned_staff_id": str(model.assigned_staff_id) if model.assigned_staff_id else None,
        "assigned_to": model.assigned_to,
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
        metadata_json=metadata,
    )


def _outbox_reservation(db: Session, *, tenant_id: str, reservation, event_status: str) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(reservation.id),
        event_name="hotel.reservation.updated",
        payload_json={
            "reservation_id": str(reservation.id),
            "property_id": str(reservation.property_id),
            "room_id": str(reservation.room_id) if reservation.room_id else None,
            "status": event_status,
        },
    )


def _outbox_invoice(db: Session, *, tenant_id: str, folio) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(folio.id),
        event_name="invoice.issued",
        payload_json={
            "folio_id": str(folio.id),
            "reservation_id": str(folio.reservation_id),
            "property_id": str(folio.property_id),
            "invoice_number": folio.invoice_number,
            "total_minor": folio.total_minor,
            "currency": folio.currency,
        },
    )


def _legacy_room_status(*, occupancy_status: str, housekeeping_status: str, sell_status: str) -> str:
    if sell_status == "maintenance":
        return "maintenance"
    if sell_status in {"blocked", "out_of_order"}:
        return "blocked"
    if occupancy_status == "occupied":
        return "occupied"
    if housekeeping_status in {"dirty", "dnd"}:
        return "dirty"
    return "available"


def _room_state_from_request(
    *,
    status: str,
    occupancy_status: str | None,
    housekeeping_status: str | None,
    sell_status: str | None,
) -> dict[str, str]:
    presets = {
        "available": {"occupancy_status": "vacant", "housekeeping_status": "clean", "sell_status": "sellable"},
        "occupied": {"occupancy_status": "occupied", "housekeeping_status": "clean", "sell_status": "sellable"},
        "dirty": {"occupancy_status": "vacant", "housekeeping_status": "dirty", "sell_status": "sellable"},
        "blocked": {"occupancy_status": "vacant", "housekeeping_status": "clean", "sell_status": "blocked"},
        "maintenance": {"occupancy_status": "vacant", "housekeeping_status": "dirty", "sell_status": "maintenance"},
    }
    values = {
        **presets.get(status, presets["available"]),
        **({"occupancy_status": occupancy_status} if occupancy_status else {}),
        **({"housekeeping_status": housekeeping_status} if housekeeping_status else {}),
        **({"sell_status": sell_status} if sell_status else {}),
    }
    return {
        "occupancy_status": str(values["occupancy_status"]),
        "housekeeping_status": str(values["housekeeping_status"]),
        "sell_status": str(values["sell_status"]),
        "status": _legacy_room_status(
            occupancy_status=str(values["occupancy_status"]),
            housekeeping_status=str(values["housekeeping_status"]),
            sell_status=str(values["sell_status"]),
        ),
    }


def _set_room_state(
    room,
    *,
    occupancy_status: str | None = None,
    housekeeping_status: str | None = None,
    sell_status: str | None = None,
    last_cleaned_at: str | None = None,
) -> None:
    if occupancy_status is not None:
        room.occupancy_status = occupancy_status
    if housekeeping_status is not None:
        room.housekeeping_status = housekeeping_status
    if sell_status is not None:
        room.sell_status = sell_status
    if last_cleaned_at is not None:
        room.last_cleaned_at = last_cleaned_at
    room.status = _legacy_room_status(
        occupancy_status=room.occupancy_status,
        housekeeping_status=room.housekeeping_status,
        sell_status=room.sell_status,
    )


def _booking_reference(reservation) -> str:
    return reservation.booking_reference or f"HK-{reservation.id[:8].upper()}"


def _invoice_number(folio) -> str:
    return folio.invoice_number or f"INV-{folio.id[:8].upper()}"


def _recalculate_folio_totals(db: Session, folio) -> None:
    charges = hotel_repository.list_folio_charges(db, tenant_id=folio.tenant_id, folio_id=folio.id)
    payments = hotel_repository.list_payments(db, tenant_id=folio.tenant_id, folio_id=folio.id)
    refunds = hotel_repository.list_refunds(db, tenant_id=folio.tenant_id, folio_id=folio.id)
    subtotal_minor = sum(item.line_amount_minor for item in charges)
    tax_minor = sum(item.tax_amount_minor for item in charges)
    total_minor = subtotal_minor + tax_minor
    paid_minor = sum(item.amount_minor for item in payments if item.status == "posted")
    refunded_minor = sum(item.amount_minor for item in refunds if item.status == "processed")
    folio.subtotal_minor = subtotal_minor
    folio.tax_minor = tax_minor
    folio.total_minor = total_minor
    folio.paid_minor = paid_minor - refunded_minor
    folio.balance_minor = total_minor - folio.paid_minor


def _hotel_doc_key(property_id: str) -> str:
    return property_id


def _default_property_profile(property_model) -> dict[str, object]:
    return {
        "property_id": property_model.id,
        "brand_name": property_model.name,
        "hero_title": property_model.name,
        "hero_summary": f"Stay in {property_model.city}, {property_model.country}.",
        "description": f"{property_model.name} is managed through the KalpZero hotel runtime.",
        "address_line_1": "",
        "address_line_2": "",
        "city": property_model.city,
        "state": "",
        "country": property_model.country,
        "postal_code": "",
        "contact_phone": "",
        "contact_email": "",
        "website": "",
        "check_in_time": "14:00",
        "check_out_time": "11:00",
        "star_rating": None,
        "highlights": [],
        "gallery_urls": [],
        "policies": [],
    }


def _default_amenity_catalog(property_model) -> dict[str, object]:
    return {
        "property_id": property_model.id,
        "categories": [],
    }


def _default_nearby_places(property_model) -> dict[str, object]:
    return {
        "property_id": property_model.id,
        "places": [],
    }


def get_overview(db: Session, *, tenant_slug: str) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    properties = hotel_repository.list_properties(db, tenant_id=tenant.id)
    room_types = hotel_repository.list_room_types(db, tenant_id=tenant.id)
    rooms = hotel_repository.list_rooms(db, tenant_id=tenant.id)
    meal_plans = hotel_repository.list_meal_plans(db, tenant_id=tenant.id)
    guest_profiles = hotel_repository.list_guest_profiles(db, tenant_id=tenant.id)
    guest_documents = []
    for guest_profile in guest_profiles:
        guest_documents.extend(
            hotel_repository.list_guest_documents(db, tenant_id=tenant.id, guest_profile_id=guest_profile.id)
        )
    rate_plans = hotel_repository.list_rate_plans(db, tenant_id=tenant.id)
    availability_rules = hotel_repository.list_availability_rules(db, tenant_id=tenant.id)
    reservations = hotel_repository.list_reservations(db, tenant_id=tenant.id)
    stays = hotel_repository.list_stays(db, tenant_id=tenant.id)
    folios = hotel_repository.list_folios(db, tenant_id=tenant.id)
    payments = hotel_repository.list_payments(db, tenant_id=tenant.id)
    refunds = hotel_repository.list_refunds(db, tenant_id=tenant.id)
    staff_members = hotel_repository.list_staff_members(db, tenant_id=tenant.id)
    shifts = hotel_repository.list_shifts(db, tenant_id=tenant.id)
    night_audits = hotel_repository.list_night_audits(db, tenant_id=tenant.id)
    housekeeping_tasks = hotel_repository.list_housekeeping_tasks(db, tenant_id=tenant.id)
    maintenance_tickets = hotel_repository.list_maintenance_tickets(db, tenant_id=tenant.id)

    room_statuses = Counter(room.status for room in rooms)
    occupancy_statuses = Counter(room.occupancy_status for room in rooms)
    sell_statuses = Counter(room.sell_status for room in rooms)
    housekeeping_room_statuses = Counter(room.housekeeping_status for room in rooms)
    reservation_statuses = Counter(reservation.status for reservation in reservations)
    stay_statuses = Counter(stay.status for stay in stays)
    folio_statuses = Counter(folio.status for folio in folios)
    shift_statuses = Counter(shift.status for shift in shifts)
    night_audit_statuses = Counter(audit.status for audit in night_audits)
    housekeeping_statuses = Counter(task.status for task in housekeeping_tasks)
    maintenance_statuses = Counter(ticket.status for ticket in maintenance_tickets)

    occupied_count = room_statuses.get("occupied", 0)
    occupancy_rate = round((occupied_count / len(rooms)) * 100, 2) if rooms else 0.0
    total_folio_balance_minor = sum(folio.balance_minor for folio in folios)
    total_payments_minor = sum(payment.amount_minor for payment in payments if payment.status == "posted")
    total_refunds_minor = sum(refund.amount_minor for refund in refunds if refund.status == "processed")

    return {
        "tenant_id": tenant.slug,
        "tenant_record_id": str(tenant.id),
        "properties": len(properties),
        "room_types": len(room_types),
        "rooms": len(rooms),
        "meal_plans": len(meal_plans),
        "guest_profiles": len(guest_profiles),
        "guest_documents": len(guest_documents),
        "rate_plans": len(rate_plans),
        "availability_rules": len(availability_rules),
        "stays": len(stays),
        "folios": len(folios),
        "payments": len(payments),
        "refunds": len(refunds),
        "staff_members": len(staff_members),
        "shifts": len(shifts),
        "night_audits": len(night_audits),
        "room_statuses": dict(room_statuses),
        "occupancy_statuses": dict(occupancy_statuses),
        "sell_statuses": dict(sell_statuses),
        "housekeeping_room_statuses": dict(housekeeping_room_statuses),
        "reservations": dict(reservation_statuses),
        "stay_statuses": dict(stay_statuses),
        "folio_statuses": dict(folio_statuses),
        "shift_statuses": dict(shift_statuses),
        "night_audit_statuses": dict(night_audit_statuses),
        "housekeeping": dict(housekeeping_statuses),
        "maintenance": dict(maintenance_statuses),
        "occupancy_rate": occupancy_rate,
        "folio_balance_minor": total_folio_balance_minor,
        "payments_minor": total_payments_minor,
        "refunds_minor": total_refunds_minor,
    }


def get_inventory_summary(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    for_date: date,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    room_types = hotel_repository.list_room_types(db, tenant_id=tenant.id, property_id=property_id)
    rooms = hotel_repository.list_rooms(db, tenant_id=tenant.id, property_id=property_id)
    reservations = hotel_repository.list_reservations(db, tenant_id=tenant.id, property_id=property_id)

    room_counts = Counter(room.room_type_id for room in rooms)
    blocked_counts = Counter(room.room_type_id for room in rooms if room.status in {"maintenance", "blocked"})
    sold_counts = Counter(
        reservation.room_type_id
        for reservation in reservations
        if reservation.status in {"reserved", "checked_in"}
        and reservation.check_in_date <= for_date
        and reservation.check_out_date > for_date
    )

    summary: list[dict[str, object]] = []
    for room_type in room_types:
        total_units = room_counts.get(room_type.id, 0)
        blocked_units = blocked_counts.get(room_type.id, 0)
        sold_units = sold_counts.get(room_type.id, 0)
        available_units = max(total_units - blocked_units - sold_units, 0)
        summary.append(
            {
                "property_id": room_type.property_id,
                "room_type_id": room_type.id,
                "date": for_date.isoformat(),
                "total_units": total_units,
                "available_units": available_units,
                "sold_units": sold_units,
                "blocked_units": blocked_units,
            }
        )
    return summary


def list_properties(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_property(item) for item in hotel_repository.list_properties(db, tenant_id=tenant.id)]


def create_property(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    code: str,
    city: str,
    country: str,
    timezone: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    if hotel_repository.find_property_by_code(db, tenant_id=tenant.id, code=code):
        raise ConflictError(f"Hotel property code '{code}' already exists.")

    model = hotel_repository.create_property(
        db,
        tenant_id=tenant.id,
        name=name,
        code=code,
        city=city,
        country=country,
        timezone=timezone,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.property.created",
        # subject_type="hotel_property",
        # subject_id=str(model.id),
        # metadata={"code": model.code},
    # )
    db.commit()
    return _serialize_property(model)


def list_room_types(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_room_type(item)
        for item in hotel_repository.list_room_types(db, tenant_id=tenant.id, property_id=property_id)
    ]


def create_room_type(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
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
    amenity_ids: list[str],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    if hotel_repository.find_room_type_by_code(db, tenant_id=tenant.id, property_id=property_id, code=code):
        raise ConflictError(f"Hotel room type code '{code}' already exists for this property.")

    model = hotel_repository.create_room_type(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        name=name,
        code=code,
        category=category,
        bed_type=bed_type,
        occupancy=occupancy,
        room_size_sqm=room_size_sqm,
        base_rate_minor=base_rate_minor,
        extra_bed_price_minor=extra_bed_price_minor,
        refundable=refundable,
        currency=currency,
        amenity_ids=amenity_ids,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.room_type.created",
        # subject_type="hotel_room_type",
        # subject_id=str(model.id),
        # metadata={"property_id": str(property_id), "code": code},
    # )
    db.commit()
    return _serialize_room_type(model)


def list_rooms(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_room(item) for item in hotel_repository.list_rooms(db, tenant_id=tenant.id, property_id=property_id)]


def create_room(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    room_type_id: str,
    room_number: str,
    status: str,
    occupancy_status: str | None,
    housekeeping_status: str | None,
    sell_status: str | None,
    is_active: bool,
    feature_tags: list[str],
    notes: str | None,
    last_cleaned_at: str | None,
    floor_label: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    room_type = _room_type_or_raise(db, tenant_id=tenant.id, room_type_id=room_type_id)
    if room_type.property_id != property_id:
        raise ConflictError("Room type does not belong to the provided property.")
    if hotel_repository.find_room_by_number(db, tenant_id=tenant.id, property_id=property_id, room_number=room_number):
        raise ConflictError(f"Room number '{room_number}' already exists for this property.")

    room_state = _room_state_from_request(
        status=status,
        occupancy_status=occupancy_status,
        housekeeping_status=housekeeping_status,
        sell_status=sell_status,
    )
    model = hotel_repository.create_room(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        room_type_id=room_type_id,
        room_number=room_number,
        status=room_state["status"],
        occupancy_status=room_state["occupancy_status"],
        housekeeping_status=room_state["housekeeping_status"],
        sell_status=room_state["sell_status"],
        is_active=is_active,
        feature_tags=feature_tags,
        notes=notes,
        last_cleaned_at=last_cleaned_at,
        floor_label=floor_label,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.room.created",
        # subject_type="hotel_room",
        # subject_id=str(model.id),
        # metadata={"property_id": str(property_id), "room_number": room_number},
    # )
    db.commit()
    return _serialize_room(model)


def list_meal_plans(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_meal_plan(item)
        for item in hotel_repository.list_meal_plans(db, tenant_id=tenant.id, property_id=property_id)
    ]


def create_meal_plan(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    code: str,
    name: str,
    description: str | None,
    price_per_person_per_night_minor: int,
    currency: str,
    included_meals: list[str],
    is_active: bool,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    if hotel_repository.find_meal_plan_by_code(db, tenant_id=tenant.id, property_id=property_id, code=code):
        raise ConflictError(f"Hotel meal plan code '{code}' already exists for this property.")

    meal_plan = hotel_repository.create_meal_plan(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        code=code,
        name=name,
        description=description,
        price_per_person_per_night_minor=price_per_person_per_night_minor,
        currency=currency,
        included_meals=included_meals,
        is_active=is_active,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.meal_plan.created",
        # subject_type="hotel_meal_plan",
        # subject_id=str(meal_plan.id),
        # metadata={"property_id": str(property_id), "code": code},
    # )
    db.commit()
    return _serialize_meal_plan(meal_plan)


def list_guest_profiles(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_guest_profile(item) for item in hotel_repository.list_guest_profiles(db, tenant_id=tenant.id)]


def create_guest_profile(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
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
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    if hotel_repository.find_guest_profile_by_email(db, tenant_id=tenant.id, email=email):
        raise ConflictError(f"Hotel guest email '{email}' already exists.")
    if preferred_room_type_id:
        _room_type_or_raise(db, tenant_id=tenant.id, room_type_id=preferred_room_type_id)

    guest_profile = hotel_repository.create_guest_profile(
        db,
        tenant_id=tenant.id,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        nationality=nationality,
        loyalty_tier=loyalty_tier,
        vip=vip,
        preferred_room_type_id=preferred_room_type_id,
        dietary_preference=dietary_preference,
        company_name=company_name,
        identity_document_number=identity_document_number,
        notes=notes,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.guest_profile.created",
        # subject_type="hotel_guest_profile",
        # subject_id=str(guest_profile.id),
        # metadata={"email": email, "vip": vip},
    # )
    db.commit()
    return _serialize_guest_profile(guest_profile)


def list_guest_documents(
    db: Session,
    *,
    tenant_slug: str,
    guest_profile_id: str,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    _guest_profile_or_raise(db, tenant_id=tenant.id, guest_profile_id=guest_profile_id)
    return [
        _serialize_guest_document(item)
        for item in hotel_repository.list_guest_documents(
            db,
            tenant_id=tenant.id,
            guest_profile_id=guest_profile_id,
        )
    ]


def create_guest_document(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    guest_profile_id: str,
    document_kind: str,
    document_number: str,
    issuing_country: str | None,
    expires_on: date | None,
    verification_status: str,
    storage_key: str | None,
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _guest_profile_or_raise(db, tenant_id=tenant.id, guest_profile_id=guest_profile_id)
    guest_document = hotel_repository.create_guest_document(
        db,
        tenant_id=tenant.id,
        guest_profile_id=guest_profile_id,
        document_kind=document_kind,
        document_number=document_number,
        issuing_country=issuing_country,
        expires_on=expires_on,
        verification_status=verification_status,
        storage_key=storage_key,
        notes=notes,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.guest_document.created",
        # subject_type="hotel_guest_document",
        # subject_id=str(guest_document.id),
        # metadata={"guest_profile_id": str(guest_profile_id), "document_kind": document_kind},
    # )
    db.commit()
    return _serialize_guest_document(guest_document)


def list_rate_plans(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    room_type_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_rate_plan(item)
        for item in hotel_repository.list_rate_plans(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            room_type_id=room_type_id,
        )
    ]


def create_rate_plan(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    room_type_id: str,
    label: str,
    currency: str,
    weekend_enabled: bool,
    weekend_rate_minor: int | None,
    seasonal_overrides: list[dict[str, object]],
    is_active: bool,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    room_type = _room_type_or_raise(db, tenant_id=tenant.id, room_type_id=room_type_id)
    if room_type.property_id != property_id:
        raise ConflictError("Room type does not belong to the provided property.")
    if hotel_repository.find_rate_plan_by_label(db, tenant_id=tenant.id, room_type_id=room_type_id, label=label):
        raise ConflictError(f"Hotel rate plan '{label}' already exists for this room type.")

    for override in seasonal_overrides:
        if str(override["start_date"]) >= str(override["end_date"]):
            raise ConflictError("Seasonal override end date must be later than start date.")

    rate_plan = hotel_repository.create_rate_plan(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        room_type_id=room_type_id,
        label=label,
        currency=currency,
        weekend_enabled=weekend_enabled,
        weekend_rate_minor=weekend_rate_minor,
        seasonal_overrides=seasonal_overrides,
        is_active=is_active,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.rate_plan.created",
        # subject_type="hotel_rate_plan",
        # subject_id=str(rate_plan.id),
        # metadata={"property_id": str(property_id), "room_type_id": str(room_type_id), "label": label},
    # )
    db.commit()
    return _serialize_rate_plan(rate_plan)


def list_availability_rules(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    room_type_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_availability_rule(item)
        for item in hotel_repository.list_availability_rules(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            room_type_id=room_type_id,
        )
    ]


def create_availability_rule(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    room_type_id: str,
    total_units: int,
    available_units_snapshot: int | None,
    minimum_stay_nights: int,
    maximum_stay_nights: int,
    blackout_dates: list[str],
    is_active: bool,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    room_type = _room_type_or_raise(db, tenant_id=tenant.id, room_type_id=room_type_id)
    if room_type.property_id != property_id:
        raise ConflictError("Room type does not belong to the provided property.")
    if minimum_stay_nights > maximum_stay_nights:
        raise ConflictError("Minimum stay nights cannot exceed maximum stay nights.")
    if available_units_snapshot is not None and available_units_snapshot > total_units:
        raise ConflictError("Available units snapshot cannot exceed total units.")
    if hotel_repository.find_availability_rule_by_room_type(db, tenant_id=tenant.id, room_type_id=room_type_id):
        raise ConflictError("Availability rule already exists for this room type.")

    availability_rule = hotel_repository.create_availability_rule(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        room_type_id=room_type_id,
        total_units=total_units,
        available_units_snapshot=available_units_snapshot,
        minimum_stay_nights=minimum_stay_nights,
        maximum_stay_nights=maximum_stay_nights,
        blackout_dates=blackout_dates,
        is_active=is_active,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.availability_rule.created",
        # subject_type="hotel_availability_rule",
        # subject_id=str(availability_rule.id),
        # metadata={"property_id": str(property_id), "room_type_id": str(room_type_id)},
    # )
    db.commit()
    return _serialize_availability_rule(availability_rule)


def list_reservations(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    status: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_reservation(item)
        for item in hotel_repository.list_reservations(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            status=status,
        )
    ]


def create_reservation(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    room_type_id: str,
    room_id: str | None,
    meal_plan_id: str | None,
    booking_reference: str | None,
    booking_source: str | None,
    guest_customer_id: str,
    guest_name: str | None,
    check_in_date: date,
    check_out_date: date,
    status: str,
    special_requests: str | None,
    early_check_in: bool,
    late_check_out: bool,
    total_amount_minor: int,
    currency: str,
    adults: int,
    children: int,
) -> dict[str, object]:
    if check_in_date >= check_out_date:
        raise ConflictError("Reservation check-out date must be after check-in date.")

    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    room_type = _room_type_or_raise(db, tenant_id=tenant.id, room_type_id=room_type_id)

    if room_type.property_id != property_id:
        raise ConflictError("Room type does not belong to the provided property.")
    room = None
    if room_id is not None:
        room = _room_or_raise(db, tenant_id=tenant.id, room_id=room_id)
        if room.property_id != property_id or room.room_type_id != room_type_id:
            raise ConflictError("Room does not match the provided property and room type.")
        if room.sell_status in {"maintenance", "blocked", "out_of_order"}:
            raise ConflictError("Room is blocked for maintenance or operational hold.")
        if hotel_repository.find_conflicting_reservation(
            db,
            tenant_id=tenant.id,
            room_id=room_id,
            check_in_date=check_in_date,
            check_out_date=check_out_date,
        ):
            raise ConflictError("Room already has an overlapping active reservation.")

    meal_plan = None
    if meal_plan_id is not None:
        meal_plan = _meal_plan_or_raise(db, tenant_id=tenant.id, meal_plan_id=meal_plan_id)
        if meal_plan.property_id != property_id:
            raise ConflictError("Meal plan does not belong to the provided property.")

    guest_profile = hotel_repository.get_guest_profile(db, tenant_id=tenant.id, guest_profile_id=guest_customer_id)
    resolved_guest_name = guest_name
    if guest_profile is not None and not resolved_guest_name:
        resolved_guest_name = f"{guest_profile.first_name} {guest_profile.last_name}".strip()

    reservation = hotel_repository.create_reservation(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        room_type_id=room_type_id,
        room_id=room_id,
        meal_plan_id=meal_plan.id if meal_plan else None,
        booking_reference=booking_reference,
        booking_source=booking_source,
        guest_customer_id=guest_customer_id,
        guest_name=resolved_guest_name,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        status=status,
        special_requests=special_requests,
        early_check_in=early_check_in,
        late_check_out=late_check_out,
        actual_check_in_at=None,
        actual_check_out_at=None,
        total_amount_minor=total_amount_minor,
        currency=currency,
        adults=adults,
        children=children,
    )
    reservation.booking_reference = _booking_reference(reservation)
    folio = hotel_repository.create_folio(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        reservation_id=reservation.id,
        guest_customer_id=guest_customer_id,
        guest_name=resolved_guest_name,
        status="open",
        currency=currency,
        subtotal_minor=0,
        tax_minor=0,
        total_minor=0,
        paid_minor=0,
        balance_minor=0,
        invoice_number=None,
        invoice_issued_at=None,
        closed_at=None,
    )
    if total_amount_minor > 0:
        hotel_repository.create_folio_charge(
            db,
            tenant_id=tenant.id,
            folio_id=folio.id,
            reservation_id=reservation.id,
            category="reservation_base",
            label=f"Reservation base {reservation.booking_reference}",
            service_date=check_in_date,
            quantity=1,
            unit_amount_minor=total_amount_minor,
            line_amount_minor=total_amount_minor,
            tax_amount_minor=0,
            notes="Auto-generated from reservation quoted total.",
            created_by_user_id=actor_user_id,
        )
        _recalculate_folio_totals(db, folio)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.reservation.created",
        # subject_type="hotel_reservation",
        # subject_id=str(reservation.id),
        # metadata={
            # "room_id": str(room_id) if room_id else None,
            # "property_id": str(property_id),
            # "status": reservation.status,
            # "folio_id": str(folio.id),
        # },
    # )
    _outbox_reservation(db, tenant_id=tenant.id, reservation=reservation, event_status=reservation.status)
    db.commit()
    return _serialize_reservation(reservation)


def list_stays(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    status: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_stay(item)
        for item in hotel_repository.list_stays(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            status=status,
        )
    ]


def get_stay_detail(
    db: Session,
    *,
    tenant_slug: str,
    stay_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    stay = _stay_or_raise(db, tenant_id=tenant.id, stay_id=stay_id)
    room_moves = hotel_repository.list_room_moves(db, tenant_id=tenant.id, stay_id=stay.id)
    return _serialize_stay(stay, room_moves=room_moves)


def record_room_move(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    stay_id: str,
    to_room_id: str,
    reason: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    stay = _stay_or_raise(db, tenant_id=tenant.id, stay_id=stay_id)
    if stay.status != "in_house":
        raise ConflictError("Only in-house stays can be moved.")

    reservation = _reservation_or_raise(db, tenant_id=tenant.id, reservation_id=stay.reservation_id)
    from_room = _room_or_raise(db, tenant_id=tenant.id, room_id=stay.room_id)
    to_room = _room_or_raise(db, tenant_id=tenant.id, room_id=to_room_id)
    if to_room.id == from_room.id:
        raise ConflictError("Destination room must be different from the current room.")
    if to_room.property_id != stay.property_id:
        raise ConflictError("Destination room must belong to the same property.")
    if to_room.sell_status in {"maintenance", "blocked", "out_of_order"}:
        raise ConflictError("Destination room is not sellable.")
    if to_room.occupancy_status != "vacant" or to_room.housekeeping_status == "dirty":
        raise ConflictError("Destination room is not ready for occupancy.")
    if hotel_repository.find_conflicting_reservation(
        db,
        tenant_id=tenant.id,
        room_id=to_room_id,
        check_in_date=reservation.check_in_date,
        check_out_date=reservation.check_out_date,
        exclude_reservation_id=reservation.id,
    ):
        raise ConflictError("Destination room already has an overlapping active reservation.")

    moved_at = datetime.now(tz=UTC).isoformat()
    hotel_repository.create_room_move(
        db,
        tenant_id=tenant.id,
        property_id=stay.property_id,
        stay_id=stay.id,
        reservation_id=stay.reservation_id,
        from_room_id=from_room.id,
        to_room_id=to_room.id,
        moved_at=moved_at,
        reason=reason,
        moved_by_user_id=actor_user_id,
    )
    _set_room_state(from_room, occupancy_status="vacant", housekeeping_status="dirty")
    _set_room_state(to_room, occupancy_status="occupied")
    stay.room_id = to_room.id
    stay.room_type_id = to_room.room_type_id
    reservation.room_id = to_room.id
    reservation.room_type_id = to_room.room_type_id
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.stay.room_moved",
        # subject_type="hotel_stay",
        # subject_id=str(stay.id),
        # metadata={
            # "from_room_id": str(from_room.id),
            # "to_room_id": str(to_room.id),
            # "from_room_type_id": str(from_room.room_type_id),
            # "to_room_type_id": str(to_room.room_type_id),
            # "reason": reason,
        # },
    # )
    _outbox_reservation(db, tenant_id=tenant.id, reservation=reservation, event_status=reservation.status)
    db.commit()
    return get_stay_detail(db, tenant_slug=tenant_slug, stay_id=stay_id)


def list_folios(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    reservation_id: str | None,
    status: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_folio(item)
        for item in hotel_repository.list_folios(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            reservation_id=reservation_id,
            status=status,
        )
    ]


def get_folio_detail(
    db: Session,
    *,
    tenant_slug: str,
    folio_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    folio = _folio_or_raise(db, tenant_id=tenant.id, folio_id=folio_id)
    charges = hotel_repository.list_folio_charges(db, tenant_id=tenant.id, folio_id=folio.id)
    payments = hotel_repository.list_payments(db, tenant_id=tenant.id, folio_id=folio.id)
    refunds = hotel_repository.list_refunds(db, tenant_id=tenant.id, folio_id=folio.id)
    _recalculate_folio_totals(db, folio)
    db.flush()
    return _serialize_folio(folio, charges=charges, payments=payments, refunds=refunds)


def add_folio_charge(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    folio_id: str,
    category: str,
    label: str,
    service_date: date,
    quantity: int,
    unit_amount_minor: int,
    tax_amount_minor: int,
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    folio = _folio_or_raise(db, tenant_id=tenant.id, folio_id=folio_id)
    if folio.status == "invoiced":
        raise ConflictError("Cannot add charges after the folio has been invoiced.")

    line_amount_minor = quantity * unit_amount_minor
    charge = hotel_repository.create_folio_charge(
        db,
        tenant_id=tenant.id,
        folio_id=folio.id,
        reservation_id=folio.reservation_id,
        category=category,
        label=label,
        service_date=service_date,
        quantity=quantity,
        unit_amount_minor=unit_amount_minor,
        line_amount_minor=line_amount_minor,
        tax_amount_minor=tax_amount_minor,
        notes=notes,
        created_by_user_id=actor_user_id,
    )
    _recalculate_folio_totals(db, folio)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.folio.charge_created",
        # subject_type="hotel_folio_charge",
        # subject_id=str(charge.id),
        # metadata={"folio_id": str(folio.id), "category": category, "gross_amount_minor": line_amount_minor + tax_amount_minor},
    # )
    db.commit()
    return get_folio_detail(db, tenant_slug=tenant_slug, folio_id=folio_id)


def record_payment(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    folio_id: str,
    amount_minor: int,
    payment_method: str,
    reference: str | None,
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    folio = _folio_or_raise(db, tenant_id=tenant.id, folio_id=folio_id)
    if folio.status != "open":
        raise ConflictError("Payments can only be posted to an open folio.")
    _recalculate_folio_totals(db, folio)
    if amount_minor > folio.balance_minor:
        raise ConflictError("Payment cannot exceed the current folio balance.")

    payment = hotel_repository.create_payment(
        db,
        tenant_id=tenant.id,
        property_id=folio.property_id,
        folio_id=folio.id,
        reservation_id=folio.reservation_id,
        amount_minor=amount_minor,
        currency=folio.currency,
        payment_method=payment_method,
        status="posted",
        reference=reference,
        notes=notes,
        received_at=datetime.now(tz=UTC).isoformat(),
        recorded_by_user_id=actor_user_id,
    )
    _recalculate_folio_totals(db, folio)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.payment.recorded",
        # subject_type="hotel_payment",
        # subject_id=str(payment.id),
        # metadata={"folio_id": str(folio.id), "amount_minor": amount_minor, "payment_method": payment_method},
    # )
    db.commit()
    return get_folio_detail(db, tenant_slug=tenant_slug, folio_id=folio_id)


def list_refunds(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    folio_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_refund(item)
        for item in hotel_repository.list_refunds(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            folio_id=folio_id,
        )
    ]


def record_refund(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    folio_id: str,
    payment_id: str,
    amount_minor: int,
    reason: str,
    reference: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    folio = _folio_or_raise(db, tenant_id=tenant.id, folio_id=folio_id)
    payment = _payment_or_raise(db, tenant_id=tenant.id, payment_id=payment_id)
    if folio.status != "open":
        raise ConflictError("Refunds can only be posted to an open folio.")
    if payment.folio_id != folio.id:
        raise ConflictError("Payment does not belong to the provided folio.")
    if payment.status != "posted":
        raise ConflictError("Only posted payments can be refunded.")

    existing_refunds = hotel_repository.list_refunds(db, tenant_id=tenant.id, folio_id=folio.id)
    refunded_for_payment_minor = sum(
        item.amount_minor for item in existing_refunds if item.payment_id == payment.id and item.status == "processed"
    )
    refundable_balance_minor = payment.amount_minor - refunded_for_payment_minor
    if amount_minor > refundable_balance_minor:
        raise ConflictError("Refund amount exceeds the refundable balance for this payment.")

    refund = hotel_repository.create_refund(
        db,
        tenant_id=tenant.id,
        property_id=folio.property_id,
        folio_id=folio.id,
        payment_id=payment.id,
        reservation_id=folio.reservation_id,
        amount_minor=amount_minor,
        currency=folio.currency,
        reason=reason,
        reference=reference,
        status="processed",
        refunded_at=datetime.now(tz=UTC).isoformat(),
        recorded_by_user_id=actor_user_id,
    )
    _recalculate_folio_totals(db, folio)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.refund.recorded",
        # subject_type="hotel_refund",
        # subject_id=str(refund.id),
        # metadata={"folio_id": str(folio.id), "payment_id": str(payment.id), "amount_minor": amount_minor},
    # )
    db.commit()
    return get_folio_detail(db, tenant_slug=tenant_slug, folio_id=folio_id)


def close_folio(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    folio_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    folio = _folio_or_raise(db, tenant_id=tenant.id, folio_id=folio_id)
    reservation = _reservation_or_raise(db, tenant_id=tenant.id, reservation_id=folio.reservation_id)
    _recalculate_folio_totals(db, folio)

    if folio.balance_minor != 0:
        raise ConflictError("Folio cannot be closed while a balance remains.")
    if reservation.status not in {"checked_out", "cancelled", "no_show"}:
        raise ConflictError("Folio can only be closed after checkout, cancellation, or no-show.")

    folio.status = "closed"
    folio.closed_at = folio.closed_at or datetime.now(tz=UTC).isoformat()
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.folio.closed",
        # subject_type="hotel_folio",
        # subject_id=str(folio.id),
        # metadata={"reservation_id": str(folio.reservation_id)},
    # )
    db.commit()
    return get_folio_detail(db, tenant_slug=tenant_slug, folio_id=folio_id)


def issue_folio_invoice(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    folio_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    folio = _folio_or_raise(db, tenant_id=tenant.id, folio_id=folio_id)
    reservation = _reservation_or_raise(db, tenant_id=tenant.id, reservation_id=folio.reservation_id)
    _recalculate_folio_totals(db, folio)

    if folio.balance_minor != 0:
        raise ConflictError("Invoice cannot be issued while folio balance remains.")
    if reservation.status not in {"checked_out", "cancelled", "no_show"}:
        raise ConflictError("Invoice can only be issued for terminal reservation states.")

    folio.closed_at = folio.closed_at or datetime.now(tz=UTC).isoformat()
    folio.status = "invoiced"
    folio.invoice_number = _invoice_number(folio)
    folio.invoice_issued_at = datetime.now(tz=UTC).isoformat()
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.invoice.issued",
        # subject_type="hotel_folio",
        # subject_id=str(folio.id),
        # metadata={"invoice_number": folio.invoice_number, "reservation_id": str(folio.reservation_id)},
    # )
    _outbox_invoice(db, tenant_id=tenant.id, folio=folio)
    db.commit()
    return get_folio_detail(db, tenant_slug=tenant_slug, folio_id=folio_id)


def list_staff_members(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_staff_member(item)
        for item in hotel_repository.list_staff_members(db, tenant_id=tenant.id, property_id=property_id)
    ]


def create_staff_member(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    staff_code: str,
    first_name: str,
    last_name: str,
    role: str,
    department: str,
    phone: str | None,
    email: str | None,
    employment_status: str,
    is_active: bool,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    if hotel_repository.find_staff_member_by_code(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        staff_code=staff_code,
    ):
        raise ConflictError(f"Hotel staff code '{staff_code}' already exists for this property.")

    staff_member = hotel_repository.create_staff_member(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        staff_code=staff_code,
        first_name=first_name,
        last_name=last_name,
        role=role,
        department=department,
        phone=phone,
        email=email,
        employment_status=employment_status,
        is_active=is_active,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.staff_member.created",
        # subject_type="hotel_staff_member",
        # subject_id=str(staff_member.id),
        # metadata={"property_id": str(property_id), "staff_code": staff_code, "department": department},
    # )
    db.commit()
    return _serialize_staff_member(staff_member)


def list_shifts(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    staff_member_id: str | None,
    shift_date: date | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_shift(item)
        for item in hotel_repository.list_shifts(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            staff_member_id=staff_member_id,
            shift_date=shift_date,
        )
    ]


def create_shift(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    staff_member_id: str,
    shift_date: date,
    shift_kind: str,
    start_time: str,
    end_time: str,
    status: str,
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    staff_member = _staff_member_or_raise(db, tenant_id=tenant.id, staff_member_id=staff_member_id)
    if staff_member.property_id != property_id:
        raise ConflictError("Staff member does not belong to the provided property.")

    shift = hotel_repository.create_shift(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        staff_member_id=staff_member_id,
        shift_date=shift_date,
        shift_kind=shift_kind,
        start_time=start_time,
        end_time=end_time,
        status=status,
        notes=notes,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.shift.created",
        # subject_type="hotel_shift",
        # subject_id=str(shift.id),
        # metadata={"property_id": str(property_id), "staff_member_id": str(staff_member_id), "shift_kind": shift_kind},
    # )
    db.commit()
    return _serialize_shift(shift)


def list_night_audits(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        # _serialize_night_audit(item)
        for item in hotel_repository.list_night_audits(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
        )
    ]


def run_night_audit(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    audit_date: date,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    if hotel_repository.find_night_audit_by_date(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        audit_date=audit_date,
    ):
        raise ConflictError("Night audit already exists for this property and date.")

    reservations = hotel_repository.list_reservations(db, tenant_id=tenant.id, property_id=property_id)
    folios = hotel_repository.list_folios(db, tenant_id=tenant.id, property_id=property_id)
    payments = hotel_repository.list_payments(db, tenant_id=tenant.id, property_id=property_id)
    housekeeping_tasks = hotel_repository.list_housekeeping_tasks(db, tenant_id=tenant.id, property_id=property_id)
    maintenance_tickets = hotel_repository.list_maintenance_tickets(db, tenant_id=tenant.id, property_id=property_id)
    rooms = hotel_repository.list_rooms(db, tenant_id=tenant.id, property_id=property_id)

    in_house = [
        item for item in reservations
        if item.status == "checked_in" and item.check_in_date <= audit_date < item.check_out_date
    ]
    arrivals = [
        item for item in reservations
        if item.status in {"reserved", "checked_in"} and item.check_in_date == audit_date
    ]
    departures = [
        item for item in reservations
        if item.status in {"checked_in", "checked_out"} and item.check_out_date == audit_date
    ]
    due_departure_blockers = [
        item.id for item in reservations if item.status == "checked_in" and item.check_out_date <= audit_date
    ]
    open_balance_folios = [item for item in folios if item.balance_minor > 0]
    pending_housekeeping = [item for item in housekeeping_tasks if item.status != "completed"]
    open_maintenance = [item for item in maintenance_tickets if item.status in {"open", "in_progress"}]
    total_payments_minor = sum(
        item.amount_minor
        for item in payments
        if item.status == "posted" and item.received_at[:10] <= audit_date.isoformat()
    )
    occupied_rooms = len([room for room in rooms if room.occupancy_status == "occupied"])
    report = {
        "rooms_occupied": occupied_rooms,
        "in_house_reservations": len(in_house),
        "arrivals": len(arrivals),
        "departures": len(departures),
        "open_folios_with_balance": len(open_balance_folios),
        "open_balance_minor": sum(item.balance_minor for item in open_balance_folios),
        "payments_minor": total_payments_minor,
        "pending_housekeeping_tasks": len(pending_housekeeping),
        "open_maintenance_tickets": len(open_maintenance),
        "due_departure_blockers": due_departure_blockers,
    }
    audit_status = "attention_required" if due_departure_blockers or open_balance_folios else "completed"

    # audit = hotel_repository.create_night_audit(
        # db,
        # tenant_id=tenant.id,
        # property_id=property_id,
        # audit_date=audit_date,
        # status=audit_status,
        # report_json=report,
        # completed_at=datetime.now(tz=UTC).isoformat(),
        # completed_by_user_id=actor_user_id,
    # )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.night_audit.completed",
        # subject_type="hotel_night_audit",
        # subject_id=str(audit.id),
        # metadata={"property_id": str(property_id), "audit_date": audit_date.isoformat(), "status": audit_status},
    # )
    db.commit()
    # return _serialize_night_audit(audit)


def assign_reservation_room(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    reservation_id: str,
    room_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    reservation = _reservation_or_raise(db, tenant_id=tenant.id, reservation_id=reservation_id)
    if reservation.status not in {"pending", "reserved"}:
        raise ConflictError("Only pending or reserved bookings can receive a room assignment.")

    room = _room_or_raise(db, tenant_id=tenant.id, room_id=room_id)
    if room.property_id != reservation.property_id or room.room_type_id != reservation.room_type_id:
        raise ConflictError("Assigned room does not match the reservation property and room type.")
    if room.sell_status in {"maintenance", "blocked", "out_of_order"}:
        raise ConflictError("Assigned room is not sellable.")
    if hotel_repository.find_conflicting_reservation(
        db,
        tenant_id=tenant.id,
        room_id=room_id,
        check_in_date=reservation.check_in_date,
        check_out_date=reservation.check_out_date,
        exclude_reservation_id=reservation.id,
    ):
        raise ConflictError("Assigned room has an overlapping active reservation.")

    reservation.room_id = room_id
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.reservation.room_assigned",
        # subject_type="hotel_reservation",
        # subject_id=str(reservation.id),
        # metadata={"room_id": str(room_id)},
    # )
    _outbox_reservation(db, tenant_id=tenant.id, reservation=reservation, event_status=reservation.status)
    db.commit()
    return _serialize_reservation(reservation)


def update_reservation_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    reservation_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    reservation = _reservation_or_raise(db, tenant_id=tenant.id, reservation_id=reservation_id)
    room = _room_or_raise(db, tenant_id=tenant.id, room_id=reservation.room_id) if reservation.room_id else None
    stay = hotel_repository.find_stay_by_reservation(db, tenant_id=tenant.id, reservation_id=reservation.id)

    if status == "checked_in":
        if reservation.status != "reserved":
            raise ConflictError("Only reserved bookings can be checked in.")
        if room is None:
            raise ConflictError("Room must be assigned before check-in.")
        if room.sell_status in {"maintenance", "blocked", "out_of_order"}:
            raise ConflictError("Room is not available for check-in.")
        if room.occupancy_status != "vacant" or room.housekeeping_status == "dirty":
            raise ConflictError("Room is not operationally ready for check-in.")
        reservation.status = "checked_in"
        reservation.actual_check_in_at = reservation.actual_check_in_at or datetime.now(tz=UTC).isoformat()
        _set_room_state(room, occupancy_status="occupied")
        if stay is None:
            stay = hotel_repository.create_stay(
                db,
                tenant_id=tenant.id,
                property_id=reservation.property_id,
                reservation_id=reservation.id,
                room_type_id=reservation.room_type_id,
                room_id=room.id,
                guest_customer_id=reservation.guest_customer_id,
                guest_name=reservation.guest_name,
                status="in_house",
                checked_in_at=reservation.actual_check_in_at,
                checked_out_at=None,
                notes=reservation.special_requests,
            )
        else:
            stay.status = "in_house"
            stay.room_id = room.id
            stay.checked_in_at = reservation.actual_check_in_at
    elif status == "checked_out":
        if reservation.status != "checked_in":
            raise ConflictError("Only checked-in bookings can be checked out.")
        if room is None:
            raise ConflictError("Checked-in booking is missing an assigned room.")
        if stay is None:
            raise ConflictError("Checked-in booking is missing an in-house stay record.")
        reservation.status = "checked_out"
        reservation.actual_check_out_at = datetime.now(tz=UTC).isoformat()
        _set_room_state(
            room,
            occupancy_status="vacant",
            housekeeping_status="dirty",
        )
        stay.status = "checked_out"
        stay.checked_out_at = reservation.actual_check_out_at
        if not hotel_repository.find_open_housekeeping_task(db, tenant_id=tenant.id, room_id=room.id):
            hotel_repository.create_housekeeping_task(
                db,
                tenant_id=tenant.id,
                property_id=reservation.property_id,
                room_id=room.id,
                status="pending",
                priority="high",
                notes="Auto-created on checkout.",
                assigned_staff_id=None,
                assigned_to=None,
            )
    elif status == "reserved":
        if reservation.status != "pending":
            raise ConflictError("Only pending bookings can be moved to reserved.")
        reservation.status = "reserved"
    elif status == "cancelled":
        if reservation.status not in {"pending", "reserved"}:
            raise ConflictError("Only pending or reserved bookings can be cancelled.")
        reservation.status = "cancelled"
    elif status == "no_show":
        if reservation.status != "reserved":
            raise ConflictError("Only reserved bookings can be marked as no-show.")
        reservation.status = "no_show"
    else:
        raise ConflictError(f"Reservation status '{status}' is not supported.")

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.reservation.updated",
        # subject_type="hotel_reservation",
        # subject_id=str(reservation.id),
        # metadata={"status": reservation.status, "room_id": str(room.id) if room else None},
    # )
    _outbox_reservation(db, tenant_id=tenant.id, reservation=reservation, event_status=reservation.status)
    db.commit()
    return _serialize_reservation(reservation)


def list_housekeeping_tasks(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    status: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_housekeeping_task(item)
        for item in hotel_repository.list_housekeeping_tasks(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            status=status,
        )
    ]


def create_housekeeping_task(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    room_id: str,
    priority: str,
    notes: str | None,
    assigned_staff_id: str | None,
    assigned_to: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    room = _room_or_raise(db, tenant_id=tenant.id, room_id=room_id)
    if room.property_id != property_id:
        raise ConflictError("Room does not belong to the provided property.")
    staff_member = None
    resolved_assigned_to = assigned_to
    if assigned_staff_id is not None:
        staff_member = _staff_member_or_raise(db, tenant_id=tenant.id, staff_member_id=assigned_staff_id)
        if staff_member.property_id != property_id:
            raise ConflictError("Assigned staff member does not belong to the provided property.")
        resolved_assigned_to = f"{staff_member.first_name} {staff_member.last_name}".strip()

    task = hotel_repository.create_housekeeping_task(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        room_id=room_id,
        status="pending",
        priority=priority,
        notes=notes,
        assigned_staff_id=assigned_staff_id,
        assigned_to=resolved_assigned_to,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.housekeeping.created",
        # subject_type="hotel_housekeeping_task",
        # subject_id=str(task.id),
        # metadata={"room_id": str(room_id), "priority": priority, "assigned_staff_id": str(assigned_staff_id) if assigned_staff_id else None},
    # )
    db.commit()
    return _serialize_housekeeping_task(task)


def update_housekeeping_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    task_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    task = _housekeeping_or_raise(db, tenant_id=tenant.id, task_id=task_id)
    room = _room_or_raise(db, tenant_id=tenant.id, room_id=task.room_id)
    task.status = status

    if status == "completed":
        _set_room_state(
            room,
            housekeeping_status="clean",
            last_cleaned_at=datetime.now(tz=UTC).isoformat(),
        )
    elif status == "in_progress" and room.housekeeping_status == "clean":
        _set_room_state(room, housekeeping_status="dirty")

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.housekeeping.updated",
        # subject_type="hotel_housekeeping_task",
        # subject_id=str(task.id),
        # metadata={"status": status, "room_id": str(room.id)},
    # )
    db.commit()
    return _serialize_housekeeping_task(task)


def list_maintenance_tickets(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    status: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_maintenance_ticket(item)
        for item in hotel_repository.list_maintenance_tickets(
            db,
            tenant_id=tenant.id,
            property_id=property_id,
            status=status,
        )
    ]


def create_maintenance_ticket(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    room_id: str | None,
    title: str,
    description: str | None,
    priority: str,
    assigned_staff_id: str | None,
    assigned_to: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)

    room = None
    if room_id is not None:
        room = _room_or_raise(db, tenant_id=tenant.id, room_id=room_id)
        if room.property_id != property_id:
            raise ConflictError("Room does not belong to the provided property.")
        _set_room_state(room, sell_status="maintenance")
    staff_member = None
    resolved_assigned_to = assigned_to
    if assigned_staff_id is not None:
        staff_member = _staff_member_or_raise(db, tenant_id=tenant.id, staff_member_id=assigned_staff_id)
        if staff_member.property_id != property_id:
            raise ConflictError("Assigned staff member does not belong to the provided property.")
        resolved_assigned_to = f"{staff_member.first_name} {staff_member.last_name}".strip()

    ticket = hotel_repository.create_maintenance_ticket(
        db,
        tenant_id=tenant.id,
        property_id=property_id,
        room_id=room_id,
        title=title,
        description=description,
        status="open",
        priority=priority,
        assigned_staff_id=assigned_staff_id,
        assigned_to=resolved_assigned_to,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.maintenance.created",
        # subject_type="hotel_maintenance_ticket",
        # subject_id=str(ticket.id),
        # metadata={"room_id": str(room_id) if room_id else None, "priority": priority, "assigned_staff_id": str(assigned_staff_id) if assigned_staff_id else None},
    # )
    db.commit()
    return _serialize_maintenance_ticket(ticket)


def update_maintenance_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    ticket_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    ticket = _maintenance_or_raise(db, tenant_id=tenant.id, ticket_id=ticket_id)
    ticket.status = status

    if ticket.room_id and status == "resolved":
        room = _room_or_raise(db, tenant_id=tenant.id, room_id=ticket.room_id)
        other_open_tickets = [
            item for item in hotel_repository.find_open_maintenance_tickets_for_room(db, tenant_id=tenant.id, room_id=room.id)
            if item.id != ticket.id
        ]
        if not other_open_tickets and room.sell_status == "maintenance":
            _set_room_state(room, sell_status="sellable")

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.maintenance.updated",
        # subject_type="hotel_maintenance_ticket",
        # subject_id=str(ticket.id),
        # metadata={"status": status, "room_id": str(ticket.room_id) if ticket.room_id else None},
    # )
    db.commit()
    return _serialize_maintenance_ticket(ticket)


def get_property_profile(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    property_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    db_name = tenant.mongo_db_name
    property_model = _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    document = store.get_document(
        collection=HOTEL_PROFILE_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=_hotel_doc_key(property_id),
        database_name=db_name
    )
    if document is None:
        payload = _default_property_profile(property_model)
        store.upsert_document(
            collection=HOTEL_PROFILE_COLLECTION,
            tenant_slug=tenant.slug,
            document_key=_hotel_doc_key(property_id),
            payload=payload,
            database_name=db_name
        )
        return payload
    return document["payload"]


def upsert_property_profile(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    payload: dict[str, object],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    db_name = tenant.mongo_db_name
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    profile_payload = {
        "property_id": property_id,
        **payload,
        "updated_at": datetime.now(tz=UTC).isoformat(),
    }
    store.upsert_document(
        collection=HOTEL_PROFILE_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=_hotel_doc_key(property_id),
        payload=profile_payload,
        database_name=db_name
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.property_profile.updated",
        # subject_type="hotel_property_profile",
        # subject_id=str(property_id),
        # metadata={"property_id": str(property_id)},
    # )
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=tenant.id,
        aggregate_id=property_id,
        event_name="publishing.content.published",
        payload_json={"page_slug": "stay", "route_path": "/stay", "property_id": property_id},
    )
    db.commit()
    return profile_payload


def get_amenity_catalog(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    property_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    db_name = tenant.mongo_db_name
    property_model = _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    document = store.get_document(
        collection=HOTEL_AMENITY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=_hotel_doc_key(property_id),
        database_name=db_name
    )
    if document is None:
        payload = _default_amenity_catalog(property_model)
        store.upsert_document(
            collection=HOTEL_AMENITY_COLLECTION,
            tenant_slug=tenant.slug,
            document_key=_hotel_doc_key(property_id),
            payload=payload,
            database_name=db_name
        )
        return payload
    return document["payload"]


def upsert_amenity_catalog(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    payload: dict[str, object],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    db_name = tenant.mongo_db_name
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    amenity_payload = {
        "property_id": property_id,
        **payload,
        "updated_at": datetime.now(tz=UTC).isoformat(),
    }
    store.upsert_document(
        collection=HOTEL_AMENITY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=_hotel_doc_key(property_id),
        payload=amenity_payload,
        database_name=db_name
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.amenity_catalog.updated",
        # subject_type="hotel_amenity_catalog",
        # subject_id=str(property_id),
        # metadata={"property_id": str(property_id), "category_count": len(amenity_payload["categories"])},
    # )
    db.commit()
    return amenity_payload


def get_nearby_places(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    property_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    db_name = tenant.mongo_db_name
    property_model = _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    document = store.get_document(
        collection=HOTEL_NEARBY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=_hotel_doc_key(property_id),
        database_name=db_name
    )
    if document is None:
        payload = _default_nearby_places(property_model)
        store.upsert_document(
            collection=HOTEL_NEARBY_COLLECTION,
            tenant_slug=tenant.slug,
            document_key=_hotel_doc_key(property_id),
            payload=payload,
            database_name=db_name
        )
        return payload
    return document["payload"]


def upsert_nearby_places(
    db: Session,
    store: RuntimeDocumentStore,
    *,
    tenant_slug: str,
    actor_user_id: str,
    property_id: str,
    payload: dict[str, object],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    db_name = tenant.mongo_db_name
    _property_or_raise(db, tenant_id=tenant.id, property_id=property_id)
    nearby_payload = {
        "property_id": property_id,
        **payload,
        "updated_at": datetime.now(tz=UTC).isoformat(),
    }
    store.upsert_document(
        collection=HOTEL_NEARBY_COLLECTION,
        tenant_slug=tenant.slug,
        document_key=_hotel_doc_key(property_id),
        payload=nearby_payload,
        database_name=db_name
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="hotel.nearby_places.updated",
        # subject_type="hotel_nearby_places",
        # subject_id=str(property_id),
        # metadata={"property_id": str(property_id), "place_count": len(nearby_payload["places"])},
    # )
    db.commit()
    return nearby_payload


def get_report_summary(
    db: Session,
    *,
    tenant_slug: str,
    property_id: str | None,
    from_date: date,
    to_date: date,
) -> dict[str, object]:
    if from_date > to_date:
        raise ConflictError("Report start date cannot be later than end date.")

    tenant = _tenant(db, tenant_slug)
    rooms = hotel_repository.list_rooms(db, tenant_id=tenant.id, property_id=property_id)
    reservations = hotel_repository.list_reservations(db, tenant_id=tenant.id, property_id=property_id)
    stays = hotel_repository.list_stays(db, tenant_id=tenant.id, property_id=property_id)
    folios = hotel_repository.list_folios(db, tenant_id=tenant.id, property_id=property_id)
    payments = hotel_repository.list_payments(db, tenant_id=tenant.id, property_id=property_id)
    refunds = hotel_repository.list_refunds(db, tenant_id=tenant.id, property_id=property_id)
    housekeeping_tasks = hotel_repository.list_housekeeping_tasks(db, tenant_id=tenant.id, property_id=property_id)
    maintenance_tickets = hotel_repository.list_maintenance_tickets(db, tenant_id=tenant.id, property_id=property_id)
    night_audits = hotel_repository.list_night_audits(db, tenant_id=tenant.id, property_id=property_id)

    filtered_reservations = [
        item for item in reservations
        if item.check_in_date <= to_date and item.check_out_date >= from_date
    ]
    filtered_reservation_ids = {item.id for item in filtered_reservations}
    filtered_stays = [item for item in stays if item.reservation_id in filtered_reservation_ids]
    room_moves = []
    for stay in filtered_stays:
        room_moves.extend(hotel_repository.list_room_moves(db, tenant_id=tenant.id, stay_id=stay.id))
    filtered_room_moves = room_moves
    filtered_payments = [
        item for item in payments
        if item.status == "posted" and from_date.isoformat() <= item.received_at[:10] <= to_date.isoformat()
    ]
    filtered_refunds = [
        item for item in refunds
        if item.status == "processed" and from_date.isoformat() <= item.refunded_at[:10] <= to_date.isoformat()
    ]
    filtered_night_audits = [
        item for item in night_audits
        if from_date <= item.audit_date <= to_date
    ]

    period_days = (to_date - from_date).days + 1
    total_room_nights = len(rooms) * period_days
    sold_room_nights = 0
    room_revenue_minor = 0
    for reservation in filtered_reservations:
        overlap_start = max(reservation.check_in_date, from_date)
        overlap_end = min(reservation.check_out_date, to_date)
        nights = max((overlap_end - overlap_start).days, 0)
        sold_room_nights += nights
        room_revenue_minor += reservation.total_amount_minor

    occupancy_rate = round((sold_room_nights / total_room_nights) * 100, 2) if total_room_nights else 0.0
    adr_minor = round(room_revenue_minor / sold_room_nights) if sold_room_nights else 0
    open_folio_balance_minor = sum(item.balance_minor for item in folios)
    completed_housekeeping = len([item for item in housekeeping_tasks if item.status == "completed"])
    total_housekeeping = len(housekeeping_tasks)

    return {
        "tenant_id": tenant.slug,
        "property_id": property_id,
        "from_date": from_date.isoformat(),
        "to_date": to_date.isoformat(),
        "rooms": len(rooms),
        "reservations": len(filtered_reservations),
        "stays": len(filtered_stays),
        "room_moves": len(filtered_room_moves),
        "occupancy_rate": occupancy_rate,
        "sold_room_nights": sold_room_nights,
        "room_nights_capacity": total_room_nights,
        "room_revenue_minor": room_revenue_minor,
        "adr_minor": adr_minor,
        "payments_collected_minor": sum(item.amount_minor for item in filtered_payments),
        "refunds_minor": sum(item.amount_minor for item in filtered_refunds),
        "open_folio_balance_minor": open_folio_balance_minor,
        "housekeeping_completion_rate": (
            round((completed_housekeeping / total_housekeeping) * 100, 2) if total_housekeeping else 0.0
        ),
        "open_maintenance_tickets": len([item for item in maintenance_tickets if item.status in {"open", "in_progress"}]),
        "night_audits": len(filtered_night_audits),
        "night_audits_attention_required": len(
            [item for item in filtered_night_audits if item.status == "attention_required"]
        ),
    }


def load_external_hotel_plan() -> dict[str, object]:
    repo_root = Path(__file__).resolve().parents[4]
    adapter_file = repo_root / "adapters" / "external-sources" / "hotel-rent-mongo.yaml"
    manifest = yaml.safe_load(adapter_file.read_text(encoding="utf-8"))
    return {
        "adapter_id": manifest["adapter_id"],
        "source_type": manifest["source_type"],
        "vertical_pack": manifest["vertical_pack"],
        "entity_count": len(manifest["entities"]),
        "entities": [
            {
                "source_entity": entity["source_entity"],
                "canonical_entity": entity["canonical_entity"],
                "dedupe_keys": entity.get("dedupe_keys", []),
            }
            for entity in manifest["entities"]
        ],
    }
