import Link from 'next/link';
import { Building2, Home, LayoutGrid, Sparkles, Calendar, Users, Wrench } from 'lucide-react';

const primaryCards = [
    {
        title: 'Rooms',
        description: 'Manage live room inventory, occupancy-ready records, and quick room-level edits.',
        href: '/hotel-management/rooms',
        icon: Home,
    },
    {
        title: 'Room Types',
        description: 'Define sellable room categories, occupancy defaults, and rate baselines.',
        href: '/hotel-management/room-types',
        icon: LayoutGrid,
    },
    {
        title: 'Amenities',
        description: 'Maintain reusable amenity records for room types, marketing blocks, and operational filtering.',
        href: '/hotel-management/amenities',
        icon: Sparkles,
    },
];

const linkedWorkspaces = [
    { title: 'Bookings', href: '/bookings', icon: Calendar, note: 'Shared booking pipeline for reservations and availability control.' },
    { title: 'Customers', href: '/customers', icon: Users, note: 'Guest profiles reused across bookings, orders, and service workflows.' },
    { title: 'Maintenance', href: '/hotel-management', icon: Wrench, note: 'Collection contract is reserved. Dedicated board ships in the next vertical pass.' },
];

export default function HotelManagementPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                    <Building2 size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Hotel Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Hospitality operations workspace for rooms, inventory structure, amenities, and connected booking flows.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {primaryCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 hover:border-cyan-500/40 hover:bg-slate-900/60 transition-colors"
                        >
                            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-300 mb-4">
                                <Icon size={18} />
                            </div>
                            <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                            <p className="text-sm text-slate-400 mt-2 leading-6">{card.description}</p>
                        </Link>
                    );
                })}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Linked Workspaces</h2>
                        <p className="text-sm text-slate-400 mt-1">Shared platform surfaces connected to the hotel app contract.</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {linkedWorkspaces.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={`${item.title}-${item.href}`}
                                href={item.href}
                                className="rounded-xl border border-slate-800/80 bg-black/20 p-4 hover:border-slate-600 transition-colors"
                            >
                                <div className="flex items-center gap-2 text-slate-200 font-medium">
                                    <Icon size={16} className="text-slate-400" />
                                    {item.title}
                                </div>
                                <p className="text-sm text-slate-500 mt-2 leading-6">{item.note}</p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
