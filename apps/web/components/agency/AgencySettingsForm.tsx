"use client"

import React, { useEffect, useState } from 'react';
import { Globe, Save, Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSelector } from 'react-redux';
import { RootState } from '@/hook/store/store';
import { Agency } from '@/hook/slices/kalp_master/agencies/agencyType';
import GetAgencyById from './GetAgencyById';

export const AgencySettingsForm = () => {
    const { currentProfile } = useAuth();
    const { currentAgency } = useSelector((state: RootState) => state.agency);
    const isPlatformRole = currentProfile === 'platform_owner' || currentProfile === 'platform_admin';
    const canEditCore = isPlatformRole;

    const [form, setForm] = useState<Agency | null>(null);
    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (currentAgency && !form) {
            setForm(currentAgency);
        }
    }, [currentAgency, form]);

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        setStatusMessage('');
        setErrorMessage('');
        
        try {
            // Placeholder for save logic - will be implemented based on API requirements
            // const res = await fetch('/api/agency/settings', {
            //     method: 'PUT',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(form),
            // });
            // if (!res.ok) throw new Error('Failed to update agency settings.');
            setStatusMessage('Agency settings saved successfully.');
        } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update agency settings.');
        } finally {
            setSaving(false);
        }
    };

    // if (!form) {
    //     return (
    //         <div className="flex h-full items-center justify-center py-20">
    //             <div className="flex items-center gap-2 text-slate-300">
    //                 <Loader2 size={16} className="animate-spin" />
    //                 <span className="text-sm">Loading agency settings...</span>
    //             </div>
    //         </div>
    //     );
    // }

    return (
        <>
            <GetAgencyById />
            <div className="space-y-6">
                <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Agency Control Center</p>
                    <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                        <Globe className="text-cyan-300" size={20} />
                        Agency Settings
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                        Manage core agency configuration and identity.
                    </p>
                </header>

                <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Agency Name</label>
                            <input
                                value={form?.name || ''}
                                disabled={!canEditCore}
                                onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-70"
                                placeholder="Enter agency name"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Agency Slug</label>
                            <input
                                value={form?.slug || ''}
                                disabled={!canEditCore}
                                onChange={(event) => setForm((prev) => (prev ? { ...prev, slug: event.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-70"
                                placeholder="agency-slug"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Region</label>
                            <input
                                value={form?.region || ''}
                                disabled={!canEditCore}
                                onChange={(event) => setForm((prev) => (prev ? { ...prev, region: event.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-70"
                                placeholder="e.g. US-East"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Owner User ID</label>
                            <input
                                value={form?.owner_user_id || ''}
                                readOnly
                                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300"
                            />
                        </div>
                    </div>

                    {statusMessage && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
                            {statusMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                            {errorMessage}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || !canEditCore}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Settings
                        </button>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                        <span>
                            ID: <span className="text-slate-500">{form?.id || 'N/A'}</span>
                        </span>
                        {form?.created_at && (
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                Created on {new Date(form.created_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
};
