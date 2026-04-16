from typing import Any
from uuid import uuid3, NAMESPACE_DNS
from sqlalchemy import select, and_
from sqlalchemy.orm import Session

from app.db.models_legacy import (
    CommerceCategoryModel,
    CommerceBrandModel,
    CommerceVendorModel,
    CommerceCollectionModel,
    CommerceAttributeModel,
    CommerceAttributeSetModel,
    CommerceProductModel,
    CommerceVariantModel,
    CommerceWarehouseModel,
    CommerceWarehouseStockModel,
    CommerceStockLedgerEntryModel,
    CommerceProductAttributeValueModel,
    CommerceVariantAttributeValueModel,
    CommerceTaxProfileModel,
    CommercePriceListModel,
    CommercePriceListItemModel,
    CommerceCouponModel,
    CommerceOrderModel,
    CommerceOrderLineModel,
    CommerceFulfillmentModel,
    CommerceFulfillmentLineModel,
    CommerceShipmentModel,
    CommercePaymentModel,
    CommerceRefundModel,
    CommerceInvoiceModel,
    CommerceReturnModel,
    CommerceReturnLineModel,
    CommerceSettlementModel,
    CommerceSettlementEntryModel,
)

def list_categories(db: Session, *, tenant_id: str) -> list[CommerceCategoryModel]:
    query = select(CommerceCategoryModel).where(CommerceCategoryModel.tenant_id == tenant_id)
    query = query.order_by(CommerceCategoryModel.created_at.desc())
    return list(db.scalars(query))

def get_category(db: Session, *, tenant_id: str, category_id: str) -> CommerceCategoryModel | None:
    query = select(CommerceCategoryModel).where(
        CommerceCategoryModel.tenant_id == tenant_id,
        CommerceCategoryModel.id == category_id,
    )
    return db.scalar(query)

def create_category(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    parent_category_id: str | None,
) -> CommerceCategoryModel:
    model = CommerceCategoryModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        parent_category_id=parent_category_id,
    )
    db.add(model)
    db.flush()
    return model

def list_brands(db: Session, *, tenant_id: str) -> list[CommerceBrandModel]:
    query = select(CommerceBrandModel).where(CommerceBrandModel.tenant_id == tenant_id)
    query = query.order_by(CommerceBrandModel.created_at.desc())
    return list(db.scalars(query))

def get_brand(db: Session, *, tenant_id: str, brand_id: str) -> CommerceBrandModel | None:
    query = select(CommerceBrandModel).where(
        CommerceBrandModel.tenant_id == tenant_id,
        CommerceBrandModel.id == brand_id,
    )
    return db.scalar(query)

def create_brand(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    status: str,
) -> CommerceBrandModel:
    model = CommerceBrandModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        code=code,
        description=description,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def list_vendors(db: Session, *, tenant_id: str) -> list[CommerceVendorModel]:
    query = select(CommerceVendorModel).where(CommerceVendorModel.tenant_id == tenant_id)
    query = query.order_by(CommerceVendorModel.created_at.desc())
    return list(db.scalars(query))

def create_vendor(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    contact_name: str | None,
    contact_email: str | None,
    contact_phone: str | None,
    status: str,
) -> CommerceVendorModel:
    model = CommerceVendorModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        code=code,
        description=description,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def list_collections(db: Session, *, tenant_id: str) -> list[CommerceCollectionModel]:
    query = select(CommerceCollectionModel).where(CommerceCollectionModel.tenant_id == tenant_id)
    query = query.order_by(CommerceCollectionModel.sort_order.asc(), CommerceCollectionModel.created_at.desc())
    return list(db.scalars(query))

def create_collection(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    status: str,
    sort_order: int,
) -> CommerceCollectionModel:
    model = CommerceCollectionModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        status=status,
        sort_order=sort_order,
    )
    db.add(model)
    db.flush()
    return model

def list_tax_profiles(db: Session, *, tenant_id: str) -> list[CommerceTaxProfileModel]:
    query = select(CommerceTaxProfileModel).where(CommerceTaxProfileModel.tenant_id == tenant_id)
    query = query.order_by(CommerceTaxProfileModel.created_at.desc())
    return list(db.scalars(query))

