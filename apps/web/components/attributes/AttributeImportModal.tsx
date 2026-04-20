"use client";

import { useState, useRef } from 'react';
import { Upload, X, FileJson, CheckCircle2, AlertCircle, Download, ListFilter } from 'lucide-react';

interface AttributeImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AttributeImportModal({ isOpen, onClose, onSuccess }: AttributeImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importing, setImporting] = useState(false);
    const [results, setResults] = useState<{ count: number; errors: any[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'application/json' && !selectedFile.name.endsWith('.json')) {
                setError('Please upload a valid JSON file.');
                return;
            }
            setFile(selectedFile);
            setError(null);
            setResults(null);

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const json = JSON.parse(event.target?.result as string);
                    if (Array.isArray(json)) {
                        setPreviewData(json);
                    } else if (typeof json === 'object' && json !== null) {
                        setPreviewData([json]);
                    } else {
                        setError('Invalid JSON format. Expected an array or object.');
                    }
                } catch (err) {
                    setError('Failed to parse JSON file.');
                }
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;
        setImporting(true);
        setError(null);

        try {
            const res = await fetch('/api/ecommerce/attributes/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(previewData),
            });

            const data = await res.json();
            if (res.ok) {
                setResults({ count: data.count, errors: data.errors || [] });
                if (data.count > 0) {
                    onSuccess();
                }
            } else {
                setError(data.error || 'Failed to import attribute sets.');
            }
        } catch (err) {
            setError('An error occurred during import.');
        } finally {
            setImporting(false);
        }
    };

    const downloadSample = () => {
        const sample = [
            {
                name: "Apparel Size",
                key: "apparel-size",
                appliesTo: "product",
                contexts: ["fashion", "apparel"],
                attributes: [
                    { 
                        key: "size", 
                        label: "Size", 
                        type: "select", 
                        options: ["S", "M", "L", "XL", "XXL"],
                        enabled: true
                    }
                ]
            },
            {
                name: "Color Options",
                key: "color-options",
                appliesTo: "product",
                attributes: [
                    { 
                        key: "color", 
                        label: "Color", 
                        type: "select", 
                        options: ["Red", "Blue", "Black", "White"],
                        enabled: true
                    }
                ]
            }
        ];
        const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-attributes-import.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setError(null);
        setResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-4xl bg-[#0a0a0c] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-500/10 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <ListFilter size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white leading-tight">Import Attribute Sets</h2>
                            <p className="text-sm text-slate-400">Upload a JSON file to bulk create attribute sets.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!results && (
                        <div 
                            className={`border-2 border-dashed rounded-2xl p-8 transition-all flex flex-col items-center justify-center gap-4 cursor-pointer
                                ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                <Upload size={32} />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-semibold text-white">{file ? file.name : "Click to upload JSON"}</p>
                                <p className="text-sm text-slate-500 mt-1">or drag and drop your file here</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); downloadSample(); }} className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 font-medium transition-colors">
                                <Download size={14} /> Download Sample JSON
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 animate-in slide-in-from-top-2">
                            <AlertCircle size={20} />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {results && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-emerald-400 leading-tight">Import Completed</h3>
                                    <p className="text-sm text-emerald-300/80">{results.count} attribute sets created successfully.</p>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest px-1">Issues ({results.errors.length})</h4>
                                    <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800">
                                        {results.errors.map((err, i) => (
                                            <div key={i} className="p-4 bg-slate-900/40 flex items-start gap-3">
                                                <AlertCircle size={16} className="text-rose-500 mt-0.5" />
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-200">{err.name}</p>
                                                    <p className="text-xs text-rose-400 mt-0.5">{err.error}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {previewData.length > 0 && !results && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Preview ({previewData.length})</h3>
                                <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
                            </div>
                            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20">
                                <table className="w-full text-left text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900/60 border-b border-slate-800">
                                            <th className="px-4 py-3 font-bold text-slate-300">Name</th>
                                            <th className="px-4 py-3 font-bold text-slate-300">Key</th>
                                            <th className="px-4 py-3 font-bold text-slate-300">Applies To</th>
                                            <th className="px-4 py-3 font-bold text-slate-300">Attributes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {previewData.slice(0, 10).map((set, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="px-4 py-3 text-white font-medium">{set.name}</td>
                                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">{set.key || '-'}</td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] uppercase font-bold text-slate-400 border border-slate-700">
                                                        {set.appliesTo || 'product'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {Array.isArray(set.attributes) ? `${set.attributes.length} fields` : '0 fields'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {previewData.length > 10 && (
                                    <div className="p-3 text-center border-t border-slate-800 bg-slate-900/40">
                                        <p className="text-xs text-slate-500 font-medium">... and {previewData.length - 10} more attribute sets</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900/40 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                        disabled={importing}
                    >
                        {results ? "Close" : "Cancel"}
                    </button>
                    {!results && (
                        <button 
                            onClick={handleImport}
                            disabled={previewData.length === 0 || importing}
                            className="px-8 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={18} />
                                    Confirm Import
                                </>
                            )}
                        </button>
                    )}
                    {results && (
                        <button 
                            onClick={reset}
                            className="px-8 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-black font-bold text-sm shadow-xl transition-all"
                        >
                            Import More
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
