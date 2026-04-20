export type AdminWorkspaceSectionKey =
    | 'overview'
    | 'frontend'
    | 'commerce'
    | 'operations'
    | 'content'
    | 'engagement'
    | 'modules'
    | 'platform';

export type AdminWorkspaceDashboardLayout = 'default' | 'focus' | 'split';

export type AdminWorkspace = {
    sidebar: {
        sectionLabels: Record<AdminWorkspaceSectionKey, string>;
        itemOrder: string[];
        hiddenItems: string[];
        labelOverrides: Record<string, string>;
    };
    dashboardHome: {
        layout: AdminWorkspaceDashboardLayout;
        headline: string;
        subheadline: string;
        quickActionOrder: string[];
        hiddenQuickActions: string[];
        kpiOrder: string[];
        hiddenKpis: string[];
        widgetOrder: string[];
        hiddenWidgets: string[];
        labelOverrides: Record<string, string>;
    };
};

export type WorkspaceRenderableItem = {
    id: string;
    label: string;
};

const DEFAULT_SECTION_LABELS: Record<AdminWorkspaceSectionKey, string> = {
    overview: 'Overview',
    frontend: 'Frontend',
    commerce: 'Commerce',
    operations: 'Operations',
    content: 'Content',
    engagement: 'Engagement',
    modules: 'Apps',
    platform: 'Platform',
};

export const DEFAULT_ADMIN_WORKSPACE: AdminWorkspace = {
    sidebar: {
        sectionLabels: DEFAULT_SECTION_LABELS,
        itemOrder: [],
        hiddenItems: [],
        labelOverrides: {},
    },
    dashboardHome: {
        layout: 'default',
        headline: '',
        subheadline: '',
        quickActionOrder: [],
        hiddenQuickActions: [],
        kpiOrder: [],
        hiddenKpis: [],
        widgetOrder: [],
        hiddenWidgets: [],
        labelOverrides: {},
    },
};

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((entry): entry is string => typeof entry === 'string')
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    );
}

function normalizeLabelMap(value: unknown): Record<string, string> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, rawValue]) => {
            const normalizedKey = key.trim();
            if (!normalizedKey || typeof rawValue !== 'string') return null;
            const normalizedValue = rawValue.trim();
            if (!normalizedValue) return null;
            return [normalizedKey, normalizedValue] as const;
        })
        .filter((entry): entry is readonly [string, string] => Boolean(entry));
    return Object.fromEntries(entries);
}

export function mergeAdminWorkspace(payload?: unknown): AdminWorkspace {
    const raw =
        payload && typeof payload === 'object' && !Array.isArray(payload)
            ? (payload as Record<string, unknown>)
            : {};
    const rawSidebar =
        raw.sidebar && typeof raw.sidebar === 'object' && !Array.isArray(raw.sidebar)
            ? (raw.sidebar as Record<string, unknown>)
            : {};
    const rawDashboardHome =
        raw.dashboardHome &&
        typeof raw.dashboardHome === 'object' &&
        !Array.isArray(raw.dashboardHome)
            ? (raw.dashboardHome as Record<string, unknown>)
            : {};
    const rawSectionLabels = normalizeLabelMap(rawSidebar.sectionLabels);
    const sidebarSectionLabels = {
        ...DEFAULT_SECTION_LABELS,
        ...Object.fromEntries(
            Object.entries(rawSectionLabels).filter(([key]) =>
                key in DEFAULT_SECTION_LABELS
            )
        ),
    } as Record<AdminWorkspaceSectionKey, string>;
    const layout =
        rawDashboardHome.layout === 'focus' || rawDashboardHome.layout === 'split'
            ? rawDashboardHome.layout
            : 'default';

    return {
        sidebar: {
            sectionLabels: sidebarSectionLabels,
            itemOrder: normalizeStringArray(rawSidebar.itemOrder),
            hiddenItems: normalizeStringArray(rawSidebar.hiddenItems),
            labelOverrides: normalizeLabelMap(rawSidebar.labelOverrides),
        },
        dashboardHome: {
            layout,
            headline:
                typeof rawDashboardHome.headline === 'string'
                    ? rawDashboardHome.headline.trim()
                    : '',
            subheadline:
                typeof rawDashboardHome.subheadline === 'string'
                    ? rawDashboardHome.subheadline.trim()
                    : '',
            quickActionOrder: normalizeStringArray(rawDashboardHome.quickActionOrder),
            hiddenQuickActions: normalizeStringArray(rawDashboardHome.hiddenQuickActions),
            kpiOrder: normalizeStringArray(rawDashboardHome.kpiOrder),
            hiddenKpis: normalizeStringArray(rawDashboardHome.hiddenKpis),
            widgetOrder: normalizeStringArray(rawDashboardHome.widgetOrder),
            hiddenWidgets: normalizeStringArray(rawDashboardHome.hiddenWidgets),
            labelOverrides: normalizeLabelMap(rawDashboardHome.labelOverrides),
        },
    };
}

export function buildWorkspaceRouteItemId(href: string, prefix = 'sidebar'): string {
    const normalized = href
        .trim()
        .replace(/^\//, '')
        .replace(/\/+/g, '.')
        .replace(/[^a-zA-Z0-9._-]+/g, '-');
    return `${prefix}.${normalized || 'root'}`;
}

export function applyWorkspaceItemCustomization<T extends WorkspaceRenderableItem>(
    items: T[],
    input: {
        order?: string[];
        hidden?: string[];
        labelOverrides?: Record<string, string>;
    }
): T[] {
    const orderIndex = new Map(
        (input.order || []).map((id, index) => [id, index] as const)
    );
    const hiddenSet = new Set(input.hidden || []);
    const labelOverrides = input.labelOverrides || {};
    const rankedItems = items
        .map((item, originalIndex) => ({
            item: {
                ...item,
                label: labelOverrides[item.id] || item.label,
            } as T,
            originalIndex,
        }))
        .filter(({ item }) => !hiddenSet.has(item.id));

    return rankedItems
        .sort((a, b) => {
            const aRank = orderIndex.has(a.item.id)
                ? (orderIndex.get(a.item.id) as number)
                : Number.MAX_SAFE_INTEGER;
            const bRank = orderIndex.has(b.item.id)
                ? (orderIndex.get(b.item.id) as number)
                : Number.MAX_SAFE_INTEGER;
            if (aRank !== bRank) return aRank - bRank;
            return a.originalIndex - b.originalIndex;
        })
        .map(({ item }) => item);
}
