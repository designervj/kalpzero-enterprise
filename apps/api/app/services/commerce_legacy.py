from collections import Counter, defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
import bcrypt
import yaml
from sqlalchemy.orm import Session

from app.repositories import commerce as commerce_repository
from app.repositories import platform as platform_repository
from app.services.errors import ConflictError, NotFoundError, ValidationError
from app.services.platform import get_tenant_or_raise



COUPON_DISCOUNT_TYPES = {"fixed", "percent"}
PAYMENT_RECORD_STATUSES = {"authorized", "captured", "failed"}
WAREHOUSE_ACTIVE_STATUSES = {"active", "inactive"}
STOCK_LEDGER_ENTRY_TYPES = {"adjustment", "reservation", "release", "fulfillment", "restock"}
FULFILLMENT_STATUSES = {"pending_pick", "packed", "shipped", "delivered", "cancelled"}
SHIPMENT_STATUSES = {"shipped", "delivered", "cancelled"}
RETURN_STATUSES = {"requested", "approved", "rejected", "received", "completed", "cancelled"}
RETURN_RESOLUTION_TYPES = {"refund", "exchange"}
RETURN_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "requested": {"approved", "rejected", "cancelled"},
    "approved": {"received", "cancelled"},
    "received": {"completed"},
    "rejected": set(),
    "completed": set(),
    "cancelled": set(),
}
SETTLEMENT_STATUSES = {"draft", "reported", "reconciled", "closed", "disputed"}
SETTLEMENT_ENTRY_TYPES = {"payment", "refund", "fee", "adjustment"}
SETTLEMENT_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"reported", "reconciled", "disputed"},
    "reported": {"reconciled", "closed", "disputed"},
    "reconciled": {"closed", "disputed"},
    "disputed": {"reconciled", "closed"},
    "closed": set(),
}


def _tenant(db: Session, tenant_slug: str):
    return get_tenant_or_raise(db, tenant_slug=tenant_slug)



def _dedupe_strings(values: list[str], *, default: list[str] | None = None) -> list[str]:
    deduped: list[str] = []
    seen: set[str] = set()
    for raw in values:
        value = raw.strip()
        if not value or value in seen:
            continue
        deduped.append(value)
        seen.add(value)
    if deduped:
        return deduped
    return list(default or [])





