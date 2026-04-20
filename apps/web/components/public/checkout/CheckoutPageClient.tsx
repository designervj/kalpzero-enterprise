'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
    clearPublicCart,
    readPublicCart,
    subscribePublicCart,
    type PublicCartSnapshot,
} from '@/lib/public-cart';
import { trackPublicCommerceEvent } from '@/lib/public-commerce-events';

interface CheckoutPageClientProps {
    tenantKey: string;
    tenantSlug: string;
}

type PaymentMethod = 'upi' | 'card' | 'cod';

const FREE_SHIPPING_THRESHOLD = 1499;
const FLAT_SHIPPING_FEE = 99;

function formatPrice(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
}

function buildOrderId(): string {
    const serial = Math.floor(Math.random() * 900000) + 100000;
    return `KALP-${new Date().getFullYear()}-${serial}`;
}

export function CheckoutPageClient({ tenantKey, tenantSlug }: CheckoutPageClientProps) {
    const [snapshot, setSnapshot] = useState<PublicCartSnapshot>({ items: [], subtotal: 0, totalQuantity: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const checkoutStartTrackedRef = useRef(false);

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
    const total = snapshot.subtotal + shippingFee + taxes;

    const paymentLabel = useMemo(() => {
        if (paymentMethod === 'card') return 'Card';
        if (paymentMethod === 'cod') return 'Cash on Delivery';
        return 'UPI / Netbanking';
    }, [paymentMethod]);

    useEffect(() => {
        if (checkoutStartTrackedRef.current) return;
        if (snapshot.items.length === 0 || isConfirmed) return;
        checkoutStartTrackedRef.current = true;
        trackPublicCommerceEvent({
            tenantKey,
            tenantSlug,
            eventName: 'checkout_start',
            quantity: snapshot.totalQuantity,
            amount: snapshot.subtotal,
            meta: {
                source: 'checkout_page',
            },
        });
    }, [isConfirmed, snapshot.items.length, snapshot.subtotal, snapshot.totalQuantity, tenantKey, tenantSlug]);

    const handlePlaceOrder = async () => {
        if (snapshot.items.length === 0) return;
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 700));
        clearPublicCart(tenantKey);
        const generated = buildOrderId();
        setOrderId(generated);
        setIsConfirmed(true);
        setIsSubmitting(false);
        trackPublicCommerceEvent({
            tenantKey,
            tenantSlug,
            eventName: 'checkout_success',
            quantity: snapshot.totalQuantity,
            amount: total,
            orderId: generated,
            meta: {
                paymentMethod,
                source: 'checkout_page',
            },
        });
    };

    return (
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300">Secure Checkout</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Checkout</h1>
                <p className="mt-2 text-sm text-slate-300">
                    Complete your shipping details and payment to place the order.
                </p>
            </header>

            {isConfirmed ? (
                <section className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-8 text-center">
                    <p className="inline-flex rounded-full border border-emerald-500/50 bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-200">
                        Order Confirmed
                    </p>
                    <h2 className="mt-4 text-3xl font-semibold text-white">Thank you for your purchase</h2>
                    <p className="mt-3 text-sm text-slate-300">
                        Your order <span className="font-mono text-emerald-300">{orderId}</span> was placed using {paymentLabel}.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={`/business/${encodeURIComponent(tenantSlug)}`}
                            className="inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/15 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25"
                        >
                            Continue Shopping
                        </Link>
                        <Link
                            href={`/discover/search`}
                            className="inline-flex rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-slate-500"
                        >
                            Discover More
                        </Link>
                    </div>
                </section>
            ) : snapshot.items.length === 0 ? (
                <section className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 p-12 text-center">
                    <h2 className="text-2xl font-semibold text-white">No items in checkout</h2>
                    <p className="mt-3 text-sm text-slate-400">
                        Add products to your cart before completing checkout.
                    </p>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={`/cart/${encodeURIComponent(tenantSlug)}`}
                            className="inline-flex rounded-full border border-cyan-500/40 bg-cyan-500/15 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200 hover:bg-cyan-500/25"
                        >
                            Open Cart
                        </Link>
                        <Link
                            href={`/business/${encodeURIComponent(tenantSlug)}`}
                            className="inline-flex rounded-full border border-slate-700 px-5 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-slate-500"
                        >
                            Browse Products
                        </Link>
                    </div>
                </section>
            ) : (
                <div className="grid gap-8 lg:grid-cols-[1.25fr_0.8fr]">
                    <section className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Shipping Details</h2>
                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <input className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none" placeholder="Full Name" />
                                <input className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none" placeholder="Phone Number" />
                                <input className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none sm:col-span-2" placeholder="Address Line" />
                                <input className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none" placeholder="City" />
                                <input className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none" placeholder="Postal Code" />
                            </div>
                        </div>

                        <div className="h-px bg-slate-800" />

                        <div>
                            <h2 className="text-lg font-semibold text-white">Payment Method</h2>
                            <div className="mt-4 grid gap-2">
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-black/20 px-3 py-2 text-sm text-slate-200">
                                    <input type="radio" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                                    UPI / Netbanking
                                </label>
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-black/20 px-3 py-2 text-sm text-slate-200">
                                    <input type="radio" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                    Debit / Credit Card
                                </label>
                                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-black/20 px-3 py-2 text-sm text-slate-200">
                                    <input type="radio" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                    Cash on Delivery
                                </label>
                            </div>
                        </div>
                    </section>

                    <aside className="rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                        <h2 className="text-lg font-semibold text-white">Order Summary</h2>
                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                            {snapshot.items.map((item) => (
                                <div key={item.lineId} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="truncate">{item.productName} x {item.quantity}</span>
                                    <span>{formatPrice(item.unitPrice * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 space-y-3 border-t border-slate-800 pt-4 text-sm">
                            <div className="flex items-center justify-between text-slate-300">
                                <span>Subtotal</span>
                                <span>{formatPrice(snapshot.subtotal)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                                <span>Shipping</span>
                                <span>{shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-300">
                                <span>Estimated Taxes</span>
                                <span>{formatPrice(taxes)}</span>
                            </div>
                            <div className="flex items-center justify-between text-base font-semibold text-white">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting}
                            className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-4 py-3 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-60"
                        >
                            {isSubmitting ? 'Placing Order...' : 'Place Order'}
                        </button>
                        <Link
                            href={`/cart/${encodeURIComponent(tenantSlug)}`}
                            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-slate-500"
                        >
                            Back to Cart
                        </Link>
                    </aside>
                </div>
            )}
        </main>
    );
}
