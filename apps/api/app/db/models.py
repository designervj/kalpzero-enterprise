from typing import Any

from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from app.db.base import Base, TimestampMixin, generate_uuid


class UserModel(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    tenant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("tenants.id"), nullable=True)
    role: Mapped[str] = mapped_column(String(32), default="tenant_admin")
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    istenantowner: Mapped[bool] = mapped_column(Boolean, default=False)


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
    vertical_packs: Mapped[str] = mapped_column(String(120))
    business_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    feature_flags: Mapped[list[str]] = mapped_column(JSON, default=list)
    dedicated_profile_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mongo_db_name: Mapped[str | None] = mapped_column(String(120), nullable=True)


class CustomerModel(TimestampMixin, Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    first_name: Mapped[str] = mapped_column(String(120))
    last_name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="customer")
    addresses: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)

    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_customer_tenant_email"),
    )


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




