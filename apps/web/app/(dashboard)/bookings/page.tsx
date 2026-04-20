'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, List, Tag, Plus, Clock, User, CheckCircle2, Search, Settings } from 'lucide-react';
import Link from 'next/link';

type Booking = {
    _id: string;
    bookingNumber: string;
    customer: {
        name: string;
        email: string;
    };
    service: string;
    status: string;
    startAt: string;
    endAt: string;
};

type Service = {
    _id: string;
    name: string;
    price: number;
    status: string;
};

export default function BookingsPage() {
    const [currentTab, setCurrentTab] = useState<'calendar' | 'list' | 'services'>('list');
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const [bookingsRes, servicesRes] = await Promise.all([
                    fetch('/api/bookings'),
                    fetch('/api/ecommerce/products?type=service')
                ]);
                if (bookingsRes.ok) {
                    setBookings(await bookingsRes.json());
                }
                if (servicesRes.ok) {
                    setServices(await servicesRes.json());
                }
            } catch (err) {
                console.error("Failed to load booking data", err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const renderBookingsList = () => (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search appointments..."
                        className="w-full pl-9 pr-4 py-2 bg-slate-950/50 border border-slate-800 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all outline-none"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-medium rounded-lg transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                    <Plus className="h-4 w-4" />
                    New Booking
                </button>
            </div>

            {bookings.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No appointments found.</p>
                </div>
            ) : (
                <table className="w-full text-left text-sm text-slate-400">
                    <thead className="text-xs uppercase bg-slate-800/50 text-slate-300">
                        <tr>
                            <th className="px-6 py-4 font-medium">Booking ID</th>
                            <th className="px-6 py-4 font-medium">Customer</th>
                            <th className="px-6 py-4 font-medium">Service</th>
                            <th className="px-6 py-4 font-medium">Time (Start)</th>
                            <th className="px-6 py-4 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {bookings.map((b) => (
                            <tr key={b._id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-6 py-4 font-mono text-amber-500 whitespace-nowrap">{b.bookingNumber}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-300">
                                            <User className="w-3 h-3" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-medium">{b.customer?.name || 'Unknown'}</span>
                                            <span className="text-xs text-slate-500">{b.customer?.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300">{b.service}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-slate-300">
                                        <Clock className="w-3 h-3 text-slate-500" />
                                        {b.startAt ? new Date(b.startAt).toLocaleString() : 'TBD'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                        {b.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );

    const renderServices = () => (
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium text-white">Service Profiles</h3>
                    <p className="text-xs text-slate-400">Manage the bookable services you offer to clients.</p>
                </div>
                <Link href="/ecommerce/products/new?type=service" className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg border border-slate-700 transition-colors">
                    <Plus className="h-4 w-4" />
                    Add Service
                </Link>
            </div>
            {services.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No services defined.</p>
                    <p className="text-xs mt-2">Create your first service to enable bookings.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {services.map(s => (
                        <div key={s._id} className="bg-slate-950/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <span className={`px-2 py-1 text-[10px] font-medium rounded text-slate-300 border bg-slate-800/50 border-slate-700`}>
                                    {s.status}
                                </span>
                            </div>
                            <h4 className="text-base font-medium text-white mb-1">{s.name}</h4>
                            <div className="text-xl font-bold text-amber-500">${s.price.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                        📅
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Bookings Hub</h2>
                        <p className="text-slate-400 text-sm">Manage appointments, client schedules, and your service catalog.</p>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 space-x-1 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-xl w-fit">
                <button
                    onClick={() => setCurrentTab('list')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${currentTab === 'list' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                    <List className="w-4 h-4" />
                    Appointments
                </button>
                <button
                    onClick={() => setCurrentTab('calendar')}
                    disabled
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all opacity-50 cursor-not-allowed text-slate-400`}
                >
                    <CalendarIcon className="w-4 h-4" />
                    Calendar (Soon)
                </button>
                <button
                    onClick={() => setCurrentTab('services')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${currentTab === 'services' ? 'bg-slate-800 text-white shadow-lg border border-slate-700' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                    <Tag className="w-4 h-4" />
                    Service Profiles
                </button>
            </div>

            {isLoading ? (
                <div className="animate-pulse h-96 bg-slate-900/20 rounded-xl border border-slate-800/50"></div>
            ) : (
                <div className="mt-6">
                    {currentTab === 'list' && renderBookingsList()}
                    {currentTab === 'services' && renderServices()}
                </div>
            )}
        </div>
    );
}
