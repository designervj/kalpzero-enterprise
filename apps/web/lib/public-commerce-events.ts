export type PublicCommerceEventName =
    | 'cart_add'
    | 'cart_remove'
    | 'checkout_start'
    | 'checkout_success';

export type PublicCommerceEventPayload = {
    tenantKey: string;
    tenantSlug?: string;
    eventName: PublicCommerceEventName;
    productSlug?: string;
    sku?: string;
    quantity?: number;
    amount?: number;
    orderId?: string;
    meta?: Record<string, unknown>;
};

function sanitizeText(value: unknown, maxLength = 160): string {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
}

function sanitizeNumber(value: unknown): number | null {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return null;
    return Math.round(numeric * 100) / 100;
}

export function trackPublicCommerceEvent(payload: PublicCommerceEventPayload): void {
    if (typeof window === 'undefined') return;
    const tenantKey = sanitizeText(payload.tenantKey, 64);
    if (!tenantKey) return;

    const body = {
        tenantKey,
        tenantSlug: sanitizeText(payload.tenantSlug, 120) || undefined,
        eventName: payload.eventName,
        productSlug: sanitizeText(payload.productSlug, 200) || undefined,
        sku: sanitizeText(payload.sku, 120) || undefined,
        quantity: sanitizeNumber(payload.quantity),
        amount: sanitizeNumber(payload.amount),
        orderId: sanitizeText(payload.orderId, 120) || undefined,
        meta: payload.meta && typeof payload.meta === 'object' && !Array.isArray(payload.meta)
            ? payload.meta
            : undefined,
    };

    void fetch('/api/public/commerce/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        keepalive: true,
    }).catch(() => undefined);
}
