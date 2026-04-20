import Link from 'next/link';
import { Compass, Package, Building2, Calendar, Users } from 'lucide-react';

const cards = [
    {
        title: 'Tour Packages',
        description: 'Compose itinerary-driven offerings with linked hotels, activities, transfers, and public package pages.',
        href: '/travel/packages',
        icon: Package,
    },
    {
        title: 'Hotel Catalog',
        description: 'Maintain hotel references used in itinerary day plans and stay mapping.',
        href: '/travel/catalog/hotels',
        icon: Building2,
    },
    {
        title: 'Activities',
        description: 'Store bookable experiences, excursions, and destination activities.',
        href: '/travel/catalog/activities',
        icon: Calendar,
    },
    {
        title: 'Transfers',
        description: 'Track airport, intercity, and itinerary-linked movement services.',
        href: '/travel/catalog/transfers',
        icon: Compass,
    },
    {
        title: 'Travel Customers',
        description: 'Shared traveler identity surface with booking-safe customer context.',
        href: '/travel/customers',
        icon: Users,
    },
];

export default function TourManagementPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                    <Compass size={20} />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Tour Management</h1>
                    <p className="text-sm text-slate-400 mt-1">Travel operations workspace for packages, itinerary catalog records, and customer-ready distribution surfaces.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {cards.map((card) => {
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
        </div>
    );
}
