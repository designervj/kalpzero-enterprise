'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Image, Film, FileText, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';

type MediaItem = {
    _id: string;
    filename: string;
    url: string;
    type: string;
    size: number;
    alt?: string;
    tags?: string[];
    createdAt?: string;
};

type UploadState = {
    progress: 'idle' | 'uploading' | 'done' | 'error';
    message: string;
};

export default function MediaPage() {
    const [items, setItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');
    const [dragging, setDragging] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>({ progress: 'idle', message: '' });
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = useCallback(() => {
        const params = typeFilter ? `?type=${typeFilter}` : '';
        setLoading(true);
        fetch(`/api/media${params}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setItems(data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [typeFilter]);

    useEffect(() => { fetchMedia(); }, [fetchMedia]);

    const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
        image: { icon: Image, color: 'text-cyan-400', bg: 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30' },
        video: { icon: Film, color: 'text-purple-400', bg: 'bg-gradient-to-br from-purple-900/30 to-pink-900/30' },
        document: { icon: FileText, color: 'text-amber-400', bg: 'bg-gradient-to-br from-amber-900/30 to-orange-900/30' },
    };

    const formatSize = (bytes: number) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const uploadFile = async (file: File) => {
        setUploadState({ progress: 'uploading', message: `Uploading ${file.name}…` });
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Upload failed.');
            setUploadState({ progress: 'done', message: `${file.name} uploaded successfully.` });
            fetchMedia();
            setTimeout(() => setUploadState({ progress: 'idle', message: '' }), 3000);
        } catch (err: unknown) {
            setUploadState({ progress: 'error', message: err instanceof Error ? err.message : 'Upload failed.' });
        }
    };

    const handleFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        uploadFile(files[0]);
    };

    const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                        <Image size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Media Library</h2>
                        <p className="text-slate-400 text-xs font-mono">{items.length} asset{items.length !== 1 ? 's' : ''} in this workspace</p>
                    </div>
                </div>
            </div>

            {/* Upload Zone */}
            <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all
                    ${dragging
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_30px_rgba(0,240,255,0.15)]'
                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-600 hover:bg-slate-900/50'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,.pdf"
                    onChange={e => handleFiles(e.target.files)}
                />
                <div className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all
                        ${dragging ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-slate-800/60 border-slate-700 text-slate-500'}`}>
                        <Upload size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-300">
                            {dragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Images, videos, PDF — max 10 MB</p>
                    </div>
                </div>

                {/* Upload status overlay */}
                {uploadState.progress !== 'idle' && (
                    <div
                        onClick={e => e.stopPropagation()}
                        className={`absolute inset-0 rounded-xl flex items-center justify-center gap-3 text-sm font-semibold
                            ${uploadState.progress === 'uploading' ? 'bg-slate-950/80 text-cyan-300' : ''}
                            ${uploadState.progress === 'done' ? 'bg-emerald-950/80 text-emerald-300' : ''}
                            ${uploadState.progress === 'error' ? 'bg-rose-950/80 text-rose-300' : ''}
                        `}
                    >
                        {uploadState.progress === 'uploading' && (
                            <><div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />{uploadState.message}</>
                        )}
                        {uploadState.progress === 'done' && (
                            <><CheckCircle size={18} />{uploadState.message}</>
                        )}
                        {uploadState.progress === 'error' && (
                            <><AlertCircle size={18} />{uploadState.message}
                                <button
                                    onClick={() => setUploadState({ progress: 'idle', message: '' })}
                                    className="ml-2 p-0.5 hover:text-white"
                                ><X size={14} /></button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Type Filters */}
            <div className="flex gap-2">
                {(['', 'image', 'video', 'document'] as const).map(t => (
                    <button key={t} onClick={() => setTypeFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${typeFilter === t ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {t || 'All'}
                    </button>
                ))}
            </div>

            {/* Media Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No media assets found. Upload your first file above.</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map(item => {
                        const cfg = typeConfig[item.type] || typeConfig.image;
                        const TypeIcon = cfg.icon;
                        const isImage = item.type === 'image' && item.url;
                        return (
                            <div key={item._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-all group shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
                                <div className={`h-36 ${cfg.bg} flex items-center justify-center relative overflow-hidden`}>
                                    {isImage ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img
                                            src={item.url}
                                            alt={item.alt || item.filename}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    ) : (
                                        <TypeIcon size={40} className={`${cfg.color} opacity-40 group-hover:opacity-80 transition-opacity`} />
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-widest font-bold bg-black/50 ${cfg.color} border border-slate-700`}>
                                            {item.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="font-semibold text-white text-sm truncate group-hover:text-cyan-400 transition-colors">{item.filename}</div>
                                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500 font-mono">
                                        <span>{formatSize(item.size)}</span>
                                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
                                    </div>
                                    {item.tags && item.tags.length > 0 && (
                                        <div className="flex gap-1 mt-2 flex-wrap">
                                            {item.tags.slice(0, 3).map((tag: string) => (
                                                <span key={tag} className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[8px] font-mono border border-cyan-500/20">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
