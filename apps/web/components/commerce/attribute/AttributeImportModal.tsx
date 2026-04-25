"use client";
import { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, Download, ListFilter, FileJson, Globe, Sparkles } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/hook/store/store';
import { bulkImportAttributes } from '@/hook/slices/commerce/attribute/attributeThunk';
import { motion, AnimatePresence } from 'framer-motion';

interface AttributeImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AttributeImportModal({ isOpen, onClose, onSuccess }: AttributeImportModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { authUser } = useSelector((state: RootState) => state.auth);
    const { currentTenant } = useSelector((state: RootState) => state.tenant);
    
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
        if (previewData.length === 0 || !authUser?.access_token || !currentTenant?.mongo_db_name) return;
        setImporting(true);
        setError(null);

        try {
            const resultAction = await dispatch(bulkImportAttributes({
                data: previewData,
                auth_token: authUser.access_token,
                'x-tenant-db': currentTenant.mongo_db_name
            }));

            if (bulkImportAttributes.fulfilled.match(resultAction)) {
                setResults({ count: previewData.length, errors: [] });
                onSuccess();
            } else {
                setError((resultAction.payload as string) || 'Failed to import attribute sets.');
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-4xl bg-slate-900/60 backdrop-blur-3xl border border-slate-800/80 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Decorative gradient background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />
                        
                        <div className="p-8 border-b border-slate-800/50 flex items-center justify-between relative z-10 bg-slate-950/20">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/5">
                                    <FileJson size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white leading-tight">Bulk <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Import</span></h2>
                                    <p className="text-sm font-medium text-slate-500">Inject JSON definitions into the attribute neural network.</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="h-10 w-10 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 hover:text-white transition-all flex items-center justify-center group"
                            >
                                <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10">
                            {!results && (
                                <motion.div 
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`group border-2 border-dashed rounded-[2rem] p-12 transition-all flex flex-col items-center justify-center gap-6 cursor-pointer
                                        ${file ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950/30 hover:bg-slate-950/50 shadow-inner'}`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 ${file ? 'bg-cyan-500 text-black scale-110' : 'bg-slate-900 text-slate-600 group-hover:text-cyan-400 group-hover:scale-110'}`}>
                                        <Upload size={36} />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <p className="text-xl font-black text-white tracking-tight">{file ? file.name : "DEPOSIT DATA PACKET"}</p>
                                        <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">DRAG AND DROP OR CLICK TO UPLOAD</p>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); downloadSample(); }} 
                                        className="px-5 py-2 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-black text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-400/30 uppercase tracking-[0.2em] transition-all flex items-center gap-3"
                                    >
                                        <Download size={14} /> Sample Schema
                                    </button>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-400"
                                >
                                    <AlertCircle size={20} />
                                    <p className="text-sm font-bold uppercase tracking-wider">{error}</p>
                                </motion.div>
                            )}

                            {results && (
                                <div className="space-y-8 animate-in zoom-in-95 duration-300">
                                    <div className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2rem] flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-white leading-tight">Injection Successful</h3>
                                            <p className="text-sm font-medium text-emerald-400/80 mt-1">{results.count} attribute sets successfully integrated into the matrix.</p>
                                        </div>
                                    </div>

                                    {results.errors.length > 0 && (
                                        <div className="space-y-4">
                                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                                                <AlertCircle size={14} className="text-rose-500" />
                                                Anomalies Detected ({results.errors.length})
                                            </h4>
                                            <div className="max-h-60 overflow-y-auto border border-slate-800/50 rounded-2xl divide-y divide-slate-800/50 bg-slate-950/20">
                                                {results.errors.map((err, i) => (
                                                    <div key={i} className="p-5 flex items-start gap-4 hover:bg-white/5 transition-colors">
                                                        <div className="w-2 h-2 rounded-full bg-rose-500 mt-2" />
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-200">{err.name}</p>
                                                            <p className="text-xs font-medium text-rose-400/80 mt-1">{err.error}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {previewData.length > 0 && !results && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center justify-between px-2">
                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                            <Sparkles size={14} className="text-amber-500" />
                                            Data Stream Preview ({previewData.length})
                                        </h3>
                                        <button onClick={reset} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest transition-all">Flush Buffer</button>
                                    </div>
                                    <div className="border border-slate-800/50 rounded-[2rem] overflow-hidden bg-slate-950/40 shadow-inner">
                                        <table className="w-full text-left text-sm">
                                            <thead>
                                                <tr className="bg-slate-900/60 border-b border-slate-800/50">
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Key</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target</th>
                                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Density</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/30">
                                                {previewData.slice(0, 5).map((set, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                                                        <td className="px-6 py-4 text-white font-bold">{set.name}</td>
                                                        <td className="px-6 py-4 text-amber-500/60 font-mono text-xs">{set.key || '-'}</td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-black text-slate-400 uppercase">
                                                                {set.appliesTo || 'product'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <Globe size={12} className="text-cyan-500/40" />
                                                                <span className="text-xs font-bold text-slate-500">
                                                                    {Array.isArray(set.attributes) ? `${set.attributes.length} Nodes` : 'Empty'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {previewData.length > 5 && (
                                            <div className="p-4 text-center border-t border-slate-800/30 bg-slate-900/40">
                                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">+ {previewData.length - 5} ADDITIONAL NODES DETECTED IN STREAM</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-800/50 bg-slate-950/40 flex items-center justify-end gap-5 relative z-10">
                            <button 
                                onClick={onClose} 
                                className="px-8 h-12 text-sm font-bold text-slate-500 hover:text-white transition-all rounded-xl"
                                disabled={importing}
                            >
                                {results ? "Acknowledge" : "Abort"}
                            </button>
                            {!results && (
                                <button 
                                    onClick={handleImport}
                                    disabled={previewData.length === 0 || importing}
                                    className="px-10 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-cyan-900/20 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale transition-all flex items-center gap-3"
                                >
                                    {importing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            Injecting...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={18} />
                                            Synchronize Stream
                                        </>
                                    )}
                                </button>
                            )}
                            {results && (
                                <button 
                                    onClick={reset}
                                    className="px-10 h-12 rounded-2xl bg-white hover:bg-slate-100 text-black font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95"
                                >
                                    New Injection
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

