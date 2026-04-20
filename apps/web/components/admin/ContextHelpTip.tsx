'use client';

import { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getAdminHelpEntry } from '@/lib/admin/help-content';

function isSuperAdminRole(role: string) {
    return role === 'platform_owner' || role === 'platform_admin';
}

function isAgencyAdminRole(role: string) {
    return role === 'tenant_owner';
}

export function ContextHelpTip({ helpKey }: { helpKey: string }) {
    const { currentProfile } = useAuth();
    const [open, setOpen] = useState(false);
    const entry = getAdminHelpEntry(helpKey);

    const detailLevel = useMemo(() => {
        if (isSuperAdminRole(currentProfile)) return 'super';
        if (isAgencyAdminRole(currentProfile)) return 'agency';
        return 'business';
    }, [currentProfile]);

    if (!entry) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 p-1.5 text-slate-400 transition hover:border-cyan-400/50 hover:text-cyan-300"
                aria-label={`Explain ${entry.title}`}
                title={`Explain ${entry.title}`}
            >
                <Info size={13} />
            </button>
            {open ? (
                <div className="absolute right-0 z-50 mt-2 w-[360px] max-w-[80vw] rounded-xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="text-sm font-semibold text-white">{entry.title}</div>
                            <p className="mt-1 text-xs leading-relaxed text-slate-400">{entry.summary}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-md border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-widest text-slate-400 hover:border-slate-500"
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-4 space-y-3 text-xs">
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Purpose</div>
                            <p className="mt-1 text-slate-300">{entry.purpose}</p>
                        </div>
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Where This Reflects</div>
                            <ul className="mt-1 space-y-1 text-slate-300">
                                {entry.whereItReflects.map((item) => (
                                    <li key={item}>• {item}</li>
                                ))}
                            </ul>
                        </div>

                        {(detailLevel === 'agency' || detailLevel === 'super') && entry.dependencies?.length ? (
                            <div>
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Dependencies</div>
                                <ul className="mt-1 space-y-1 text-slate-300">
                                    {entry.dependencies.map((item) => (
                                        <li key={item}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {detailLevel === 'super' && entry.collections?.length ? (
                            <div>
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Technical Sources</div>
                                <ul className="mt-1 space-y-1 font-mono text-[11px] text-cyan-200">
                                    {entry.collections.map((item) => (
                                        <li key={item}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}

                        {detailLevel === 'super' && entry.superAdminNotes?.length ? (
                            <div>
                                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Super Admin Notes</div>
                                <ul className="mt-1 space-y-1 text-amber-200">
                                    {entry.superAdminNotes.map((item) => (
                                        <li key={item}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
