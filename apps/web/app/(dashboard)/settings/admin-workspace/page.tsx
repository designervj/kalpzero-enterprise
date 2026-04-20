'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, LayoutDashboard, PanelLeft, RefreshCw, Save, Sparkles } from 'lucide-react';
import { PermissionEngine } from '@engine/permission-engine';
import type { NavEntrySpec, RegistrySnapshot } from '@core/contracts/registry';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { canRoleAccessAdminPath, type RoleProfileKey } from '@/lib/role-scope';
import {
    applyWorkspaceItemCustomization,
    buildWorkspaceRouteItemId,
    mergeAdminWorkspace,
    type AdminWorkspace,
    type AdminWorkspaceSectionKey,
} from '@/lib/admin-workspace';

type RuntimeRegistrySnapshot = RegistrySnapshot & {
    enabledModules?: string[];
};

type WorkspaceEditorItem = {
    id: string;
    label: string;
    href: string;
    sectionId: AdminWorkspaceSectionKey;
};

const permissionEngine = new PermissionEngine();

const DASHBOARD_QUICK_ACTIONS: WorkspaceEditorItem[] = [
    {
        id: 'quick.front-builder',
        label: 'Open Front Builder',
        href: '/front-builder',
        sectionId: 'frontend',
    },
    {
        id: 'quick.pages',
        label: 'Manage Website Pages',
        href: '/pages',
        sectionId: 'frontend',
    },
    {
        id: 'quick.discover',
        label: 'View Discovery Front',
        href: '/discover',
        sectionId: 'frontend',
    },
];

const DASHBOARD_KPIS: WorkspaceEditorItem[] = [
    { id: 'kpi.products', label: 'Products', href: '/ecommerce', sectionId: 'commerce' },
    { id: 'kpi.orders', label: 'Orders', href: '/ecommerce/orders', sectionId: 'commerce' },
    { id: 'kpi.revenue', label: 'Revenue', href: '/ecommerce/orders', sectionId: 'commerce' },
    { id: 'kpi.bookings', label: 'Bookings', href: '/bookings', sectionId: 'operations' },
    { id: 'kpi.portfolio', label: 'Portfolio', href: '/portfolio', sectionId: 'content' },
    { id: 'kpi.blog', label: 'Blog Posts', href: '/blog', sectionId: 'content' },
    { id: 'kpi.media', label: 'Media', href: '/media', sectionId: 'content' },
    { id: 'kpi.users', label: 'Users', href: '/users', sectionId: 'platform' },
    { id: 'kpi.invoices', label: 'Invoices', href: '/invoices', sectionId: 'commerce' },
];

const DASHBOARD_WIDGETS: WorkspaceEditorItem[] = [
    { id: 'widget.orders', label: 'Recent Orders', href: '/ecommerce/orders', sectionId: 'commerce' },
    { id: 'widget.posts', label: 'Recent Posts', href: '/blog', sectionId: 'content' },
    { id: 'widget.packages', label: 'Recent Packages', href: '/travel/packages', sectionId: 'operations' },
];

const SECTION_KEYS: AdminWorkspaceSectionKey[] = [
    'overview',
    'frontend',
    'commerce',
    'operations',
    'content',
    'engagement',
    'modules',
    'platform',
];

