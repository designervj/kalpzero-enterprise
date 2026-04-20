'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileJson, AlertCircle, CheckCircle2, Loader2, Info, Save } from 'lucide-react';

interface ProductImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProductImportModal({ isOpen, onClose, onSuccess }: ProductImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<any>(null);
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
            setValidationErrors(null);
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

    const downloadSample = () => {
        const sample = [
            {
                name: "Sony WH-1000XM5 Headphones",
                sku: "SONY-XM5-001",
                price: 349.99,
                description: "Industry-leading noise canceling with two processors controlling 8 microphones.",
                status: "active",
                categoryIds: ["electronics", "audio"],
                images: ["https://images.unsplash.com/photo-1618366712277-722026af94bf?auto=format&fit=crop&q=80&w=800"],
                options: [
                    { label: "Color", values: ["Black", "Silver"] }
                ],
                variants: [
                    {
                        sku: "SONY-XM5-BLK",
                        title: "Black",
                        price: 349.99,
                        stock: 50,
                        optionValues: { "Color": "Black" }
                    },
                    {
                        sku: "SONY-XM5-SLV",
                        title: "Silver",
                        price: 349.99,
                        stock: 30,
                        optionValues: { "Color": "Silver" }
                    }
                ]
            },
            {
                name: "Ergonomic Office Chair",
                sku: "CHAIR-ERG-09",
                price: 289.00,
                description: "Breathable mesh back and adjustable lumbar support.",
                status: "active",
                categoryIds: ["furniture", "office"],
                images: ["https://images.unsplash.com/photo-1505797149-43b00fe59c90?auto=format&fit=crop&q=80&w=800"]
            }
        ];


        const blob = new Blob([JSON.stringify(sample, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample-products.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = async () => {
        if (previewData.length === 0) return;
        setImporting(true);
        setError(null);
        setValidationErrors(null);

        try {
            const res = await fetch('/api/ecommerce/products/bulk', {
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
                setError(data.message || data.error || 'Failed to import products.');
                if (data.details) {
                    setValidationErrors(data.details);
                }
            }
        } catch (err) {
            setError('An error occurred during import.');
        } finally {
            setImporting(false);
        }
    };

    const reset = () => {
        setFile(null);
        setPreviewData([]);
        setError(null);
        setValidationErrors(null);
        setResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <Upload size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Import Products</h2>
                            <p className="text-sm text-slate-400">Upload a JSON file to bulk create products.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Upload / Sample Section */}
                    {!file && !results && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 bg-slate-800/20 hover:bg-slate-800/40 rounded-2xl p-8 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                                    <FileJson size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-semibold">Click to upload JSON</p>
                                    <p className="text-xs text-slate-500 mt-1">Maximum file size: 5MB</p>
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".json,application/json" 
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-3 text-cyan-400">
                                        <Info size={16} />
                                        <h3 className="text-sm font-bold uppercase tracking-wider">Helpful Tip</h3>
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        Use our sample JSON template to ensure your data is formatted correctly. 
                                        You can include variants, categories, and descriptions.
                                    </p>
                                </div>
                                <button 
                                    onClick={downloadSample}
                                    className="mt-6 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl text-sm font-medium transition-all border border-slate-700 w-full"
                                >
                                    <Download size={18} />
                                    Download Sample JSON
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preview Table */}
                    {previewData.length > 0 && !results && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-center justify-between">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    Preview ({previewData.length} products)
                                </h3>
                                <button onClick={reset} className="text-xs text-rose-400 hover:text-rose-300 font-bold uppercase tracking-widest">
                                    Clear Selection
                                </button>
                            </div>
                            <div className="border border-slate-800 rounded-xl overflow-hidden bg-black/20">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-800/50 text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Product / SKU</th>
                                            <th className="px-4 py-3 text-left">Price</th>
                                            <th className="px-4 py-3 text-left">Variants</th>
                                            <th className="px-4 py-3 text-left">Category IDs</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {previewData.map((p, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/30">
                                                <td className="px-4 py-3">
                                                    <div className="text-white font-semibold">{p.name || 'Untitled'}</div>
                                                    <div className="text-slate-500 font-mono text-[10px]">{p.sku || 'N/A'}</div>
                                                </td>
                                                <td className="px-4 py-3 text-emerald-400 font-bold">
                                                    ${typeof p.price === 'number' ? p.price.toFixed(2) : (p.price || '0.00')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {Array.isArray(p.variants) ? p.variants.length : 0} variants
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">
                                                    {Array.isArray(p.categoryIds) ? p.categoryIds.join(', ') : (Array.isArray(p.categories) ? p.categories.join(', ') : 'None')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Results / Feedback */}
                    {results && (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                            <div className={`p-6 rounded-2xl flex flex-col items-center text-center gap-4 ${results.count > 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50 border border-slate-700'}`}>
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${results.count > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {results.count > 0 ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Import Complete</h3>
                                    <p className="text-slate-400 mt-1">Successfully imported {results.count} products.</p>
                                </div>
                            </div>

                            {results.errors.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-rose-400 font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
                                        <AlertCircle size={16} />
                                        Errors ({results.errors.length})
                                    </h4>
                                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                                        {results.errors.map((err, idx) => (
                                            <div key={idx} className="text-xs text-rose-300 flex items-start gap-2">
                                                <span className="opacity-50 font-mono">#{err.index + 1}</span>
                                                <span><strong>{err.name}:</strong> {err.error}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-center">
                                <button onClick={reset} className="text-cyan-400 hover:text-cyan-300 text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-xl border border-cyan-500/30 hover:bg-cyan-500/10 transition-all">
                                    Import More
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="space-y-4 animate-shake">
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3 text-rose-400">
                                <AlertCircle size={20} className="shrink-0" />
                                <div className="text-sm font-medium">{error}</div>
                            </div>

                            {validationErrors && (
                                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-4">
                                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                                        <Info size={14} />
                                        Requires Attention
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(validationErrors.missingCategoryIds?.length > 0 || validationErrors.missingCategoryNames?.length > 0) && (
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Missing Categories</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {[...validationErrors.missingCategoryIds, ...validationErrors.missingCategoryNames].map((cat: string) => (
                                                        <span key={cat} className="px-2 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-md text-[10px] font-mono">
                                                            {cat}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {validationErrors.missingOptions?.length > 0 && (
                                            <div className="space-y-2">
                                                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Missing Attributes/Options</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {validationErrors.missingOptions.map((opt: string) => (
                                                        <span key={opt} className="px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md text-[10px] font-mono">
                                                            {opt}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">
                                        Please ensure these categories and attributes are created in the system before re-importing.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                    {previewData.length > 0 && !results && (
                        <button 
                            onClick={handleImport}
                            disabled={importing}
                            className="flex items-center gap-2 bg-cyan-500 text-black px-8 py-2.5 rounded-xl text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {importing ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Confirm Import
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
