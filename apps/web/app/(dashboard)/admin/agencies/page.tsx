'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
    ShieldAlert,
    Plus,
    Layers,
    Globe,
    Database,
    Server,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronRight,
} from 'lucide-react';

type MigrationAction = 'dry_run' | 'apply' | 'rollback';

type TenantOption = {
    id: string;
    key: string;
    name: string;
    lifecycleStatus: string;
    accountType: string;
};

type MigrationItem = {
    tenantId: string;
    tenantKey: string;
    status: string;
    error?: string | null;
    previousAssignment?: Record<string, unknown>;
    targetAssignment?: Record<string, unknown>;
};

type MigrationJob = {
    id: string;
    agencyId: string;
    action: MigrationAction;
    status: string;
    targetProfileVersion: number;
    totalTenants: number;
    scopedTenants: number;
    affectedTenants: number;
    appliedCount: number;
    failedCount: number;
    rolledBackCount: number;
    createdAt: string | null;
    startedAt?: string | null;
    completedAt?: string | null;
    executionMs?: number;
    rollbackOfMigrationId?: string | null;
    basedOnMigrationId?: string | null;
    selection?: {
        tenantKeys?: string[];
        selectedCount?: number;
    };
    items: MigrationItem[];
};

type MigrationGuardState = {
    action: Exclude<MigrationAction, 'dry_run'>;
    expectedConfirmText: string;
    affectedTenants: number;
};

function formatBytes(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDateTime(value?: string | null): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
}

