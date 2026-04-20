import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { AdminIconPicker } from '@/components/ui/admin-icon-picker';
import { DEFAULT_ADMIN_ICON_KEY, resolveAdminIcon } from '@/lib/admin-icon-catalog';

type ModuleItem = {
    _id?: string;
    key?: string;
    label?: string;
    icon?: string;
    description?: string;
    permissions?: string[];
    dependencies?: string[];
};

type ModuleForm = {
    _id?: string;
    key: string;
    label: string;
    icon: string;
    description: string;
    permissions: string[] | string;
    dependencies: string[] | string;
};

interface ModulesViewProps {
    items: ModuleItem[];
    onCreate: (payload: Record<string, unknown>) => void | Promise<void>;
    onUpdate: (payload: Record<string, unknown>) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

function parseCsv(value: string): string[] {
    return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
}

function toForm(item?: ModuleItem): ModuleForm {
    return {
        _id: item?._id,
        key: item?.key || '',
        label: item?.label || '',
        icon: item?.icon || DEFAULT_ADMIN_ICON_KEY,
        description: item?.description || '',
        permissions: item?.permissions || [],
        dependencies: item?.dependencies || [],
    };
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
            {hint && <span className="block text-[10px] text-slate-500">{hint}</span>}
            {children}
        </label>
    );
}

function ModuleIcon({ icon }: { icon?: string }) {
    const Icon = resolveAdminIcon(icon);
    if (Icon) {
        return (
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-cyan-200">
                <Icon size={18} />
            </span>
        );
    }
    return (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 text-xl">
            {icon || '•'}
        </span>
    );
}