function inferModuleKeyFromNav(nav: NavEntrySpec): string | null {
    if (typeof nav?.requiredPermissionId === 'string') {
        const match = nav.requiredPermissionId.match(/^perm\.([^.]+)\./);
        if (match?.[1]) return match[1];
    }
    if (typeof nav?.id === 'string' && nav.id.startsWith('nav.')) {
        const inferred = nav.id.slice(4).split('.')[0]?.trim();
        if (inferred) return inferred;
    }
    if (typeof nav?.path === 'string') {
        const firstSegment = nav.path.replace(/^\//, '').split('/')[0]?.trim();
        if (firstSegment) return firstSegment;
    }
    return null;
}

function normalizeSectionId(parentId: unknown): AdminWorkspaceSectionKey {
    if (typeof parentId !== 'string') return 'modules';
    const trimmed = parentId.trim().toLowerCase();
    if (!trimmed) return 'modules';
    if (trimmed.startsWith('group.')) return trimmed.replace('group.', '') as AdminWorkspaceSectionKey;
    if (trimmed.startsWith('section.')) return trimmed.replace('section.', '') as AdminWorkspaceSectionKey;
    return trimmed as AdminWorkspaceSectionKey;
}

function buildOrderedIds(currentOrder: string[], availableIds: string[]): string[] {
    const filteredCurrent = currentOrder.filter((id) => availableIds.includes(id));
    const remainder = availableIds.filter((id) => !filteredCurrent.includes(id));
    return [...filteredCurrent, ...remainder];
}

function moveConfiguredId(
    currentOrder: string[],
    availableIds: string[],
    targetId: string,
    direction: 'up' | 'down'
): string[] {
    const next = buildOrderedIds(currentOrder, availableIds);
    const currentIndex = next.indexOf(targetId);
    if (currentIndex === -1) return next;
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return next;
    [next[currentIndex], next[swapIndex]] = [next[swapIndex], next[currentIndex]];
    return next;
}

function toggleHidden(currentHidden: string[], targetId: string): string[] {
    return currentHidden.includes(targetId)
        ? currentHidden.filter((id) => id !== targetId)
        : [...currentHidden, targetId];
}

function countVisibleItems(items: WorkspaceEditorItem[], hiddenIds: string[]): number {
    const hiddenSet = new Set(hiddenIds);
    return items.filter((item) => !hiddenSet.has(item.id)).length;
}

function countFilledValues(values: Record<string, string>): number {
    return Object.values(values).filter((value) => value.trim().length > 0).length;
}

function getDefaultSectionLabel(sectionKey: AdminWorkspaceSectionKey): string {
    if (sectionKey === 'modules') return 'Apps';
    return sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
}

function WorkspaceItemEditor(props: {
    title: string;
    description: string;
    items: WorkspaceEditorItem[];
    order: string[];
    hidden: string[];
    labelOverrides: Record<string, string>;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onToggleHidden: (id: string) => void;
    onLabelChange: (id: string, value: string) => void;
}) {
    const renderedItems = useMemo(
        () =>
            applyWorkspaceItemCustomization(props.items, {
                order: props.order,
                hidden: [],
                labelOverrides: props.labelOverrides,
            }),
        [props.items, props.labelOverrides, props.order]
    );
    const hiddenCount = props.hidden.filter((id) =>
        props.items.some((item) => item.id === id)
    ).length;
    const visibleCount = Math.max(props.items.length - hiddenCount, 0);
    const relabeledCount = renderedItems.filter(
        (item) =>
            typeof props.labelOverrides[item.id] === 'string' &&
            props.labelOverrides[item.id].trim().length > 0
    ).length;

    return (
        <div className="rounded-3xl border border-slate-800/80 bg-slate-950/50 p-5 shadow-[0_20px_80px_-40px_rgba(14,165,233,0.45)] backdrop-blur-md md:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-800/80 pb-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h3 className="text-base font-bold text-white">{props.title}</h3>
                    <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{props.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-[10px] uppercase tracking-widest text-cyan-200">
                        {visibleCount} visible
                    </Badge>
                    <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-[10px] uppercase tracking-widest text-amber-200">
                        {hiddenCount} hidden
                    </Badge>
                    <Badge variant="outline" className="border-slate-700 bg-black/30 text-[10px] uppercase tracking-widest text-slate-300">
                        {relabeledCount} relabeled
                    </Badge>
                </div>
            </div>
            <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                {renderedItems.map((item, index) => {
                    const isHidden = props.hidden.includes(item.id);
                    return (
                        <div
                            key={item.id}
                            className={`rounded-2xl border p-4 transition-colors ${
                                isHidden
                                    ? 'border-slate-800 bg-black/20 opacity-75'
                                    : 'border-slate-700/80 bg-slate-900/50'
                            }`}
                        >
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px_auto] lg:items-center">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-white">{item.label}</span>
                                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest text-slate-300">
                                            {item.sectionId}
                                        </Badge>
                                        {isHidden && (
                                            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 text-[9px] uppercase tracking-widest text-amber-300">
                                                Hidden
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="mt-1 text-[11px] break-all text-slate-500">{item.href}</div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase tracking-widest text-slate-500">
                                        Custom Label
                                    </Label>
                                    <Input
                                        value={props.labelOverrides[item.id] || ''}
                                        onChange={(event) => props.onLabelChange(item.id, event.target.value)}
                                        placeholder={`Keep default: ${item.label}`}
                                        className="h-9 bg-black/30"
                                    />
                                </div>
                                <div className="flex items-center gap-2 lg:justify-end">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => props.onMove(item.id, 'up')}
                                        disabled={index === 0}
                                    >
                                        <ArrowUp size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => props.onMove(item.id, 'down')}
                                        disabled={index === renderedItems.length - 1}
                                    >
                                        <ArrowDown size={14} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => props.onToggleHidden(item.id)}
                                    >
                                        {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function AdminWorkspaceSettingsPage() {
    const auth = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [workspace, setWorkspace] = useState<AdminWorkspace>(
        mergeAdminWorkspace(null)
    );
    const [snapshot, setSnapshot] = useState<RuntimeRegistrySnapshot | null>(null);

    const currentRole = auth.currentProfile as RoleProfileKey;
    const permissionCtx = useMemo(
        () => ({
            ...auth,
            enabledModules: auth.user?.enabledModules || [],
        }),
        [auth]
    );

    useEffect(() => {
        if (auth.user?.provisioningMode && auth.user.provisioningMode !== 'full_tenant') {
            setLoading(false);
            setError('Workspace customization is available only for Full Tenant workspaces.');
            return;
        }

        Promise.all([
            fetch('/api/settings/admin-workspace').then(async (res) => {
                const payload = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(
                        typeof payload?.error === 'string'
                            ? payload.error
                            : 'Failed to load workspace configuration.'
                    );
                }
                return payload;
            }),
            fetch('/api/registry/snapshot')
                .then((res) => res.json())
                .catch(() => null),
        ])
            .then(([config, runtimeSnapshot]) => {
                setWorkspace(mergeAdminWorkspace(config));
                setSnapshot(runtimeSnapshot as RuntimeRegistrySnapshot | null);
                setError('');
            })
            .catch((loadError: unknown) => {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Failed to load workspace customization.'
                );
            })
            .finally(() => setLoading(false));
    }, [auth.user?.provisioningMode]);

    const sidebarItems = useMemo(() => {
        const seedItems = (
            [
                {
                    id: buildWorkspaceRouteItemId('/dashboard'),
                    label: 'Dashboard',
                    href: '/dashboard',
                    sectionId: 'overview',
                },
                {
                    id: buildWorkspaceRouteItemId('/pages'),
                    label: 'Website Pages',
                    href: '/pages',
                    sectionId: 'frontend',
                },
                {
                    id: buildWorkspaceRouteItemId('/front-builder'),
                    label: 'Front Builder',
                    href: '/front-builder',
                    sectionId: 'frontend',
                },
                {
                    id: buildWorkspaceRouteItemId('/discover'),
                    label: 'Discovery Front',
                    href: '/discover',
                    sectionId: 'frontend',
                },
                {
                    id: buildWorkspaceRouteItemId('/settings'),
                    label: 'Control Center',
                    href: '/settings',
                    sectionId: 'platform',
                },
            ] satisfies WorkspaceEditorItem[]
        ).filter((item) => canRoleAccessAdminPath(currentRole, item.href));

        const navOverrides =
            snapshot?.navigationOverrides &&
            typeof snapshot.navigationOverrides === 'object'
                ? snapshot.navigationOverrides
                : {};
        const enabledModules = new Set(
            Array.isArray(auth.user?.enabledModules) ? auth.user.enabledModules : []
        );

        const runtimeItems = (Array.isArray(snapshot?.navigation) ? snapshot.navigation : [])
            .filter((nav) => {
                const requiredModule = inferModuleKeyFromNav(nav);
                if (requiredModule && enabledModules.size > 0 && !enabledModules.has(requiredModule)) {
                    return false;
                }
                if (!canRoleAccessAdminPath(currentRole, nav.path)) return false;
                if (nav.requiredPermissionId) {
                    if (!snapshot) return false;
                    return permissionEngine.can(snapshot, permissionCtx, {
                        permissionId: nav.requiredPermissionId,
                        requiredModule: requiredModule || undefined,
                    });
                }
                return true;
            })
            .map((nav) => {
                const override = typeof nav.id === 'string' ? navOverrides[nav.id] : undefined;
                const label =
                    override && typeof override.label === 'string'
                        ? override.label
                        : nav.label;
                const href =
                    override && typeof override.path === 'string'
                        ? override.path
                        : nav.path;
                const parentId =
                    override && typeof override.parentId === 'string'
                        ? override.parentId
                        : nav.parentId;
                return {
                    id:
                        typeof nav.id === 'string' && nav.id.trim()
                            ? nav.id
                            : buildWorkspaceRouteItemId(href),
                    label,
                    href,
                    sectionId: normalizeSectionId(parentId),
                } satisfies WorkspaceEditorItem;
            });

        const deduped = new Map<string, WorkspaceEditorItem>();
        [...seedItems, ...runtimeItems].forEach((item) => {
            if (!deduped.has(item.id)) deduped.set(item.id, item);
        });
        return Array.from(deduped.values());
    }, [auth.user?.enabledModules, currentRole, permissionCtx, snapshot]);

    const updateSidebar = (patch: Partial<AdminWorkspace['sidebar']>) => {
        setWorkspace((prev) => ({
            ...prev,
            sidebar: {
                ...prev.sidebar,
                ...patch,
            },
        }));
    };

    const updateDashboardHome = (patch: Partial<AdminWorkspace['dashboardHome']>) => {
        setWorkspace((prev) => ({
            ...prev,
            dashboardHome: {
                ...prev.dashboardHome,
                ...patch,
            },
        }));
    };

    const saveLabelOverride = (
        scope: 'sidebar' | 'dashboard',
        id: string,
        value: string
    ) => {
        if (scope === 'sidebar') {
            const nextOverrides = { ...workspace.sidebar.labelOverrides };
            if (value.trim()) nextOverrides[id] = value;
            else delete nextOverrides[id];
            updateSidebar({ labelOverrides: nextOverrides });
            return;
        }
        const nextOverrides = { ...workspace.dashboardHome.labelOverrides };
        if (value.trim()) nextOverrides[id] = value;
        else delete nextOverrides[id];
        updateDashboardHome({ labelOverrides: nextOverrides });
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/settings/admin-workspace', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workspace),
            });
            const payload = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(
                    typeof payload?.error === 'string'
                        ? payload.error
                        : 'Failed to save workspace customization.'
                );
            }
            await auth.refreshSession();
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2000);
        } catch (saveError: unknown) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : 'Failed to save workspace customization.'
            );
        } finally {
            setSaving(false);
        }
    };

    const sidebarVisibleCount = countVisibleItems(sidebarItems, workspace.sidebar.hiddenItems);
    const quickActionVisibleCount = countVisibleItems(
        DASHBOARD_QUICK_ACTIONS,
        workspace.dashboardHome.hiddenQuickActions
    );
    const kpiVisibleCount = countVisibleItems(
        DASHBOARD_KPIS,
        workspace.dashboardHome.hiddenKpis
    );
    const widgetVisibleCount = countVisibleItems(
        DASHBOARD_WIDGETS,
        workspace.dashboardHome.hiddenWidgets
    );
    const renamedSectionCount = SECTION_KEYS.filter(
        (sectionKey) =>
            (workspace.sidebar.sectionLabels[sectionKey] || '').trim() !==
            getDefaultSectionLabel(sectionKey)
    ).length;
    const customLabelCount =
        countFilledValues(workspace.sidebar.labelOverrides) +
        countFilledValues(workspace.dashboardHome.labelOverrides);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                    Loading workspace customization...
                </span>
            </div>
        );
    }

    if (error && auth.user?.provisioningMode !== 'full_tenant') {
        return (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-3">
                <div className="text-sm font-semibold text-amber-300">Full Tenant Only</div>
                <p className="text-sm text-slate-300">
                    Workspace customization is available only for full-tenant businesses with an isolated admin workspace.
                </p>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-7xl space-y-6 animate-in fade-in duration-500">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_360px]">
                <div className="rounded-3xl border border-slate-800/80 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(5,10,22,0.86))] p-6 shadow-[0_30px_100px_-50px_rgba(6,182,212,0.5)] md:p-7">
                    <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
                            <LayoutDashboard size={24} />
                        </div>
                        <div className="min-w-0">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                                Full Tenant Control Center
                            </div>
                            <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">
                                Workspace Customization
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400">
                                Shape the tenant workspace without forking the codebase. Rename sidebar labels,
                                reorganize navigation, and decide which dashboard actions, KPI cards, and widgets
                                are visible for this business.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Badge variant="outline" className="border-cyan-500/20 bg-cyan-500/5 text-[10px] uppercase tracking-widest text-cyan-200">
                                    Layout: {workspace.dashboardHome.layout}
                                </Badge>
                                <Badge variant="outline" className="border-slate-700 bg-black/30 text-[10px] uppercase tracking-widest text-slate-300">
                                    {sidebarVisibleCount} sidebar items visible
                                </Badge>
                                <Badge variant="outline" className="border-slate-700 bg-black/30 text-[10px] uppercase tracking-widest text-slate-300">
                                    {customLabelCount} custom labels
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-[0_20px_80px_-50px_rgba(34,197,94,0.4)]">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                                Publish Changes
                            </div>
                            <div className="mt-2 text-lg font-semibold text-white">
                                Save tenant workspace settings
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-slate-400">
                                These changes apply only to the current full-tenant admin workspace.
                            </p>
                        </div>
                        <Sparkles size={18} className="text-emerald-300" />
                    </div>
                    <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Quick Actions
                            </div>
                            <div className="mt-2 text-2xl font-bold text-white">{quickActionVisibleCount}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                KPI Cards
                            </div>
                            <div className="mt-2 text-2xl font-bold text-white">{kpiVisibleCount}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Widgets
                            </div>
                            <div className="mt-2 text-2xl font-bold text-white">{widgetVisibleCount}</div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-black/30 p-4">
                            <div className="text-[10px] uppercase tracking-widest text-slate-500">
                                Section Labels
                            </div>
                            <div className="mt-2 text-2xl font-bold text-white">{renamedSectionCount}</div>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="mt-5 w-full">
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Workspace'}
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">
                    {error}
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/50 p-5 backdrop-blur-md md:p-6">
                    <div>
                        <h3 className="text-base font-bold text-white">Dashboard Home</h3>
                        <p className="mt-1 text-[12px] text-slate-500">
                            Save a tenant-specific home headline, summary text, and layout preset.
                        </p>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Layout Preset</Label>
                            <Select
                                value={workspace.dashboardHome.layout}
                                onChange={(event) =>
                                    updateDashboardHome({
                                        layout: event.target.value as AdminWorkspace['dashboardHome']['layout'],
                                    })
                                }
                            >
                                <option value="default">Default</option>
                                <option value="focus">Focus</option>
                                <option value="split">Split</option>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Custom Headline</Label>
                            <Input
                                value={workspace.dashboardHome.headline}
                                onChange={(event) =>
                                    updateDashboardHome({ headline: event.target.value })
                                }
                                placeholder="Optional custom dashboard title"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Custom Summary</Label>
                        <Textarea
                            value={workspace.dashboardHome.subheadline}
                            onChange={(event) =>
                                updateDashboardHome({ subheadline: event.target.value })
                            }
                            placeholder="Optional home summary for this tenant workspace"
                            rows={4}
                        />
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800/80 bg-slate-950/50 p-5 backdrop-blur-md md:p-6">
                    <div className="flex items-center gap-2">
                        <PanelLeft size={16} className="text-cyan-400" />
                        <h3 className="text-base font-bold text-white">Sidebar Sections</h3>
                    </div>
                    <p className="mt-1 text-[12px] text-slate-500">
                        Rename sidebar section headings for this tenant without changing the shared codebase.
                    </p>
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                        {SECTION_KEYS.map((sectionKey) => (
                            <div key={sectionKey} className="space-y-2">
                                <Label>{sectionKey}</Label>
                                <Input
                                    value={workspace.sidebar.sectionLabels[sectionKey] || ''}
                                    onChange={(event) =>
                                        updateSidebar({
                                            sectionLabels: {
                                                ...workspace.sidebar.sectionLabels,
                                                [sectionKey]: event.target.value,
                                            },
                                        })
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <WorkspaceItemEditor
                title="Sidebar Menu"
                description="Reorder visible sidebar items, hide anything unnecessary, and rename labels per business."
                items={sidebarItems}
                order={workspace.sidebar.itemOrder}
                hidden={workspace.sidebar.hiddenItems}
                labelOverrides={workspace.sidebar.labelOverrides}
                onMove={(id, direction) =>
                    updateSidebar({
                        itemOrder: moveConfiguredId(
                            workspace.sidebar.itemOrder,
                            sidebarItems.map((item) => item.id),
                            id,
                            direction
                        ),
                    })
                }
                onToggleHidden={(id) =>
                    updateSidebar({
                        hiddenItems: toggleHidden(workspace.sidebar.hiddenItems, id),
                    })
                }
                onLabelChange={(id, value) => saveLabelOverride('sidebar', id, value)}
            />

            <div className="grid gap-6 xl:grid-cols-3">
                <WorkspaceItemEditor
                    title="Quick Actions"
                    description="Control the top action cards shown on the tenant dashboard home."
                    items={DASHBOARD_QUICK_ACTIONS}
                    order={workspace.dashboardHome.quickActionOrder}
                    hidden={workspace.dashboardHome.hiddenQuickActions}
                    labelOverrides={workspace.dashboardHome.labelOverrides}
                    onMove={(id, direction) =>
                        updateDashboardHome({
                            quickActionOrder: moveConfiguredId(
                                workspace.dashboardHome.quickActionOrder,
                                DASHBOARD_QUICK_ACTIONS.map((item) => item.id),
                                id,
                                direction
                            ),
                        })
                    }
                    onToggleHidden={(id) =>
                        updateDashboardHome({
                            hiddenQuickActions: toggleHidden(
                                workspace.dashboardHome.hiddenQuickActions,
                                id
                            ),
                        })
                    }
                    onLabelChange={(id, value) => saveLabelOverride('dashboard', id, value)}
                />

                <WorkspaceItemEditor
                    title="KPI Cards"
                    description="Decide which KPI cards are visible and the order they appear in."
                    items={DASHBOARD_KPIS}
                    order={workspace.dashboardHome.kpiOrder}
                    hidden={workspace.dashboardHome.hiddenKpis}
                    labelOverrides={workspace.dashboardHome.labelOverrides}
                    onMove={(id, direction) =>
                        updateDashboardHome({
                            kpiOrder: moveConfiguredId(
                                workspace.dashboardHome.kpiOrder,
                                DASHBOARD_KPIS.map((item) => item.id),
                                id,
                                direction
                            ),
                        })
                    }
                    onToggleHidden={(id) =>
                        updateDashboardHome({
                            hiddenKpis: toggleHidden(workspace.dashboardHome.hiddenKpis, id),
                        })
                    }
                    onLabelChange={(id, value) => saveLabelOverride('dashboard', id, value)}
                />

                <WorkspaceItemEditor
                    title="Dashboard Widgets"
                    description="Configure feed widgets like orders, posts, and packages for this business."
                    items={DASHBOARD_WIDGETS}
                    order={workspace.dashboardHome.widgetOrder}
                    hidden={workspace.dashboardHome.hiddenWidgets}
                    labelOverrides={workspace.dashboardHome.labelOverrides}
                    onMove={(id, direction) =>
                        updateDashboardHome({
                            widgetOrder: moveConfiguredId(
                                workspace.dashboardHome.widgetOrder,
                                DASHBOARD_WIDGETS.map((item) => item.id),
                                id,
                                direction
                            ),
                        })
                    }
                    onToggleHidden={(id) =>
                        updateDashboardHome({
                            hiddenWidgets: toggleHidden(workspace.dashboardHome.hiddenWidgets, id),
                        })
                    }
                    onLabelChange={(id, value) => saveLabelOverride('dashboard', id, value)}
                />
            </div>
        </div>
    );
}
