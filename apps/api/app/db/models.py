from typing import Any

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin, generate_uuid


class AgencyModel(TimestampMixin, Base):
    __tablename__ = "agencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    region: Mapped[str] = mapped_column(String(32))
    owner_user_id: Mapped[str] = mapped_column(String(255))


class TenantModel(TimestampMixin, Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    agency_id: Mapped[str] = mapped_column(String(36), ForeignKey("agencies.id"), index=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(255))
    infra_mode: Mapped[str] = mapped_column(String(32))
    vertical_packs: Mapped[list[str]] = mapped_column(JSON, default=list)
    feature_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    dedicated_profile_id: Mapped[str | None] = mapped_column(String(120), nullable=True)


class AuditEventModel(TimestampMixin, Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True)
    actor_user_id: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(String(120), index=True)
    subject_type: Mapped[str] = mapped_column(String(120))
    subject_id: Mapped[str] = mapped_column(String(120))
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class ImportSourceModel(TimestampMixin, Base):
    __tablename__ = "import_sources"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    source_type: Mapped[str] = mapped_column(String(32))
    connection_profile_key: Mapped[str] = mapped_column(String(255))
    vertical_pack: Mapped[str] = mapped_column(String(32))
    config_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class ImportJobModel(TimestampMixin, Base):
    __tablename__ = "import_jobs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    source_id: Mapped[str] = mapped_column(String(36), ForeignKey("import_sources.id"), index=True)
    requested_by_user_id: Mapped[str] = mapped_column(String(255))
    mode: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="queued")
    report_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    finished_at: Mapped[str | None] = mapped_column(String(64), nullable=True)


class OutboxEventModel(TimestampMixin, Base):
    __tablename__ = "outbox_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True)
    aggregate_id: Mapped[str] = mapped_column(String(120), index=True)
    event_name: Mapped[str] = mapped_column(String(120), index=True)
    payload_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    published_at: Mapped[str | None] = mapped_column(Text, nullable=True)


class TravelPackageModel(TimestampMixin, Base):
    __tablename__ = "travel_packages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    code: Mapped[str] = mapped_column(String(64), index=True)
    slug: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    origin_city: Mapped[str] = mapped_column(String(120))
    destination_city: Mapped[str] = mapped_column(String(120))
    destination_country: Mapped[str] = mapped_column(String(120))
    duration_days: Mapped[int] = mapped_column(Integer)
    base_price_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="active")


class TravelItineraryDayModel(TimestampMixin, Base):
    __tablename__ = "travel_itinerary_days"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    package_id: Mapped[str] = mapped_column(String(36), ForeignKey("travel_packages.id"), index=True)
    day_number: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text)
    hotel_ref_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    activity_ref_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    transfer_ref_ids: Mapped[list[str]] = mapped_column(JSON, default=list)


class TravelDepartureModel(TimestampMixin, Base):
    __tablename__ = "travel_departures"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    package_id: Mapped[str] = mapped_column(String(36), ForeignKey("travel_packages.id"), index=True)
    departure_date: Mapped[date] = mapped_column(Date)
    return_date: Mapped[date] = mapped_column(Date)
    seats_total: Mapped[int] = mapped_column(Integer)
    seats_available: Mapped[int] = mapped_column(Integer)
    price_override_minor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")


class TravelLeadModel(TimestampMixin, Base):
    __tablename__ = "travel_leads"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    source: Mapped[str] = mapped_column(String(64))
    interested_package_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("travel_packages.id"), nullable=True)
    departure_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("travel_departures.id"), nullable=True)
    customer_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    contact_name: Mapped[str] = mapped_column(String(255))
    contact_phone: Mapped[str] = mapped_column(String(32))
    travelers_count: Mapped[int] = mapped_column(Integer, default=1)
    desired_departure_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    budget_minor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="new")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class HotelPropertyModel(TimestampMixin, Base):
    __tablename__ = "hotel_properties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(64), index=True)
    city: Mapped[str] = mapped_column(String(120))
    country: Mapped[str] = mapped_column(String(120))
    timezone: Mapped[str] = mapped_column(String(64))


