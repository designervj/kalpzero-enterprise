import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { getEntityLabel } from '@/lib/app-labels';

type CapabilityItem = {
    _id?: string;
    key?: string;
    label?: string;
    moduleKey?: string;
    parentKey?: string;
    description?: string;
    status?: 'active' | 'disabled' | 'draft';
    defaultEnabled?: boolean;
    businessContexts?: string[];
};

type CapabilityForm = {
    _id?: string;
    key: string;
    label: string;
    moduleKey: string;
    parentKey: string;
    description: string;
    status: 'active' | 'disabled' | 'draft';
    defaultEnabled: boolean;
    businessContexts: string[] | string;
};

interface CapabilityDefinitionsViewProps {
    items: CapabilityItem[];
    capabilityLabel: string;
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

function toForm(item?: CapabilityItem): CapabilityForm {
    return {
        _id: item?._id,
        key: item?.key || '',
        label: item?.label || '',
        moduleKey: item?.moduleKey || '',
        parentKey: item?.parentKey || '',
        description: item?.description || '',
        status: item?.status || 'active',
        defaultEnabled: typeof item?.defaultEnabled === 'boolean' ? item.defaultEnabled : true,
        businessContexts: item?.businessContexts || [],
    };
}

export function CapabilityDefinitionsView({
    items,
    capabilityLabel,
    onCreate,
    onUpdate,
    onDelete,
    saving,
    viewMode = 'list',
}: CapabilityDefinitionsViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<CapabilityForm>(toForm());
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState<CapabilityForm>(toForm());

    const buildPayload = (form: CapabilityForm) => ({
        ...form,
        key: form.key.trim(),
        label: form.label.trim(),
        moduleKey: form.moduleKey.trim(),
        parentKey: form.parentKey.trim() || undefined,
        businessContexts: Array.isArray(form.businessContexts)
            ? form.businessContexts
            : parseCsv(String(form.businessContexts || '')),
    });

    const saveNew = async () => {
        await onCreate(buildPayload(newForm));
        setCreating(false);
        setNewForm(toForm());
    };

    const saveEdit = async () => {
        await onUpdate(buildPayload(editForm));
        setEditingId(null);
        setEditForm(toForm());
    };
    const entityLabel = getEntityLabel(capabilityLabel);
    const entityKeyLabel = `${entityLabel} Key`;

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-slate-400 font-mono">{entityLabel} registry</span>
                <button
                    onClick={() => setCreating(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all"
                >
                    <Plus size={14} /> Add {entityLabel}
                </button>
            </div>

            {creating && (
                <div className="p-4 bg-slate-900/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{entityKeyLabel}</span>
                            <input
                                value={newForm.key}
                                onChange={e => setNewForm({ ...newForm, key: e.target.value })}
                                placeholder="catalog_management"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Display Label</span>
                            <input
                                value={newForm.label}
                                onChange={e => setNewForm({ ...newForm, label: e.target.value })}
                                placeholder="Catalog Management"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">App Key</span>
                            <input
                                value={newForm.moduleKey}
                                onChange={e => setNewForm({ ...newForm, moduleKey: e.target.value })}
                                placeholder="products"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Parent Key (Optional)</span>
                            <input
                                value={newForm.parentKey}
                                onChange={e => setNewForm({ ...newForm, parentKey: e.target.value })}
                                placeholder="catalog_management"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status</span>
                            <select
                                value={newForm.status}
                                onChange={e => setNewForm({ ...newForm, status: e.target.value as CapabilityForm['status'] })}
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                            >
                                <option value="active">active</option>
                                <option value="disabled">disabled</option>
                                <option value="draft">draft</option>
                            </select>
                        </label>
                        <label className="col-span-2 flex items-center gap-2 text-xs text-slate-300 bg-black/40 border border-slate-700 rounded px-3 py-2">
                            <input
                                type="checkbox"
                                checked={newForm.defaultEnabled}
                                onChange={e => setNewForm({ ...newForm, defaultEnabled: e.target.checked })}
                            />
                            Default Enabled
                        </label>
                    </div>
                    <label className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Business Contexts (CSV)</span>
                        <input
                            value={Array.isArray(newForm.businessContexts) ? newForm.businessContexts.join(', ') : newForm.businessContexts}
                            onChange={e => setNewForm({ ...newForm, businessContexts: e.target.value })}
                            placeholder="ecommerce, portfolio"
                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</span>
                        <input
                            value={newForm.description}
                            onChange={e => setNewForm({ ...newForm, description: e.target.value })}
                            placeholder="Summary for operators"
                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                        />
                    </label>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={saveNew}
                            disabled={saving}
                            className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-black rounded text-xs font-bold hover:bg-emerald-400"
                        >
                            <Save size={12} /> Save
                        </button>
                        <button
                            onClick={() => setCreating(false)}
                            className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-px bg-slate-800/30' : 'divide-y divide-slate-800/50'}>
                {items.map((item, idx) => {
                    const rowId = item._id || `capability-${idx}`;
                    const contextList = Array.isArray(item.businessContexts) ? item.businessContexts : [];
                    return (
                        <div key={rowId} className="p-4 bg-slate-900/60 transition-colors hover:bg-slate-800/40">
                            {editingId === rowId ? (
                                <div className="space-y-2">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{entityKeyLabel}</span>
                                        <input value={editForm.key} onChange={e => setEditForm({ ...editForm, key: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Display Label</span>
                                        <input value={editForm.label} onChange={e => setEditForm({ ...editForm, label: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">App Key</span>
                                        <input value={editForm.moduleKey} onChange={e => setEditForm({ ...editForm, moduleKey: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Parent Key</span>
                                        <input value={editForm.parentKey} onChange={e => setEditForm({ ...editForm, parentKey: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Status</span>
                                        <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value as CapabilityForm['status'] })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white">
                                            <option value="active">active</option>
                                            <option value="disabled">disabled</option>
                                            <option value="draft">draft</option>
                                        </select>
                                    </label>
                                    <label className="flex items-center gap-2 text-xs text-slate-300">
                                        <input type="checkbox" checked={editForm.defaultEnabled} onChange={e => setEditForm({ ...editForm, defaultEnabled: e.target.checked })} />
                                        Default Enabled
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Business Contexts (CSV)</span>
                                        <input value={Array.isArray(editForm.businessContexts) ? editForm.businessContexts.join(', ') : editForm.businessContexts} onChange={e => setEditForm({ ...editForm, businessContexts: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</span>
                                        <input value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1 bg-cyan-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs"><X size={12} /> Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold text-white">{item.label}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">{item.key}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => { setEditingId(rowId); setEditForm(toForm(item)); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"><Edit3 size={13} /></button>
                                            <button onClick={() => { if (item._id) onDelete(item._id); }} disabled={!item._id} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"><Trash2 size={13} /></button>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700/50 rounded text-slate-300 font-mono">app:{item.moduleKey || '-'}</span>
                                        {item.parentKey && (
                                            <span className="text-[9px] px-1.5 py-0.5 bg-indigo-500/10 border border-indigo-500/30 rounded text-indigo-300 font-mono">parent:{item.parentKey}</span>
                                        )}
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${item.defaultEnabled ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-700/20 border-slate-600 text-slate-400'}`}>
                                            {item.defaultEnabled ? 'default:on' : 'default:off'}
                                        </span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${item.status === 'disabled' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : item.status === 'draft' ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'}`}>
                                            {item.status || 'active'}
                                        </span>
                                    </div>
                                    {contextList.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {contextList.map((context, contextIdx) => (
                                                <span key={`${rowId}-ctx-${contextIdx}`} className="text-[9px] px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/30 rounded text-purple-300 font-mono">
                                                    {context}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {item.description && (
                                        <p className="mt-2 text-[11px] text-slate-400">{item.description}</p>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && <div className="p-8 text-center text-slate-500 text-xs">No {entityLabel.toLowerCase()} definitions found.</div>}
        </div>
    );
}
