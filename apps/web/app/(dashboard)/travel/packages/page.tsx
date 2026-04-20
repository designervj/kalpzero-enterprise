'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Pencil, Trash2, ExternalLink, MapPin, CalendarDays } from 'lucide-react';
import type { TravelPackageListItemDto } from '@/lib/contracts/travel';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';

type StatusFilter = '' | 'draft' | 'published' | 'archived';

function getTenantFromCookie(): string {
    if (typeof document === 'undefined') return 'demo';
    const matched = document.cookie
        .split(';')
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith('kalp_active_tenant='));
    if (!matched) return 'demo';
    return decodeURIComponent(matched.split('=')[1] || 'demo');
}

export default function TravelPackagesPage() {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [rows, setRows] = useState<TravelPackageListItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<StatusFilter>('');

    const tenantKey = useMemo(() => getTenantFromCookie(), []);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search.trim()) params.set('search', search.trim());
            if (status) params.set('status', status);
            const query = params.toString();
            const res = await fetch(`/api/travel/packages${query ? `?${query}` : ''}`);
            const data = await res.json();
            setRows(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, [search, status]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const handleDelete = async (id: string) => {
        if (!canMutate) return;
        if (!confirm('Delete this travel package?')) return;
        await fetch(`/api/travel/packages/${id}`, { method: 'DELETE' });
        await fetchRows();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to manage travel packages.' : 'This role is read-only for travel package mutations.'}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Travel Packages</h1>
                    <p className="text-sm text-slate-400 mt-1">Create, publish, and showcase itinerary-based package offerings.</p>
                </div>
                <Link
                    href={canMutate ? '/travel/packages/new' : '#'}
                    aria-disabled={!canMutate}
                    onClick={(event) => { if (!canMutate) event.preventDefault(); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 transition-colors"
                >
                    <Plus size={16} />
                    Create Package
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title or summary..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    />
                </div>
                <div>
                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as StatusFilter)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                    </select>
                </div>
                <button
                    onClick={fetchRows}
                    className="px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200 hover:bg-slate-700"
                >
                    Refresh
                </button>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-slate-500 text-sm">Loading packages...</div>
                ) : rows.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-sm">No packages found.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-black/20 border-b border-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Package</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Destination</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Price</th>
                                <th className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">Status</th>
                                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row._id} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                                    <td className="px-4 py-4">
                                        <div className="text-sm font-semibold text-white">{row.title}</div>
                                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1"><CalendarDays size={12} /> {row.tripDuration}</span>
                                            <span>{row.dayCount} day blocks</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-slate-300">
                                        <span className="inline-flex items-center gap-1"><MapPin size={13} /> {row.destination}</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-emerald-400 font-semibold">
                                        {row.price.currency} {Number(row.price.amount).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${row.status === 'published'
                                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                            : row.status === 'archived'
                                                ? 'bg-slate-500/15 text-slate-300 border border-slate-500/30'
                                                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                            }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={canMutate ? `/travel/packages/new?id=${row._id}` : '#'}
                                                aria-disabled={!canMutate}
                                                onClick={(event) => { if (!canMutate) event.preventDefault(); }}
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                                            >
                                                <Pencil size={13} />
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/packages/${row.slug}?tenant=${encodeURIComponent(tenantKey)}${row.status !== 'published' ? '&preview=1' : ''}`}
                                                target="_blank"
                                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
                                            >
                                                <ExternalLink size={13} />
                                                View
                                            </Link>
                                            {canMutate && (
                                                <button
                                                    onClick={() => handleDelete(row._id)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/15 border border-rose-500/40 text-rose-200 hover:bg-rose-500/25"
                                                >
                                                    <Trash2 size={13} />
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