class HotelRoomTypeModel(TimestampMixin, Base):
    __tablename__ = "hotel_room_types"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(64))
    category: Mapped[str | None] = mapped_column(String(120), nullable=True)
    bed_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    occupancy: Mapped[int] = mapped_column(Integer)
    room_size_sqm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    base_rate_minor: Mapped[int] = mapped_column(Integer)
    extra_bed_price_minor: Mapped[int] = mapped_column(Integer, default=0)
    refundable: Mapped[bool] = mapped_column(Boolean, default=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    amenity_ids: Mapped[list[str]] = mapped_column(JSON, default=list)


class HotelRoomModel(TimestampMixin, Base):
    __tablename__ = "hotel_rooms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    room_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_room_types.id"), index=True)
    room_number: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="available")
    occupancy_status: Mapped[str] = mapped_column(String(32), default="vacant")
    housekeeping_status: Mapped[str] = mapped_column(String(32), default="clean")
    sell_status: Mapped[str] = mapped_column(String(32), default="sellable")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    feature_tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_cleaned_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    floor_label: Mapped[str | None] = mapped_column(String(64), nullable=True)


class HotelMealPlanModel(TimestampMixin, Base):
    __tablename__ = "hotel_meal_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    code: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_per_person_per_night_minor: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    included_meals: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class HotelGuestProfileModel(TimestampMixin, Base):
    __tablename__ = "hotel_guest_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), index=True)
    phone: Mapped[str] = mapped_column(String(32))
    nationality: Mapped[str | None] = mapped_column(String(120), nullable=True)
    loyalty_tier: Mapped[str | None] = mapped_column(String(64), nullable=True)
    vip: Mapped[bool] = mapped_column(Boolean, default=False)
    preferred_room_type_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hotel_room_types.id"), nullable=True)
    dietary_preference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    identity_document_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class HotelRatePlanModel(TimestampMixin, Base):
    __tablename__ = "hotel_rate_plans"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    room_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_room_types.id"), index=True)
    label: Mapped[str] = mapped_column(String(255))
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    weekend_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    weekend_rate_minor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seasonal_overrides: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class HotelAvailabilityRuleModel(TimestampMixin, Base):
    __tablename__ = "hotel_availability_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    room_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_room_types.id"), index=True)
    total_units: Mapped[int] = mapped_column(Integer)
    available_units_snapshot: Mapped[int | None] = mapped_column(Integer, nullable=True)
    minimum_stay_nights: Mapped[int] = mapped_column(Integer, default=1)
    maximum_stay_nights: Mapped[int] = mapped_column(Integer, default=30)
    blackout_dates: Mapped[list[str]] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class HotelReservationModel(TimestampMixin, Base):
    __tablename__ = "hotel_reservations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    room_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_room_types.id"), index=True)
    room_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hotel_rooms.id"), index=True, nullable=True)
    meal_plan_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hotel_meal_plans.id"), nullable=True)
    booking_reference: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    booking_source: Mapped[str | None] = mapped_column(String(64), nullable=True)
    guest_customer_id: Mapped[str] = mapped_column(String(120))
    guest_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    check_in_date: Mapped[date] = mapped_column(Date)
    check_out_date: Mapped[date] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(32), default="reserved")
    special_requests: Mapped[str | None] = mapped_column(Text, nullable=True)
    early_check_in: Mapped[bool] = mapped_column(Boolean, default=False)
    late_check_out: Mapped[bool] = mapped_column(Boolean, default=False)
    actual_check_in_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    actual_check_out_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    total_amount_minor: Mapped[int] = mapped_column(Integer, default=0)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    adults: Mapped[int] = mapped_column(Integer, default=1)
    children: Mapped[int] = mapped_column(Integer, default=0)


