import { useState } from 'react';
import { Edit3, Trash2, Save, X, Copy } from 'lucide-react';

interface PromptTemplateItem {
    _id?: string;
    name?: string;
    key?: string;
    category?: string;
    prompt?: string;
    variables?: string[];
    model?: string;
    outputType?: string;
}

type PromptTemplateEdit = Partial<PromptTemplateItem>;

interface PromptsViewProps {
    items: PromptTemplateItem[];
    editingId: string | null;
    editForm: PromptTemplateEdit;
    setEditingId: (id: string | null) => void;
    setEditForm: (form: PromptTemplateEdit) => void;
    onSave: () => void;
    onDelete: (id: string) => void;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

export function PromptsView({ items, editingId, editForm, setEditingId, setEditForm, onSave, onDelete, saving, viewMode = 'list' }: PromptsViewProps) {
    const [expanded, setExpanded] = useState<string | null>(null);
    const isGrid = viewMode === 'grid';

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            <div className={isGrid ? 'grid gap-3 p-4 md:grid-cols-2' : 'divide-y divide-slate-800/50'}>
                {items.map((p, index) => {
                    const recordId = typeof p._id === 'string' ? p._id : '';
                    const rowKey = recordId || `${p.key || 'prompt'}-${index}`;

                    return (
                    <div key={rowKey} className={`p-4 hover:bg-slate-800/20 transition-colors ${isGrid ? 'rounded-lg border border-slate-800/80 bg-slate-900/40' : ''}`}>
                        {recordId && editingId === recordId ? (
                            <div className="space-y-3 p-2 bg-slate-900/60 rounded-lg border border-slate-700/50">
                                <div className="grid grid-cols-3 gap-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Prompt Name</span>
                                        <input value={editForm.name || ''} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-white text-xs" placeholder="Landing page headline generator" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Prompt Key</span>
                                        <input value={editForm.key || ''} onChange={e => setEditForm({ ...editForm, key: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono" placeholder="prompt_landing_headline" />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Category</span>
                                        <select value={editForm.category || ''} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-white text-xs appearance-none cursor-pointer">
                                            <option value="page_design">Page Design</option>
                                            <option value="content">Content</option>
                                            <option value="ecommerce">E-Commerce</option>
                                            <option value="seo">SEO</option>
                                            <option value="marketing">Marketing</option>
                                        </select>
                                    </label>
                                </div>
                                <label className="space-y-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Prompt Template</span>
                                    <textarea value={editForm.prompt || ''} onChange={e => setEditForm({ ...editForm, prompt: e.target.value })} rows={4} className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono resize-none leading-relaxed" />
                                </label>
                                <div className="flex gap-2 justify-end">
                                    <button onClick={onSave} disabled={saving} className="flex items-center gap-1 px-4 py-1.5 bg-cyan-500 text-black rounded text-xs font-bold hover:bg-cyan-400">
                                        <Save size={12} /> Save
                                    </button>
                                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600">
                                        <X size={12} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {(() => {
                                    const category = p.category || 'content';
                                    const name = p.name || 'Untitled Prompt';
                                    const key = p.key || 'prompt_key';
                                    const promptText = p.prompt || '';

                                    return (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${category === 'page_design' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                        category === 'content' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                                                            category === 'ecommerce' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                                                                category === 'seo' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                                    'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                                        }`}>
                                                        {category.replace('_', ' ')}
                                                    </span>
                                                    <span className="text-sm font-semibold text-white">{name}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono">{key}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setExpanded(expanded === recordId ? null : recordId)}
                                                        className="text-[10px] text-slate-500 hover:text-slate-300 px-2 py-1 bg-slate-800/50 rounded transition-colors"
                                                    >
                                                        {expanded === recordId ? 'Collapse' : 'Expand'}
                                                    </button>
                                                    <button onClick={() => { navigator.clipboard.writeText(promptText); }} className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors" title="Copy prompt">
                                                        <Copy size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!recordId) return;
                                                            setEditingId(recordId);
                                                            setEditForm(p);
                                                        }}
                                                        disabled={!recordId}
                                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Edit3 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!recordId) return;
                                                            onDelete(recordId);
                                                        }}
                                                        disabled={!recordId}
                                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                            {recordId && expanded === recordId && (
                                                <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div className="bg-black/30 rounded-lg p-3 text-xs text-slate-300 font-mono whitespace-pre-wrap border border-slate-800/80 leading-relaxed shadow-inner">
                                                        {promptText}
                                                    </div>
                                                    <div className="flex gap-2 items-center flex-wrap">
                                                        <span className="text-[10px] text-slate-500 mr-1 uppercase tracking-widest font-bold">Vars:</span>
                                                        {p.variables?.map((v: string, i: number) => (
                                                            <span key={i} className="text-[10px] font-mono px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-md text-violet-400 shadow-sm">
                                                                {`{{${v}}}`}
                                                            </span>
                                                        ))}
                                                        <div className="ml-auto flex items-center gap-2">
                                                            <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-medium">Model: {p.model || 'gpt-4'}</span>
                                                            <span className="text-[10px] px-2 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-medium">Out: {p.outputType || 'text'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </>
                        )}
                    </div>
                )})}
            </div>
            {items.length === 0 && <div className="p-8 text-center text-slate-500 text-xs">No AI prompt templates found.</div>}
        </div>
    );
}
