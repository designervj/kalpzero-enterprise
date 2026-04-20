from datetime import date
from typing import Any
from sqlalchemy import Boolean, Date, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.db.models import TimestampMixin, generate_uuid

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



class CommerceAttributeSetModel(TimestampMixin, Base):
    __tablename__ = "commerce_attribute_sets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    tenant_id: Mapped[str] = mapped_column(String(36), ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(120), index=True)
    appliesTo: Mapped[str | None] = mapped_column(String(64), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    attributes: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
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
    reserved_after: Mapped[int] = mapped_column(Integer)
    reference_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_by_user_id: Mapped[str] = mapped_column(String(255))




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
