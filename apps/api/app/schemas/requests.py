from datetime import date

from pydantic import BaseModel, Field

class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=10)
    tenant_slug:str | None = None
    role: str | None = None
    name: str | None = None
    istenantowner: bool = False



class LoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=10)
    tenant_slug: str | None = None


class MagicLoginRequest(BaseModel):
    user_id: str


class CreateAgencyRequest(BaseModel):
    slug: str = Field(min_length=3, max_length=120)
    name: str = Field(min_length=2, max_length=255)
    region: str = Field(default="in", min_length=2, max_length=32)
    owner_user_id: str = Field(min_length=3, max_length=255)


class CreateTenantRequest(BaseModel):
    agency_slug: str = Field(min_length=3, max_length=120)
    slug: str = Field(min_length=3, max_length=120)
    display_name: str = Field(min_length=2, max_length=255)
    infra_mode: str = Field(pattern="^(shared|dedicated)$")
    vertical_pack: str = Field(min_length=2, max_length=32)
    business_type: str | None = None
    admin_email: str | None = None
    feature_flags: list[str] = Field(default_factory=list)
    dedicated_profile_id: str | None = None


class CreateImportSourceRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    source_type: str = Field(min_length=2, max_length=32)
    connection_profile_key: str = Field(min_length=3, max_length=255)
    vertical_pack: str = Field(min_length=2, max_length=32)
    config: dict[str, object] = Field(default_factory=dict)


class CreateImportJobRequest(BaseModel):
    source_id: str = Field(min_length=3, max_length=36)
    mode: str = Field(pattern="^(dry_run|execute)$")


class CreateHotelPropertyRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    code: str = Field(min_length=2, max_length=64)
    city: str = Field(min_length=2, max_length=120)
    country: str = Field(min_length=2, max_length=120)
    timezone: str = Field(min_length=2, max_length=64)


class CreateHotelRoomTypeRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    name: str = Field(min_length=2, max_length=255)
    code: str = Field(min_length=2, max_length=64)
    category: str | None = Field(default=None, max_length=120)
    bed_type: str | None = Field(default=None, max_length=120)
    occupancy: int = Field(ge=1, le=10)
    room_size_sqm: int | None = Field(default=None, ge=1, le=1000)
    base_rate_minor: int = Field(ge=0)
    extra_bed_price_minor: int = Field(default=0, ge=0)
    refundable: bool = True
    currency: str = Field(default="INR", min_length=3, max_length=8)
    amenity_ids: list[str] = Field(default_factory=list)


class CreateHotelRoomRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    room_type_id: str = Field(min_length=3, max_length=36)
    room_number: str = Field(min_length=1, max_length=32)
    status: str = Field(default="available", pattern="^(available|dirty|blocked|occupied|maintenance)$")
    occupancy_status: str | None = Field(default=None, pattern="^(vacant|occupied)$")
    housekeeping_status: str | None = Field(default=None, pattern="^(clean|dirty|inspected|dnd)$")
    sell_status: str | None = Field(default=None, pattern="^(sellable|blocked|maintenance|out_of_order)$")
    is_active: bool = True
    feature_tags: list[str] = Field(default_factory=list)
    notes: str | None = None
    last_cleaned_at: str | None = Field(default=None, max_length=64)
    floor_label: str | None = Field(default=None, max_length=64)


class CreateHotelMealPlanRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    code: str = Field(min_length=2, max_length=32)
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    price_per_person_per_night_minor: int = Field(default=0, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    included_meals: list[str] = Field(default_factory=list)
    is_active: bool = True


class CreateHotelGuestProfileRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    phone: str = Field(min_length=5, max_length=32)
    nationality: str | None = Field(default=None, max_length=120)
    loyalty_tier: str | None = Field(default=None, max_length=64)
    vip: bool = False
    preferred_room_type_id: str | None = Field(default=None, min_length=3, max_length=36)
    dietary_preference: str | None = Field(default=None, max_length=120)
    company_name: str | None = Field(default=None, max_length=255)
    identity_document_number: str | None = Field(default=None, max_length=120)
    notes: str | None = None


class HotelSeasonalRateOverrideRequest(BaseModel):
    season_name: str = Field(min_length=2, max_length=120)
    start_date: date
    end_date: date
    price_minor: int = Field(ge=0)


class CreateHotelRatePlanRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    room_type_id: str = Field(min_length=3, max_length=36)
    label: str = Field(min_length=2, max_length=255)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    weekend_enabled: bool = False
    weekend_rate_minor: int | None = Field(default=None, ge=0)
    seasonal_overrides: list[HotelSeasonalRateOverrideRequest] = Field(default_factory=list)
    is_active: bool = True


class CreateHotelAvailabilityRuleRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    room_type_id: str = Field(min_length=3, max_length=36)
    total_units: int = Field(ge=1, le=10000)
    available_units_snapshot: int | None = Field(default=None, ge=0, le=10000)
    minimum_stay_nights: int = Field(default=1, ge=1, le=365)
    maximum_stay_nights: int = Field(default=30, ge=1, le=365)
    blackout_dates: list[str] = Field(default_factory=list)
    is_active: bool = True


class CreateHotelReservationRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    room_type_id: str = Field(min_length=3, max_length=36)
    room_id: str | None = Field(default=None, min_length=3, max_length=36)
    meal_plan_id: str | None = Field(default=None, min_length=3, max_length=36)
    booking_reference: str | None = Field(default=None, max_length=64)
    booking_source: str | None = Field(default=None, max_length=64)
    guest_customer_id: str = Field(min_length=2, max_length=120)
    guest_name: str | None = Field(default=None, max_length=255)
    check_in_date: date
    check_out_date: date
    status: str = Field(default="reserved", pattern="^(pending|reserved)$")
    special_requests: str | None = None
    early_check_in: bool = False
    late_check_out: bool = False
    total_amount_minor: int = Field(default=0, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    adults: int = Field(default=1, ge=1, le=10)
    children: int = Field(default=0, ge=0, le=10)


class CreateHotelFolioChargeRequest(BaseModel):
    category: str = Field(
        pattern="^(reservation_base|room_revenue|meal_plan|tax|fee|add_on|incidental|discount)$"
    )
    label: str = Field(min_length=2, max_length=255)
    service_date: date
    quantity: int = Field(default=1, ge=1, le=1000)
    unit_amount_minor: int = Field(ge=0)
    tax_amount_minor: int = Field(default=0, ge=0)
    notes: str | None = None


class CreateHotelPaymentRequest(BaseModel):
    amount_minor: int = Field(ge=1)
    payment_method: str = Field(pattern="^(cash|card|upi|bank_transfer|wallet|other)$")
    reference: str | None = Field(default=None, max_length=120)
    notes: str | None = None


class CreateHotelRefundRequest(BaseModel):
    payment_id: str = Field(min_length=3, max_length=36)
    amount_minor: int = Field(ge=1)
    reason: str = Field(min_length=2, max_length=255)
    reference: str | None = Field(default=None, max_length=120)


class CreateHotelGuestDocumentRequest(BaseModel):
    document_kind: str = Field(pattern="^(passport|national_id|drivers_license|visa|other)$")
    document_number: str = Field(min_length=2, max_length=120)
    issuing_country: str | None = Field(default=None, max_length=120)
    expires_on: date | None = None
    verification_status: str = Field(default="pending", pattern="^(pending|verified|rejected)$")
    storage_key: str | None = Field(default=None, max_length=255)
    notes: str | None = None


class CreateHotelStaffMemberRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    staff_code: str = Field(min_length=2, max_length=64)
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    role: str = Field(min_length=2, max_length=120)
    department: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)
    employment_status: str = Field(default="active", pattern="^(active|inactive|notice)$")
    is_active: bool = True


class CreateHotelShiftRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    staff_member_id: str = Field(min_length=3, max_length=36)
    shift_date: date
    shift_kind: str = Field(pattern="^(morning|evening|night|general)$")
    start_time: str = Field(pattern="^([01]\\d|2[0-3]):[0-5]\\d$")
    end_time: str = Field(pattern="^([01]\\d|2[0-3]):[0-5]\\d$")
    status: str = Field(default="scheduled", pattern="^(scheduled|checked_in|completed|missed)$")
    notes: str | None = None


class CreateHotelNightAuditRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    audit_date: date


class CreateHotelRoomMoveRequest(BaseModel):
    to_room_id: str = Field(min_length=3, max_length=36)
    reason: str = Field(min_length=2, max_length=255)


class HotelAmenityEntryRequest(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=1, max_length=255)
    icon: str | None = Field(default=None, max_length=120)
    description: str | None = None


class HotelAmenityCategoryRequest(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=1, max_length=255)
    amenities: list[HotelAmenityEntryRequest] = Field(default_factory=list)


class UpsertHotelPropertyProfileRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    brand_name: str = Field(min_length=2, max_length=255)
    hero_title: str = Field(min_length=2, max_length=255)
    hero_summary: str | None = None
    description: str | None = None
    address_line_1: str | None = None
    address_line_2: str | None = None
    city: str | None = Field(default=None, max_length=120)
    state: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    postal_code: str | None = Field(default=None, max_length=32)
    contact_phone: str | None = Field(default=None, max_length=32)
    contact_email: str | None = Field(default=None, max_length=255)
    website: str | None = Field(default=None, max_length=255)
    check_in_time: str | None = Field(default=None, max_length=32)
    check_out_time: str | None = Field(default=None, max_length=32)
    star_rating: int | None = Field(default=None, ge=1, le=7)
    highlights: list[str] = Field(default_factory=list)
    gallery_urls: list[str] = Field(default_factory=list)
    policies: list[str] = Field(default_factory=list)


class UpsertHotelAmenityCatalogRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    categories: list[HotelAmenityCategoryRequest] = Field(default_factory=list)


class HotelNearbyPlaceRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    kind: str = Field(min_length=2, max_length=120)
    distance_km: float = Field(ge=0)
    travel_minutes: int = Field(ge=0, le=10000)
    summary: str | None = None


class UpsertHotelNearbyPlacesRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    places: list[HotelNearbyPlaceRequest] = Field(default_factory=list)


class HotelReservationStatusRequest(BaseModel):
    status: str = Field(pattern="^(reserved|checked_in|checked_out|cancelled|no_show)$")


class HotelReservationAssignmentRequest(BaseModel):
    room_id: str = Field(min_length=3, max_length=36)


class CreateHotelHousekeepingTaskRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    room_id: str = Field(min_length=3, max_length=36)
    priority: str = Field(default="medium", pattern="^(low|medium|high)$")
    notes: str | None = None
    assigned_staff_id: str | None = Field(default=None, min_length=3, max_length=36)
    assigned_to: str | None = Field(default=None, max_length=255)


class HotelHousekeepingStatusRequest(BaseModel):
    status: str = Field(pattern="^(pending|in_progress|completed)$")


class CreateHotelMaintenanceTicketRequest(BaseModel):
    property_id: str = Field(min_length=3, max_length=36)
    room_id: str | None = Field(default=None, min_length=3, max_length=36)
    title: str = Field(min_length=2, max_length=255)
    description: str | None = None
    priority: str = Field(default="medium", pattern="^(low|medium|high|critical)$")
    assigned_staff_id: str | None = Field(default=None, min_length=3, max_length=36)
    assigned_to: str | None = Field(default=None, max_length=255)


class HotelMaintenanceStatusRequest(BaseModel):
    status: str = Field(pattern="^(open|in_progress|resolved|cancelled)$")


class CreateCommerceCategoryRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    type: str
    parentId: str | None = Field(default=None, min_length=3, max_length=36)
    description: str = ""
    pageStatus: str = "published"
    bannerImageUrl: str | None = ""
    metaTitle: str | None = ""
    metaDescription: str | None = ""


class UpdateCommerceCategoryRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    slug: str | None = Field(default=None, min_length=2, max_length=120)
    type: str | None = None
    parentId: str | None = Field(default=None, min_length=3, max_length=36)
    description: str | None = None
    pageStatus: str | None = None
    bannerImageUrl: str | None = None
    metaTitle: str | None = None
    metaDescription: str | None = None


class CreateCommerceBrandRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=2, max_length=120)
    description: str | None = None
    status: str = Field(default="active", pattern="^(active|archived)$")


class CreateCommerceVendorRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=2, max_length=120)
    description: str | None = None
    contact_name: str | None = Field(default=None, max_length=255)
    contact_email: str | None = Field(default=None, max_length=255)
    contact_phone: str | None = Field(default=None, max_length=64)
    status: str = Field(default="active", pattern="^(active|archived)$")


class CreateCommerceCollectionRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    description: str | None = None
    status: str = Field(default="active", pattern="^(active|archived)$")
    sort_order: int = Field(default=0, ge=0, le=100000)


class CreateCommerceWarehouseRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=2, max_length=120)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    status: str = Field(default="active", pattern="^(active|inactive)$")
    is_default: bool = False


class CreateCommerceStockAdjustmentRequest(BaseModel):
    variant_id: str = Field(min_length=3, max_length=36)
    quantity_delta: int
    notes: str | None = None
    low_stock_threshold: int | None = Field(default=None, ge=0)


class CommerceTaxRuleRequest(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    rate_basis_points: int = Field(ge=0, le=100000)


class CreateCommerceTaxProfileRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    code: str = Field(min_length=2, max_length=120)
    description: str | None = None
    prices_include_tax: bool = False
    rules: list[CommerceTaxRuleRequest] = Field(min_length=1)
    status: str = Field(default="active", pattern="^(active|archived)$")


class CommercePriceListItemRequest(BaseModel):
    variant_id: str = Field(min_length=3, max_length=36)
    price_minor: int = Field(ge=0)


class CreateCommercePriceListRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    customer_segment: str | None = Field(default=None, max_length=120)
    description: str | None = None
    status: str = Field(default="active", pattern="^(active|archived)$")
    items: list[CommercePriceListItemRequest] = Field(min_length=1)


class CreateCommerceCouponRequest(BaseModel):
    code: str = Field(min_length=2, max_length=120)
    description: str | None = None
    discount_type: str = Field(pattern="^(fixed|percent)$")
    discount_value: int = Field(ge=0)
    minimum_subtotal_minor: int = Field(default=0, ge=0)
    maximum_discount_minor: int | None = Field(default=None, ge=0)
    applicable_category_ids: list[str] = Field(default_factory=list)
    applicable_variant_ids: list[str] = Field(default_factory=list)
    status: str = Field(default="active", pattern="^(active|archived)$")


class CreateCommercePaymentRequest(BaseModel):
    amount_minor: int = Field(ge=1)
    provider: str | None = Field(default=None, max_length=120)
    payment_method: str = Field(pattern="^(cash|card|upi|bank_transfer|wallet|other)$")
    status: str = Field(default="captured", pattern="^(authorized|captured|failed)$")
    reference: str | None = Field(default=None, max_length=120)
    notes: str | None = None


class CreateCommerceRefundRequest(BaseModel):
    payment_id: str = Field(min_length=3, max_length=36)
    amount_minor: int = Field(ge=1)
    reason: str = Field(min_length=2, max_length=255)
    reference: str | None = Field(default=None, max_length=120)


class CreateCommerceReturnLineRequest(BaseModel):
    order_line_id: str = Field(min_length=3, max_length=36)
    quantity: int = Field(ge=1)
    resolution_type: str = Field(pattern="^(refund|exchange)$")
    replacement_variant_id: str | None = Field(default=None, min_length=3, max_length=36)
    restock_on_receive: bool = True
    notes: str | None = None


class CreateCommerceReturnRequest(BaseModel):
    reason_summary: str = Field(min_length=2, max_length=255)
    notes: str | None = None
    lines: list[CreateCommerceReturnLineRequest] = Field(min_length=1)


class CommerceReturnStatusRequest(BaseModel):
    status: str = Field(pattern="^(requested|approved|rejected|received|completed|cancelled)$")


class CreateCommerceSettlementRequest(BaseModel):
    provider: str = Field(min_length=2, max_length=120)
    settlement_reference: str | None = Field(default=None, max_length=120)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    status: str = Field(default="reported", pattern="^(draft|reported|reconciled)$")
    payment_ids: list[str] = Field(default_factory=list)
    refund_ids: list[str] = Field(default_factory=list)
    fees_minor: int = Field(default=0, ge=0)
    adjustments_minor: int = 0
    notes: str | None = None


class CommerceSettlementStatusRequest(BaseModel):
    status: str = Field(pattern="^(draft|reported|reconciled|closed|disputed)$")



class CommerceAttributeDeclarationRequest(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    label: str = Field(min_length=1, max_length=255)
    type: str = Field(pattern="^(select|text|number|boolean)$")
    options: list[str] = Field(default_factory=list)


class CreateCommerceAttributeSetRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    key: str = Field(min_length=2, max_length=120)
    appliesTo: str | None = Field(default="product", max_length=64)
    description: str | None = None
    attributes: list[CommerceAttributeDeclarationRequest] = Field(default_factory=list)
    vertical_bindings: list[str] = Field(default_factory=lambda: ["commerce"])


class UpdateCommerceAttributeSetRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    key: str | None = Field(default=None, min_length=2, max_length=120)
    appliesTo: str | None = Field(default="product", max_length=64)
    description: str | None = None
    attributes: list[CommerceAttributeDeclarationRequest] | None = None
    vertical_bindings: list[str] | None = None



class ProductPricingRequest(BaseModel):
    price: int = Field(ge=0)
    compareAtPrice: int | None = Field(default=None, ge=0)
    costPerItem: int | None = Field(default=None, ge=0)
    chargeTax: bool = True
    trackQuantity: bool = True


class ProductOptionRequest(BaseModel):
    attributeSetId: str | None = None
    values: list[str] = Field(default_factory=list)
    selectedValues: list[str] = Field(default_factory=list)
    useForVariants: bool = False
    label: str
    key: str


class GalleryItemRequest(BaseModel):
    id: str | None = None
    url: str
    alt: str | None = None
    order: int = 0


class CreateCommerceVariantRequest(BaseModel):
    id: str | None = None
    title: str
    optionValues: dict[str, str] = Field(default_factory=dict)
    sku: str = Field(min_length=2, max_length=120)
    price: int = Field(ge=0)
    stock: int = Field(default=0, ge=0)
    status: str = Field(default="active", pattern="^(active|inactive)$")


class CreateCommerceProductRequest(BaseModel):
    type: str = Field(default="physical")
    name: str = Field(min_length=2, max_length=255)
    slug: str = Field(min_length=2, max_length=120)
    sku: str | None = None
    price: int | None = None
    description: str | None = None
    status: str = Field(default="active", pattern="^(draft|active|archived)$")
    categoryIds: list[str] = Field(min_length=1)
    primaryCategoryId: str | None = None
    attributeSetIds: list[str] = Field(default_factory=list)
    pricing: ProductPricingRequest | None = None
    options: list[ProductOptionRequest] = Field(default_factory=list)
    gallery: list[GalleryItemRequest] = Field(default_factory=list)
    primaryImageId: str | None = None
    relatedProductIds: list[str] = Field(default_factory=list)
    variants: list[CreateCommerceVariantRequest] = Field(default_factory=list)


class UpdateCommerceProductRequest(BaseModel):
    type: str | None = None
    name: str | None = None
    slug: str | None = None
    sku: str | None = None
    price: int | None = None
    description: str | None = None
    status: str | None = None
    categoryIds: list[str] | None = None
    primaryCategoryId: str | None = None
    attributeSetIds: list[str] | None = None
    pricing: ProductPricingRequest | None = None
    options: list[ProductOptionRequest] | None = None
    gallery: list[GalleryItemRequest] | None = None
    primaryImageId: str | None = None
    relatedProductIds: list[str] | None = None
    variants: list[CreateCommerceVariantRequest] | None = None


class CreateCommerceOrderLineRequest(BaseModel):
    variant_id: str = Field(min_length=3, max_length=36)
    quantity: int = Field(ge=1)


class CreateCommerceOrderRequest(BaseModel):
    customer_id: str = Field(min_length=2, max_length=120)
    price_list_id: str | None = Field(default=None, min_length=3, max_length=36)
    tax_profile_id: str | None = Field(default=None, min_length=3, max_length=36)
    coupon_code: str | None = Field(default=None, min_length=2, max_length=120)
    status: str = Field(default="placed", pattern="^(draft|placed|paid|fulfilled)$")
    currency: str = Field(default="INR", min_length=3, max_length=8)
    lines: list[CreateCommerceOrderLineRequest] = Field(min_length=1)


class CommerceOrderStatusRequest(BaseModel):
    status: str = Field(pattern="^(draft|placed|paid|fulfilled|cancelled)$")


class CreateCommerceFulfillmentLineRequest(BaseModel):
    order_line_id: str = Field(min_length=3, max_length=36)
    quantity: int = Field(ge=1)


class CreateCommerceFulfillmentRequest(BaseModel):
    warehouse_id: str | None = Field(default=None, min_length=3, max_length=36)
    lines: list[CreateCommerceFulfillmentLineRequest] = Field(default_factory=list)


class CommerceFulfillmentStatusRequest(BaseModel):
    status: str = Field(pattern="^(pending_pick|packed|shipped|delivered|cancelled)$")


class CreateCommerceShipmentRequest(BaseModel):
    carrier: str = Field(min_length=2, max_length=120)
    service_level: str | None = Field(default=None, max_length=120)
    tracking_number: str = Field(min_length=3, max_length=120)
    metadata: dict[str, object] = Field(default_factory=dict)


class CommerceShipmentStatusRequest(BaseModel):
    status: str = Field(pattern="^(shipped|delivered|cancelled)$")


class CreateTravelItineraryDayRequest(BaseModel):
    day_number: int = Field(ge=1, le=90)
    title: str = Field(min_length=2, max_length=255)
    summary: str = Field(min_length=2)
    hotel_ref_id: str | None = Field(default=None, max_length=120)
    activity_ref_ids: list[str] = Field(default_factory=list)
    transfer_ref_ids: list[str] = Field(default_factory=list)


class CreateTravelPackageRequest(BaseModel):
    code: str = Field(min_length=2, max_length=64)
    slug: str = Field(min_length=2, max_length=120)
    title: str = Field(min_length=2, max_length=255)
    summary: str | None = None
    origin_city: str = Field(min_length=2, max_length=120)
    destination_city: str = Field(min_length=2, max_length=120)
    destination_country: str = Field(min_length=2, max_length=120)
    duration_days: int = Field(ge=1, le=90)
    base_price_minor: int = Field(ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    status: str = Field(default="active", pattern="^(draft|active|archived)$")
    itinerary_days: list[CreateTravelItineraryDayRequest] = Field(min_length=1)


class CreateTravelDepartureRequest(BaseModel):
    package_id: str = Field(min_length=3, max_length=36)
    departure_date: date
    return_date: date
    seats_total: int = Field(ge=1, le=500)
    seats_available: int = Field(ge=0, le=500)
    price_override_minor: int | None = Field(default=None, ge=0)
    status: str = Field(default="scheduled", pattern="^(scheduled|sold_out|closed)$")


class TravelDepartureStatusRequest(BaseModel):
    status: str = Field(pattern="^(scheduled|sold_out|closed)$")


class CreateTravelLeadRequest(BaseModel):
    source: str = Field(min_length=2, max_length=64)
    interested_package_id: str | None = Field(default=None, min_length=3, max_length=36)
    departure_id: str | None = Field(default=None, min_length=3, max_length=36)
    customer_id: str | None = Field(default=None, min_length=2, max_length=120)
    contact_name: str = Field(min_length=2, max_length=255)
    contact_phone: str = Field(min_length=5, max_length=32)
    travelers_count: int = Field(default=1, ge=1, le=50)
    desired_departure_date: date | None = None
    budget_minor: int | None = Field(default=None, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=8)
    status: str = Field(default="new", pattern="^(new|qualified|proposal_sent|won|lost)$")
    notes: str | None = None


class TravelLeadStatusRequest(BaseModel):
    status: str = Field(pattern="^(new|qualified|proposal_sent|won|lost)$")


class ThemeTokensRequest(BaseModel):
    brand_name: str = Field(min_length=2, max_length=255)
    primary_color: str = Field(min_length=4, max_length=32)
    accent_color: str = Field(min_length=4, max_length=32)
    surface_color: str = Field(min_length=4, max_length=32)
    ink_color: str = Field(min_length=4, max_length=32)
    muted_color: str = Field(min_length=4, max_length=32)
    heading_font: str = Field(min_length=2, max_length=120)
    body_font: str = Field(min_length=2, max_length=120)
    radius_scale: str = Field(pattern="^(sharp|soft|rounded)$")
    density: str = Field(pattern="^(compact|comfortable|spacious)$")
    motion_profile: str = Field(pattern="^(minimal|calm|lively)$")


class NavigationItemRequest(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    href: str = Field(min_length=1, max_length=255)
    kind: str = Field(pattern="^(link|cta|module)$")
    icon: str | None = Field(default=None, max_length=120)


class BlueprintRouteRequest(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    path: str = Field(min_length=1, max_length=255)
    page_slug: str = Field(min_length=1, max_length=120)
    visibility: str = Field(pattern="^(public|private)$")


class DashboardWidgetRequest(BaseModel):
    key: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=120)
    metric: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=255)


class UpdateBusinessBlueprintRequest(BaseModel):
    business_label: str = Field(min_length=2, max_length=255)
    public_theme: ThemeTokensRequest
    admin_theme: ThemeTokensRequest
    public_navigation: list[NavigationItemRequest]
    admin_navigation: list[NavigationItemRequest]
    routes: list[BlueprintRouteRequest]
    dashboard_widgets: list[DashboardWidgetRequest]
    vocabulary: dict[str, str]
    enabled_modules: list[str]
    mobile_capabilities: list[str]


class PageBlockItemRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    value: str | None = Field(default=None, max_length=120)


class PageBlockRequest(BaseModel):
    id: str = Field(min_length=1, max_length=120)
    kind: str = Field(pattern="^(hero|feature_grid|stat_strip|cta|rich_text)$")
    eyebrow: str | None = Field(default=None, max_length=255)
    headline: str | None = None
    body: str | None = None
    cta_label: str | None = Field(default=None, max_length=120)
    cta_href: str | None = Field(default=None, max_length=255)
    items: list[PageBlockItemRequest] = Field(default_factory=list)


class UpsertPublishingPageRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    status: str = Field(pattern="^(draft|preview|live)$")
    seo_title: str | None = Field(default=None, max_length=255)
    seo_description: str | None = None
    route_path: str = Field(min_length=1, max_length=255)
    layout: str = Field(pattern="^(landing|content|catalog)$")
    blocks: list[PageBlockRequest]


class DiscoveryCardRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    summary: str = Field(min_length=2, max_length=500)
    href: str = Field(min_length=1, max_length=255)
    tags: list[str] = Field(default_factory=list)


class UpsertDiscoveryDocumentRequest(BaseModel):
    headline: str = Field(min_length=2, max_length=255)
    summary: str = Field(min_length=2, max_length=500)
    tags: list[str] = Field(default_factory=list)
    cards: list[DiscoveryCardRequest] = Field(default_factory=list)


class AddressRequest(BaseModel):
    address1: str = Field(min_length=1, max_length=255)
    address2: str | None = Field(default=None, max_length=255)
    city: str = Field(min_length=1, max_length=120)
    state: str = Field(min_length=1, max_length=120)
    zipcode: str = Field(min_length=1, max_length=32)
    country: str = Field(min_length=1, max_length=120)
    is_default: bool = False


class CreateCustomerRequest(BaseModel):
    tenant_slug: str = Field(min_length=3, max_length=120)
    first_name: str = Field(min_length=1, max_length=120)
    last_name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=10)
    addresses: list[AddressRequest] = Field(default_factory=list)


class LoginCustomerRequest(BaseModel):
    tenant_slug: str = Field(min_length=3, max_length=120)
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=10)
