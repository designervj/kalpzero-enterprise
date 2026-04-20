'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Truck, CreditCard, Plus, Package, Tag, Search, Pencil, Trash2, X, Save, Eye, RefreshCw, Building2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductImportModal } from '@/components/products/ProductImportModal';
import { isEducationContextActive, isTravelContextActive } from '@/lib/business-context';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';
import {
    PRODUCT_TEMPLATE_OPTIONS,
    getProductTemplateLabel,
    normalizeProductTemplateKey,
} from '@/lib/commerce-template-options';

type NavOverride = {
    label?: string;
    path?: string;
};

type VocabularyTerms = {
    catalogPlural?: string;
    catalogSingular?: string;
    categories?: string;
    attributes?: string;
    orders?: string;
};

type AnalyticsSummary = {
    activeBusinessContexts?: string[];
    businessType?: string;
    isTravelContext?: boolean;
    navigationOverrides?: Record<string, NavOverride>;
    vocabularyProfile?: { terms?: VocabularyTerms };
};

type PageVocabulary = {
    hubTitle: string;
    hubDescription: string;
    primaryEntity: string;
    categoryEntity: string;
    orderEntity: string;
    categoryPath: string;
    orderPath: string;
    studioPath: string;
    createPath: string;
    studioCta: string;
    createCta: string;
    totalLabel: string;
    activeLabel: string;
    variantsLabel: string;
    stockLabel: string;
    searchPlaceholder: string;
    emptyState: string;
    variantsColumnLabel: string;
    stockColumnLabel: string;
};

const DEFAULT_VOCAB: PageVocabulary = {
    hubTitle: 'E-Commerce Hub',
    hubDescription: 'Manage your product catalog, orders, and categories.',
    primaryEntity: 'Product',
    categoryEntity: 'Categories',
    orderEntity: 'Orders',
    categoryPath: '/ecommerce/categories',
    orderPath: '/ecommerce/orders',
    studioPath: '/ecommerce/products/new',
    createPath: '/ecommerce/products/new',
    studioCta: 'Product Studio',
    createCta: 'Add Product',
    totalLabel: 'Total Products',
    activeLabel: 'Active SKUs',
    variantsLabel: 'Total Variants',
    stockLabel: 'Total Stock',
    searchPlaceholder: 'Search products...',
    emptyState: 'No products found. Click "Add Product" to create one.',
    variantsColumnLabel: 'Variants',
    stockColumnLabel: 'Stock',
};

const EDUCATION_VOCAB: PageVocabulary = {
    hubTitle: 'Program Management Hub',
    hubDescription: 'Manage your program catalog, enrollments, and curriculum.',
    primaryEntity: 'Program',
    categoryEntity: 'Curriculum',
    orderEntity: 'Enrollments',
    categoryPath: '/ecommerce/categories',
    orderPath: '/ecommerce/orders',
    studioPath: '/ecommerce/products/new',
    createPath: '/ecommerce/products/new',
    studioCta: 'Program Studio',
    createCta: 'Add Program',
    totalLabel: 'Total Programs',
    activeLabel: 'Active Programs',
    variantsLabel: 'Total Batches',
    stockLabel: 'Available Seats',
    searchPlaceholder: 'Search programs...',
    emptyState: 'No programs found. Click "Add Program" to create one.',
    variantsColumnLabel: 'Batches',
    stockColumnLabel: 'Seats',
};

const TRAVEL_VOCAB: PageVocabulary = {
    hubTitle: 'Travel Package Hub',
    hubDescription: 'Manage packages, hotels, activities, and booking orders.',
    primaryEntity: 'Travel Package',
    categoryEntity: 'Hotels',
    orderEntity: 'Orders',
    categoryPath: '/travel/catalog/hotels',
    orderPath: '/ecommerce/orders',
    studioPath: '/travel/packages/new',
    createPath: '/travel/packages/new',
    studioCta: 'Package Studio',
    createCta: 'Add Package',
    totalLabel: 'Total Packages',
    activeLabel: 'Active Packages',
    variantsLabel: 'Itinerary Variants',
    stockLabel: 'Available Slots',
    searchPlaceholder: 'Search packages...',
    emptyState: 'No packages found. Click "Add Package" to create one.',
    variantsColumnLabel: 'Days',
    stockColumnLabel: 'Slots',
};

const PRODUCT_LISTING_DESCRIPTION_MAX = 180;

