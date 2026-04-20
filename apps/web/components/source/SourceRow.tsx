'use client';

import { useMemo, useState } from 'react';
import type { SourceApplyPreviewDto, SourceEntityRefDto, SourceRecordDto } from '@/lib/contracts/source';
import { SourceInputPopover } from './SourceInputPopover';
import { SourceSuggestionsAccordion } from './SourceSuggestionsAccordion';
import { SourceReferenceChips } from './SourceReferenceChips';

type SourceRowProps = {
    targetType: string;
    currentValues: Record<string, unknown>;
    refs: SourceEntityRefDto[];
    enabled?: boolean;
    title?: string;
    description?: string;
    onRefsChange: (refs: SourceEntityRefDto[]) => void;
    onApplyPatch: (patch: Record<string, unknown>) => void;
};

function setByPath(target: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('.').filter(Boolean);
    let cursor: Record<string, unknown> = target;

    for (let i = 0; i < parts.length; i += 1) {
        const key = parts[i];
        if (i === parts.length - 1) {
            cursor[key] = value;
            return;
        }
        const next = cursor[key];
        if (!next || typeof next !== 'object' || Array.isArray(next)) {
            cursor[key] = {};
        }
        cursor = cursor[key] as Record<string, unknown>;
    }
}

function toSourceId(value: SourceRecordDto['_id'] | undefined): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value.toString();
}

export function SourceRow({
    targetType,
    currentValues,
    refs,
    enabled = true,
    title = 'Source',
    description = 'Use Source/Srot to ingest link, text, JSON, or file metadata and apply suggestions.',
    onRefsChange,
    onApplyPatch,
}: SourceRowProps) {
    const [open, setOpen] = useState(false);
    const [preview, setPreview] = useState<SourceApplyPreviewDto | null>(null);
    const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
    const [lastSource, setLastSource] = useState<SourceRecordDto | null>(null);
    const [loadingPreview, setLoadingPreview] = useState(false);
    const [applying, setApplying] = useState(false);
    const [error, setError] = useState('');

    const selectedPathSet = useMemo(() => new Set(selectedPaths), [selectedPaths]);

    if (!enabled) {
        return (
            <section className="rounded-xl border border-slate-800/80 bg-slate-900/20 p-4">
                <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
                <p className="mt-1 text-xs text-slate-500">Source module is disabled for this tenant.</p>
            </section>
        );
    }

    async function handleIngested(source: SourceRecordDto) {
        const sourceId = toSourceId(source._id);
        if (!sourceId) {
            setError('Ingest succeeded but source id is missing.');
            return;
        }

        setLoadingPreview(true);
        setError('');
        setLastSource(source);
        setPreview(null);
        setSelectedPaths([]);

        try {
            const res = await fetch(`/api/sources/${sourceId}/apply-preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetType,
                    currentValues,
                }),
            });
            const data = await res.json();
            if (!res.ok || data?.error) {
                throw new Error(data?.error || 'Failed to generate source preview.');
            }

            const nextPreview = data as SourceApplyPreviewDto;
            setPreview(nextPreview);
            setSelectedPaths(nextPreview.changes.filter(item => item.selected).map(item => item.fieldPath));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to build source preview.');
        } finally {
            setLoadingPreview(false);
        }
    }

    function togglePath(fieldPath: string) {
        setSelectedPaths((prev) => (
            prev.includes(fieldPath)
                ? prev.filter(path => path !== fieldPath)
                : [...prev, fieldPath]
        ));
    }

    function applyPatch() {
        if (!preview || !lastSource) return;
        const patch: Record<string, unknown> = {};
        for (const change of preview.changes) {
            if (!selectedPathSet.has(change.fieldPath)) continue;
            setByPath(patch, change.fieldPath, change.suggestedValue);
        }

        setApplying(true);
        onApplyPatch(patch);

        const sourceId = toSourceId(lastSource._id);
        const ref: SourceEntityRefDto = {
            sourceId,
            inputType: lastSource.inputType,
            createdAt: new Date().toISOString(),
            label: typeof lastSource.normalized?.title === 'string'
                ? lastSource.normalized.title
                : lastSource.origin?.url || lastSource.origin?.fileName || `SRC-${sourceId.slice(-6)}`,
        };

        const map = new Map(refs.map(item => [item.sourceId, item]));
        map.set(ref.sourceId, ref);
        onRefsChange(Array.from(map.values()));

        setApplying(false);
    }

    function removeRef(sourceId: string) {
        onRefsChange(refs.filter(ref => ref.sourceId !== sourceId));
    }

    return (
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                    <p className="mt-1 text-xs text-slate-400">{description}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300"
                >
                    {open ? 'Hide Source Input' : 'Add Source'}
                </button>
            </div>

            <div className="mt-3">
                <SourceReferenceChips refs={refs} onRemove={removeRef} />
            </div>

            <div className="mt-3">
                <SourceInputPopover
                    open={open}
                    onClose={() => setOpen(false)}
                    onIngested={handleIngested}
                />
            </div>

            {loadingPreview && <p className="mt-3 text-xs text-slate-400">Building apply preview...</p>}
            {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}

            {preview && (
                <div className="mt-3">
                    <SourceSuggestionsAccordion
                        preview={preview}
                        selectedPaths={selectedPaths}
                        onTogglePath={togglePath}
                        onApply={applyPatch}
                        applying={applying}
                    />
                </div>
            )}

            {lastSource?.warnings?.length ? (
                <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {lastSource.warnings.join(' ')}
                </div>
            ) : null}
        </section>
    );
}
