'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    readPublicCart,
    removePublicCartItem,
    setPublicCartQuantity,
    subscribePublicCart,
    type PublicCartSnapshot,
} from '@/lib/public-cart';
import { trackPublicCommerceEvent } from '@/lib/public-commerce-events';

type CartRecommendation = {
    _id: string;
    name?: string;
    slug?: string;
    price?: number;
    primaryImage?: string;
};

interface CartPageClientProps {
    tenantKey: string;
    tenantSlug: string;
    checkoutEnabled: boolean;
    recommendations: CartRecommendation[];
}

const FREE_SHIPPING_THRESHOLD = 1499;
const FLAT_SHIPPING_FEE = 99;

function formatPrice(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

export function CartPageClient({ tenantKey, tenantSlug, checkoutEnabled, recommendations }: CartPageClientProps) {
    const [snapshot, setSnapshot] = useState<PublicCartSnapshot>({ items: [], subtotal: 0, totalQuantity: 0 });

    useEffect(() => {
        setSnapshot(readPublicCart(tenantKey));
        return subscribePublicCart((updatedTenant) => {
            if (!updatedTenant || updatedTenant === tenantKey) {
                setSnapshot(readPublicCart(tenantKey));
            }
        });
    }, [tenantKey]);

    const shippingFee = snapshot.subtotal >= FREE_SHIPPING_THRESHOLD || snapshot.items.length === 0 ? 0 : FLAT_SHIPPING_FEE;
    const taxes = Math.round(snapshot.subtotal * 0.18 * 100) / 100;
    const grandTotal = snapshot.subtotal + shippingFee + taxes;
    const freeShippingGap = Math.max(0, FREE_SHIPPING_THRESHOLD - snapshot.subtotal);

    const recommendationRows = useMemo(
        () => recommendations.filter((item) => item.slug && item.name).slice(0, 4),
        [recommendations]
    );

    return (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">Storefront Cart</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Your Cart</h1>
                <p className="mt-2 text-sm text-slate-300">
                    Review selected items, update quantities, and continue to secure checkout.
                </p>
            </header>

            {snapshot.items.length === 0 ? (
                <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center">
                    <h2 className="text-2xl font-semibold text-white">Your cart is empty</h2>
                    <p className="mt-3 text-sm text-slate-400">
                        Add products from the catalog to start checkout.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={`/business/${encodeURIComponent(tenantSlug)}`}
                            className="inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/15 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25"
                        >
                            Continue Shopping
                        </Link>
                        <Link
                            href="/discover/search"
                            className="inline-flex rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-slate-500"
                        >
                            Discover Businesses
                        </Link>
                    </div>
                </section>
            ) : (
                <div className="grid gap-8 lg:grid-cols-[1.5fr_0.8fr]">
                    <section className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3 text-xs uppercase tracking-wider text-slate-500">
                            <span>{snapshot.totalQuantity} item{snapshot.totalQuantity === 1 ? '' : 's'}</span>
                            <span>Adjust quantity as needed</span>
                        </div>
                        <div className="space-y-3">
                            {snapshot.items.map((item) => (
                                <article
                                    key={item.lineId}
                                    className="grid gap-3 rounded-xl border border-slate-800 bg-black/20 p-3 sm:grid-cols-[86px_1fr_auto]"
                                >
                                    <div className="h-20 w-20 overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
                                        {item.productImage ? (
                                            <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">No image</div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold text-white">{item.productName}</h3>
                                        <p className="mt-1 text-xs text-slate-500">{item.variantLabel || item.sku || 'Default Variant'}</p>
                                        <p className="mt-1 text-sm font-semibold text-cyan-300">{formatPrice(item.unitPrice)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                                        <div className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900/60">
                                            <button
                                                type="button"
                                                onClick={() => setSnapshot(setPublicCartQuantity(tenantKey, item.lineId, item.quantity - 1))}
                                                className="px-2 py-1 text-sm text-slate-300 hover:text-white"
                                                aria-label="Decrease quantity"
                                            >
                                                -
                                            </button>
                                            <span className="min-w-8 px-2 text-center text-sm text-slate-200">{item.quantity}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSnapshot(setPublicCartQuantity(tenantKey, item.lineId, item.quantity + 1))}
                                                className="px-2 py-1 text-sm text-slate-300 hover:text-white"
                                                aria-label="Increase quantity"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                trackPublicCommerceEvent({
                                                    tenantKey,
                                                    tenantSlug,
                                                    eventName: 'cart_remove',
                                                    productSlug: item.productSlug,
                                                    sku: item.sku,
                                                    quantity: item.quantity,
                                                    amount: item.unitPrice * item.quantity,
                                                    meta: {
                                                        source: 'cart_page',
                                                    },
                                                });
                                                setSnapshot(removePublicCartItem(tenantKey, item.lineId));
                                            }}
                                            className="text-[11px] uppercase tracking-wide text-rose-300 hover:text-rose-200"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                        <h2 className="text-lg font-semibold text-white">Order Summary</h2>
                        <dl className="mt-5 space-y-3 text-sm">
                            <div className="flex items-center justify-between text-slate-300">
                                <dt>Subtotal</dt>
                                <dd>{formatPrice(snapshot.subtotal)}</dd>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                                <dt>Shipping</dt>
                                <dd>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</dd>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                                <dt>Estimated Taxes</dt>
                                <dd>{formatPrice(taxes)}</dd>
                            </div>
                            <div className="h-px bg-slate-800" />
                            <div className="flex items-center justify-between text-base font-semibold text-white">
                                <dt>Total</dt>
                                <dd>{formatPrice(grandTotal)}</dd>
                            </div>
                        </dl>

                        {freeShippingGap > 0 && (
                            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                Add {formatPrice(freeShippingGap)} more for free shipping.
                            </p>
                        )}

                        {checkoutEnabled ? (
                            <Link
                                href={`/checkout/${encodeURIComponent(tenantSlug)}`}
                                className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-400"
                            >
                                Continue to Checkout
                            </Link>
                        ) : (
                            <p className="mt-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                                Checkout is currently unavailable for this storefront.
                            </p>
                        )}
                        <Link
                            href={`/business/${encodeURIComponent(tenantSlug)}`}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-slate-500"
                        >
                            Add More Products
                        </Link>
                    </aside>
                </div>
            )}

            {recommendationRows.length > 0 && (
                <section className="mt-12">
                    <h2 className="mb-4 text-xl font-semibold text-white">Recommended</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {recommendationRows.map((row) => (
                            <Link
                                key={row._id}
                                href={`/product/${encodeURIComponent(tenantSlug)}--${row.slug}`}
                                className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30 hover:border-cyan-500/40"
                            >
                                <div className="h-36 overflow-hidden bg-slate-900/60">
                                    {row.primaryImage ? (
                                        <img src={row.primaryImage} alt={row.name || 'Product'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">No image</div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h3 className="truncate text-sm font-semibold text-white">{row.name}</h3>
                                    <p className="mt-1 text-xs text-cyan-300">{typeof row.price === 'number' ? formatPrice(row.price) : 'Price on request'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