def create_tax_profile(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    code: str,
    description: str | None,
    prices_include_tax: bool,
    rules_json: list[dict[str, object]],
    status: str,
) -> CommerceTaxProfileModel:
    model = CommerceTaxProfileModel(
        tenant_id=tenant_id,
        name=name,
        code=code,
        description=description,
        prices_include_tax=prices_include_tax,
        rules_json=rules_json,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def create_price_list(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    currency: str,
    customer_segment: str | None,
    description: str | None,
    status: str,
) -> CommercePriceListModel:
    model = CommercePriceListModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        currency=currency,
        customer_segment=customer_segment,
        description=description,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def create_price_list_item(
    db: Session,
    *,
    tenant_id: str,
    price_list_id: str,
    variant_id: str,
    price_minor: int,
) -> CommercePriceListItemModel:
    model = CommercePriceListItemModel(
        tenant_id=tenant_id,
        price_list_id=price_list_id,
        variant_id=variant_id,
        price_minor=price_minor,
    )
    db.add(model)
    db.flush()
    return model

def create_coupon(
    db: Session,
    *,
    tenant_id: str,
    code: str,
    description: str | None,
    discount_type: str,
    discount_value: int,
    minimum_subtotal_minor: int,
    maximum_discount_minor: int | None,
    applicable_category_ids: list[str],
    applicable_variant_ids: list[str],
    status: str,
) -> CommerceCouponModel:
    model = CommerceCouponModel(
        tenant_id=tenant_id,
        code=code,
        description=description,
        discount_type=discount_type,
        discount_value=discount_value,
        minimum_subtotal_minor=minimum_subtotal_minor,
        maximum_discount_minor=maximum_discount_minor,
        applicable_category_ids=applicable_category_ids,
        applicable_variant_ids=applicable_variant_ids,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def list_attributes(db: Session, *, tenant_id: str) -> list[CommerceAttributeModel]:
    query = select(CommerceAttributeModel).where(CommerceAttributeModel.tenant_id == tenant_id)
    query = query.order_by(CommerceAttributeModel.created_at.desc())
    return list(db.scalars(query))

def create_attribute(
    db: Session,
    *,
    tenant_id: str,
    code: str,
    slug: str,
    label: str,
    description: str | None,
    value_type: str,
    scope: str,
    options_json: list[dict[str, object]],
    unit_label: str | None,
    is_required: bool,
    is_filterable: bool,
    is_variation_axis: bool,
    vertical_bindings: list[str],
    status: str,
) -> CommerceAttributeModel:
    model = CommerceAttributeModel(
        tenant_id=tenant_id,
        code=code,
        slug=slug,
        label=label,
        description=description,
        value_type=value_type,
        scope=scope,
        options_json=options_json,
        unit_label=unit_label,
        is_required=is_required,
        is_filterable=is_filterable,
        is_variation_axis=is_variation_axis,
        vertical_bindings=vertical_bindings,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def create_attribute_set(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    attribute_ids: list[str],
) -> CommerceAttributeSetModel:
    model = CommerceAttributeSetModel(
        tenant_id=tenant_id,
        name=name,
        attribute_ids=attribute_ids,
    )
    db.add(model)
    db.flush()
    return model

def list_products(db: Session, *, tenant_id: str) -> list[CommerceProductModel]:
    query = select(CommerceProductModel).where(CommerceProductModel.tenant_id == tenant_id)
    query = query.order_by(CommerceProductModel.created_at.desc())
    return list(db.scalars(query))

def get_product(db: Session, *, tenant_id: str, product_id: str) -> CommerceProductModel | None:
    query = select(CommerceProductModel).where(
        CommerceProductModel.tenant_id == tenant_id,
        CommerceProductModel.id == product_id,
    )
    return db.scalar(query)

def create_product(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    description: str | None,
    brand_id: str | None,
    vendor_id: str | None,
    collection_ids: list[str],
    attribute_set_id: str | None,
    category_ids: list[str],
    seo_title: str | None,
    seo_description: str | None,
    status: str,
) -> CommerceProductModel:
    model = CommerceProductModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        description=description,
        brand_id=brand_id,
        vendor_id=vendor_id,
        collection_ids=collection_ids,
        attribute_set_id=attribute_set_id,
        category_ids=category_ids,
        seo_title=seo_title,
        seo_description=seo_description,
        status=status,
    )
    db.add(model)
    db.flush()
    return model

def list_variants(db: Session, *, tenant_id: str) -> list[CommerceVariantModel]:
    query = select(CommerceVariantModel).where(CommerceVariantModel.tenant_id == tenant_id)
    query = query.order_by(CommerceVariantModel.created_at.desc())
    return list(db.scalars(query))

def create_variant(
    db: Session,
    *,
    tenant_id: str,
    product_id: str,
    sku: str,
    label: str,
    price_minor: int,
    currency: str,
    inventory_quantity: int,
) -> CommerceVariantModel:
    model = CommerceVariantModel(
        tenant_id=tenant_id,
        product_id=product_id,
        sku=sku,
        label=label,
        price_minor=price_minor,
        currency=currency,
        inventory_quantity=inventory_quantity,
    )
    db.add(model)
    db.flush()
    return model

def list_warehouses(db: Session, *, tenant_id: str) -> list[CommerceWarehouseModel]:
    query = select(CommerceWarehouseModel).where(CommerceWarehouseModel.tenant_id == tenant_id)
    query = query.order_by(CommerceWarehouseModel.is_default.desc(), CommerceWarehouseModel.created_at.asc())
    return list(db.scalars(query))

def create_warehouse(
    db: Session,
    *,
    tenant_id: str,
    name: str,
    slug: str,
    code: str,
    city: str | None,
    country: str | None,
    status: str,
    is_default: bool,
) -> CommerceWarehouseModel:
    model = CommerceWarehouseModel(
        tenant_id=tenant_id,
        name=name,
        slug=slug,
        code=code,
        city=city,
        country=country,
        status=status,
        is_default=is_default,
    )
    db.add(model)
    db.flush()
    return model

def list_warehouse_stocks(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str | None = None,
    variant_id: str | None = None,
) -> list[CommerceWarehouseStockModel]:
    query = select(CommerceWarehouseStockModel).where(CommerceWarehouseStockModel.tenant_id == tenant_id)
    if warehouse_id:
        query = query.where(CommerceWarehouseStockModel.warehouse_id == warehouse_id)
    if variant_id:
        query = query.where(CommerceWarehouseStockModel.variant_id == variant_id)
    query = query.order_by(CommerceWarehouseStockModel.created_at.asc())
    return list(db.scalars(query))

def create_warehouse_stock(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str,
    variant_id: str,
    on_hand_quantity: int,
    reserved_quantity: int,
    low_stock_threshold: int,
) -> CommerceWarehouseStockModel:
    model = CommerceWarehouseStockModel(
        tenant_id=tenant_id,
        warehouse_id=warehouse_id,
        variant_id=variant_id,
        on_hand_quantity=on_hand_quantity,
        reserved_quantity=reserved_quantity,
        low_stock_threshold=low_stock_threshold,
    )
    db.add(model)
    db.flush()
    return model

def create_stock_ledger_entry(
    db: Session,
    *,
    tenant_id: str,
    warehouse_id: str,
    variant_id: str,
    entry_type: str,
    quantity_delta: int,
    balance_after: int,
    reserved_after: int,
    reference_type: str | None,
    reference_id: str | None,
    notes: str | None,
    recorded_by_user_id: str,
) -> CommerceStockLedgerEntryModel:
    model = CommerceStockLedgerEntryModel(
        tenant_id=tenant_id,
        warehouse_id=warehouse_id,
        variant_id=variant_id,
        entry_type=entry_type,
        quantity_delta=quantity_delta,
        balance_after=balance_after,
        reserved_after=reserved_after,
        reference_type=reference_type,
        reference_id=reference_id,
        notes=notes,
        recorded_by_user_id=recorded_by_user_id,
    )
    db.add(model)
    db.flush()
    return model

def create_product_attribute_value(
    db: Session,
    *,
    tenant_id: str,
    product_id: str,
    attribute_id: str,
    value_json: object,
) -> CommerceProductAttributeValueModel:
    model = CommerceProductAttributeValueModel(
        tenant_id=tenant_id,
        product_id=product_id,
        attribute_id=attribute_id,
        value_json=value_json,
    )
    db.add(model)
    db.flush()
    return model

def create_variant_attribute_value(
    db: Session,
    *,
    tenant_id: str,
    variant_id: str,
    attribute_id: str,
    value_json: object,
) -> CommerceVariantAttributeValueModel:
    model = CommerceVariantAttributeValueModel(
        tenant_id=tenant_id,
        variant_id=variant_id,
        attribute_id=attribute_id,
        value_json=value_json,
    )
    db.add(model)
    db.flush()
    return model

def list_orders(db: Session, *, tenant_id: str) -> list[CommerceOrderModel]:
    query = select(CommerceOrderModel).where(CommerceOrderModel.tenant_id == tenant_id)
    query = query.order_by(CommerceOrderModel.created_at.desc())
    return list(db.scalars(query))

def create_order(
    db: Session,
    *,
    tenant_id: str,
    customer_id: str,
    price_list_id: str | None,
    tax_profile_id: str | None,
    coupon_code: str | None,
    status: str,
    currency: str,
    subtotal_minor: int,
    discount_minor: int,
    tax_minor: int,
    total_minor: int,
    payment_status: str,
    paid_minor: int,
    refunded_minor: int,
    balance_minor: int,
    invoice_number: str | None,
    invoice_issued_at: str | None,
    inventory_reserved: bool,
    placed_at: str | None,
) -> CommerceOrderModel:
    model = CommerceOrderModel(
        tenant_id=tenant_id,
        customer_id=customer_id,
        price_list_id=price_list_id,
        tax_profile_id=tax_profile_id,
        coupon_code=coupon_code,
        status=status,
        currency=currency,
        subtotal_minor=subtotal_minor,
        discount_minor=discount_minor,
        tax_minor=tax_minor,
        total_minor=total_minor,
        payment_status=payment_status,
        paid_minor=paid_minor,
        refunded_minor=refunded_minor,
        balance_minor=balance_minor,
        invoice_number=invoice_number,
        invoice_issued_at=invoice_issued_at,
        inventory_reserved=inventory_reserved,
        placed_at=placed_at,
    )
    db.add(model)
    db.flush()
    return model

def create_fulfillment(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    warehouse_id: str | None,
    fulfillment_number: str,
    status: str,
    created_by_user_id: str,
    packed_at: str | None,
    shipped_at: str | None,
    delivered_at: str | None,
) -> CommerceFulfillmentModel:
    model = CommerceFulfillmentModel(
        tenant_id=tenant_id,
        order_id=order_id,
        warehouse_id=warehouse_id,
        fulfillment_number=fulfillment_number,
        status=status,
        created_by_user_id=created_by_user_id,
        packed_at=packed_at,
        shipped_at=shipped_at,
        delivered_at=delivered_at,
    )
    db.add(model)
    db.flush()
    return model

def create_fulfillment_line(
    db: Session,
    *,
    tenant_id: str,
    fulfillment_id: str,
    order_line_id: str,
    variant_id: str,
    quantity: int,
) -> CommerceFulfillmentLineModel:
    model = CommerceFulfillmentLineModel(
        tenant_id=tenant_id,
        fulfillment_id=fulfillment_id,
        order_line_id=order_line_id,
        variant_id=variant_id,
        quantity=quantity,
    )
    db.add(model)
    db.flush()
    return model

def create_shipment(
    db: Session,
    *,
    tenant_id: str,
    fulfillment_id: str,
    carrier: str,
    service_level: str | None,
    tracking_number: str,
    status: str,
    shipped_at: str | None,
    delivered_at: str | None,
    metadata_json: dict[str, object],
) -> CommerceShipmentModel:
    model = CommerceShipmentModel(
        tenant_id=tenant_id,
        fulfillment_id=fulfillment_id,
        carrier=carrier,
        service_level=service_level,
        tracking_number=tracking_number,
        status=status,
        shipped_at=shipped_at,
        delivered_at=delivered_at,
        metadata_json=metadata_json,
    )
    db.add(model)
    db.flush()
    return model

def create_payment(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    amount_minor: int,
    currency: str,
    provider: str | None,
    payment_method: str,
    status: str,
    reference: str | None,
    notes: str | None,
    received_at: str,
    recorded_by_user_id: str,
) -> CommercePaymentModel:
    model = CommercePaymentModel(
        tenant_id=tenant_id,
        order_id=order_id,
        amount_minor=amount_minor,
        currency=currency,
        provider=provider,
        payment_method=payment_method,
        status=status,
        reference=reference,
        notes=notes,
        received_at=received_at,
        recorded_by_user_id=recorded_by_user_id,
    )
    db.add(model)
    db.flush()
    return model

def create_refund(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    payment_id: str,
    amount_minor: int,
    currency: str,
    reason: str,
    reference: str | None,
    status: str,
    refunded_at: str,
    recorded_by_user_id: str,
) -> CommerceRefundModel:
    model = CommerceRefundModel(
        tenant_id=tenant_id,
        order_id=order_id,
        payment_id=payment_id,
        amount_minor=amount_minor,
        currency=currency,
        reason=reason,
        reference=reference,
        status=status,
        refunded_at=refunded_at,
        recorded_by_user_id=recorded_by_user_id,
    )
    db.add(model)
    db.flush()
    return model

def create_return(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    return_number: str,
    status: str,
    reason_summary: str | None,
    notes: str | None,
    inventory_restocked: bool,
    requested_at: str,
    approved_at: str | None,
    received_at: str | None,
    closed_at: str | None,
    created_by_user_id: str,
    closed_by_user_id: str | None,
) -> CommerceReturnModel:
    model = CommerceReturnModel(
        tenant_id=tenant_id,
        order_id=order_id,
        return_number=return_number,
        status=status,
        reason_summary=reason_summary,
        notes=notes,
        inventory_restocked=inventory_restocked,
        requested_at=requested_at,
        approved_at=approved_at,
        received_at=received_at,
        closed_at=closed_at,
        created_by_user_id=created_by_user_id,
        closed_by_user_id=closed_by_user_id,
    )
    db.add(model)
    db.flush()
    return model

def create_return_line(
    db: Session,
    *,
    tenant_id: str,
    return_id: str,
    order_line_id: str,
    variant_id: str,
    quantity: int,
    resolution_type: str,
    replacement_variant_id: str | None,
    restock_on_receive: bool,
    line_amount_minor: int,
    notes: str | None,
) -> CommerceReturnLineModel:
    model = CommerceReturnLineModel(
        tenant_id=tenant_id,
        return_id=return_id,
        order_line_id=order_line_id,
        variant_id=variant_id,
        quantity=quantity,
        resolution_type=resolution_type,
        replacement_variant_id=replacement_variant_id,
        restock_on_receive=restock_on_receive,
        line_amount_minor=line_amount_minor,
        notes=notes,
    )
    db.add(model)
    db.flush()
    return model

def create_settlement(
    db: Session,
    *,
    tenant_id: str,
    settlement_number: str,
    provider: str,
    settlement_reference: str | None,
    currency: str,
    status: str,
    payments_minor: int,
    refunds_minor: int,
    fees_minor: int,
    adjustments_minor: int,
    net_minor: int,
    reported_at: str,
    reconciled_at: str | None,
    closed_at: str | None,
    notes: str | None,
    created_by_user_id: str,
    closed_by_user_id: str | None,
) -> CommerceSettlementModel:
    model = CommerceSettlementModel(
        tenant_id=tenant_id,
        settlement_number=settlement_number,
        provider=provider,
        settlement_reference=settlement_reference,
        currency=currency,
        status=status,
        payments_minor=payments_minor,
        refunds_minor=refunds_minor,
        fees_minor=fees_minor,
        adjustments_minor=adjustments_minor,
        net_minor=net_minor,
        reported_at=reported_at,
        reconciled_at=reconciled_at,
        closed_at=closed_at,
        notes=notes,
        created_by_user_id=created_by_user_id,
        closed_by_user_id=closed_by_user_id,
    )
    db.add(model)
    db.flush()
    return model

def create_settlement_entry(
    db: Session,
    *,
    tenant_id: str,
    settlement_id: str,
    entry_type: str,
    payment_id: str | None,
    refund_id: str | None,
    amount_minor: int,
    label: str | None,
    notes: str | None,
) -> CommerceSettlementEntryModel:
    model = CommerceSettlementEntryModel(
        tenant_id=tenant_id,
        settlement_id=settlement_id,
        entry_type=entry_type,
        payment_id=payment_id,
        refund_id=refund_id,
        amount_minor=amount_minor,
        label=label,
        notes=notes,
    )
    db.add(model)
    db.flush()
    return model

def create_invoice(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    customer_id: str,
    invoice_number: str,
    status: str,
    currency: str,
    subtotal_minor: int,
    discount_minor: int,
    tax_minor: int,
    total_minor: int,
    issued_at: str,
    issued_by_user_id: str,
) -> CommerceInvoiceModel:
    model = CommerceInvoiceModel(
        tenant_id=tenant_id,
        order_id=order_id,
        customer_id=customer_id,
        invoice_number=invoice_number,
        status=status,
        currency=currency,
        subtotal_minor=subtotal_minor,
        discount_minor=discount_minor,
        tax_minor=tax_minor,
        total_minor=total_minor,
        issued_at=issued_at,
        issued_by_user_id=issued_by_user_id,
    )
    db.add(model)
    db.flush()
    return model
