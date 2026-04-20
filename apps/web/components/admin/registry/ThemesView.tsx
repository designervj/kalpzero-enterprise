import { Check, ChevronDown, Edit3, RefreshCw, Save, Sparkles, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { SmartColorPicker } from '@/components/ui/smart-color-picker';
import { applyRuntimeTheme } from '@/lib/theme-runtime';

interface ThemesViewProps {
    items: any[];
    editingId: string | null;
    editForm: any;
    setEditingId: (id: string | null) => void;
    setEditForm: (form: any) => void;
    onSave: (payload?: any) => void | Promise<void>;
    onDelete: (id: string) => void;
    saving: boolean;
    viewMode?: 'list' | 'grid';
}

type AssignmentMode = 'active_tenant' | 'selected_tenant' | 'bulk_filter';

type TenantOption = {
    key: string;
    name: string;
    businessType?: string;
    industry?: string;
    agencyId?: string | null;
};

type ThemeApplyHistoryItem = {
    _id?: string;
    themeName?: string;
    themeKey?: string;
    mode?: AssignmentMode;
    targetCount?: number;
    appliedCount?: number;
    scopeAgencyId?: string | null;
    createdAt?: string;
    requestedBy?: {
        role?: string;
        email?: string;
    };
};

const FONT_OPTIONS = [
    'Inter',
    'Roboto',
    'Outfit',
    'Plus Jakarta Sans',
    'DM Sans',
    'Poppins',
    'Lato',
    'Open Sans',
    'Montserrat',
    'Playfair Display',
    'Merriweather',
    'Source Sans 3',
    'Nunito',
    'Raleway',
    'Work Sans',
    'Manrope',
    'Space Grotesk',
];

type ThemeColorKey =
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'background'
    | 'foreground'
    | 'muted'
    | 'border'
    | 'ring'
    | 'card';

const COLOR_FIELDS: Array<{ key: ThemeColorKey; label: string }> = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Foreground' },
    { key: 'muted', label: 'Muted' },
    { key: 'border', label: 'Border' },
    { key: 'ring', label: 'Ring' },
    { key: 'card', label: 'Card' },
];

const DEFAULT_BRAND_KIT = {
    colors: {
        primary: '#00f0ff',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#030712',
        foreground: '#f8fafc',
        muted: '#94a3b8',
        border: '#1e293b',
        ring: '#00f0ff',
        card: '#0f172a',
    },
    buttons: {
        primaryBg: '#00f0ff',
        primaryText: '#000000',
        secondaryBg: '#8b5cf6',
        secondaryText: '#ffffff',
        outlineBorder: '#00f0ff',
        outlineText: '#00f0ff',
        ghostText: '#94a3b8',
        destructiveBg: '#ef4444',
        destructiveText: '#ffffff',
        radius: '10',
    },
    typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
    },
    appearance: {
        mode: 'dark',
        chrome: 'glass',
    },
};

function normalizeHex(value: unknown, fallback: string): string {
    if (typeof value !== 'string') return fallback;
    const next = value.trim().toLowerCase();
    if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(next)) return fallback;
    if (next.length === 4) {
        return `#${next[1]}${next[1]}${next[2]}${next[2]}${next[3]}${next[3]}`;
    }
    return next;
}

function asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function normalizeTheme(item: any) {
    const template = asRecord(item?.brandKitTemplate);
    const colors = { ...DEFAULT_BRAND_KIT.colors, ...asRecord(template.colors) };
    const typography = { ...DEFAULT_BRAND_KIT.typography, ...asRecord(template.typography) };
    const buttons = { ...DEFAULT_BRAND_KIT.buttons, ...asRecord(template.buttons) };
    const appearance = { ...DEFAULT_BRAND_KIT.appearance, ...asRecord(template.appearance) };

    if (item?.primary) colors.primary = normalizeHex(item.primary, colors.primary);
    if (item?.secondary) colors.secondary = normalizeHex(item.secondary, colors.secondary);
    if (item?.accent) colors.accent = normalizeHex(item.accent, colors.accent);
    if (item?.background) colors.background = normalizeHex(item.background, colors.background);
    if (item?.fontFamily && typeof item.fontFamily === 'string') typography.bodyFont = item.fontFamily;
    if (item?.fontFamily && typeof item.fontFamily === 'string' && !template.typography) typography.headingFont = item.fontFamily;
    if (item?.borderRadius !== undefined && item?.borderRadius !== null) buttons.radius = String(item.borderRadius);
    if (item?.sidebarStyle && typeof item.sidebarStyle === 'string') appearance.chrome = item.sidebarStyle;

    return {
        ...item,
        key: item?.key || '',
        name: item?.name || '',
        industry: item?.industry || '',
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: colors.background,
        fontFamily: typography.bodyFont,
        borderRadius: Number(buttons.radius || 10),
        sidebarStyle: appearance.chrome,
        brandKitTemplate: {
            colors,
            typography,
            buttons,
            appearance,
        },
    };
}

function toThemePayload(theme: any) {
    const normalized = normalizeTheme(theme);
    return {
        ...normalized,
        primary: normalized.brandKitTemplate.colors.primary,
        secondary: normalized.brandKitTemplate.colors.secondary,
        accent: normalized.brandKitTemplate.colors.accent,
        background: normalized.brandKitTemplate.colors.background,
        fontFamily: normalized.brandKitTemplate.typography.bodyFont,
        borderRadius: Number(normalized.brandKitTemplate.buttons.radius || 10),
        sidebarStyle: normalized.brandKitTemplate.appearance.chrome,
        cardStyle: normalized.cardStyle || 'elevated',
    };
}

function toBrandKit(theme: any) {
    return normalizeTheme(theme).brandKitTemplate;
}

function toGlobalTokens(theme: any) {
    const normalized = normalizeTheme(theme);
    const colors = normalized.brandKitTemplate.colors;
    const typography = normalized.brandKitTemplate.typography;
    const buttons = normalized.brandKitTemplate.buttons;
    const radius = String(buttons.radius || '10').replace(/[^\d.]/g, '') || '10';
    return {
        primary: colors.primary,
        secondary: colors.secondary,
        accent: colors.accent,
        background: colors.background,
        ring: colors.ring,
        fontBody: typography.bodyFont,
        fontHeading: typography.headingFont || typography.bodyFont,
        fontButton: typography.bodyFont,
        btnRadius: `${radius}px`,
        btnPrimaryBg: buttons.primaryBg || colors.primary,
        btnPrimaryText: buttons.primaryText || '#ffffff',
        btnPrimaryBorder: buttons.primaryBg || colors.primary,
        btnSecondaryBg: buttons.secondaryBg || colors.secondary,
        btnSecondaryText: buttons.secondaryText || '#ffffff',
        btnSecondaryBorder: buttons.secondaryBg || colors.secondary,
        btnOutlineBg: 'transparent',
        btnOutlineText: buttons.outlineText || colors.primary,
        btnOutlineBorder: buttons.outlineBorder || colors.primary,
        bgPageLight: '#F4F6F5',
        bgSurfaceLight: '#FFFFFF',
        textMainLight: '#0B2A1F',
        bgPageDark: colors.background,
        bgSurfaceDark: colors.card,
        textMainDark: colors.foreground,
    };
}

function ThemeColorField({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (next: string) => void;
}) {
    return (
        <label className="space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</span>
            <SmartColorPicker value={value} onChange={onChange} variant="dark" className="w-full" />
        </label>
    );
}

