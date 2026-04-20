'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { ADMIN_ICON_OPTIONS, DEFAULT_ADMIN_ICON_KEY, resolveAdminIcon } from '@/lib/admin-icon-catalog';

interface AdminIconPickerProps {
    value?: string;
    onChange: (next: string) => void;
    label?: string;
    helperText?: string;
    compact?: boolean;
    iconOnlyGrid?: boolean;
}

export function AdminIconPicker({
    value,
    onChange,
    label,
    helperText,
    compact = false,
    iconOnlyGrid = true,
}: AdminIconPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function onDocumentClick(event: MouseEvent) {
            const target = event.target as Node;
            if (!rootRef.current?.contains(target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocumentClick);
        return () => document.removeEventListener('mousedown', onDocumentClick);
    }, [open]);

    const selectedValue = value || DEFAULT_ADMIN_ICON_KEY;
    const SelectedIcon = resolveAdminIcon(selectedValue);

    const filteredOptions = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return ADMIN_ICON_OPTIONS;
        return ADMIN_ICON_OPTIONS.filter((option) =>
            option.key.toLowerCase().includes(q) ||
            option.label.toLowerCase().includes(q) ||
            option.keywords.some((keyword) => keyword.toLowerCase().includes(q))
        );
    }, [query]);

    return (
        <div className="space-y-1.5" ref={rootRef}>
            {label && <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</label>}
            {helperText && <p className="text-[10px] text-slate-500">{helperText}</p>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen((prev) => !prev)}
                    className={`w-full rounded border border-slate-700 bg-black/50 text-left text-slate-200 transition hover:border-slate-600 ${
                        compact ? 'px-2 py-1.5 text-xs' : 'px-3 py-2 text-xs'
                    }`}
                >
                    <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                            {SelectedIcon ? (
                                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-900/80">
                                    <SelectedIcon size={14} />
                                </span>
                            ) : (
                                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-700 bg-slate-900/80 text-sm">
                                    {selectedValue}
                                </span>
                            )}
                            {!compact && <span className="font-mono text-[11px] text-slate-300">{selectedValue}</span>}
                        </span>
                        <ChevronDown size={14} className={`text-slate-500 transition ${open ? 'rotate-180' : ''}`} />
                    </span>
                </button>

                {open && (
                    <div className="absolute left-0 z-50 mt-2 w-[min(420px,calc(100vw-32px))] rounded-xl border border-slate-700 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-xl">
                        <div className="mb-2 text-[10px] text-slate-500">
                            <span className="font-semibold text-slate-300">{selectedValue}</span>
                            <span className="ml-2">• {ADMIN_ICON_OPTIONS.length} icons</span>
                        </div>
                        <div className="mb-2 flex items-center gap-2 rounded-md border border-slate-700 bg-black/50 px-2 py-1.5">
                            <Search size={12} className="text-slate-500" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search icon"
                                className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-500"
                            />
                        </div>
                        <div className={`grid max-h-72 overflow-y-auto pr-1 ${iconOnlyGrid ? 'grid-cols-8 gap-1.5' : 'grid-cols-4 gap-1'}`}>
                            {filteredOptions.map((option) => {
                                const Icon = option.icon;
                                const active = option.key === selectedValue;
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        title={option.label}
                                        onClick={() => {
                                            onChange(option.key);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className={`rounded-md border transition ${
                                            active
                                                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200'
                                                : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                                        } ${iconOnlyGrid ? 'flex h-10 w-10 items-center justify-center p-0' : 'px-2 py-2 text-left'}`}
                                    >
                                        {iconOnlyGrid ? (
                                            <span className="relative inline-flex">
                                                <Icon size={15} />
                                                {active && <Check size={11} className="absolute -right-3 -top-3 rounded-full bg-cyan-500/20 p-[1px]" />}
                                            </span>
                                        ) : (
                                            <>
                                                <div className="mb-1 flex items-center justify-between">
                                                    <Icon size={14} />
                                                    {active && <Check size={12} />}
                                                </div>
                                                <div className="truncate text-[10px] leading-tight">{option.label}</div>
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        {filteredOptions.length === 0 && (
                            <div className="px-2 py-3 text-center text-[11px] text-slate-500">No icons matched your search.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
