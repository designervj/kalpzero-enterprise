from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authz import require_permission
from app.core.security import SessionContext
from app.db.session import get_db_session
from app.schemas.requests import (
    CreateCommerceAttributeRequest,
    CreateCommerceAttributeSetRequest,
    CreateCommerceBrandRequest,
    CreateCommerceCouponRequest,
    CreateCommerceCollectionRequest,
    CreateCommerceFulfillmentRequest,
    CreateCommerceShipmentRequest,
    CreateCommerceStockAdjustmentRequest,
    CreateCommercePaymentRequest,
    CreateCommercePriceListRequest,
    CreateCommerceRefundRequest,
    CreateCommerceReturnRequest,
    CreateCommerceSettlementRequest,
    CreateCommerceTaxProfileRequest,
    CreateCommerceWarehouseRequest,
    CommerceFulfillmentStatusRequest,
    CommerceOrderStatusRequest,
    CommerceReturnStatusRequest,
    CommerceSettlementStatusRequest,
    CommerceShipmentStatusRequest,
    CreateCommerceCategoryRequest,
    CreateCommerceOrderRequest,
    CreateCommerceProductRequest,
    CreateCommerceVendorRequest,
)
from app.services.commerce import (
    adjust_stock,
    create_attribute,
    create_attribute_set,
    create_brand,
    create_category,
    create_coupon,
    create_collection,
    create_fulfillment,
    create_order,
    create_return,
    create_settlement,
    get_order_finance_detail,
    get_return_detail,
    get_settlement_detail,
    issue_order_invoice,
    create_shipment,
    list_invoices,
    list_payments,
    list_refunds,
    list_returns,
    list_settlements,
    list_shipments,
    create_price_list,
    create_product,
    create_warehouse,
    record_payment,
    record_refund,
    create_tax_profile,
    create_vendor,
    get_overview,
    list_attributes,
    list_attribute_sets,
    list_brands,
    list_categories,
    list_coupons,
    list_collections,
    list_fulfillments,
    list_orders,
    list_price_lists,
    list_products,
    list_stock_ledger,
    list_stock_levels,
    list_tax_profiles,
    list_vendors,
    list_warehouses,
    update_fulfillment_status,
    update_order_status,
    update_return_status,
    update_settlement_status,
    update_shipment_status,
)
from app.services.errors import ConflictError, NotFoundError, ValidationError

router = APIRouter()


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, NotFoundError):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    if isinstance(exc, ValidationError):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if isinstance(exc, ConflictError):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    raise exc
# --- Commerce Routes (Unified Public/Protected) ---