class HotelStayModel(TimestampMixin, Base):
    __tablename__ = "hotel_stays"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_reservations.id"), index=True)
    room_type_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_room_types.id"), index=True)
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_rooms.id"), index=True)
    guest_customer_id: Mapped[str] = mapped_column(String(120))
    guest_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="in_house")
    checked_in_at: Mapped[str] = mapped_column(String(64))
    checked_out_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class HotelRoomMoveModel(TimestampMixin, Base):
    __tablename__ = "hotel_room_moves"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    stay_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_stays.id"), index=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_reservations.id"), index=True)
    from_room_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_rooms.id"), index=True)
    to_room_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_rooms.id"), index=True)
    moved_at: Mapped[str] = mapped_column(String(64))
    reason: Mapped[str] = mapped_column(String(255))
    moved_by_user_id: Mapped[str] = mapped_column(String(255))


class HotelGuestDocumentModel(TimestampMixin, Base):
    __tablename__ = "hotel_guest_documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    guest_profile_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_guest_profiles.id"), index=True)
    document_kind: Mapped[str] = mapped_column(String(64))
    document_number: Mapped[str] = mapped_column(String(120))
    issuing_country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    expires_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    verification_status: Mapped[str] = mapped_column(String(32), default="pending")
    storage_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class HotelFolioModel(TimestampMixin, Base):
    __tablename__ = "hotel_folios"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_reservations.id"), index=True)
    guest_customer_id: Mapped[str] = mapped_column(String(120))
    guest_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    subtotal_minor: Mapped[int] = mapped_column(Integer, default=0)
    tax_minor: Mapped[int] = mapped_column(Integer, default=0)
    total_minor: Mapped[int] = mapped_column(Integer, default=0)
    paid_minor: Mapped[int] = mapped_column(Integer, default=0)
    balance_minor: Mapped[int] = mapped_column(Integer, default=0)
    invoice_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    invoice_issued_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    closed_at: Mapped[str | None] = mapped_column(String(64), nullable=True)


class HotelFolioChargeModel(TimestampMixin, Base):
    __tablename__ = "hotel_folio_charges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    folio_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_folios.id"), index=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_reservations.id"), index=True)
    category: Mapped[str] = mapped_column(String(64))
    label: Mapped[str] = mapped_column(String(255))
    service_date: Mapped[date] = mapped_column(Date)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    unit_amount_minor: Mapped[int] = mapped_column(Integer)
    line_amount_minor: Mapped[int] = mapped_column(Integer)
    tax_amount_minor: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(255))


class HotelPaymentModel(TimestampMixin, Base):
    __tablename__ = "hotel_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    folio_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_folios.id"), index=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_reservations.id"), index=True)
    amount_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    payment_method: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="posted")
    reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[str] = mapped_column(String(64))
    recorded_by_user_id: Mapped[str] = mapped_column(String(255))


class HotelRefundModel(TimestampMixin, Base):
    __tablename__ = "hotel_refunds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    folio_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_folios.id"), index=True)
    payment_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_payments.id"), index=True)
    reservation_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_reservations.id"), index=True)
    amount_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    reason: Mapped[str] = mapped_column(String(255))
    reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="processed")
    refunded_at: Mapped[str] = mapped_column(String(64))
    recorded_by_user_id: Mapped[str] = mapped_column(String(255))


class HotelStaffMemberModel(TimestampMixin, Base):
    __tablename__ = "hotel_staff_members"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    staff_code: Mapped[str] = mapped_column(String(64), index=True)
    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(120))
    department: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employment_status: Mapped[str] = mapped_column(String(32), default="active")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class HotelShiftModel(TimestampMixin, Base):
    __tablename__ = "hotel_shifts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    staff_member_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_staff_members.id"), index=True)
    shift_date: Mapped[date] = mapped_column(Date)
    shift_kind: Mapped[str] = mapped_column(String(32))
    start_time: Mapped[str] = mapped_column(String(16))
    end_time: Mapped[str] = mapped_column(String(16))
    status: Mapped[str] = mapped_column(String(32), default="scheduled")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class HotelNightAuditModel(TimestampMixin, Base):
    __tablename__ = "hotel_night_audits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    audit_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[str] = mapped_column(String(32), default="completed")
    report_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    completed_at: Mapped[str] = mapped_column(String(64))
    completed_by_user_id: Mapped[str] = mapped_column(String(255))


