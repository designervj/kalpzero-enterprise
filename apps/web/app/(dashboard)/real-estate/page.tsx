'use client';

import { useState, useEffect, useCallback } from 'react';
import { Home, Building2, MapPin, Key, Star, Plus, Package, Tag, Search, Pencil, Trash2, X, Save, Eye, RefreshCw, Layers } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';

type PageVocabulary = {
    hubTitle: string;
    hubDescription: string;
    primaryEntity: string;
    categoryEntity: string;
    attributeEntity: string;
    categoryPath: string;
    attributePath: string;
    studioPath: string;
    createPath: string;
    studioCta: string;
    createCta: string;
    totalLabel: string;
    activeLabel: string;
    searchPlaceholder: string;
    emptyState: string;
};

const REAL_ESTATE_VOCAB: PageVocabulary = {
    hubTitle: 'Real Estate Hub',
    hubDescription: 'Manage your property listings, types, and amenities.',
    primaryEntity: 'Property',
    categoryEntity: 'Property Types',
    attributeEntity: 'Amenities',
    categoryPath: '/real-estate/categories',
    attributePath: '/real-estate/attributes',
    studioPath: '/real-estate/new',
    createPath: '/real-estate/new',
    studioCta: 'Property Studio',
    createCta: 'Add Property',
    totalLabel: 'Total Listings',
    activeLabel: 'Active Properties',
    searchPlaceholder: 'Search properties...',
    emptyState: 'No properties found. Click "Add Property" to create one.',
};

export default function RealEstatePage() {
    const { currentProfile, user } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const router = useRouter();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const vocab = REAL_ESTATE_VOCAB;

    const fetchProperties = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        // We reuse the real estate properties API
        const res = await fetch(`/api/real-estate/properties?type=property&${params.toString()}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            setProperties(data);
        }
        setLoading(false);
    }, [search, statusFilter]);

    useEffect(() => { fetchProperties(); }, [fetchProperties]);

    const handleEdit = (p: any) => {
        if (!canMutate) return;
        router.push(`${vocab.studioPath}?id=${encodeURIComponent(p._id)}&type=property`);
    };

    const handleDelete = async (id: string) => {
        if (!canMutate) return;
        if (!confirm('Delete this property listing?')) return;
        await fetch(`/api/real-estate/properties/${id}`, { method: 'DELETE' });
        fetchProperties();
    };

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        sold: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        rented: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-white mb-1">{vocab.hubTitle}</h2>
                    <p className="text-slate-400 text-sm">{vocab.hubDescription}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Link href={canMutate ? vocab.createPath : '#'}
                        onClick={(event) => { if (!canMutate) event.preventDefault(); }}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-cyan-500 text-black px-4 py-2.5 rounded-lg text-sm font-black hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] shadow-cyan-500/20">
                        <Plus size={16} /> {vocab.createCta}
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: Building2, label: vocab.totalLabel, value: properties.length, color: 'cyan', iconColor: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/30' },
                    { icon: Home, label: vocab.activeLabel, value: properties.filter(p => p.status === 'active').length, color: 'emerald', iconColor: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
                    { icon: Star, label: 'Featured', value: properties.filter(p => p.featured).length, color: 'purple', iconColor: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
                    { icon: MapPin, label: 'Locations', value: new Set(properties.map(p => p.location)).size, color: 'amber', iconColor: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/30' },
                ].map(({ icon: Icon, label, value, iconColor, bgColor, borderColor }) => (
                    <div key={label} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:border-slate-700 transition-colors group">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-lg ${bgColor} border ${borderColor} flex items-center justify-center ${iconColor} group-hover:scale-110 transition-transform`}>
                                <Icon size={18} />
                            </div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">{label}</span>
                        </div>
                        <div className="text-3xl font-black text-white tracking-tight">{value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={vocab.searchPlaceholder}
                        className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-medium" />
                </div>
                <div className="flex flex-wrap gap-2">
                    {['', 'active', 'draft', 'sold', 'rented'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${statusFilter === s ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700 hover:text-slate-300'}`}>
                            {s || 'All Status'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Property Table */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="text-center py-24">
                        <Package size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                        <p className="text-slate-500 text-sm font-medium">{vocab.emptyState}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-800 bg-black/40">
                                    <th className="w-[40%] text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{vocab.primaryEntity}</th>
                                    <th className="w-[20%] text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Location</th>
                                    <th className="w-[15%] text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Price</th>
                                    <th className="w-[12%] text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Status</th>
                                    <th className="w-[13%] text-right px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {properties.map((p) => (
                                    <tr key={p._id} className="hover:bg-slate-800/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col min-w-0">
                                                <div className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors" title={p.name}>{p.name}</div>
                                                <div className="text-[10px] text-slate-500 mt-1 truncate uppercase tracking-widest font-mono">
                                                    {p.categoryNames?.join(' • ') || 'Uncategorized'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <MapPin size={12} className="text-slate-600 flex-shrink-0" />
                                                <span className="truncate">{p.location || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-emerald-400 font-black tracking-tight">
                                                ${typeof p.price === 'number' ? p.price.toLocaleString() : p.price || '0'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] uppercase tracking-[0.15em] font-black border ${statusColors[p.status] || statusColors.draft}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => handleEdit(p)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-cyan-400 transition-colors" title="Edit">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(p._id)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-rose-400 transition-colors" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