@router.get("/overview")
async def commerce_overview(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_overview(db, tenant_slug=session.tenant_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/categories")
async def commerce_categories(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "categories": await list_categories(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/categories", status_code=status.HTTP_201_CREATED)
async def commerce_categories_create(
    payload: CreateCommerceCategoryRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_category(
            db,
            tenant_slug=session.tenant_id,
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            parent_category_id=payload.parent_category_id,
            db_name=session.tenant_db_name
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/brands")
async def commerce_brands(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "brands": await list_brands(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/brands", status_code=status.HTTP_201_CREATED)
async def commerce_brands_create(
    payload: CreateCommerceBrandRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_brand(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            code=payload.code,
            description=payload.description,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/vendors")
async def commerce_vendors(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "vendors": await list_vendors(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/vendors", status_code=status.HTTP_201_CREATED)
async def commerce_vendors_create(
    payload: CreateCommerceVendorRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_vendor(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            code=payload.code,
            description=payload.description,
            contact_name=payload.contact_name,
            contact_email=payload.contact_email,
            contact_phone=payload.contact_phone,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/collections")
async def commerce_collections(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "collections": await list_collections(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/collections", status_code=status.HTTP_201_CREATED)
async def commerce_collections_create(
    payload: CreateCommerceCollectionRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_collection(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            status=payload.status,
            sort_order=payload.sort_order,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/warehouses")
async def commerce_warehouses(
    session: SessionContext = Depends(require_permission("commerce.inventory.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "warehouses": await list_warehouses(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/warehouses", status_code=status.HTTP_201_CREATED)
async def commerce_warehouses_create(
    payload: CreateCommerceWarehouseRequest,
    session: SessionContext = Depends(require_permission("commerce.inventory.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_warehouse(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            code=payload.code,
            city=payload.city,
            country=payload.country,
            status=payload.status,
            is_default=payload.is_default,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/stock-levels")
async def commerce_stock_levels(
    warehouse_id: str | None = None,
    variant_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.inventory.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "stock_levels": await list_stock_levels(
                db,
                tenant_slug=session.tenant_id,
                warehouse_id=warehouse_id,
                variant_id=variant_id,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/stock-ledger")
async def commerce_stock_ledger(
    warehouse_id: str | None = None,
    variant_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.inventory.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "entries": await list_stock_ledger(
                db,
                tenant_slug=session.tenant_id,
                warehouse_id=warehouse_id,
                variant_id=variant_id,
            ),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/warehouses/{warehouse_id}/stock-adjustments", status_code=status.HTTP_201_CREATED)
async def commerce_stock_adjustments_create(
    warehouse_id: str,
    payload: CreateCommerceStockAdjustmentRequest,
    session: SessionContext = Depends(require_permission("commerce.inventory.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await adjust_stock(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            warehouse_id=warehouse_id,
            variant_id=payload.variant_id,
            quantity_delta=payload.quantity_delta,
            notes=payload.notes,
            low_stock_threshold=payload.low_stock_threshold,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/tax-profiles")
async def commerce_tax_profiles(
    session: SessionContext = Depends(require_permission("commerce.pricing.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "tax_profiles": await list_tax_profiles(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/tax-profiles", status_code=status.HTTP_201_CREATED)
async def commerce_tax_profiles_create(
    payload: CreateCommerceTaxProfileRequest,
    session: SessionContext = Depends(require_permission("commerce.pricing.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_tax_profile(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            code=payload.code,
            description=payload.description,
            prices_include_tax=payload.prices_include_tax,
            rules=[rule.model_dump() for rule in payload.rules],
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/price-lists")
async def commerce_price_lists(
    session: SessionContext = Depends(require_permission("commerce.pricing.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "price_lists": await list_price_lists(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/price-lists", status_code=status.HTTP_201_CREATED)
async def commerce_price_lists_create(
    payload: CreateCommercePriceListRequest,
    session: SessionContext = Depends(require_permission("commerce.pricing.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_price_list(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            currency=payload.currency,
            customer_segment=payload.customer_segment,
            description=payload.description,
            status=payload.status,
            items=[item.model_dump() for item in payload.items],
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/coupons")
async def commerce_coupons(
    session: SessionContext = Depends(require_permission("commerce.pricing.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "coupons": await list_coupons(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/coupons", status_code=status.HTTP_201_CREATED)
async def commerce_coupons_create(
    payload: CreateCommerceCouponRequest,
    session: SessionContext = Depends(require_permission("commerce.pricing.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_coupon(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            code=payload.code,
            description=payload.description,
            discount_type=payload.discount_type,
            discount_value=payload.discount_value,
            minimum_subtotal_minor=payload.minimum_subtotal_minor,
            maximum_discount_minor=payload.maximum_discount_minor,
            applicable_category_ids=payload.applicable_category_ids,
            applicable_variant_ids=payload.applicable_variant_ids,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/attributes")
async def commerce_attributes(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "attributes": await list_attributes(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/attributes", status_code=status.HTTP_201_CREATED)
async def commerce_attributes_create(
    payload: CreateCommerceAttributeRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_attribute(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            code=payload.code,
            slug=payload.slug,
            label=payload.label,
            description=payload.description,
            value_type=payload.value_type,
            scope=payload.scope,
            options=[option.model_dump() for option in payload.options],
            unit_label=payload.unit_label,
            is_required=payload.is_required,
            is_filterable=payload.is_filterable,
            is_variation_axis=payload.is_variation_axis,
            vertical_bindings=payload.vertical_bindings,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/attribute-sets")
async def commerce_attribute_sets(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "attribute_sets": await list_attribute_sets(db, tenant_slug=session.tenant_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/attribute-sets", status_code=status.HTTP_201_CREATED)
async def commerce_attribute_sets_create(
    payload: CreateCommerceAttributeSetRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_attribute_set(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            attribute_ids=payload.attribute_ids,
            vertical_bindings=payload.vertical_bindings,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/products")
async def commerce_products(
    session: SessionContext = Depends(require_permission("commerce.catalog.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "products": await list_products(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/products", status_code=status.HTTP_201_CREATED)
async def commerce_products_create(
    payload: CreateCommerceProductRequest,
    session: SessionContext = Depends(require_permission("commerce.catalog.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_product(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            name=payload.name,
            slug=payload.slug,
            description=payload.description,
            brand_id=payload.brand_id,
            vendor_id=payload.vendor_id,
            collection_ids=payload.collection_ids,
            attribute_set_id=payload.attribute_set_id,
            category_ids=payload.category_ids,
            seo_title=payload.seo_title,
            seo_description=payload.seo_description,
            status=payload.status,
            product_attributes=[attribute.model_dump() for attribute in payload.product_attributes],
            variants=[variant.model_dump() for variant in payload.variants],
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/orders")
async def commerce_orders(
    session: SessionContext = Depends(require_permission("commerce.orders.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "orders": await list_orders(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/fulfillments")
async def commerce_fulfillments(
    order_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.fulfillment.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "fulfillments": await list_fulfillments(db, tenant_slug=session.tenant_id, order_id=order_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/shipments")
async def commerce_shipments(
    fulfillment_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.fulfillment.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {
            "tenant_id": session.tenant_id,
            "shipments": await list_shipments(db, tenant_slug=session.tenant_id, fulfillment_id=fulfillment_id),
        }
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/payments")
async def commerce_payments(
    order_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "payments": await list_payments(db, tenant_slug=session.tenant_id, order_id=order_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/refunds")
async def commerce_refunds(
    order_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "refunds": await list_refunds(db, tenant_slug=session.tenant_id, order_id=order_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/returns")
async def commerce_returns(
    order_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.orders.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "returns": await list_returns(db, tenant_slug=session.tenant_id, order_id=order_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/returns/{return_id}")
async def commerce_return_detail(
    return_id: str,
    session: SessionContext = Depends(require_permission("commerce.orders.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_return_detail(db, tenant_slug=session.tenant_id, return_id=return_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/invoices")
async def commerce_invoices(
    order_id: str | None = None,
    session: SessionContext = Depends(require_permission("commerce.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "invoices": await list_invoices(db, tenant_slug=session.tenant_id, order_id=order_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/settlements")
async def commerce_settlements(
    session: SessionContext = Depends(require_permission("commerce.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return {"tenant_id": session.tenant_id, "settlements": await list_settlements(db, tenant_slug=session.tenant_id)}
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/settlements/{settlement_id}")
async def commerce_settlement_detail(
    settlement_id: str,
    session: SessionContext = Depends(require_permission("commerce.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_settlement_detail(db, tenant_slug=session.tenant_id, settlement_id=settlement_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/orders", status_code=status.HTTP_201_CREATED)
async def commerce_orders_create(
    payload: CreateCommerceOrderRequest,
    session: SessionContext = Depends(require_permission("commerce.orders.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_order(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            customer_id=payload.customer_id,
            price_list_id=payload.price_list_id,
            tax_profile_id=payload.tax_profile_id,
            coupon_code=payload.coupon_code,
            status=payload.status,
            currency=payload.currency,
            lines=[line.model_dump() for line in payload.lines],
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/settlements", status_code=status.HTTP_201_CREATED)
async def commerce_settlements_create(
    payload: CreateCommerceSettlementRequest,
    session: SessionContext = Depends(require_permission("commerce.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_settlement(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            provider=payload.provider,
            settlement_reference=payload.settlement_reference,
            currency=payload.currency,
            status=payload.status,
            payment_ids=payload.payment_ids,
            refund_ids=payload.refund_ids,
            fees_minor=payload.fees_minor,
            adjustments_minor=payload.adjustments_minor,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/orders/{order_id}/returns", status_code=status.HTTP_201_CREATED)
async def commerce_order_return_create(
    order_id: str,
    payload: CreateCommerceReturnRequest,
    session: SessionContext = Depends(require_permission("commerce.orders.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_return(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            order_id=order_id,
            reason_summary=payload.reason_summary,
            notes=payload.notes,
            lines=[line.model_dump() for line in payload.lines],
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/orders/{order_id}/finance")
async def commerce_order_finance_detail(
    order_id: str,
    session: SessionContext = Depends(require_permission("commerce.finance.read")),
    db: Session = Depends(get_db_session),
):
    try:
        return await get_order_finance_detail(db, tenant_slug=session.tenant_id, order_id=order_id)
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/orders/{order_id}/payments", status_code=status.HTTP_201_CREATED)
async def commerce_order_payment_create(
    order_id: str,
    payload: CreateCommercePaymentRequest,
    session: SessionContext = Depends(require_permission("commerce.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await record_payment(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            order_id=order_id,
            amount_minor=payload.amount_minor,
            provider=payload.provider,
            payment_method=payload.payment_method,
            status=payload.status,
            reference=payload.reference,
            notes=payload.notes,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/orders/{order_id}/refunds", status_code=status.HTTP_201_CREATED)
async def commerce_order_refund_create(
    order_id: str,
    payload: CreateCommerceRefundRequest,
    session: SessionContext = Depends(require_permission("commerce.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await record_refund(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            order_id=order_id,
            payment_id=payload.payment_id,
            amount_minor=payload.amount_minor,
            reason=payload.reason,
            reference=payload.reference,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/orders/{order_id}/issue-invoice")
async def commerce_order_issue_invoice(
    order_id: str,
    session: SessionContext = Depends(require_permission("commerce.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await issue_order_invoice(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            order_id=order_id,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/returns/{return_id}/status")
async def commerce_return_update_status(
    return_id: str,
    payload: CommerceReturnStatusRequest,
    session: SessionContext = Depends(require_permission("commerce.orders.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_return_status(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            return_id=return_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/settlements/{settlement_id}/status")
async def commerce_settlement_update_status(
    settlement_id: str,
    payload: CommerceSettlementStatusRequest,
    session: SessionContext = Depends(require_permission("commerce.finance.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_settlement_status(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            settlement_id=settlement_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/orders/{order_id}/fulfillments", status_code=status.HTTP_201_CREATED)
async def commerce_order_fulfillment_create(
    order_id: str,
    payload: CreateCommerceFulfillmentRequest,
    session: SessionContext = Depends(require_permission("commerce.fulfillment.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_fulfillment(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            order_id=order_id,
            warehouse_id=payload.warehouse_id,
            lines=[line.model_dump() for line in payload.lines],
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/fulfillments/{fulfillment_id}/status")
async def commerce_fulfillment_update_status(
    fulfillment_id: str,
    payload: CommerceFulfillmentStatusRequest,
    session: SessionContext = Depends(require_permission("commerce.fulfillment.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_fulfillment_status(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            fulfillment_id=fulfillment_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.post("/fulfillments/{fulfillment_id}/shipments", status_code=status.HTTP_201_CREATED)
async def commerce_shipment_create(
    fulfillment_id: str,
    payload: CreateCommerceShipmentRequest,
    session: SessionContext = Depends(require_permission("commerce.fulfillment.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await create_shipment(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            fulfillment_id=fulfillment_id,
            carrier=payload.carrier,
            service_level=payload.service_level,
            tracking_number=payload.tracking_number,
            metadata=payload.metadata,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/shipments/{shipment_id}/status")
async def commerce_shipment_update_status(
    shipment_id: str,
    payload: CommerceShipmentStatusRequest,
    session: SessionContext = Depends(require_permission("commerce.fulfillment.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_shipment_status(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            shipment_id=shipment_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)


@router.patch("/orders/{order_id}/status")
async def commerce_orders_update_status(
    order_id: str,
    payload: CommerceOrderStatusRequest,
    session: SessionContext = Depends(require_permission("commerce.orders.manage")),
    db: Session = Depends(get_db_session),
):
    try:
        return await update_order_status(
            db,
            tenant_slug=session.tenant_id,
            actor_user_id=session.user_id,
            order_id=order_id,
            status=payload.status,
        )
    except Exception as exc:
        _raise_http_error(exc)
