'use client';

import React, { useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { VisibilityEngine } from '@engine/visibility-engine';
import { VisibilityMeta } from '@engine/visibility-engine/types';

export interface Column<T> {
    id: string;
    header: string;
    accessor?: (row: T) => React.ReactNode;
    visibleIf?: VisibilityMeta;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string;
}

const visEngine = new VisibilityEngine();

export function DataTable<T>({ data, columns, keyExtractor }: DataTableProps<T>) {
    const authCtx = useAuth(); // Contains role, tenant, subscription

    const visibleColumns = useMemo(() => {
        return columns.filter(col => {
            if (!col.visibleIf) return true;
            return visEngine.isVisible(col.visibleIf, authCtx);
        });
    }, [columns, authCtx]);

    return (
        <div className="bg-slate-900/40 backdrop-blur-md border border-cyan-900/30 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden relative group">
            {/* Decorative top border glow */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/80 text-cyan-500 uppercase text-[10px] font-bold tracking-[0.2em] border-b border-cyan-900/50 relative">
                        <tr>
                            {visibleColumns.map(col => (
                                <th key={col.id} className="px-6 py-5 whitespace-nowrap">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.map((row) => (
                            <tr key={keyExtractor(row)} className="hover:bg-cyan-900/10 transition-colors relative group/row">
                                {/* Row Hover Indicator */}
                                <td className="absolute left-0 top-0 bottom-0 w-[2px] bg-cyan-400 opacity-0 group-hover/row:opacity-100 transition-opacity"></td>

                                {visibleColumns.map(col => (
                                    <td key={col.id} className="px-6 py-4 text-slate-300 font-mono text-xs">
                                        {col.accessor ? col.accessor(row) : (row as any)[col.id]}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {data.length === 0 && (
                            <tr>
                                <td colSpan={visibleColumns.length} className="px-6 py-16 text-center">
                                    <div className="inline-flex flex-col items-center justify-center space-y-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center border border-slate-700">
                                            <div className="w-4 h-4 rounded-full bg-slate-600 animate-pulse"></div>
                                        </div>
                                        <span className="text-slate-500 font-mono uppercase tracking-widest text-xs">No Data Streams Found</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-cyan-900/30 bg-slate-950/50 text-[10px] uppercase tracking-widest text-slate-500 flex justify-between items-center font-bold">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                    Processed {data.length} records
                </span>
                <span className="bg-cyan-950/50 text-cyan-400 border border-cyan-900/50 px-3 py-1.5 rounded-md shadow-inner">
                    Rendered Columns: {visibleColumns.length}
                </span>
            </div>
        </div>
    );
}
