'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Database, ShieldAlert, Key } from 'lucide-react';
import { HELP_METADATA_STORE, HelpMetadataKey } from '@/lib/help-metadata';
import { useAuth } from '@/components/AuthProvider';

interface HelpTipProps {
    topicKey: HelpMetadataKey;
}

export function HelpTip({ topicKey }: HelpTipProps) {
    const { currentProfile } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);

    const data = HELP_METADATA_STORE[topicKey];
    if (!data) return null;

    // Define visibility rules based on the active profile context
    const isSuperAdmin = currentProfile === 'platform_owner' || currentProfile === 'platform_admin';
    const isAgencyAdmin = currentProfile === 'tenant_owner';
    const isBusinessAdmin = currentProfile === 'tenant_admin' || currentProfile === 'staff' || currentProfile === 'viewer';

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-sm transition-all duration-300">
            {/* Header / Summary (Always visible) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-800/20 hover:bg-slate-800/40 transition-colors text-left"
            >
                <div className="flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                            {data.title} Context
                            {!isExpanded && <span className="text-xs font-normal text-slate-500 hidden sm:inline-block">— {data.summary}</span>}
                        </h4>
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Expanded Content (Progressively Disclosed) */}
            {isExpanded && (
                <div className="p-4 border-t border-slate-800 space-y-4 text-sm animate-in slide-in-from-top-2 duration-200">

                    {/* Level 1: Business Admin (Core Purpose) */}
                    <div className="space-y-3">
                        <div>
                            <span className="text-slate-400 block text-xs uppercase tracking-wider mb-1">Purpose</span>
                            <p className="text-slate-200 leading-relaxed">{data.purpose}</p>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-xs uppercase tracking-wider mb-1">Impact Surface</span>
                            <p className="text-slate-300">{data.whereItReflects}</p>
                        </div>
                    </div>

                    {/* Level 2: Agency Admin (Architectural Dependencies) */}
                    {(isAgencyAdmin || isSuperAdmin) && (
                        <div className="pt-3 border-t border-slate-800/50">
                            <span className="text-indigo-400 block text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <ShieldAlert className="w-3 h-3" /> Agency & Platform Dependencies
                            </span>
                            <p className="text-indigo-200/80">{data.dependencies}</p>
                        </div>
                    )}

                    {/* Level 3: Super Admin (Raw System Telemetry) */}
                    {isSuperAdmin && (
                        <div className="pt-3 border-t border-indigo-900/30 bg-indigo-950/20 -mx-4 -mb-4 px-4 pb-4">
                            <span className="text-rose-400 block text-xs uppercase tracking-wider mb-2 mt-2 flex items-center gap-1.5">
                                <Key className="w-3 h-3" /> Super Admin Telemetry
                            </span>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <span className="text-slate-500 text-xs block mb-1">Target Collections</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.collections.map(col => (
                                            <span key={col} className="bg-slate-900 border border-slate-700 text-xs px-2 py-0.5 rounded text-rose-300 font-mono flex items-center gap-1">
                                                <Database className="w-3 h-3" /> {col}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-500 text-xs block mb-1">Authorized Roles</span>
                                    <div className="flex flex-wrap gap-1.5">
                                        {data.roles.map(role => (
                                            <span key={role} className="bg-slate-900 border border-slate-700 text-xs px-2 py-0.5 rounded text-amber-300 font-mono">
                                                {role}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {data.superAdminNotes && (
                                <div className="mt-3 bg-rose-950/30 border border-rose-900/50 rounded p-2.5">
                                    <p className="text-rose-200/90 text-xs leading-relaxed">
                                        <strong className="text-rose-400">Warning:</strong> {data.superAdminNotes}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}
        </div>
    );
}
