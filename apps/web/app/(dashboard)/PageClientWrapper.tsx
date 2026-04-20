'use client';

import React from 'react';
import { DataTable, Column } from '@/components/DataTable';
import { ShieldAlert, Globe, Users } from 'lucide-react';

interface PageClientWrapperProps {
    portfolioData: any[];
}

export function PageClientWrapper({ portfolioData }: PageClientWrapperProps) {

    const portfolioColumns: Column<any>[] = [
        {
            id: "title",
            header: "Data Model Name",
            accessor: (row) => (
                <span className="text-slate-200 font-medium tracking-wide">{(row.title || '').toUpperCase()}</span>
            )
        },
        {
            id: "status",
            header: "Processing State",
            accessor: (row) => (
                <span className={`inline-flex flex-col px-3 py-1 text-[10px] tracking-widest rounded-md border font-bold ${row.status === 'published'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[inset_0_1px_4px_rgba(16,185,129,0.2)]'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[inset_0_1px_4px_rgba(245,158,11,0.2)]'
                    }`}>
                    {row.status.toUpperCase()}
                </span>
            )
        },
        {
            id: "visibilityMeta",
            header: "Access Vector",
            accessor: (row) => {
                const scope = row.visibilityMeta?.scope;
                return (
                    <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1.5 rounded-md border border-slate-800 w-fit">
                        {scope === 'public' && <Globe size={14} className="text-blue-400" />}
                        {scope === 'tenant' && <Users size={14} className="text-purple-400" />}
                        {scope === 'role' && <ShieldAlert size={14} className="text-rose-400" />}
                        <code className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                            {scope}
                        </code>
                    </div>
                );
            }
        },
        {
            id: "adminNotes",
            header: "Encrypted Internal Meta",
            accessor: () => (
                <span className="flex items-center gap-2 text-rose-400/80">
                    <ShieldAlert size={14} />
                    <span className="italic">Classified Rank 5 required</span>
                </span>
            ),
            visibleIf: { scope: 'role', roleMin: 5 }
        }
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-10 mt-6 relative z-10">

            <header className="relative">
                <div className="inline-flex items-center justify-center p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 mb-4 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                    <DatabaseIcon />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                    Universal <span className="text-cyan-400">Data Stream</span>
                </h2>
                <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
                    Monitoring active models in the Kalp-Zero cluster.
                    Use the contextual role switcher to simulate real-time Access Vector modifications.
                </p>
            </header>

            <section className="relative">
                {/* Glow effect behind table */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-xl blur-md opacity-50 z-[-1]"></div>
                <DataTable
                    data={portfolioData}
                    columns={portfolioColumns}
                    keyExtractor={(row) => row._id.toString()}
                />
            </section>
        </div>
    );
}

function DatabaseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400">
            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
            <path d="M3 5V19A9 3 0 0 0 21 19V5"></path>
            <path d="M3 12A9 3 0 0 0 21 12"></path>
        </svg>
    );
}
