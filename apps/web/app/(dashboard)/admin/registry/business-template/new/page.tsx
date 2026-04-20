'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IndustryEditor } from '@/components/admin/registry/IndustryEditor';
import { Plus, X, FileJson, AlertCircle, Upload, Download, Check, Save } from 'lucide-react';
import { DEFAULT_ADMIN_ICON_KEY } from '@/lib/admin-icon-catalog';

export default function NewBusinessTypePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedIndustry = searchParams.get('industry');

    const [loading, setLoading] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importedData, setImportedData] = useState<any[]>([]);
    const [importError, setImportError] = useState<string | null>(null);
    const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
    
    const [industryData, setIndustryData] = useState<any>(() => {
        if (preselectedIndustry) {
            return {
                industry: preselectedIndustry.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
                key: preselectedIndustry,
                icon: DEFAULT_ADMIN_ICON_KEY,
                businessTypes: []
            };
        }
        return {
            industry: '',
            key: '',
            icon: DEFAULT_ADMIN_ICON_KEY,
            businessTypes: [],
        };
    });

    const handleSave = async (data: any) => {
        setLoading(true);
        try {
            // Check if industry with this key already exists
            const checkRes = await fetch(`/api/system/templates`);
            const allIndustries = await checkRes.json();
            
            const existingIndustry = allIndustries.find((i: any) => i.key === data.key);

            if (existingIndustry) {
                // If it exists, we update it by merging business types
                // But since this is a "Create" page, maybe we should alert?
                // User requirement: "add buiness type means creating the complete adding induatry sand adding mulytiple buiness types"
                // So if it exists, adding more types is fine.
                const res = await fetch('/api/system/templates', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        _id: existingIndustry._id,
                        businessTypes: data.businessTypes,
                        industry: data.industry,
                        icon: data.icon,
                    }),
                });
                if (!res.ok) throw new Error('Failed to update existing industry.');
            } else {
                // Truly new industry
                const res = await fetch('/api/system/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });
                if (!res.ok) throw new Error('Failed to create new industry template.');
            }

            router.push('/admin/registry?tab=templates');
            router.refresh();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImportFile(file);
        setImportError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const result = event.target?.result as string;
                const parsed = JSON.parse(result);
                
                // Ensure it's an array
                const dataArray = Array.isArray(parsed) ? parsed : [parsed];
                
                // Validate basic structure
                const validData = dataArray.filter(item => item.industry || item.key);
                if (validData.length === 0) {
                    throw new Error('No valid industry records found in the JSON file. Expected an array of industry objects.');
                }
                
                setImportedData(validData);
            } catch (err: any) {
                setImportError('Failed to parse JSON file: ' + err.message);
                setImportedData([]);
            }
        };
        reader.readAsText(file);
    };

    const downloadSampleJson = () => {
        const sampleData = [
            {
                "industry": "Sample Industry",
                "key": "sample-industry",
                "icon": "Layers",
                "businessTypes": [
                    {
                        "key": "sample-type",
                        "name": "Sample Type",
                        "enabledModules": ["ecommerce"],
                        "attributePool": []
                    }
                ]
            }
        ];
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "sample_industry.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const runBatchImport = async () => {
        if (importedData.length === 0) return;
        
        setLoading(true);
        setImportProgress({ current: 0, total: importedData.length });
        
        try {
            // Check existing industries to decide POST vs PUT
            const checkRes = await fetch(`/api/system/templates`);
            const allIndustries = await checkRes.json();
            
            for (let i = 0; i < importedData.length; i++) {
                const data = importedData[i];
                if (!data.key && !data.industry) continue;
                
                const existingIndustry = allIndustries.find((existing: any) => 
                    (data.key && existing.key === data.key) || 
                    (existing.industry.toLowerCase() === data.industry?.toLowerCase())
                );
                
                if (existingIndustry) {
                    // Update existing
                    await fetch('/api/system/templates', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            _id: existingIndustry._id,
                            businessTypes: [...(existingIndustry.businessTypes || []), ...(data.businessTypes || [])],
                            industry: data.industry || existingIndustry.industry,
                            icon: data.icon || existingIndustry.icon,
                        }),
                    });
                } else {
                    // Create new
                    await fetch('/api/system/templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data),
                    });
                }
                setImportProgress({ current: i + 1, total: importedData.length });
            }

            setShowImport(false);
            setImportFile(null);
            setImportedData([]);
            setImportProgress(null);
            
            router.push('/admin/registry?tab=templates');
            router.refresh();
        } catch (err: any) {
            setImportError(err.message);
        } finally {
            setLoading(false);
            setImportProgress(null);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
            {/* Contextual Header (Above IndustryEditor Header) */}
            <div className="flex items-center justify-between border-b border-slate-800/50 p-3 bg-slate-900/40 relative z-20">
                <div className="flex items-center gap-2 px-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80">Creator Mode</span>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowImport(!showImport)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md border text-[10px] font-bold transition-all ${showImport ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'border-slate-800 text-slate-500 hover:bg-slate-800'}`}
                    >
                        <FileJson size={12} /> {showImport ? 'Close' : 'Import JSON'}
                    </button>
                    <button
                        onClick={() => router.push('/admin/registry')}
                        className="text-slate-600 hover:text-white p-1"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                {showImport && (
                    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-8 overflow-y-auto">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                        <FileJson size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white tracking-tight italic">Industry JSON Batch Import</h2>
                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Upload JSON file containing an array of industries</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={downloadSampleJson}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all"
                                    >
                                        <Download size={14} /> Sample JSON
                                    </button>
                                    <button onClick={() => { setShowImport(false); setImportFile(null); setImportedData([]); setImportError(null); }} className="text-slate-500 hover:text-white"><X size={20} /></button>
                                </div>
                            </div>
                            
                            <div className="bg-black/40 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
                                {/* Upload Area */}
                                <div className="relative border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-cyan-500/50 transition-colors">
                                    <input 
                                        type="file" 
                                        accept=".json" 
                                        onChange={handleFileUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <Upload size={32} className="mx-auto mb-3 text-slate-500" />
                                    <h3 className="text-sm font-bold text-white mb-1">
                                        {importFile ? importFile.name : 'Click or drag JSON file to upload'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono">
                                        {importFile ? `${(importFile.size / 1024).toFixed(2)} KB` : 'Must be an array of industry objects'}
                                    </p>
                                </div>

                                {importError && (
                                    <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 text-rose-400">
                                        <AlertCircle size={18} />
                                        <p className="text-xs font-bold uppercase tracking-tight">{importError}</p>
                                    </div>
                                )}

                                {/* Preview Table */}
                                {importedData.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Data Preview ({importedData.length} records)</h4>
                                        <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/50">
                                            <table className="w-full text-left text-xs text-slate-300">
                                                <thead className="bg-slate-800/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-3">Industry Name</th>
                                                        <th className="px-4 py-3">Key</th>
                                                        <th className="px-4 py-3 text-center">Business Types</th>
                                                        <th className="px-4 py-3 text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {importedData.map((item, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-800/20">
                                                            <td className="px-4 py-3 font-semibold text-slate-200">{item.industry || 'Unknown'}</td>
                                                            <td className="px-4 py-3 font-mono text-slate-500">{item.key || 'N/A'}</td>
                                                            <td className="px-4 py-3 text-center">{Array.isArray(item.businessTypes) ? item.businessTypes.length : 0}</td>
                                                            <td className="px-4 py-3 text-center text-emerald-400"><Check size={14} className="mx-auto" /></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <div className="text-xs text-emerald-400 font-mono font-bold">
                                    {importProgress && `Importing... ${importProgress.current} / ${importProgress.total}`}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => { setShowImport(false); setImportFile(null); setImportedData([]); }}
                                        className="px-6 py-2 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-800 transition-all"
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={runBatchImport}
                                        disabled={importedData.length === 0 || loading}
                                        className="flex items-center gap-2 px-8 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-xs font-black transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50"
                                    >
                                        {loading ? <span className="animate-pulse">Processing...</span> : <><Save size={16} /> Apply Batch Import</>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-hidden">
                    <IndustryEditor
                        key={JSON.stringify(industryData)}
                        initialData={industryData}
                        onSave={handleSave}
                        onCancel={() => router.push('/admin/registry')}
                        saving={loading}
                    />
                </div>
            </div>
        </div>
    );
}