export function ThemesView({
    items,
    editingId,
    editForm,
    setEditingId,
    setEditForm,
    onSave,
    onDelete,
    saving,
    viewMode = 'list',
}: ThemesViewProps) {
    const [applyBusyId, setApplyBusyId] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [statusKind, setStatusKind] = useState<'ok' | 'error'>('ok');
    const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([]);
    const [tenantSearch, setTenantSearch] = useState('');
    const [selectedTenantKey, setSelectedTenantKey] = useState('');
    const [assignmentMode, setAssignmentMode] = useState<AssignmentMode>('active_tenant');
    const [bulkBusinessType, setBulkBusinessType] = useState('');
    const [bulkIndustry, setBulkIndustry] = useState('');
    const [bulkAgencyId, setBulkAgencyId] = useState('');
    const [bulkLimit, setBulkLimit] = useState('50');
    const [previewTargets, setPreviewTargets] = useState<TenantOption[]>([]);
    const [previewCount, setPreviewCount] = useState(0);
    const [history, setHistory] = useState<ThemeApplyHistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyExpanded, setHistoryExpanded] = useState(false);
    const isGrid = viewMode === 'grid';

    const normalizedItems = useMemo(() => items.map((item) => normalizeTheme(item)), [items]);
    const filteredTenantOptions = useMemo(() => {
        const query = tenantSearch.trim().toLowerCase();
        if (!query) return tenantOptions;
        return tenantOptions.filter((item) => {
            const haystack = `${item.key} ${item.name} ${item.businessType || ''} ${item.industry || ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [tenantOptions, tenantSearch]);

    useEffect(() => {
        const loadTenantOptions = async () => {
            try {
                const platformRes = await fetch('/api/tenants');
                if (platformRes.ok) {
                    const tenants = await platformRes.json().catch(() => []);
                    if (Array.isArray(tenants)) {
                        const mapped = tenants
                            .map((row: any) => ({
                                key: typeof row?.key === 'string' ? row.key : '',
                                name: typeof row?.name === 'string' && row.name.trim() ? row.name : (typeof row?.key === 'string' ? row.key : ''),
                                businessType: typeof row?.businessType === 'string' ? row.businessType : '',
                                industry: typeof row?.industry === 'string' ? row.industry : '',
                                agencyId: typeof row?.agencyId === 'string' ? row.agencyId : null,
                            }))
                            .filter((row: TenantOption) => Boolean(row.key));
                        setTenantOptions(mapped);
                        if (!selectedTenantKey && mapped.length > 0) setSelectedTenantKey(mapped[0].key);
                        return;
                    }
                }

                const scopedRes = await fetch('/api/auth/tenant-options');
                if (!scopedRes.ok) return;
                const payload = await scopedRes.json().catch(() => null);
                const rows = Array.isArray(payload?.items) ? payload.items : [];
                const mapped = rows
                    .map((row: any) => ({
                        key: typeof row?.key === 'string' ? row.key : '',
                        name: typeof row?.name === 'string' && row.name.trim() ? row.name : (typeof row?.key === 'string' ? row.key : ''),
                        businessType: typeof row?.businessType === 'string' ? row.businessType : '',
                        industry: typeof row?.industry === 'string' ? row.industry : '',
                        agencyId: typeof row?.agencyId === 'string' ? row.agencyId : null,
                    }))
                    .filter((row: TenantOption) => Boolean(row.key));
                setTenantOptions(mapped);
                if (!selectedTenantKey && mapped.length > 0) setSelectedTenantKey(mapped[0].key);
            } catch {
                // ignore tenant-option hydration failures in registry UI
            }
        };
        void loadTenantOptions();
    }, []);

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/system/themes/apply?limit=20');
            if (!res.ok) return;
            const rows = await res.json().catch(() => []);
            setHistory(Array.isArray(rows) ? rows : []);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        void loadHistory();
    }, []);

    const updateColor = (key: ThemeColorKey, value: string) => {
        const normalized = normalizeHex(value, DEFAULT_BRAND_KIT.colors[key]);
        const next = normalizeTheme(editForm);
        next.brandKitTemplate.colors[key] = normalized;
        if (key === 'primary') next.primary = normalized;
        if (key === 'secondary') next.secondary = normalized;
        if (key === 'accent') next.accent = normalized;
        if (key === 'background') next.background = normalized;
        setEditForm(next);
    };

    const updateTypography = (field: 'headingFont' | 'bodyFont', value: string) => {
        const next = normalizeTheme(editForm);
        next.brandKitTemplate.typography[field] = value;
        if (field === 'bodyFont') {
            next.fontFamily = value;
        }
        setEditForm(next);
    };

    const updateThemeMeta = (field: string, value: unknown) => {
        const next = normalizeTheme(editForm);
        (next as Record<string, unknown>)[field] = value;
        if (field === 'borderRadius') {
            next.brandKitTemplate.buttons.radius = String(value);
        }
        if (field === 'sidebarStyle') {
            next.brandKitTemplate.appearance.chrome = String(value);
        }
        if (field === 'mode') {
            next.brandKitTemplate.appearance.mode = value === 'light' ? 'light' : 'dark';
        }
        setEditForm(next);
    };

    const openForEdit = (theme: any) => {
        setEditingId(theme._id);
        setEditForm(normalizeTheme(theme));
    };

    const saveTheme = async () => {
        await onSave(toThemePayload(editForm));
    };

    const applyTheme = async (theme: any, modeOverride?: AssignmentMode, dryRun = false) => {
        const themeId = String(theme?._id || theme?.key || '');
        if (!themeId) return;
        setApplyBusyId(themeId);
        setStatusMessage('');
        try {
            const mode = modeOverride || assignmentMode;
            if (mode === 'selected_tenant' && !selectedTenantKey) {
                throw new Error('Select a tenant before applying theme.');
            }
            if (mode === 'bulk_filter' && !bulkBusinessType.trim() && !bulkIndustry.trim() && !bulkAgencyId.trim()) {
                throw new Error('Provide at least one bulk filter (business type, industry, or agency ID).');
            }
            if (!dryRun && mode !== 'active_tenant') {
                const scopeText = mode === 'selected_tenant'
                    ? `tenant "${selectedTenantKey}"`
                    : `bulk filter (type="${bulkBusinessType || 'any'}", industry="${bulkIndustry || 'any'}", agency="${bulkAgencyId || 'any'}")`;
                const ok = window.confirm(`Apply "${theme?.name || theme?.key}" to ${scopeText}?`);
                if (!ok) {
                    setApplyBusyId(null);
                    return;
                }
            }

            const payload: Record<string, unknown> = {
                themeId: String(theme._id || ''),
                themeKey: String(theme.key || ''),
                mode,
                dryRun,
            };
            if (mode === 'selected_tenant') {
                payload.tenantKey = selectedTenantKey;
            }
            if (mode === 'bulk_filter') {
                payload.filter = {
                    businessType: bulkBusinessType,
                    industry: bulkIndustry,
                    agencyId: bulkAgencyId,
                    limit: bulkLimit,
                };
            }

            const res = await fetch('/api/system/themes/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = await res.json().catch(() => null);
            if (!res.ok) {
                const message = json && typeof json.error === 'string'
                    ? json.error
                    : 'Theme assignment failed.';
                throw new Error(message);
            }

            if (dryRun) {
                const targets = Array.isArray(json?.targets)
                    ? json.targets.map((target: any) => ({
                        key: typeof target?.tenantKey === 'string' ? target.tenantKey : '',
                        name: typeof target?.tenantName === 'string' ? target.tenantName : (typeof target?.tenantKey === 'string' ? target.tenantKey : ''),
                        businessType: typeof target?.businessType === 'string' ? target.businessType : '',
                        industry: typeof target?.industry === 'string' ? target.industry : '',
                        agencyId: typeof target?.agencyId === 'string' ? target.agencyId : null,
                    })).filter((target: TenantOption) => target.key)
                    : [];
                setPreviewTargets(targets);
                setPreviewCount(typeof json?.targetCount === 'number' ? json.targetCount : targets.length);
                setStatusKind('ok');
                setStatusMessage(`Preview ready: "${theme.name}" would target ${typeof json?.targetCount === 'number' ? json.targetCount : targets.length} tenant(s).`);
                return;
            }

            if (json?.appliedToActiveTenant) {
                const brandKit = toBrandKit(theme);
                applyRuntimeTheme(brandKit);
                window.dispatchEvent(new CustomEvent('kalp-theme-refresh', { detail: { payload: brandKit } }));
            }
            setPreviewTargets([]);
            setPreviewCount(0);
            setStatusKind('ok');
            const applied = typeof json?.appliedCount === 'number' ? json.appliedCount : 0;
            const target = typeof json?.targetCount === 'number' ? json.targetCount : applied;
            setStatusMessage(`Applied "${theme.name}" using ${mode.replace('_', ' ')} matrix: ${applied}/${target} tenant(s) updated.`);
            void loadHistory();
        } catch (error: unknown) {
            setStatusKind('error');
            setStatusMessage(error instanceof Error ? error.message : 'Theme apply failed.');
        } finally {
            setApplyBusyId(null);
        }
    };

    if (normalizedItems.length === 0) {
        return <div className="p-8 text-center text-xs text-slate-500">No theme presets found.</div>;
    }

    return (
        <div className={isGrid ? 'grid gap-4 p-4 md:grid-cols-2' : 'divide-y divide-slate-800/50'}>
            {statusMessage && (
                <div
                    className={`col-span-full flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                        statusKind === 'ok'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    }`}
                >
                    {statusKind === 'ok' ? <Check size={13} /> : <X size={13} />}
                    {statusMessage}
                </div>
            )}

            <div className="col-span-full rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Theme Assignment Matrix</h3>
                        <p className="mt-1 text-xs text-slate-400">
                            Apply a preset to active tenant, one selected tenant, or filtered tenant batches.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setHistoryExpanded((prev) => !prev);
                            if (!historyExpanded) void loadHistory();
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800/70"
                    >
                        Assignment History
                        <ChevronDown size={12} className={`transition ${historyExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <label className="space-y-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Target Mode</span>
                        <select
                            value={assignmentMode}
                            onChange={(event) => setAssignmentMode(event.target.value as AssignmentMode)}
                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                        >
                            <option value="active_tenant">Active Tenant</option>
                            <option value="selected_tenant">Selected Tenant</option>
                            <option value="bulk_filter">Bulk Filter</option>
                        </select>
                    </label>

                    {assignmentMode === 'selected_tenant' && (
                        <>
                            <label className="space-y-1 md:col-span-2">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Tenant Search</span>
                                <input
                                    value={tenantSearch}
                                    onChange={(event) => setTenantSearch(event.target.value)}
                                    placeholder="Search tenant key/name"
                                    className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Selected Tenant</span>
                                <select
                                    value={selectedTenantKey}
                                    onChange={(event) => setSelectedTenantKey(event.target.value)}
                                    className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                >
                                    <option value="">Choose tenant</option>
                                    {filteredTenantOptions.slice(0, 250).map((tenant) => (
                                        <option key={tenant.key} value={tenant.key}>
                                            {tenant.key} - {tenant.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </>
                    )}

                    {assignmentMode === 'bulk_filter' && (
                        <>
                            <label className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Business Type Filter</span>
                                <input
                                    value={bulkBusinessType}
                                    onChange={(event) => setBulkBusinessType(event.target.value)}
                                    placeholder="e.g. ecommerce"
                                    className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Industry Filter</span>
                                <input
                                    value={bulkIndustry}
                                    onChange={(event) => setBulkIndustry(event.target.value)}
                                    placeholder="e.g. fashion"
                                    className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Agency ID (Optional)</span>
                                <input
                                    value={bulkAgencyId}
                                    onChange={(event) => setBulkAgencyId(event.target.value)}
                                    placeholder="ObjectId"
                                    className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white font-mono"
                                />
                            </label>
                            <label className="space-y-1">
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Limit</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={200}
                                    value={bulkLimit}
                                    onChange={(event) => setBulkLimit(event.target.value)}
                                    className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                />
                            </label>
                        </>
                    )}
                </div>

                {previewCount > 0 && (
                    <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2">
                        <div className="text-[11px] font-semibold text-cyan-300">Preview targets: {previewCount}</div>
                        <div className="mt-1 text-[10px] text-cyan-100/80">
                            {previewTargets.slice(0, 6).map((target) => target.key).join(', ')}
                            {previewTargets.length > 6 ? ` +${previewTargets.length - 6} more` : ''}
                        </div>
                    </div>
                )}

                {historyExpanded && (
                    <div className="mt-3 rounded-lg border border-slate-800 bg-black/20 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Recent Assignment History</h4>
                            <button
                                type="button"
                                onClick={() => void loadHistory()}
                                className="inline-flex items-center gap-1 rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800/70"
                            >
                                <RefreshCw size={11} className={historyLoading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                        <div className="max-h-48 overflow-auto">
                            {history.length === 0 && (
                                <div className="text-[11px] text-slate-500">
                                    {historyLoading ? 'Loading history...' : 'No assignment history yet.'}
                                </div>
                            )}
                            <div className="space-y-2">
                                {history.map((entry) => (
                                    <div key={entry._id || `${entry.themeKey}-${entry.createdAt}`} className="rounded border border-slate-800/80 bg-slate-900/50 px-2.5 py-2 text-[11px]">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="font-semibold text-slate-100">{entry.themeName || entry.themeKey || 'Theme'}</div>
                                            <div className="text-[10px] text-slate-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '-'}</div>
                                        </div>
                                        <div className="mt-1 text-[10px] text-slate-400">
                                            mode: {entry.mode || 'active_tenant'} • applied: {entry.appliedCount ?? 0}/{entry.targetCount ?? 0}
                                            {entry.scopeAgencyId ? ` • agency: ${entry.scopeAgencyId}` : ''}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {normalizedItems.map((theme) => {
                const palette = [
                    theme.brandKitTemplate.colors.primary,
                    theme.brandKitTemplate.colors.secondary,
                    theme.brandKitTemplate.colors.accent,
                    theme.brandKitTemplate.colors.background,
                    theme.brandKitTemplate.colors.foreground,
                    theme.brandKitTemplate.colors.card,
                    theme.brandKitTemplate.colors.muted,
                    theme.brandKitTemplate.colors.border,
                    theme.brandKitTemplate.colors.ring,
                ];

                const isApplying = applyBusyId === String(theme._id || theme.key);

                return (
                    <div
                        key={theme._id}
                        className={
                            isGrid
                                ? 'rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 transition-colors hover:border-slate-700'
                                : 'p-4 transition-colors hover:bg-slate-800/20'
                        }
                    >
                        {editingId === theme._id ? (
                            <div className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Theme Key</span>
                                        <input
                                            value={editForm.key || ''}
                                            onChange={(e) => updateThemeMeta('key', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs font-mono text-white"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Theme Name</span>
                                        <input
                                            value={editForm.name || ''}
                                            onChange={(e) => updateThemeMeta('name', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Industry</span>
                                        <input
                                            value={editForm.industry || ''}
                                            onChange={(e) => updateThemeMeta('industry', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        />
                                    </label>
                                </div>

                                <div className="rounded-lg border border-slate-800 bg-black/20 p-3">
                                    <div className="mb-2 text-[11px] font-semibold text-slate-300">Palette Studio</div>
                                    <div className="grid gap-3 md:grid-cols-3">
                                        {COLOR_FIELDS.map((field) => (
                                            <ThemeColorField
                                                key={field.key}
                                                label={field.label}
                                                value={normalizeTheme(editForm).brandKitTemplate.colors[field.key]}
                                                onChange={(next) => updateColor(field.key, next)}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Heading Font</span>
                                        <select
                                            value={normalizeTheme(editForm).brandKitTemplate.typography.headingFont}
                                            onChange={(e) => updateTypography('headingFont', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        >
                                            {FONT_OPTIONS.map((font) => (
                                                <option key={font} value={font}>
                                                    {font}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Body Font</span>
                                        <select
                                            value={normalizeTheme(editForm).brandKitTemplate.typography.bodyFont}
                                            onChange={(e) => updateTypography('bodyFont', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        >
                                            {FONT_OPTIONS.map((font) => (
                                                <option key={font} value={font}>
                                                    {font}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>

                                <div className="grid gap-3 md:grid-cols-3">
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Border Radius</span>
                                        <input
                                            type="number"
                                            min={0}
                                            max={32}
                                            value={Number(normalizeTheme(editForm).brandKitTemplate.buttons.radius || 10)}
                                            onChange={(e) => updateThemeMeta('borderRadius', Number(e.target.value))}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        />
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Mode</span>
                                        <select
                                            value={normalizeTheme(editForm).brandKitTemplate.appearance.mode}
                                            onChange={(e) => updateThemeMeta('mode', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        >
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                        </select>
                                    </label>
                                    <label className="space-y-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Chrome</span>
                                        <select
                                            value={normalizeTheme(editForm).brandKitTemplate.appearance.chrome}
                                            onChange={(e) => updateThemeMeta('sidebarStyle', e.target.value)}
                                            className="w-full rounded border border-slate-700 bg-black/50 px-2.5 py-2 text-xs text-white"
                                        >
                                            <option value="glass">Glass</option>
                                            <option value="flat">Flat</option>
                                            <option value="solid">Solid</option>
                                        </select>
                                    </label>
                                </div>

                                <div className="flex flex-wrap justify-end gap-2">
                                    <button
                                        onClick={() => void applyTheme(editForm, assignmentMode, true)}
                                        disabled={isApplying}
                                        className="inline-flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-60"
                                    >
                                        {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                                        Preview Matrix Targets
                                    </button>
                                    <button
                                        onClick={() => void applyTheme(editForm)}
                                        disabled={isApplying}
                                        className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 disabled:opacity-60"
                                    >
                                        {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Apply via Matrix
                                    </button>
                                    <button
                                        onClick={() => void applyTheme(editForm, 'active_tenant')}
                                        disabled={isApplying}
                                        className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
                                    >
                                        {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Apply Active
                                    </button>
                                    <button
                                        onClick={saveTheme}
                                        disabled={saving}
                                        className="inline-flex items-center gap-1 rounded bg-cyan-500 px-3 py-1.5 text-xs font-bold text-black"
                                    >
                                        <Save size={12} /> Save
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="inline-flex items-center gap-1 rounded bg-slate-700 px-3 py-1.5 text-xs text-slate-300"
                                    >
                                        <X size={12} /> Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-white">{theme.name}</div>
                                        <div className="text-[10px] font-mono text-slate-500">
                                            {theme.key} • {theme.brandKitTemplate.typography.bodyFont} • r{theme.brandKitTemplate.buttons.radius} • {theme.industry || 'General'}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openForEdit(theme)}
                                            className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-white"
                                            title="Edit theme"
                                        >
                                            <Edit3 size={13} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(theme._id)}
                                            className="rounded p-1.5 text-slate-500 hover:bg-slate-700 hover:text-rose-400"
                                            title="Delete theme"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-3 overflow-hidden rounded-lg border border-slate-800">
                                    <div className="grid grid-cols-9">
                                        {palette.map((hex) => (
                                            <div key={`${theme._id}-${hex}`} className="h-10" style={{ backgroundColor: hex }} title={hex}></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-3 grid gap-1 text-[11px] text-slate-400">
                                    <div>
                                        <span className="text-slate-500">Heading:</span> {theme.brandKitTemplate.typography.headingFont}
                                    </div>
                                    <div>
                                        <span className="text-slate-500">Body:</span> {theme.brandKitTemplate.typography.bodyFont}
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <button
                                        onClick={() => void applyTheme(theme, assignmentMode, true)}
                                        disabled={isApplying}
                                        className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-60"
                                    >
                                        {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                                        Preview
                                    </button>
                                    <button
                                        onClick={() => void applyTheme(theme)}
                                        disabled={isApplying}
                                        className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 disabled:opacity-60"
                                    >
                                        {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Apply via Matrix
                                    </button>
                                    <button
                                        onClick={() => void applyTheme(theme, 'active_tenant')}
                                        disabled={isApplying}
                                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-60"
                                    >
                                        {isApplying ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        Apply Active
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
