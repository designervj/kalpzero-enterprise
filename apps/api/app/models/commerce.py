from datetime import datetime
from typing import Any, Optional
from pydantic import Field

from app.models.base import TimestampDocument


class CommerceCategory(TimestampDocument):
    name: str
    slug: str
    type: str
    parentId: Optional[str] = None
    description: str = ""
    pageStatus: str = "published"
    bannerImageUrl: Optional[str] = ""
    metaTitle: Optional[str] = ""
    metaDescription: Optional[str] = ""

    class Settings:
        name = "commerce_categories"


class CommerceBrand(TimestampDocument):
    name: str
    slug: str
    code: str
    description: Optional[str] = None
    status: str = "active"

    class Settings:
        name = "commerce_brands"


class CommerceVendor(TimestampDocument):
    name: str
    slug: str
    code: str
    description: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    status: str = "active"

    class Settings:
        name = "commerce_vendors"


class CommerceCollection(TimestampDocument):
    name: str
    slug: str
    description: Optional[str] = None
    status: str = "active"
    sort_order: int = 0

    class Settings:
        name = "commerce_collections"



class CommerceAttributeSet(TimestampDocument):
    name: str
    slug: str
    description: Optional[str] = None
    attribute_ids: list[str] = []
    vertical_bindings: list[str] = []
    status: str = "active"

    class Settings:
        name = "commerce_attribute_sets"


class CommerceProduct(TimestampDocument):
    name: str
    slug: str
    description: Optional[str] = None
    brand_id: Optional[str] = None
    vendor_id: Optional[str] = None
    collection_ids: list[str] = []
    attribute_set_id: Optional[str] = None
    category_ids: list[str] = []
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    status: str = "active"

    class Settings:
        name = "commerce_products"


class CommerceVariant(TimestampDocument):
    product_id: str
    sku: str
    label: str
    price_minor: int
    currency: str = "INR"
    inventory_quantity: int = 0

    class Settings:
        name = "commerce_variants"


class CommerceWarehouse(TimestampDocument):
    name: str
    slug: str
    code: str
    city: Optional[str] = None
    country: Optional[str] = None
    status: str = "active"
    is_default: bool = False

    class Settings:
        name = "commerce_warehouses"


class CommerceWarehouseStock(TimestampDocument):
    warehouse_id: str
    variant_id: str
    on_hand_quantity: int = 0
    reserved_quantity: int = 0
    low_stock_threshold: int = 0

    class Settings:
        name = "commerce_warehouse_stocks"




class CommerceStockLedgerEntry(TimestampDocument):
    warehouse_id: str
    variant_id: str
    entry_type: str
    quantity_delta: int
    balance_after: int
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    notes: Optional[str] = None
    recorded_by_user_id: str

    class Settings:
        name = "commerce_stock_ledger_entries"


class CommerceTaxProfile(TimestampDocument):
    name: str
    code: str
    description: Optional[str] = None
    prices_include_tax: bool = False
    rules: list[dict[str, Any]] = []
    status: str = "active"

    class Settings:
        name = "commerce_tax_profiles"


class CommercePriceList(TimestampDocument):
    name: str
    slug: str
    currency: str = "INR"
    customer_segment: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"

    class Settings:
        name = "commerce_price_lists"


class CommercePriceListItem(TimestampDocument):
    price_list_id: str
    variant_id: str
    price_minor: int

    class Settings:
        name = "commerce_price_list_items"


class CommerceCoupon(TimestampDocument):
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: int
    minimum_subtotal_minor: int = 0
    maximum_discount_minor: Optional[int] = None
    applicable_category_ids: list[str] = []
    applicable_variant_ids: list[str] = []
    status: str = "active"

    class Settings:
        name = "commerce_coupons"


class CommerceOrder(TimestampDocument):
    customer_id: str
    price_list_id: Optional[str] = None
    tax_profile_id: Optional[str] = None
    coupon_code: Optional[str] = None
    status: str = "placed"
    currency: str = "INR"
    subtotal_minor: int = 0
    discount_minor: int = 0
    tax_minor: int = 0
    total_minor: int = 0
    payment_status: str = "pending"
    paid_minor: int = 0
    refunded_minor: int = 0
    balance_minor: int = 0
    invoice_number: Optional[str] = None
    invoice_issued_at: Optional[str] = None
    inventory_reserved: bool = False
    placed_at: Optional[str] = None

    class Settings:
        name = "commerce_orders"


class CommerceOrderLine(TimestampDocument):
    order_id: str
    product_id: str
    variant_id: str
    allocated_warehouse_id: Optional[str] = None
    quantity: int
    fulfilled_quantity: int = 0
    unit_price_minor: int
    line_total_minor: int

    class Settings:
        name = "commerce_order_lines"


