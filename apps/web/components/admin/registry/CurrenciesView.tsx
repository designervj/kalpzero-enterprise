import { Edit3, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

type CurrencyItem = {
    _id?: string;
    code?: string;
    name?: string;
    symbol?: string;
    flag?: string;
    decimalPlaces?: number;
    isDefault?: boolean;
};

type CurrencyForm = {
    _id?: string;
    code: string;
    name: string;
    symbol: string;
    flag: string;
    decimalPlaces: number;
    isDefault: boolean;
};

interface CurrenciesViewProps {
    items: CurrencyItem[];
    onCreate: (payload: Record<string, unknown>) => void | Promise<void>;
    onUpdate: (payload: Record<string, unknown>) => void | Promise<void>;
    onDelete: (id: string) => void | Promise<void>;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

function toForm(item?: CurrencyItem): CurrencyForm {
    return {
        _id: item?._id,
        code: item?.code || '',
        name: item?.name || '',
        symbol: item?.symbol || '',
        flag: item?.flag || '🌍',
        decimalPlaces: Number(item?.decimalPlaces ?? 2),
        isDefault: Boolean(item?.isDefault),
    };
}

export function CurrenciesView({ items, onCreate, onUpdate, onDelete, saving, viewMode = 'list' }: CurrenciesViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<CurrencyForm>(toForm());
    const [creating, setCreating] = useState(false);
    const [newForm, setNewForm] = useState<CurrencyForm>(toForm());
    const isGrid = viewMode === 'grid';

    const saveNew = async () => {
        await onCreate({
            ...newForm,
            decimalPlaces: Number(newForm.decimalPlaces ?? 2),
            isDefault: Boolean(newForm.isDefault),
        });
        setCreating(false);
        setNewForm(toForm());
    };

    const saveEdit = async () => {
        await onUpdate({
            ...editForm,
            decimalPlaces: Number(editForm.decimalPlaces ?? 2),
            isDefault: Boolean(editForm.isDefault),
        });
        setEditingId(null);
        setEditForm(toForm());
    };

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-slate-400 font-mono">Currency registry with default switch</span>
                <button
                    onClick={() => setCreating(prev => !prev)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-lime-500/10 border border-lime-500/30 rounded-lg text-lime-400 text-xs font-bold hover:bg-lime-500/20 transition-all"
                >
                    <Plus size={14} /> Add Currency
                </button>
            </div>

            {creating && (
                <div className="p-4 bg-slate-900/30 space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Currency Code</span>
                            <input value={newForm.code} onChange={e => setNewForm({ ...newForm, code: e.target.value })} placeholder="USD" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Symbol</span>
                            <input value={newForm.symbol} onChange={e => setNewForm({ ...newForm, symbol: e.target.value })} placeholder="$" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Flag</span>
                            <input value={newForm.flag} onChange={e => setNewForm({ ...newForm, flag: e.target.value })} placeholder="🌍" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <label className="col-span-2 space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Currency Name</span>
                            <input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="US Dollar" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                        <label className="space-y-1">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Decimal Places</span>
                            <input type="number" min={0} max={8} value={newForm.decimalPlaces} onChange={e => setNewForm({ ...newForm, decimalPlaces: Number(e.target.value) })} placeholder="2" className="w-full bg-black/50 border border-slate-700 rounded px-3 py-2 text-xs text-white" />
                        </label>
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                        <input type="checkbox" checked={Boolean(newForm.isDefault)} onChange={e => setNewForm({ ...newForm, isDefault: e.target.checked })} />
                        Set as default currency
                    </label>
                    <div className="flex justify-end gap-2">
                        <button onClick={saveNew} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                        <button onClick={() => setCreating(false)} className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs">Cancel</button>
                    </div>
                </div>
            )}

            {items.length === 0 && <div className="p-8 text-center text-slate-500 text-xs">No currencies found.</div>}

            <div className={isGrid ? 'grid grid-cols-3 gap-0 divide-x divide-y divide-slate-800/50' : 'divide-y divide-slate-800/50'}>
                {items.map((c, idx) => {
                    const rowId = c._id || `currency-${idx}`;
                    return (
                    <div key={rowId} className={`p-4 hover:bg-slate-800/20 transition-colors ${isGrid ? '' : 'bg-slate-900/20'}`}>
                        {editingId === rowId ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Currency Code</span>
                                        <input value={editForm.code} onChange={e => setEditForm({ ...editForm, code: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Symbol</span>
                                        <input value={editForm.symbol} onChange={e => setEditForm({ ...editForm, symbol: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Flag</span>
                                        <input value={editForm.flag} onChange={e => setEditForm({ ...editForm, flag: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                </div>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Currency Name</span>
                                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                </label>
                                <div className="flex items-center gap-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Decimal Places</span>
                                        <input type="number" min={0} max={8} value={editForm.decimalPlaces} onChange={e => setEditForm({ ...editForm, decimalPlaces: Number(e.target.value) })} className="w-24 bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs text-white" />
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                                        <input type="checkbox" checked={Boolean(editForm.isDefault)} onChange={e => setEditForm({ ...editForm, isDefault: e.target.checked })} />
                                        Default
                                    </label>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button onClick={saveEdit} disabled={saving} className="flex items-center gap-1 px-3 py-1 bg-cyan-500 text-black rounded text-xs font-bold"><Save size={12} /> Save</button>
                                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded text-xs"><X size={12} /> Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{c.flag}</span>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-white">{c.code}</span>
                                                <span className="text-slate-400 text-sm">{c.symbol}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-500">{c.name}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => { setEditingId(rowId); setEditForm(toForm(c)); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"><Edit3 size={13} /></button>
                                        <button onClick={() => { if (c._id) onDelete(c._id); }} disabled={!c._id} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="text-[9px] px-1.5 py-0.5 bg-lime-500/10 border border-lime-500/20 text-lime-400 rounded font-mono">
                                        {c.decimalPlaces} decimals
                                    </span>
                                    {c.isDefault && (
                                        <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );})}
            </div>
        </div>
    );
}
