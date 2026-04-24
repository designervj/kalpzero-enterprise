'use client';

import { useEffect, useMemo, useState } from 'react';
import { 
  Users, 
  Search, 
  RefreshCw, 
  Save, 
  Pencil, 
  Archive, 
  Shield, 
  Zap, 
  Globe, 
  Mail, 
  Phone, 
  Briefcase, 
  CreditCard, 
  Calendar,
  Sparkles,
  Terminal,
  UserPlus,
  Filter,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type CustomerStatus = 'active' | 'inactive' | 'archived';

type CustomerRecord = {
    _id: string;
    fullName?: string;
    email?: string;
    phone?: string;
    status?: CustomerStatus;
    source?: string;
    lifecycle?: {
        firstSeenAt?: string;
        lastSeenAt?: string;
        totalOrders?: number;
        totalInvoices?: number;
        totalBookings?: number;
    };
    profile?: {
        context?: string;
        profile?: {
            passportNumber?: string;
            nationality?: string;
            passportExpiry?: string;
        };
    } | null;
};

type ContextValue = 'all' | 'travel' | 'commerce' | 'education';

const CONTEXT_OPTIONS: Array<{ value: ContextValue; label: string }> = [
    { value: 'all', label: 'All Contexts' },
    { value: 'travel', label: 'Travel' },
    { value: 'commerce', label: 'Commerce' },
    { value: 'education', label: 'Education' },
];

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'archived', label: 'Archived' },
];

type CustomerFormState = {
    fullName: string;
    email: string;
    phone: string;
    source: string;
    status: CustomerStatus;
    entryContext: ContextValue;
    passportNumber: string;
    nationality: string;
    passportExpiry: string;
};

