from __future__ import annotations

from datetime import date

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
    HotelShift,
    HotelStaffMember,
    HotelStay,
)


ACTIVE_RESERVATION_STATUSES = {"pending", "reserved", "checked_in"}
OPEN_MAINTENANCE_STATUSES = {"open", "in_progress"}


async def list_properties(db_name: str) -> list[HotelProperty]:
    return await HotelProperty.find().sort("-created_at").to_list()


async def get_property(db_name: str, *, property_id: str) -> HotelProperty | None:
    return await HotelProperty.find_one(HotelProperty.id == property_id)


async def find_property_by_code(db_name: str, *, code: str) -> HotelProperty | None:
    return await HotelProperty.find_one(HotelProperty.code == code)


async def create_property(
    db_name: str,
    *,
    name: str,
    code: str,
    city: str,
    country: str,
    timezone: str,
) -> HotelProperty:
    model = HotelProperty(name=name, code=code, city=city, country=country, timezone=timezone)
    await model.insert()
    return model


async def list_room_types(db_name: str, *, property_id: str | None = None) -> list[HotelRoomType]:
    query = HotelRoomType.find()
    if property_id:
        query = query.find(HotelRoomType.property_id == property_id)
    return await query.sort("-created_at").to_list()


async def get_room_type(db_name: str, *, room_type_id: str) -> HotelRoomType | None:
    return await HotelRoomType.find_one(HotelRoomType.id == room_type_id)


async def find_room_type_by_code(db_name: str, *, property_id: str, code: str) -> HotelRoomType | None:
    return await HotelRoomType.find_one(
        HotelRoomType.property_id == property_id,
        HotelRoomType.code == code,
    )


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
    amenity_ids: list[str],
) -> HotelRoomType:
    model = HotelRoomType(
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
    await model.insert()
    return model


async def list_rooms(db_name: str, *, property_id: str | None = None) -> list[HotelRoom]:
    query = HotelRoom.find()
    if property_id:
        query = query.find(HotelRoom.property_id == property_id)
    return await query.sort("-created_at").to_list()


async def get_room(db_name: str, *, room_id: str) -> HotelRoom | None:
    return await HotelRoom.find_one(HotelRoom.id == room_id)


async def find_room_by_number(db_name: str, *, property_id: str, room_number: str) -> HotelRoom | None:
    return await HotelRoom.find_one(
        HotelRoom.property_id == property_id,
        HotelRoom.room_number == room_number,
    )


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
    floor_label: str | None,
) -> HotelRoom:
    model = HotelRoom(
        property_id=property_id,
        room_type_id=room_type_id,
        room_number=room_number,
        status=status,
        occupancy_status=occupancy_status,
        housekeeping_status=housekeeping_status,
        sell_status=sell_status,
        is_active=is_active,
        feature_tags=feature_tags,
        notes=notes,
        last_cleaned_at=last_cleaned_at,
        floor_label=floor_label,
    )
    await model.insert()
    return model


async def list_meal_plans(db_name: str, *, property_id: str | None = None) -> list[HotelMealPlan]:
    query = HotelMealPlan.find()
    if property_id:
        query = query.find(HotelMealPlan.property_id == property_id)
    return await query.sort("-created_at").to_list()


async def get_meal_plan(db_name: str, *, meal_plan_id: str) -> HotelMealPlan | None:
    return await HotelMealPlan.find_one(HotelMealPlan.id == meal_plan_id)


async def find_meal_plan_by_code(db_name: str, *, property_id: str, code: str) -> HotelMealPlan | None:
    return await HotelMealPlan.find_one(
        HotelMealPlan.property_id == property_id,
        HotelMealPlan.code == code,
    )


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
    is_active: bool,
) -> HotelMealPlan:
    model = HotelMealPlan(
        property_id=property_id,
        code=code,
        name=name,
        description=description,
        price_per_person_per_night_minor=price_per_person_per_night_minor,
        currency=currency,
        included_meals=included_meals,
        is_active=is_active,
    )
    await model.insert()
    return model


