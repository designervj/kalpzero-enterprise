'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    AlertTriangle,
    Database,
    HardDrive,
    MessageSquareText,
    Activity,
    RefreshCw,
    Search,
    Download,
} from 'lucide-react';

type Scope = 'agency' | 'tenant';
type AgencySort = 'name' | 'db' | 'storage' | 'ai' | 'alerts';
type TrendWindowKey = 'days7' | 'days30';
type TrendMetric = 'aiMessages' | 'aiSessions' | 'cumulativeMediaBytes';

type TrendPoint = {
    date: string;
    aiMessages: number;
    aiSessions: number;
    cumulativeMediaBytes: number;
};

function formatBytes(value: number): string {
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
        size /= 1024;
        unit += 1;
    }
    return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function toNumber(input: unknown): number {
    const value = Number(input);
    return Number.isFinite(value) ? value : 0;
}

function utilizationPercent(usedBytes: number, limitBytes: number | null): number {
    if (!limitBytes || limitBytes <= 0) return 0;
    return Math.max(0, Math.min(100, (usedBytes / limitBytes) * 100));
}

function formatMetricValue(metric: TrendMetric, value: number): string {
    if (metric === 'cumulativeMediaBytes') {
        const numeric = toNumber(Math.abs(value));
        const formatted = formatBytes(numeric);
        return value < 0 ? `-${formatted}` : formatted;
    }
    return String(toNumber(value));
}

function normalizeTrendPoints(input: unknown): TrendPoint[] {
    if (!Array.isArray(input)) return [];
    return input.map((point) => {
        const row = point as Record<string, unknown>;
        return {
            date: typeof row.date === 'string' ? row.date : '',
            aiMessages: toNumber(row.aiMessages),
            aiSessions: toNumber(row.aiSessions),
            cumulativeMediaBytes: toNumber(row.cumulativeMediaBytes),
        };
    }).filter((point) => point.date.length > 0);
}

function TrendChart(props: {
    points: TrendPoint[];
    metric: TrendMetric;
    title: string;
    source: string;
}) {
    const width = 640;
    const height = 180;
    const chartPadding = 14;
    const values = props.points.map((point) => toNumber(point[props.metric]));
    const maxValue = Math.max(1, ...values);
    const minValue = Math.min(...values);
    const range = Math.max(1, maxValue - minValue);

    const coords = props.points.map((point, index) => {
        const x = chartPadding + (index * (width - chartPadding * 2)) / Math.max(1, props.points.length - 1);
        const raw = toNumber(point[props.metric]);
        const y = (height - chartPadding) - ((raw - minValue) / range) * (height - chartPadding * 2);
        return { x, y, raw };
    });
    const pathData = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x} ${coord.y}`).join(' ');
    const latest = coords.length > 0 ? coords[coords.length - 1].raw : 0;
    const baseline = coords.length > 0 ? coords[0].raw : 0;
    const delta = latest - baseline;

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                    <div className="text-sm font-semibold text-slate-200">{props.title}</div>
                    <div className="text-[11px] text-slate-500">Source: {props.source}</div>
                </div>
                <div className="text-right text-xs">
                    <div className="text-slate-300">Latest: {formatMetricValue(props.metric, latest)}</div>
                    <div className={`${delta >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {delta >= 0 ? '+' : ''}{formatMetricValue(props.metric, delta)}
                    </div>
                </div>
            </div>
            <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full rounded-lg border border-slate-800 bg-slate-950/70">
                <line x1={chartPadding} y1={height - chartPadding} x2={width - chartPadding} y2={height - chartPadding} stroke="#1f2937" />
                <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={height - chartPadding} stroke="#1f2937" />
                {pathData ? <path d={pathData} fill="none" stroke="#22d3ee" strokeWidth="2.5" /> : null}
                {coords.map((coord, index) => (
                    <circle key={`${index}_${coord.x}`} cx={coord.x} cy={coord.y} r="2.5" fill="#67e8f9" />
                ))}
            </svg>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                <span>{props.points[0]?.date || 'N/A'}</span>
                <span>{props.points[props.points.length - 1]?.date || 'N/A'}</span>
            </div>
        </div>
    );
}

