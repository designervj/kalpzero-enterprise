'use client';

import type { SourceApplyPreviewDto } from '@/lib/contracts/source';

type SourceSuggestionsAccordionProps = {
    preview: SourceApplyPreviewDto;
    selectedPaths: string[];
    onTogglePath: (fieldPath: string) => void;
    onApply: () => void;
    applying?: boolean;
};

function valueToString(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

export function SourceSuggestionsAccordion({
    preview,
    selectedPaths,
    onTogglePath,
    onApply,
    applying = false,
}: SourceSuggestionsAccordionProps) {
    const selectedCount = selectedPaths.length;

    return (
        <div className="rounded-lg border border-slate-700/70 bg-black/20 p-3">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Suggestions</p>
                    <p className="text-[11px] text-slate-400">{preview.changes.length} fields • {preview.conflicts} conflicts</p>
                </div>
                <button
                    type="button"
                    disabled={selectedCount === 0 || applying}
                    onClick={onApply}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 disabled:opacity-50"
                >
                    {applying ? 'Applying...' : `Apply ${selectedCount}`}
                </button>
            </div>

            <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {preview.changes.map((change) => {
                    const selected = selectedPaths.includes(change.fieldPath);
                    return (
                        <label
                            key={change.fieldPath}
                            className={`block rounded-lg border px-3 py-2 text-xs ${change.hasConflict ? 'border-amber-500/30 bg-amber-500/10' : 'border-slate-700/60 bg-slate-900/40'}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => onTogglePath(change.fieldPath)}
                                    />
                                    <span className="font-mono text-cyan-300">{change.fieldPath}</span>
                                </div>
                                {change.hasConflict && <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-200">conflict</span>}
                            </div>
                            <div className="mt-1 grid grid-cols-1 gap-1 text-[11px] text-slate-400 md:grid-cols-2">
                                <span>Current: <span className="text-slate-300">{valueToString(change.currentValue)}</span></span>
                                <span>Suggested: <span className="text-emerald-300">{valueToString(change.suggestedValue)}</span></span>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}
