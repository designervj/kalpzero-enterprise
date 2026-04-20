import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type EmailItem = {
    _id?: string;
    key?: string;
    name?: string;
    category?: string;
    subject?: string;
    variables?: string[];
};

type EmailForm = {
    _id?: string;
    key: string;
    name: string;
    category: string;
    subject: string;
    variables: string[] | string;
};

interface EmailsViewProps {
    items: EmailItem[];
    onCreate: (payload: Record<string, unknown>) => void | Promise<void>;
    onUpdate: (payload: Record<string, unknown>) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

function parseCsv(value: string): string[] {
    return value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
}

function toForm(item?: EmailItem): EmailForm {
    return {
        _id: item?._id,
        key: item?.key || '',
        name: item?.name || '',
        category: item?.category || 'general',
        subject: item?.subject || '',
        variables: item?.variables || [],
    };
}

export function EmailsView({ items, onCreate, onUpdate, onDelete, saving, viewMode = 'list' }: EmailsViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EmailForm>(toForm());
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState<EmailForm>(toForm());
    const isGrid = viewMode === 'grid';

    const categoryColors: Record<string, string> = {
        auth: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        invoicing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        ecommerce: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        bookings: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        marketing: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };

    const saveNew = async () => {
        await onCreate({
            ...newForm,
            variables: Array.isArray(newForm.variables) ? newForm.variables : parseCsv(String(newForm.variables || '')),
        });
        setCreating(false);
        setNewForm(toForm());
    };

    const saveEdit = async () => {
        await onUpdate({
            ...editForm,
            variables: Array.isArray(editForm.variables) ? editForm.variables : parseCsv(String(editForm.variables || '')),
        });
        setEditingId(null);
        setEditForm(toForm());
    };

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-slate-400 font-mono">Email template registry with variable management</span>
                <button
                    onClick={() => setCreating(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-bold hover:bg-rose-500/20 transition-all"
                >
                    <Plus size={14} /> Add Template
                </button>
            </div>

            {creating && (
                <div className="p-4 bg-slate-900/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Template Key</span>
                            <input value={newForm.key} onChange={e => setNewForm({ ...newForm, key: e.target.value })} placeholder="invoice_paid" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Template Name</span>
                            <input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="Invoice Paid Email" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Category</span>
                            <input value={newForm.category} onChange={e => setNewForm({ ...newForm, category: e.target.value })} placeholder="marketing" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Subject Line</span>
                            <input value={newForm.subject} onChange={e => setNewForm({ ...newForm, subject: e.target.value })} placeholder="Your order is confirmed" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                    </div>
                    <label className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Template Variables (CSV)</span>
                        <input value={Array.isArray(newForm.variables) ? newForm.variables.join(', ') : newForm.variables} onChange={e => setNewForm({ ...newForm, variables: e.target.value })} placeholder="customer_name, order_id" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono" />
                    </label>
                    <div className="flex justify-end gap-2">
                        <button onClick={saveNew} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                        <button onClick={() => setCreating(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs">Cancel</button>
                    </div>
                </div>
            )}

            {items.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">
                    No email templates found.
                </div>
            )}

            <div className={isGrid ? 'grid gap-3 p-4 md:grid-cols-2' : 'divide-y divide-slate-800/50'}>
                {items.map((e, idx) => {
                    const rowId = e._id || `email-${idx}`;
                    return (
                    <div key={rowId} className={`p-4 hover:bg-slate-800/20 transition-colors ${isGrid ? 'rounded-lg border border-slate-800/80 bg-slate-900/40' : ''}`}>
                        {editingId === rowId ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Template Key</span>
                                        <input value={editForm.key} onChange={ev => setEditForm({ ...editForm, key: ev.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Template Name</span>
                                        <input value={editForm.name} onChange={ev => setEditForm({ ...editForm, name: ev.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Category</span>
                                        <input value={editForm.category} onChange={ev => setEditForm({ ...editForm, category: ev.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Subject Line</span>
                                        <input value={editForm.subject} onChange={ev => setEditForm({ ...editForm, subject: ev.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                </div>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Template Variables (CSV)</span>
                                    <input value={Array.isArray(editForm.variables) ? editForm.variables.join(', ') : editForm.variables} onChange={ev => setEditForm({ ...editForm, variables: ev.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                </label>
                                <div className="flex justify-end gap-2">
                                        <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1 bg-cyan-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs"><X size={12} /> Cancel</button>
                                    </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${categoryColors[e.category || ''] || 'bg-slate-700/50 text-slate-400 border-slate-700'}`}>
                                            {e.category}
                                        </span>
                                        <span className="text-sm font-semibold text-white">{e.name}</span>
                                        <span className="text-[10px] text-slate-500 font-mono">{e.key}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingId(rowId); setEditForm(toForm(e)); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"><Edit3 size={13} /></button>
                                        <button onClick={() => { if (e._id) onDelete(e._id); }} disabled={!e._id} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                                    <span className="text-slate-500 mr-2">Subject:</span> {e.subject}
                                </div>
                                <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {e.variables?.map((v, i) => (
                                        <span key={`${rowId}-var-${i}`} className="text-[9px] font-mono px-1.5 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400">
                                            {`{{${v}}}`}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                );})}
            </div>
        </div>
    );
}
