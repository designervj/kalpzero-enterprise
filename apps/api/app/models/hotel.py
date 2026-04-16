from datetime import date
from typing import Optional, Any
from beanie import Indexed
from app.models.base import TimestampDocument


class HotelProperty(TimestampDocument):
    tenant_id: Indexed(str)
    name: str
    code: Indexed(str)
    city: str
    country: str
    timezone: str

    class Settings:
        name = "hotel_properties"


class HotelRoomType(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    name: str
    code: str
    category: Optional[str] = None
    bed_type: Optional[str] = None
    occupancy: int
    room_size_sqm: Optional[int] = None
    base_rate_minor: int
    extra_bed_price_minor: int = 0
    refundable: bool = True
    currency: str = "INR"
    amenity_ids: list[str] = []

    class Settings:
        name = "hotel_room_types"


class HotelRoom(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    room_type_id: Indexed(str)
    room_number: str
    status: str = "available"
    occupancy_status: str = "vacant"
    housekeeping_status: str = "clean"
    sell_status: str = "sellable"
    is_active: bool = True
    feature_tags: list[str] = []
    notes: Optional[str] = None
    last_cleaned_at: Optional[str] = None
    floor_label: Optional[str] = None

    class Settings:
        name = "hotel_rooms"


class HotelMealPlan(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    code: str
    name: str
    description: Optional[str] = None
    price_per_person_per_night_minor: int = 0
    currency: str = "INR"
    included_meals: list[str] = []
    is_active: bool = True

    class Settings:
        name = "hotel_meal_plans"


class HotelGuestProfile(TimestampDocument):
    tenant_id: Indexed(str)
    first_name: str
    last_name: str
    email: Indexed(str)
    phone: str
    nationality: Optional[str] = None
    loyalty_tier: Optional[str] = None
    vip: bool = False
    preferred_room_type_id: Optional[str] = None
    dietary_preference: Optional[str] = None
    company_name: Optional[str] = None
    identity_document_number: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "hotel_guest_profiles"


class HotelRatePlan(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    room_type_id: Indexed(str)
    label: str
    currency: str = "INR"
    weekend_enabled: bool = False
    weekend_rate_minor: Optional[int] = None
    seasonal_overrides: list[dict[str, Any]] = []
    is_active: bool = True

    class Settings:
        name = "hotel_rate_plans"


class HotelAvailabilityRule(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    room_type_id: Indexed(str)
    total_units: int
    available_units_snapshot: Optional[int] = None
    minimum_stay_nights: int = 1
    maximum_stay_nights: int = 30
    blackout_dates: list[str] = []
    is_active: bool = True

    class Settings:
        name = "hotel_availability_rules"


class HotelReservation(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    room_type_id: Indexed(str)
    room_id: Optional[str] = None
    meal_plan_id: Optional[str] = None
    booking_reference: Optional[str] = None
    booking_source: Optional[str] = None
    guest_customer_id: Indexed(str)
    guest_name: Optional[str] = None
    check_in_date: date
    check_out_date: date
    status: str = "reserved"
    special_requests: Optional[str] = None
    early_check_in: bool = False
    late_check_out: bool = False
    actual_check_in_at: Optional[str] = None
    actual_check_out_at: Optional[str] = None
    total_amount_minor: int = 0
    currency: str = "INR"
    adults: int = 1
    children: int = 0

    class Settings:
        name = "hotel_reservations"


class HotelStay(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    reservation_id: Indexed(str)
    room_type_id: Indexed(str)
    room_id: Indexed(str)
    guest_customer_id: Indexed(str)
    guest_name: Optional[str] = None
    status: str = "in_house"
    checked_in_at: str
    checked_out_at: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "hotel_stays"


class HotelRoomMove(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    stay_id: Indexed(str)
    reservation_id: Indexed(str)
    from_room_id: Indexed(str)
    to_room_id: Indexed(str)
    moved_at: str
    reason: str
    moved_by_user_id: str

    class Settings:
        name = "hotel_room_moves"


class HotelGuestDocument(TimestampDocument):
    tenant_id: Indexed(str)
    guest_profile_id: Indexed(str)
    document_kind: str
    document_number: str
    issuing_country: Optional[str] = None
    expires_on: Optional[date] = None
    verification_status: str = "pending"
    storage_key: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "hotel_guest_documents"


class HotelFolio(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    reservation_id: Indexed(str)
    guest_customer_id: Indexed(str)
    guest_name: Optional[str] = None
    status: str = "open"
    currency: str = "INR"
    subtotal_minor: int = 0
    tax_minor: int = 0
    total_minor: int = 0
    paid_minor: int = 0
    balance_minor: int = 0
    invoice_number: Optional[str] = None
    invoice_issued_at: Optional[str] = None
    closed_at: Optional[str] = None

    class Settings:
        name = "hotel_folios"


class HotelFolioCharge(TimestampDocument):
    tenant_id: Indexed(str)
    folio_id: Indexed(str)
    reservation_id: Indexed(str)
    category: str
    label: str
    service_date: date
    quantity: int = 1
    unit_amount_minor: int
    line_amount_minor: int
    tax_amount_minor: int = 0
    notes: Optional[str] = None
    created_by_user_id: str

    class Settings:
        name = "hotel_folio_charges"


class HotelPayment(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    folio_id: Indexed(str)
    reservation_id: Indexed(str)
    amount_minor: int
    currency: str = "INR"
    payment_method: str
    status: str = "posted"
    reference: Optional[str] = None
    notes: Optional[str] = None
    received_at: str
    recorded_by_user_id: str

    class Settings:
        name = "hotel_payments"


class HotelRefund(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    folio_id: Indexed(str)
    payment_id: Indexed(str)
    reservation_id: Indexed(str)
    amount_minor: int
    currency: str = "INR"
    reason: str
    reference: Optional[str] = None
    status: str = "processed"
    refunded_at: str
    recorded_by_user_id: str

    class Settings:
        name = "hotel_refunds"


class HotelStaffMember(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    staff_code: Indexed(str)
    first_name: str
    last_name: str
    role: str
    department: str
    phone: Optional[str] = None
    email: Optional[str] = None
    employment_status: str = "active"
    is_active: bool = True

    class Settings:
        name = "hotel_staff_members"


class HotelShift(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    staff_member_id: Indexed(str)
    shift_date: date
    shift_kind: str
    start_time: str
    end_time: str
    status: str = "scheduled"
    notes: Optional[str] = None

    class Settings:
        name = "hotel_shifts"


class HotelNightAudit(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    audit_date: Indexed(date)
    status: str = "completed"
    report_json: dict[str, Any] = {}
    completed_at: str
    completed_by_user_id: str

    class Settings:
        name = "hotel_night_audits"


class HotelHousekeepingTask(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    room_id: Indexed(str)
    status: str = "pending"
    priority: str = "medium"
    notes: Optional[str] = None
    assigned_staff_id: Optional[str] = None
    assigned_to: Optional[str] = None

    class Settings:
        name = "hotel_housekeeping_tasks"


class HotelMaintenanceTicket(TimestampDocument):
    tenant_id: Indexed(str)
    property_id: Indexed(str)
    room_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str = "open"
    priority: str = "medium"
    assigned_staff_id: Optional[str] = None
    assigned_to: Optional[str] = None

    class Settings:
        name = "hotel_maintenance_tickets"


HOTEL_MODELS = [
    HotelProperty,
    HotelRoomType,
    HotelRoom,
    HotelMealPlan,
    HotelGuestProfile,
    HotelRatePlan,
    HotelAvailabilityRule,
    HotelReservation,
    HotelStay,
    HotelRoomMove,
    HotelGuestDocument,
    HotelFolio,
    HotelFolioCharge,
    HotelPayment,
    HotelRefund,
    HotelStaffMember,
    HotelShift,
    HotelNightAudit,
    HotelHousekeepingTask,
    HotelMaintenanceTicket,
]
