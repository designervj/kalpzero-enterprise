'use client';

import React from 'react';
import { Plus, Trash2, Clock, MapPin, Utensils, Info, Camera, ChevronDown, ChevronUp } from 'lucide-react';
import type { TravelHotelStayDto, TravelActivityRefDto, TravelTransferRefDto, TravelItineraryDayDto } from '@/lib/contracts/travel';

interface DayBlockProps {
    day: TravelItineraryDayDto;
    index: number;
    onUpdate: (updater: (day: TravelItineraryDayDto) => TravelItineraryDayDto) => void;
    onRemove: () => void;
    hotels: { _id: string; name: string }[];
    activities: { _id: string; name: string }[];
}

export function DayBlock({ day, index, onUpdate, onRemove, hotels, activities }: DayBlockProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    const updateStay = (stayIndex: number, patch: Partial<TravelHotelStayDto>) => {
        onUpdate(d => ({
            ...d,
            hotelStays: d.hotelStays.map((s, i) => i === stayIndex ? { ...s, ...patch } : s)
        }));
    };

    const updateActivity = (actIndex: number, patch: Partial<TravelActivityRefDto>) => {
        onUpdate(d => ({
            ...d,
            activities: d.activities.map((a, i) => i === actIndex ? { ...a, ...patch } : a)
        }));
    };

    return (
        <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden transition-all duration-300">
            <div className="bg-slate-800/50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                        {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                    <div>
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Day {day.dayNumber}</span>
                        <h3 className="text-sm font-semibold text-white mt-0.5">{day.title || 'Untitled Day'}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onRemove} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div className={isCollapsed ? 'hidden' : 'p-6 space-y-6'}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Day Title</label>
                        <input className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                            value={day.title} onChange={e => onUpdate(d => ({ ...d, title: e.target.value }))} placeholder="E.g. Arrival & Welcome" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">City</label>
                        <input className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                            value={day.city} onChange={e => onUpdate(d => ({ ...d, city: e.target.value }))} placeholder="E.g. Paris" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Day Type</label>
                        <select className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                            value={day.dayType} onChange={e => onUpdate(d => ({ ...d, dayType: e.target.value }))}>
                            <option value="sightseeing">Sightseeing</option>
                            <option value="arrival">Arrival</option>
                            <option value="transfer">Transfer</option>
                            <option value="leisure">Leisure</option>
                            <option value="departure">Departure</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 text-center block">Meals Included</label>
                    <div className="flex justify-center gap-6">
                        {['Breakfast', 'Lunch', 'Dinner'].map(meal => (
                            <label key={meal} className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500/20"
                                    checked={day.mealsIncluded.includes(meal)}
                                    onChange={e => {
                                        const next = e.target.checked 
                                            ? [...day.mealsIncluded, meal]
                                            : day.mealsIncluded.filter(m => m !== meal);
                                        onUpdate(d => ({ ...d, mealsIncluded: next }));
                                    }} />
                                <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors uppercase tracking-widest">{meal}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-cyan-400" /> Activities
                        </h4>
                        <button onClick={() => onUpdate(d => ({
                            ...d,
                            activities: [...d.activities, {
                                id: `act-${Date.now()}`,
                                activityRef: null,
                                time: '09:00',
                                guideIncluded: false,
                                ticketIncluded: false,
                            }]
                        }))} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                            <Plus size={10} /> Add Activity
                        </button>
                    </div>
                    
                    <div className="space-y-3">
                        {day.activities.map((act, i) => (
                            <div key={act.id} className="bg-black/20 border border-slate-800/50 rounded-lg p-3 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <select className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                        value={act.activityRef || ''} onChange={e => updateActivity(i, { activityRef: e.target.value })}>
                                        <option value="">Select Activity Catalog Item</option>
                                        {activities.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                                    </select>
                                    <input type="time" className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                        value={act.time} onChange={e => updateActivity(i, { time: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                        placeholder="Override Title" value={act.customTitle || ''} onChange={e => updateActivity(i, { customTitle: e.target.value })} />
                                    <div className="flex items-center gap-4 px-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                                                checked={act.guideIncluded} onChange={e => updateActivity(i, { guideIncluded: e.target.checked })} />
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Guide</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                                                checked={act.ticketIncluded} onChange={e => updateActivity(i, { ticketIncluded: e.target.checked })} />
                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">Ticket</span>
                                        </label>
                                    </div>
                                </div>
                                <textarea className="w-full bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white min-h-[50px] resize-none"
                                    placeholder="Override Description" value={act.customDescription || ''} onChange={e => updateActivity(i, { customDescription: e.target.value })} />
                                <div className="flex justify-end">
                                    <button onClick={() => onUpdate(d => ({ ...d, activities: d.activities.filter((_, idx) => idx !== i) }))}
                                        className="text-[10px] text-rose-400 font-bold uppercase tracking-widest hover:text-rose-300 transition-colors">
                                        Remove Activity
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Utensils size={12} className="text-cyan-400" /> Hotel Stay
                        </h4>
                        <button onClick={() => onUpdate(d => ({
                            ...d,
                            hotelStays: [...d.hotelStays, {
                                id: `hotel-${Date.now()}`,
                                hotelRef: null,
                                checkInTime: '14:00',
                                checkOutTime: '11:00',
                                mealInclusions: { breakfast: true, lunch: false, dinner: false },
                            }]
                        }))} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                            <Plus size={10} /> Add Hotel
                        </button>
                    </div>

                    <div className="space-y-3">
                        {day.hotelStays.map((stay, i) => (
                            <div key={stay.id} className="bg-black/20 border border-slate-800/50 rounded-lg p-3 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <select className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                        value={stay.hotelRef || ''} onChange={e => updateStay(i, { hotelRef: e.target.value })}>
                                        <option value="">Select Hotel Catalog Item</option>
                                        {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                                    </select>
                                    <div className="flex gap-2">
                                        <input type="time" className="w-1/2 bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                            value={stay.checkInTime} onChange={e => updateStay(i, { checkInTime: e.target.value })} title="Check-in" />
                                        <input type="time" className="w-1/2 bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                            value={stay.checkOutTime} onChange={e => updateStay(i, { checkOutTime: e.target.value })} title="Check-out" />
                                    </div>
                                    <input className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1.5 text-xs text-white"
                                        placeholder="Room Type Override" value={stay.customRoomType || ''} onChange={e => updateStay(i, { customRoomType: e.target.value })} />
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={() => onUpdate(d => ({ ...d, hotelStays: d.hotelStays.filter((_, idx) => idx !== i) }))}
                                        className="text-[10px] text-rose-400 font-bold uppercase tracking-widest hover:text-rose-300 transition-colors">
                                        Remove Hotel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={12} className="text-cyan-400" /> Transfers
                        </h4>
                        <button onClick={() => onUpdate(d => ({
                            ...d,
                            transfers: [...d.transfers, {
                                id: `trx-${Date.now()}`,
                                pickupTime: '08:00',
                                from: '',
                                to: '',
                                vehicleType: 'Sedan',
                                transferType: 'Private'
                            }]
                        }))} className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1">
                            <Plus size={10} /> Add Transfer
                        </button>
                    </div>

                    <div className="space-y-3">
                        {day.transfers.map((trx, i) => (
                            <div key={trx.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-black/20 border border-slate-800/50 rounded-lg p-2">
                                <input className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    placeholder="From" value={trx.from} onChange={e => onUpdate(d => ({ ...d, transfers: d.transfers.map((t, idx) => idx === i ? { ...t, from: e.target.value } : t) }))} />
                                <input className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    placeholder="To" value={trx.to} onChange={e => onUpdate(d => ({ ...d, transfers: d.transfers.map((t, idx) => idx === i ? { ...t, to: e.target.value } : t) }))} />
                                <input type="time" className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    value={trx.pickupTime} onChange={e => onUpdate(d => ({ ...d, transfers: d.transfers.map((t, idx) => idx === i ? { ...t, pickupTime: e.target.value } : t) }))} />
                                <select className="bg-slate-900/50 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                    value={trx.vehicleType} onChange={e => onUpdate(d => ({ ...d, transfers: d.transfers.map((t, idx) => idx === i ? { ...t, vehicleType: e.target.value } : t) }))}>
                                    <option value="Sedan">Sedan</option>
                                    <option value="SUV">SUV</option>
                                    <option value="Van">Van</option>
                                    <option value="Luxury Coach">Coach</option>
                                </select>
                                <button onClick={() => onUpdate(d => ({ ...d, transfers: d.transfers.filter((_, idx) => idx !== i) }))}
                                    className="text-[10px] text-rose-500 font-bold hover:bg-rose-500/10 rounded transition-all transition-colors uppercase tracking-widest">
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Day Notes / Summary</label>
                    <textarea className="w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-500/50 outline-none transition-all min-h-[80px] resize-none"
                        value={day.description} onChange={e => onUpdate(d => ({ ...d, description: e.target.value }))} placeholder="Brief summary of the day for the guest..." />
                </div>
            </div>
        </div>
    );
}