function toProductListingExcerpt(value: unknown, max = PRODUCT_LISTING_DESCRIPTION_MAX): string {
    if (typeof value !== 'string') return '';
    const plain = value
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!plain) return '';
    if (plain.length <= max) return plain;
    return `${plain.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function readTenantKeyFromCookie(): string {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|; )kalp_active_tenant=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function buildVocabulary(summary: AnalyticsSummary | null): PageVocabulary {
    if (!summary) return DEFAULT_VOCAB;

    const contexts = Array.isArray(summary.activeBusinessContexts)
        ? summary.activeBusinessContexts.filter((item): item is string => typeof item === 'string')
        : [];
    const navigationOverrides = summary.navigationOverrides || {};
    const terms = summary.vocabularyProfile?.terms || {};
    const productsOverride = navigationOverrides['nav.products'] || {};
    const categoriesOverride = navigationOverrides['nav.products.categories'] || {};
    const ordersOverride = navigationOverrides['nav.ecommerce.orders'] || {};
    const travelContext = Boolean(summary.isTravelContext) || isTravelContextActive(contexts);
    const educationContext = isEducationContextActive(contexts) && !travelContext;
    const base = travelContext ? TRAVEL_VOCAB : educationContext ? EDUCATION_VOCAB : DEFAULT_VOCAB;
    const productsPath = productsOverride.path?.trim() || '';
    let studioPath = base.studioPath;
    if (productsPath.startsWith('/travel/packages')) {
        studioPath = '/travel/packages/new';
    } else if (productsPath.startsWith('/ecommerce')) {
        studioPath = '/ecommerce/products/new';
    } else if (productsPath) {
        studioPath = `${productsPath.replace(/\/$/, '')}/new`;
    }

    return {
        ...base,
        primaryEntity: terms.catalogSingular?.trim() || base.primaryEntity,
        categoryEntity: categoriesOverride.label?.trim() || terms.categories?.trim() || base.categoryEntity,
        orderEntity: ordersOverride.label?.trim() || terms.orders?.trim() || base.orderEntity,
        categoryPath: categoriesOverride.path?.trim() || base.categoryPath,
        orderPath: ordersOverride.path?.trim() || base.orderPath,
        studioPath,
        createPath: studioPath,
    };
}

export default function EcommercePage() {
    const { currentProfile, isScopedRoleView, user } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: '', sku: '', price: '', description: '', status: 'active' });
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
    const [previewTemplateByProductId, setPreviewTemplateByProductId] = useState<Record<string, string>>({});
    const [backfillBusy, setBackfillBusy] = useState(false);
    const [backfillStatus, setBackfillStatus] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/ecommerce/products?${params.toString()}`);
        const data = await res.json();
        if (Array.isArray(data)) {
            setProducts(data);
            setPreviewTemplateByProductId((prev) => {
                const next = { ...prev };
                for (const row of data) {
                    if (!row?._id || typeof row._id !== 'string') continue;
                    if (!next[row._id]) {
                        next[row._id] = normalizeProductTemplateKey(row.templateKey);
                    }
                }
                return next;
            });
        }
        setLoading(false);
    }, [search, statusFilter]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    useEffect(() => {
        fetch('/api/analytics/summary')
            .then(res => res.json())
            .then(data => {
                setSummary(data as AnalyticsSummary);
            })
            .catch(() => {
                setSummary(null);
            });
    }, []);

    const resetForm = () => { setForm({ name: '', sku: '', price: '', description: '', status: 'active' }); setEditingId(null); setShowForm(false); };

    const handleSubmit = async () => {
        if (!canMutate) return;
        const payload = { name: form.name, sku: form.sku, price: parseFloat(form.price) || 0, description: form.description, status: form.status };
        if (editingId) {
            await fetch(`/api/ecommerce/products/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetch('/api/ecommerce/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        resetForm();
        fetchProducts();
    };

    const handleEdit = (p: any) => {
        if (!canMutate) return;
        const studioPath = buildVocabulary(summary).studioPath || '/ecommerce/products/new';
        router.push(`${studioPath}?id=${encodeURIComponent(p._id)}`);
    };

    const handleDelete = async (id: string) => {
        if (!canMutate) return;
        if (!confirm('Delete this product and all its variants?')) return;
        await fetch(`/api/ecommerce/products/${id}`, { method: 'DELETE' });
        fetchProducts();
    };

    const openTemplatePreview = (product: any) => {
        const tenantKey = readTenantKeyFromCookie() || (typeof user?.tenantKey === 'string' ? user.tenantKey : '');
        if (!tenantKey) {
            alert('Active tenant key not found.');
            return;
        }
        const slug = typeof product?.slug === 'string' ? product.slug.trim() : '';
        if (!slug) {
            const shouldBackfill = confirm('Product slug not available. This prevents public preview. Would you like to attempt a slug backfill now?');
            if (shouldBackfill) {
                handleSlugBackfill();
            }
            return;
        }
        const selectedTemplate = normalizeProductTemplateKey(
            previewTemplateByProductId[product._id] || product.templateKey
        );
        const encodedSlug = encodeURIComponent(`${tenantKey}--${slug}`);
        const url = `/product/${encodedSlug}?tenant=${encodeURIComponent(tenantKey)}&preview=1&previewTemplate=${encodeURIComponent(selectedTemplate)}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleSlugBackfill = async () => {
        if (!canMutate || backfillBusy) return;
        setBackfillStatus('');
        setBackfillBusy(true);
        try {
            const dryRunRes = await fetch('/api/ecommerce/products/backfill-slugs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dryRun: true }),
            });
            const dryRunPayload = await dryRunRes.json().catch(() => ({}));
            if (!dryRunRes.ok) {
                const message = typeof dryRunPayload?.error === 'string' ? dryRunPayload.error : 'Dry-run failed.';
                throw new Error(message);
            }
            const affected = Number(dryRunPayload?.affected || 0);
            if (affected <= 0) {
                setBackfillStatus('No missing product slugs detected.');
                return;
            }
            const shouldApply = confirm(`Slug backfill will update ${affected} product record(s). Continue?`);
            if (!shouldApply) {
                setBackfillStatus(`Backfill cancelled. ${affected} product(s) still missing slug.`);
                return;
            }

            const applyRes = await fetch('/api/ecommerce/products/backfill-slugs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dryRun: false }),
            });
            const applyPayload = await applyRes.json().catch(() => ({}));
            if (!applyRes.ok) {
                const message = typeof applyPayload?.error === 'string' ? applyPayload.error : 'Backfill apply failed.';
                throw new Error(message);
            }

            const applied = Number(applyPayload?.applied || 0);
            const collisions = Number(applyPayload?.collisionsResolved || 0);
            setBackfillStatus(`Slug backfill complete: ${applied} updated${collisions > 0 ? `, ${collisions} collisions resolved` : ''}.`);
            fetchProducts();
        } catch (error: unknown) {
            setBackfillStatus(error instanceof Error ? error.message : 'Slug backfill failed.');
        } finally {
            setBackfillBusy(false);
        }
    };

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'active').length;
    const totalStock = products.reduce((sum, p) => sum + (p.totalStock || 0), 0);
    const totalVariants = products.reduce((sum, p) => sum + (p.variantCount || 0), 0);
    const vocab = buildVocabulary(summary);

    const statusColors: Record<string, string> = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to create or edit commerce records.' : 'This role is read-only for commerce mutations.'}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-1">{vocab.hubTitle}</h2>
                    <p className="text-slate-400 text-sm">{vocab.hubDescription}</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={canMutate ? vocab.studioPath : '#'} aria-disabled={!canMutate} onClick={(event) => { if (!canMutate) event.preventDefault(); }} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                        <Plus size={16} /> {vocab.studioCta}
                    </Link>
                    <button
                        type="button"
                        onClick={handleSlugBackfill}
                        disabled={!canMutate || backfillBusy}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                        title="Generate slugs for legacy products missing public slug"
                    >
                        <RefreshCw size={16} className={backfillBusy ? 'animate-spin' : ''} />
                        {backfillBusy ? 'Backfilling...' : 'Backfill Slugs'}
                    </button>
                    <Link href={vocab.categoryPath} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                        <Tag size={16} /> {vocab.categoryEntity}
                    </Link>
                    <Link href={vocab.orderPath} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700">
                        <Truck size={16} /> {vocab.orderEntity}
                    </Link>
                    <Link href="/real-estate" className="flex items-center gap-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                        <Building2 size={16} /> Real Estate
                    </Link>
                    <Link href={canMutate ? vocab.createPath : '#'}
                        aria-disabled={!canMutate}
                        onClick={(event) => { if (!canMutate) event.preventDefault(); }}
                        className="flex items-center gap-2 bg-cyan-500 text-black px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                        <Plus size={16} /> {vocab.createCta}
                    </Link>
                    {canMutate && (
                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                        >
                            <Upload size={16} /> Import JSON
                        </button>
                    )}
                </div>
            </div>
            {backfillStatus && (
                <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                    {backfillStatus}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { icon: ShoppingBag, label: vocab.totalLabel, value: totalProducts, color: 'cyan' },
                    { icon: Package, label: vocab.activeLabel, value: activeProducts, color: 'emerald' },
                    { icon: Tag, label: vocab.variantsLabel, value: totalVariants, color: 'purple' },
                    { icon: CreditCard, label: vocab.stockLabel, value: totalStock.toLocaleString(), color: 'amber' },
                ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-9 h-9 rounded-lg bg-${color}-500/10 border border-${color}-500/30 flex items-center justify-center text-${color}-400`}>
                                <Icon size={18} />
                            </div>
                            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
                        </div>
                        <div className="text-2xl font-black text-white">{value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={vocab.searchPlaceholder}
                        className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
                </div>
                <div className="flex gap-2">
                    {['', 'active', 'draft', 'archived'].map(s => (
                        <button key={s} onClick={() => setStatusFilter(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                            {s || 'All'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">{editingId ? `Edit ${vocab.primaryEntity}` : `Create New ${vocab.primaryEntity}`}</h3>
                        <button onClick={resetForm} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="col-span-2">
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">{vocab.primaryEntity} Name</label>
                            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" placeholder={`e.g. Premium ${vocab.primaryEntity}`} />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">SKU</label>
                            <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-cyan-500/50" placeholder="SKU-001" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Price</label>
                            <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" placeholder="0.00" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Description</label>
                            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none" placeholder={`${vocab.primaryEntity} description...`} />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSubmit}
                        disabled={!canMutate}
                        className="flex items-center gap-2 bg-emerald-500 text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all">
                        <Save size={14} /> {editingId ? `Update ${vocab.primaryEntity}` : `Create ${vocab.primaryEntity}`}
                    </button>
                </div>
            )}

            {/* Product Table */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-sm">{vocab.emptyState}</div>
                ) : (
                    <table className="w-full table-fixed">
                        <thead>
                            <tr className="border-b border-slate-800 bg-black/30">
                                <th className="w-[42%] text-left px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{vocab.primaryEntity}</th>
                                <th className="w-[12%] text-left px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">SKU</th>
                                <th className="w-[9%] text-left px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Price</th>
                                <th className="w-[8%] text-left px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{vocab.variantsColumnLabel}</th>
                                <th className="w-[8%] text-left px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">{vocab.stockColumnLabel}</th>
                                <th className="w-[8%] text-left px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Status</th>
                                <th className="w-[13%] text-right px-6 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p) => {
                                const descriptionExcerpt = toProductListingExcerpt(p.description);
                                const templateSnapshotKey = normalizeProductTemplateKey(p.templateKey);
                                const selectedPreviewTemplate = normalizeProductTemplateKey(
                                    previewTemplateByProductId[p._id] || templateSnapshotKey
                                );
                                return (
                                <tr key={p._id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <div className="font-semibold text-white text-sm truncate max-w-[680px]" title={p.name}>{p.name}</div>
                                            {!p.slug && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleSlugBackfill(); }}
                                                    className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[9px] text-amber-500 font-bold uppercase tracking-wider animate-pulse hover:bg-amber-500/20 transition-colors"
                                                    title="Missing slug! Click to backfill."
                                                >
                                                    Fix Slug
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 truncate max-w-[680px]" title={descriptionExcerpt || ''}>
                                            {descriptionExcerpt || '—'}
                                        </div>
                                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                                            <span className="uppercase tracking-widest text-slate-500">Template snapshot:</span>
                                            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                                                {getProductTemplateLabel(templateSnapshotKey)}
                                            </span>
                                            <span className="font-mono text-[10px] text-slate-500">({templateSnapshotKey})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{p.sku}</td>
                                    <td className="px-6 py-4 text-sm text-emerald-400 font-bold">${p.price?.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-300">{p.variantCount || 0}</td>
                                    <td className="px-6 py-4 text-sm text-slate-300">{(p.totalStock || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${statusColors[p.status] || statusColors.draft}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <select
                                                value={selectedPreviewTemplate}
                                                onChange={(event) => {
                                                    const nextTemplate = normalizeProductTemplateKey(event.target.value);
                                                    setPreviewTemplateByProductId((prev) => ({ ...prev, [p._id]: nextTemplate }));
                                                }}
                                                className="rounded-md border border-slate-700 bg-black/60 px-2 py-1 text-[10px] text-slate-300 focus:border-cyan-500/50 focus:outline-none"
                                                title="Preview template switcher"
                                            >
                                                {PRODUCT_TEMPLATE_OPTIONS.map((template) => (
                                                    <option key={template.key} value={template.key}>
                                                        {template.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => openTemplatePreview(p)}
                                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
                                                title="Preview selected template"
                                            >
                                                <Eye size={14} />
                                            </button>
                                            {p.slug && (
                                                <a
                                                    href={`/product/${encodeURIComponent(user?.tenantKey || 'tenant')}--${p.slug}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                                                    title="View public product page"
                                                >
                                                    <Eye size={14} />
                                                </a>
                                            )}
                                            {canMutate && (
                                                <>
                                                    <button onClick={() => handleEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors" title="Edit">
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p._id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                )}
            </div>

            <ProductImportModal 
                isOpen={isImportModalOpen} 
                onClose={() => setIsImportModalOpen(false)} 
                onSuccess={() => {
                    fetchProducts();
                }}
            />
        </div>
    );
}