def _serialize_category(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "description": model.get("description"),
        "parent_category_id": str(model["parent_category_id"]) if model.get("parent_category_id") else None,
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_brand(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "code": model.get("code"),
        "description": model.get("description"),
        "status": model["status"],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_vendor(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "code": model.get("code"),
        "description": model.get("description"),
        "contact_name": model.get("contact_name"),
        "contact_email": model.get("contact_email"),
        "contact_phone": model.get("contact_phone"),
        "status": model["status"],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_collection(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "description": model.get("description"),
        "status": model["status"],
        "sort_order": model.get("sort_order", 0),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_warehouse(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "code": model.get("code"),
        "city": model.get("city"),
        "country": model.get("country"),
        "status": model["status"],
        "is_default": model.get("is_default", False),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_warehouse_stock(model) -> dict[str, object]:
    on_hand = model.get("on_hand_quantity", 0)
    reserved = model.get("reserved_quantity", 0)
    low_stock_threshold = model.get("low_stock_threshold", 0)
    available_quantity = on_hand - reserved
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "warehouse_id": str(model["warehouse_id"]),
        "variant_id": str(model["variant_id"]),
        "on_hand_quantity": on_hand,
        "reserved_quantity": reserved,
        "available_quantity": available_quantity,
        "low_stock_threshold": low_stock_threshold,
        "is_below_threshold": available_quantity <= low_stock_threshold if low_stock_threshold > 0 else False,
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_stock_ledger_entry(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "warehouse_id": str(model["warehouse_id"]),
        "variant_id": str(model["variant_id"]),
        "entry_type": model["entry_type"],
        "quantity_delta": model["quantity_delta"],
        "balance_after": model["balance_after"],
        "reserved_after": model["reserved_after"],
        "reference_type": model.get("reference_type"),
        "reference_id": str(model["reference_id"]) if model.get("reference_id") else None,
        "notes": model.get("notes"),
        "recorded_by_user_id": str(model["recorded_by_user_id"]),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_tax_profile(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "code": model.get("code"),
        "description": model.get("description"),
        "prices_include_tax": model.get("prices_include_tax", False),
        "rules": model.get("rules_json", {}),
        "status": model["status"],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_price_list_item(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "price_list_id": str(model["price_list_id"]),
        "variant_id": str(model["variant_id"]),
        "price_minor": model["price_minor"],
    }


def _serialize_price_list(model, items_by_price_list: dict[str, list[dict[str, object]]]) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "currency": model["currency"],
        "customer_segment": model.get("customer_segment"),
        "description": model.get("description"),
        "status": model["status"],
        "items": items_by_price_list.get(str(model["id"]), []),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_coupon(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "code": model["code"],
        "description": model.get("description"),
        "discount_type": model["discount_type"],
        "discount_value": model["discount_value"],
        "minimum_subtotal_minor": model.get("minimum_subtotal_minor", 0),
        "maximum_discount_minor": model.get("maximum_discount_minor"),
        "applicable_category_ids": [str(cid) for cid in model.get("applicable_category_ids", [])],
        "applicable_variant_ids": [str(vid) for vid in model.get("applicable_variant_ids", [])],
        "status": model["status"],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_payment(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "order_id": str(model["order_id"]),
        "amount_minor": model["amount_minor"],
        "currency": model["currency"],
        "provider": model["provider"],
        "payment_method": model["payment_method"],
        "status": model["status"],
        "reference": model.get("reference"),
        "notes": model.get("notes"),
        "received_at": model.get("received_at"),
        "recorded_by_user_id": str(model["recorded_by_user_id"]),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_refund(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "order_id": str(model["order_id"]),
        "payment_id": str(model["payment_id"]),
        "amount_minor": model["amount_minor"],
        "currency": model["currency"],
        "reason": model.get("reason"),
        "reference": model.get("reference"),
        "status": model["status"],
        "refunded_at": model.get("refunded_at"),
        "recorded_by_user_id": str(model["recorded_by_user_id"]),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_invoice(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "order_id": str(model["order_id"]),
        "customer_id": str(model["customer_id"]),
        "invoice_number": model["invoice_number"],
        "status": model["status"],
        "currency": model["currency"],
        "subtotal_minor": model["subtotal_minor"],
        "discount_minor": model["discount_minor"],
        "tax_minor": model["tax_minor"],
        "total_minor": model["total_minor"],
        "issued_at": model.get("issued_at"),
        "issued_by_user_id": str(model["issued_by_user_id"]),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_return_line(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "return_id": str(model["return_id"]),
        "order_line_id": str(model["order_line_id"]) if model.get("order_line_id") else None,
        "variant_id": str(model["variant_id"]),
        "quantity": model["quantity"],
        "resolution_type": model["resolution_type"],
        "replacement_variant_id": str(model["replacement_variant_id"]) if model.get("replacement_variant_id") else None,
        "restock_on_receive": model.get("restock_on_receive", False),
        "line_amount_minor": model.get("line_amount_minor", 0),
        "notes": model.get("notes"),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_return(model, lines_by_return: dict[str, list[dict[str, object]]]) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "order_id": str(model["order_id"]),
        "return_number": model["return_number"],
        "status": model["status"],
        "reason_summary": model.get("reason_summary"),
        "notes": model.get("notes"),
        "inventory_restocked": model.get("inventory_restocked", False),
        "requested_at": model.get("requested_at"),
        "approved_at": model.get("approved_at"),
        "received_at": model.get("received_at"),
        "closed_at": model.get("closed_at"),
        "created_by_user_id": str(model["created_by_user_id"]),
        "closed_by_user_id": str(model["closed_by_user_id"]) if model.get("closed_by_user_id") else None,
        "lines": lines_by_return.get(str(model["id"]), []),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_settlement_entry(model, *, payment=None, refund=None) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "settlement_id": str(model["settlement_id"]),
        "entry_type": model["entry_type"],
        "payment_id": str(model["payment_id"]) if model.get("payment_id") else None,
        "refund_id": str(model["refund_id"]) if model.get("refund_id") else None,
        "amount_minor": model["amount_minor"],
        "label": model.get("label"),
        "notes": model.get("notes"),
        "payment": _serialize_payment(payment) if payment is not None else None,
        "refund": _serialize_refund(refund) if refund is not None else None,
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_settlement(model, entries_by_settlement: dict[str, list[dict[str, object]]]) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "settlement_number": model["settlement_number"],
        "provider": model["provider"],
        "settlement_reference": model.get("settlement_reference"),
        "currency": model["currency"],
        "status": model["status"],
        "payments_minor": model.get("payments_minor", 0),
        "refunds_minor": model.get("refunds_minor", 0),
        "fees_minor": model.get("fees_minor", 0),
        "adjustments_minor": model.get("adjustments_minor", 0),
        "net_minor": model.get("net_minor", 0),
        "reported_at": model.get("reported_at"),
        "reconciled_at": model.get("reconciled_at"),
        "closed_at": model.get("closed_at"),
        "notes": model.get("notes"),
        "created_by_user_id": str(model["created_by_user_id"]),
        "closed_by_user_id": str(model["closed_by_user_id"]) if model.get("closed_by_user_id") else None,
        "entries": entries_by_settlement.get(str(model["id"]), []),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }





def _serialize_attribute_set(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "name": model["name"],
        "key": model["key"],
        "description": model.get("description"),
        "attributes": model.get("attributes", []),
        "vertical_bindings": model.get("vertical_bindings", []),
        "status": model["status"],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }





def _serialize_variant(model, attribute_values_by_variant: dict[str, list[dict[str, object]]]) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "product_id": str(model["product_id"]),
        "sku": model["sku"],
        "label": model.get("label"),
        "price_minor": model.get("price_minor", 0),
        "currency": model.get("currency"),
        "inventory_quantity": model.get("inventory_quantity", 0),
        "attribute_values": [],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_product(
    model,
    variants_by_product: dict[str, list[dict[str, object]]],
    product_attribute_values_by_product: dict[str, list[dict[str, object]]],
) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "name": model["name"],
        "slug": model["slug"],
        "description": model.get("description"),
        "brand_id": str(model["brand_id"]) if model.get("brand_id") else None,
        "vendor_id": str(model["vendor_id"]) if model.get("vendor_id") else None,
        "collection_ids": [str(cid) for cid in model.get("collection_ids", [])],
        "attribute_set_id": str(model["attribute_set_id"]) if model.get("attribute_set_id") else None,
        "category_ids": [str(cid) for cid in model.get("category_ids", [])],
        "seo_title": model.get("seo_title"),
        "seo_description": model.get("seo_description"),
        "status": model["status"],
        "product_attributes": [],
        "variants": variants_by_product.get(str(model["id"]), []),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_order_line(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "product_id": str(model["product_id"]),
        "variant_id": str(model["variant_id"]),
        "allocated_warehouse_id": str(model["allocated_warehouse_id"]) if model.get("allocated_warehouse_id") else None,
        "quantity": model["quantity"],
        "fulfilled_quantity": model.get("fulfilled_quantity", 0),
        "unit_price_minor": model["unit_price_minor"],
        "line_total_minor": model["line_total_minor"],
    }


def _serialize_fulfillment_line(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "fulfillment_id": str(model["fulfillment_id"]),
        "order_line_id": str(model["order_line_id"]),
        "variant_id": str(model["variant_id"]),
        "quantity": model["quantity"],
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_fulfillment(model, lines_by_fulfillment: dict[str, list[dict[str, object]]]) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "order_id": str(model["order_id"]),
        "warehouse_id": str(model["warehouse_id"]),
        "fulfillment_number": model["fulfillment_number"],
        "status": model["status"],
        "created_by_user_id": str(model["created_by_user_id"]),
        "packed_at": model.get("packed_at"),
        "shipped_at": model.get("shipped_at"),
        "delivered_at": model.get("delivered_at"),
        "lines": lines_by_fulfillment.get(str(model["id"]), []),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_shipment(model) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "fulfillment_id": str(model["fulfillment_id"]),
        "carrier": model.get("carrier"),
        "service_level": model.get("service_level"),
        "tracking_number": model.get("tracking_number"),
        "status": model["status"],
        "shipped_at": model.get("shipped_at"),
        "delivered_at": model.get("delivered_at"),
        "metadata": model.get("metadata_json", {}),
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _serialize_order(
    model,
    lines_by_order: dict[str, list[dict[str, object]]],
    *,
    payments: list | None = None,
    refunds: list | None = None,
    invoices: list | None = None,
    returns: list | None = None,
) -> dict[str, object]:
    return {
        "id": str(model["id"]),
        "tenant_id": str(model["tenant_id"]),
        "customer_id": str(model["customer_id"]),
        "price_list_id": str(model["price_list_id"]) if model.get("price_list_id") else None,
        "tax_profile_id": str(model["tax_profile_id"]) if model.get("tax_profile_id") else None,
        "coupon_code": model.get("coupon_code"),
        "status": model["status"],
        "currency": model["currency"],
        "subtotal_minor": model["subtotal_minor"],
        "discount_minor": model.get("discount_minor", 0),
        "tax_minor": model.get("tax_minor", 0),
        "total_minor": model["total_minor"],
        "payment_status": model.get("payment_status", "pending"),
        "paid_minor": model.get("paid_minor", 0),
        "refunded_minor": model.get("refunded_minor", 0),
        "balance_minor": model.get("balance_minor", 0),
        "invoice_number": model.get("invoice_number"),
        "invoice_issued_at": model.get("invoice_issued_at"),
        "inventory_reserved": model.get("inventory_reserved", False),
        "placed_at": model.get("placed_at"),
        "lines": lines_by_order.get(str(model["id"]), []),
        "payments": [_serialize_payment(item) for item in payments] if payments is not None else None,
        "refunds": [_serialize_refund(item) for item in refunds] if refunds is not None else None,
        "invoices": [_serialize_invoice(item) for item in invoices] if invoices is not None else None,
        "returns": returns,
        "created_at": model["created_at"].isoformat() if hasattr(model["created_at"], "isoformat") else model["created_at"],
    }


def _audit(
    db: Session,
    *,
    tenant_id: str,
    actor_user_id: str,
    action: str,
    subject_type: str,
    subject_id: str,
    metadata: dict[str, object],
) -> None:
    platform_repository.create_audit_event(
        db,
        tenant_id=tenant_id,
        actor_user_id=actor_user_id,
        action=action,
        subject_type=subject_type,
        subject_id=subject_id,
        metadata_json=metadata,
    )


def _outbox_order(db: Session, *, tenant_id: str, order) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(order["id"]),
        event_name="commerce.order.created",
        payload_json={
            "order_id": str(order["id"]),
            "customer_id": str(order["customer_id"]),
            "status": order["status"],
            "total_minor": order["total_minor"],
        },
    )


def _outbox_invoice(db: Session, *, tenant_id: str, order) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(order["id"]),
        event_name="invoice.issued",
        payload_json={
            "order_id": str(order["id"]),
            "customer_id": str(order["customer_id"]),
            "invoice_number": order.get("invoice_number"),
            "total_minor": order["total_minor"],
        },
    )


def _outbox_fulfillment(db: Session, *, tenant_id: str, fulfillment) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(fulfillment["id"]),
        event_name="commerce.fulfillment.updated",
        payload_json={
            "fulfillment_id": str(fulfillment["id"]),
            "order_id": str(fulfillment["order_id"]),
            "warehouse_id": str(fulfillment["warehouse_id"]),
            "status": fulfillment["status"],
        },
    )


def _outbox_shipment(db: Session, *, tenant_id: str, shipment) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(shipment.id),
        event_name="commerce.shipment.updated",
        payload_json={
            "shipment_id": str(shipment.id),
            "fulfillment_id": str(shipment.fulfillment_id),
            "tracking_number": shipment.tracking_number,
            "status": shipment.status,
        },
    )


def _outbox_return(db: Session, *, tenant_id: str, return_request) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(return_request.id),
        event_name="commerce.return.updated",
        payload_json={
            "return_id": str(return_request.id),
            "order_id": str(return_request.order_id),
            "return_number": return_request.return_number,
            "status": return_request.status,
        },
    )


def _outbox_settlement(db: Session, *, tenant_id: str, settlement) -> None:
    platform_repository.enqueue_outbox_event(
        db,
        tenant_id=str(tenant_id),
        aggregate_id=str(settlement.id),
        event_name="commerce.settlement.updated",
        payload_json={
            "settlement_id": str(settlement.id),
            "settlement_number": settlement.settlement_number,
            "provider": settlement.provider,
            "status": settlement.status,
            "net_minor": settlement.net_minor,
        },
    )


def _order_or_raise(db: Session, *, tenant_id: str, order_id: str):
    order = commerce_repository.get_order(db, tenant_id=tenant_id, order_id=order_id)
    if order is None:
        raise NotFoundError(f"Order '{order_id}' was not found.")
    return order


def _warehouse_or_raise(db: Session, *, tenant_id: str, warehouse_id: str):
    warehouse = commerce_repository.get_warehouse(db, tenant_id=tenant_id, warehouse_id=warehouse_id)
    if warehouse is None:
        raise NotFoundError(f"Commerce warehouse '{warehouse_id}' was not found.")
    return warehouse


def _fulfillment_or_raise(db: Session, *, tenant_id: str, fulfillment_id: str):
    fulfillment = commerce_repository.get_fulfillment(db, tenant_id=tenant_id, fulfillment_id=fulfillment_id)
    if fulfillment is None:
        raise NotFoundError(f"Commerce fulfillment '{fulfillment_id}' was not found.")
    return fulfillment


def _shipment_or_raise(db: Session, *, tenant_id: str, shipment_id: str):
    shipment = commerce_repository.get_shipment(db, tenant_id=tenant_id, shipment_id=shipment_id)
    if shipment is None:
        raise NotFoundError(f"Commerce shipment '{shipment_id}' was not found.")
    return shipment


def _payment_or_raise(db: Session, *, tenant_id: str, payment_id: str):
    payment = commerce_repository.get_payment(db, tenant_id=tenant_id, payment_id=payment_id)
    if payment is None:
        raise NotFoundError(f"Commerce payment '{payment_id}' was not found.")
    return payment


def _return_or_raise(db: Session, *, tenant_id: str, return_id: str):
    return_request = commerce_repository.get_return(db, tenant_id=tenant_id, return_id=return_id)
    if return_request is None:
        raise NotFoundError(f"Commerce return '{return_id}' was not found.")
    return return_request


def _settlement_or_raise(db: Session, *, tenant_id: str, settlement_id: str):
    settlement = commerce_repository.get_settlement(db, tenant_id=tenant_id, settlement_id=settlement_id)
    if settlement is None:
        raise NotFoundError(f"Commerce settlement '{settlement_id}' was not found.")
    return settlement


def _invoice_number(order) -> str:
    invoice_number = order.get("invoice_number")
    return invoice_number or f"INV-{order['id'][:8].upper()}"


def _fulfillment_number(order, count: int) -> str:
    return f"FUL-{order['id'][:6].upper()}-{count + 1:02d}"


def _return_number(order, count: int) -> str:
    return f"RET-{order['id'][:6].upper()}-{count + 1:02d}"


def _settlement_number(count: int) -> str:
    return f"SET-{count + 1:04d}"


def _sync_variant_inventory_from_stocks(db: Session, *, tenant_id: str, variant_ids: list[str]) -> None:
    deduped_variant_ids = _dedupe_strings(variant_ids)
    if not deduped_variant_ids:
        return
    stocks = commerce_repository.list_warehouse_stocks_for_variants(
        db,
        tenant_id=tenant_id,
        variant_ids=deduped_variant_ids,
    )
    available_by_variant: dict[str, int] = defaultdict(int)
    for stock in stocks:
        available_by_variant[stock["variant_id"]] += stock.get("on_hand_quantity", 0) - stock.get("reserved_quantity", 0)
    for variant_id in deduped_variant_ids:
        variant = commerce_repository.get_variant(db, tenant_id=tenant_id, variant_id=variant_id)
        if variant is not None and variant_id in available_by_variant:
            new_qty = max(available_by_variant[variant_id], 0)
            commerce_repository.update_variant(db, tenant_id=tenant_id, variant_id=variant_id, data={"inventory_quantity": new_qty})


def _allocate_warehouse_stocks(
    db: Session,
    *,
    tenant_id: str,
    variant_ids: list[str],
    quantities: dict[str, int],
) -> dict[str, Any]:
    warehouses = commerce_repository.list_warehouses(db, tenant_id=tenant_id)
    default_warehouse_ids = {warehouse["id"] for warehouse in warehouses if warehouse.get("is_default") and warehouse.get("status") == "active"}
    stocks = commerce_repository.list_warehouse_stocks_for_variants(
        db,
        tenant_id=tenant_id,
        variant_ids=variant_ids,
    )
    stocks_by_variant: dict[str, list[Any]] = defaultdict(list)
    for stock in stocks:
        warehouse = next((item for item in warehouses if item["id"] == stock["warehouse_id"]), None)
        if warehouse is None or warehouse.get("status") != "active":
            continue
        stocks_by_variant[stock["variant_id"]].append(stock)

    allocations: dict[str, Any] = {}
    for variant_id in variant_ids:
        requested = quantities[variant_id]
        candidate_stocks = stocks_by_variant.get(variant_id, [])
        candidate_stocks.sort(
            key=lambda item: (
                0 if item["warehouse_id"] in default_warehouse_ids else 1,
                item["created_at"].isoformat() if hasattr(item["created_at"], "isoformat") else item["created_at"],
            )
        )
        allocated = next(
            (
                stock
                for stock in candidate_stocks
                if (stock.get("on_hand_quantity", 0) - stock.get("reserved_quantity", 0)) >= requested
            ),
            None,
        )
        if allocated is None:
            raise ConflictError(f"Insufficient warehouse stock for variant '{variant_id}'.")
        allocations[variant_id] = allocated
    return allocations


def _recalculate_order_finance(db: Session, order) -> None:
    payments = commerce_repository.list_payments(db, tenant_id=order["tenant_id"], order_id=order["id"])
    refunds = commerce_repository.list_refunds(db, tenant_id=order["tenant_id"], order_id=order["id"])

    captured_minor = sum(item.get("amount_minor", 0) for item in payments if item.get("status") == "captured")
    refunded_minor = sum(item.get("amount_minor", 0) for item in refunds if item.get("status") == "processed")
    
    update_data: dict[str, Any] = {
        "paid_minor": captured_minor,
        "refunded_minor": refunded_minor,
        "balance_minor": max(order.get("total_minor", 0) - captured_minor, 0),
    }

    if refunded_minor >= captured_minor and captured_minor > 0:
        update_data["payment_status"] = "refunded"
    elif refunded_minor > 0:
        update_data["payment_status"] = "partially_refunded"
    elif captured_minor >= order.get("total_minor", 0) and order.get("total_minor", 0) > 0:
        update_data["payment_status"] = "paid"
    elif captured_minor > 0:
        update_data["payment_status"] = "partially_paid"
    elif any(item.get("status") == "authorized" for item in payments):
        update_data["payment_status"] = "authorized"
    elif payments and all(item.get("status") == "failed" for item in payments):
        update_data["payment_status"] = "failed"
    else:
        update_data["payment_status"] = "pending"

    final_status = update_data.get("payment_status", order.get("payment_status"))
    final_order_status = order["status"]
    if final_status == "paid" and final_order_status in {"draft", "placed"}:
        update_data["status"] = "paid"

    commerce_repository.update_order(db, tenant_id=order["tenant_id"], order_id=order["id"], data=update_data)





def _normalize_tax_rules(rules: list[dict[str, object]]) -> list[dict[str, object]]:
    normalized_rules: list[dict[str, object]] = []
    for rule in rules:
        label = str(rule.get("label", "")).strip()
        if not label:
            raise ValidationError("Tax rules require a label.")
        rate_basis_points = int(rule.get("rate_basis_points", 0))
        if rate_basis_points < 0:
            raise ValidationError("Tax rule rate_basis_points must be non-negative.")
        normalized_rules.append({"label": label, "rate_basis_points": rate_basis_points})
    if not normalized_rules:
        raise ValidationError("Tax profiles require at least one rule.")
    return normalized_rules


def _total_tax_basis_points(tax_profile) -> int:
    rules = tax_profile.get("rules_json") or []
    return sum(int(rule.get("rate_basis_points", 0)) for rule in rules)





def get_overview(db: Session, *, tenant_slug: str) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    categories = commerce_repository.list_categories(db, tenant_id=tenant.id)
    brands = commerce_repository.list_brands(db, tenant_id=tenant.id)
    vendors = commerce_repository.list_vendors(db, tenant_id=tenant.id)
    collections = commerce_repository.list_collections(db, tenant_id=tenant.id)
    warehouses = commerce_repository.list_warehouses(db, tenant_id=tenant.id)
    stock_levels = commerce_repository.list_warehouse_stocks(db, tenant_id=tenant.id)
    tax_profiles = commerce_repository.list_tax_profiles(db, tenant_id=tenant.id)
    price_lists = commerce_repository.list_price_lists(db, tenant_id=tenant.id)
    coupons = commerce_repository.list_coupons(db, tenant_id=tenant.id)

    attribute_sets = commerce_repository.list_attribute_sets(db, tenant_id=tenant.id)
    products = commerce_repository.list_products(db, tenant_id=tenant.id)
    variants = commerce_repository.list_variants(db, tenant_id=tenant.id)
    orders = commerce_repository.list_orders(db, tenant_id=tenant.id)
    fulfillments = commerce_repository.list_fulfillments(db, tenant_id=tenant.id)
    shipments = commerce_repository.list_shipments(db, tenant_id=tenant.id)
    payments = commerce_repository.list_payments(db, tenant_id=tenant.id)
    refunds = commerce_repository.list_refunds(db, tenant_id=tenant.id)
    invoices = commerce_repository.list_invoices(db, tenant_id=tenant.id)
    return_requests = commerce_repository.list_returns(db, tenant_id=tenant.id)
    settlements = commerce_repository.list_settlements(db, tenant_id=tenant.id)
    settlement_entries = commerce_repository.list_settlement_entries(
        db,
        tenant_id=tenant.id,
        settlement_ids=[item.id for item in settlements],
    )

    order_statuses = Counter(order["status"] for order in orders)
    payment_statuses = Counter(order.get("payment_status", "pending") for order in orders)
    fulfillment_statuses = Counter(item["status"] for item in fulfillments)
    shipment_statuses = Counter(item["status"] for item in shipments)
    return_statuses = Counter(item["status"] for item in return_requests)
    settlement_statuses = Counter(item["status"] for item in settlements)
    inventory_units = sum(variant.get("inventory_quantity", 0) for variant in variants)
    settled_payment_ids = {item.get("payment_id") for item in settlement_entries if item.get("payment_id")}
    settled_refund_ids = {item.get("refund_id") for item in settlement_entries if item.get("refund_id")}
    unreconciled_payments = sum(
        1 for item in payments if item.get("status") in {"captured", "refunded"} and item["id"] not in settled_payment_ids
    )
    unreconciled_refunds = sum(
        1 for item in refunds if item.get("status") == "processed" and item["id"] not in settled_refund_ids
    )
    low_stock_items = sum(
        1
        for stock in stock_levels
        if stock.get("low_stock_threshold", 0) > 0 and (stock.get("on_hand_quantity", 0) - stock.get("reserved_quantity", 0)) <= stock["low_stock_threshold"]
    )

    return {
        "tenant_id": tenant.slug,
        "tenant_record_id": str(tenant.id),
        "categories": len(categories),
        "brands": len(brands),
        "vendors": len(vendors),
        "collections": len(collections),
        "warehouses": len(warehouses),
        "stock_levels": len(stock_levels),
        "low_stock_items": low_stock_items,
        "tax_profiles": len(tax_profiles),
        "price_lists": len(price_lists),
        "coupons": len(coupons),
        "attributes": 0,
        "attribute_sets": len(attribute_sets),
        "products": len(products),
        "variants": len(variants),
        "inventory_units": inventory_units,
        "orders": dict(order_statuses),
        "order_payment_statuses": dict(payment_statuses),
        "fulfillments": dict(fulfillment_statuses),
        "shipments": dict(shipment_statuses),
        "payments": len(payments),
        "refunds": len(refunds),
        "invoices": len(invoices),
        "returns": dict(return_statuses),
        "settlements": dict(settlement_statuses),
        "unreconciled_payments": unreconciled_payments,
        "unreconciled_refunds": unreconciled_refunds,
        "focus": [
            "catalog governance and reusable attribute taxonomy",
            "pricing and tax contracts",
            "payment, refund, and invoice closure",
            "settlement and reconciliation control",
            "warehouse stock and fulfillment operations",
            "returns and post-fulfillment resolution workflows",
        ],
    }


def list_categories(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_category(item) for item in commerce_repository.list_categories(db, tenant_id=tenant.id)]


def list_brands(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_brand(item) for item in commerce_repository.list_brands(db, tenant_id=tenant.id)]


def create_brand(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    normalized_code = code.strip().lower()
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported brand status '{status}'.")
    if commerce_repository.find_brand_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce brand slug '{normalized_slug}' already exists.")
    if commerce_repository.find_brand_by_code(db, tenant_id=tenant.id, code=normalized_code):
        raise ConflictError(f"Commerce brand code '{normalized_code}' already exists.")

    brand = commerce_repository.create_brand(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        code=normalized_code,
        description=description,
        status=status,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.brand.created",
        # subject_type="commerce_brand",
        # subject_id=str(brand["id"]),
        # metadata={"slug": normalized_slug, "code": normalized_code},
    # )
    db.commit()
    return _serialize_brand(brand)


def list_vendors(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_vendor(item) for item in commerce_repository.list_vendors(db, tenant_id=tenant.id)]


def create_vendor(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    code: str,
    description: str | None,
    contact_name: str | None,
    contact_email: str | None,
    contact_phone: str | None,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    normalized_code = code.strip().lower()
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported vendor status '{status}'.")
    if commerce_repository.find_vendor_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce vendor slug '{normalized_slug}' already exists.")
    if commerce_repository.find_vendor_by_code(db, tenant_id=tenant.id, code=normalized_code):
        raise ConflictError(f"Commerce vendor code '{normalized_code}' already exists.")

    vendor = commerce_repository.create_vendor(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        code=normalized_code,
        description=description,
        contact_name=contact_name,
        contact_email=contact_email,
        contact_phone=contact_phone,
        status=status,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.vendor.created",
        # subject_type="commerce_vendor",
        # subject_id=str(vendor["id"]),
        # metadata={"slug": normalized_slug, "code": normalized_code},
    # )
    db.commit()
    return _serialize_vendor(vendor)


def list_collections(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_collection(item) for item in commerce_repository.list_collections(db, tenant_id=tenant.id)]


def list_warehouses(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_warehouse(item) for item in commerce_repository.list_warehouses(db, tenant_id=tenant.id)]


def create_warehouse(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    code: str,
    city: str | None,
    country: str | None,
    status: str,
    is_default: bool,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    normalized_code = code.strip().lower()
    if status not in WAREHOUSE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported warehouse status '{status}'.")
    if commerce_repository.find_warehouse_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce warehouse slug '{normalized_slug}' already exists.")
    if commerce_repository.find_warehouse_by_code(db, tenant_id=tenant.id, code=normalized_code):
        raise ConflictError(f"Commerce warehouse code '{normalized_code}' already exists.")

    if is_default:
        for wh in commerce_repository.list_warehouses(db, tenant_id=tenant.id):
            if wh.get("is_default"):
                commerce_repository.update_warehouse(db, tenant_id=tenant.id, warehouse_id=wh["id"], data={"is_default": False})

    warehouse = commerce_repository.create_warehouse(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        code=normalized_code,
        city=city,
        country=country,
        status=status,
        is_default=is_default,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.warehouse.created",
        # subject_type="commerce_warehouse",
        # subject_id=str(warehouse["id"]),
        # metadata={"slug": normalized_slug, "code": normalized_code, "is_default": is_default},
    # )
    db.commit()
    return _serialize_warehouse(warehouse)


def list_stock_levels(
    db: Session,
    *,
    tenant_slug: str,
    warehouse_id: str | None,
    variant_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    if warehouse_id:
        _warehouse_or_raise(db, tenant_id=tenant.id, warehouse_id=warehouse_id)
    if variant_id:
        variant = commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=variant_id)
        if variant is None:
            raise NotFoundError(f"Variant '{variant_id}' was not found.")
    return [
        _serialize_warehouse_stock(item)
        for item in commerce_repository.list_warehouse_stocks(
            db,
            tenant_id=tenant.id,
            warehouse_id=warehouse_id,
            variant_id=variant_id,
        )
    ]


def list_stock_ledger(
    db: Session,
    *,
    tenant_slug: str,
    warehouse_id: str | None,
    variant_id: str | None,
) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    if warehouse_id:
        _warehouse_or_raise(db, tenant_id=tenant.id, warehouse_id=warehouse_id)
    if variant_id:
        variant = commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=variant_id)
        if variant is None:
            raise NotFoundError(f"Variant '{variant_id}' was not found.")
    return [
        _serialize_stock_ledger_entry(item)
        for item in commerce_repository.list_stock_ledger_entries(
            db,
            tenant_id=tenant.id,
            warehouse_id=warehouse_id,
            variant_id=variant_id,
        )
    ]


def adjust_stock(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    warehouse_id: str,
    variant_id: str,
    quantity_delta: int,
    notes: str | None,
    low_stock_threshold: int | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    warehouse = _warehouse_or_raise(db, tenant_id=tenant.id, warehouse_id=warehouse_id)
    if warehouse.get("status") != "active":
        raise ConflictError("Stock can only be adjusted against an active warehouse.")
    variant = commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=variant_id)
    if variant is None:
        raise NotFoundError(f"Variant '{variant_id}' was not found.")
    if quantity_delta == 0:
        raise ValidationError("Stock adjustment quantity_delta must not be zero.")

    stock = commerce_repository.get_warehouse_stock(
        db,
        tenant_id=tenant.id,
        warehouse_id=warehouse["id"],
        variant_id=variant["id"],
    )
    if stock is None:
        stock = commerce_repository.create_warehouse_stock(
            db,
            tenant_id=tenant.id,
            warehouse_id=warehouse["id"],
            variant_id=variant["id"],
            on_hand_quantity=0,
            reserved_quantity=0,
            low_stock_threshold=low_stock_threshold or 0,
        )
    low_stock_val = low_stock_threshold if low_stock_threshold is not None else stock.get("low_stock_threshold", 0)
    
    current_on_hand = stock.get("on_hand_quantity", 0)
    current_reserved = stock.get("reserved_quantity", 0)
    next_on_hand = current_on_hand + quantity_delta

    if next_on_hand < 0:
        raise ConflictError("Stock adjustment would result in negative on-hand inventory.")
    if next_on_hand < current_reserved:
        raise ConflictError("Stock adjustment would reduce on-hand inventory below reserved stock.")

    stock = commerce_repository.update_warehouse_stock(
        db,
        tenant_id=tenant.id,
        stock_id=stock["id"],
        data={
            "on_hand_quantity": next_on_hand,
            "low_stock_threshold": low_stock_val,
        }
    )
    entry_type = "restock" if quantity_delta > 0 else "adjustment"
    commerce_repository.create_stock_ledger_entry(
        db,
        tenant_id=tenant.id,
        warehouse_id=warehouse["id"],
        variant_id=variant["id"],
        entry_type=entry_type,
        quantity_delta=quantity_delta,
        balance_after=next_on_hand,
        reserved_after=current_reserved,
        reference_type="manual_adjustment",
        reference_id=warehouse["id"],
        notes=notes,
        recorded_by_user_id=actor_user_id,
    )
    _sync_variant_inventory_from_stocks(db, tenant_id=tenant.id, variant_ids=[variant["id"]])
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.stock.adjusted",
        # subject_type="commerce_warehouse_stock",
        # subject_id=str(stock["id"]),
        # metadata={
            # "warehouse_id": str(warehouse["id"]),
            # "variant_id": str(variant["id"]),
            # "quantity_delta": quantity_delta,
            # "on_hand_quantity": stock["on_hand_quantity"],
            # "reserved_quantity": stock["reserved_quantity"],
        # },
    # )
    db.commit()
    return _serialize_warehouse_stock(stock)


def create_collection(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    description: str | None,
    status: str,
    sort_order: int,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported collection status '{status}'.")
    if commerce_repository.find_collection_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce collection slug '{normalized_slug}' already exists.")

    collection = commerce_repository.create_collection(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        description=description,
        status=status,
        sort_order=sort_order,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.collection.created",
        # subject_type="commerce_collection",
        # subject_id=str(collection["id"]),
        # metadata={"slug": normalized_slug, "sort_order": sort_order},
    # )
    db.commit()
    return _serialize_collection(collection)


def list_tax_profiles(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_tax_profile(item) for item in commerce_repository.list_tax_profiles(db, tenant_id=tenant.id)]


def create_tax_profile(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    code: str,
    description: str | None,
    prices_include_tax: bool,
    rules: list[dict[str, object]],
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_code = code.strip().lower()
    normalized_rules = _normalize_tax_rules(rules)
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported tax profile status '{status}'.")
    if commerce_repository.find_tax_profile_by_code(db, tenant_id=tenant.id, code=normalized_code):
        raise ConflictError(f"Commerce tax profile code '{normalized_code}' already exists.")

    tax_profile = commerce_repository.create_tax_profile(
        db,
        tenant_id=tenant.id,
        name=name,
        code=normalized_code,
        description=description,
        prices_include_tax=prices_include_tax,
        rules_json=normalized_rules,
        status=status,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.tax_profile.created",
        # subject_type="commerce_tax_profile",
        # subject_id=str(tax_profile["id"]),
        # metadata={"code": normalized_code, "rule_count": len(normalized_rules)},
    # )
    db.commit()
    return _serialize_tax_profile(tax_profile)


def list_price_lists(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    price_lists = commerce_repository.list_price_lists(db, tenant_id=tenant.id)
    items_by_price_list: dict[str, list[dict[str, object]]] = defaultdict(list)
    for price_list in price_lists:
        items = commerce_repository.list_price_list_items(db, tenant_id=tenant.id, price_list_id=price_list["id"])
        items_by_price_list[price_list["id"]] = [_serialize_price_list_item(item) for item in items]
    return [_serialize_price_list(item, items_by_price_list) for item in price_lists]


def create_price_list(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    currency: str,
    customer_segment: str | None,
    description: str | None,
    status: str,
    items: list[dict[str, object]],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    normalized_currency = currency.strip().upper()
    normalized_customer_segment = customer_segment.strip().lower() if customer_segment else None
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported price list status '{status}'.")
    if commerce_repository.find_price_list_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce price list slug '{normalized_slug}' already exists.")

    deduped_variant_ids = _dedupe_strings([str(item["variant_id"]) for item in items])
    if len(deduped_variant_ids) != len(items):
        raise ValidationError("Price list items cannot repeat the same variant.")
    variants = [commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=variant_id) for variant_id in deduped_variant_ids]
    variant_lookup = {variant["id"]: variant for variant in variants if variant is not None}
    missing_variant_ids = [variant_id for variant_id in deduped_variant_ids if variant_id not in variant_lookup]
    if missing_variant_ids:
        raise NotFoundError(f"Variant(s) not found: {', '.join(missing_variant_ids)}.")
    for variant in variant_lookup.values():
        if variant.get("currency") != normalized_currency:
            raise ValidationError("Price list currency must match the linked variant currency.")

    price_list = commerce_repository.create_price_list(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        currency=normalized_currency,
        customer_segment=normalized_customer_segment,
        description=description,
        status=status,
    )
    created_items = []
    for item in items:
        price_minor = int(item["price_minor"])
        if price_minor < 0:
            raise ValidationError("Price list item price_minor must be non-negative.")
        created_items.append(
            commerce_repository.create_price_list_item(
                db,
                tenant_id=tenant.id,
                price_list_id=price_list["id"],
                variant_id=str(item["variant_id"]),
                price_minor=price_minor,
            )
        )

    # _audit(
        # db,
        # tenant_id=tenant.id,
        # actor_user_id=actor_user_id,
        # action="commerce.price_list.created",
        # subject_type="commerce_price_list",
        # subject_id=price_list["id"],
        # metadata={"slug": normalized_slug, "item_count": len(created_items), "currency": normalized_currency},
    # )
    db.commit()
    return _serialize_price_list(
        price_list,
        {price_list["id"]: [_serialize_price_list_item(item) for item in created_items]},
    )


def list_coupons(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [_serialize_coupon(item) for item in commerce_repository.list_coupons(db, tenant_id=tenant.id)]


def create_coupon(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    code: str,
    description: str | None,
    discount_type: str,
    discount_value: int,
    minimum_subtotal_minor: int,
    maximum_discount_minor: int | None,
    applicable_category_ids: list[str],
    applicable_variant_ids: list[str],
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_code = code.strip().upper()
    if discount_type not in COUPON_DISCOUNT_TYPES:
        raise ValidationError(f"Unsupported coupon discount type '{discount_type}'.")
    if discount_value < 0:
        raise ValidationError("Coupon discount_value must be non-negative.")
    if discount_type == "percent" and discount_value > 10000:
        raise ValidationError("Percent coupons use basis points and cannot exceed 10000.")
    if minimum_subtotal_minor < 0:
        raise ValidationError("Coupon minimum_subtotal_minor must be non-negative.")
    if maximum_discount_minor is not None and maximum_discount_minor < 0:
        raise ValidationError("Coupon maximum_discount_minor must be non-negative when provided.")
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported coupon status '{status}'.")
    if commerce_repository.find_coupon_by_code(db, tenant_id=tenant.id, code=normalized_code):
        raise ConflictError(f"Commerce coupon code '{normalized_code}' already exists.")

    deduped_category_ids = _dedupe_strings(applicable_category_ids)
    deduped_variant_ids = _dedupe_strings(applicable_variant_ids)
    for category_id in deduped_category_ids:
        category = commerce_repository.get_category(db, tenant_id=tenant.id, category_id=category_id)
        if category is None:
            raise NotFoundError(f"Category '{category_id}' was not found.")
    for variant_id in deduped_variant_ids:
        variant = commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=variant_id)
        if variant is None:
            raise NotFoundError(f"Variant '{variant_id}' was not found.")

    coupon = commerce_repository.create_coupon(
        db,
        tenant_id=tenant.id,
        code=normalized_code,
        description=description,
        discount_type=discount_type,
        discount_value=discount_value,
        minimum_subtotal_minor=minimum_subtotal_minor,
        maximum_discount_minor=maximum_discount_minor,
        applicable_category_ids=deduped_category_ids,
        applicable_variant_ids=deduped_variant_ids,
        status=status,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.coupon.created",
        # subject_type="commerce_coupon",
        # subject_id=str(coupon["id"]),
        # metadata={
            # "code": normalized_code,
            # "discount_type": discount_type,
            # "category_scope_count": len(deduped_category_ids),
            # "variant_scope_count": len(deduped_variant_ids),
        # },
    # )
    db.commit()
    return _serialize_coupon(coupon)


def create_category(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    description: str | None,
    parent_category_id: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    if commerce_repository.find_category_by_slug(db, tenant_id=tenant.id, slug=slug):
        raise ConflictError(f"Commerce category slug '{slug}' already exists.")
    if parent_category_id:
        parent = commerce_repository.get_category(db, tenant_id=tenant.id, category_id=parent_category_id)
        if parent is None:
            raise NotFoundError(f"Parent category '{parent_category_id}' was not found.")

    category = commerce_repository.create_category(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=slug,
        description=description,
        parent_category_id=parent_category_id,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.category.created",
        # subject_type="commerce_category",
        # subject_id=str(category["id"]),
        # metadata={"slug": slug},
    # )
    db.commit()
    return _serialize_category(category)


def list_attribute_sets(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_attribute_set(item)
        for item in commerce_repository.list_attribute_sets(db, tenant_id=tenant.id)
    ]


def create_attribute_set(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    name: str,
    slug: str,
    description: str | None,
    attribute_ids: list[str],
    vertical_bindings: list[str],
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    if status not in ATTRIBUTE_ACTIVE_STATUSES:
        raise ValidationError(f"Unsupported attribute set status '{status}'.")
    if commerce_repository.find_attribute_set_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce attribute set slug '{normalized_slug}' already exists.")

    deduped_attribute_ids = _dedupe_strings(attribute_ids)
    attributes = commerce_repository.list_attributes_by_ids(
        db,
        tenant_id=tenant.id,
        attribute_ids=deduped_attribute_ids,
    )
    attribute_lookup = {attribute["id"]: attribute for attribute in attributes}
    missing_attribute_ids = [attribute_id for attribute_id in deduped_attribute_ids if attribute_id not in attribute_lookup]
    if missing_attribute_ids:
        raise NotFoundError(f"Attribute(s) not found: {', '.join(missing_attribute_ids)}.")

    attribute_set = commerce_repository.create_attribute_set(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        description=description,
        attribute_ids=deduped_attribute_ids,
        vertical_bindings=_dedupe_strings(vertical_bindings, default=["commerce"]),
        status=status,
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.attribute_set.created",
        # subject_type="commerce_attribute_set",
        # subject_id=str(attribute_set["id"]),
        # metadata={"slug": normalized_slug, "attribute_count": len(deduped_attribute_ids)},
    # )
    db.commit()
    return _serialize_attribute_set(attribute_set)


def list_products(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    products = commerce_repository.list_products(db, tenant_id=tenant.id)
    variants = commerce_repository.list_variants_for_products(
        db,
        tenant_id=tenant.id,
        product_ids=[product["id"] for product in products],
    )
    variants_by_product: dict[str, list[dict[str, object]]] = defaultdict(list)
    for variant in variants:
        variants_by_product[variant["product_id"]].append(
            _serialize_variant(variant, {})
        )

    return [
        _serialize_product(item, variants_by_product, {})
        for item in products
    ]


def create_product(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
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
    product_attributes: list[dict[str, object]],
    variants: list[dict[str, object]],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_slug = slug.strip().lower()
    if commerce_repository.find_product_by_slug(db, tenant_id=tenant.id, slug=normalized_slug):
        raise ConflictError(f"Commerce product slug '{normalized_slug}' already exists.")

    for category_id in category_ids:
        category = commerce_repository.get_category(db, tenant_id=tenant.id, category_id=category_id)
        if category is None:
            raise NotFoundError(f"Category '{category_id}' was not found.")

    brand = None
    if brand_id:
        brand = commerce_repository.get_brand(db, tenant_id=tenant.id, brand_id=brand_id)
        if brand is None:
            raise NotFoundError(f"Brand '{brand_id}' was not found.")

    vendor = None
    if vendor_id:
        vendor = commerce_repository.get_vendor(db, tenant_id=tenant.id, vendor_id=vendor_id)
        if vendor is None:
            raise NotFoundError(f"Vendor '{vendor_id}' was not found.")

    deduped_collection_ids = _dedupe_strings(collection_ids)
    collections = commerce_repository.list_collections_by_ids(
        db,
        tenant_id=tenant.id,
        collection_ids=deduped_collection_ids,
    )
    collection_lookup = {collection["id"]: collection for collection in collections}
    missing_collection_ids = [
        collection_id for collection_id in deduped_collection_ids if collection_id not in collection_lookup
    ]
    if missing_collection_ids:
        raise NotFoundError(f"Collection(s) not found: {', '.join(missing_collection_ids)}.")

    for variant in variants:
        if commerce_repository.find_variant_by_sku(db, tenant_id=tenant.id, sku=str(variant["sku"])):
            raise ConflictError(f"Commerce variant SKU '{variant['sku']}' already exists.")



    attribute_set = None
    if attribute_set_id:
        attribute_set = commerce_repository.get_attribute_set(
            db,
            tenant_id=tenant.id,
            attribute_set_id=attribute_set_id,
        )
        if attribute_set is None:
            raise NotFoundError(f"Attribute set '{attribute_set_id}' was not found.")

    product = commerce_repository.create_product(
        db,
        tenant_id=tenant.id,
        name=name,
        slug=normalized_slug,
        description=description,
        brand_id=brand["id"] if brand is not None else None,
        vendor_id=vendor["id"] if vendor is not None else None,
        collection_ids=deduped_collection_ids,
        attribute_set_id=attribute_set["id"] if attribute_set is not None else None,
        category_ids=category_ids,
        seo_title=seo_title,
        seo_description=seo_description,
        status=status,
    )

    created_variants = []
    for variant_payload in variants:
        variant = commerce_repository.create_variant(
            db,
            tenant_id=tenant.id,
            product_id=product["id"],
            sku=str(variant_payload["sku"]),
            label=str(variant_payload["label"]),
            price_minor=int(variant_payload["price_minor"]),
            currency=str(variant_payload["currency"]),
            inventory_quantity=int(variant_payload["inventory_quantity"]),
        )
        created_variants.append(variant)

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.product.created",
        # subject_type="commerce_product",
        # subject_id=str(product["id"]),
        # metadata={
            # "slug": normalized_slug,
            # "variant_count": len(created_variants),
            # "attribute_set_id": str(product.get("attribute_set_id")) if product.get("attribute_set_id") else None,
            # "product_attribute_count": len(created_product_attribute_values),
            # "brand_id": str(product.get("brand_id")) if product.get("brand_id") else None,
            # "vendor_id": str(product.get("vendor_id")) if product.get("vendor_id") else None,
            # "collection_count": len(product.get("collection_ids", [])),
        # },
    # )
    db.commit()

    return _serialize_product(product, {product["id"]: [_serialize_variant(v, {}) for v in created_variants]}, {})


def list_orders(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    orders = commerce_repository.list_orders(db, tenant_id=tenant.id)
    lines = commerce_repository.list_order_lines_for_orders(
        db,
        tenant_id=tenant.id,
        order_ids=[order["id"] for order in orders],
    )
    lines_by_order: dict[str, list[dict[str, object]]] = defaultdict(list)
    for line in lines:
        lines_by_order[line["order_id"]].append(_serialize_order_line(line))
    return [_serialize_order(order, lines_by_order) for order in orders]


def list_fulfillments(db: Session, *, tenant_slug: str, order_id: str | None) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    fulfillments = commerce_repository.list_fulfillments(db, tenant_id=tenant.id, order_id=order_id)
    fulfillment_lines = commerce_repository.list_fulfillment_lines(
        db,
        tenant_id=tenant.id,
        fulfillment_ids=[fulfillment["id"] for fulfillment in fulfillments],
    )
    lines_by_fulfillment: dict[str, list[dict[str, object]]] = defaultdict(list)
    for line in fulfillment_lines:
        lines_by_fulfillment[line["fulfillment_id"]].append(_serialize_fulfillment_line(line))
    return [_serialize_fulfillment(item, lines_by_fulfillment) for item in fulfillments]


def list_shipments(db: Session, *, tenant_slug: str, fulfillment_id: str | None) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    if fulfillment_id:
        _fulfillment_or_raise(db, tenant_id=tenant.id, fulfillment_id=fulfillment_id)
    return [
        _serialize_shipment(item)
        for item in commerce_repository.list_shipments(
            db,
            tenant_id=tenant.id,
            fulfillment_id=fulfillment_id,
        )
    ]


def list_payments(db: Session, *, tenant_slug: str, order_id: str | None) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_payment(item)
        for item in commerce_repository.list_payments(db, tenant_id=tenant.id, order_id=order_id)
    ]


def list_refunds(db: Session, *, tenant_slug: str, order_id: str | None) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_refund(item)
        for item in commerce_repository.list_refunds(db, tenant_id=tenant.id, order_id=order_id)
    ]


def list_invoices(db: Session, *, tenant_slug: str, order_id: str | None) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    return [
        _serialize_invoice(item)
        for item in commerce_repository.list_invoices(db, tenant_id=tenant.id, order_id=order_id)
    ]


def list_settlements(db: Session, *, tenant_slug: str) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    settlements = commerce_repository.list_settlements(db, tenant_id=tenant.id)
    settlement_entries = commerce_repository.list_settlement_entries(
        db,
        tenant_id=tenant.id,
        settlement_ids=[item["id"] for item in settlements],
    )
    payment_lookup = {
        item["id"]: item
        for item in commerce_repository.list_payments(db, tenant_id=tenant.id)
    }
    refund_lookup = {
        item["id"]: item
        for item in commerce_repository.list_refunds(db, tenant_id=tenant.id)
    }
    entries_by_settlement: dict[str, list[dict[str, object]]] = defaultdict(list)
    for entry in settlement_entries:
        entries_by_settlement[entry["settlement_id"]].append(
            _serialize_settlement_entry(
                entry,
                payment=payment_lookup.get(entry["payment_id"]) if entry.get("payment_id") else None,
                refund=refund_lookup.get(entry["refund_id"]) if entry.get("refund_id") else None,
            )
        )
    return [_serialize_settlement(item, entries_by_settlement) for item in settlements]


def get_settlement_detail(db: Session, *, tenant_slug: str, settlement_id: str) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    settlement = _settlement_or_raise(db, tenant_id=tenant.id, settlement_id=settlement_id)
    entries = commerce_repository.list_settlement_entries(
        db,
        tenant_id=tenant.id,
        settlement_ids=[settlement["id"]],
    )
    payment_ids = [item.get("payment_id") for item in entries if item.get("payment_id")]
    refund_ids = [item.get("refund_id") for item in entries if item.get("refund_id")]
    payment_lookup = {
        item["id"]: item
        for item in commerce_repository.list_payments(db, tenant_id=tenant.id)
        if item["id"] in payment_ids
    }
    refund_lookup = {
        item["id"]: item
        for item in commerce_repository.list_refunds(db, tenant_id=tenant.id)
        if item["id"] in refund_ids
    }
    return _serialize_settlement(
        settlement,
        {
            settlement["id"]: [
                _serialize_settlement_entry(
                    entry,
                    payment=payment_lookup.get(entry.get("payment_id")) if entry.get("payment_id") else None,
                    refund=refund_lookup.get(entry.get("refund_id")) if entry.get("refund_id") else None,
                )
                for entry in entries
            ]
        },
    )


def list_returns(db: Session, *, tenant_slug: str, order_id: str | None) -> list[dict[str, object]]:
    tenant = _tenant(db, tenant_slug)
    if order_id:
        _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    return_requests = commerce_repository.list_returns(db, tenant_id=tenant.id, order_id=order_id)
    return_lines = commerce_repository.list_return_lines(
        db,
        tenant_id=tenant.id,
        return_ids=[item["id"] for item in return_requests],
    )
    lines_by_return: dict[str, list[dict[str, object]]] = defaultdict(list)
    for line in return_lines:
        lines_by_return[line["return_id"]].append(_serialize_return_line(line))
    return [_serialize_return(item, lines_by_return) for item in return_requests]


def get_return_detail(db: Session, *, tenant_slug: str, return_id: str) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    return_request = _return_or_raise(db, tenant_id=tenant.id, return_id=return_id)
    return_lines = commerce_repository.list_return_lines(
        db,
        tenant_id=tenant.id,
        return_ids=[return_request["id"]],
    )
    return _serialize_return(
        return_request,
        {return_request["id"]: [_serialize_return_line(line) for line in return_lines]},
    )


def get_order_finance_detail(db: Session, *, tenant_slug: str, order_id: str) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    _recalculate_order_finance(db, order)
    # db.flush() # Mongo is explicit
    lines = commerce_repository.list_order_lines_for_orders(db, tenant_id=tenant.id, order_ids=[order["id"]])
    payments = commerce_repository.list_payments(db, tenant_id=tenant.id, order_id=order["id"])
    refunds = commerce_repository.list_refunds(db, tenant_id=tenant.id, order_id=order["id"])
    invoices = commerce_repository.list_invoices(db, tenant_id=tenant.id, order_id=order["id"])
    return_requests = commerce_repository.list_returns(db, tenant_id=tenant.id, order_id=order["id"])
    return_lines = commerce_repository.list_return_lines(
        db,
        tenant_id=tenant.id,
        return_ids=[item["id"] for item in return_requests],
    )
    serialized_returns_by_id: dict[str, list[dict[str, object]]] = defaultdict(list)
    for line in return_lines:
        serialized_returns_by_id[line["return_id"]].append(_serialize_return_line(line))
    return _serialize_order(
        order,
        {order["id"]: [_serialize_order_line(line) for line in lines]},
        payments=payments,
        refunds=refunds,
        invoices=invoices,
        returns=[_serialize_return(item, serialized_returns_by_id) for item in return_requests],
    )


def _reserve_inventory(db: Session, *, tenant_id: str, variants: list, quantities: dict[str, int]) -> None:
    for variant in variants:
        requested = quantities.get(variant["id"], 0)
        if variant.get("inventory_quantity", 0) < requested:
            raise ConflictError(f"Insufficient inventory for SKU '{variant['sku']}'.")
    for variant in variants:
        new_qty = variant.get("inventory_quantity", 0) - quantities.get(variant["id"], 0)
        commerce_repository.update_variant(db, tenant_id=tenant_id, variant_id=variant["id"], data={"inventory_quantity": new_qty})


def _restore_inventory(db: Session, *, tenant_id: str, variants: list, quantities: dict[str, int]) -> None:
    for variant in variants:
        new_qty = variant.get("inventory_quantity", 0) + quantities.get(variant["id"], 0)
        commerce_repository.update_variant(db, tenant_id=tenant_id, variant_id=variant["id"], data={"inventory_quantity": new_qty})


def _reserve_order_lines_against_warehouses(
    db: Session,
    *,
    tenant_id: str,
    order,
    order_lines: list,
    actor_user_id: str,
) -> None:
    variant_ids = [line["variant_id"] for line in order_lines]
    quantities = {line["variant_id"]: line.get("quantity", 0) - line.get("fulfilled_quantity", 0) for line in order_lines}
    allocations = _allocate_warehouse_stocks(db, tenant_id=tenant_id, variant_ids=variant_ids, quantities=quantities)
    for line in order_lines:
        variant_id = line["variant_id"]
        stock = allocations[variant_id]
        new_res = stock.get("reserved_quantity", 0) + quantities[variant_id]
        
        commerce_repository.update_warehouse_stock(db, tenant_id=tenant_id, stock_id=stock["id"], data={"reserved_quantity": new_res})
        commerce_repository.update_order_line(db, tenant_id=tenant_id, line_id=line["id"], data={"allocated_warehouse_id": stock["warehouse_id"]})

        commerce_repository.create_stock_ledger_entry(
            db,
            tenant_id=str(tenant_id),
            warehouse_id=str(stock["warehouse_id"]),
            variant_id=str(variant_id),
            entry_type="reservation",
            quantity_delta=0,
            balance_after=stock.get("on_hand_quantity", 0),
            reserved_after=new_res,
            reference_type="commerce_order",
            reference_id=str(order["id"]),
            notes=f"Reserved stock for order {order['id']}.",
            recorded_by_user_id=str(actor_user_id),
        )
    _sync_variant_inventory_from_stocks(db, tenant_id=tenant_id, variant_ids=variant_ids)


def _release_order_lines_from_warehouses(
    db: Session,
    *,
    tenant_id: str,
    order,
    order_lines: list,
    actor_user_id: str,
) -> None:
    touched_variant_ids: list[str] = []
    for line in order_lines:
        outstanding_quantity = max(line.get("quantity", 0) - line.get("fulfilled_quantity", 0), 0)
        allocated_wh_id = line.get("allocated_warehouse_id")
        if outstanding_quantity <= 0 or not allocated_wh_id:
            continue
        stock = commerce_repository.get_warehouse_stock(
            db,
            tenant_id=tenant_id,
            warehouse_id=allocated_wh_id,
            variant_id=line["variant_id"],
        )
        if stock is None:
            raise ConflictError("Allocated warehouse stock record is missing for order line release.")
        current_res = stock.get("reserved_quantity", 0)
        if current_res < outstanding_quantity:
            raise ConflictError("Warehouse reserved stock is lower than the order release quantity.")
        
        new_res = current_res - outstanding_quantity
        commerce_repository.update_warehouse_stock(db, tenant_id=tenant_id, stock_id=stock["id"], data={"reserved_quantity": new_res})

        commerce_repository.create_stock_ledger_entry(
            db,
            tenant_id=str(tenant_id),
            warehouse_id=str(allocated_wh_id),
            variant_id=str(line["variant_id"]),
            entry_type="release",
            quantity_delta=0,
            balance_after=stock.get("on_hand_quantity", 0),
            reserved_after=new_res,
            reference_type="commerce_order",
            reference_id=str(order["id"]),
            notes=f"Released reserved stock for cancelled order {order['id']}.",
            recorded_by_user_id=str(actor_user_id),
        )
        touched_variant_ids.append(line["variant_id"])
    _sync_variant_inventory_from_stocks(db, tenant_id=tenant_id, variant_ids=touched_variant_ids)


def _mark_order_fulfillment_state(db: Session, *, tenant_id: str, order_lines: list, order) -> None:
    if order_lines and all(line.get("fulfilled_quantity", 0) >= line.get("quantity", 0) for line in order_lines):
        commerce_repository.update_order(db, tenant_id=tenant_id, order_id=order["id"], data={"status": "fulfilled"})


def _delivered_quantities_by_order_line(db: Session, *, tenant_id: str, order_id: str) -> dict[str, int]:
    fulfillments = commerce_repository.list_fulfillments(db, tenant_id=tenant_id, order_id=order_id)
    delivered_fulfillment_ids = [item["id"] for item in fulfillments if item.get("status") == "delivered"]
    delivered_quantities: dict[str, int] = defaultdict(int)
    if not delivered_fulfillment_ids:
        return delivered_quantities
    fulfillment_lines = commerce_repository.list_fulfillment_lines(
        db,
        tenant_id=tenant_id,
        fulfillment_ids=delivered_fulfillment_ids,
    )
    for line in fulfillment_lines:
        delivered_quantities[line["order_line_id"]] += line.get("quantity", 0)
    return delivered_quantities


def _active_return_quantities_by_order_line(
    db: Session,
    *,
    tenant_id: str,
    order_id: str,
    exclude_return_id: str | None = None,
) -> dict[str, int]:
    return_requests = commerce_repository.list_returns(db, tenant_id=tenant_id, order_id=order_id)
    active_returns = [
        item
        for item in return_requests
        if item.get("status") not in {"rejected", "cancelled"} and item["id"] != exclude_return_id
    ]
    active_return_ids = [item["id"] for item in active_returns]
    returned_quantities: dict[str, int] = defaultdict(int)
    if not active_return_ids:
        return returned_quantities
    return_lines = commerce_repository.list_return_lines(
        db,
        tenant_id=tenant_id,
        return_ids=active_return_ids,
    )
    for line in return_lines:
        returned_quantities[line["order_line_id"]] += line.get("quantity", 0)
    return returned_quantities


def _resolve_restock_warehouse_for_line(db: Session, *, tenant_id: str, order_line):
    allocated_wh_id = order_line.get("allocated_warehouse_id")
    if allocated_wh_id:
        warehouse = commerce_repository.get_warehouse(
            db,
            tenant_id=tenant_id,
            warehouse_id=allocated_wh_id,
        )
        if warehouse is not None and warehouse.get("status") == "active":
            return warehouse

    active_default_warehouse = next(
        (
            item
            for item in commerce_repository.list_warehouses(db, tenant_id=tenant_id)
            if item.get("is_default") and item.get("status") == "active"
        ),
        None,
    )
    if active_default_warehouse is not None:
        return active_default_warehouse
    raise ConflictError("No active warehouse is available to receive returned stock.")


def _restock_return_inventory(
    db: Session,
    *,
    tenant_id: str,
    return_request,
    return_lines: list,
    order_line_lookup: dict[str, Any],
    actor_user_id: str,
) -> None:
    touched_variant_ids: list[str] = []
    for line in return_lines:
        if not line.get("restock_on_receive"):
            continue
        order_line = order_line_lookup.get(line["order_line_id"])
        if order_line is None:
            raise ConflictError("Return line references an order line that no longer exists.")
        warehouse = _resolve_restock_warehouse_for_line(db, tenant_id=tenant_id, order_line=order_line)
        stock = commerce_repository.get_warehouse_stock(
            db,
            tenant_id=tenant_id,
            warehouse_id=warehouse["id"],
            variant_id=line["variant_id"],
        )
        if stock is None:
            stock = commerce_repository.create_warehouse_stock(
                db,
                tenant_id=tenant_id,
                warehouse_id=warehouse["id"],
                variant_id=line["variant_id"],
                on_hand_quantity=0,
                reserved_quantity=0,
                low_stock_threshold=0,
            )
        
        current_on_hand = stock.get("on_hand_quantity", 0)
        current_reserved = stock.get("reserved_quantity", 0)
        new_on_hand = current_on_hand + line.get("quantity", 0)
        
        commerce_repository.update_warehouse_stock(db, tenant_id=tenant_id, stock_id=stock["id"], data={"on_hand_quantity": new_on_hand})

        commerce_repository.create_stock_ledger_entry(
            db,
            tenant_id=str(tenant_id),
            warehouse_id=str(warehouse["id"]),
            variant_id=str(line["variant_id"]),
            entry_type="restock",
            quantity_delta=line.get("quantity", 0),
            balance_after=new_on_hand,
            reserved_after=current_reserved,
            reference_type="commerce_return",
            reference_id=str(return_request["id"]),
            notes=f"Restocked inventory from return {return_request.get('return_number')}.",
            recorded_by_user_id=str(actor_user_id),
        )
        touched_variant_ids.append(line["variant_id"])
    _sync_variant_inventory_from_stocks(db, tenant_id=tenant_id, variant_ids=touched_variant_ids)


def create_order(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    customer_id: str,
    price_list_id: str | None,
    tax_profile_id: str | None,
    coupon_code: str | None,
    status: str,
    currency: str,
    lines: list[dict[str, int | str]],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_currency = currency.strip().upper()
    variant_models_by_id: dict[str, Any] = {}
    product_models_by_id: dict[str, Any] = {}
    line_payloads: list[tuple[Any, int]] = []
    quantities: dict[str, int] = {}
    subtotal_minor = 0

    price_list = None
    if price_list_id:
        price_list = commerce_repository.get_price_list(db, tenant_id=tenant.id, price_list_id=price_list_id)
        if price_list is None:
            raise NotFoundError(f"Price list '{price_list_id}' was not found.")
        if price_list.get("status") != "active":
            raise ValidationError("Only active price lists can be used for order pricing.")
        if price_list.get("currency") != normalized_currency:
            raise ValidationError("Order currency must match the selected price list currency.")

    tax_profile = None
    if tax_profile_id:
        tax_profile = commerce_repository.get_tax_profile(db, tenant_id=tenant.id, tax_profile_id=tax_profile_id)
        if tax_profile is None:
            raise NotFoundError(f"Tax profile '{tax_profile_id}' was not found.")
        if tax_profile.get("status") != "active":
            raise ValidationError("Only active tax profiles can be used for order pricing.")

    coupon = None
    normalized_coupon_code = coupon_code.strip().upper() if coupon_code else None
    if normalized_coupon_code:
        coupon = commerce_repository.find_coupon_by_code(db, tenant_id=tenant.id, code=normalized_coupon_code)
        if coupon is None:
            raise NotFoundError(f"Coupon '{normalized_coupon_code}' was not found.")
        if coupon.get("status") != "active":
            raise ValidationError("Only active coupons can be applied to orders.")

    for line in lines:
        variant = commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=str(line["variant_id"]))
        if variant is None:
            raise NotFoundError(f"Variant '{line['variant_id']}' was not found.")
        if variant.get("currency") != normalized_currency:
            raise ValidationError("Order currency must match the selected variant currency.")
        quantity = int(line["quantity"])
        if quantity <= 0:
            raise ConflictError("Order quantities must be positive.")
        product = commerce_repository.get_product(db, tenant_id=tenant.id, product_id=variant["product_id"])
        if product is None:
            raise NotFoundError(f"Product '{variant['product_id']}' was not found for variant '{variant['id']}'.")
        variant_models_by_id[variant["id"]] = variant
        product_models_by_id[product["id"]] = product
        quantities[variant["id"]] = quantities.get(variant["id"], 0) + quantity
        line_payloads.append((variant, quantity))

    price_list_item_lookup: dict[str, Any] = {}
    if price_list:
        price_list_items = commerce_repository.list_price_list_items_for_variants(
            db,
            tenant_id=tenant.id,
            price_list_id=price_list["id"],
            variant_ids=list(variant_models_by_id.keys()),
        )
        price_list_item_lookup = {item["variant_id"]: item for item in price_list_items}

    priced_line_payloads: list[tuple[Any, Any, int, int, int]] = []
    for variant, quantity in line_payloads:
        product = product_models_by_id[variant["product_id"]]
        if variant["id"] in price_list_item_lookup:
            unit_price_minor = price_list_item_lookup[variant["id"]].get("price_minor", 0)
        else:
            unit_price_minor = variant.get("price_minor", 0)
        line_total_minor = unit_price_minor * quantity
        priced_line_payloads.append((product, variant, quantity, unit_price_minor, line_total_minor))
        subtotal_minor += line_total_minor

    discount_minor = 0
    if coupon:
        if subtotal_minor < coupon.get("minimum_subtotal_minor", 0):
            raise ValidationError("Order subtotal does not meet the coupon minimum.")
        eligible_subtotal_minor = 0
        category_scope = set(coupon.get("applicable_category_ids") or [])
        variant_scope = set(coupon.get("applicable_variant_ids") or [])
        for product, variant, _quantity, _unit_price_minor, line_total_minor in priced_line_payloads:
            category_match = bool(category_scope.intersection(product.get("category_ids", [])))
            variant_match = variant["id"] in variant_scope
            if not category_scope and not variant_scope:
                eligible_subtotal_minor += line_total_minor
            elif category_match or variant_match:
                eligible_subtotal_minor += line_total_minor
        if eligible_subtotal_minor <= 0:
            raise ValidationError("Coupon does not apply to the selected order lines.")
        if coupon.get("discount_type") == "fixed":
            discount_minor = min(coupon.get("discount_value", 0), eligible_subtotal_minor)
        else:
            discount_minor = (eligible_subtotal_minor * coupon.get("discount_value", 0)) // 10000
        if coupon.get("maximum_discount_minor") is not None:
            discount_minor = min(discount_minor, coupon["maximum_discount_minor"])
        discount_minor = min(discount_minor, subtotal_minor)

    taxable_minor = max(subtotal_minor - discount_minor, 0)
    tax_minor = 0
    total_minor = taxable_minor
    if tax_profile:
        total_tax_basis_points = _total_tax_basis_points(tax_profile)
        if tax_profile.get("prices_include_tax"):
            denominator = 10000 + total_tax_basis_points
            tax_minor = (taxable_minor * total_tax_basis_points) // denominator if denominator else 0
            total_minor = taxable_minor
        else:
            tax_minor = (taxable_minor * total_tax_basis_points) // 10000
            total_minor = taxable_minor + tax_minor

    variant_models = list(variant_models_by_id.values())
    inventory_reserved = status in {"placed", "paid", "fulfilled"}
    placed_at = datetime.now(tz=UTC).isoformat() if status in {"placed", "paid", "fulfilled"} else None
    order = commerce_repository.create_order(
        db,
        tenant_id=tenant.id,
        customer_id=customer_id,
        price_list_id=price_list["id"] if price_list is not None else None,
        tax_profile_id=tax_profile["id"] if tax_profile is not None else None,
        coupon_code=normalized_coupon_code,
        status=status,
        currency=normalized_currency,
        subtotal_minor=subtotal_minor,
        discount_minor=discount_minor,
        tax_minor=tax_minor,
        total_minor=total_minor,
        payment_status="pending",
        paid_minor=0,
        refunded_minor=0,
        balance_minor=total_minor,
        invoice_number=None,
        invoice_issued_at=None,
        inventory_reserved=inventory_reserved,
        placed_at=placed_at,
    )

    created_lines = []
    for _product, variant, quantity, unit_price_minor, line_total_minor in priced_line_payloads:
        line = commerce_repository.create_order_line(
            db,
            order_id=order["id"],
            tenant_id=tenant.id,
            product_id=variant["product_id"],
            variant_id=variant["id"],
            allocated_warehouse_id=None,
            quantity=quantity,
            fulfilled_quantity=0,
            unit_price_minor=unit_price_minor,
            line_total_minor=line_total_minor,
        )
        created_lines.append(line)

    if inventory_reserved:
        warehouse_stocks = commerce_repository.list_warehouse_stocks_for_variants(
            db,
            tenant_id=tenant.id,
            variant_ids=list(variant_models_by_id.keys()),
        )
        if warehouse_stocks:
            _reserve_order_lines_against_warehouses(
                db,
                tenant_id=tenant.id,
                order=order,
                order_lines=created_lines,
                actor_user_id=actor_user_id,
            )
        else:
            _reserve_inventory(db, tenant_id=tenant.id, variants=variant_models, quantities=quantities)

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.order.created",
        # subject_type="commerce_order",
        # subject_id=str(order["id"]),
        # metadata={
            # "customer_id": str(customer_id),
            # "status": status,
            # "subtotal_minor": subtotal_minor,
            # "discount_minor": discount_minor,
            # "tax_minor": tax_minor,
            # "total_minor": total_minor,
        # },
    # )
    _outbox_order(db, tenant_id=tenant.id, order=order)
    db.commit()
    return _serialize_order(order, {order["id"]: [_serialize_order_line(line) for line in created_lines]})


def record_payment(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    order_id: str,
    amount_minor: int,
    provider: str | None,
    payment_method: str,
    status: str,
    reference: str | None,
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    if order.get("status") == "cancelled":
        raise ConflictError("Payments cannot be recorded against a cancelled order.")
    if status not in PAYMENT_RECORD_STATUSES:
        raise ValidationError(f"Unsupported payment status '{status}'.")

    _recalculate_order_finance(db, order)
    # Refresh order after recalculate
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    if status in {"authorized", "captured"} and amount_minor > order.get("balance_minor", 0):
        raise ConflictError("Payment amount cannot exceed the remaining order balance.")

    payment = commerce_repository.create_payment(
        db,
        tenant_id=tenant.id,
        order_id=order["id"],
        amount_minor=amount_minor,
        currency=order.get("currency"),
        provider=provider.strip().lower() if provider else None,
        payment_method=payment_method,
        status=status,
        reference=reference,
        notes=notes,
        received_at=datetime.now(tz=UTC).isoformat(),
        recorded_by_user_id=actor_user_id,
    )
    _recalculate_order_finance(db, order)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.payment.recorded",
        # subject_type="commerce_payment",
        # subject_id=str(payment["id"]),
        # metadata={"order_id": str(order["id"]), "amount_minor": amount_minor, "payment_method": payment_method, "status": status},
    # )
    db.commit()
    return get_order_finance_detail(db, tenant_slug=tenant_slug, order_id=order_id)


def record_refund(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    order_id: str,
    payment_id: str,
    amount_minor: int,
    reason: str,
    reference: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    payment = _payment_or_raise(db, tenant_id=tenant.id, payment_id=payment_id)
    if payment.get("order_id") != order["id"]:
        raise ConflictError("Payment does not belong to the provided order.")
    if payment.get("status") != "captured":
        raise ConflictError("Only captured payments can be refunded.")

    existing_refunds = commerce_repository.list_refunds(db, tenant_id=tenant.id, order_id=order["id"])
    refunded_for_payment_minor = sum(
        item.get("amount_minor", 0) for item in existing_refunds if item.get("payment_id") == payment["id"] and item.get("status") == "processed"
    )
    refundable_balance_minor = payment.get("amount_minor", 0) - refunded_for_payment_minor
    if amount_minor > refundable_balance_minor:
        raise ConflictError("Refund amount exceeds the refundable balance for this payment.")

    refund = commerce_repository.create_refund(
        db,
        tenant_id=tenant.id,
        order_id=order["id"],
        payment_id=payment["id"],
        amount_minor=amount_minor,
        currency=order.get("currency"),
        reason=reason,
        reference=reference,
        status="processed",
        refunded_at=datetime.now(tz=UTC).isoformat(),
        recorded_by_user_id=actor_user_id,
    )
    if amount_minor == refundable_balance_minor:
        commerce_repository.update_payment(db, tenant_id=tenant.id, payment_id=payment["id"], data={"status": "refunded"})
    
    _recalculate_order_finance(db, order)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.refund.recorded",
        # subject_type="commerce_refund",
        # subject_id=str(refund["id"]),
        # metadata={"order_id": str(order["id"]), "payment_id": str(payment["id"]), "amount_minor": amount_minor},
    # )
    db.commit()
    return get_order_finance_detail(db, tenant_slug=tenant_slug, order_id=order_id)


def create_return(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    order_id: str,
    reason_summary: str,
    notes: str | None,
    lines: list[dict[str, object]],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    order_lines = commerce_repository.list_order_lines_for_orders(db, tenant_id=tenant.id, order_ids=[order["id"]])
    if not order_lines:
        raise ConflictError("Returns cannot be created for an order without lines.")

    deduped_line_ids = _dedupe_strings([str(item["order_line_id"]) for item in lines])
    if len(deduped_line_ids) != len(lines):
        raise ValidationError("Return lines cannot repeat the same order line.")

    delivered_quantities = _delivered_quantities_by_order_line(db, tenant_id=tenant.id, order_id=order["id"])
    if not delivered_quantities:
        raise ConflictError("Returns can only be created after at least one fulfillment has been delivered.")
    active_return_quantities = _active_return_quantities_by_order_line(db, tenant_id=tenant.id, order_id=order["id"])
    order_line_lookup = {line["id"]: line for line in order_lines}
    existing_returns = commerce_repository.list_returns(db, tenant_id=tenant.id, order_id=order["id"])

    created_return = commerce_repository.create_return(
        db,
        tenant_id=tenant.id,
        order_id=order["id"],
        return_number=_return_number(order, len(existing_returns)),
        status="requested",
        reason_summary=reason_summary.strip(),
        notes=notes,
        inventory_restocked=False,
        requested_at=datetime.now(tz=UTC).isoformat(),
        approved_at=None,
        received_at=None,
        closed_at=None,
        created_by_user_id=actor_user_id,
        closed_by_user_id=None,
    )

    created_lines = []
    for item in lines:
        order_line = order_line_lookup.get(str(item["order_line_id"]))
        if order_line is None:
            raise NotFoundError(f"Order line '{item['order_line_id']}' was not found.")
        delivered_quantity = delivered_quantities.get(order_line["id"], 0)
        if delivered_quantity <= 0:
            raise ConflictError("Return requests can only reference delivered order lines.")
        quantity = int(item["quantity"])
        available_to_return = delivered_quantity - active_return_quantities.get(order_line["id"], 0)
        if quantity > available_to_return:
            raise ConflictError("Return quantity exceeds the delivered quantity available for return.")

        resolution_type = str(item["resolution_type"]).strip().lower()
        if resolution_type not in RETURN_RESOLUTION_TYPES:
            raise ValidationError(f"Unsupported return resolution type '{resolution_type}'.")
        replacement_variant_id = str(item["replacement_variant_id"]) if item.get("replacement_variant_id") else None
        if resolution_type == "exchange":
            if not replacement_variant_id:
                raise ValidationError("Exchange return lines require a replacement_variant_id.")
            replacement_variant = commerce_repository.get_variant(
                db,
                tenant_id=tenant.id,
                variant_id=replacement_variant_id,
            )
            if replacement_variant is None:
                raise NotFoundError(f"Replacement variant '{replacement_variant_id}' was not found.")
            if replacement_variant.get("currency") != order.get("currency"):
                raise ValidationError("Replacement variant currency must match the order currency.")
        elif replacement_variant_id is not None:
            raise ValidationError("Refund return lines cannot specify a replacement variant.")

        restock_on_receive = bool(item.get("restock_on_receive", True))
        if restock_on_receive:
            _resolve_restock_warehouse_for_line(db, tenant_id=tenant.id, order_line=order_line)

        created_lines.append(
            commerce_repository.create_return_line(
                db,
                tenant_id=tenant.id,
                return_id=created_return["id"],
                order_line_id=order_line["id"],
                variant_id=order_line["variant_id"],
                quantity=quantity,
                resolution_type=resolution_type,
                replacement_variant_id=replacement_variant_id,
                restock_on_receive=restock_on_receive,
                line_amount_minor=order_line.get("unit_price_minor", 0) * quantity,
                notes=str(item["notes"]).strip() if item.get("notes") else None,
            )
        )

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.return.created",
        # subject_type="commerce_return",
        # subject_id=str(created_return["id"]),
        # metadata={
            # "order_id": str(order["id"]),
            # "return_number": created_return.get("return_number"),
            # "line_count": len(created_lines),
        # },
    # )
    _outbox_return(db, tenant_id=tenant.id, return_request=created_return)
    db.commit()
    return get_return_detail(db, tenant_slug=tenant_slug, return_id=created_return["id"])


def update_return_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    return_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    return_request = _return_or_raise(db, tenant_id=tenant.id, return_id=return_id)
    normalized_status = status.strip().lower()
    if normalized_status not in RETURN_STATUSES:
        raise ValidationError(f"Unsupported return status '{status}'.")
    
    current_status = return_request.get("status")
    if normalized_status == current_status:
        return get_return_detail(db, tenant_slug=tenant_slug, return_id=return_id)

    allowed_next = RETURN_STATUS_TRANSITIONS.get(current_status, set())
    if normalized_status not in allowed_next:
        raise ConflictError(
            f"Return status cannot move from '{current_status}' to '{normalized_status}'."
        )

    now = datetime.now(tz=UTC).isoformat()
    return_lines = commerce_repository.list_return_lines(
        db,
        tenant_id=tenant.id,
        return_ids=[return_request["id"]],
    )
    
    update_data: dict[str, Any] = {"status": normalized_status}
    
    if normalized_status == "approved":
        update_data["approved_at"] = return_request.get("approved_at") or now
    elif normalized_status == "received":
        order = _order_or_raise(db, tenant_id=tenant.id, order_id=return_request["order_id"])
        order_lines = commerce_repository.list_order_lines_for_orders(db, tenant_id=tenant.id, order_ids=[order["id"]])
        _restock_return_inventory(
            db,
            tenant_id=tenant.id,
            return_request=return_request,
            return_lines=return_lines,
            order_line_lookup={line["id"]: line for line in order_lines},
            actor_user_id=actor_user_id,
        )
        update_data["inventory_restocked"] = True
        update_data["received_at"] = return_request.get("received_at") or now
    elif normalized_status in {"rejected", "completed", "cancelled"}:
        update_data["closed_at"] = return_request.get("closed_at") or now
        update_data["closed_by_user_id"] = actor_user_id

    commerce_repository.update_return(db, tenant_id=tenant.id, return_id=return_id, data=update_data)
    
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.return.updated",
        # subject_type="commerce_return",
        # subject_id=str(return_request["id"]),
        # metadata={"status": normalized_status, "return_number": return_request.return_number},
    # )
    _outbox_return(db, tenant_id=tenant.id, return_request=return_request)
    db.commit()
    return get_return_detail(db, tenant_slug=tenant_slug, return_id=return_id)


def create_settlement(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    provider: str,
    settlement_reference: str | None,
    currency: str,
    status: str,
    payment_ids: list[str],
    refund_ids: list[str],
    fees_minor: int,
    adjustments_minor: int,
    notes: str | None,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    normalized_status = status.strip().lower()
    if normalized_status not in {"draft", "reported", "reconciled"}:
        raise ValidationError(f"Unsupported settlement creation status '{status}'.")
    normalized_currency = currency.strip().upper()
    normalized_provider = provider.strip().lower()
    normalized_payment_ids = _dedupe_strings(payment_ids)
    normalized_refund_ids = _dedupe_strings(refund_ids)
    if not normalized_payment_ids and not normalized_refund_ids:
        raise ValidationError("Settlements require at least one payment or refund reference.")

    payments = [
        _payment_or_raise(db, tenant_id=tenant.id, payment_id=payment_id)
        for payment_id in normalized_payment_ids
    ]
    refunds = [
        item
        for item in commerce_repository.list_refunds(db, tenant_id=tenant.id)
        if item["id"] in normalized_refund_ids
    ]
    refund_lookup = {item["id"]: item for item in refunds}
    missing_refund_ids = [refund_id for refund_id in normalized_refund_ids if refund_id not in refund_lookup]
    if missing_refund_ids:
        raise NotFoundError(f"Refund(s) not found: {', '.join(missing_refund_ids)}.")

    for payment in payments:
        if payment.get("status") not in {"captured", "refunded"}:
            raise ConflictError("Only captured or refunded payments can be linked to a settlement.")
        if payment.get("currency") != normalized_currency:
            raise ValidationError("Settlement currency must match the linked payment currency.")
    for refund in refunds:
        if refund.get("status") != "processed":
            raise ConflictError("Only processed refunds can be linked to a settlement.")
        if refund.get("currency") != normalized_currency:
            raise ValidationError("Settlement currency must match the linked refund currency.")

    duplicate_payment_entries = commerce_repository.list_settlement_entries_for_payment_ids(
        db,
        tenant_id=tenant.id,
        payment_ids=normalized_payment_ids,
    )
    if duplicate_payment_entries:
        raise ConflictError("One or more payments are already linked to another settlement.")
    duplicate_refund_entries = commerce_repository.list_settlement_entries_for_refund_ids(
        db,
        tenant_id=tenant.id,
        refund_ids=normalized_refund_ids,
    )
    if duplicate_refund_entries:
        raise ConflictError("One or more refunds are already linked to another settlement.")

    payments_minor = sum(item.get("amount_minor", 0) for item in payments)
    refunds_minor = sum(item.get("amount_minor", 0) for item in refunds)
    net_minor = payments_minor - refunds_minor - fees_minor + adjustments_minor
    now = datetime.now(tz=UTC).isoformat()
    existing_settlements = commerce_repository.list_settlements(db, tenant_id=tenant.id)
    settlement = commerce_repository.create_settlement(
        db,
        tenant_id=tenant.id,
        settlement_number=_settlement_number(len(existing_settlements)),
        provider=normalized_provider,
        settlement_reference=settlement_reference.strip() if settlement_reference else None,
        currency=normalized_currency,
        status=normalized_status,
        payments_minor=payments_minor,
        refunds_minor=refunds_minor,
        fees_minor=fees_minor,
        adjustments_minor=adjustments_minor,
        net_minor=net_minor,
        reported_at=now,
        reconciled_at=now if normalized_status == "reconciled" else None,
        closed_at=None,
        notes=notes,
        created_by_user_id=actor_user_id,
        closed_by_user_id=None,
    )

    for payment in payments:
        commerce_repository.create_settlement_entry(
            db,
            tenant_id=str(tenant.id),
            settlement_id=str(settlement["id"]),
            entry_type="payment",
            payment_id=str(payment["id"]),
            refund_id=None,
            amount_minor=payment.get("amount_minor", 0),
            label=f"Payment {payment.get('reference') or payment['id']}",
            notes=None,
        )
    for refund in refunds:
        commerce_repository.create_settlement_entry(
            db,
            tenant_id=str(tenant.id),
            settlement_id=str(settlement["id"]),
            entry_type="refund",
            payment_id=None,
            refund_id=str(refund["id"]),
            amount_minor=refund.get("amount_minor", 0),
            label=f"Refund {refund.get('reference') or refund['id']}",
            notes=None,
        )
    if fees_minor > 0:
        commerce_repository.create_settlement_entry(
            db,
            tenant_id=str(tenant.id),
            settlement_id=str(settlement["id"]),
            entry_type="fee",
            payment_id=None,
            refund_id=None,
            amount_minor=fees_minor,
            label="Gateway fees",
            notes=None,
        )
    if adjustments_minor != 0:
        commerce_repository.create_settlement_entry(
            db,
            tenant_id=str(tenant.id),
            settlement_id=str(settlement["id"]),
            entry_type="adjustment",
            payment_id=None,
            refund_id=None,
            amount_minor=adjustments_minor,
            label="Manual adjustment",
            notes=None,
        )

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.settlement.created",
        # subject_type="commerce_settlement",
        # subject_id=str(settlement["id"]),
        # metadata={
            # "settlement_number": settlement.get("settlement_number"),
            # "provider": normalized_provider,
            # "payments_minor": payments_minor,
            # "refunds_minor": refunds_minor,
            # "net_minor": net_minor,
        # },
    # )
    _outbox_settlement(db, tenant_id=tenant.id, settlement=settlement)
    db.commit()
    return get_settlement_detail(db, tenant_slug=tenant_slug, settlement_id=settlement["id"])


def update_settlement_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    settlement_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    settlement = _settlement_or_raise(db, tenant_id=tenant.id, settlement_id=settlement_id)
    normalized_status = status.strip().lower()
    if normalized_status not in SETTLEMENT_STATUSES:
        raise ValidationError(f"Unsupported settlement status '{status}'.")
    if normalized_status == settlement.status:
        return get_settlement_detail(db, tenant_slug=tenant_slug, settlement_id=settlement_id)
    allowed_next = SETTLEMENT_STATUS_TRANSITIONS.get(settlement.status, set())
    if normalized_status not in allowed_next:
        raise ConflictError(
            f"Settlement status cannot move from '{settlement.status}' to '{normalized_status}'."
        )

    now = datetime.now(tz=UTC).isoformat()
    update_data: dict[str, Any] = {"status": normalized_status}
    if normalized_status == "reconciled":
        update_data["reconciled_at"] = settlement.get("reconciled_at") or now
    if normalized_status == "closed":
        update_data["closed_at"] = settlement.get("closed_at") or now
        update_data["closed_by_user_id"] = actor_user_id

    commerce_repository.update_settlement(db, tenant_id=tenant.id, settlement_id=settlement_id, data=update_data)

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.settlement.updated",
        # subject_type="commerce_settlement",
        # subject_id=str(settlement["id"]),
        # metadata={"status": normalized_status, "settlement_number": settlement.get("settlement_number")},
    # )
    _outbox_settlement(db, tenant_id=tenant.id, settlement=settlement)
    db.commit()
    return get_settlement_detail(db, tenant_slug=tenant_slug, settlement_id=settlement_id)


def issue_order_invoice(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    order_id: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    _recalculate_order_finance(db, order)
    # Refresh order after recalculate
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    if order.get("balance_minor", 0) != 0:
        raise ConflictError("Invoice cannot be issued while order balance remains.")
    if order.get("invoice_issued_at") is not None:
        raise ConflictError("Invoice has already been issued for this order.")

    invoice_number = _invoice_number(order)
    issued_at = datetime.now(tz=UTC).isoformat()
    invoice = commerce_repository.create_invoice(
        db,
        tenant_id=tenant.id,
        order_id=order["id"],
        customer_id=order.get("customer_id"),
        invoice_number=invoice_number,
        status="issued",
        currency=order.get("currency"),
        subtotal_minor=order.get("subtotal_minor", 0),
        discount_minor=order.get("discount_minor", 0),
        tax_minor=order.get("tax_minor", 0),
        total_minor=order.get("total_minor", 0),
        issued_at=issued_at,
        issued_by_user_id=actor_user_id,
    )
    commerce_repository.update_order(
        db,
        tenant_id=tenant.id,
        order_id=order["id"],
        data={
            "invoice_number": invoice["invoice_number"],
            "invoice_issued_at": invoice["issued_at"],
        },
    )
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.invoice.issued",
        # subject_type="commerce_order",
        # subject_id=str(order["id"]),
        # metadata={"invoice_number": invoice["invoice_number"], "customer_id": str(order.get("customer_id"))},
    # )
    _outbox_invoice(db, tenant_id=tenant.id, order=order)
    db.commit()
    return get_order_finance_detail(db, tenant_slug=tenant_slug, order_id=order_id)


def create_fulfillment(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    order_id: str,
    warehouse_id: str | None,
    lines: list[dict[str, object]],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    if order.get("status") == "cancelled":
        raise ConflictError("Fulfillment cannot be created for a cancelled order.")

    order_lines = commerce_repository.list_order_lines_for_orders(db, tenant_id=tenant.id, order_ids=[order["id"]])
    if not order_lines:
        raise ConflictError("Order has no lines to fulfill.")

    order_line_lookup = {line["id"]: line for line in order_lines}
    existing_fulfillments = commerce_repository.list_fulfillments(db, tenant_id=tenant.id, order_id=order["id"])
    pending_fulfillment_ids = [
        fulfillment["id"] for fulfillment in existing_fulfillments if fulfillment.get("status") in {"pending_pick", "packed"}
    ]
    pending_fulfillment_lines = commerce_repository.list_fulfillment_lines(
        db,
        tenant_id=tenant.id,
        fulfillment_ids=pending_fulfillment_ids,
    )
    pending_quantities_by_order_line: dict[str, int] = defaultdict(int)
    for line in pending_fulfillment_lines:
        pending_quantities_by_order_line[line["order_line_id"]] += line.get("quantity", 0)

    outstanding_lines = [
        line
        for line in order_lines
        if (line.get("quantity", 0) - line.get("fulfilled_quantity", 0) - pending_quantities_by_order_line.get(line["id"], 0)) > 0
    ]
    if not outstanding_lines:
        raise ConflictError("All order lines are already fulfilled.")

    requested_lines = lines or [
        {"order_line_id": line["id"], "quantity": line.get("quantity", 0) - line.get("fulfilled_quantity", 0)}
        for line in outstanding_lines
    ]
    deduped_line_ids = _dedupe_strings([str(item["order_line_id"]) for item in requested_lines])
    if len(deduped_line_ids) != len(requested_lines):
        raise ValidationError("Fulfillment lines cannot repeat the same order line.")

    selected_lines: list[tuple[Any, int]] = []
    for item in requested_lines:
        line = order_line_lookup.get(str(item["order_line_id"]))
        if line is None:
            raise NotFoundError(f"Order line '{item['order_line_id']}' was not found.")
        remaining_quantity = line.get("quantity", 0) - line.get("fulfilled_quantity", 0) - pending_quantities_by_order_line.get(line["id"], 0)
        quantity = int(item["quantity"])
        if quantity <= 0:
            raise ValidationError("Fulfillment quantity must be positive.")
        if quantity > remaining_quantity:
            raise ConflictError("Fulfillment quantity exceeds the remaining quantity on the order line.")
        selected_lines.append((line, quantity))

    selected_warehouse_ids = {line.get("allocated_warehouse_id") for line, _ in selected_lines if line.get("allocated_warehouse_id")}
    fulfillment_warehouse = None
    if warehouse_id:
        fulfillment_warehouse = _warehouse_or_raise(db, tenant_id=tenant.id, warehouse_id=warehouse_id)
        if fulfillment_warehouse.get("status") != "active":
            raise ConflictError("Fulfillment warehouse must be active.")
        if selected_warehouse_ids and any(candidate != fulfillment_warehouse["id"] for candidate in selected_warehouse_ids):
            raise ConflictError("Selected fulfillment lines are allocated to a different warehouse.")
    elif len(selected_warehouse_ids) == 1:
        fulfillment_warehouse = _warehouse_or_raise(
            db,
            tenant_id=tenant.id,
            warehouse_id=next(iter(selected_warehouse_ids)),
        )
    elif len(selected_warehouse_ids) > 1:
        raise ConflictError("Fulfillment spans multiple warehouses. Provide a warehouse_id or split the fulfillment.")

    for line, _ in selected_lines:
        if line.get("allocated_warehouse_id") is None and fulfillment_warehouse is not None:
            # line.allocated_warehouse_id = fulfillment_warehouse["id"]
            commerce_repository.update_order_line(db, tenant_id=tenant.id, line_id=line["id"], data={"allocated_warehouse_id": fulfillment_warehouse["id"]})

    fulfillment = commerce_repository.create_fulfillment(
        db,
        tenant_id=tenant.id,
        order_id=order["id"],
        warehouse_id=fulfillment_warehouse["id"] if fulfillment_warehouse is not None else None,
        fulfillment_number=_fulfillment_number(order, len(existing_fulfillments)),
        status="pending_pick",
        created_by_user_id=actor_user_id,
        packed_at=None,
        shipped_at=None,
        delivered_at=None,
    )
    created_lines = [
        commerce_repository.create_fulfillment_line(
            db,
            tenant_id=tenant.id,
            fulfillment_id=fulfillment["id"],
            order_line_id=line["id"],
            variant_id=line["variant_id"],
            quantity=quantity,
        )
        for line, quantity in selected_lines
    ]
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.fulfillment.created",
        # subject_type="commerce_fulfillment",
        # subject_id=str(fulfillment["id"]),
        # metadata={
            # "order_id": str(order["id"]),
            # "warehouse_id": str(fulfillment.get("warehouse_id")) if fulfillment.get("warehouse_id") else None,
            # "line_count": len(created_lines),
        # },
    # )
    _outbox_fulfillment(db, tenant_id=tenant.id, fulfillment=fulfillment)
    db.commit()
    return _serialize_fulfillment(
        fulfillment,
        {fulfillment["id"]: [_serialize_fulfillment_line(line) for line in created_lines]},
    )


def update_fulfillment_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    fulfillment_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    fulfillment = _fulfillment_or_raise(db, tenant_id=tenant.id, fulfillment_id=fulfillment_id)
    if status not in FULFILLMENT_STATUSES:
        raise ValidationError(f"Unsupported fulfillment status '{status}'.")
    if status not in {"packed", "cancelled"}:
        raise ValidationError("Fulfillment status updates only support 'packed' or 'cancelled'.")
    
    current_status = fulfillment.get("status")
    if current_status in {"shipped", "delivered"}:
        raise ConflictError("Shipped fulfillments must be transitioned through shipment status.")
    if current_status == "cancelled":
        raise ConflictError("Cancelled fulfillments cannot be changed.")
    
    update_data: dict[str, Any] = {"status": status}
    if status == "packed":
        update_data["packed_at"] = fulfillment.get("packed_at") or datetime.now(tz=UTC).isoformat()

    commerce_repository.update_fulfillment(db, tenant_id=tenant.id, fulfillment_id=fulfillment_id, data=update_data)
    
    # Refresh to get updated data for audit and outbox
    fulfillment = _fulfillment_or_raise(db, tenant_id=tenant.id, fulfillment_id=fulfillment_id)
    lines = commerce_repository.list_fulfillment_lines(db, tenant_id=tenant.id, fulfillment_ids=[fulfillment["id"]])
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.fulfillment.updated",
        # subject_type="commerce_fulfillment",
        # subject_id=str(fulfillment["id"]),
        # metadata={"status": fulfillment.get("status")},
    # )
    _outbox_fulfillment(db, tenant_id=tenant.id, fulfillment=fulfillment)
    db.commit()
    return _serialize_fulfillment(
        fulfillment,
        {fulfillment["id"]: [_serialize_fulfillment_line(line) for line in lines]},
    )


def create_shipment(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    fulfillment_id: str,
    carrier: str,
    service_level: str | None,
    tracking_number: str,
    metadata: dict[str, object],
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    fulfillment = _fulfillment_or_raise(db, tenant_id=tenant.id, fulfillment_id=fulfillment_id)
    if fulfillment.get("status") == "cancelled":
        raise ConflictError("Cancelled fulfillment cannot be shipped.")
    if commerce_repository.list_shipments(db, tenant_id=tenant.id, fulfillment_id=fulfillment["id"]):
        raise ConflictError("A shipment already exists for this fulfillment.")

    order = _order_or_raise(db, tenant_id=tenant.id, order_id=fulfillment["order_id"])
    order_lines = commerce_repository.list_order_lines_for_orders(db, tenant_id=tenant.id, order_ids=[order["id"]])
    order_line_lookup = {line["id"]: line for line in order_lines}
    fulfillment_lines = commerce_repository.list_fulfillment_lines(
        db,
        tenant_id=tenant.id,
        fulfillment_ids=[fulfillment["id"]],
    )
    if not fulfillment_lines:
        raise ConflictError("Fulfillment has no lines to ship.")

    touched_variant_ids: list[str] = []
    for line in fulfillment_lines:
        order_line = order_line_lookup.get(line["order_line_id"])
        if order_line is None:
            raise ConflictError("Fulfillment line references an order line that no longer exists.")
        remaining_quantity = order_line.get("quantity", 0) - order_line.get("fulfilled_quantity", 0)
        line_qty = line.get("quantity", 0)
        if line_qty > remaining_quantity:
            raise ConflictError("Shipment quantity exceeds the remaining order-line quantity.")
        
        wh_id = fulfillment.get("warehouse_id")
        if wh_id:
            stock = commerce_repository.get_warehouse_stock(
                db,
                tenant_id=tenant.id,
                warehouse_id=wh_id,
                variant_id=line["variant_id"],
            )
            if stock is None:
                raise ConflictError("Warehouse stock record is missing for fulfillment shipment.")
            
            curr_res = stock.get("reserved_quantity", 0)
            curr_on_hand = stock.get("on_hand_quantity", 0)
            if curr_res < line_qty or curr_on_hand < line_qty:
                raise ConflictError("Insufficient warehouse stock to ship the fulfillment.")
            
            new_res = curr_res - line_qty
            new_on_hand = curr_on_hand - line_qty
            commerce_repository.update_warehouse_stock(db, tenant_id=tenant.id, stock_id=stock["id"], data={"reserved_quantity": new_res, "on_hand_quantity": new_on_hand})

            commerce_repository.create_stock_ledger_entry(
                db,
                tenant_id=str(tenant.id),
                warehouse_id=str(wh_id),
                variant_id=str(line["variant_id"]),
                entry_type="fulfillment",
                quantity_delta=-line_qty,
                balance_after=new_on_hand,
                reserved_after=new_res,
                reference_type="commerce_fulfillment",
                reference_id=str(fulfillment["id"]),
                notes=f"Shipped fulfillment {fulfillment.get('fulfillment_number')}.",
                recorded_by_user_id=str(actor_user_id),
            )
            touched_variant_ids.append(line["variant_id"])
        
        new_fulfilled_qty = order_line.get("fulfilled_quantity", 0) + line_qty
        commerce_repository.update_order_line(db, tenant_id=tenant.id, line_id=order_line["id"], data={"fulfilled_quantity": new_fulfilled_qty})

    if touched_variant_ids:
        _sync_variant_inventory_from_stocks(db, tenant_id=tenant.id, variant_ids=touched_variant_ids)

    shipped_at = datetime.now(tz=UTC).isoformat()
    shipment = commerce_repository.create_shipment(
        db,
        tenant_id=tenant.id,
        fulfillment_id=fulfillment["id"],
        carrier=carrier.strip(),
        service_level=service_level.strip() if service_level else None,
        tracking_number=tracking_number.strip().upper(),
        status="shipped",
        shipped_at=shipped_at,
        delivered_at=None,
        metadata_json=metadata,
    )
    
    commerce_repository.update_fulfillment(db, tenant_id=tenant.id, fulfillment_id=fulfillment["id"], data={"status": "shipped", "shipped_at": shipped_at})
    # Refresh fulfillment for outbox
    fulfillment = _fulfillment_or_raise(db, tenant_id=tenant.id, fulfillment_id=fulfillment["id"])
    
    _mark_order_fulfillment_state(db, tenant_id=tenant.id, order_lines=order_lines, order=order)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.shipment.created",
        # subject_type="commerce_shipment",
        # subject_id=str(shipment["id"]),
        # metadata={
            # "fulfillment_id": str(fulfillment["id"]),
            # "tracking_number": shipment.get("tracking_number"),
            # "carrier": shipment.get("carrier"),
        # },
    # )
    _outbox_shipment(db, tenant_id=tenant.id, shipment=shipment)
    _outbox_fulfillment(db, tenant_id=tenant.id, fulfillment=fulfillment)
    db.commit()
    return _serialize_shipment(shipment)


def update_shipment_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    shipment_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    shipment = _shipment_or_raise(db, tenant_id=tenant.id, shipment_id=shipment_id)
    if status not in SHIPMENT_STATUSES:
        raise ValidationError(f"Unsupported shipment status '{status}'.")
    if status != "delivered":
        raise ValidationError("Shipment status updates currently support only 'delivered'.")
    if shipment.get("status") != "shipped":
        raise ConflictError("Only shipped shipments can be marked as delivered.")

    delivered_at = datetime.now(tz=UTC).isoformat()
    commerce_repository.update_shipment(db, tenant_id=tenant.id, shipment_id=shipment_id, data={"status": "delivered", "delivered_at": delivered_at})
    
    # Refresh shipment
    shipment = _shipment_or_raise(db, tenant_id=tenant.id, shipment_id=shipment_id)
    
    fid = shipment.get("fulfillment_id")
    commerce_repository.update_fulfillment(db, tenant_id=tenant.id, fulfillment_id=fid, data={"status": "delivered", "delivered_at": delivered_at})
    # Refresh fulfillment
    fulfillment = _fulfillment_or_raise(db, tenant_id=tenant.id, fulfillment_id=fid)

    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.shipment.updated",
        # subject_type="commerce_shipment",
        # subject_id=str(shipment["id"]),
        # metadata={"status": shipment.get("status"), "tracking_number": shipment.get("tracking_number")},
    # )
    _outbox_shipment(db, tenant_id=tenant.id, shipment=shipment)
    _outbox_fulfillment(db, tenant_id=tenant.id, fulfillment=fulfillment)
    db.commit()
    return _serialize_shipment(shipment)


def update_order_status(
    db: Session,
    *,
    tenant_slug: str,
    actor_user_id: str,
    order_id: str,
    status: str,
) -> dict[str, object]:
    tenant = _tenant(db, tenant_slug)
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    if status not in {"draft", "placed", "paid", "fulfilled", "cancelled"}:
        raise ValidationError(f"Unsupported order status '{status}'.")

    lines = commerce_repository.list_order_lines_for_orders(db, tenant_id=tenant.id, order_ids=[order["id"]])
    variants = [
        commerce_repository.get_variant(db, tenant_id=tenant.id, variant_id=line.get("variant_id"))
        for line in lines
    ]
    variant_models = [variant for variant in variants if variant is not None]
    outstanding_quantities = {line.get("variant_id"): max(line.get("quantity", 0) - line.get("fulfilled_quantity", 0), 0) for line in lines}
    
    update_data: dict[str, Any] = {"status": status}

    if not order.get("inventory_reserved") and status in {"placed", "paid", "fulfilled"}:
        warehouse_stocks = commerce_repository.list_warehouse_stocks_for_variants(
            db,
            tenant_id=tenant.id,
            variant_ids=[line.get("variant_id") for line in lines],
        )
        if warehouse_stocks:
            _reserve_order_lines_against_warehouses(
                db,
                tenant_id=tenant.id,
                order=order,
                order_lines=lines,
                actor_user_id=actor_user_id,
            )
        else:
            _reserve_inventory(db, tenant_id=tenant.id, variants=variant_models, quantities=outstanding_quantities)
        update_data["inventory_reserved"] = True
        update_data["placed_at"] = order.get("placed_at") or datetime.now(tz=UTC).isoformat()
    elif order.get("inventory_reserved") and status == "cancelled":
        warehouse_allocated_lines = [line for line in lines if line.get("allocated_warehouse_id")]
        if warehouse_allocated_lines:
            _release_order_lines_from_warehouses(
                db,
                tenant_id=tenant.id,
                order=order,
                order_lines=warehouse_allocated_lines,
                actor_user_id=actor_user_id,
            )
        else:
            _restore_inventory(db, tenant_id=tenant.id, variants=variant_models, quantities=outstanding_quantities)
        update_data["inventory_reserved"] = False

    commerce_repository.update_order(db, tenant_id=tenant.id, order_id=order_id, data=update_data)
    
    # Refresh order for finance recalc, audit, and serialization
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    _recalculate_order_finance(db, order)
    
    # Refresh again after finance recalc
    order = _order_or_raise(db, tenant_id=tenant.id, order_id=order_id)
    # _audit(
        # db,
        # tenant_id=str(tenant.id),
        # actor_user_id=actor_user_id,
        # action="commerce.order.updated",
        # subject_type="commerce_order",
        # subject_id=str(order["id"]),
        # metadata={"status": status},
    # )
    db.commit()
    return _serialize_order(order, {order["id"]: [_serialize_order_line(line) for line in lines]})


def load_legacy_commerce_plan() -> dict[str, object]:
    repo_root = Path(__file__).resolve().parents[4]
    adapter_file = repo_root / "adapters" / "legacy-kalpzero" / "commerce-catalog.yaml"
    manifest = yaml.safe_load(adapter_file.read_text(encoding="utf-8"))
    return {
        "adapter_id": manifest["adapter_id"],
        "source_root": manifest["source_root"],
        "mode": manifest["mode"],
        "entities": manifest["entities"],
    }
