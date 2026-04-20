'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Calendar, MapPin, Plane, Folder, Sparkles, Truck, FileText } from 'lucide-react';
import type { TravelPackageDto } from '@/lib/contracts/travel';

type PackageTab = 'itinerary' | 'summary' | 'activities' | 'stay' | 'transfers';

function readParam(searchParams: URLSearchParams, key: string, fallback = ''): string {
    const value = searchParams.get(key);
    return value?.trim() || fallback;
}

export default function PublicTravelPackagePage() {
    const params = useParams<{ slug: string }>();
    const searchParams = useSearchParams();
    const [pkg, setPkg] = useState<TravelPackageDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<PackageTab>('itinerary');

    const slug = typeof params.slug === 'string' ? params.slug : '';
    const tenant = readParam(searchParams, 'tenant', 'demo');
    const preview = readParam(searchParams, 'preview') === '1';

    useEffect(() => {
        if (!slug) return;

        const query = new URLSearchParams();
        if (tenant) query.set('tenant', tenant);
        if (preview) query.set('preview', '1');

        fetch(`/api/travel/public/packages/${slug}?${query.toString()}`)
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok || data?.error) {
                    throw new Error(data?.error || 'Package not found.');
                }
                setPkg(data as TravelPackageDto);
            })
            .catch((err: unknown) => {
                setError(err instanceof Error ? err.message : 'Failed to load package.');
            })
            .finally(() => setLoading(false));
    }, [slug, tenant, preview]);

    const flattened = useMemo(() => {
        if (!pkg) return { activities: 0, hotels: 0, transfers: 0 };
        return pkg.itinerary.reduce(
            (acc, day) => {
                acc.activities += day.activities.length;
                acc.hotels += day.hotelStays.length;
                acc.transfers += day.transfers.length;
                return acc;
            },
            { activities: 0, hotels: 0, transfers: 0 }
        );
    }, [pkg]);

    if (loading) {
        return <div className="min-h-screen bg-[#f6f6f8] text-slate-700 flex items-center justify-center">Loading package...</div>;
    }

    if (error || !pkg) {
        return (
            <div className="min-h-screen bg-[#f6f6f8] text-slate-700 flex items-center justify-center">
                <div className="bg-white border border-slate-200 rounded-xl px-6 py-5 shadow-sm">
                    <p className="font-semibold text-slate-800">Unable to load package</p>
                    <p className="text-sm text-slate-500 mt-1">{error || 'Package not available.'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f6f8] text-slate-900 pb-16">
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 space-y-6">
                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{pkg.title}</h1>
                            <div className="text-sm text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                                <span className="inline-flex items-center gap-1"><MapPin size={14} /> {pkg.destination}</span>
                                <span className="inline-flex items-center gap-1"><Calendar size={14} /> {pkg.tripDuration}</span>
                                <span className="inline-flex items-center gap-1"><Plane size={14} /> {pkg.travelStyle || 'Curated'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-wider text-slate-500">Starting from</div>
                            <div className="text-2xl font-bold text-emerald-600">{pkg.price.currency} {Number(pkg.price.amount).toLocaleString()}</div>
                            <div className="text-xs text-slate-400">per person</div>
                        </div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{pkg.shortDescription || pkg.longDescription}</p>
                    <div className="rounded-2xl overflow-hidden h-[320px] bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.25),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(255,255,255,0.2),transparent_50%)]" />
                        <div className="absolute bottom-5 left-5 text-white">
                            <p className="text-xs uppercase tracking-[0.2em] opacity-80">Curated Journey</p>
                            <p className="text-4xl font-bold mt-1">{pkg.itinerary.length}</p>
                            <p className="text-2xl font-semibold -mt-1">Days in {pkg.destination}</p>
                        </div>
                    </div>
                </section>

                <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {[
                            { key: 'itinerary', label: 'Itinerary', icon: Calendar },
                            { key: 'summary', label: 'Summarised View', icon: FileText },
                            { key: 'activities', label: 'Activities', icon: Sparkles },
                            { key: 'stay', label: 'Stay', icon: Folder },
                            { key: 'transfers', label: 'Transfers', icon: Truck },
                        ].map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key as PackageTab)}
                                    className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${isActive
                                        ? 'bg-orange-500 text-white border-orange-500'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {activeTab === 'itinerary' && (
                    <section className="space-y-3">
                        {pkg.itinerary.map((day) => (
                            <div key={day.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex items-center justify-center w-14 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-sm">DAY {day.dayNumber}</span>
                                        <h3 className="font-semibold text-lg">{day.title}</h3>
                                    </div>
                                    <div className="text-sm text-slate-500">{day.city}</div>
                                </div>
                                <div className="px-5 py-4 space-y-3">
                                    {day.description && <p className="text-sm text-slate-700 leading-relaxed">{day.description}</p>}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">Stay: {day.hotelStays.length}</div>
                                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">Activities: {day.activities.length}</div>
                                        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">Transfers: {day.transfers.length}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {activeTab === 'summary' && (
                    <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-2">Inclusions</h3>
                            <ul className="space-y-2 text-sm text-slate-700">
                                {pkg.inclusions.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
                            </ul>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-2">Exclusions</h3>
                            <ul className="space-y-2 text-sm text-slate-700">
                                {pkg.exclusions.map((item, index) => <li key={`${item}-${index}`}>• {item}</li>)}
                            </ul>
                        </div>
                        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-900 mb-2">Know Before You Go</h3>
                            <ul className="space-y-2 text-sm text-slate-700">
                                {pkg.knowBeforeYouGo.map((item) => <li key={item.id}>• {item.point}</li>)}
                            </ul>
                        </div>
                    </section>
                )}

                {activeTab === 'activities' && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-3">Activities</h3>
                        <p className="text-sm text-slate-500 mb-4">{flattened.activities} scheduled activities across the itinerary.</p>
                        <div className="space-y-2">
                            {pkg.itinerary.flatMap((day) =>
                                day.activities.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                        <span>Day {day.dayNumber} · {activity.customTitle || activity.activityRef || 'Activity'}</span>
                                        <span className="text-slate-500">{activity.time}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'stay' && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-3">Stay</h3>
                        <p className="text-sm text-slate-500 mb-4">{flattened.hotels} hotel stays mapped to itinerary days.</p>
                        <div className="space-y-2">
                            {pkg.itinerary.flatMap((day) =>
                                day.hotelStays.map((stay) => (
                                    <div key={stay.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                        <span>Day {day.dayNumber} · {stay.hotelRef || 'Hotel'}</span>
                                        <span className="text-slate-500">{stay.checkInTime} - {stay.checkOutTime}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {activeTab === 'transfers' && (
                    <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <h3 className="font-semibold text-slate-900 mb-3">Transfers</h3>
                        <p className="text-sm text-slate-500 mb-4">{flattened.transfers} transfer legs included.</p>
                        <div className="space-y-2">
                            {pkg.itinerary.flatMap((day) =>
                                day.transfers.map((transfer) => (
                                    <div key={transfer.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                                        <span>Day {day.dayNumber} · {transfer.from} → {transfer.to}</span>
                                        <span className="text-slate-500">{transfer.vehicleType} · {transfer.pickupTime}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-900">Frequently Asked Questions</h3>
                    <div className="mt-4 space-y-3">
                        {pkg.faqs.map((faq) => (
                            <div key={faq.id} className="rounded-lg border border-slate-200 px-4 py-3">
                                <p className="font-medium text-slate-900">{faq.question}</p>
                                <p className="text-sm text-slate-600 mt-1">{faq.answer}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
