'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Globe, Save, Loader2, ShieldAlert, Sparkles, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useSearchParams } from 'next/navigation';
import { TagInput } from '@/components/ui/tag-input';
import { HelpTip } from '@/components/HelpTip';

type AgencySettings = {
    id: string;
    name: string;
    plan: string;
    ownerEmail: string;
    customDomain: string;
    urlPatternPreview: string;
    domainSettings: {
        enabled: boolean;
        tenantSubdomainEnabled: boolean;
        status: 'draft' | 'active';
        fallbackToPlatform: boolean;
    };
};

type AgencyOption = {
    _id: string;
    name: string;
};

type AgencyPlanTier = {
    key: string;
    name: string;
    badge: string;
    monthlyPrice: number;
    yearlyPrice: number;
    currency: string;
    isPublished: boolean;
    modules: string[];
    plugins: string[];
};

type AgencyEcosystem = {
    version: number;
    hubId: string;
    isHubEcosystem: boolean;
    terminologyOverrides: Record<string, string>;
    whiteLabel: {
        brandName: string;
        shortName: string;
        logoUrl: string;
        compactLogoUrl: string;
        faviconUrl: string;
    };
    media: {
        libraryName: string;
        cloudName: string;
        rootPath: string;
        sharedPrefix: string;
        enablePopulateFromKalp: boolean;
        categories: string[];
    };
    planCatalog: AgencyPlanTier[];
};

type AgencyMediaAsset = {
    id: string;
    title: string;
    category: string;
    type: string;
    url: string;
    isPopulateDefault: boolean;
    status: string;
};

function parseCsv(value: string): string[] {
    return Array.from(new Set(
        value
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
    ));
}

