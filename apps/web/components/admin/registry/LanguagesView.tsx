import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type LanguageItem = {
    _id?: string;
    code?: string;
    name?: string;
    nativeName?: string;
    flag?: string;
    rtl?: boolean;
};

type LanguageForm = {
    _id?: string;
    code: string;
    name: string;
    nativeName: string;
    flag: string;
    rtl: boolean;
};

interface LanguagesViewProps {
    items: LanguageItem[];
    onCreate: (payload: Record<string, unknown>) => void | Promise<void>;
    onUpdate: (payload: Record<string, unknown>) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

function toForm(item?: LanguageItem): LanguageForm {
    return {
        _id: item?._id,
        code: item?.code || '',
        name: item?.name || '',
        nativeName: item?.nativeName || '',
        flag: item?.flag || '🌐',
        rtl: Boolean(item?.rtl),
    };
}

export function LanguagesView({ items, onCreate, onUpdate, onDelete, saving, viewMode = 'list' }: LanguagesViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<LanguageForm>(toForm());
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState<LanguageForm>(toForm());
    const isGrid = viewMode === 'grid';

    const saveNew = async () => {
        await onCreate({
            ...newForm,
            rtl: Boolean(newForm.rtl),
        });
        setCreating(false);
        setNewForm(toForm());
    };

    const saveEdit = async () => {
        await onUpdate({
            ...editForm,
            rtl: Boolean(editForm.rtl),
        });
        setEditingId(null);
        setEditForm(toForm());
    };

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-slate-400 font-mono">Language registry with RTL controls</span>
                <button
                    onClick={() => setCreating(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-bold hover:bg-amber-500/20 transition-all"
                >
                    <Plus size={14} /> Add Language
                </button>
            </div>

            {creating && (
                <div className="p-4 bg-slate-900/30 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Language Code</span>
                            <input value={newForm.code} onChange={e => setNewForm({ ...newForm, code: e.target.value })} placeholder="e.g. en" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Flag Symbol</span>
                            <input value={newForm.flag} onChange={e => setNewForm({ ...newForm, flag: e.target.value })} placeholder="🌐" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Language Name</span>
                            <input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="English" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Native Name</span>
                            <input value={newForm.nativeName} onChange={e => setNewForm({ ...newForm, nativeName: e.target.value })} placeholder="English" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                        <input type="checkbox" checked={Boolean(newForm.rtl)} onChange={e => setNewForm({ ...newForm, rtl: e.target.checked })} />
                        RTL language
                    </label>
                    <div className="flex justify-end gap-2">
                        <button onClick={saveNew} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                        <button onClick={() => setCreating(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs">Cancel</button>
                    </div>
                </div>
            )}

            <div className={isGrid ? 'grid grid-cols-4 gap-px bg-slate-800/30' : 'divide-y divide-slate-800/50'}>
                {items.map((l, idx) => {
                    const rowId = l._id || `lang-${idx}`;
                    return (
                    <div key={rowId} className={`p-4 transition-colors hover:bg-slate-800/40 ${isGrid ? 'bg-slate-900/60' : ''}`}>
                        {editingId === rowId ? (
                            <div className="space-y-2">
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Language Code</span>
                                    <input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Language Name</span>
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Native Name</span>
                                    <input value={editForm.nativeName} onChange={e => setEditForm({ ...editForm, nativeName: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                </label>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Flag Symbol</span>
                                    <input value={editForm.flag} onChange={e => setEditForm({ ...editForm, flag: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                </label>
                                <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                    <input type="checkbox" checked={Boolean(editForm.rtl)} onChange={e => setEditForm({ ...editForm, rtl: e.target.checked })} />
                                    RTL
                                </label>
                                <div className="flex justify-end gap-2">
                                    <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1 bg-cyan-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs"><X size={12} /> Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{l.flag}</span>
                                        <div>
                                            <div className="text-sm font-semibold text-white">{l.name}</div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                                {l.code} • {l.nativeName} {l.rtl ? '• RTL' : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingId(rowId); setEditForm(toForm(l)); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"><Edit3 size={13} /></button>
                                        <button onClick={() => { if (l._id) onDelete(l._id); }} disabled={!l._id} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                );})}
            </div>

            {items.length === 0 && <div className="p-8 text-center text-slate-500 text-xs">No languages found.</div>}
        </div>
    );
}
