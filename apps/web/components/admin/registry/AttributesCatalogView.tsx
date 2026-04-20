'use client';

import {
    RefreshCw,
    Eye,
    RotateCcw,
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    FileSearch,
    Database,
    Plus,
    Minus,
    Equal,
    Upload,
    Download,
    Edit3,
    X,
    Save
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';

type DbModel = {
    _id?: string;
    key?: string;
    industry?: string;
    industryKey?: string;
    businessType?: string;
    businessTypeKey?: string;
    attributePool?: string[];
    attributeSetPreset?: { attributes?: unknown[] };
    source?: string;
    status?: string;
    updatedAt?: string;
};

type AttributeDiff = {
    industryKey: string;
    industry: string;
    businessTypeKey: string;
    businessType: string;
    action: 'insert' | 'update' | 'unchanged';
    field?: string;
    before?: unknown;
    after?: unknown;
};

type DiffResult = {
    catalogVersion: string;
    totalCatalogTypes: number;
    insertCount: number;
    updateCount: number;
    unchangedCount: number;
    diffs: AttributeDiff[];
};

type OverviewData = {
    catalogVersion: string;
    catalogIndustryCount: number;
    catalogBusinessTypeCount: number;
    dbModels: DbModel[];
};

const ACTION_COLORS: Record<string, string> = {
    insert: 'text-emerald-400',
    update: 'text-amber-400',
    unchanged: 'text-slate-500',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
    insert: <Plus size={11} />,
    update: <Minus size={11} />,
    unchanged: <Equal size={11} />,
};

export function AttributesCatalogView() {
    const [overview, setOverview] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ inserted: number; updated: number; total: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [expandedIndustries, setExpandedIndustries] = useState<Set<string>>(new Set());

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editingModel, setEditingModel] = useState<DbModel | null>(null);
    const [editJson, setEditJson] = useState('');

    const loadOverview = useCallback(async () => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/system/attributes');
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load.');
            setOverview(data);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Failed to load attribute models.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOverview();
    }, [loadOverview]);

    const runDiff = async () => {
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        setSyncResult(null);
        try {
            const res = await fetch('/api/system/attributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'diff' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Diff failed.');
            setDiffResult(data);
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Diff failed.');
        } finally {
            setLoading(false);
        }
    };

    const runSync = async () => {
        if (!confirm('This will upsert all catalog entries into business_attribute_models. Proceed?')) return;
        setSyncing(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const res = await fetch('/api/system/attributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'sync' }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Sync failed.');
            setSyncResult({ inserted: data.inserted, updated: data.updated, total: data.total });
            setSuccessMsg(`Sync complete: ${data.inserted} inserted, ${data.updated} updated (catalog v${data.catalogVersion}).`);
            setDiffResult(null);
            await loadOverview();
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Sync failed.');
        } finally {
            setSyncing(false);
        }
    };

    const toggleIndustry = (key: string) => {
        setExpandedIndustries((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const downloadSample = () => {
        const sample = {
            version: "2026-03-08.custom",
            industries: [
                {
                    key: "custom_industry",
                    industry: "Custom Industry",
                    businessTypes: [
                        {
                            key: "custom_business",
                            name: "Custom Business Type",
                            description: "A custom business type imported via JSON",
                            attributePool: ["custom_field_1", "custom_field_2"],
                            attributeSet: {
                                key: "as_custom_business",
                                name: "Custom Attribute Set",
                                appliesTo: "business_profile",
                                attributes: [
                                    {
                                        key: "custom_field_1",
                                        label: "Custom Field 1",
                                        type: "boolean",
                                        options: []
                                    },
                                    {
                                        key: "custom_field_2",
                                        label: "Custom Field 2",
                                        type: "select",
                                        options: ["Option A", "Option B"]
                                    }
                                ]
                            }
                        }
                    ]
                }
            ]
        };
        const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'kalpzero.business-attributes.sample.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            const text = await file.text();
            let catalogData;
            try {
                catalogData = JSON.parse(text);
            } catch {
                throw new Error("Invalid JSON file formatting.");
            }

            if (!catalogData.version || !Array.isArray(catalogData.industries)) {
                throw new Error("Invalid Catalog structure. Missing 'version' or 'industries' array.");
            }

            const res = await fetch('/api/system/attributes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'import', catalogData }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Import failed.');

            setSuccessMsg(data.message || 'Imported catalog successfully! Run Diff & Sync to apply to DB.');
            setDiffResult(null);
            await loadOverview();
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
        } finally {
            setLoading(false);
            if (e.target) e.target.value = '';
        }
    };

    const openEditModel = (model: DbModel) => {
        setEditingModel(model);
        setEditJson(JSON.stringify({
            attributePool: model.attributePool || [],
            attributeSetPreset: model.attributeSetPreset || { attributes: [] }
        }, null, 2));
    };

    const saveEditModel = async () => {
        if (!editingModel) return;
        setLoading(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            const parsed = JSON.parse(editJson);
            const res = await fetch('/api/system/attributes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: editingModel.key,
                    attributePool: parsed.attributePool,
                    attributeSetPreset: parsed.attributeSetPreset
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Update failed.');

            setSuccessMsg('Attribute Model updated successfully!');
            setEditingModel(null);
            await loadOverview();
        } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : 'Invalid JSON or Update Failed.');
        } finally {
            setLoading(false);
        }
    };

    // Group diffs by industry for tree rendering
    const diffsByIndustry = diffResult
        ? diffResult.diffs.reduce<Record<string, AttributeDiff[]>>((acc, d) => {
            if (!acc[d.industryKey]) acc[d.industryKey] = [];
            acc[d.industryKey].push(d);
            return acc;
        }, {})
        : {};

    return (
        <div className="divide-y divide-slate-800/50">
            {/* Header panel */}
            <div className="p-4 bg-slate-900/40 border-b border-slate-800/50 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">
                            Business Attribute Catalog (Super Admin)
                        </div>
                        <p className="text-[11px] text-slate-500 max-w-3xl">
                            Browse the bundled <code className="text-slate-400">business-attributes.catalog.json</code>,
                            preview diffs against <code className="text-slate-400">kalp_system.business_attribute_models</code>,
                            and sync/commit when ready.
                        </p>
                    </div>
                    <button
                        onClick={loadOverview}
                        disabled={loading}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-700 text-[11px] text-slate-300 hover:border-slate-600 disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Stat pills */}
                {overview && (
                    <div className="flex flex-wrap gap-3">
                        <Pill label="Catalog Version" value={overview.catalogVersion} color="cyan" />
                        <Pill label="Catalog Industries" value={String(overview.catalogIndustryCount)} color="violet" />
                        <Pill label="Catalog Business Types" value={String(overview.catalogBusinessTypeCount)} color="blue" />
                        <Pill label="DB Attribute Models" value={String(overview.dbModels.length)} color="emerald" />
                    </div>
                )}

                {/* Action row */}
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={loadOverview}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-700 text-slate-300 text-xs hover:border-slate-600 disabled:opacity-50"
                    >
                        <Database size={12} /> Load Overview
                    </button>
                    <button
                        onClick={runDiff}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/10 disabled:opacity-50"
                    >
                        <Eye size={12} /> {loading && !syncing ? 'Running…' : 'Preview Diff'}
                    </button>
                    {diffResult && (diffResult.insertCount > 0 || diffResult.updateCount > 0) && (
                        <button
                            onClick={runSync}
                            disabled={syncing}
                            className="flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-500 text-black text-xs font-bold hover:bg-emerald-400 disabled:opacity-50"
                        >
                            <RotateCcw size={12} className={syncing ? 'animate-spin' : ''} />
                            {syncing ? 'Syncing…' : 'Commit Sync'}
                        </button>
                    )}

                    <div className="flex-1"></div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-500/10 disabled:opacity-50 ml-auto"
                    >
                        <Upload size={12} /> {loading && !syncing ? 'Uploading…' : 'Import JSON'}
                    </button>
                    <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={handleFileUpload} />

                    <button
                        onClick={downloadSample}
                        className="flex items-center gap-1 px-3 py-1.5 rounded border border-slate-700 text-slate-400 text-xs hover:text-slate-200 hover:border-slate-500"
                    >
                        <Download size={12} /> Sample JSON
                    </button>
                </div>

                {/* Messages */}
                {errorMsg && (
                    <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2">
                        <AlertTriangle size={12} /> {errorMsg}
                    </div>
                )}
                {successMsg && (
                    <div className="flex items-center gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded px-3 py-2">
                        <CheckCircle2 size={12} /> {successMsg}
                    </div>
                )}
            </div>

            {/* Sync result */}
            {syncResult && (
                <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/20 flex gap-6 text-xs">
                    <StatBox label="Inserted" value={syncResult.inserted} color="emerald" />
                    <StatBox label="Updated" value={syncResult.updated} color="amber" />
                    <StatBox label="Total Synced" value={syncResult.total} color="cyan" />
                </div>
            )}

            {/* Diff result */}
            {diffResult && (
                <div className="p-4 space-y-3">
                    {/* Summary chips */}
                    <div className="flex flex-wrap gap-3 mb-2">
                        <DiffChip label="Total Types" count={diffResult.totalCatalogTypes} color="slate" />
                        <DiffChip label="New" count={diffResult.insertCount} color="emerald" />
                        <DiffChip label="Changed" count={diffResult.updateCount} color="amber" />
                        <DiffChip label="Unchanged" count={diffResult.unchangedCount} color="slate" />
                    </div>

                    {/* Diff tree grouped by industry */}
                    {Object.entries(diffsByIndustry).map(([industryKey, items]) => {
                        const hasChanges = items.some((i) => i.action !== 'unchanged');
                        const expanded = expandedIndustries.has(industryKey);
                        return (
                            <div key={industryKey} className="rounded-lg border border-slate-800/60 bg-black/20 overflow-hidden">
                                <button
                                    onClick={() => toggleIndustry(industryKey)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-slate-800/30"
                                >
                                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    <span className="font-bold text-slate-200">{items[0].industry}</span>
                                    <span className="text-slate-500 font-mono ml-1">{industryKey}</span>
                                    <span className="ml-auto text-slate-500">{items.length} types</span>
                                    {hasChanges && (
                                        <span className="text-amber-400 text-[10px] font-bold bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded-full">
                                            needs sync
                                        </span>
                                    )}
                                </button>
                                {expanded && (
                                    <div className="divide-y divide-slate-800/40">
                                        {items.map((diff) => (
                                            <div
                                                key={diff.businessTypeKey}
                                                className="grid grid-cols-[auto_1fr_auto] gap-3 items-start px-4 py-2 text-[11px]"
                                            >
                                                <span className={`flex items-center gap-1 font-mono font-bold ${ACTION_COLORS[diff.action] || ''}`}>
                                                    {ACTION_ICONS[diff.action]}
                                                    {diff.action}
                                                </span>
                                                <div>
                                                    <div className="text-slate-200 font-medium">{diff.businessType}</div>
                                                    {diff.field && (
                                                        <div className="text-[10px] mt-0.5 font-mono text-slate-500">
                                                            field: <span className="text-amber-300">{diff.field}</span>
                                                            {diff.before !== undefined && (
                                                                <>
                                                                    {' '}
                                                                    <span className="text-rose-300/70 line-through">
                                                                        {JSON.stringify(diff.before)?.slice(0, 50)}
                                                                    </span>
                                                                    {' → '}
                                                                    <span className="text-emerald-300/80">
                                                                        {JSON.stringify(diff.after)?.slice(0, 50)}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-slate-600 font-mono text-[10px]">{diff.businessTypeKey}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* DB Models list (when overview loaded, no diff) */}
            {overview && !diffResult && (
                <div className="p-4 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2">
                        <FileSearch size={12} />
                        DB Attribute Models ({overview.dbModels.length})
                    </div>
                    {overview.dbModels.length === 0 ? (
                        <div className="text-xs text-slate-500 py-6 text-center">
                            No attribute models in DB yet. Run "Preview Diff" then "Commit Sync" to populate.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800/50 rounded-lg border border-slate-800 overflow-hidden">
                            {overview.dbModels.map((model) => (
                                <div key={model._id || model.key} className="grid grid-cols-[1fr_1fr_auto_auto] gap-3 items-center px-4 py-2.5 text-[11px] hover:bg-slate-800/20">
                                    <div>
                                        <div className="text-slate-200 font-medium">{model.businessType || model.businessTypeKey}</div>
                                        <div className="text-slate-500 font-mono text-[10px]">{model.industryKey}</div>
                                    </div>
                                    <div className="text-slate-400 font-mono text-[10px]">{model.key}</div>
                                    <span className="text-slate-500">
                                        {Array.isArray(model.attributePool) ? model.attributePool.length : 0} attrs
                                    </span>
                                    <span
                                        className={`text-[10px] px-1.5 py-0.5 rounded-full border ${model.status === 'published'
                                            ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                                            : 'text-slate-400 bg-slate-800 border-slate-700'
                                            }`}
                                    >
                                        {model.source || model.status || 'n/a'}
                                    </span>
                                    <button
                                        onClick={() => openEditModel(model)}
                                        className="ml-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs flex items-center gap-1 transition-colors"
                                    >
                                        <Edit3 size={12} /> Revise
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Edit DB Model Modal */}
            {editingModel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden h-[85vh]">
                        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                    <Edit3 size={18} className="text-cyan-400" />
                                    Revise Attribute Set
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 font-mono tracking-wide">
                                    {editingModel.industry} <ChevronRight size={10} className="inline opacity-50" /> {editingModel.businessType} <span className="opacity-50">({editingModel.key})</span>
                                </p>
                            </div>
                            <button onClick={() => setEditingModel(null)} className="text-slate-500 hover:text-white transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto bg-slate-950/50">
                            <div className="mb-2 flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">JSON Editor (attributePool & attributeSetPreset)</label>
                            </div>
                            <textarea
                                value={editJson}
                                onChange={(e) => setEditJson(e.target.value)}
                                className="w-full h-full min-h-[400px] bg-black text-emerald-400 font-mono text-sm p-4 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50"
                                spellCheck={false}
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                            <button onClick={() => setEditingModel(null)} className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition-colors">
                                Cancel
                            </button>
                            <button onClick={saveEditModel} disabled={loading} className="px-4 py-2 rounded-lg text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 transition-colors">
                                <Save size={16} /> {loading ? 'Saving...' : 'Save Revisions'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Initial empty state */}
            {!overview && !diffResult && !loading && (
                <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
                    <FileSearch size={32} className="text-slate-700" />
                    <span>Click <strong className="text-slate-400">Load Overview</strong> to see existing attribute models, or <strong className="text-slate-400">Preview Diff</strong> to compare catalog vs DB.</span>
                </div>
            )}
        </div>
    );
}

// ---- small presentational atoms ----

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] bg-${color}-500/10 border-${color}-500/20 text-${color}-300`}>
            <span className="text-slate-500">{label}:</span>
            <span className="font-mono font-bold">{value}</span>
        </div>
    );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className={`text-2xl font-black text-${color}-400`}>{value}</span>
            <span className="text-slate-500">{label}</span>
        </div>
    );
}

function DiffChip({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <span className={`text-[11px] px-2 py-1 rounded-full border bg-${color}-500/10 border-${color}-500/20 text-${color}-300 font-mono`}>
            {count} {label}
        </span>
    );
}