function StatCard(props: { label: string; value: string | number; hint: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                {props.icon}
                {props.label}
            </div>
            <div className="text-2xl font-semibold text-slate-100">{props.value}</div>
            <div className="mt-1 text-xs text-slate-500">{props.hint}</div>
        </div>
    );
}

export function ResourceScopePanel(input: { scope: Scope; title: string; description: string }) {
    const searchParams = useSearchParams();
    const agencyId = searchParams.get('agencyId') || '';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [payload, setPayload] = useState<Record<string, any> | null>(null);
    const [tenantSearch, setTenantSearch] = useState('');
    const [alertOnly, setAlertOnly] = useState(false);
    const [sortBy, setSortBy] = useState<AgencySort>('alerts');
    const [trendWindow, setTrendWindow] = useState<TrendWindowKey>('days7');
    const [trendMetric, setTrendMetric] = useState<TrendMetric>('aiMessages');

    const query = useMemo(() => {
        const base = `/api/resources/summary?scope=${input.scope}&includeTrends=1`;
        if (input.scope === 'agency' && agencyId) {
            return `${base}&agencyId=${encodeURIComponent(agencyId)}`;
        }
        return base;
    }, [agencyId, input.scope]);

    const fetchSummary = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(query, { cache: 'no-store' });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to load resource summary.');
            setPayload(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load resource summary.');
        } finally {
            setLoading(false);
        }
    }, [query]);

    useEffect(() => {
        void fetchSummary();
    }, [fetchSummary]);

    const totals = payload?.totals || payload?.agency?.usage || payload?.tenant?.usage || {};
    const alertSummary = payload?.alerts || payload?.agency?.alerts || { warningCount: 0, criticalCount: 0 };
    const generatedAt = payload?.generatedAt ? new Date(payload.generatedAt).toLocaleString() : 'N/A';
    const trendPack = payload?.trends || {};
    const trendSeries = trendPack?.[trendWindow] || null;
    const trendPoints = normalizeTrendPoints(trendSeries?.points);
    const trendSource = typeof trendSeries?.source === 'string' ? trendSeries.source : 'estimated';

    const filteredAgencyTenants = useMemo(() => {
        const tenants: any[] = Array.isArray(payload?.tenants) ? payload.tenants : [];
        const queryText = tenantSearch.trim().toLowerCase();

        let scoped = tenants;
        if (queryText) {
            scoped = scoped.filter((tenant) => {
                const name = String(tenant?.tenantName || '').toLowerCase();
                const key = String(tenant?.tenantKey || '').toLowerCase();
                return name.includes(queryText) || key.includes(queryText);
            });
        }

        if (alertOnly) {
            scoped = scoped.filter((tenant) => Array.isArray(tenant?.alerts) && tenant.alerts.length > 0);
        }

        const sorted = [...scoped];
        sorted.sort((left, right) => {
            if (sortBy === 'name') {
                return String(left?.tenantName || '').localeCompare(String(right?.tenantName || ''));
            }
            if (sortBy === 'db') {
                return toNumber(right?.usage?.dbDataBytes) - toNumber(left?.usage?.dbDataBytes);
            }
            if (sortBy === 'storage') {
                return toNumber(right?.usage?.storageBytes) - toNumber(left?.usage?.storageBytes);
            }
            if (sortBy === 'ai') {
                return toNumber(right?.usage?.aiMessages30d) - toNumber(left?.usage?.aiMessages30d);
            }
            const leftAlerts = Array.isArray(left?.alerts) ? left.alerts.length : 0;
            const rightAlerts = Array.isArray(right?.alerts) ? right.alerts.length : 0;
            return rightAlerts - leftAlerts;
        });

        return sorted;
    }, [payload?.tenants, tenantSearch, alertOnly, sortBy]);

    const exportSnapshot = useCallback(() => {
        if (!payload || typeof window === 'undefined') return;
        const scope = String(payload?.scope || input.scope);
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `resource-summary-${scope}-${stamp}.json`;
        const content = JSON.stringify(payload, null, 2);
        const blob = new Blob([content], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    }, [input.scope, payload]);

    const tenantStorageUsedBytes = toNumber(payload?.tenant?.usage?.storageBytes);
    const tenantStorageLimitBytes = payload?.tenant?.limits?.storageLimitBytes
        ? toNumber(payload.tenant.limits.storageLimitBytes)
        : null;
    const tenantStoragePercent = utilizationPercent(tenantStorageUsedBytes, tenantStorageLimitBytes);

    return (
        <div className="space-y-6 p-6 lg:p-8">
            <header className="space-y-2">
                <h1 className="text-3xl font-semibold text-white">{input.title}</h1>
                <p className="text-sm text-slate-400">{input.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span>Generated: {generatedAt}</span>
                    <button
                        type="button"
                        onClick={() => void fetchSummary()}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300"
                    >
                        <RefreshCw size={12} />
                        Refresh
                    </button>
                    <button
                        type="button"
                        onClick={exportSnapshot}
                        disabled={!payload}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 disabled:opacity-50"
                    >
                        <Download size={12} />
                        Export JSON
                    </button>
                </div>
            </header>

            {error ? (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
                    Loading resource usage…
                </div>
            ) : null}

            {!loading && payload ? (
                <>
                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <StatCard
                            label="DB Data"
                            value={formatBytes(toNumber(totals.dbDataBytes))}
                            hint="Logical document size"
                            icon={<Database size={14} className="text-cyan-300" />}
                        />
                        <StatCard
                            label="DB Storage"
                            value={formatBytes(toNumber(totals.dbStorageBytes))}
                            hint="Allocated DB storage"
                            icon={<Database size={14} className="text-blue-300" />}
                        />
                        <StatCard
                            label="Media Storage"
                            value={formatBytes(toNumber(totals.storageBytes))}
                            hint={`${toNumber(totals.mediaCount)} assets`}
                            icon={<HardDrive size={14} className="text-emerald-300" />}
                        />
                        <StatCard
                            label="AI Messages (30d)"
                            value={toNumber(totals.aiMessages30d)}
                            hint={`${toNumber(totals.aiSessions30d)} sessions`}
                            icon={<MessageSquareText size={14} className="text-violet-300" />}
                        />
                        <StatCard
                            label="Alerts"
                            value={`${toNumber(alertSummary.warningCount)}W / ${toNumber(alertSummary.criticalCount)}C`}
                            hint="Threshold warnings and criticals"
                            icon={<AlertTriangle size={14} className="text-amber-300" />}
                        />
                    </section>

                    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold text-slate-200">Usage Trends</div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex overflow-hidden rounded-md border border-slate-700">
                                    <button
                                        type="button"
                                        onClick={() => setTrendWindow('days7')}
                                        className={`px-2.5 py-1 text-xs ${trendWindow === 'days7' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'}`}
                                    >
                                        7d
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTrendWindow('days30')}
                                        className={`border-l border-slate-700 px-2.5 py-1 text-xs ${trendWindow === 'days30' ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-800'}`}
                                    >
                                        30d
                                    </button>
                                </div>
                                <select
                                    value={trendMetric}
                                    onChange={(event) => setTrendMetric(event.target.value as TrendMetric)}
                                    className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="aiMessages">AI Messages</option>
                                    <option value="aiSessions">AI Sessions</option>
                                    <option value="cumulativeMediaBytes">Media Storage</option>
                                </select>
                            </div>
                        </div>
                        {trendPoints.length > 0 ? (
                            <TrendChart
                                points={trendPoints}
                                metric={trendMetric}
                                source={trendSource}
                                title={`${trendMetric === 'cumulativeMediaBytes' ? 'Media Storage (Cumulative)' : trendMetric === 'aiSessions' ? 'AI Sessions per day' : 'AI Messages per day'} • ${trendWindow === 'days7' ? 'Last 7 days' : 'Last 30 days'}`}
                            />
                        ) : (
                            <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-500">
                                Trend history is not available yet for this scope.
                            </div>
                        )}
                    </section>

                    {input.scope === 'agency' && Array.isArray(payload.tenants) ? (
                        <section className="rounded-xl border border-slate-800 bg-slate-900/60">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                                <div className="text-sm font-medium text-slate-200">Agency Tenant Rollup</div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            value={tenantSearch}
                                            onChange={(event) => setTenantSearch(event.target.value)}
                                            placeholder="Search tenant"
                                            className="h-8 rounded-md border border-slate-700 bg-slate-950 pl-7 pr-2 text-xs text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={(event) => setSortBy(event.target.value as AgencySort)}
                                        className="h-8 rounded-md border border-slate-700 bg-slate-950 px-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                                    >
                                        <option value="alerts">Sort: Alerts</option>
                                        <option value="storage">Sort: Storage</option>
                                        <option value="db">Sort: DB Data</option>
                                        <option value="ai">Sort: AI</option>
                                        <option value="name">Sort: Name</option>
                                    </select>
                                    <label className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-700 px-2 text-xs text-slate-300">
                                        <input
                                            type="checkbox"
                                            checked={alertOnly}
                                            onChange={(event) => setAlertOnly(event.target.checked)}
                                            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-cyan-500"
                                        />
                                        Alerts only
                                    </label>
                                </div>
                            </div>
                            <div className="max-h-[460px] overflow-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-950/60 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                                        <tr>
                                            <th className="px-4 py-2">Tenant</th>
                                            <th className="px-4 py-2">DB Data</th>
                                            <th className="px-4 py-2">Storage</th>
                                            <th className="px-4 py-2">Storage Util</th>
                                            <th className="px-4 py-2">AI (30d)</th>
                                            <th className="px-4 py-2">Alerts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAgencyTenants.map((tenant: any) => {
                                            const storageBytes = toNumber(tenant?.usage?.storageBytes);
                                            const storageLimitBytes = tenant?.limits?.storageLimitBytes
                                                ? toNumber(tenant.limits.storageLimitBytes)
                                                : null;
                                            const ratio = utilizationPercent(storageBytes, storageLimitBytes);
                                            const alerts = Array.isArray(tenant?.alerts) ? tenant.alerts : [];
                                            return (
                                                <tr key={tenant.tenantKey} className="border-t border-slate-800/70">
                                                    <td className="px-4 py-2">
                                                        <div className="font-medium text-slate-200">{tenant.tenantName}</div>
                                                        <div className="text-xs text-slate-500">{tenant.tenantKey}</div>
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-300">{formatBytes(toNumber(tenant?.usage?.dbDataBytes))}</td>
                                                    <td className="px-4 py-2 text-slate-300">{formatBytes(storageBytes)}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="w-24 rounded-full bg-slate-800">
                                                            <div
                                                                className={`h-1.5 rounded-full ${ratio >= 100 ? 'bg-rose-400' : ratio >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                                                style={{ width: storageLimitBytes ? `${Math.max(4, ratio)}%` : '0%' }}
                                                            />
                                                        </div>
                                                        <div className="mt-1 text-[10px] text-slate-500">
                                                            {storageLimitBytes ? `${ratio.toFixed(1)}%` : 'N/A'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-300">
                                                        {toNumber(tenant?.usage?.aiMessages30d)}
                                                        <div className="text-[10px] text-slate-500">
                                                            {toNumber(tenant?.usage?.aiSessions30d)} sessions
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-slate-300">
                                                        {alerts.length ? alerts.map((alert: any) => alert.level).join(', ') : 'none'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredAgencyTenants.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-6 text-center text-xs text-slate-500">
                                                    No tenant records match current filters.
                                                </td>
                                            </tr>
                                        ) : null}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ) : null}

                    {input.scope === 'tenant' && payload.tenant ? (
                        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
                            <div className="mb-2 flex items-center gap-2 text-slate-100">
                                <Activity size={16} className="text-cyan-300" />
                                Tenant Resource Profile
                            </div>
                            <div className="text-xs text-slate-500">
                                {payload.tenant.tenantName} ({payload.tenant.tenantKey})
                            </div>
                            <div className="mt-3 text-xs text-slate-500">
                                Storage limit: {tenantStorageLimitBytes ? formatBytes(tenantStorageLimitBytes) : 'not configured'}
                            </div>
                            <div className="mt-2 w-full rounded-full bg-slate-800">
                                <div
                                    className={`h-2 rounded-full ${tenantStoragePercent >= 100 ? 'bg-rose-400' : tenantStoragePercent >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    style={{ width: tenantStorageLimitBytes ? `${Math.max(4, tenantStoragePercent)}%` : '0%' }}
                                />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                                Usage: {formatBytes(tenantStorageUsedBytes)}
                                {tenantStorageLimitBytes ? ` (${tenantStoragePercent.toFixed(1)}%)` : ''}
                            </div>
                        </section>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