class CommerceFulfillment(TimestampDocument):
    order_id: str
    warehouse_id: Optional[str] = None
    fulfillment_number: str
    status: str = "pending_pick"
    created_by_user_id: str
    packed_at: Optional[str] = None
    shipped_at: Optional[str] = None
    delivered_at: Optional[str] = None

    class Settings:
        name = "commerce_fulfillments"


class CommerceFulfillmentLine(TimestampDocument):
    fulfillment_id: str
    order_line_id: str
    variant_id: str
    quantity: int

    class Settings:
        name = "commerce_fulfillment_lines"


class CommerceShipment(TimestampDocument):
    fulfillment_id: str
    carrier: str
    service_level: Optional[str] = None
    tracking_number: str
    status: str = "shipped"
    shipped_at: Optional[str] = None
    delivered_at: Optional[str] = None
    metadata_json: dict[str, Any] = {}

    class Settings:
        name = "commerce_shipments"


class CommercePayment(TimestampDocument):
    order_id: str
    amount_minor: int
    currency: str = "INR"
    provider: Optional[str] = None
    payment_method: str
    status: str = "captured"
    reference: Optional[str] = None
    notes: Optional[str] = None
    received_at: str
    recorded_by_user_id: str

    class Settings:
        name = "commerce_payments"


class CommerceRefund(TimestampDocument):
    order_id: str
    payment_id: str
    amount_minor: int
    currency: str = "INR"
    reason: str
    reference: Optional[str] = None
    status: str = "processed"
    refunded_at: str
    recorded_by_user_id: str

    class Settings:
        name = "commerce_refunds"


class CommerceInvoice(TimestampDocument):
    order_id: str
    customer_id: str
    invoice_number: str
    status: str = "issued"
    currency: str = "INR"
    subtotal_minor: int = 0
    discount_minor: int = 0
    tax_minor: int = 0
    total_minor: int = 0
    issued_at: str
    issued_by_user_id: str

    class Settings:
        name = "commerce_invoices"


class CommerceReturn(TimestampDocument):
    order_id: str
    return_number: str
    status: str = "requested"
    reason_summary: Optional[str] = None
    notes: Optional[str] = None
    inventory_restocked: bool = False
    requested_at: str
    approved_at: Optional[str] = None
    received_at: Optional[str] = None
    closed_at: Optional[str] = None
    created_by_user_id: str
    closed_by_user_id: Optional[str] = None

    class Settings:
        name = "commerce_returns"


class CommerceReturnLine(TimestampDocument):
    return_id: str
    order_line_id: str
    variant_id: str
    quantity: int
    resolution_type: str
    replacement_variant_id: Optional[str] = None
    restock_on_receive: bool = True
    line_amount_minor: int = 0
    notes: Optional[str] = None

    class Settings:
        name = "commerce_return_lines"


class CommerceSettlement(TimestampDocument):
    settlement_number: str
    provider: str
    settlement_reference: Optional[str] = None
    currency: str = "INR"
    status: str = "reported"
    payments_minor: int = 0
    refunds_minor: int = 0
    fees_minor: int = 0
    adjustments_minor: int = 0
    net_minor: int = 0
    reported_at: str
    reconciled_at: Optional[str] = None
    closed_at: Optional[str] = None
    notes: Optional[str] = None
    created_by_user_id: str
    closed_by_user_id: Optional[str] = None

    class Settings:
        name = "commerce_settlements"


class CommerceSettlementEntry(TimestampDocument):
    settlement_id: str
    entry_type: str
    payment_id: Optional[str] = None
    refund_id: Optional[str] = None
    amount_minor: int
    label: Optional[str] = None
    notes: Optional[str] = None

    class Settings:
        name = "commerce_settlement_entries"

COMMERCE_MODELS = [
    CommerceCategory,
    CommerceBrand,
    CommerceVendor,
    CommerceCollection,
    CommerceAttributeSet,
    CommerceProduct,
    CommerceVariant,
    CommerceWarehouse,
    CommerceWarehouseStock,
    CommerceStockLedgerEntry,
    CommerceTaxProfile,
    CommercePriceList,
    CommercePriceListItem,
    CommerceCoupon,
    CommerceOrder,
    CommerceOrderLine,
    CommerceFulfillment,
    CommerceFulfillmentLine,
    CommerceShipment,
    CommercePayment,
    CommerceRefund,
    CommerceInvoice,
    CommerceReturn,
    CommerceReturnLine,
    CommerceSettlement,
    CommerceSettlementEntry,
]
