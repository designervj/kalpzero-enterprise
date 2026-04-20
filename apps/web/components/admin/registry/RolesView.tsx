import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

type RoleItem = {
    _id?: string;
    key?: string;
    label?: string;
    level?: number;
    description?: string;
    permissions?: string[];
};

type RoleForm = {
    _id?: string;
    key: string;
    label: string;
    level: number;
    description: string;
    permissions: string[] | string;
};

interface RolesViewProps {
    items: RoleItem[];
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

function toForm(item?: RoleItem): RoleForm {
    return {
        _id: item?._id,
        key: item?.key || '',
        label: item?.label || '',
        level: Number(item?.level ?? 99),
        description: item?.description || '',
        permissions: item?.permissions || [],
    };
}

export function RolesView({ items, onCreate, onUpdate, onDelete, saving, viewMode = 'list' }: RolesViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<RoleForm>(toForm());
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState<RoleForm>(toForm());
    const isGrid = viewMode === 'grid';

    const sortedItems = useMemo(
        () => [...items].sort((a, b) => Number(a.level || 99) - Number(b.level || 99)),
        [items]
    );

    const saveNew = async () => {
        await onCreate({
            ...newForm,
            level: Number(newForm.level ?? 99),
            permissions: Array.isArray(newForm.permissions)
                ? newForm.permissions
                : parseCsv(String(newForm.permissions || '')),
        });
        setCreating(false);
        setNewForm(toForm());
    };

    const saveEdit = async () => {
        await onUpdate({
            ...editForm,
            level: Number(editForm.level ?? 99),
            permissions: Array.isArray(editForm.permissions)
                ? editForm.permissions
                : parseCsv(String(editForm.permissions || '')),
        });
        setEditingId(null);
        setEditForm(toForm());
    };

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-slate-400 font-mono">Role definitions with live CRUD</span>
                <button
                    onClick={() => setCreating(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-bold hover:bg-cyan-500/20 transition-all"
                >
                    <Plus size={14} /> Add Role
                </button>
            </div>

            {creating && (
                <div className="p-4 bg-slate-900/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Role Key</span>
                            <input
                                value={newForm.key}
                                onChange={e => setNewForm({ ...newForm, key: e.target.value })}
                                placeholder="e.g. tenant_viewer"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Display Label</span>
                            <input
                                value={newForm.label}
                                onChange={e => setNewForm({ ...newForm, label: e.target.value })}
                                placeholder="Viewer"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                            />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Priority Level</span>
                            <input
                                type="number"
                                value={newForm.level}
                                onChange={e => setNewForm({ ...newForm, level: Number(e.target.value) })}
                                placeholder="99"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                            />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Permissions CSV</span>
                            <input
                                value={Array.isArray(newForm.permissions) ? newForm.permissions.join(', ') : newForm.permissions}
                                onChange={e => setNewForm({ ...newForm, permissions: e.target.value })}
                                placeholder="users.read, users.write"
                                className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                            />
                        </label>
                    </div>
                    <label className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</span>
                        <input
                            value={newForm.description}
                            onChange={e => setNewForm({ ...newForm, description: e.target.value })}
                            placeholder="Role summary and boundaries"
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

            <div className={isGrid ? 'grid gap-3 p-4 md:grid-cols-2' : 'divide-y divide-slate-800/50'}>
                {sortedItems.map((r, idx) => {
                    const rowId = r._id || `role-${idx}`;
                    const level = Number(r.level ?? 99);
                    const levelClass =
                        level === 0 ? 'bg-amber-500/20 text-amber-400'
                            : level === 1 ? 'bg-purple-500/20 text-purple-400'
                                : level === 2 ? 'bg-cyan-500/20 text-cyan-400'
                                    : level === 3 ? 'bg-emerald-500/20 text-emerald-400'
                                        : 'bg-slate-700/50 text-slate-400';

                    if (editingId === rowId) {
                        return (
                            <div key={rowId} className={`p-4 bg-slate-900/30 space-y-3 ${isGrid ? 'rounded-lg border border-slate-800/80' : ''}`}>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Role Key</span>
                                        <input
                                            value={editForm.key}
                                            onChange={e => setEditForm({ ...editForm, key: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Display Label</span>
                                        <input
                                            value={editForm.label}
                                            onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                                        />
                                    </label>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Priority Level</span>
                                        <input
                                            type="number"
                                            value={editForm.level}
                                            onChange={e => setEditForm({ ...editForm, level: Number(e.target.value) })}
                                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Permissions CSV</span>
                                        <input
                                            value={Array.isArray(editForm.permissions) ? editForm.permissions.join(', ') : editForm.permissions}
                                            onChange={e => setEditForm({ ...editForm, permissions: e.target.value })}
                                            className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono"
                                        />
                                    </label>
                                </div>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Description</span>
                                    <input
                                        value={editForm.description}
                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                        className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white"
                                    />
                                </label>
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={saveEdit}
                                        disabled={saving}
                                        className="flex items-center gap-1 px-4 py-1.5 bg-cyan-500 text-black rounded text-xs font-bold hover:bg-cyan-400"
                                    >
                                        <Save size={12} /> Save
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex items-center gap-1 px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600"
                                    >
                                        <X size={12} /> Cancel
                                    </button>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={rowId} className={`p-4 hover:bg-slate-800/20 transition-colors ${isGrid ? 'rounded-lg border border-slate-800/80 bg-slate-900/40' : 'flex items-center justify-between'}`}>
                            <div className={`flex items-center gap-4 ${isGrid ? 'mb-3' : ''}`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${levelClass}`}>
                                    L{level}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-white">{r.label}</div>
                                    <div className="text-[10px] text-slate-500">{r.description}</div>
                                </div>
                            </div>
                            <div className={`flex items-center gap-3 ${isGrid ? 'justify-between' : ''}`}>
                                <div className="flex gap-1.5 flex-wrap max-w-sm">
                                    {r.permissions?.slice(0, 4).map((p, i) => (
                                        <span key={`${rowId}-perm-${i}`} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">
                                            {p}
                                        </span>
                                    ))}
                                    {(r.permissions?.length || 0) > 4 && (
                                        <span className="text-[9px] text-slate-500">+{(r.permissions?.length || 0) - 4}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => { setEditingId(rowId); setEditForm(toForm(r)); }}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"
                                    >
                                        <Edit3 size={13} />
                                    </button>
                                    <button
                                        onClick={() => { if (r._id) onDelete(r._id); }}
                                        disabled={!r._id}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {sortedItems.length === 0 && <div className="p-8 text-center text-slate-500 text-xs">No role definitions found.</div>}
        </div>
    );
}