export function ModulesView({ items, onCreate, onUpdate, onDelete, saving, viewMode = 'list' }: ModulesViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<ModuleForm>(toForm());
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState<ModuleForm>(toForm());
    const isGrid = viewMode === 'grid';

    const saveNew = async () => {
        await onCreate({
            ...newForm,
            icon: newForm.icon || DEFAULT_ADMIN_ICON_KEY,
            permissions: Array.isArray(newForm.permissions)
                ? newForm.permissions
                : parseCsv(String(newForm.permissions || '')),
            dependencies: Array.isArray(newForm.dependencies)
                ? newForm.dependencies
                : parseCsv(String(newForm.dependencies || '')),
        });
        setCreating(false);
        setNewForm(toForm());
    };

    const saveEdit = async () => {
        await onUpdate({
            ...editForm,
            icon: editForm.icon || DEFAULT_ADMIN_ICON_KEY,
            permissions: Array.isArray(editForm.permissions)
                ? editForm.permissions
                : parseCsv(String(editForm.permissions || '')),
            dependencies: Array.isArray(editForm.dependencies)
                ? editForm.dependencies
                : parseCsv(String(editForm.dependencies || '')),
        });
        setEditingId(null);
        setEditForm(toForm());
    };

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className="flex items-center justify-between bg-slate-900/40 p-4">
                <span className="text-xs font-mono text-slate-400">App registry with dependency controls</span>
                <button
                    onClick={() => setCreating((prev) => !prev)}
                    className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold text-blue-400 transition-all hover:bg-blue-500/20"
                >
                    <Plus size={14} /> Add App
                </button>
            </div>

            {creating && (
                <div className="space-y-4 bg-slate-900/30 p-4">
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="App Key" hint="Stable identifier used in permissions and navigation.">
                            <input
                                value={newForm.key}
                                onChange={(e) => setNewForm({ ...newForm, key: e.target.value })}
                                placeholder="marketing"
                                className="w-full rounded border border-slate-700 bg-black/50 px-3 py-2 font-mono text-xs text-white"
                            />
                        </Field>
                        <Field label="Label" hint="Admin-visible label for sidebar and registry.">
                            <input
                                value={newForm.label}
                                onChange={(e) => setNewForm({ ...newForm, label: e.target.value })}
                                placeholder="Marketing"
                                className="w-full rounded border border-slate-700 bg-black/50 px-3 py-2 text-xs text-white"
                            />
                        </Field>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        <AdminIconPicker
                            value={newForm.icon}
                            onChange={(next) => setNewForm({ ...newForm, icon: next })}
                            label="Icon"
                            helperText="Choose from the admin icon set. Stored as icon key."
                        />
                        <Field label="Dependencies" hint="Comma-separated app keys that must be enabled first.">
                            <input
                                value={Array.isArray(newForm.dependencies) ? newForm.dependencies.join(', ') : newForm.dependencies}
                                onChange={(e) => setNewForm({ ...newForm, dependencies: e.target.value })}
                                placeholder="products, ecommerce"
                                className="w-full rounded border border-slate-700 bg-black/50 px-3 py-2 font-mono text-xs text-white"
                            />
                        </Field>
                    </div>
                    <Field label="Permissions" hint="Default permission IDs for this app.">
                        <input
                            value={Array.isArray(newForm.permissions) ? newForm.permissions.join(', ') : newForm.permissions}
                            onChange={(e) => setNewForm({ ...newForm, permissions: e.target.value })}
                            placeholder="marketing.read, marketing.write"
                            className="w-full rounded border border-slate-700 bg-black/50 px-3 py-2 font-mono text-xs text-white"
                        />
                    </Field>
                    <Field label="Description" hint="Short summary shown to admins while browsing apps.">
                        <textarea
                            value={newForm.description}
                            onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                            placeholder="Campaigns, coupons, email marketing"
                            rows={2}
                            className="w-full resize-none rounded border border-slate-700 bg-black/50 px-3 py-2 text-xs text-white"
                        />
                    </Field>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={saveNew}
                            disabled={saving}
                            className="flex items-center gap-1 rounded bg-emerald-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-emerald-400"
                        >
                            <Save size={12} /> Save
                        </button>
                        <button
                            onClick={() => setCreating(false)}
                            className="rounded bg-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className={isGrid ? 'grid grid-cols-2 gap-px bg-slate-800/30' : 'divide-y divide-slate-800/50'}>
                {items.map((m, idx) => {
                    const rowId = m._id || `module-${idx}`;
                    return (
                        <div key={rowId} className={`p-4 transition-colors hover:bg-slate-800/40 ${isGrid ? 'bg-slate-900/60' : ''}`}>
                            {editingId === rowId ? (
                                <div className="space-y-3">
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <Field label="App Key">
                                            <input
                                                value={editForm.key}
                                                onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                                                className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-1.5 font-mono text-xs text-white"
                                            />
                                        </Field>
                                        <Field label="Label">
                                            <input
                                                value={editForm.label}
                                                onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                                                className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-1.5 text-xs text-white"
                                            />
                                        </Field>
                                    </div>
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <AdminIconPicker
                                            value={editForm.icon}
                                            onChange={(next) => setEditForm({ ...editForm, icon: next })}
                                            label="Icon"
                                            compact
                                        />
                                        <Field label="Dependencies">
                                            <input
                                                value={Array.isArray(editForm.dependencies) ? editForm.dependencies.join(', ') : editForm.dependencies}
                                                onChange={(e) => setEditForm({ ...editForm, dependencies: e.target.value })}
                                                className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-1.5 font-mono text-xs text-white"
                                            />
                                        </Field>
                                    </div>
                                    <Field label="Permissions">
                                        <input
                                            value={Array.isArray(editForm.permissions) ? editForm.permissions.join(', ') : editForm.permissions}
                                            onChange={(e) => setEditForm({ ...editForm, permissions: e.target.value })}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-1.5 font-mono text-xs text-white"
                                        />
                                    </Field>
                                    <Field label="Description">
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={2}
                                            className="w-full resize-none rounded border border-slate-700 bg-black/50 px-2.5 py-1.5 text-xs text-white"
                                        />
                                    </Field>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={saveEdit}
                                            disabled={saving}
                                            className="flex items-center gap-1 rounded bg-cyan-500 px-3 py-1 text-xs font-bold text-black"
                                        >
                                            <Save size={12} /> Save
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="flex items-center gap-1 rounded bg-slate-700 px-3 py-1 text-xs text-slate-300"
                                        >
                                            <X size={12} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={`flex items-center justify-between ${isGrid ? '' : 'mb-2'}`}>
                                        <div className="flex items-center gap-3">
                                            <ModuleIcon icon={m.icon} />
                                            <div>
                                                <div className="text-sm font-semibold text-white">{m.label}</div>
                                                <div className="text-[10px] text-slate-500">{m.description}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingId(rowId);
                                                    setEditForm(toForm(m));
                                                }}
                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-white"
                                            >
                                                <Edit3 size={13} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (m._id) onDelete(m._id);
                                                }}
                                                disabled={!m._id}
                                                className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-rose-400"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="ml-10 mt-3 flex flex-wrap gap-1.5">
                                        {m.permissions?.map((p, i) => (
                                            <span
                                                key={`${rowId}-perm-${i}`}
                                                className="rounded border border-slate-700/50 bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-slate-400"
                                            >
                                                {p}
                                            </span>
                                        ))}
                                        {m.dependencies && m.dependencies.length > 0 && (
                                            <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] text-amber-500">
                                                depends: {m.dependencies.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && <div className="p-8 text-center text-xs text-slate-500">No app definitions found.</div>}
        </div>
    );
}