function normalizeContextKey(value: string): string {
    return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function emptyForm(defaultContext: ContextValue): CustomerFormState {
    return {
        fullName: '',
        email: '',
        phone: '',
        source: '',
        status: 'active',
        entryContext: defaultContext,
        passportNumber: '',
        nationality: '',
        passportExpiry: '',
    };
}

function toNumber(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

interface CustomersWorkspaceProps {
    title?: string;
    subtitle?: string;
    defaultContext?: ContextValue;
}

export function CustomersWorkspace({
    title = 'Customer Core',
    subtitle = 'Shared customer repository with context-aware profiles and lifecycle analytics.',
    defaultContext = 'all',
}: CustomersWorkspaceProps) {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [listContext, setListContext] = useState<ContextValue>(defaultContext);
    const [customers, setCustomers] = useState<CustomerRecord[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<CustomerFormState>(emptyForm(defaultContext));
    const [isFormVisible, setIsFormVisible] = useState(false);

    const activeContextFilter = listContext === 'all' ? '' : normalizeContextKey(listContext);
    const entryContext = form.entryContext === 'all' ? '' : normalizeContextKey(form.entryContext);
    const showTravelProfileFields = normalizeContextKey(form.entryContext) === 'travel';

    const loadCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (query.trim()) params.set('search', query.trim());
            if (statusFilter) params.set('status', statusFilter);
            if (activeContextFilter) params.set('context', activeContextFilter);

            const res = await fetch(`/api/customers?${params.toString()}`);
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadCustomers();
    }, [activeContextFilter, statusFilter]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadCustomers();
        }, 250);
        return () => clearTimeout(timer);
    }, [query]);

    const summary = useMemo(() => {
        const total = customers.length;
        const active = customers.filter(customer => (customer.status || 'active') === 'active').length;
        const inactive = customers.filter(customer => customer.status === 'inactive').length;
        const archived = customers.filter(customer => customer.status === 'archived').length;
        return { total, active, inactive, archived };
    }, [customers]);

    const resetEditor = () => {
        setEditingId(null);
        setForm(emptyForm(defaultContext));
        setIsFormVisible(false);
    };

    const handleEdit = async (customer: CustomerRecord) => {
        if (!canMutate) return;
        setEditingId(customer._id);
        setIsFormVisible(true);
        const nextContext = listContext === 'all' ? 'all' : listContext;
        const nextForm = {
            fullName: customer.fullName || '',
            email: customer.email || '',
            phone: customer.phone || '',
            source: customer.source || '',
            status: (customer.status || 'active') as CustomerStatus,
            entryContext: nextContext,
            passportNumber: customer.profile?.profile?.passportNumber || '',
            nationality: customer.profile?.profile?.nationality || '',
            passportExpiry: customer.profile?.profile?.passportExpiry || '',
        } satisfies CustomerFormState;

        if (nextContext !== 'travel') {
            setForm(nextForm);
            return;
        }

        const profileRes = await fetch(`/api/customers/${customer._id}/profiles/travel`);
        if (!profileRes.ok) {
            setForm(nextForm);
            return;
        }
        const profilePayload = await profileRes.json();
        const profileData = profilePayload?.profile?.profile || {};
        setForm({
            ...nextForm,
            passportNumber: typeof profileData.passportNumber === 'string' ? profileData.passportNumber : nextForm.passportNumber,
            nationality: typeof profileData.nationality === 'string' ? profileData.nationality : nextForm.nationality,
            passportExpiry: typeof profileData.passportExpiry === 'string' ? profileData.passportExpiry : nextForm.passportExpiry,
            entryContext: 'travel',
        });
    };

    const handleArchive = async (customerId: string) => {
        if (!canMutate) return;
        if (!confirm('Archive this customer?')) return;
        await fetch(`/api/customers/${customerId}`, { method: 'DELETE' });
        if (editingId === customerId) resetEditor();
        await loadCustomers();
    };

    const saveProfileContext = async (customerId: string) => {
        if (!showTravelProfileFields) return;
        await fetch(`/api/customers/${customerId}/profiles/travel`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profile: {
                    passportNumber: form.passportNumber,
                    nationality: form.nationality,
                    passportExpiry: form.passportExpiry,
                },
            }),
        });
    };

    const handleSubmit = async () => {
        if (!canMutate) return;
        setSaving(true);
        try {
            const payload = {
                fullName: form.fullName,
                email: form.email,
                phone: form.phone,
                source: form.source,
                status: form.status,
                context: entryContext || undefined,
                profile: showTravelProfileFields
                    ? {
                        passportNumber: form.passportNumber,
                        nationality: form.nationality,
                        passportExpiry: form.passportExpiry,
                    }
                    : undefined,
            };

            if (editingId) {
                const updateRes = await fetch(`/api/customers/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!updateRes.ok) return;
                await saveProfileContext(editingId);
            } else {
                const createRes = await fetch('/api/customers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!createRes.ok) return;
            }

            resetEditor();
            await loadCustomers();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-12 mt-4 relative z-10">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-fuchsia-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            {/* Read-only Alert */}
            {!canMutate && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-[1.5rem] border border-amber-500/30 bg-amber-500/5 backdrop-blur-md px-6 py-4 flex items-center gap-4 text-xs font-bold text-amber-200/80 shadow-lg"
                >
                    <Shield size={16} className="text-amber-500" />
                    {isScopedRoleView ? 'SCOPED ROLE ACCESS: Customer mutations restricted. Switch permissions for full control.' : 'READ-ONLY PROTOCOL: Customer lifecycle modification disabled for current role.'}
                </motion.div>
            )}

            {/* Premium Header */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="px-10 py-12 border border-slate-800/50 bg-slate-900/40 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-black/20"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="p-5 bg-violet-500/10 rounded-[2rem] border border-violet-500/20 shadow-xl shadow-violet-500/5">
                            <Users className="w-12 h-12 text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter text-white leading-none">
                                {title.split(' ')[0]} <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{title.split(' ').slice(1).join(' ')}</span>
                            </h1>
                            <p className="text-slate-400 mt-4 text-lg font-medium max-w-xl leading-relaxed">
                                {subtitle}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            className="group h-14 px-8 bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-sm transition-all duration-300 flex items-center gap-4 rounded-2xl overflow-hidden relative"
                            onClick={() => void loadCustomers()}
                        >
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <RefreshCw size={20} className={cn(loading && 'animate-spin', "text-violet-400")} /> Sync Matrix
                        </button>
                        {canMutate && (
                            <button
                                className="group h-14 px-10 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(139,92,246,0.3)]"
                                onClick={() => {
                                    resetEditor();
                                    setIsFormVisible(true);
                                }}
                            >
                                <UserPlus size={22} strokeWidth={3} /> Onboard Identity
                            </button>
                        )}
                    </div>
                </div>
            </motion.header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Identities Indexed', value: summary.total, color: 'violet' },
                    { label: 'Active Sessions', value: summary.active, color: 'emerald', dot: true },
                    { label: 'Inactive Nodes', value: summary.inactive, color: 'amber' },
                    { label: 'Archived Storage', value: summary.archived, color: 'slate' }
                ].map((stat, idx) => (
                    <motion.div 
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="bg-slate-900/30 backdrop-blur-md p-6 rounded-[2rem] border border-slate-800/50 shadow-lg group hover:bg-slate-900/40 transition-all"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</span>
                            {stat.dot && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                        </div>
                        <div className={cn(
                            "text-4xl font-black tracking-tighter transition-all group-hover:scale-110 group-hover:translate-x-1 origin-left",
                            stat.color === 'violet' ? 'text-violet-400' : 
                            stat.color === 'emerald' ? 'text-emerald-400' : 
                            stat.color === 'amber' ? 'text-amber-400' : 'text-slate-500'
                        )}>{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Identity Configuration Form (Animated) */}
            <AnimatePresence>
                {isFormVisible && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 48 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-slate-900/40 backdrop-blur-3xl p-10 border border-slate-800 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="h-16 w-16 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center text-violet-400 shadow-lg shadow-violet-500/5">
                                        <Briefcase size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">
                                            {editingId ? 'Modify Identity Parameters' : 'Register New Identity'}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Configure profile specifications and context-aware permissions.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={resetEditor}
                                    className="h-12 w-12 bg-slate-950/50 border border-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center rounded-xl group"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Full Designation</Label>
                                    <Input value={form.fullName} onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="EX: ALEXANDER KROSS" className="bg-slate-950/50 border-slate-800 h-14 rounded-xl text-white font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Communication Uplink (Email)</Label>
                                    <Input value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="EX: A.KROSS@NEURAL.NET" className="bg-slate-950/50 border-slate-800 h-14 rounded-xl text-violet-400 font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Voice Interface (Phone)</Label>
                                    <Input value={form.phone} onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" className="bg-slate-950/50 border-slate-800 h-14 rounded-xl text-white font-bold" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Source Origin</Label>
                                    <Input value={form.source} onChange={(e) => setForm(p => ({ ...p, source: e.target.value }))} placeholder="EX: ORGANIC SEARCH" className="bg-slate-950/50 border-slate-800 h-14 rounded-xl text-white font-bold" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Sector Context</Label>
                                    <select 
                                        value={form.entryContext} 
                                        onChange={(e) => setForm(p => ({ ...p, entryContext: e.target.value as ContextValue }))}
                                        disabled={defaultContext !== 'all'}
                                        className="w-full bg-slate-950/50 border border-slate-800 text-white h-14 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] focus:border-violet-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        {CONTEXT_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Matrix Status</Label>
                                    <select 
                                        value={form.status} 
                                        onChange={(e) => setForm(p => ({ ...p, status: e.target.value as CustomerStatus }))}
                                        className="w-full bg-slate-950/50 border border-slate-800 text-white h-14 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] focus:border-violet-500/50 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="active" className="bg-slate-900">OPERATIONAL</option>
                                        <option value="inactive" className="bg-slate-900">INACTIVE</option>
                                        <option value="archived" className="bg-slate-900">ARCHIVED</option>
                                    </select>
                                </div>
                            </div>

                            {showTravelProfileFields && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-violet-500/5 border border-violet-500/10 rounded-[2rem]"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-violet-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                                            <CreditCard size={12} /> Passport Serial
                                        </Label>
                                        <Input value={form.passportNumber} onChange={(e) => setForm(p => ({ ...p, passportNumber: e.target.value }))} placeholder="EX: A1234567" className="bg-slate-950/50 border-violet-500/20 h-14 rounded-xl text-white font-mono" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-violet-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                                            <Globe size={12} /> Sovereignty (Nationality)
                                        </Label>
                                        <Input value={form.nationality} onChange={(e) => setForm(p => ({ ...p, nationality: e.target.value }))} placeholder="EX: UNITED KINGDOM" className="bg-slate-950/50 border-violet-500/20 h-14 rounded-xl text-white font-bold" />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-violet-400 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
                                            <Calendar size={12} /> Expiry Sequence
                                        </Label>
                                        <Input type="date" value={form.passportExpiry} onChange={(e) => setForm(p => ({ ...p, passportExpiry: e.target.value }))} className="bg-slate-950/50 border-violet-500/20 h-14 rounded-xl text-white font-bold" />
                                    </div>
                                </motion.div>
                            )}

                            <div className="flex justify-end gap-5 pt-8 border-t border-slate-800/50">
                                <button
                                    type="button"
                                    onClick={resetEditor}
                                    className="px-8 h-14 text-xs font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all"
                                >
                                    Abort Operation
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving || !canMutate}
                                    className="px-10 h-14 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-violet-900/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <RefreshCw size={18} className="animate-spin" /> : editingId ? <Save size={18} /> : <Zap size={18} fill="currentColor" />}
                                    {saving ? 'Processing...' : editingId ? 'Update Identity' : 'Initialize Identity'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Registry Controls & Filters */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-slate-900/30 backdrop-blur-md p-8 rounded-[2.5rem] border border-slate-800/50 shadow-2xl"
            >
                <div className="relative w-full xl:w-[500px] group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-violet-400 transition-colors duration-300" size={20} />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="IDENTIFY BY NAME, EMAIL, OR UPLINK..."
                        className="w-full h-16 pl-16 pr-8 bg-slate-950/50 border-slate-800 rounded-2xl text-sm font-bold tracking-tight text-white placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 outline-none transition-all duration-300 shadow-inner"
                    />
                </div>
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                        <Filter size={16} className="text-slate-500" />
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-[10px] font-black text-slate-300 uppercase tracking-widest outline-none cursor-pointer"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value || 'all'} value={opt.value} className="bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                        <Globe size={16} className="text-slate-500" />
                        <select 
                            value={listContext} 
                            onChange={(e) => setListContext(e.target.value as ContextValue)}
                            disabled={defaultContext !== 'all'}
                            className="bg-transparent text-[10px] font-black text-slate-300 uppercase tracking-widest outline-none cursor-pointer disabled:opacity-50"
                        >
                            {CONTEXT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </motion.div>

            {/* Registry Table */}
            {loading ? (
                <div className="h-80 flex flex-col items-center justify-center gap-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[3rem]">
                    <div className="h-12 w-12 border-4 border-slate-800 border-t-violet-500 rounded-full animate-spin shadow-lg shadow-violet-500/20" />
                    <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 italic animate-pulse">
                        Synchronizing Identity Matrix...
                    </span>
                </div>
            ) : customers.length === 0 ? (
                <div className="h-80 flex flex-col items-center justify-center gap-8 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[3rem] opacity-20 group">
                    <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 group-hover:scale-110 transition-transform duration-500">
                        <Users size={64} className="text-slate-400" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.5em] text-slate-500">
                        No Identity Clusters Detected
                    </span>
                </div>
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[1rem] overflow-hidden shadow-2xl shadow-black/40"
                >
                    <Table>
                        <TableHeader className="bg-slate-900/60 border-b border-slate-800/50 h-20">
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-10">Identity</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Uplink (Contact)</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Lifecycle Analytics</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Profile Data</TableHead>
                                <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Status</TableHead>
                                <TableHead className="text-right text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-10">Control</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => {
                                const lifecycle = customer.lifecycle || {};
                                const status = customer.status || 'active';
                                
                                return (
                                    <TableRow key={customer._id} className="group border-slate-800/40 hover:bg-violet-500/[0.03] transition-all duration-300">
                                        <TableCell className="px-10 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center border border-slate-800 text-violet-400 group-hover:scale-110 transition-transform duration-300">
                                                    <Shield size={20} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-base font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors">{customer.fullName || 'UNNAMED NODE'}</div>
                                                    <div className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">{customer._id}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                                                    <Mail size={12} className="text-violet-500/50" /> {customer.email || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                                                    <Phone size={10} className="text-slate-600" /> {customer.phone || '—'}
                                                </div>
                                                <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 w-fit">
                                                    <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Source: {customer.source || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                <div className="text-[10px] font-bold text-slate-500">ORDERS: <span className="text-white ml-1">{toNumber(lifecycle.totalOrders)}</span></div>
                                                <div className="text-[10px] font-bold text-slate-500">INVOICES: <span className="text-white ml-1">{toNumber(lifecycle.totalInvoices)}</span></div>
                                                <div className="text-[10px] font-bold text-slate-500">BOOKINGS: <span className="text-white ml-1">{toNumber(lifecycle.totalBookings)}</span></div>
                                                <div className="text-[9px] text-violet-500/60 font-black uppercase mt-1">
                                                    LAST SEEN: {lifecycle.lastSeenAt ? new Date(lifecycle.lastSeenAt).toLocaleDateString() : 'N/A'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                                    <CreditCard size={10} /> {customer.profile?.profile?.passportNumber || '—'}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                    <Globe size={10} /> {customer.profile?.profile?.nationality || '—'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className={cn(
                                                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
                                                status === 'active' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                                                status === 'inactive' ? 'bg-amber-500/5 border-amber-500/20 text-amber-400' :
                                                'bg-slate-500/5 border-slate-500/20 text-slate-400'
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", status === 'active' ? 'bg-emerald-500 animate-pulse' : status === 'inactive' ? 'bg-amber-500' : 'bg-slate-500')}></div>
                                                {status}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-10">
                                            {canMutate && (
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button 
                                                        onClick={() => void handleEdit(customer)}
                                                        className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-violet-400 hover:border-violet-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-violet-500/10"
                                                        title="Calibrate Identity"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => void handleArchive(customer._id)}
                                                        className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-rose-500/10"
                                                        title="Purge Identity"
                                                    >
                                                        <Archive size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </motion.div>
            )}

            {/* Premium Footer Intel */}
            <motion.footer 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="flex items-center justify-center gap-6 py-12"
            >
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
                <div className="flex items-center gap-4 px-6 py-2.5 bg-slate-900/40 rounded-full border border-slate-800/50 backdrop-blur-sm">
                    <Terminal size={16} className="text-violet-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
                        Executive Console: Sector 7-G | Identity Integrity: Verified
                    </span>
                    <Sparkles size={14} className="text-violet-500/40" />
                </div>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
            </motion.footer>
        </div>
    );
}

