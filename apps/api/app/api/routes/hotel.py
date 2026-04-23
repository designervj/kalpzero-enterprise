from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authz import require_permission
from app.core.security import SessionContext
from app.db.mongo import RuntimeDocumentStore, get_runtime_document_store
from app.db.session import get_db_session
from app.schemas.requests import (
    CreateHotelAvailabilityRuleRequest,
    CreateHotelFolioChargeRequest,
    CreateHotelGuestProfileRequest,
    CreateHotelGuestDocumentRequest,
    CreateHotelHousekeepingTaskRequest,
    CreateHotelMaintenanceTicketRequest,
    CreateHotelMealPlanRequest,
    CreateHotelNightAuditRequest,
    CreateHotelPaymentRequest,
    CreateHotelPropertyRequest,
    CreateHotelRatePlanRequest,
    CreateHotelReservationRequest,
    CreateHotelRefundRequest,
    CreateHotelRoomMoveRequest,
    CreateHotelRoomRequest,
    CreateHotelRoomTypeRequest,
    CreateHotelShiftRequest,
    CreateHotelStaffMemberRequest,
    UpsertHotelAmenityCatalogRequest,
    UpsertHotelNearbyPlacesRequest,
    UpsertHotelPropertyProfileRequest,
    HotelReservationAssignmentRequest,
    HotelHousekeepingStatusRequest,
    HotelMaintenanceStatusRequest,
    HotelReservationStatusRequest,
)
from app.services.errors import ConflictError, NotFoundError
from app.services.hotel import (
    add_folio_charge,
    assign_reservation_room,
    close_folio,
    create_guest_document,
    create_guest_profile,
    create_housekeeping_task,
    create_availability_rule,
    create_maintenance_ticket,
    create_meal_plan,
    create_property,
    create_rate_plan,
    create_reservation,
    create_room,
    create_room_type,
    create_shift,
    create_staff_member,
    get_folio_detail,
    get_inventory_summary,
    get_amenity_catalog,
    get_overview,
    get_property_profile,
    get_report_summary,
    get_stay_detail,
    get_nearby_places,
    issue_folio_invoice,
    list_folios,
    list_guest_documents,
    list_guest_profiles,
    list_housekeeping_tasks,
    list_availability_rules,
    list_maintenance_tickets,
    list_meal_plans,
    list_night_audits,
    list_properties,
    list_refunds,
    list_rate_plans,
    list_reservations,
    list_room_types,
    list_rooms,
    list_stays,
    list_shifts,
    list_staff_members,
    record_room_move,
    record_refund,
    record_payment,
    run_night_audit,
    upsert_amenity_catalog,
    upsert_nearby_places,
    upsert_property_profile,
    update_housekeeping_status,
    update_maintenance_status,
    update_reservation_status,
)

router = APIRouter()


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, ConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise exc