export default function AgencySettingsPage() {
    const { currentProfile, isLoading } = useAuth();
    const searchParams = useSearchParams();
    const requestedAgencyId = searchParams.get('agencyId') || '';
    const isPlatformRole = currentProfile === 'platform_owner' || currentProfile === 'platform_admin';
    const canEditCore = isPlatformRole;

    const [agencyOptions, setAgencyOptions] = useState<AgencyOption[]>([]);
    const [selectedAgencyId, setSelectedAgencyId] = useState(requestedAgencyId);
    const [form, setForm] = useState<AgencySettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ecosystemSaving, setEcosystemSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [ecosystem, setEcosystem] = useState<AgencyEcosystem | null>(null);
    const [mediaAssets, setMediaAssets] = useState<AgencyMediaAsset[]>([]);
    const [mediaSaving, setMediaSaving] = useState(false);
    const [mediaDraft, setMediaDraft] = useState({
        title: '',
        category: 'templates',
        type: 'image',
        url: '',
        tags: '',
        isPopulateDefault: true,
    });

    useEffect(() => {
        if (requestedAgencyId) {
            setSelectedAgencyId(requestedAgencyId);
        }
    }, [requestedAgencyId]);

    useEffect(() => {
        if (!isPlatformRole) return;
        fetch('/api/admin/agencies')
            .then((res) => res.json())
            .then((data) => {
                if (!Array.isArray(data)) return;
                setAgencyOptions(
                    data
                        .map((item: Record<string, unknown>) => ({
                            _id: String(item._id || ''),
                            name: String(item.name || 'Unnamed Agency'),
                        }))
                        .filter((item: AgencyOption) => item._id)
                );
            })
            .catch(() => undefined);
    }, [isPlatformRole]);

    const targetAgencyId = useMemo(() => {
        if (!isPlatformRole) return '';
        return selectedAgencyId || requestedAgencyId || agencyOptions[0]?._id || '';
    }, [agencyOptions, isPlatformRole, requestedAgencyId, selectedAgencyId]);

    useEffect(() => {
        if (isLoading) return;
        if (!['platform_owner', 'platform_admin', 'tenant_owner'].includes(currentProfile)) {
            setLoading(false);
            return;
        }
        if (isPlatformRole && !targetAgencyId) {
            setLoading(false);
            return;
        }

        const query = isPlatformRole && targetAgencyId
            ? `?agencyId=${encodeURIComponent(targetAgencyId)}`
            : '';

        setLoading(true);
        setErrorMessage('');
        fetch(`/api/agency/settings${query}`)
            .then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload?.error || 'Failed to load agency settings.');
                return payload as AgencySettings;
            })
            .then((payload) => {
                setForm(payload);
            })
            .catch((error: unknown) => {
                const message = error instanceof Error ? error.message : 'Failed to load agency settings.';
                setErrorMessage(message);
            })
            .finally(() => setLoading(false));

        fetch(`/api/agency/ecosystem${query}`)
            .then(async (res) => {
                const payload = await res.json();
                if (!res.ok) throw new Error(payload?.error || 'Failed to load agency ecosystem.');
                return payload?.ecosystem as AgencyEcosystem;
            })
            .then((payload) => {
                if (!payload) return;
                setEcosystem(payload);
            })
            .catch(() => undefined);

        fetch(`/api/agency/media-library${query}`)
            .then(async (res) => {
                const payload = await res.json();
                if (!res.ok || !Array.isArray(payload)) return;
                setMediaAssets(payload);
            })
            .catch(() => undefined);
    }, [currentProfile, isLoading, isPlatformRole, targetAgencyId]);

    const handleSave = async () => {
        if (!form) return;
        setSaving(true);
        setStatusMessage('');
        setErrorMessage('');
        try {
            const body: Record<string, unknown> = {
                customDomain: form.customDomain,
                domainSettings: form.domainSettings,
            };
            if (isPlatformRole) {
                body.agencyId = form.id;
                body.name = form.name;
                body.plan = form.plan;
            }

            const res = await fetch('/api/agency/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to update agency settings.');
            setForm(payload as AgencySettings);
            setStatusMessage('Agency settings saved.');
        } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update agency settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveEcosystem = async () => {
        if (!ecosystem || !form) return;
        setEcosystemSaving(true);
        setStatusMessage('');
        setErrorMessage('');
        try {
            const body: Record<string, unknown> = {
                ecosystem,
            };
            if (isPlatformRole) {
                body.agencyId = form.id;
                body.agencyName = form.name;
            }

            const res = await fetch('/api/agency/ecosystem', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to update agency ecosystem.');
            setEcosystem(payload?.ecosystem || ecosystem);
            setStatusMessage('Agency ecosystem saved.');
        } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to update agency ecosystem.');
        } finally {
            setEcosystemSaving(false);
        }
    };

    const handleCreateMediaAsset = async () => {
        if (!mediaDraft.title.trim() || !mediaDraft.url.trim()) return;
        if (!form) return;
        setMediaSaving(true);
        setErrorMessage('');
        try {
            const body: Record<string, unknown> = {
                title: mediaDraft.title.trim(),
                category: mediaDraft.category.trim() || 'templates',
                type: mediaDraft.type.trim() || 'image',
                url: mediaDraft.url.trim(),
                tags: parseCsv(mediaDraft.tags),
                isPopulateDefault: mediaDraft.isPopulateDefault,
            };
            if (isPlatformRole) body.agencyId = form.id;

            const res = await fetch('/api/agency/media-library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to create Kalp Megh asset.');

            const query = isPlatformRole && form.id ? `?agencyId=${encodeURIComponent(form.id)}` : '';
            const listRes = await fetch(`/api/agency/media-library${query}`);
            const listPayload = await listRes.json();
            setMediaAssets(Array.isArray(listPayload) ? listPayload : []);
            setMediaDraft({
                title: '',
                category: mediaDraft.category,
                type: mediaDraft.type,
                url: '',
                tags: '',
                isPopulateDefault: mediaDraft.isPopulateDefault,
            });
            setStatusMessage('Kalp Megh asset added.');
        } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to create Kalp Megh asset.');
        } finally {
            setMediaSaving(false);
        }
    };

    const handleDeleteMediaAsset = async (id: string) => {
        if (!id || !form) return;
        setMediaSaving(true);
        setErrorMessage('');
        try {
            const query = new URLSearchParams({
                id,
                ...(isPlatformRole && form.id ? { agencyId: form.id } : {}),
            }).toString();
            const res = await fetch(`/api/agency/media-library?${query}`, { method: 'DELETE' });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.error || 'Failed to delete Kalp Megh asset.');
            setMediaAssets((prev) => prev.filter((asset) => asset.id !== id));
            setStatusMessage('Kalp Megh asset deleted.');
        } catch (error: unknown) {
            setErrorMessage(error instanceof Error ? error.message : 'Failed to delete Kalp Megh asset.');
        } finally {
            setMediaSaving(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2 text-slate-300">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Loading agency domain settings...</span>
                </div>
            </div>
        );
    }

    if (!['platform_owner', 'platform_admin', 'tenant_owner'].includes(currentProfile)) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <ShieldAlert className="h-12 w-12 text-rose-400" />
                <h1 className="text-xl font-semibold text-white">Agency access required</h1>
                <p className="max-w-xl text-sm text-slate-400">
                    This page is available to Super Admin and Agency Owner profiles only.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
            <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Agency Domain Control</p>
                <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                    <Globe className="text-cyan-300" size={20} />
                    Agency Settings
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Configure agency-level domain routing and control {'<tenantSlug>.agencydomain.com'} activation.
                </p>
            </header>

            {errorMessage ? (
                <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                    {errorMessage}
                </div>
            ) : null}
            {statusMessage ? (
                <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    {statusMessage}
                </div>
            ) : null}

            {isPlatformRole && agencyOptions.length > 0 ? (
                <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                    <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Agency Scope</label>
                    <select
                        value={targetAgencyId}
                        onChange={(event) => setSelectedAgencyId(event.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                        {agencyOptions.map((agency) => (
                            <option key={agency._id} value={agency._id}>
                                {agency.name}
                            </option>
                        ))}
                    </select>
                </section>
            ) : null}

            {form ? (
                <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Agency Name</label>
                            <input
                                value={form.name}
                                disabled={!canEditCore}
                                onChange={(event) => setForm((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-70"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Plan</label>
                            <select
                                value={form.plan}
                                disabled={!canEditCore}
                                onChange={(event) => setForm((prev) => (prev ? { ...prev, plan: event.target.value } : prev))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-70"
                            >
                                <option value="Starter">Starter</option>
                                <option value="Pro">Pro</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Agency Owner Email</label>
                        <input
                            value={form.ownerEmail || ''}
                            readOnly
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-300"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Agency Domain</label>
                        <input
                            value={form.customDomain || ''}
                            onChange={(event) => setForm((prev) => (prev ? { ...prev, customDomain: event.target.value } : prev))}
                            placeholder="agencydomain.com"
                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                        />
                        <p className="mt-1 text-xs text-slate-500">Tenant URL mode: {'<tenantSlug>.agencydomain.com'}</p>
                    </div>

                    <div className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-2">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.domainSettings.enabled}
                                onChange={(event) => setForm((prev) => (
                                    prev
                                        ? {
                                            ...prev,
                                            domainSettings: { ...prev.domainSettings, enabled: event.target.checked },
                                        }
                                        : prev
                                ))}
                            />
                            Enable agency domain feature
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.domainSettings.tenantSubdomainEnabled}
                                onChange={(event) => setForm((prev) => (
                                    prev
                                        ? {
                                            ...prev,
                                            domainSettings: { ...prev.domainSettings, tenantSubdomainEnabled: event.target.checked },
                                        }
                                        : prev
                                ))}
                            />
                            Enable tenant subdomain routing
                        </label>
                        <label className="inline-flex items-center gap-2 text-sm text-slate-200">
                            <input
                                type="checkbox"
                                checked={form.domainSettings.fallbackToPlatform}
                                onChange={(event) => setForm((prev) => (
                                    prev
                                        ? {
                                            ...prev,
                                            domainSettings: { ...prev.domainSettings, fallbackToPlatform: event.target.checked },
                                        }
                                        : prev
                                ))}
                            />
                            Fallback to platform canonical URL
                        </label>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Status</label>
                            <select
                                value={form.domainSettings.status}
                                onChange={(event) => setForm((prev) => (
                                    prev
                                        ? {
                                            ...prev,
                                            domainSettings: {
                                                ...prev.domainSettings,
                                                status: event.target.value === 'active' ? 'active' : 'draft',
                                            },
                                        }
                                        : prev
                                ))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                            >
                                <option value="draft">draft</option>
                                <option value="active">active</option>
                            </select>
                        </div>
                    </div>

                    <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-100">
                        URL preview: {form.urlPatternPreview || '<tenantSlug>.agencydomain.com'}
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Save Settings
                        </button>
                    </div>

                    <div className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-slate-400">
                        Next actions: use <a href="/onboarding" className="text-cyan-300 hover:underline">Onboarding</a> to create agency tenants and
                        monitor usage in <a href="/agency/resources" className="text-cyan-300 hover:underline">Agency Resource Center</a>.
                    </div>
                </section>
            ) : null}

            {ecosystem ? (
                <section className="mt-5 space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
                    <header>
                        <p className="text-xs uppercase tracking-[0.18em] text-violet-300">Agency Ecosystem</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">White Label, Terminology, Plans</h2>
                        <p className="mt-1 text-xs text-slate-400">
                            Configure agency branding, Kalp Vistar/Niyantran/Kalp Megh labels, and tenant-facing Basic/Pro/Enterprise plan catalog.
                        </p>
                    </header>

                    <div className="mb-4">
                        <HelpTip topicKey="agency_settings" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Brand Name</label>
                            <input
                                value={ecosystem.whiteLabel.brandName}
                                onChange={(event) => setEcosystem((prev) => (
                                    prev
                                        ? { ...prev, whiteLabel: { ...prev.whiteLabel, brandName: event.target.value } }
                                        : prev
                                ))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Short Name</label>
                            <input
                                value={ecosystem.whiteLabel.shortName}
                                onChange={(event) => setEcosystem((prev) => (
                                    prev
                                        ? { ...prev, whiteLabel: { ...prev.whiteLabel, shortName: event.target.value } }
                                        : prev
                                ))}
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Logo URL</label>
                            <input
                                value={ecosystem.whiteLabel.logoUrl}
                                onChange={(event) => setEcosystem((prev) => (
                                    prev
                                        ? { ...prev, whiteLabel: { ...prev.whiteLabel, logoUrl: event.target.value } }
                                        : prev
                                ))}
                                placeholder="https://cdn.example.com/agency-logo.svg"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs uppercase tracking-[0.16em] text-slate-400">Compact Logo URL</label>
                            <input
                                value={ecosystem.whiteLabel.compactLogoUrl}
                                onChange={(event) => setEcosystem((prev) => (
                                    prev
                                        ? { ...prev, whiteLabel: { ...prev.whiteLabel, compactLogoUrl: event.target.value } }
                                        : prev
                                ))}
                                placeholder="https://cdn.example.com/agency-logo-mark.svg"
                                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Terminology Overrides</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">Media Library</label>
                                <input
                                    value={ecosystem.terminologyOverrides['nav.media'] || ''}
                                    onChange={(event) => setEcosystem((prev) => (
                                        prev
                                            ? {
                                                ...prev,
                                                terminologyOverrides: {
                                                    ...prev.terminologyOverrides,
                                                    'nav.media': event.target.value,
                                                    'global.library': event.target.value,
                                                },
                                            }
                                            : prev
                                    ))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">Control Panel</label>
                                <input
                                    value={ecosystem.terminologyOverrides['nav.settings'] || ''}
                                    onChange={(event) => setEcosystem((prev) => (
                                        prev
                                            ? {
                                                ...prev,
                                                terminologyOverrides: {
                                                    ...prev.terminologyOverrides,
                                                    'nav.settings': event.target.value,
                                                    'global.controlPanel': event.target.value,
                                                },
                                            }
                                            : prev
                                    ))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">Cloud</label>
                                <input
                                    value={ecosystem.terminologyOverrides['global.cloud'] || ''}
                                    onChange={(event) => setEcosystem((prev) => (
                                        prev
                                            ? {
                                                ...prev,
                                                terminologyOverrides: {
                                                    ...prev.terminologyOverrides,
                                                    'global.cloud': event.target.value,
                                                    'global.storage': event.target.value,
                                                },
                                            }
                                            : prev
                                    ))}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-300">Agency Plan Catalog</h3>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-semibold text-slate-500">{ecosystem.planCatalog.length} plans</span>
                                <button type="button" onClick={() => {
                                    setEcosystem(prev => {
                                        if (!prev) return prev;
                                        return {
                                            ...prev,
                                            planCatalog: [...prev.planCatalog, {
                                                key: `plan_${Date.now()}`,
                                                name: 'New Plan',
                                                badge: '',
                                                monthlyPrice: 0,
                                                yearlyPrice: 0,
                                                currency: 'USD',
                                                isPublished: true,
                                                modules: [],
                                                plugins: []
                                            }]
                                        }
                                    })
                                }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-violet-300 bg-violet-600/20 border border-violet-500/40 rounded-lg hover:bg-violet-600/30 hover:text-white transition-all shadow-sm">
                                    <Plus size={14} /> Add Plan
                                </button>
                            </div>
                        </div>
                        <div className="mt-5 space-y-5">
                            {ecosystem.planCatalog.map((plan, index) => (
                                <div key={plan.key} className="relative rounded-xl border border-slate-700/60 bg-black/40 p-5 group shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEcosystem(prev => {
                                                if (!prev) return prev;
                                                const cat = [...prev.planCatalog];
                                                cat.splice(index, 1);
                                                return { ...prev, planCatalog: cat };
                                            })
                                        }}
                                        className="absolute top-4 right-4 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Remove Plan"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="grid gap-5 md:grid-cols-4 pr-6">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Plan Name</label>
                                            <input
                                                value={plan.name}
                                                onChange={(event) => setEcosystem((prev) => {
                                                    if (!prev) return prev;
                                                    const planCatalog = [...prev.planCatalog];
                                                    planCatalog[index] = { ...planCatalog[index], name: event.target.value };
                                                    return { ...prev, planCatalog };
                                                })}
                                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Monthly Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={plan.monthlyPrice}
                                                    onChange={(event) => setEcosystem((prev) => {
                                                        if (!prev) return prev;
                                                        const planCatalog = [...prev.planCatalog];
                                                        planCatalog[index] = { ...planCatalog[index], monthlyPrice: Number(event.target.value || 0) };
                                                        return { ...prev, planCatalog };
                                                    })}
                                                    className="w-full rounded-md border border-slate-700 bg-slate-900 pl-7 pr-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Yearly Price</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-500 text-xs">$</span>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    value={plan.yearlyPrice}
                                                    onChange={(event) => setEcosystem((prev) => {
                                                        if (!prev) return prev;
                                                        const planCatalog = [...prev.planCatalog];
                                                        planCatalog[index] = { ...planCatalog[index], yearlyPrice: Number(event.target.value || 0) };
                                                        return { ...prev, planCatalog };
                                                    })}
                                                    className="w-full rounded-md border border-slate-700 bg-slate-900 pl-7 pr-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center md:pt-7">
                                            <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={plan.isPublished}
                                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-violet-500 focus:ring-violet-500 focus:ring-offset-slate-950 transition-all"
                                                    onChange={(event) => setEcosystem((prev) => {
                                                        if (!prev) return prev;
                                                        const planCatalog = [...prev.planCatalog];
                                                        planCatalog[index] = { ...planCatalog[index], isPublished: event.target.checked };
                                                        return { ...prev, planCatalog };
                                                    })}
                                                />
                                                Published
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mt-5 grid gap-5 xl:grid-cols-2">
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Modules</label>
                                            <TagInput
                                                value={plan.modules}
                                                onChange={(val) => setEcosystem((prev) => {
                                                    if (!prev) return prev;
                                                    const planCatalog = [...prev.planCatalog];
                                                    planCatalog[index] = { ...planCatalog[index], modules: val };
                                                    return { ...prev, planCatalog };
                                                })}
                                                placeholder="Add a module..."
                                                suggestions={['website', 'branding', 'products', 'ecommerce', 'marketing', 'media', 'blog', 'portfolio', 'kalpbodh']}
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-xs font-semibold text-slate-500">Plugins</label>
                                            <TagInput
                                                value={plan.plugins}
                                                onChange={(val) => setEcosystem((prev) => {
                                                    if (!prev) return prev;
                                                    const planCatalog = [...prev.planCatalog];
                                                    planCatalog[index] = { ...planCatalog[index], plugins: val };
                                                    return { ...prev, planCatalog };
                                                })}
                                                placeholder="Add a plugin..."
                                                suggestions={['catalog_builder', 'proposal_builder', 'resume_builder', 'portfolio_builder']}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
                        Media preset: {ecosystem.media.libraryName} / {ecosystem.media.cloudName} • Root {ecosystem.media.rootPath}
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Kalp Megh Assets</p>
                            <span className="text-[11px] text-slate-500">{mediaAssets.length} assets</span>
                        </div>
                        <div className="mt-3 grid gap-2 md:grid-cols-5">
                            <input
                                value={mediaDraft.title}
                                onChange={(event) => setMediaDraft((prev) => ({ ...prev, title: event.target.value }))}
                                placeholder="Title"
                                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                            />
                            <input
                                value={mediaDraft.category}
                                onChange={(event) => setMediaDraft((prev) => ({ ...prev, category: event.target.value }))}
                                placeholder="Category"
                                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                            />
                            <input
                                value={mediaDraft.type}
                                onChange={(event) => setMediaDraft((prev) => ({ ...prev, type: event.target.value }))}
                                placeholder="Type"
                                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none"
                            />
                            <input
                                value={mediaDraft.url}
                                onChange={(event) => setMediaDraft((prev) => ({ ...prev, url: event.target.value }))}
                                placeholder="https://cdn.example.com/file.png"
                                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none md:col-span-2"
                            />
                            <input
                                value={mediaDraft.tags}
                                onChange={(event) => setMediaDraft((prev) => ({ ...prev, tags: event.target.value }))}
                                placeholder="tags comma separated"
                                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-white focus:border-violet-500 focus:outline-none md:col-span-3"
                            />
                            <label className="inline-flex items-center gap-2 text-xs text-slate-300 md:col-span-1">
                                <input
                                    type="checkbox"
                                    checked={mediaDraft.isPopulateDefault}
                                    onChange={(event) => setMediaDraft((prev) => ({ ...prev, isPopulateDefault: event.target.checked }))}
                                />
                                Populate default
                            </label>
                            <button
                                type="button"
                                onClick={handleCreateMediaAsset}
                                disabled={mediaSaving}
                                className="rounded-md border border-violet-500/40 bg-violet-500/20 px-2 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-500/30 disabled:opacity-60 md:col-span-1"
                            >
                                Add Asset
                            </button>
                        </div>
                        <div className="mt-3 space-y-2">
                            {mediaAssets.map((asset) => (
                                <div key={asset.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-800 bg-black/20 px-3 py-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-semibold text-slate-100">{asset.title}</p>
                                        <p className="truncate text-[10px] text-slate-500">
                                            {asset.category} • {asset.type} • {asset.isPopulateDefault ? 'populate-default' : 'manual'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a href={asset.url} target="_blank" rel="noreferrer" className="text-[10px] text-cyan-300 hover:underline">
                                            View
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteMediaAsset(asset.id)}
                                            disabled={mediaSaving}
                                            className="rounded border border-rose-500/40 px-2 py-1 text-[10px] text-rose-200 hover:bg-rose-500/20 disabled:opacity-60"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleSaveEcosystem}
                            disabled={ecosystemSaving}
                            className="inline-flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-60"
                        >
                            {ecosystemSaving ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                            Save Ecosystem
                        </button>
                    </div>
                </section>
            ) : null}
        </div>
    );
}
