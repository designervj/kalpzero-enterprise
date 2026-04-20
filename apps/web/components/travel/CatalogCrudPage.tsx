'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';

export type CatalogFieldType = 'text' | 'number' | 'textarea' | 'array';

export interface CatalogFieldConfig {
    key: string;
    label: string;
    type: CatalogFieldType;
    required?: boolean;
    placeholder?: string;
}

interface CatalogCrudPageProps {
    title: string;
    subtitle: string;
    endpoint: string;
    fields: CatalogFieldConfig[];
}

type CatalogRecord = Record<string, unknown> & {
    _id?: string | number | { toString(): string };
};

function emptyFormFromFields(fields: CatalogFieldConfig[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const field of fields) {
        if (field.type === 'number') out[field.key] = 0;
        else if (field.type === 'array') out[field.key] = [];
        else out[field.key] = '';
    }
    return out;
}

function idToString(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object' && 'toString' in value) {
        return value.toString();
    }
    return '';
}

function normalizeFormForSubmit(form: Record<string, unknown>, fields: CatalogFieldConfig[]): Record<string, unknown> {
    const payload: Record<string, unknown> = {};
    for (const field of fields) {
        const value = form[field.key];
        if (field.type === 'number') {
            payload[field.key] = typeof value === 'number' ? value : Number(value) || 0;
        } else if (field.type === 'array') {
            if (Array.isArray(value)) {
                payload[field.key] = value
                    .filter((item): item is string => typeof item === 'string')
                    .map(item => item.trim())
                    .filter(Boolean);
            } else if (typeof value === 'string') {
                payload[field.key] = value
                    .split(',')
                    .map(item => item.trim())
                    .filter(Boolean);
            } else {
                payload[field.key] = [];
            }
        } else {
            payload[field.key] = typeof value === 'string' ? value.trim() : '';
        }
    }
    return payload;
}

function formatCellValue(value: unknown): string {
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    return JSON.stringify(value);
}

export function CatalogCrudPage({ title, subtitle, endpoint, fields }: CatalogCrudPageProps) {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [rows, setRows] = useState<CatalogRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Record<string, unknown>>(() => emptyFormFromFields(fields));

    const listFields = useMemo(() => fields.slice(0, 4), [fields]);

    const fetchRows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(endpoint);
            const data = await res.json();
            setRows(Array.isArray(data) ? data : []);
        } finally {
            setLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchRows();
    }, [fetchRows]);

    const resetForm = () => {
        setForm(emptyFormFromFields(fields));
        setEditingId(null);
        setShowForm(false);
    };

    const openEdit = (row: CatalogRecord) => {
        if (!canMutate) return;
        const next = emptyFormFromFields(fields);
        for (const field of fields) {
            const value = row[field.key];
            if (field.type === 'array') {
                next[field.key] = Array.isArray(value) ? value : [];
            } else if (field.type === 'number') {
                next[field.key] = typeof value === 'number' ? value : Number(value) || 0;
            } else {
                next[field.key] = typeof value === 'string' ? value : '';
            }
        }
        setForm(next);
        setEditingId(idToString(row._id));
        setShowForm(true);
    };

    const save = async () => {
        if (!canMutate) return;
        const payload = normalizeFormForSubmit(form, fields);
        for (const field of fields) {
            if (!field.required) continue;
            const value = payload[field.key];
            if (field.type === 'array') {
                if (!Array.isArray(value) || value.length === 0) {
                    alert(`${field.label} is required.`);
                    return;
                }
            } else if (!value) {
                alert(`${field.label} is required.`);
                return;
            }
        }

        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `${endpoint}/${editingId}` : endpoint;
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || data?.error) {
            alert(data?.error || 'Failed to save.');
            return;
        }
        resetForm();
        await fetchRows();
    };

    const remove = async (id: string) => {
        if (!canMutate) return;
        if (!confirm('Delete this catalog record?')) return;
        const res = await fetch(`${endpoint}/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (!res.ok || data?.error) {
            alert(data?.error || 'Failed to delete.');
            return;
        }
        await fetchRows();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to manage catalog records.' : 'This role is read-only for catalog mutations.'}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
                    <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingId(null); }}
                    disabled={!canMutate}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400"
                >
                    <Plus size={16} />
                    Add Record
                </button>
            </div>

            {showForm && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-white font-semibold">{editingId ? 'Edit Record' : 'Create Record'}</h2>
                        <button onClick={resetForm} className="text-slate-500 hover:text-slate-200"><X size={16} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {fields.map((field) => {
                            const value = form[field.key];
                            const commonClass = 'w-full bg-black/40 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white';

                            if (field.type === 'textarea') {
                                return (
                                    <div key={field.key} className="md:col-span-2">
                                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">{field.label}</label>
                                        <textarea
                                            value={typeof value === 'string' ? value : ''}
                                            onChange={(event) => setForm(prev => ({ ...prev, [field.key]: event.target.value }))}
                                            placeholder={field.placeholder}
                                            className={`${commonClass} min-h-[88px]`}
                                        />
                                    </div>
                                );
                            }

                            if (field.type === 'array') {
                                const textValue = Array.isArray(value) ? value.join(', ') : '';
                                return (
                                    <div key={field.key} className="md:col-span-2">
                                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">{field.label}</label>
                                        <input
                                            value={textValue}
                                            onChange={(event) => setForm(prev => ({
                                                ...prev,
                                                [field.key]: event.target.value
                                                    .split(',')
                                                    .map(item => item.trim())
                                                    .filter(Boolean),
                                            }))}
                                            placeholder={field.placeholder || 'Comma separated values'}
                                            className={commonClass}
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div key={field.key}>
                                    <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">{field.label}</label>
                                    <input
                                        type={field.type === 'number' ? 'number' : 'text'}
                                        value={field.type === 'number' ? String(value ?? 0) : typeof value === 'string' ? value : ''}
                                        onChange={(event) => setForm(prev => ({
                                            ...prev,
                                            [field.key]: field.type === 'number' ? Number(event.target.value) || 0 : event.target.value,
                                        }))}
                                        placeholder={field.placeholder}
                                        className={commonClass}
                                    />
                                </div>
                            );
                        })}
                    </div>
                    <button onClick={save} disabled={!canMutate} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-black font-semibold disabled:opacity-60">
                        <Save size={15} />
                        {editingId ? 'Update' : 'Create'}
                    </button>
                </div>
            )}

            <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-slate-500 text-sm">Loading records...</div>
                ) : rows.length === 0 ? (
                    <div className="py-16 text-center text-slate-500 text-sm">No records found.</div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-black/20 border-b border-slate-800">
                            <tr>
                                {listFields.map(field => (
                                    <th key={field.key} className="px-4 py-3 text-left text-[10px] uppercase tracking-widest text-slate-500">{field.label}</th>
                                ))}
                                <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-slate-500">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => {
                                const rowId = idToString(row._id);
                                return (
                                    <tr key={rowId} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                                        {listFields.map(field => (
                                            <td key={field.key} className="px-4 py-3 text-sm text-slate-300">
                                                {formatCellValue(row[field.key])}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3">
                                            {canMutate && (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEdit(row)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200">
                                                        <Pencil size={13} />
                                                        Edit
                                                    </button>
                                                    <button onClick={() => remove(rowId)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/15 border border-rose-500/40 text-rose-200">
                                                        <Trash2 size={13} />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