class HotelHousekeepingTaskModel(TimestampMixin, Base):
    __tablename__ = "hotel_housekeeping_tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    room_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_rooms.id"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending")
    priority: Mapped[str] = mapped_column(String(32), default="medium")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_staff_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hotel_staff_members.id"), nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)


class HotelMaintenanceTicketModel(TimestampMixin, Base):
    __tablename__ = "hotel_maintenance_tickets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    property_id: Mapped[str] = mapped_column(String(36), ForeignKey("hotel_properties.id"), index=True)
    room_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hotel_rooms.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="open")
    priority: Mapped[str] = mapped_column(String(32), default="medium")
    assigned_staff_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hotel_staff_members.id"), nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(255), nullable=True)


class CommerceCategoryModel(TimestampMixin, Base):
    __tablename__ = "commerce_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    parent_category_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commerce_categories.id"), nullable=True)


class CommerceBrandModel(TimestampMixin, Base):
    __tablename__ = "commerce_brands"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    code: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommerceVendorModel(TimestampMixin, Base):
    __tablename__ = "commerce_vendors"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    code: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommerceCollectionModel(TimestampMixin, Base):
    __tablename__ = "commerce_collections"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class CommerceAttributeModel(TimestampMixin, Base):
    __tablename__ = "commerce_attributes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    code: Mapped[str] = mapped_column(String(120), index=True)
    slug: Mapped[str] = mapped_column(String(120), index=True)
    label: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    value_type: Mapped[str] = mapped_column(String(32))
    scope: Mapped[str] = mapped_column(String(32), default="product")
    options_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    unit_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    is_filterable: Mapped[bool] = mapped_column(Boolean, default=False)
    is_variation_axis: Mapped[bool] = mapped_column(Boolean, default=False)
    vertical_bindings: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommerceAttributeSetModel(TimestampMixin, Base):
    __tablename__ = "commerce_attribute_sets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    attribute_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    vertical_bindings: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommerceProductModel(TimestampMixin, Base):
    __tablename__ = "commerce_products"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commerce_brands.id"), nullable=True)
    vendor_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commerce_vendors.id"), nullable=True)
    collection_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    attribute_set_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commerce_attribute_sets.id"), nullable=True)
    category_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    seo_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    seo_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommerceVariantModel(TimestampMixin, Base):
    __tablename__ = "commerce_variants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_products.id"), index=True)
    sku: Mapped[str] = mapped_column(String(120), index=True)
    label: Mapped[str] = mapped_column(String(255))
    price_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    inventory_quantity: Mapped[int] = mapped_column(Integer, default=0)


class CommerceWarehouseModel(TimestampMixin, Base):
    __tablename__ = "commerce_warehouses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    code: Mapped[str] = mapped_column(String(120), index=True)
    city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    country: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)


class CommerceWarehouseStockModel(TimestampMixin, Base):
    __tablename__ = "commerce_warehouse_stocks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    warehouse_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_warehouses.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    on_hand_quantity: Mapped[int] = mapped_column(Integer, default=0)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=0)


class CommerceStockLedgerEntryModel(TimestampMixin, Base):
    __tablename__ = "commerce_stock_ledger_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    warehouse_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_warehouses.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    entry_type: Mapped[str] = mapped_column(String(32))
    quantity_delta: Mapped[int] = mapped_column(Integer)
    balance_after: Mapped[int] = mapped_column(Integer)
    reserved_after: Mapped[int] = mapped_column(Integer, default=0)
    reference_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by_user_id: Mapped[str] = mapped_column(String(255))


class CommerceProductAttributeValueModel(TimestampMixin, Base):
    __tablename__ = "commerce_product_attribute_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_products.id"), index=True)
    attribute_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_attributes.id"), index=True)
    value_json: Mapped[Any] = mapped_column(JSON)


