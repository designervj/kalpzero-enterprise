export type PublicCartItem = {
    lineId: string;
    tenantKey: string;
    tenantSlug: string;
    productSlug: string;
    productName: string;
    productImage: string;
    sku: string;
    variantLabel: string;
    unitPrice: number;
    quantity: number;
};

export type PublicCartSnapshot = {
    items: PublicCartItem[];
    subtotal: number;
    totalQuantity: number;
};

const CART_EVENT = 'kalp-public-cart-updated';

function safeNumber(value: unknown, fallback = 0): number {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeLineId(productSlug: string, sku: string): string {
    const slug = productSlug.trim().toLowerCase();
    const normalizedSku = sku.trim().toLowerCase() || 'default';
    return `${slug}::${normalizedSku}`;
}

function sanitizeCartItem(raw: unknown, tenantKey: string): PublicCartItem | null {
    if (!raw || typeof raw !== 'object') return null;
    const row = raw as Record<string, unknown>;
    const rowTenant = typeof row.tenantKey === 'string' ? row.tenantKey : '';
    if (rowTenant !== tenantKey) return null;
    const productSlug = typeof row.productSlug === 'string' ? row.productSlug.trim() : '';
    const productName = typeof row.productName === 'string' ? row.productName.trim() : '';
    if (!productSlug || !productName) return null;

    const sku = typeof row.sku === 'string' ? row.sku.trim() : '';
    const quantity = Math.max(1, Math.floor(safeNumber(row.quantity, 1)));
    const unitPrice = Math.max(0, safeNumber(row.unitPrice, 0));
    const tenantSlug = typeof row.tenantSlug === 'string' ? row.tenantSlug.trim() : tenantKey;
    const productImage = typeof row.productImage === 'string' ? row.productImage.trim() : '';
    const variantLabel = typeof row.variantLabel === 'string' ? row.variantLabel.trim() : '';
    const lineId = typeof row.lineId === 'string' && row.lineId.trim()
        ? row.lineId.trim()
        : normalizeLineId(productSlug, sku);

    return {
        lineId,
        tenantKey,
        tenantSlug,
        productSlug,
        productName,
        productImage,
        sku,
        variantLabel,
        unitPrice,
        quantity,
    };
}

function getStorageKey(tenantKey: string): string {
    return `kalp_public_cart::${tenantKey.trim().toLowerCase()}`;
}

function readItemsUnsafe(tenantKey: string): PublicCartItem[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(getStorageKey(tenantKey));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((item) => sanitizeCartItem(item, tenantKey))
            .filter((item): item is PublicCartItem => Boolean(item));
    } catch {
        return [];
    }
}

function writeItemsUnsafe(tenantKey: string, items: PublicCartItem[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(getStorageKey(tenantKey), JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { tenantKey } }));
}

export function readPublicCart(tenantKey: string): PublicCartSnapshot {
    const items = readItemsUnsafe(tenantKey);
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    return { items, subtotal, totalQuantity };
}

export function upsertPublicCartItem(
    tenantKey: string,
    payload: Omit<PublicCartItem, 'lineId' | 'tenantKey'>
): PublicCartSnapshot {
    const normalizedLineId = normalizeLineId(payload.productSlug, payload.sku);
    const items = readItemsUnsafe(tenantKey);
    const index = items.findIndex((row) => row.lineId === normalizedLineId);
    const incomingQuantity = Math.max(1, Math.floor(safeNumber(payload.quantity, 1)));

    const nextItem: PublicCartItem = {
        lineId: normalizedLineId,
        tenantKey,
        tenantSlug: payload.tenantSlug.trim() || tenantKey,
        productSlug: payload.productSlug.trim(),
        productName: payload.productName.trim(),
        productImage: payload.productImage.trim(),
        sku: payload.sku.trim(),
        variantLabel: payload.variantLabel.trim(),
        unitPrice: Math.max(0, safeNumber(payload.unitPrice, 0)),
        quantity: incomingQuantity,
    };

    if (index >= 0) {
        items[index] = {
            ...items[index],
            ...nextItem,
            quantity: items[index].quantity + incomingQuantity,
        };
    } else {
        items.push(nextItem);
    }

    writeItemsUnsafe(tenantKey, items);
    return readPublicCart(tenantKey);
}

export function setPublicCartQuantity(tenantKey: string, lineId: string, quantity: number): PublicCartSnapshot {
    const items = readItemsUnsafe(tenantKey)
        .map((item) => (
            item.lineId === lineId
                ? { ...item, quantity: Math.max(0, Math.floor(safeNumber(quantity, item.quantity))) }
                : item
        ))
        .filter((item) => item.quantity > 0);
    writeItemsUnsafe(tenantKey, items);
    return readPublicCart(tenantKey);
}

export function removePublicCartItem(tenantKey: string, lineId: string): PublicCartSnapshot {
    const items = readItemsUnsafe(tenantKey).filter((item) => item.lineId !== lineId);
    writeItemsUnsafe(tenantKey, items);
    return readPublicCart(tenantKey);
}

export function clearPublicCart(tenantKey: string): PublicCartSnapshot {
    writeItemsUnsafe(tenantKey, []);
    return readPublicCart(tenantKey);
}

export function subscribePublicCart(callback: (tenantKey: string) => void): () => void {
    if (typeof window === 'undefined') return () => undefined;
    const handler = (event: Event) => {
        const detail = (event as CustomEvent<{ tenantKey?: string }>).detail;
        callback(typeof detail?.tenantKey === 'string' ? detail.tenantKey : '');
    };
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
}