async def list_guest_profiles(db_name: str) -> list[HotelGuestProfile]:
    return await HotelGuestProfile.find().sort("-created_at").to_list()


async def get_guest_profile(
    db_name: str,
    *,
    guest_profile_id: str | None = None,
    profile_id: str | None = None,
) -> HotelGuestProfile | None:
    lookup_id = guest_profile_id or profile_id
    if lookup_id is None:
        return None
    return await HotelGuestProfile.find_one(HotelGuestProfile.id == lookup_id)


async def find_guest_profile_by_email(db_name: str, *, email: str) -> HotelGuestProfile | None:
    return await HotelGuestProfile.find_one(HotelGuestProfile.email == email)


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
    notes: str | None,
) -> HotelGuestProfile:
    model = HotelGuestProfile(
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
    await model.insert()
    return model


async def list_guest_documents(db_name: str, *, guest_profile_id: str) -> list[HotelGuestDocument]:
    return await HotelGuestDocument.find(HotelGuestDocument.guest_profile_id == guest_profile_id).sort(
        "-created_at"
    ).to_list()


async def create_guest_document(
    db_name: str,
    *,
    guest_profile_id: str,
    document_kind: str,
    document_number: str,
    issuing_country: str | None,
    expires_on: date | None,
    verification_status: str,
    storage_key: str | None,
    notes: str | None,
) -> HotelGuestDocument:
    model = HotelGuestDocument(
        guest_profile_id=guest_profile_id,
        document_kind=document_kind,
        document_number=document_number,
        issuing_country=issuing_country,
        expires_on=expires_on,
        verification_status=verification_status,
        storage_key=storage_key,
        notes=notes,
    )
    await model.insert()
    return model


async def list_rate_plans(
    db_name: str,
    *,
    property_id: str | None = None,
    room_type_id: str | None = None,
) -> list[HotelRatePlan]:
    query = HotelRatePlan.find()
    if property_id:
        query = query.find(HotelRatePlan.property_id == property_id)
    if room_type_id:
        query = query.find(HotelRatePlan.room_type_id == room_type_id)
    return await query.sort("-created_at").to_list()


async def get_rate_plan(db_name: str, *, rate_plan_id: str) -> HotelRatePlan | None:
    return await HotelRatePlan.find_one(HotelRatePlan.id == rate_plan_id)


async def find_rate_plan_by_label(db_name: str, *, room_type_id: str, label: str) -> HotelRatePlan | None:
    return await HotelRatePlan.find_one(
        HotelRatePlan.room_type_id == room_type_id,
        HotelRatePlan.label == label,
    )


async def create_rate_plan(
    db_name: str,
    *,
    property_id: str,
    room_type_id: str,
    label: str,
    currency: str,
    weekend_enabled: bool,
    weekend_rate_minor: int | None,
    seasonal_overrides: list[dict[str, object]],
    is_active: bool,
) -> HotelRatePlan:
    model = HotelRatePlan(
        property_id=property_id,
        room_type_id=room_type_id,
        label=label,
        currency=currency,
        weekend_enabled=weekend_enabled,
        weekend_rate_minor=weekend_rate_minor,
        seasonal_overrides=seasonal_overrides,
        is_active=is_active,
    )
    await model.insert()
    return model


async def list_availability_rules(
    db_name: str,
    *,
    property_id: str | None = None,
    room_type_id: str | None = None,
) -> list[HotelAvailabilityRule]:
    query = HotelAvailabilityRule.find()
    if property_id:
        query = query.find(HotelAvailabilityRule.property_id == property_id)
    if room_type_id:
        query = query.find(HotelAvailabilityRule.room_type_id == room_type_id)
    return await query.sort("-created_at").to_list()


async def get_availability_rule(db_name: str, *, rule_id: str) -> HotelAvailabilityRule | None:
    return await HotelAvailabilityRule.find_one(HotelAvailabilityRule.id == rule_id)


async def find_availability_rule_by_room_type(
    db_name: str,
    *,
    room_type_id: str,
) -> HotelAvailabilityRule | None:
    return await HotelAvailabilityRule.find_one(HotelAvailabilityRule.room_type_id == room_type_id)


async def create_availability_rule(
    db_name: str,
    *,
    property_id: str,
    room_type_id: str,
    total_units: int,
    available_units_snapshot: int | None,
    minimum_stay_nights: int,
    maximum_stay_nights: int,
    blackout_dates: list[str],
    is_active: bool,
) -> HotelAvailabilityRule:
    model = HotelAvailabilityRule(
        property_id=property_id,
        room_type_id=room_type_id,
        total_units=total_units,
        available_units_snapshot=available_units_snapshot,
        minimum_stay_nights=minimum_stay_nights,
        maximum_stay_nights=maximum_stay_nights,
        blackout_dates=blackout_dates,
        is_active=is_active,
    )
    await model.insert()
    return model


async def list_reservations(
    db_name: str,
    *,
    property_id: str | None = None,
    status: str | None = None,
) -> list[HotelReservation]:
    query = HotelReservation.find()
    if property_id:
        query = query.find(HotelReservation.property_id == property_id)
    if status:
        query = query.find(HotelReservation.status == status)
    return await query.sort("-created_at").to_list()


async def get_reservation(db_name: str, *, reservation_id: str) -> HotelReservation | None:
    return await HotelReservation.find_one(HotelReservation.id == reservation_id)


async def find_conflicting_reservation(
    db_name: str,
    *,
    room_id: str,
    check_in_date: date,
    check_out_date: date,
    exclude_reservation_id: str | None = None,
) -> HotelReservation | None:
    reservations = await HotelReservation.find(
        HotelReservation.room_id == room_id,
    ).to_list()
    for reservation in reservations:
        if exclude_reservation_id and reservation.id == exclude_reservation_id:
            continue
        if reservation.status not in ACTIVE_RESERVATION_STATUSES:
            continue
        overlaps = check_in_date < reservation.check_out_date and check_out_date > reservation.check_in_date
        if overlaps:
            return reservation
    return None


async def create_reservation(
    db_name: str,
    *,
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
    actual_check_in_at: str | None,
    actual_check_out_at: str | None,
    total_amount_minor: int,
    currency: str,
    adults: int,
    children: int,
) -> HotelReservation:
    model = HotelReservation(
        property_id=property_id,
        room_type_id=room_type_id,
        room_id=room_id,
        meal_plan_id=meal_plan_id,
        booking_reference=booking_reference,
        booking_source=booking_source,
        guest_customer_id=guest_customer_id,
        guest_name=guest_name,
        check_in_date=check_in_date,
        check_out_date=check_out_date,
        status=status,
        special_requests=special_requests,
        early_check_in=early_check_in,
        late_check_out=late_check_out,
        actual_check_in_at=actual_check_in_at,
        actual_check_out_at=actual_check_out_at,
        total_amount_minor=total_amount_minor,
        currency=currency,
        adults=adults,
        children=children,
    )
    await model.insert()
    return model


async def list_stays(
    db_name: str,
    *,
    property_id: str | None = None,
    status: str | None = None,
) -> list[HotelStay]:
    query = HotelStay.find()
    if property_id:
        query = query.find(HotelStay.property_id == property_id)
    if status:
        query = query.find(HotelStay.status == status)
    return await query.sort("-created_at").to_list()


async def get_stay(db_name: str, *, stay_id: str) -> HotelStay | None:
    return await HotelStay.find_one(HotelStay.id == stay_id)


async def find_stay_by_reservation(db_name: str, *, reservation_id: str) -> HotelStay | None:
    return await HotelStay.find_one(HotelStay.reservation_id == reservation_id)


async def create_stay(
    db_name: str,
    *,
    property_id: str,
    reservation_id: str,
    room_type_id: str,
    room_id: str,
    guest_customer_id: str,
    guest_name: str | None,
    status: str,
    checked_in_at: str,
    checked_out_at: str | None,
    notes: str | None,
) -> HotelStay:
    model = HotelStay(
        property_id=property_id,
        reservation_id=reservation_id,
        room_type_id=room_type_id,
        room_id=room_id,
        guest_customer_id=guest_customer_id,
        guest_name=guest_name,
        status=status,
        checked_in_at=checked_in_at,
        checked_out_at=checked_out_at,
        notes=notes,
    )
    await model.insert()
    return model


async def list_room_moves(db_name: str, *, stay_id: str) -> list[HotelRoomMove]:
    return await HotelRoomMove.find(HotelRoomMove.stay_id == stay_id).sort("moved_at").to_list()


async def create_room_move(
    db_name: str,
    *,
    property_id: str,
    stay_id: str,
    reservation_id: str,
    from_room_id: str,
    to_room_id: str,
    moved_at: str,
    reason: str,
    moved_by_user_id: str,
) -> HotelRoomMove:
    model = HotelRoomMove(
        property_id=property_id,
        stay_id=stay_id,
        reservation_id=reservation_id,
        from_room_id=from_room_id,
        to_room_id=to_room_id,
        moved_at=moved_at,
        reason=reason,
        moved_by_user_id=moved_by_user_id,
    )
    await model.insert()
    return model


async def list_folios(
    db_name: str,
    *,
    property_id: str | None = None,
    reservation_id: str | None = None,
    status: str | None = None,
) -> list[HotelFolio]:
    query = HotelFolio.find()
    if property_id:
        query = query.find(HotelFolio.property_id == property_id)
    if reservation_id:
        query = query.find(HotelFolio.reservation_id == reservation_id)
    if status:
        query = query.find(HotelFolio.status == status)
    return await query.sort("-created_at").to_list()


async def get_folio(db_name: str, *, folio_id: str) -> HotelFolio | None:
    return await HotelFolio.find_one(HotelFolio.id == folio_id)


async def create_folio(
    db_name: str,
    *,
    property_id: str,
    reservation_id: str,
    guest_customer_id: str,
    guest_name: str | None,
    status: str,
    currency: str,
    subtotal_minor: int,
    tax_minor: int,
    total_minor: int,
    paid_minor: int,
    balance_minor: int,
    invoice_number: str | None,
    invoice_issued_at: str | None,
    closed_at: str | None,
) -> HotelFolio:
    model = HotelFolio(
        property_id=property_id,
        reservation_id=reservation_id,
        guest_customer_id=guest_customer_id,
        guest_name=guest_name,
        status=status,
        currency=currency,
        subtotal_minor=subtotal_minor,
        tax_minor=tax_minor,
        total_minor=total_minor,
        paid_minor=paid_minor,
        balance_minor=balance_minor,
        invoice_number=invoice_number,
        invoice_issued_at=invoice_issued_at,
        closed_at=closed_at,
    )
    await model.insert()
    return model


async def list_folio_charges(db_name: str, *, folio_id: str) -> list[HotelFolioCharge]:
    return await HotelFolioCharge.find(HotelFolioCharge.folio_id == folio_id).sort("service_date", "created_at").to_list()


async def create_folio_charge(
    db_name: str,
    *,
    folio_id: str,
    reservation_id: str,
    category: str,
    label: str,
    service_date: date,
    quantity: int,
    unit_amount_minor: int,
    line_amount_minor: int,
    tax_amount_minor: int,
    notes: str | None,
    created_by_user_id: str,
) -> HotelFolioCharge:
    model = HotelFolioCharge(
        folio_id=folio_id,
        reservation_id=reservation_id,
        category=category,
        label=label,
        service_date=service_date,
        quantity=quantity,
        unit_amount_minor=unit_amount_minor,
        line_amount_minor=line_amount_minor,
        tax_amount_minor=tax_amount_minor,
        notes=notes,
        created_by_user_id=created_by_user_id,
    )
    await model.insert()
    return model


async def list_payments(
    db_name: str,
    *,
    property_id: str | None = None,
    folio_id: str | None = None,
) -> list[HotelPayment]:
    query = HotelPayment.find()
    if property_id:
        query = query.find(HotelPayment.property_id == property_id)
    if folio_id:
        query = query.find(HotelPayment.folio_id == folio_id)
    return await query.sort("-created_at").to_list()


async def get_payment(db_name: str, *, payment_id: str) -> HotelPayment | None:
    return await HotelPayment.find_one(HotelPayment.id == payment_id)


async def create_payment(
    db_name: str,
    *,
    property_id: str,
    folio_id: str,
    reservation_id: str,
    amount_minor: int,
    currency: str,
    payment_method: str,
    status: str,
    reference: str | None,
    notes: str | None,
    received_at: str,
    recorded_by_user_id: str,
) -> HotelPayment:
    model = HotelPayment(
        property_id=property_id,
        folio_id=folio_id,
        reservation_id=reservation_id,
        amount_minor=amount_minor,
        currency=currency,
        payment_method=payment_method,
        status=status,
        reference=reference,
        notes=notes,
        received_at=received_at,
        recorded_by_user_id=recorded_by_user_id,
    )
    await model.insert()
    return model


async def list_refunds(
    db_name: str,
    *,
    property_id: str | None = None,
    folio_id: str | None = None,
) -> list[HotelRefund]:
    query = HotelRefund.find()
    if property_id:
        query = query.find(HotelRefund.property_id == property_id)
    if folio_id:
        query = query.find(HotelRefund.folio_id == folio_id)
    return await query.sort("-created_at").to_list()


async def create_refund(
    db_name: str,
    *,
    property_id: str,
    folio_id: str,
    payment_id: str,
    reservation_id: str,
    amount_minor: int,
    currency: str,
    reason: str,
    reference: str | None,
    status: str,
    refunded_at: str,
    recorded_by_user_id: str,
) -> HotelRefund:
    model = HotelRefund(
        property_id=property_id,
        folio_id=folio_id,
        payment_id=payment_id,
        reservation_id=reservation_id,
        amount_minor=amount_minor,
        currency=currency,
        reason=reason,
        reference=reference,
        status=status,
        refunded_at=refunded_at,
        recorded_by_user_id=recorded_by_user_id,
    )
    await model.insert()
    return model


async def list_staff_members(db_name: str, *, property_id: str | None = None) -> list[HotelStaffMember]:
    query = HotelStaffMember.find()
    if property_id:
        query = query.find(HotelStaffMember.property_id == property_id)
    return await query.sort("-created_at").to_list()


async def get_staff_member(db_name: str, *, staff_member_id: str) -> HotelStaffMember | None:
    return await HotelStaffMember.find_one(HotelStaffMember.id == staff_member_id)


async def find_staff_member_by_code(db_name: str, *, property_id: str, staff_code: str) -> HotelStaffMember | None:
    return await HotelStaffMember.find_one(
        HotelStaffMember.property_id == property_id,
        HotelStaffMember.staff_code == staff_code,
    )


async def create_staff_member(
    db_name: str,
    *,
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
) -> HotelStaffMember:
    model = HotelStaffMember(
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
    await model.insert()
    return model


async def list_shifts(
    db_name: str,
    *,
    property_id: str | None = None,
    staff_member_id: str | None = None,
    shift_date: date | None = None,
) -> list[HotelShift]:
    query = HotelShift.find()
    if property_id:
        query = query.find(HotelShift.property_id == property_id)
    if staff_member_id:
        query = query.find(HotelShift.staff_member_id == staff_member_id)
    if shift_date:
        query = query.find(HotelShift.shift_date == shift_date)
    return await query.sort("-shift_date", "-created_at").to_list()


async def create_shift(
    db_name: str,
    *,
    property_id: str,
    staff_member_id: str,
    shift_date: date,
    shift_kind: str,
    start_time: str,
    end_time: str,
    status: str,
    notes: str | None,
) -> HotelShift:
    model = HotelShift(
        property_id=property_id,
        staff_member_id=staff_member_id,
        shift_date=shift_date,
        shift_kind=shift_kind,
        start_time=start_time,
        end_time=end_time,
        status=status,
        notes=notes,
    )
    await model.insert()
    return model


async def list_night_audits(db_name: str, *, property_id: str | None = None) -> list[HotelNightAudit]:
    query = HotelNightAudit.find()
    if property_id:
        query = query.find(HotelNightAudit.property_id == property_id)
    return await query.sort("-audit_date", "-created_at").to_list()


async def find_night_audit_by_date(
    db_name: str,
    *,
    property_id: str,
    audit_date: date,
) -> HotelNightAudit | None:
    return await HotelNightAudit.find_one(
        HotelNightAudit.property_id == property_id,
        HotelNightAudit.audit_date == audit_date,
    )


async def create_night_audit(
    db_name: str,
    *,
    property_id: str,
    audit_date: date,
    status: str,
    report_json: dict[str, object],
    completed_at: str,
    completed_by_user_id: str,
) -> HotelNightAudit:
    model = HotelNightAudit(
        property_id=property_id,
        audit_date=audit_date,
        status=status,
        report_json=report_json,
        completed_at=completed_at,
        completed_by_user_id=completed_by_user_id,
    )
    await model.insert()
    return model


async def list_housekeeping_tasks(
    db_name: str,
    *,
    property_id: str | None = None,
    status: str | None = None,
) -> list[HotelHousekeepingTask]:
    query = HotelHousekeepingTask.find()
    if property_id:
        query = query.find(HotelHousekeepingTask.property_id == property_id)
    if status:
        query = query.find(HotelHousekeepingTask.status == status)
    return await query.sort("-created_at").to_list()


async def get_housekeeping_task(db_name: str, *, task_id: str) -> HotelHousekeepingTask | None:
    return await HotelHousekeepingTask.find_one(HotelHousekeepingTask.id == task_id)


async def find_open_housekeeping_task(db_name: str, *, room_id: str) -> HotelHousekeepingTask | None:
    tasks = await HotelHousekeepingTask.find(HotelHousekeepingTask.room_id == room_id).sort("-created_at").to_list()
    for task in tasks:
        if task.status != "completed":
            return task
    return None


async def create_housekeeping_task(
    db_name: str,
    *,
    property_id: str,
    room_id: str,
    status: str,
    priority: str,
    notes: str | None,
    assigned_staff_id: str | None,
    assigned_to: str | None,
) -> HotelHousekeepingTask:
    model = HotelHousekeepingTask(
        property_id=property_id,
        room_id=room_id,
        status=status,
        priority=priority,
        notes=notes,
        assigned_staff_id=assigned_staff_id,
        assigned_to=assigned_to,
    )
    await model.insert()
    return model


async def list_maintenance_tickets(
    db_name: str,
    *,
    property_id: str | None = None,
    status: str | None = None,
) -> list[HotelMaintenanceTicket]:
    query = HotelMaintenanceTicket.find()
    if property_id:
        query = query.find(HotelMaintenanceTicket.property_id == property_id)
    if status:
        query = query.find(HotelMaintenanceTicket.status == status)
    return await query.sort("-created_at").to_list()


async def get_maintenance_ticket(db_name: str, *, ticket_id: str) -> HotelMaintenanceTicket | None:
    return await HotelMaintenanceTicket.find_one(HotelMaintenanceTicket.id == ticket_id)


async def find_open_maintenance_tickets_for_room(
    db_name: str,
    *,
    room_id: str,
) -> list[HotelMaintenanceTicket]:
    tickets = await HotelMaintenanceTicket.find(HotelMaintenanceTicket.room_id == room_id).sort("-created_at").to_list()
    return [ticket for ticket in tickets if ticket.status in OPEN_MAINTENANCE_STATUSES]


async def create_maintenance_ticket(
    db_name: str,
    *,
    property_id: str,
    room_id: str | None,
    title: str,
    description: str | None,
    status: str,
    priority: str,
    assigned_staff_id: str | None,
    assigned_to: str | None,
) -> HotelMaintenanceTicket:
    model = HotelMaintenanceTicket(
        property_id=property_id,
        room_id=room_id,
        title=title,
        description=description,
        status=status,
        priority=priority,
        assigned_staff_id=assigned_staff_id,
        assigned_to=assigned_to,
    )
    await model.insert()
    return model