class CommerceVariantAttributeValueModel(TimestampMixin, Base):
    __tablename__ = "commerce_variant_attribute_values"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    attribute_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_attributes.id"), index=True)
    value_json: Mapped[Any] = mapped_column(JSON)


class CommerceTaxProfileModel(TimestampMixin, Base):
    __tablename__ = "commerce_tax_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prices_include_tax: Mapped[bool] = mapped_column(Boolean, default=False)
    rules_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommercePriceListModel(TimestampMixin, Base):
    __tablename__ = "commerce_price_lists"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    customer_segment: Mapped[str | None] = mapped_column(String(120), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommercePriceListItemModel(TimestampMixin, Base):
    __tablename__ = "commerce_price_list_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    price_list_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_price_lists.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    price_minor: Mapped[int] = mapped_column(Integer)


class CommerceCouponModel(TimestampMixin, Base):
    __tablename__ = "commerce_coupons"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    code: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    discount_type: Mapped[str] = mapped_column(String(32))
    discount_value: Mapped[int] = mapped_column(Integer)
    minimum_subtotal_minor: Mapped[int] = mapped_column(Integer, default=0)
    maximum_discount_minor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    applicable_category_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    applicable_variant_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(32), default="active")


class CommerceOrderModel(TimestampMixin, Base):
    __tablename__ = "commerce_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    customer_id: Mapped[str] = mapped_column(String(120))
    price_list_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commerce_price_lists.id"), nullable=True)
    tax_profile_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("commerce_tax_profiles.id"), nullable=True)
    coupon_code: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="placed")
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    subtotal_minor: Mapped[int] = mapped_column(Integer, default=0)
    discount_minor: Mapped[int] = mapped_column(Integer, default=0)
    tax_minor: Mapped[int] = mapped_column(Integer, default=0)
    total_minor: Mapped[int] = mapped_column(Integer, default=0)
    payment_status: Mapped[str] = mapped_column(String(32), default="pending")
    paid_minor: Mapped[int] = mapped_column(Integer, default=0)
    refunded_minor: Mapped[int] = mapped_column(Integer, default=0)
    balance_minor: Mapped[int] = mapped_column(Integer, default=0)
    invoice_number: Mapped[str | None] = mapped_column(String(64), nullable=True)
    invoice_issued_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    inventory_reserved: Mapped[bool] = mapped_column(Boolean, default=False)
    placed_at: Mapped[str | None] = mapped_column(String(64), nullable=True)


class CommerceOrderLineModel(TimestampMixin, Base):
    __tablename__ = "commerce_order_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_orders.id"), index=True)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    product_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_products.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    allocated_warehouse_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commerce_warehouses.id"),
        nullable=True,
    )
    quantity: Mapped[int] = mapped_column(Integer)
    fulfilled_quantity: Mapped[int] = mapped_column(Integer, default=0)
    unit_price_minor: Mapped[int] = mapped_column(Integer)
    line_total_minor: Mapped[int] = mapped_column(Integer)


class CommerceFulfillmentModel(TimestampMixin, Base):
    __tablename__ = "commerce_fulfillments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_orders.id"), index=True)
    warehouse_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commerce_warehouses.id"),
        nullable=True,
    )
    fulfillment_number: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="pending_pick")
    created_by_user_id: Mapped[str] = mapped_column(String(255))
    packed_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    shipped_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    delivered_at: Mapped[str | None] = mapped_column(String(64), nullable=True)


class CommerceFulfillmentLineModel(TimestampMixin, Base):
    __tablename__ = "commerce_fulfillment_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    fulfillment_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_fulfillments.id"), index=True)
    order_line_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_order_lines.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer)


class CommerceShipmentModel(TimestampMixin, Base):
    __tablename__ = "commerce_shipments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    fulfillment_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_fulfillments.id"), index=True)
    carrier: Mapped[str] = mapped_column(String(120))
    service_level: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tracking_number: Mapped[str] = mapped_column(String(120), index=True)
    status: Mapped[str] = mapped_column(String(32), default="shipped")
    shipped_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    delivered_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    metadata_json: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)