@router.get("/overview")
async def hotel_overview(
    session: SessionContext = Depends(require_permission("hotel.reservations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_overview(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name)
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/inventory/summary")
@router.get("/inventory-summary")
async def hotel_inventory_summary(
    property_id: str | None = None,
    for_date: date | None = None,
    session: SessionContext = Depends(require_permission("hotel.rooms.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "items": await get_inventory_summary(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                for_date=for_date or date.today(),
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/properties")
async def hotel_properties(
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "properties": await list_properties(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/properties", status_code=status.HTTP_201_CREATED)
async def hotel_properties_create(
    payload: CreateHotelPropertyRequest,
    session: SessionContext = Depends(require_permission("hotel.properties.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_property(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            name=payload.name,
            code=payload.code,
            city=payload.city,
            country=payload.country,
            timezone=payload.timezone,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/room-types")
async def hotel_room_types(
    property_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "room_types": await list_room_types(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, property_id=property_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/room-types", status_code=status.HTTP_201_CREATED)
async def hotel_room_types_create(
    payload: CreateHotelRoomTypeRequest,
    session: SessionContext = Depends(require_permission("hotel.rooms.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_room_type(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            name=payload.name,
            code=payload.code,
            category=payload.category,
            bed_type=payload.bed_type,
            occupancy=payload.occupancy,
            room_size_sqm=payload.room_size_sqm,
            base_rate_minor=payload.base_rate_minor,
            extra_bed_price_minor=payload.extra_bed_price_minor,
            refundable=payload.refundable,
            currency=payload.currency,
            amenity_ids=payload.amenity_ids,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/meal-plans")
async def hotel_meal_plans(
    property_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "meal_plans": await list_meal_plans(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, property_id=property_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/meal-plans", status_code=status.HTTP_201_CREATED)
async def hotel_meal_plans_create(
    payload: CreateHotelMealPlanRequest,
    session: SessionContext = Depends(require_permission("hotel.properties.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_meal_plan(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
            price_per_person_per_night_minor=payload.price_per_person_per_night_minor,
            currency=payload.currency,
            included_meals=payload.included_meals,
            is_active=payload.is_active,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/rate-plans")
async def hotel_rate_plans(
    property_id: str | None = None,
    room_type_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "rate_plans": await list_rate_plans(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                room_type_id=room_type_id,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/rate-plans", status_code=status.HTTP_201_CREATED)
async def hotel_rate_plans_create(
    payload: CreateHotelRatePlanRequest,
    session: SessionContext = Depends(require_permission("hotel.properties.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_rate_plan(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            room_type_id=payload.room_type_id,
            label=payload.label,
            currency=payload.currency,
            weekend_enabled=payload.weekend_enabled,
            weekend_rate_minor=payload.weekend_rate_minor,
            seasonal_overrides=[item.model_dump(mode="json") for item in payload.seasonal_overrides],
            is_active=payload.is_active,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/availability-rules")
async def hotel_availability_rules(
    property_id: str | None = None,
    room_type_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.rooms.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "availability_rules": await list_availability_rules(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                room_type_id=room_type_id,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/availability-rules", status_code=status.HTTP_201_CREATED)
async def hotel_availability_rules_create(
    payload: CreateHotelAvailabilityRuleRequest,
    session: SessionContext = Depends(require_permission("hotel.rooms.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_availability_rule(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            room_type_id=payload.room_type_id,
            total_units=payload.total_units,
            available_units_snapshot=payload.available_units_snapshot,
            minimum_stay_nights=payload.minimum_stay_nights,
            maximum_stay_nights=payload.maximum_stay_nights,
            blackout_dates=payload.blackout_dates,
            is_active=payload.is_active,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/rooms")
async def hotel_rooms(
    property_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.rooms.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "rooms": await list_rooms(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, property_id=property_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/rooms", status_code=status.HTTP_201_CREATED)
async def hotel_rooms_create(
    payload: CreateHotelRoomRequest,
    session: SessionContext = Depends(require_permission("hotel.rooms.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_room(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            room_type_id=payload.room_type_id,
            room_number=payload.room_number,
            status=payload.status,
            occupancy_status=payload.occupancy_status,
            housekeeping_status=payload.housekeeping_status,
            sell_status=payload.sell_status,
            is_active=payload.is_active,
            feature_tags=payload.feature_tags,
            notes=payload.notes,
            last_cleaned_at=payload.last_cleaned_at,
            floor_label=payload.floor_label,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/guests")
async def hotel_guests(
    session: SessionContext = Depends(require_permission("hotel.reservations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "guests": await list_guest_profiles(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/guests", status_code=status.HTTP_201_CREATED)
async def hotel_guests_create(
    payload: CreateHotelGuestProfileRequest,
    session: SessionContext = Depends(require_permission("hotel.reservations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_guest_profile(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            first_name=payload.first_name,
            last_name=payload.last_name,
            email=payload.email,
            phone=payload.phone,
            nationality=payload.nationality,
            loyalty_tier=payload.loyalty_tier,
            vip=payload.vip,
            preferred_room_type_id=payload.preferred_room_type_id,
            dietary_preference=payload.dietary_preference,
            company_name=payload.company_name,
            identity_document_number=payload.identity_document_number,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/guests/{guest_profile_id}/documents")
async def hotel_guest_documents(
    guest_profile_id: str,
    session: SessionContext = Depends(require_permission("hotel.reservations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "documents": await list_guest_documents(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, guest_profile_id=guest_profile_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/guests/{guest_profile_id}/documents", status_code=status.HTTP_201_CREATED)
async def hotel_guest_documents_create(
    guest_profile_id: str,
    payload: CreateHotelGuestDocumentRequest,
    session: SessionContext = Depends(require_permission("hotel.reservations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_guest_document(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            guest_profile_id=guest_profile_id,
            document_kind=payload.document_kind,
            document_number=payload.document_number,
            issuing_country=payload.issuing_country,
            expires_on=payload.expires_on,
            verification_status=payload.verification_status,
            storage_key=payload.storage_key,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/reservations")
async def hotel_reservations(
    property_id: str | None = None,
    reservation_status: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.reservations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "reservations": await list_reservations(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                status=reservation_status,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/reservations", status_code=status.HTTP_201_CREATED)
async def hotel_reservations_create(
    payload: CreateHotelReservationRequest,
    session: SessionContext = Depends(require_permission("hotel.reservations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_reservation(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            room_type_id=payload.room_type_id,
            room_id=payload.room_id,
            meal_plan_id=payload.meal_plan_id,
            booking_reference=payload.booking_reference,
            booking_source=payload.booking_source,
            guest_customer_id=payload.guest_customer_id,
            guest_name=payload.guest_name,
            check_in_date=payload.check_in_date,
            check_out_date=payload.check_out_date,
            status=payload.status,
            special_requests=payload.special_requests,
            early_check_in=payload.early_check_in,
            late_check_out=payload.late_check_out,
            total_amount_minor=payload.total_amount_minor,
            currency=payload.currency,
            adults=payload.adults,
            children=payload.children,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/reservations/{reservation_id}/assign-room")
@router.post("/reservations/{reservation_id}/assign-room")
async def hotel_reservations_assign_room(
    reservation_id: str,
    payload: HotelReservationAssignmentRequest,
    session: SessionContext = Depends(require_permission("hotel.reservations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await assign_reservation_room(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            reservation_id=reservation_id,
            room_id=payload.room_id,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/reservations/{reservation_id}/status")
@router.post("/reservations/{reservation_id}/status")
async def hotel_reservations_update_status(
    reservation_id: str,
    payload: HotelReservationStatusRequest,
    session: SessionContext = Depends(require_permission("hotel.reservations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_reservation_status(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            reservation_id=reservation_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/stays")
async def hotel_stays(
    property_id: str | None = None,
    stay_status: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.reservations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "stays": await list_stays(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                status=stay_status,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/stays/{stay_id}")
async def hotel_stay_detail(
    stay_id: str,
    session: SessionContext = Depends(require_permission("hotel.reservations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_stay_detail(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, stay_id=stay_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/stays/{stay_id}/room-moves")
@router.post("/stays/{stay_id}/room-move", status_code=status.HTTP_201_CREATED)
async def hotel_stay_room_move(
    stay_id: str,
    payload: CreateHotelRoomMoveRequest,
    session: SessionContext = Depends(require_permission("hotel.reservations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await record_room_move(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            stay_id=stay_id,
            to_room_id=payload.to_room_id,
            reason=payload.reason,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/folios")
async def hotel_folios(
    property_id: str | None = None,
    reservation_id: str | None = None,
    folio_status: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "folios": await list_folios(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                reservation_id=reservation_id,
                status=folio_status,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/folios/{folio_id}")
async def hotel_folio_detail(
    folio_id: str,
    session: SessionContext = Depends(require_permission("hotel.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_folio_detail(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, folio_id=folio_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/folios/{folio_id}/charges", status_code=status.HTTP_201_CREATED)
async def hotel_folio_charge_create(
    folio_id: str,
    payload: CreateHotelFolioChargeRequest,
    session: SessionContext = Depends(require_permission("hotel.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await add_folio_charge(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            folio_id=folio_id,
            category=payload.category,
            label=payload.label,
            service_date=payload.service_date,
            quantity=payload.quantity,
            unit_amount_minor=payload.unit_amount_minor,
            tax_amount_minor=payload.tax_amount_minor,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/folios/{folio_id}/payments", status_code=status.HTTP_201_CREATED)
async def hotel_folio_payment_create(
    folio_id: str,
    payload: CreateHotelPaymentRequest,
    session: SessionContext = Depends(require_permission("hotel.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await record_payment(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            folio_id=folio_id,
            amount_minor=payload.amount_minor,
            payment_method=payload.payment_method,
            reference=payload.reference,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/refunds")
async def hotel_refunds(
    property_id: str | None = None,
    folio_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "refunds": await list_refunds(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                folio_id=folio_id,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/folios/{folio_id}/refunds", status_code=status.HTTP_201_CREATED)
async def hotel_folio_refund_create(
    folio_id: str,
    payload: CreateHotelRefundRequest,
    session: SessionContext = Depends(require_permission("hotel.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await record_refund(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            folio_id=folio_id,
            payment_id=payload.payment_id,
            amount_minor=payload.amount_minor,
            reason=payload.reason,
            reference=payload.reference,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/folios/{folio_id}/close")
async def hotel_folio_close(
    folio_id: str,
    session: SessionContext = Depends(require_permission("hotel.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await close_folio(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            folio_id=folio_id,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/folios/{folio_id}/issue-invoice")
async def hotel_folio_issue_invoice(
    folio_id: str,
    session: SessionContext = Depends(require_permission("hotel.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await issue_folio_invoice(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            folio_id=folio_id,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/staff")
async def hotel_staff(
    property_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.staff.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "staff_members": await list_staff_members(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, property_id=property_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/staff", status_code=status.HTTP_201_CREATED)
async def hotel_staff_create(
    payload: CreateHotelStaffMemberRequest,
    session: SessionContext = Depends(require_permission("hotel.staff.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_staff_member(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            staff_code=payload.staff_code,
            first_name=payload.first_name,
            last_name=payload.last_name,
            role=payload.role,
            department=payload.department,
            phone=payload.phone,
            email=payload.email,
            employment_status=payload.employment_status,
            is_active=payload.is_active,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/shifts")
async def hotel_shifts(
    property_id: str | None = None,
    staff_member_id: str | None = None,
    shift_date: date | None = None,
    session: SessionContext = Depends(require_permission("hotel.staff.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "shifts": await list_shifts(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                staff_member_id=staff_member_id,
                shift_date=shift_date,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/shifts", status_code=status.HTTP_201_CREATED)
async def hotel_shifts_create(
    payload: CreateHotelShiftRequest,
    session: SessionContext = Depends(require_permission("hotel.staff.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_shift(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            staff_member_id=payload.staff_member_id,
            shift_date=payload.shift_date,
            shift_kind=payload.shift_kind,
            start_time=payload.start_time,
            end_time=payload.end_time,
            status=payload.status,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/night-audits")
async def hotel_night_audits(
    property_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "audits": await list_night_audits(db, tenant_slug=session.tenant_id, db_name=session.tenant_db_name, property_id=property_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/night-audits", status_code=status.HTTP_201_CREATED)
async def hotel_night_audits_create(
    payload: CreateHotelNightAuditRequest,
    session: SessionContext = Depends(require_permission("hotel.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await run_night_audit(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            audit_date=payload.audit_date,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/properties/{property_id}/profile")
async def hotel_property_profile(
    property_id: str,
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return await get_property_profile(
            db,
            store,
            tenant_slug=session.tenant_id,
            property_id=property_id,
            db_name=session.tenant_db_name,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.put("/property-profile")
@router.post("/property-profile")
async def hotel_property_profile_upsert(
    payload: UpsertHotelPropertyProfileRequest,
    session: SessionContext = Depends(require_permission("hotel.properties.manage")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return await upsert_property_profile(
            db,
            store,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            db_name=session.tenant_db_name,
            payload={
                "brand_name": payload.brand_name,
                "hero_title": payload.hero_title,
                "hero_summary": payload.hero_summary,
                "description": payload.description,
                "address_line_1": payload.address_line_1,
                "address_line_2": payload.address_line_2,
                "city": payload.city,
                "state": payload.state,
                "country": payload.country,
                "postal_code": payload.postal_code,
                "contact_phone": payload.contact_phone,
                "contact_email": payload.contact_email,
                "website": payload.website,
                "check_in_time": payload.check_in_time,
                "check_out_time": payload.check_out_time,
                "star_rating": payload.star_rating,
                "highlights": payload.highlights,
                "gallery_urls": payload.gallery_urls,
                "policies": payload.policies,
            },
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/properties/{property_id}/amenities")
async def hotel_amenity_catalog(
    property_id: str,
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return await get_amenity_catalog(
            db,
            store,
            tenant_slug=session.tenant_id,
            property_id=property_id,
            db_name=session.tenant_db_name,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.put("/amenities")
@router.post("/amenity-catalog")
async def hotel_amenity_catalog_upsert(
    payload: UpsertHotelAmenityCatalogRequest,
    session: SessionContext = Depends(require_permission("hotel.properties.manage")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return await upsert_amenity_catalog(
            db,
            store,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            db_name=session.tenant_db_name,
            payload={"categories": [item.model_dump() for item in payload.categories]},
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/properties/{property_id}/nearby")
async def hotel_nearby(
    property_id: str,
    session: SessionContext = Depends(require_permission("hotel.properties.read")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return await get_nearby_places(
            db,
            store,
            tenant_slug=session.tenant_id,
            property_id=property_id,
            db_name=session.tenant_db_name,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.put("/nearby")
@router.post("/nearby-places")
async def hotel_nearby_upsert(
    payload: UpsertHotelNearbyPlacesRequest,
    session: SessionContext = Depends(require_permission("hotel.properties.manage")),
    db: Session = Depends(get_db_session),
    store: RuntimeDocumentStore = Depends(get_runtime_document_store),
):
    try:
        return await upsert_nearby_places(
            db,
            store,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            db_name=session.tenant_db_name,
            payload={"places": [item.model_dump() for item in payload.places]},
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/reports/summary")
async def hotel_report_summary(
    from_date: date,
    to_date: date,
    property_id: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_report_summary(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            property_id=property_id,
            from_date=from_date,
            to_date=to_date,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/housekeeping/tasks")
@router.get("/housekeeping-tasks")
async def hotel_housekeeping_tasks(
    property_id: str | None = None,
    task_status: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.operations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "tasks": await list_housekeeping_tasks(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                status=task_status,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/housekeeping/tasks", status_code=status.HTTP_201_CREATED)
@router.post("/housekeeping-tasks", status_code=status.HTTP_201_CREATED)
async def hotel_housekeeping_tasks_create(
    payload: CreateHotelHousekeepingTaskRequest,
    session: SessionContext = Depends(require_permission("hotel.operations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_housekeeping_task(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            room_id=payload.room_id,
            priority=payload.priority,
            notes=payload.notes,
            assigned_staff_id=payload.assigned_staff_id,
            assigned_to=payload.assigned_to,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/housekeeping/tasks/{task_id}/status")
@router.post("/housekeeping-tasks/{task_id}/status")
async def hotel_housekeeping_tasks_update_status(
    task_id: str,
    payload: HotelHousekeepingStatusRequest,
    session: SessionContext = Depends(require_permission("hotel.operations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_housekeeping_status(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            task_id=task_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/maintenance/tickets")
@router.get("/maintenance-tickets")
async def hotel_maintenance_tickets(
    property_id: str | None = None,
    ticket_status: str | None = None,
    session: SessionContext = Depends(require_permission("hotel.operations.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "tickets": await list_maintenance_tickets(
                db,
                tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
                property_id=property_id,
                status=ticket_status,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/maintenance/tickets", status_code=status.HTTP_201_CREATED)
@router.post("/maintenance-tickets", status_code=status.HTTP_201_CREATED)
async def hotel_maintenance_tickets_create(
    payload: CreateHotelMaintenanceTicketRequest,
    session: SessionContext = Depends(require_permission("hotel.operations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_maintenance_ticket(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            property_id=payload.property_id,
            room_id=payload.room_id,
            title=payload.title,
            description=payload.description,
            priority=payload.priority,
            assigned_staff_id=payload.assigned_staff_id,
            assigned_to=payload.assigned_to,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/maintenance/tickets/{ticket_id}/status")
@router.post("/maintenance-tickets/{ticket_id}/status")
async def hotel_maintenance_tickets_update_status(
    ticket_id: str,
    payload: HotelMaintenanceStatusRequest,
    session: SessionContext = Depends(require_permission("hotel.operations.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_maintenance_status(
            db,
            tenant_slug=session.tenant_id, db_name=session.tenant_db_name,
            actor_user_id=session.user_id,
            ticket_id=ticket_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


# router.add_api_route("/overview", hotel_overview, methods=["GET"])
# router.add_api_route("/inventory/summary", hotel_inventory_summary, methods=["GET"])
# router.add_api_route("/properties", hotel_properties, methods=["GET"])
# router.add_api_route("/properties", hotel_properties_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/room-types", hotel_room_types, methods=["GET"])
# router.add_api_route("/room-types", hotel_room_types_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/meal-plans", hotel_meal_plans, methods=["GET"])
# router.add_api_route("/meal-plans", hotel_meal_plans_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/rate-plans", hotel_rate_plans, methods=["GET"])
# router.add_api_route("/rate-plans", hotel_rate_plans_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/availability-rules", hotel_availability_rules, methods=["GET"])
# router.add_api_route("/availability-rules", hotel_availability_rules_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/rooms", hotel_rooms, methods=["GET"])
# router.add_api_route("/rooms", hotel_rooms_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/guests", hotel_guests, methods=["GET"])
# router.add_api_route("/guests", hotel_guests_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/guests/{guest_profile_id}/documents", hotel_guest_documents, methods=["GET"])
# router.add_api_route(
#     "/guests/{guest_profile_id}/documents",
#     hotel_guest_documents_create,
#     methods=["POST"],
#     status_code=status.HTTP_201_CREATED,
# )
# router.add_api_route("/reservations", hotel_reservations, methods=["GET"])
# router.add_api_route("/reservations", hotel_reservations_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/reservations/{reservation_id}/assign-room", hotel_reservations_assign_room, methods=["PATCH"])
# router.add_api_route("/reservations/{reservation_id}/status", hotel_reservations_update_status, methods=["PATCH"])
# router.add_api_route("/stays", hotel_stays, methods=["GET"])
# router.add_api_route("/stays/{stay_id}", hotel_stay_detail, methods=["GET"])
# router.add_api_route("/stays/{stay_id}/room-moves", hotel_stay_room_move, methods=["POST"])
# router.add_api_route("/folios", hotel_folios, methods=["GET"])
# router.add_api_route("/folios/{folio_id}", hotel_folio_detail, methods=["GET"])
# router.add_api_route("/folios/{folio_id}/charges", hotel_folio_charge_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/folios/{folio_id}/payments", hotel_folio_payment_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/refunds", hotel_refunds, methods=["GET"])
# router.add_api_route("/folios/{folio_id}/refunds", hotel_folio_refund_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/folios/{folio_id}/close", hotel_folio_close, methods=["POST"])
# router.add_api_route("/folios/{folio_id}/issue-invoice", hotel_folio_issue_invoice, methods=["POST"])
# router.add_api_route("/staff", hotel_staff, methods=["GET"])
# router.add_api_route("/staff", hotel_staff_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/shifts", hotel_shifts, methods=["GET"])
# router.add_api_route("/shifts", hotel_shifts_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/night-audits", hotel_night_audits, methods=["GET"])
# router.add_api_route("/night-audits", hotel_night_audits_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/property-profile", hotel_property_profile, methods=["GET"])
# router.add_api_route("/property-profile", hotel_property_profile_upsert, methods=["PUT"])
# router.add_api_route("/amenities", hotel_amenity_catalog, methods=["GET"])
# router.add_api_route("/amenities", hotel_amenity_catalog_upsert, methods=["PUT"])
# router.add_api_route("/nearby", hotel_nearby, methods=["GET"])
# router.add_api_route("/nearby", hotel_nearby_upsert, methods=["PUT"])
# router.add_api_route("/reports/summary", hotel_report_summary, methods=["GET"])
# router.add_api_route("/housekeeping/tasks", hotel_housekeeping_tasks, methods=["GET"])
# router.add_api_route("/housekeeping/tasks", hotel_housekeeping_tasks_create, methods=["POST"], status_code=status.HTTP_201_CREATED)
# router.add_api_route("/housekeeping/tasks/{task_id}/status", hotel_housekeeping_tasks_update_status, methods=["PATCH"])
# router.add_api_route("/maintenance/tickets", hotel_maintenance_tickets, methods=["GET"])
# router.add_api_route(
#     "/maintenance/tickets",
#     hotel_maintenance_tickets_create,
#     methods=["POST"],
#     status_code=status.HTTP_201_CREATED,
# )
# router.add_api_route("/maintenance/tickets/{ticket_id}/status", hotel_maintenance_tickets_update_status, methods=["PATCH"])
