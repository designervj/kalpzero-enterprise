'use client';

import { useState } from 'react';
import type { SourceInputType, SourceRecordDto } from '@/lib/contracts/source';

type SourceInputPopoverProps = {
    open: boolean;
    onClose: () => void;
    onIngested: (source: SourceRecordDto) => void;
};

const INPUT_TYPES: SourceInputType[] = ['link', 'text', 'json', 'file'];

export function SourceInputPopover({ open, onClose, onIngested }: SourceInputPopoverProps) {
    const [inputType, setInputType] = useState<SourceInputType>('link');
    const [url, setUrl] = useState('');
    const [text, setText] = useState('');
    const [jsonText, setJsonText] = useState('');
    const [fileName, setFileName] = useState('');
    const [mimeType, setMimeType] = useState('');
    const [size, setSize] = useState('0');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    if (!open) return null;

    const payload =
        inputType === 'link'
            ? { url }
            : inputType === 'text'
                ? { text }
                : inputType === 'json'
                    ? { json: jsonText }
                    : {
                        fileName,
                        mimeType,
                        size: Number(size || 0),
                    };

    async function handleIngest() {
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/sources/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ inputType, payload }),
            });
            const data = await res.json();
            if (!res.ok || data?.error || !data?.source) {
                throw new Error(data?.error || 'Failed to ingest source.');
            }
            onIngested(data.source as SourceRecordDto);
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to ingest source.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="rounded-lg border border-slate-700 bg-slate-950/80 p-3">
            <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Add Source</h4>
                <button type="button" onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200">Close</button>
            </div>

            <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                {INPUT_TYPES.map((type) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => setInputType(type)}
                        className={`rounded-lg border px-2 py-1.5 text-xs ${inputType === type ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-black/30 text-slate-400'}`}
                    >
                        {type.toUpperCase()}
                    </button>
                ))}
            </div>

            {inputType === 'link' && (
                <input
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com/package"
                    className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
            )}

            {inputType === 'text' && (
                <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Paste source text"
                    rows={6}
                    className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
            )}

            {inputType === 'json' && (
                <textarea
                    value={jsonText}
                    onChange={(event) => setJsonText(event.target.value)}
                    placeholder="Paste JSON"
                    rows={8}
                    className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm font-mono text-white"
                />
            )}

            {inputType === 'file' && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                    <input
                        value={fileName}
                        onChange={(event) => setFileName(event.target.value)}
                        placeholder="file name"
                        className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                    />
                    <input
                        value={mimeType}
                        onChange={(event) => setMimeType(event.target.value)}
                        placeholder="mime type"
                        className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                    />
                    <input
                        value={size}
                        onChange={(event) => setSize(event.target.value)}
                        placeholder="size (bytes)"
                        type="number"
                        className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                    />
                </div>
            )}

            {error && <p className="mt-2 text-xs text-rose-300">{error}</p>}

            <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Cancel</button>
                <button
                    type="button"
                    disabled={submitting}
                    onClick={handleIngest}
                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 disabled:opacity-50"
                >
                    {submitting ? 'Ingesting...' : 'Ingest'}
                </button>
            </div>
        </div>
    );
}