class CommercePaymentModel(TimestampMixin, Base):
    __tablename__ = "commerce_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_orders.id"), index=True)
    amount_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    provider: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(32))
    status: Mapped[str] = mapped_column(String(32), default="captured")
    reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    received_at: Mapped[str] = mapped_column(String(64))
    recorded_by_user_id: Mapped[str] = mapped_column(String(255))


class CommerceRefundModel(TimestampMixin, Base):
    __tablename__ = "commerce_refunds"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_orders.id"), index=True)
    payment_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_payments.id"), index=True)
    amount_minor: Mapped[int] = mapped_column(Integer)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    reason: Mapped[str] = mapped_column(String(255))
    reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="processed")
    refunded_at: Mapped[str] = mapped_column(String(64))
    recorded_by_user_id: Mapped[str] = mapped_column(String(255))


class CommerceInvoiceModel(TimestampMixin, Base):
    __tablename__ = "commerce_invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_orders.id"), index=True)
    customer_id: Mapped[str] = mapped_column(String(120))
    invoice_number: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="issued")
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    subtotal_minor: Mapped[int] = mapped_column(Integer, default=0)
    discount_minor: Mapped[int] = mapped_column(Integer, default=0)
    tax_minor: Mapped[int] = mapped_column(Integer, default=0)
    total_minor: Mapped[int] = mapped_column(Integer, default=0)
    issued_at: Mapped[str] = mapped_column(String(64))
    issued_by_user_id: Mapped[str] = mapped_column(String(255))


class CommerceReturnModel(TimestampMixin, Base):
    __tablename__ = "commerce_returns"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_orders.id"), index=True)
    return_number: Mapped[str] = mapped_column(String(64), index=True)
    status: Mapped[str] = mapped_column(String(32), default="requested")
    reason_summary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    inventory_restocked: Mapped[bool] = mapped_column(Boolean, default=False)
    requested_at: Mapped[str] = mapped_column(String(64))
    approved_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    received_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    closed_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(255))
    closed_by_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)


class CommerceReturnLineModel(TimestampMixin, Base):
    __tablename__ = "commerce_return_lines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    return_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_returns.id"), index=True)
    order_line_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_order_lines.id"), index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_variants.id"), index=True)
    quantity: Mapped[int] = mapped_column(Integer)
    resolution_type: Mapped[str] = mapped_column(String(32))
    replacement_variant_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commerce_variants.id"),
        nullable=True,
    )
    restock_on_receive: Mapped[bool] = mapped_column(Boolean, default=True)
    line_amount_minor: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class CommerceSettlementModel(TimestampMixin, Base):
    __tablename__ = "commerce_settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    settlement_number: Mapped[str] = mapped_column(String(64), index=True)
    provider: Mapped[str] = mapped_column(String(120))
    settlement_reference: Mapped[str | None] = mapped_column(String(120), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    status: Mapped[str] = mapped_column(String(32), default="reported")
    payments_minor: Mapped[int] = mapped_column(Integer, default=0)
    refunds_minor: Mapped[int] = mapped_column(Integer, default=0)
    fees_minor: Mapped[int] = mapped_column(Integer, default=0)
    adjustments_minor: Mapped[int] = mapped_column(Integer, default=0)
    net_minor: Mapped[int] = mapped_column(Integer, default=0)
    reported_at: Mapped[str] = mapped_column(String(64))
    reconciled_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    closed_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(255))
    closed_by_user_id: Mapped[str | None] = mapped_column(String(255), nullable=True)


class CommerceSettlementEntryModel(TimestampMixin, Base):
    __tablename__ = "commerce_settlement_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    settlement_id: Mapped[str] = mapped_column(String(36), ForeignKey("commerce_settlements.id"), index=True)
    entry_type: Mapped[str] = mapped_column(String(32))
    payment_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commerce_payments.id"),
        nullable=True,
        index=True,
    )
    refund_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("commerce_refunds.id"),
        nullable=True,
        index=True,
    )
    amount_minor: Mapped[int] = mapped_column(Integer)
    label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
