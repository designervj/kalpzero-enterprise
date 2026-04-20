import { Edit3, Trash2, Plus, Upload, FileSpreadsheet, RefreshCw, RotateCcw, Eye, ChevronDown, Download, AlertCircle, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resolveAdminIcon } from '@/lib/admin-icon-catalog';

interface TemplatesViewProps {
    items: any[];
    onDelete: (id: string) => void;
    onReload: () => void | Promise<void>;
    viewMode?: 'list' | 'grid';
}

interface BusinessTypesTableProps {
    industry: any;
    onEdit: (industryKey: string, typeKey: string) => void;
    onDelete: (industryId: string, typeKey: string) => void;
    onExport: (industryKey: string, typeKey: string) => void;
}

function BusinessTypesTable({ industry, onEdit, onDelete, onExport }: BusinessTypesTableProps) {
    const renderIcon = (icon: string | undefined, className = 'text-xl') => {
        const Icon = resolveAdminIcon(icon);
        if (Icon) {
            return (
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70">
                    <Icon size={12} />
                </span>
            );
        }
        return <span className={className}>{icon || '•'}</span>;
    };

    return (
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-black/20">
            <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[10px] uppercase tracking-widest text-slate-500 font-bold border-b border-slate-800">
                    <tr>
                        <th className="px-4 py-3">Business Type</th>
                        <th className="px-4 py-3">Key (Slug)</th>
                        <th className="px-4 py-3">Modules</th>
                        <th className="px-4 py-3 text-center">Attrs</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {industry.businessTypes?.map((bt: any) => (
                        <tr key={bt.key} className="hover:bg-slate-800/10 transition-colors group">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    {renderIcon(bt.icon)}
                                    <span className="font-semibold text-slate-200">{bt.name}</span>
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <code className="text-[10px] bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-700/50 text-slate-400">
                                    {bt.key}
                                </code>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                    {bt.enabledModules?.slice(0, 3).map((m: string) => (
                                        <span key={m} className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[9px] font-bold uppercase">
                                            {m}
                                        </span>
                                    ))}
                                    {bt.enabledModules?.length > 3 && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-[9px]">
                                            +{bt.enabledModules.length - 3}
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-400">
                                {bt.attributePool?.length || 0}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(industry.key || industry.industry.toLowerCase().replace(/\s+/g, '-'), bt.key)}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                                        title="Edit Business Type"
                                    >
                                        <Edit3 size={14} />
                                    </button>
                                    <button
                                        onClick={() => onExport(industry.key || industry.industry.toLowerCase().replace(/\s+/g, '-'), bt.key)}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-cyan-400 transition-colors"
                                        title="Export JSON"
                                    >
                                        <Download size={14} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(industry._id, bt.key)}
                                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {(!industry.businessTypes || industry.businessTypes.length === 0) && (
                        <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-slate-500 italic">
                                No business types configured for this industry yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export function TemplatesView({ items, onDelete, onReload, viewMode = 'list' }: TemplatesViewProps) {
    const router = useRouter();
    const [expandedIndustryId, setExpandedIndustryId] = useState<string | null>(null);
    const [industryName, setIndustryName] = useState('Real Estate & Property');
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [importError, setImportError] = useState('');
    const [regenPreview, setRegenPreview] = useState<any | null>(null);
    const [regenRunning, setRegenRunning] = useState(false);
    const [regenMessage, setRegenMessage] = useState('');
    const [regenError, setRegenError] = useState('');
    const [syncingKey, setSyncingKey] = useState<string | null>(null);
    const isGrid = viewMode === 'grid';

    const runCatalogRegen = async (dryRun: boolean) => {
        setRegenRunning(true);
        setRegenError('');
        setRegenMessage('');
        try {
            const res = await fetch('/api/system/templates/regen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dryRun }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Regen failed.');
            setRegenPreview(payload);
            if (dryRun) {
                setRegenMessage(`Preview: ${payload.insertedIndustries} new, ${payload.updatedIndustries} changed, ${payload.unchangedIndustries} unchanged. ${payload.diffCount} field changes.`);
            } else {
                setRegenMessage(`Synced: ${payload.insertedIndustries} inserted, ${payload.updatedIndustries} updated.`);
                setRegenPreview(null);
                await onReload();
            }
        } catch (err: unknown) {
            setRegenError(err instanceof Error ? err.message : 'Regen failed.');
        } finally {
            setRegenRunning(false);
        }
    };

    const runWorkbookImport = async (mode: 'preview' | 'apply') => {
        if (!importFile) {
            setImportError('Select a workbook file first.');
            return;
        }

        setImporting(true);
        setImportError('');
        setImportMessage('');

        try {
            const formData = new FormData();
            formData.append('file', importFile);
            formData.append('mode', mode);
            formData.append('industryName', industryName.trim() || 'Real Estate & Property');

            const response = await fetch('/api/system/templates/import', {
                method: 'POST',
                body: formData,
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(typeof payload?.error === 'string' ? payload.error : 'Workbook import failed.');
            }

            if (mode === 'preview') {
                setImportMessage('Preview generated.');
            } else {
                setImportMessage('Workbook applied.');
                await onReload();
            }
        } catch (error: unknown) {
            setImportError(error instanceof Error ? error.message : 'Workbook import failed.');
        } finally {
            setImporting(false);
        }
    };



    const handleEditBusinessType = (industryKey: string, businessTypeKey: string) => {
        router.push(`/admin/registry/business-template/${industryKey}?type=${businessTypeKey}`);
    };

    const handleDeleteBusinessType = async (industryId: string, businessTypeKey: string) => {
        if (!confirm(`Delete business type "${businessTypeKey}"?`)) return;

        try {
            const industry = items.find(i => i._id === industryId);
            if (!industry) return;

            const updatedTypes = industry.businessTypes.filter((bt: any) => bt.key !== businessTypeKey);
            const res = await fetch('/api/system/templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: industryId, businessTypes: updatedTypes }),
            });

            if (!res.ok) throw new Error('Failed to delete.');
            await onReload();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const handleExportBusinessType = (industryKey: string, businessTypeKey: string) => {
        const industry = items.find(i => i.key === industryKey || i.industry.toLowerCase().replace(/\s+/g, '-') === industryKey);
        if (!industry) return;
        const bt = industry.businessTypes.find((bt: any) => bt.key === businessTypeKey);
        if (!bt) return;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bt, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${businessTypeKey}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleExportIndustry = (industryKey: string) => {
        const industry = items.find(i => i.key === industryKey || i.industry.toLowerCase().replace(/\s+/g, '-') === industryKey);
        if (!industry) return;

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(industry, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${industryKey}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleSyncIndustry = async (industryKey: string) => {
        setSyncingKey(industryKey);
        try {
            const res = await fetch('/api/system/templates/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: industryKey }),
            });
            const data = await res.json();
            
            if (res.status === 404) {
                // Fallback: File not found
                alert('JSON file not found on server.');
                return;
            }

            if (!res.ok) throw new Error(data.error || 'Sync failed');
            
            // Re-trigger global reload
            await onReload();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSyncingKey(null);
        }
    };

    const renderIndustryIcon = (icon: string | undefined, className = 'text-xl') => {
        const Icon = resolveAdminIcon(icon);
        if (Icon) {
            return (
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900/70">
                    <Icon size={14} />
                </span>
            );
        }
        return <span className={className}>{icon || '•'}</span>;
    };

    return (
        <div className={`divide-y divide-slate-800/50 ${viewMode === 'grid' ? 'bg-slate-900/10' : ''}`}>
            {/* Industry Registry Header */}
            <div className="p-6 bg-slate-900/40 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight uppercase">Industry Registry</h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">Manage vertical templates and attribute sets</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onReload()}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 text-xs text-slate-300 hover:bg-slate-800 hover:border-slate-600 transition-all"
                    >
                        <RefreshCw size={14} /> Refresh Registry
                    </button>
                    <button
                        onClick={() => router.push('/admin/registry/business-template/new')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={16} /> Add New Business Type
                    </button>
                </div>
            </div>

            <div className="p-4 flex justify-between items-center bg-slate-900/40">
                <span className="text-xs text-slate-400 font-mono">Manage templates and their nested business types</span>
                <button
                    onClick={() => router.push('/admin/registry/business-template/new')}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all"
                >
                    <Plus size={14} /> Add New Business Type
                </button>
            </div>

            <div className={isGrid ? 'grid gap-3 p-4 md:grid-cols-2' : ''}>
                {items.map((t: any) => {
                    const isExpanded = expandedIndustryId === t._id;
                    const industryKey = t.key || t.industry.toLowerCase().replace(/\s+/g, '-');
                    return (
                        <div key={t._id} className={`transition-all border-b border-slate-800/30 ${isExpanded ? 'bg-slate-800/20' : 'hover:bg-slate-800/5'}`}>
                            <div className="flex items-center justify-between p-5 cursor-pointer group" onClick={() => setExpandedIndustryId(isExpanded ? null : t._id)}>
                                <div className="flex items-center gap-4">
                                    {renderIndustryIcon(t.icon)}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-white uppercase tracking-tight">{t.industry}</span>
                                            <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-700/50">{industryKey}</span>
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                            {t.businessTypes?.length || 0} Business Types • Updated {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : 'recently'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`flex gap-2 transition-opacity opacity-0 group-hover:opacity-100`}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/admin/registry/business-template/${industryKey}`); }}
                                            className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-white"
                                            title="Edit Industry"
                                        >
                                            <Edit3 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleExportIndustry(industryKey); }}
                                            className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-cyan-400"
                                            title="Export Industry JSON"
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleSyncIndustry(industryKey); }}
                                            disabled={syncingKey === industryKey}
                                            className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-amber-400 disabled:opacity-50"
                                            title="Sync from public/json"
                                        >
                                            <RefreshCw size={14} className={syncingKey === industryKey ? 'animate-spin' : ''} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDelete(t._id); }}
                                            className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-rose-400"
                                            title="Delete Industry"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                                    <BusinessTypesTable
                                        industry={t}
                                        onEdit={handleEditBusinessType}
                                        onDelete={handleDeleteBusinessType}
                                        onExport={handleExportBusinessType}
                                    />
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            onClick={() => router.push(`/admin/registry/business-template/${industryKey}?action=add`)}
                                            className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                        >
                                            <Plus size={10} /> Add Business Type to {t.industry}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {items.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-xs">No business templates found.</div>
            )}

        </div>
    );
}