function formatDurationMs(value?: number): string {
    const ms = Number(value || 0);
    if (!Number.isFinite(ms) || ms <= 0) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60_000).toFixed(2)}m`;
}

export default function AgenciesPage() {
    const { currentProfile, isLoading } = useAuth();
    const [agencies, setAgencies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [createSummary, setCreateSummary] = useState('');
    const [migrationBusy, setMigrationBusy] = useState<Record<string, boolean>>({});
    const [migrationStatus, setMigrationStatus] = useState<Record<string, string>>({});
    const [validationChecks, setValidationChecks] = useState<Array<{ key: string; status: string; message: string; hint?: string; latencyMs: number }>>([]);
    const [tenantPoolByAgency, setTenantPoolByAgency] = useState<Record<string, TenantOption[]>>({});
    const [tenantPoolLoading, setTenantPoolLoading] = useState<Record<string, boolean>>({});
    const [selectedTenantKeys, setSelectedTenantKeys] = useState<Record<string, string[]>>({});
    const [confirmTextByAgency, setConfirmTextByAgency] = useState<Record<string, string>>({});
    const [guardByAgency, setGuardByAgency] = useState<Record<string, MigrationGuardState | null>>({});
    const [historyByAgency, setHistoryByAgency] = useState<Record<string, MigrationJob[]>>({});
    const [historyLoadingByAgency, setHistoryLoadingByAgency] = useState<Record<string, boolean>>({});
    const [historyOpenByAgency, setHistoryOpenByAgency] = useState<Record<string, boolean>>({});
    const [selectedMigrationByAgency, setSelectedMigrationByAgency] = useState<Record<string, MigrationJob | null>>({});
    const [selectedMigrationItemByAgency, setSelectedMigrationItemByAgency] = useState<Record<string, string>>({});
    const [detailsLoadingByAgency, setDetailsLoadingByAgency] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState({
        name: '',
        customDomain: '',
        domainFeatureEnabled: false,
        tenantSubdomainEnabled: false,
        domainStatus: 'draft',
        fallbackToPlatform: true,
        plan: 'Starter',
        ownerAdminName: '',
        ownerAdminEmail: '',
        ownerAdminPassword: '',
        ownerAdminWorkspaceKey: '',
        maxTenants: 3,
        maxStorageMB: 5000,
        dbMode: 'kalp_managed',
        mongoUri: '',
        databaseName: '',
        storageMode: 'kalp_managed_s3',
        awsAccessKeyId: '',
        awsSecretAccessKey: '',
        awsRegion: '',
        awsBucketName: '',
        aiMode: 'kalp_managed_ai',
        aiProvider: 'openai',
        aiApiKey: '',
        aiDefaultModel: 'gpt-4o-mini',
    });

    const handleCreateAgency = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');
        setValidationChecks([]);

        try {
            const body = {
                name: formData.name,
                customDomain: formData.customDomain,
                domainSettings: {
                    enabled: formData.domainFeatureEnabled,
                    tenantSubdomainEnabled: formData.tenantSubdomainEnabled,
                    status: formData.domainStatus,
                    fallbackToPlatform: formData.fallbackToPlatform,
                },
                plan: formData.plan,
                ownerAdmin: formData.ownerAdminEmail.trim()
                    ? {
                        name: formData.ownerAdminName,
                        email: formData.ownerAdminEmail,
                        password: formData.ownerAdminPassword,
                    }
                    : undefined,
                ownerAdminWorkspaceKey: formData.ownerAdminWorkspaceKey.trim() || undefined,
                limits: {
                    maxTenants: Number(formData.maxTenants),
                    maxStorageMB: Number(formData.maxStorageMB),
                },
                infraProfile: {
                    database: {
                        mode: formData.dbMode,
                        mongoUri: formData.mongoUri,
                        databaseName: formData.databaseName,
                    },
                    storage: {
                        mode: formData.storageMode,
                        awsAccessKeyId: formData.awsAccessKeyId,
                        awsSecretAccessKey: formData.awsSecretAccessKey,
                        awsRegion: formData.awsRegion,
                        awsBucketName: formData.awsBucketName,
                    },
                    ai: {
                        mode: formData.aiMode,
                        provider: formData.aiProvider,
                        apiKey: formData.aiApiKey,
                        defaultModel: formData.aiDefaultModel,
                    },
                }
            };

            const res = await fetch('/api/admin/agencies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                if (Array.isArray(data?.validation?.checks)) {
                            setValidationChecks(
                                data.validation.checks.map((check: any) => ({
                                    key: String(check?.key || ''),
                                    status: String(check?.status || ''),
                                    message: String(check?.message || ''),
                                    hint: check?.hint ? String(check.hint) : '',
                                    latencyMs: Number(check?.latencyMs || 0),
                                }))
                            );
                }
                throw new Error(data.error || 'Failed to create agency');
            }

            const newAgency = await res.json();
            setAgencies([newAgency, ...agencies]);
            if (newAgency?.ownerBootstrap?.email) {
                const ownerEmail = String(newAgency.ownerBootstrap.email);
                const workspaceTenant = String(newAgency.ownerBootstrap.tenantKey || '');
                setCreateSummary(`Agency owner login created: ${ownerEmail}${workspaceTenant ? ` • workspace tenant: ${workspaceTenant}` : ''}`);
            } else {
                setCreateSummary('Agency created without owner login bootstrap.');
            }
            setIsModalOpen(false);
            setValidationChecks([]);
            setFormData({
                name: '',
                customDomain: '',
                domainFeatureEnabled: false,
                tenantSubdomainEnabled: false,
                domainStatus: 'draft',
                fallbackToPlatform: true,
                plan: 'Starter',
                ownerAdminName: '',
                ownerAdminEmail: '',
                ownerAdminPassword: '',
                ownerAdminWorkspaceKey: '',
                maxTenants: 3,
                maxStorageMB: 5000,
                dbMode: 'kalp_managed',
                mongoUri: '',
                databaseName: '',
                storageMode: 'kalp_managed_s3',
                awsAccessKeyId: '',
                awsSecretAccessKey: '',
                awsRegion: '',
                awsBucketName: '',
                aiMode: 'kalp_managed_ai',
                aiProvider: 'openai',
                aiApiKey: '',
                aiDefaultModel: 'gpt-4o-mini',
            });
        } catch (err: any) {
            setErrorMsg(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchAgencies = async () => {
        const listRes = await fetch('/api/admin/agencies?includeResourceUsage=1');
        const listData = await listRes.json();
        if (Array.isArray(listData)) setAgencies(listData);
    };

    const loadTenantPool = async (agencyId: string, force = false) => {
        if (!force && Array.isArray(tenantPoolByAgency[agencyId])) return;
        setTenantPoolLoading(prev => ({ ...prev, [agencyId]: true }));
        try {
            const res = await fetch(`/api/admin/agencies/infra-migrations?agencyId=${encodeURIComponent(agencyId)}&view=tenants`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load agency tenants.');
            const tenants = Array.isArray(data?.tenants) ? data.tenants : [];
            setTenantPoolByAgency(prev => ({ ...prev, [agencyId]: tenants }));
            setSelectedTenantKeys(prev => (
                prev[agencyId] ? prev : { ...prev, [agencyId]: [] }
            ));
        } catch (error: any) {
            setMigrationStatus(prev => ({ ...prev, [agencyId]: error?.message || 'Failed to load tenant list.' }));
        } finally {
            setTenantPoolLoading(prev => ({ ...prev, [agencyId]: false }));
        }
    };

    const loadMigrationHistory = async (agencyId: string, force = false) => {
        if (!force && Array.isArray(historyByAgency[agencyId])) return;
        setHistoryLoadingByAgency(prev => ({ ...prev, [agencyId]: true }));
        try {
            const res = await fetch(`/api/admin/agencies/infra-migrations?agencyId=${encodeURIComponent(agencyId)}&limit=12`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load migration history.');
            const history = Array.isArray(data) ? data as MigrationJob[] : [];
            const initialSelection = history[0] || null;
            setHistoryByAgency(prev => ({ ...prev, [agencyId]: history }));
            setSelectedMigrationByAgency(prev => ({
                ...prev,
                [agencyId]: prev[agencyId] || initialSelection,
            }));
            if (!selectedMigrationItemByAgency[agencyId] && initialSelection?.items?.length) {
                setSelectedMigrationItemByAgency(prev => ({
                    ...prev,
                    [agencyId]: initialSelection.items[0].tenantKey,
                }));
            }
        } catch (error: any) {
            setMigrationStatus(prev => ({ ...prev, [agencyId]: error?.message || 'Failed to load migration history.' }));
        } finally {
            setHistoryLoadingByAgency(prev => ({ ...prev, [agencyId]: false }));
        }
    };

    const loadMigrationDetail = async (agencyId: string, migrationId: string) => {
        setDetailsLoadingByAgency(prev => ({ ...prev, [agencyId]: true }));
        try {
            const res = await fetch(
                `/api/admin/agencies/infra-migrations?agencyId=${encodeURIComponent(agencyId)}&migrationId=${encodeURIComponent(migrationId)}`
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load migration details.');
            const job = data as MigrationJob;
            setSelectedMigrationByAgency(prev => ({ ...prev, [agencyId]: job }));
            setSelectedMigrationItemByAgency(prev => ({
                ...prev,
                [agencyId]: prev[agencyId] || (job.items?.[0]?.tenantKey || ''),
            }));
        } catch (error: any) {
            setMigrationStatus(prev => ({ ...prev, [agencyId]: error?.message || 'Failed to load migration details.' }));
        } finally {
            setDetailsLoadingByAgency(prev => ({ ...prev, [agencyId]: false }));
        }
    };

    const toggleMigrationPanel = async (agencyId: string) => {
        const nextOpen = !historyOpenByAgency[agencyId];
        setHistoryOpenByAgency(prev => ({ ...prev, [agencyId]: nextOpen }));
        if (!nextOpen) return;
        await Promise.all([
            loadTenantPool(agencyId),
            loadMigrationHistory(agencyId),
        ]);
    };

    const toggleTenantKey = (agencyId: string, tenantKey: string) => {
        setSelectedTenantKeys(prev => {
            const existing = prev[agencyId] || [];
            const hasKey = existing.includes(tenantKey);
            const next = hasKey
                ? existing.filter((key) => key !== tenantKey)
                : [...existing, tenantKey];
            return { ...prev, [agencyId]: next };
        });
    };

    const selectAllTenants = (agencyId: string) => {
        const keys = (tenantPoolByAgency[agencyId] || []).map((tenant) => tenant.key);
        setSelectedTenantKeys(prev => ({ ...prev, [agencyId]: keys }));
    };

    const clearTenantSelection = (agencyId: string) => {
        setSelectedTenantKeys(prev => ({ ...prev, [agencyId]: [] }));
    };

    const runInfraMigration = async (agencyId: string, action: MigrationAction) => {
        setMigrationBusy(prev => ({ ...prev, [agencyId]: true }));
        setMigrationStatus(prev => ({ ...prev, [agencyId]: '' }));
        try {
            const selectedJob = selectedMigrationByAgency[agencyId];
            const selectedJobForAction = (
                (action === 'apply' && selectedJob?.action === 'dry_run')
                    || (action === 'rollback' && selectedJob?.action === 'apply')
            ) ? selectedJob : null;
            const payload: Record<string, unknown> = {
                agencyId,
                action,
                tenantKeys: selectedTenantKeys[agencyId] || [],
            };
            if (selectedJobForAction?.id) payload.migrationId = selectedJobForAction.id;
            if (confirmTextByAgency[agencyId]?.trim()) {
                payload.confirmText = confirmTextByAgency[agencyId].trim();
            }

            const res = await fetch('/api/admin/agencies/infra-migrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 412 && data?.expectedConfirmText) {
                    setGuardByAgency(prev => ({
                        ...prev,
                        [agencyId]: {
                            action: action === 'rollback' ? 'rollback' : 'apply',
                            expectedConfirmText: String(data.expectedConfirmText),
                            affectedTenants: Number(data.affectedTenants || 0),
                        },
                    }));
                    setMigrationStatus(prev => ({
                        ...prev,
                        [agencyId]: `Confirmation required: type "${String(data.expectedConfirmText)}" and retry.`,
                    }));
                    return;
                }
                throw new Error(data?.error || 'Migration action failed.');
            }

            const migration = (data?.migration || null) as MigrationJob | null;
            setGuardByAgency(prev => ({ ...prev, [agencyId]: null }));
            if (migration) {
                setSelectedMigrationByAgency(prev => ({ ...prev, [agencyId]: migration }));
                setSelectedMigrationItemByAgency(prev => ({
                    ...prev,
                    [agencyId]: migration.items?.[0]?.tenantKey || '',
                }));
                const message = `${action.toUpperCase()}: ${migration.status || 'done'} • affected ${migration.affectedTenants || 0}`;
                setMigrationStatus(prev => ({ ...prev, [agencyId]: message }));
            } else {
                setMigrationStatus(prev => ({ ...prev, [agencyId]: `${action.toUpperCase()}: completed.` }));
            }

            if (action !== 'dry_run') await fetchAgencies();
            await loadMigrationHistory(agencyId, true);
        } catch (error: any) {
            setMigrationStatus(prev => ({ ...prev, [agencyId]: error?.message || 'Migration action failed.' }));
        } finally {
            setMigrationBusy(prev => ({ ...prev, [agencyId]: false }));
        }
    };

    useEffect(() => {
        if (!['platform_owner', 'platform_admin'].includes(currentProfile)) {
            setLoading(false);
            return;
        }

        fetchAgencies()
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [currentProfile]);

    if (isLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500"></div>
                    <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Loading Agency Framework...</span>
                </div>
            </div>
        );
    }

    if (!['platform_owner', 'platform_admin'].includes(currentProfile)) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                <ShieldAlert className="mb-4 h-16 w-16 text-rose-500/70" />
                <h1 className="mb-2 text-2xl font-bold text-slate-100">Super Admin Required</h1>
                <p className="max-w-md text-slate-400">
                    The agency management console requires Platform Owner/Admin privileges. You do not have sufficient permissions to view or manage global organizational tenants.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col p-8 pl-12">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Layers className="text-cyan-500" />
                        Agencies & Partners
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">Manage white-label agency clients and their resource pools.</p>
                </div>
                <button
                    onClick={() => {
                        setErrorMsg('');
                        setCreateSummary('');
                        setValidationChecks([]);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                    <Plus size={16} />
                    Onboard Agency
                </button>
            </header>

            {createSummary ? (
                <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                    {createSummary}
                </div>
            ) : null}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Plus className="text-cyan-400" />
                                Provision New Agency
                            </h2>
                            <button onClick={() => {
                                setIsModalOpen(false);
                                setValidationChecks([]);
                            }} className="text-slate-400 hover:text-white transition-colors">&times;</button>
                        </div>

                        {errorMsg && (
                            <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-3 text-sm text-rose-400">
                                {errorMsg}
                            </div>
                        )}
                        {validationChecks.length > 0 ? (
                            <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
                                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">Validation Diagnostics</div>
                                <div className="space-y-1.5 text-xs">
                                    {validationChecks.map((check, idx) => (
                                        <div key={`${check.key}_${idx}`} className="rounded border border-slate-700/80 bg-slate-950/70 p-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold uppercase text-slate-200">{check.key}</span>
                                                <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase ${
                                                    check.status === 'pass'
                                                        ? 'bg-emerald-500/20 text-emerald-300'
                                                        : check.status === 'skip'
                                                            ? 'bg-slate-700 text-slate-300'
                                                            : 'bg-rose-500/20 text-rose-300'
                                                }`}>
                                                    {check.status}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-slate-300">{check.message}</div>
                                            {check.hint ? (
                                                <div className="mt-1 text-[10px] text-amber-200">Hint: {check.hint}</div>
                                            ) : null}
                                            <div className="mt-1 text-[10px] text-slate-500">Latency: {check.latencyMs}ms</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <form onSubmit={handleCreateAgency} className="space-y-6">
                            {/* General Information */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">General</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-sm text-slate-300">Agency Name *</label>
                                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                            placeholder="e.g. Acme Web Studio" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-sm text-slate-300">Plan Tier *</label>
                                        <select value={formData.plan} onChange={e => setFormData({ ...formData, plan: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none">
                                            <option value="Starter">Starter</option>
                                            <option value="Pro">Pro</option>
                                            <option value="Enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="mb-1 block text-sm text-slate-300">Custom Domain</label>
                                        <input type="text" value={formData.customDomain} onChange={e => setFormData({ ...formData, customDomain: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none placeholder-slate-600"
                                            placeholder="e.g. builder.acmestudio.com" />
                                    </div>
                                    <div className="col-span-2 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Agency Domain Feature</div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.domainFeatureEnabled}
                                                    onChange={e => setFormData({ ...formData, domainFeatureEnabled: e.target.checked })}
                                                />
                                                Enable feature
                                            </label>
                                            <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.tenantSubdomainEnabled}
                                                    onChange={e => setFormData({ ...formData, tenantSubdomainEnabled: e.target.checked })}
                                                />
                                                Enable {'<tenantSlug>.agencydomain.com'}
                                            </label>
                                            <label className="inline-flex items-center gap-2 text-xs text-slate-200">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.fallbackToPlatform}
                                                    onChange={e => setFormData({ ...formData, fallbackToPlatform: e.target.checked })}
                                                />
                                                Fallback to platform URL
                                            </label>
                                            <div>
                                                <label className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-slate-500">Status</label>
                                                <select
                                                    value={formData.domainStatus}
                                                    onChange={e => setFormData({ ...formData, domainStatus: e.target.value })}
                                                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-white focus:border-cyan-500 focus:outline-none"
                                                >
                                                    <option value="draft">draft</option>
                                                    <option value="active">active</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Agency Owner Login (Optional)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-sm text-slate-300">Owner Name</label>
                                        <input
                                            type="text"
                                            value={formData.ownerAdminName}
                                            onChange={e => setFormData({ ...formData, ownerAdminName: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                            placeholder="Agency Owner"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-sm text-slate-300">Owner Email</label>
                                        <input
                                            type="email"
                                            value={formData.ownerAdminEmail}
                                            onChange={e => setFormData({ ...formData, ownerAdminEmail: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                            placeholder="owner@agency.com"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-sm text-slate-300">Owner Password</label>
                                        <input
                                            type="password"
                                            value={formData.ownerAdminPassword}
                                            onChange={e => setFormData({ ...formData, ownerAdminPassword: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                            placeholder="Minimum 8 characters"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-sm text-slate-300">Agency Workspace Tenant Key (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.ownerAdminWorkspaceKey}
                                            onChange={e => setFormData({ ...formData, ownerAdminWorkspaceKey: e.target.value })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                                            placeholder="agency_acme_control"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Resource Limits */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Resource Limits</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm text-slate-300">Max Tenants</label>
                                        <input required type="number" min="1" value={formData.maxTenants} onChange={e => setFormData({ ...formData, maxTenants: parseInt(e.target.value) })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm text-slate-300">Max Storage (MB)</label>
                                        <input required type="number" min="100" value={formData.maxStorageMB} onChange={e => setFormData({ ...formData, maxStorageMB: parseInt(e.target.value) })}
                                            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none" />
                                        <div className="text-xs text-slate-500 mt-1">Default 5000MB (5GB)</div>
                                    </div>
                                </div>
                            </div>

                            {/* Agency Managed Database */}
                            <div className="space-y-4 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/5 p-4">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-fuchsia-300">Database Provider</h3>
                                    <Database size={14} className="text-fuchsia-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'kalp_managed', label: 'Kalp Managed Cluster' },
                                        { key: 'agency_managed_mongo', label: 'Agency Mongo Cluster' },
                                    ].map(option => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, dbMode: option.key })}
                                            className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${formData.dbMode === option.key ? 'border-fuchsia-400 bg-fuchsia-500/15 text-fuchsia-200' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                {formData.dbMode === 'agency_managed_mongo' && (
                                    <div className="grid grid-cols-2 gap-4 pt-1">
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-xs text-slate-300">Mongo URI</label>
                                            <input
                                                type="password"
                                                value={formData.mongoUri}
                                                onChange={e => setFormData({ ...formData, mongoUri: e.target.value })}
                                                placeholder="mongodb+srv://..."
                                                className="w-full rounded-lg border border-fuchsia-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-fuchsia-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-xs text-slate-300">Database Name Pattern</label>
                                            <input
                                                type="text"
                                                value={formData.databaseName}
                                                onChange={e => setFormData({ ...formData, databaseName: e.target.value })}
                                                placeholder="kalp_tenant_{tenantKey}"
                                                className="w-full rounded-lg border border-fuchsia-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-fuchsia-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bring Your Own Backend (AWS) */}
                            <div className="space-y-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Storage Provider</h3>
                                    <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] uppercase font-bold text-indigo-300">AWS S3</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'kalp_managed_s3', label: 'Kalp Managed S3' },
                                        { key: 'agency_managed_s3', label: 'Agency S3 Bucket' },
                                    ].map(option => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, storageMode: option.key })}
                                            className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${formData.storageMode === option.key ? 'border-indigo-400 bg-indigo-500/15 text-indigo-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400">When agency storage mode is active, new tenants under this agency upload to agency S3 with encrypted credentials.</p>

                                {formData.storageMode === 'agency_managed_s3' && (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-xs text-slate-300">AWS Access Key ID</label>
                                            <input type="text" value={formData.awsAccessKeyId} onChange={e => setFormData({ ...formData, awsAccessKeyId: e.target.value })}
                                                className="w-full rounded-lg border border-indigo-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-xs text-slate-300">AWS Secret Access Key</label>
                                            <input type="password" value={formData.awsSecretAccessKey} onChange={e => setFormData({ ...formData, awsSecretAccessKey: e.target.value })}
                                                className="w-full rounded-lg border border-indigo-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-xs text-slate-300">Region</label>
                                            <input type="text" value={formData.awsRegion} onChange={e => setFormData({ ...formData, awsRegion: e.target.value })} placeholder="us-east-1"
                                                className="w-full rounded-lg border border-indigo-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-xs text-slate-300">Bucket Name</label>
                                            <input type="text" value={formData.awsBucketName} onChange={e => setFormData({ ...formData, awsBucketName: e.target.value })}
                                                className="w-full rounded-lg border border-indigo-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* AI Provider */}
                            <div className="space-y-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
                                <div className="flex items-start justify-between">
                                    <h3 className="text-sm font-semibold uppercase tracking-widest text-cyan-300">AI Provider</h3>
                                    <Server size={14} className="text-cyan-300" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { key: 'kalp_managed_ai', label: 'Kalp Managed AI' },
                                        { key: 'agency_managed_ai', label: 'Agency API Key' },
                                    ].map(option => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, aiMode: option.key })}
                                            className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${formData.aiMode === option.key ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-300'}`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                {formData.aiMode === 'agency_managed_ai' && (
                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-xs text-slate-300">Provider</label>
                                            <select
                                                value={formData.aiProvider}
                                                onChange={e => setFormData({ ...formData, aiProvider: e.target.value })}
                                                className="w-full rounded-lg border border-cyan-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                            >
                                                <option value="openai">OpenAI</option>
                                                <option value="anthropic">Anthropic</option>
                                                <option value="google">Google Gemini</option>
                                                <option value="openrouter">OpenRouter</option>
                                                <option value="groq">Groq</option>
                                                <option value="xai">xAI</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-xs text-slate-300">Default Model</label>
                                            <input
                                                type="text"
                                                value={formData.aiDefaultModel}
                                                onChange={e => setFormData({ ...formData, aiDefaultModel: e.target.value })}
                                                className="w-full rounded-lg border border-cyan-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="mb-1 block text-xs text-slate-300">API Key</label>
                                            <input
                                                type="password"
                                                value={formData.aiApiKey}
                                                onChange={e => setFormData({ ...formData, aiApiKey: e.target.value })}
                                                className="w-full rounded-lg border border-cyan-900 bg-slate-900 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmitting} className="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50">
                                    {isSubmitting ? 'Provisioning...' : 'Provision Agency'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {agencies.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 py-24 text-center">
                        <Layers className="mb-4 h-12 w-12 text-slate-600" />
                        <h3 className="mb-2 text-lg font-medium text-slate-300">No Agencies Found</h3>
                        <p className="text-sm text-slate-500 max-w-sm">No agency partners have been onboarded yet. Create your first agency to begin provisioning white-labeled instances.</p>
                    </div>
                ) : (
                    agencies.map(agency => (
                        <div key={agency._id} className="group flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition-all hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                            <div>
                                <div className="mb-3 flex items-center justify-between">
                                    <h3 className="font-semibold text-slate-200 text-lg line-clamp-1" title={agency.name}>
                                        {agency.name}
                                    </h3>
                                    <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                                        {agency.plan || 'Starter'}
                                    </span>
                                </div>

                                <div className="space-y-2 mt-4 text-sm">
                                    <div className="flex items-center gap-2 text-slate-400 bg-slate-950/50 p-2 rounded-md border border-slate-800">
                                        <Globe size={14} className="text-emerald-500 shrink-0" />
                                        <span className="truncate">{agency.customDomain || 'No custom domain'}</span>
                                    </div>
                                    <a
                                        href={`/agency/settings?agencyId=${encodeURIComponent(String(agency._id || ''))}`}
                                        className="inline-flex items-center rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-200 hover:border-cyan-300 hover:text-cyan-100"
                                    >
                                        Open Domain Settings
                                    </a>
                                    <div className="flex flex-wrap gap-2 text-[10px]">
                                        <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-300">
                                            DB: {agency.infraProfile?.database?.mode || 'kalp_managed'}
                                        </span>
                                        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-indigo-300">
                                            Storage: {agency.infraProfile?.storage?.mode || 'kalp_managed_s3'}
                                        </span>
                                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-cyan-300">
                                            AI: {agency.infraProfile?.ai?.mode || 'kalp_managed_ai'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-slate-800/80 pt-4 text-xs">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-slate-500 mb-1 flex items-center gap-1.5"><Database size={12} /> Businesses</div>
                                        <div className="font-medium text-slate-300">
                                            {(agency.limits?.activeTenants ?? agency.limits?.activeBusinesses ?? 0)} <span className="text-slate-600">/ {(agency.limits?.maxTenants ?? agency.limits?.maxBusinesses ?? '?')}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1 flex items-center gap-1.5"><Server size={12} /> Storage</div>
                                        <div className="font-medium text-slate-300">
                                            {agency.limits?.maxStorageMB ? `${Math.round(agency.limits.maxStorageMB / 1024)}GB` : 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1 flex items-center gap-1.5"><Server size={12} /> Users</div>
                                        <div className="font-medium text-slate-300">
                                            {agency.usage?.userCount ?? 0}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1 flex items-center gap-1.5"><Database size={12} /> Tenants</div>
                                        <div className="font-medium text-slate-300">
                                            {agency.usage?.tenantCount ?? 0}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                                    <div>
                                        <div className="text-slate-500 mb-1">DB Data</div>
                                        <div className="font-medium text-slate-200">
                                            {formatBytes(Number(agency.usage?.resources?.dbDataBytes ?? 0))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Media Storage</div>
                                        <div className="font-medium text-slate-200">
                                            {formatBytes(Number(agency.usage?.resources?.storageBytes ?? 0))}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">AI Messages (30d)</div>
                                        <div className="font-medium text-slate-200">
                                            {Number(agency.usage?.resources?.aiMessages30d ?? 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-slate-500 mb-1">Alerts</div>
                                        <div className="font-medium text-slate-200">
                                            <span className="text-amber-300">{Number(agency.usage?.resources?.warningCount ?? 0)} W</span>
                                            {' · '}
                                            <span className="text-rose-300">{Number(agency.usage?.resources?.criticalCount ?? 0)} C</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 border-t border-slate-800/80 pt-4">
                                    <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-slate-500">Infra Migration Utility</div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            disabled={Boolean(migrationBusy[agency._id])}
                                            onClick={() => runInfraMigration(agency._id, 'dry_run')}
                                            className="rounded-md border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-60"
                                        >
                                            Dry Run
                                        </button>
                                        <button
                                            type="button"
                                            disabled={Boolean(migrationBusy[agency._id])}
                                            onClick={() => runInfraMigration(agency._id, 'apply')}
                                            className="rounded-md border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-60"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            type="button"
                                            disabled={Boolean(migrationBusy[agency._id])}
                                            onClick={() => runInfraMigration(agency._id, 'rollback')}
                                            className="rounded-md border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-amber-500/50 hover:text-amber-300 disabled:opacity-60"
                                        >
                                            Rollback
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleMigrationPanel(agency._id)}
                                            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950/70 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:border-slate-500"
                                        >
                                            {historyOpenByAgency[agency._id] ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                            Details
                                        </button>
                                    </div>
                                    {migrationStatus[agency._id] ? (
                                        <div className="mt-2 text-[11px] text-slate-400">{migrationStatus[agency._id]}</div>
                                    ) : null}
                                    {historyOpenByAgency[agency._id] ? (
                                        <div className="mt-3 space-y-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
                                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                                                <div className="font-semibold text-slate-300">
                                                    Tenant Scope ({(selectedTenantKeys[agency._id] || []).length}/{(tenantPoolByAgency[agency._id] || []).length})
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => loadTenantPool(agency._id, true)}
                                                        className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] hover:border-cyan-500/50 hover:text-cyan-300"
                                                    >
                                                        <RefreshCw size={11} />
                                                        Refresh
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectAllTenants(agency._id)}
                                                        className="rounded border border-slate-700 px-2 py-1 text-[10px] hover:border-emerald-500/50 hover:text-emerald-300"
                                                    >
                                                        Select All
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => clearTenantSelection(agency._id)}
                                                        className="rounded border border-slate-700 px-2 py-1 text-[10px] hover:border-amber-500/50 hover:text-amber-300"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                            {tenantPoolLoading[agency._id] ? (
                                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Loading tenants...
                                                </div>
                                            ) : (
                                                <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/70 p-2">
                                                    {(tenantPoolByAgency[agency._id] || []).length === 0 ? (
                                                        <div className="text-[11px] text-slate-500">No tenants under this agency.</div>
                                                    ) : (
                                                        (tenantPoolByAgency[agency._id] || []).map((tenant) => {
                                                            const checked = (selectedTenantKeys[agency._id] || []).includes(tenant.key);
                                                            return (
                                                                <label
                                                                    key={tenant.id}
                                                                    className="flex cursor-pointer items-center justify-between rounded px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800/60"
                                                                >
                                                                    <span className="truncate pr-2">
                                                                        {tenant.name} <span className="text-slate-500">({tenant.key})</span>
                                                                    </span>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => toggleTenantKey(agency._id, tenant.key)}
                                                                        className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-cyan-500"
                                                                    />
                                                                </label>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            )}
                                            {guardByAgency[agency._id] ? (
                                                <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-[11px]">
                                                    <div className="text-amber-200">
                                                        High-impact {guardByAgency[agency._id]?.action} guard for {guardByAgency[agency._id]?.affectedTenants} tenants.
                                                    </div>
                                                    <div className="text-amber-300">
                                                        Type <span className="font-mono">{guardByAgency[agency._id]?.expectedConfirmText}</span> to continue.
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmTextByAgency((prev) => ({
                                                            ...prev,
                                                            [agency._id]: guardByAgency[agency._id]?.expectedConfirmText || '',
                                                        }))}
                                                        className="rounded border border-amber-500/50 px-2 py-1 text-[10px] font-semibold text-amber-200 hover:bg-amber-500/20"
                                                    >
                                                        Use Required Phrase
                                                    </button>
                                                </div>
                                            ) : null}
                                            <input
                                                value={confirmTextByAgency[agency._id] || ''}
                                                onChange={(event) => setConfirmTextByAgency((prev) => ({
                                                    ...prev,
                                                    [agency._id]: event.target.value,
                                                }))}
                                                placeholder={`Confirmation text (required only for high-impact)`}
                                                className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                                            />

                                            <div className="border-t border-slate-800 pt-2">
                                                <div className="mb-2 flex items-center justify-between text-[11px]">
                                                    <span className="font-semibold text-slate-300">Job History</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => loadMigrationHistory(agency._id, true)}
                                                        className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
                                                    >
                                                        <RefreshCw size={11} />
                                                        Refresh
                                                    </button>
                                                </div>
                                                {historyLoadingByAgency[agency._id] ? (
                                                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        Loading migration history...
                                                    </div>
                                                ) : (
                                                    <div className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-slate-800 bg-slate-950/70 p-2">
                                                        {(historyByAgency[agency._id] || []).length === 0 ? (
                                                            <div className="text-[11px] text-slate-500">No migration history yet.</div>
                                                        ) : (
                                                            (historyByAgency[agency._id] || []).map((job) => {
                                                                const isSelected = selectedMigrationByAgency[agency._id]?.id === job.id;
                                                                return (
                                                                    <button
                                                                        key={job.id}
                                                                        type="button"
                                                                        onClick={() => loadMigrationDetail(agency._id, job.id)}
                                                                        className={`w-full rounded border px-2 py-1 text-left text-[11px] transition-colors ${isSelected
                                                                            ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-100'
                                                                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                                                                            }`}
                                                                    >
                                                                        <div className="font-semibold uppercase">{job.action}</div>
                                                                        <div className="text-slate-400">
                                                                            {job.status} • affected {job.affectedTenants}
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                                {selectedMigrationByAgency[agency._id] ? (() => {
                                                    const selectedMigration = selectedMigrationByAgency[agency._id];
                                                    const items = selectedMigration?.items || [];
                                                    const statusCounts = items.reduce<Record<string, number>>((acc, item) => {
                                                        const key = item.status || 'unknown';
                                                        acc[key] = (acc[key] || 0) + 1;
                                                        return acc;
                                                    }, {});
                                                    const selectedItemKey = selectedMigrationItemByAgency[agency._id] || items[0]?.tenantKey || '';
                                                    const selectedItem = items.find((item) => item.tenantKey === selectedItemKey) || items[0] || null;
                                                    return (
                                                        <div className="mt-2 rounded-md border border-slate-800 bg-slate-950/70 p-2 text-[11px]">
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <div className="font-semibold text-slate-200">
                                                                    Selected #{selectedMigration?.id.slice(-6)}
                                                                </div>
                                                                {detailsLoadingByAgency[agency._id] ? (
                                                                    <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                                                                ) : null}
                                                            </div>
                                                            <div className="text-slate-400">
                                                                {selectedMigration?.action.toUpperCase()} • {selectedMigration?.status}
                                                            </div>
                                                            <div className="text-slate-400">
                                                                Scoped {selectedMigration?.scopedTenants} • Affected {selectedMigration?.affectedTenants}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap gap-1 text-[9px] uppercase">
                                                                {Object.entries(statusCounts).map(([status, count]) => (
                                                                    <span key={`${selectedMigration?.id}_${status}`} className="rounded border border-slate-700 px-1.5 py-0.5 text-slate-400">
                                                                        {status}:{count}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="mt-1 text-[10px] text-slate-500">
                                                                Created: {formatDateTime(selectedMigration?.createdAt)}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">
                                                                Started: {formatDateTime(selectedMigration?.startedAt || null)} • Completed: {formatDateTime(selectedMigration?.completedAt || null)}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500">
                                                                Duration: {formatDurationMs(selectedMigration?.executionMs || 0)}
                                                                {' • '}Selected Scope: {selectedMigration?.selection?.selectedCount ?? 0}
                                                            </div>
                                                            {selectedMigration?.rollbackOfMigrationId ? (
                                                                <div className="text-[10px] text-amber-300">
                                                                    Rollback of job: {selectedMigration.rollbackOfMigrationId.slice(-6)}
                                                                </div>
                                                            ) : null}

                                                            <div className="mt-2 rounded border border-slate-800 bg-slate-900/80 p-2">
                                                                <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Tenant Snapshot Drilldown</div>
                                                                <select
                                                                    value={selectedItemKey}
                                                                    onChange={(event) => setSelectedMigrationItemByAgency((prev) => ({
                                                                        ...prev,
                                                                        [agency._id]: event.target.value,
                                                                    }))}
                                                                    className="mb-2 h-8 w-full rounded border border-slate-700 bg-slate-950 px-2 text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
                                                                >
                                                                    {items.map((item) => (
                                                                        <option key={`${selectedMigration?.id}_${item.tenantId}`} value={item.tenantKey}>
                                                                            {item.tenantKey} ({item.status})
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                                {selectedItem ? (
                                                                    <>
                                                                        <div className="text-[10px] text-slate-300">
                                                                            Tenant: {selectedItem.tenantKey} • Status: {selectedItem.status}
                                                                        </div>
                                                                        {selectedItem.error ? (
                                                                            <div className="text-[10px] text-rose-300">Error: {selectedItem.error}</div>
                                                                        ) : null}
                                                                        <div className="mt-1 grid gap-2 md:grid-cols-2">
                                                                            <div>
                                                                                <div className="mb-1 text-[10px] text-slate-500">Previous Assignment</div>
                                                                                <pre className="max-h-24 overflow-auto rounded border border-slate-800 bg-slate-950/80 p-1.5 text-[9px] text-slate-400">
                                                                                    {JSON.stringify(selectedItem.previousAssignment || {}, null, 2)}
                                                                                </pre>
                                                                            </div>
                                                                            <div>
                                                                                <div className="mb-1 text-[10px] text-slate-500">Target Assignment</div>
                                                                                <pre className="max-h-24 overflow-auto rounded border border-slate-800 bg-slate-950/80 p-1.5 text-[9px] text-slate-400">
                                                                                    {JSON.stringify(selectedItem.targetAssignment || {}, null, 2)}
                                                                                </pre>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="text-[10px] text-slate-500">No tenant snapshots available for this job.</div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 text-[10px] text-slate-500">
                                                                Tip: select a dry-run job, then click Apply. Select an apply job, then click Rollback.
                                                            </div>
                                                        </div>
                                                    );
                                                })() : null}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
