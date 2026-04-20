'use client';

import { useState } from 'react';
import { Layers, Edit3, Save, X, Plus } from 'lucide-react';

type CategoryTemplate = Record<string, unknown> & { _id?: string };

interface CategoryTemplatesViewProps {
    items: CategoryTemplate[];
    onCreate: (payload: CategoryTemplate) => void;
    onUpdate: (payload: CategoryTemplate) => void;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

const TYPE_COLORS: Record<string, string> = {
    product: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    blog: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    portfolio: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

const LAYOUT_ICONS: Record<string, string> = {
    grid: '⊞',
    list: '☰',
    masonry: '⧉',
};

const EMPTY_TEMPLATE: CategoryTemplate = {
    key: '',
    name: '',
    description: '',
    type: 'product',
    layoutHint: 'grid',
    sectionOrder: [],
    requiredSections: [],
    slugStrategy: 'pageSlug',
    mobileBehavior: 'stack',
    status: 'published',
};

export function CategoryTemplatesView({ items, onCreate, onUpdate, saving, viewMode = 'list' }: CategoryTemplatesViewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<CategoryTemplate>(EMPTY_TEMPLATE);
    const [creating, setCreating] = useState(false);
    const isGrid = viewMode === 'grid';

    const handleEditClick = (t: CategoryTemplate) => {
        setCreating(false);
        setEditingId(t._id || null);
        setEditForm({ ...t });
    };

    const handleNewClick = () => {
        setCreating(true);
        setEditingId('new');
        setEditForm({ ...EMPTY_TEMPLATE });
    };

    const handleSave = () => {
        if (creating) {
            onCreate(editForm);
        } else {
            onUpdate(editForm);
        }
        setEditingId(null);
        setCreating(false);
    };

    const setField = (field: string, value: unknown) => setEditForm(prev => ({ ...prev, [field]: value }));

    const parseCSV = (v: string): string[] => v.split(',').map(s => s.trim()).filter(Boolean);

    return (
        <div className={`divide-y divide-slate-800/50 ${isGrid ? 'bg-slate-900/10' : ''}`}>
            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <div>
                    <span className="text-xs text-slate-400 font-mono">Category page templates · <code className="text-slate-500">kalp_system.category_templates</code></span>
                </div>
                <button
                    onClick={handleNewClick}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                >
                    <Plus size={14} /> New Template
                </button>
            </div>

            {/* Create / Edit Form */}
            {editingId && (
                <div className="p-5 bg-slate-800/20 border-b border-slate-700 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        {creating ? 'New Category Template' : 'Edit Template'}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Key *</label>
                            <input
                                value={String(editForm.key || '')}
                                onChange={e => setField('key', e.target.value)}
                                placeholder="product-category-default"
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Name *</label>
                            <input
                                value={String(editForm.name || '')}
                                onChange={e => setField('name', e.target.value)}
                                placeholder="Product Grid"
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Type</label>
                            <select
                                value={String(editForm.type || 'product')}
                                onChange={e => setField('type', e.target.value)}
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            >
                                <option value="product">product</option>
                                <option value="blog">blog</option>
                                <option value="portfolio">portfolio</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Layout Hint</label>
                            <select
                                value={String(editForm.layoutHint || 'grid')}
                                onChange={e => setField('layoutHint', e.target.value)}
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            >
                                <option value="grid">grid</option>
                                <option value="list">list</option>
                                <option value="masonry">masonry</option>
                            </select>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Description</label>
                            <input
                                value={String(editForm.description || '')}
                                onChange={e => setField('description', e.target.value)}
                                placeholder="Brief description of this template layout"
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Section Order (comma-sep)</label>
                            <input
                                value={Array.isArray(editForm.sectionOrder) ? (editForm.sectionOrder as string[]).join(', ') : ''}
                                onChange={e => setField('sectionOrder', parseCSV(e.target.value))}
                                placeholder="banner, filter-bar, product-grid, pagination"
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-slate-500 uppercase tracking-widest">Required Sections (comma-sep)</label>
                            <input
                                value={Array.isArray(editForm.requiredSections) ? (editForm.requiredSections as string[]).join(', ') : ''}
                                onChange={e => setField('requiredSections', parseCSV(e.target.value))}
                                placeholder="product-grid"
                                className="w-full bg-black/50 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white font-mono"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-1 px-4 py-1.5 bg-emerald-500 text-black rounded text-xs font-bold hover:bg-emerald-400">
                            <Save size={13} /> Save
                        </button>
                        <button onClick={() => { setEditingId(null); setCreating(false); }}
                            className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className={isGrid ? 'grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3' : ''}>
                {items.map(t => {
                    if (t._id === editingId) return null;
                    const typeClass = TYPE_COLORS[String(t.type || 'product')] || 'text-slate-400 bg-slate-500/10 border-slate-500/30';
                    const layoutIcon = LAYOUT_ICONS[String(t.layoutHint || 'grid')] || '⊞';
                    return (
                        <div key={t._id}
                            className={`group p-4 transition-all ${isGrid ? 'rounded-lg border border-slate-800/80 bg-slate-900/30 hover:border-slate-700' : 'hover:bg-slate-800/10'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 border border-slate-700 text-slate-400 text-base">
                                        <Layers size={14} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white">{String(t.name || '')}</div>
                                        <div className="text-[10px] text-slate-500 font-mono">{String(t.key || '')}</div>
                                    </div>
                                </div>
                                <div className={`flex gap-2 transition-opacity ${isGrid ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <button onClick={() => handleEditClick(t)}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white">
                                        <Edit3 size={13} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                                <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold font-mono ${typeClass}`}>
                                    {String(t.type || '')}
                                </span>
                                <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800/50 text-slate-400 text-[10px] font-mono">
                                    {layoutIcon} {String(t.layoutHint || '')}
                                </span>
                                {Array.isArray(t.sectionOrder) && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                        {(t.sectionOrder as string[]).length} sections
                                    </span>
                                )}
                                <span className={`ml-auto px-2 py-0.5 rounded border text-[10px] ${t.status === 'published' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 'text-slate-400 border-slate-700'}`}>
                                    {String(t.status || 'draft')}
                                </span>
                            </div>
                            {Boolean(t.description) && (
                                <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{String(t.description)}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && !creating && (
                <div className="p-8 text-center text-slate-500 text-xs">No category templates found.</div>
            )}
        </div>
    );
}
