'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { upsertPublicCartItem } from '@/lib/public-cart';
import { trackPublicCommerceEvent } from '@/lib/public-commerce-events';

type Variant = {
    _id?: string;
    sku?: string;
    title?: string;
    price?: number;
    compareAtPrice?: number;
    cost?: number;
    stock?: number;
    status?: string;
    optionValues?: Record<string, string>;
    imageId?: string;
};

type ProductOption = {
    key: string;
    label: string;
    values: string[];
};

interface ProductVariantSelectorProps {
    options: ProductOption[];
    variants: Variant[];
    basePrice: number;
    compareAtPrice?: number;
    currency?: string;
    productContext?: {
        tenantKey: string;
        tenantSlug: string;
        productSlug: string;
        productName: string;
        productImage: string;
        productSku?: string;
    };
    enablePurchaseActions?: boolean;
    cartEnabled?: boolean;
    checkoutEnabled?: boolean;
}

function formatPrice(amount: number, currency = 'INR') {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

function stockBadge(stock: number) {
    if (stock <= 0) return { label: 'Out of Stock', cls: 'bg-red-500/15 border-red-500/30 text-red-400' };
    if (stock <= 5) return { label: `Low Stock (${stock} left)`, cls: 'bg-amber-500/15 border-amber-500/30 text-amber-300' };
    return { label: 'In Stock', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' };
}

export function ProductVariantSelector({
    options,
    variants,
    basePrice,
    compareAtPrice,
    currency = 'INR',
    productContext,
    enablePurchaseActions = true,
    cartEnabled = true,
    checkoutEnabled = true,
}: ProductVariantSelectorProps) {
    const router = useRouter();
    const [selected, setSelected] = useState<Record<string, string>>(() => {
        // Pre-select first value of each option
        const init: Record<string, string> = {};
        options.forEach((opt) => { if (opt.values.length > 0) init[opt.label] = opt.values[0]; });
        return init;
    });
    const [notice, setNotice] = useState('');

    const matchedVariant = useMemo(() => {
        if (variants.length === 0) return null;
        return variants.find((v) =>
            v.optionValues && Object.entries(selected).every(([k, val]) => v.optionValues![k] === val)
        ) || null;
    }, [selected, variants]);

    const displayPrice = matchedVariant?.price ?? basePrice;
    const displayCompare = matchedVariant?.compareAtPrice ?? compareAtPrice ?? 0;
    const displayStock = matchedVariant?.stock ?? null;
    const badge = displayStock !== null ? stockBadge(displayStock) : null;
    const variantLabel = Object.entries(selected).map(([key, value]) => `${key}: ${value}`).join(' • ');
    const resolvedSku = matchedVariant?.sku || productContext?.productSku || '';
    const canAddToCart = Boolean(productContext) && cartEnabled && (displayStock === null || displayStock > 0);
    const canBuyNow = Boolean(productContext) && checkoutEnabled && canAddToCart;

    const addToCart = (redirectToCheckout: boolean) => {
        if (!productContext) return;
        if (!canAddToCart) return;
        if (redirectToCheckout && !canBuyNow) return;
        upsertPublicCartItem(productContext.tenantKey, {
            tenantSlug: productContext.tenantSlug,
            productSlug: productContext.productSlug,
            productName: productContext.productName,
            productImage: productContext.productImage,
            sku: resolvedSku,
            variantLabel,
            unitPrice: displayPrice,
            quantity: 1,
        });
        trackPublicCommerceEvent({
            tenantKey: productContext.tenantKey,
            tenantSlug: productContext.tenantSlug,
            eventName: 'cart_add',
            productSlug: productContext.productSlug,
            sku: resolvedSku,
            quantity: 1,
            amount: displayPrice,
            meta: {
                source: 'product_page',
                via: redirectToCheckout ? 'buy_now' : 'add_to_cart',
                variantLabel,
            },
        });
        if (redirectToCheckout) {
            router.push(`/checkout/${encodeURIComponent(productContext.tenantSlug)}`);
            return;
        }
        setNotice('Added to cart');
        window.setTimeout(() => setNotice(''), 1800);
    };

    return (
        <div className="space-y-5">
            {/* Price row */}
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">{formatPrice(displayPrice, currency)}</span>
                {displayCompare > 0 && displayCompare > displayPrice && (
                    <span className="text-base text-slate-500 line-through">{formatPrice(displayCompare, currency)}</span>
                )}
                {displayCompare > displayPrice && (
                    <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                        {Math.round(((displayCompare - displayPrice) / displayCompare) * 100)}% OFF
                    </span>
                )}
            </div>

            {/* Stock badge */}
            {badge && (
                <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>
                    {badge.label}
                </span>
            )}

            {options.length > 0 && (
                <>
                    {/* Option pickers */}
                    {options.map((opt) => (
                        <div key={opt.key || opt.label} className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                                {opt.label}: <span className="text-white normal-case">{selected[opt.label] || '-'}</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {opt.values.map((val) => {
                                    const isActive = selected[opt.label] === val;
                                    // Check if this combination has any in-stock variant
                                    const testSel = { ...selected, [opt.label]: val };
                                    const hasStock = variants.some((v) =>
                                        v.status !== 'archived' &&
                                        v.optionValues &&
                                        Object.entries(testSel).every(([k, dv]) => v.optionValues![k] === dv) &&
                                        (v.stock ?? 0) > 0
                                    );
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => setSelected((prev) => ({ ...prev, [opt.label]: val }))}
                                            className={`rounded-lg border px-3 py-1.5 text-sm transition-all duration-150 ${isActive
                                                ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30'
                                                : hasStock
                                                    ? 'border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
                                                    : 'border-slate-800 text-slate-600 line-through cursor-not-allowed'
                                                }`}
                                            disabled={!hasStock && !isActive}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </>
            )}

            {enablePurchaseActions && productContext && (
                <div className="space-y-2 pt-2">
                    {cartEnabled ? (
                        <button
                            type="button"
                            onClick={() => addToCart(false)}
                            disabled={!canAddToCart}
                            className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Add to Cart
                        </button>
                    ) : (
                        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                            Cart is currently unavailable for this storefront.
                        </p>
                    )}
                    {checkoutEnabled && cartEnabled && (
                        <button
                            type="button"
                            onClick={() => addToCart(true)}
                            disabled={!canBuyNow}
                            className="inline-flex w-full items-center justify-center rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            Buy Now
                        </button>
                    )}
                    {!checkoutEnabled && cartEnabled && (
                        <p className="text-[11px] text-slate-500">
                            Checkout is currently disabled. Items can still be added to cart.
                        </p>
                    )}
                    {notice && <p className="text-xs text-emerald-300">{notice}</p>}
                </div>
            )}

            {options.length === 0 && !enablePurchaseActions && (
                <div className="text-xs text-slate-500">No variant options configured.</div>
            )}

            {options.length === 0 && enablePurchaseActions && !productContext && (
                <div className="text-xs text-slate-500">Direct purchase controls are unavailable.</div>
            )}

            {/* Selected variant SKU */}
            {resolvedSku && (
                <p className="font-mono text-[10px] text-slate-600">SKU: {resolvedSku}</p>
            )}
        </div>
    );
}
