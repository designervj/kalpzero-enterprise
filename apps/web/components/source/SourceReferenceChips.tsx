'use client';

import type { SourceEntityRefDto } from '@/lib/contracts/source';

type SourceReferenceChipsProps = {
    refs: SourceEntityRefDto[];
    onRemove?: (sourceId: string) => void;
};

function formatDate(value: string): string {
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString();
}

export function SourceReferenceChips({ refs, onRemove }: SourceReferenceChipsProps) {
    if (refs.length === 0) {
        return <div className="text-[11px] text-slate-500">No source references linked yet.</div>;
    }

    return (
        <div className="flex flex-wrap gap-2">
            {refs.map((ref) => (
                <div key={ref.sourceId} className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                    <span className="font-mono">{ref.inputType}</span>
                    <span className="text-slate-200">{ref.label || `SRC-${ref.sourceId.slice(-6)}`}</span>
                    <span className="text-slate-400">{formatDate(ref.createdAt)}</span>
                    {onRemove && (
                        <button
                            type="button"
                            onClick={() => onRemove(ref.sourceId)}
                            className="rounded-full px-1 text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                            aria-label="Remove source reference"
                        >
                            ×
                        </button>
                    )}
                </div>
            ))}
        </div>
    );
}
