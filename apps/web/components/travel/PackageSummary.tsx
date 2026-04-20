'use client';

import React from 'react';
import { Package, MapPin, Calendar, Clock, CheckCircle2, XCircle, HelpCircle, FileText } from 'lucide-react';
import type { TravelPackageDto } from '@/lib/contracts/travel';

interface PackageSummaryProps {
    data: TravelPackageDto;
}

export function PackageSummary({ data }: PackageSummaryProps) {
    const totalDays = data.itinerary.length;
    const totalActivities = data.itinerary.reduce((acc, day) => acc + day.activities.length, 0);
    const totalHotels = data.itinerary.reduce((acc, day) => acc + day.hotelStays.length, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-3 space-y-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-slate-800/60">
                        <div className="w-20 h-20 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 animate-pulse-subtle">
                            <Package size={32} className="text-cyan-400" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold text-white tracking-tight">{data.title || 'Untitled Package'}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-cyan-500" /> {data.destination || 'Destination not set'}</span>
                                <span className="inline-flex items-center gap-1.5"><Calendar size={14} className="text-cyan-500" /> {data.tripDuration || 'Duration not set'}</span>
                                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-400">{data.price.currency} {Number(data.price.amount).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1">Overview</h3>
                            <p className="text-sm text-slate-300 leading-relaxed italic">{data.shortDescription || 'No short description provided.'}</p>
                            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">{data.longDescription || 'No long description provided.'}</p>
                        </div>
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <CheckCircle2 size={12} className="text-emerald-500" /> Inclusions ({data.inclusions.length})
                                </h4>
                                <ul className="space-y-1.5">
                                    {data.inclusions.slice(0, 5).map((inc, i) => (
                                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" /> {inc}
                                        </li>
                                    ))}
                                    {data.inclusions.length > 5 && <li className="text-[10px] text-slate-500 pl-3">+{data.inclusions.length - 5} more...</li>}
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <XCircle size={12} className="text-rose-500" /> Exclusions ({data.exclusions.length})
                                </h4>
                                <ul className="space-y-1.5">
                                    {data.exclusions.slice(0, 5).map((exc, i) => (
                                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                            <span className="w-1 h-1 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" /> {exc}
                                        </li>
                                    ))}
                                    {data.exclusions.length > 5 && <li className="text-[10px] text-slate-500 pl-3">+{data.exclusions.length - 5} more...</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-1 flex items-center gap-2">
                        <Clock size={14} className="text-cyan-500" /> Itinerary Timeline
                    </h3>
                    <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800/60">
                        {data.itinerary.map((day, i) => (
                            <div key={day.id} className="relative pl-10">
                                <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-cyan-400 z-10">
                                    {day.dayNumber}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-semibold text-white">{day.title || `Day ${day.dayNumber}`}</h4>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{day.city}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 line-clamp-2">{day.description}</div>
                                    <div className="flex gap-4 mt-2">
                                        {day.activities.length > 0 && <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{day.activities.length} Activities</span>}
                                        {day.hotelStays.length > 0 && <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">1 Hotel Stay</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-cyan-500 uppercase tracking-widest">Configuration Stats</h3>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Total Days</span>
                            <span className="text-sm font-bold text-white">{totalDays}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Total Activities</span>
                            <span className="text-sm font-bold text-white">{totalActivities}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Hotel Stays</span>
                            <span className="text-sm font-bold text-white">{totalHotels}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Status</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                data.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                                {data.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <HelpCircle size={14} className="text-slate-500" /> FAQs ({data.faqs.length})
                    </h3>
                    <div className="space-y-3">
                        {data.faqs.slice(0, 3).map((faq, i) => (
                            <div key={i} className="text-[11px]">
                                <div className="text-slate-200 font-semibold mb-1">Q: {faq.question}</div>
                                <div className="text-slate-400 line-clamp-2 italic">{faq.answer}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <FileText size={14} className="text-slate-500" /> Policy & Guidelines
                    </h3>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Know Before You Go</span>
                            <span className="text-white font-semibold">{data.knowBeforeYouGo.length} points</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Terms & Conditions</span>
                            <span className="text-slate-500">Default Applied</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
