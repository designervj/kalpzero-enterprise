'use client';

import { useState } from 'react';
import { Folder, Eye, FileEdit, Plus, Sparkles } from 'lucide-react';

export function PortfolioClient({ items }: { items: any[] }) {
    const [statusFilter, setStatusFilter] = useState('');
    const filtered = statusFilter ? items.filter(i => i.status === statusFilter) : items;

    const publishedCount = items.filter(i => i.status === 'published').length;
    const draftCount = items.filter(i => i.status === 'draft').length;

    const statusColors: Record<string, string> = {
        published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };

    const categoryIcons: Record<string, string> = {
        'Branding': '🎨',
        'Web Design': '🌐',
        'Marketing': '📣',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                        <Folder size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5">Portfolio Gallery</h2>
                        <p className="text-slate-400 text-xs font-mono">
                            {items.length} project{items.length !== 1 ? 's' : ''} • {publishedCount} published • {draftCount} draft
                        </p>
                    </div>
                </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2">
                {['', 'published', 'draft'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Gallery Grid */}
            {filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No portfolio items found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => (
                        <div key={item._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-all group shadow-[0_4px_24px_rgba(0,0,0,0.3)]">

                            {/* Cover Area */}
                            <div className="h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/20 to-purple-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <span className="text-5xl">{categoryIcons[item.category] || '📁'}</span>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{item.title}</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">{item.client}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border ${statusColors[item.status] || statusColors.draft}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{item.description}</p>

                                <div className="flex items-center justify-between">
                                    <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 rounded text-[10px] font-mono border border-slate-700">
                                        {item.category}
                                    </span>
                                    <div className="flex gap-1">
                                        {item.tags?.slice(0, 3).map((tag: string) => (
                                            <span key={tag} className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[9px] font-mono border border-cyan-500/20">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
