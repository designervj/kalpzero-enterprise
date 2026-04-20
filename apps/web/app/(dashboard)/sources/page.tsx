'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SourceInputType, SourceRecordDto } from '@/lib/contracts/source';
import { SourceInputPopover } from '@/components/source/SourceInputPopover';

function toId(value: SourceRecordDto['_id'] | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.toString();
}

function fmtDate(value: string | Date): string {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return String(value);
    return dt.toLocaleString();
}

function getSourceOriginLabel(item: SourceRecordDto): string {
    if (typeof item.origin?.url === 'string' && item.origin.url.trim()) return item.origin.url;
    if (typeof item.origin?.fileName === 'string' && item.origin.fileName.trim()) return item.origin.fileName;
    const normalizedTitle = item.normalized?.title;
    if (typeof normalizedTitle === 'string' && normalizedTitle.trim()) return normalizedTitle;
    return 'Manual source';
}

export default function SourcesPage() {
    const [sources, setSources] = useState<SourceRecordDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState<SourceInputType | 'all'>('all');
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');

    const loadSources = useCallback(async (inputType: SourceInputType | 'all', searchTerm = '') => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams();
            if (inputType !== 'all') params.set('inputType', inputType);
            if (searchTerm.trim()) params.set('search', searchTerm.trim());
            const res = await fetch(`/api/sources?${params.toString()}`);
            const data = await res.json();
            if (!res.ok || data?.error) throw new Error(data?.error || 'Failed to load sources.');
            setSources(Array.isArray(data) ? data : []);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to load sources.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSources(filter).catch(() => undefined);
    }, [filter, loadSources]);

    const filtered = useMemo(() => {
        if (!search.trim()) return sources;
        const needle = search.toLowerCase();
        return sources.filter((item) => {
            const title = String(item.normalized?.title || '').toLowerCase();
            const url = String(item.origin?.url || '').toLowerCase();
            const file = String(item.origin?.fileName || '').toLowerCase();
            return title.includes(needle) || url.includes(needle) || file.includes(needle);
        });
    }, [sources, search]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Source Library</h1>
                    <p className="mt-1 text-sm text-slate-400">Central source records across forms, with provenance and parser metadata.</p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300"
                >
                    {open ? 'Close Ingest' : 'Ingest Source'}
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4 md:grid-cols-3">
                <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by title, URL, file"
                    className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
                <select
                    value={filter}
                    onChange={(event) => setFilter(event.target.value as SourceInputType | 'all')}
                    className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                >
                    <option value="all">All types</option>
                    <option value="link">Link</option>
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                    <option value="file">File</option>
                </select>
                <button
                    type="button"
                    onClick={() => loadSources(filter, search)}
                    className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                >
                    Refresh
                </button>
            </div>

            <SourceInputPopover
                open={open}
                onClose={() => setOpen(false)}
                onIngested={() => {
                    setOpen(false);
                    loadSources(filter, search).catch(() => undefined);
                }}
            />

            {error && <p className="text-sm text-rose-300">{error}</p>}

            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30">
                <div className="grid grid-cols-12 border-b border-slate-800 bg-slate-900/70 px-4 py-3 text-[11px] uppercase tracking-wider text-slate-500">
                    <div className="col-span-2">Type</div>
                    <div className="col-span-4">Origin</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Confidence</div>
                    <div className="col-span-2">Updated</div>
                </div>

                {loading ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">Loading source records...</div>
                ) : filtered.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-slate-500">No source records found.</div>
                ) : (
                    filtered.map((item) => (
                        <div key={toId(item._id)} className="grid grid-cols-12 border-b border-slate-800/70 px-4 py-3 text-xs text-slate-300">
                            <div className="col-span-2">
                                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 font-mono text-cyan-300">
                                    {item.inputType}
                                </span>
                            </div>
                            <div className="col-span-4 truncate">
                                {getSourceOriginLabel(item)}
                            </div>
                            <div className="col-span-2">{item.status}</div>
                            <div className="col-span-2">{Math.round((item.confidence || 0) * 100)}%</div>
                            <div className="col-span-2 text-slate-400">{fmtDate(item.updatedAt)}</div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}
