'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, Search, RefreshCw, Save, Pencil, Archive, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';

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
    title = 'Customers',
    subtitle = 'Shared customer core with context-aware profiles and lifecycle counters.',
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
    };

    const handleEdit = async (customer: CustomerRecord) => {
        if (!canMutate) return;
        setEditingId(customer._id);
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

        // If the list is not scoped to travel, fetch travel profile lazily.
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to manage customer records.' : 'This role is read-only for customer mutations.'}
                </div>
            )}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    <Users size={22} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <p className="text-slate-400 text-xs font-mono">{subtitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Total</div>
                    <div className="text-2xl text-white font-black">{summary.total}</div>
                </div>
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Active</div>
                    <div className="text-2xl text-emerald-300 font-black">{summary.active}</div>
                </div>
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Inactive</div>
                    <div className="text-2xl text-amber-300 font-black">{summary.inactive}</div>
                </div>
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Archived</div>
                    <div className="text-2xl text-slate-300 font-black">{summary.archived}</div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
                    {editingId && (
                        <Button variant="ghost" size="sm" onClick={resetEditor}>
                            Cancel Edit
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Input value={form.fullName} onChange={(event) => setForm(prev => ({ ...prev, fullName: event.target.value }))} placeholder="Full name" />
                    <Input value={form.email} onChange={(event) => setForm(prev => ({ ...prev, email: event.target.value }))} placeholder="Email" />
                    <Input value={form.phone} onChange={(event) => setForm(prev => ({ ...prev, phone: event.target.value }))} placeholder="Phone" />
                    <Input value={form.source} onChange={(event) => setForm(prev => ({ ...prev, source: event.target.value }))} placeholder="Source" />
                    <Select value={form.status} onChange={(event) => setForm(prev => ({ ...prev, status: event.target.value as CustomerStatus }))}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="archived">Archived</option>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Select
                        value={form.entryContext}
                        onChange={(event) => setForm(prev => ({ ...prev, entryContext: event.target.value as ContextValue }))}
                        disabled={defaultContext !== 'all'}
                    >
                        {CONTEXT_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </Select>
                    {showTravelProfileFields && (
                        <>
                            <Input
                                value={form.passportNumber}
                                onChange={(event) => setForm(prev => ({ ...prev, passportNumber: event.target.value }))}
                                placeholder="Passport number"
                            />
                            <Input
                                value={form.nationality}
                                onChange={(event) => setForm(prev => ({ ...prev, nationality: event.target.value }))}
                                placeholder="Nationality"
                            />
                            <Input
                                type="date"
                                value={form.passportExpiry}
                                onChange={(event) => setForm(prev => ({ ...prev, passportExpiry: event.target.value }))}
                            />
                        </>
                    )}
                </div>

                <Button onClick={handleSubmit} disabled={saving || !canMutate}>
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : editingId ? <Save size={14} /> : <PlusCircle size={14} />}
                    {saving ? 'Saving...' : editingId ? 'Update Customer' : 'Create Customer'}
                </Button>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full max-w-sm relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search by name, email, phone..."
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-[140px]">
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                        ))}
                    </Select>
                    <Select
                        value={listContext}
                        onChange={(event) => setListContext(event.target.value as ContextValue)}
                        className="w-[170px]"
                        disabled={defaultContext !== 'all'}
                    >
                        {CONTEXT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : customers.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-12 text-center text-sm text-slate-500">
                    No customers found for this filter.
                </div>
            ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Lifecycle</TableHead>
                                <TableHead>Profile</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {customers.map((customer) => {
                                const lifecycle = customer.lifecycle || {};
                                const status = customer.status || 'active';
                                const totalOrders = toNumber(lifecycle.totalOrders);
                                const totalInvoices = toNumber(lifecycle.totalInvoices);
                                const totalBookings = toNumber(lifecycle.totalBookings);

                                return (
                                    <TableRow key={customer._id}>
                                        <TableCell>
                                            <div className="font-medium text-white">{customer.fullName || '—'}</div>
                                            <div className="text-xs text-slate-500 font-mono">{customer._id}</div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-300">
                                            <div>{customer.email || '—'}</div>
                                            <div className="text-xs text-slate-500">{customer.phone || '—'}</div>
                                            <div className="text-[10px] text-slate-600 uppercase tracking-widest mt-1">{customer.source || 'source:n/a'}</div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-400">
                                            <div>Orders: {totalOrders}</div>
                                            <div>Invoices: {totalInvoices}</div>
                                            <div>Bookings: {totalBookings}</div>
                                            <div className="text-slate-600 mt-1">
                                                Last Seen: {lifecycle.lastSeenAt ? new Date(lifecycle.lastSeenAt).toLocaleDateString() : '—'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-400">
                                            <div>Passport: {customer.profile?.profile?.passportNumber || '—'}</div>
                                            <div>Nationality: {customer.profile?.profile?.nationality || '—'}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    status === 'active'
                                                        ? 'text-emerald-200 border-emerald-500/40 bg-emerald-500/10'
                                                        : status === 'inactive'
                                                            ? 'text-amber-200 border-amber-500/40 bg-amber-500/10'
                                                            : 'text-slate-200 border-slate-500/40 bg-slate-500/10'
                                                }
                                            >
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {canMutate && (
                                                <div className="inline-flex items-center gap-1">
                                                    <Button variant="ghost" size="sm" onClick={() => void handleEdit(customer)}>
                                                        <Pencil size={14} />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => void handleArchive(customer._id)}>
                                                        <Archive size={14} />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}
