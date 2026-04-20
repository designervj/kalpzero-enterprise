import { ObjectId } from 'mongodb';
import type { TokenFamily } from '@/lib/frontend-token-policy';

export type AgencyPlanBillingCycle = 'monthly' | 'yearly' | 'custom';
export type AgencyPlanStatus = 'draft' | 'active' | 'archived';

export interface AgencyPlanTier {
    key: string;
    name: string;
    badge: string;
    description: string;
    monthlyPrice: number;
    yearlyPrice: number;
    price: number; // Snapshot compatibility
    currency: string;
    billingCycle: AgencyPlanBillingCycle; // Snapshot compatibility
    isPublished: boolean;
    status: AgencyPlanStatus;
    modules: string[];
    plugins: string[];
    features: string[];
    limits: {
        maxUsers: number;
        maxProducts: number;
        storageGb: number;
        aiCreditsMonthly: number;
        maxPublishedPages: number;
    };
    support: {
        channel: 'email' | 'priority_email' | 'dedicated_manager';
        slaHours: number;
    };
    tokenPolicy?: {
        lockFamilies: TokenFamily[];
        requiredDefaults: TokenFamily[];
        reasons: Partial<Record<TokenFamily, string>>;
    };
}

export interface AgencyWhiteLabelSettings {
    brandName: string;
    shortName: string;
    logoUrl: string;
    compactLogoUrl: string;
    faviconUrl: string;
}

export interface AgencyMediaSettings {
    libraryName: string;
    cloudName: string;
    rootPath: string;
    sharedPrefix: string;
    enablePopulateFromKalp: boolean;
    categories: string[];
}

export interface AgencyEcosystemSettings {
    version: number;
    isHubEcosystem: boolean;
    hubId: string;
    terminologyOverrides: Record<string, string>;
    whiteLabel: AgencyWhiteLabelSettings;
    media: AgencyMediaSettings;
    planCatalog: AgencyPlanTier[];
    updatedAt: Date;
}

function normalizeToken(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toNumber(value: unknown, fallback: number, min = 0): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, parsed);
}

function toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );
}

function normalizePlanStatus(value: unknown): AgencyPlanStatus {
    if (value === 'active' || value === 'archived' || value === 'draft') return value;
    return 'active';
}

function normalizeBillingCycle(value: unknown): AgencyPlanBillingCycle {
    if (value === 'monthly' || value === 'yearly' || value === 'custom') return value;
    return 'monthly';
}

function normalizeTokenFamilyArray(value: unknown): TokenFamily[] {
    return toStringArray(value).filter(
        (item): item is TokenFamily => item === 'colors' || item === 'typography' || item === 'appearance'
    );
}

function normalizeTokenPolicy(value: unknown): AgencyPlanTier['tokenPolicy'] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return undefined;
    }
    const raw = value as Record<string, unknown>;
    const lockFamilies = normalizeTokenFamilyArray(raw.lockFamilies);
    const requiredDefaults = normalizeTokenFamilyArray(raw.requiredDefaults);
    const reasonsRaw = raw.reasons && typeof raw.reasons === 'object' && !Array.isArray(raw.reasons)
        ? raw.reasons as Record<string, unknown>
        : {};
    const reasons = Object.fromEntries(
        Object.entries(reasonsRaw)
            .filter(([key, val]) =>
                (key === 'colors' || key === 'typography' || key === 'appearance')
                && typeof val === 'string'
                && val.trim().length > 0
            )
            .map(([key, val]) => [key, String(val).trim()])
    ) as Partial<Record<TokenFamily, string>>;
    if (lockFamilies.length === 0 && requiredDefaults.length === 0 && Object.keys(reasons).length === 0) {
        return undefined;
    }
    return {
        lockFamilies,
        requiredDefaults,
        reasons,
    };
}

function buildDefaultPlanCatalog(): AgencyPlanTier[] {
    return [
        {
            key: 'basic',
            name: 'Basic',
            badge: 'Starter',
            description: 'Fast launch plan for single storefront and core publishing.',
            monthlyPrice: 19,
            yearlyPrice: 190,
            price: 19,
            currency: 'USD',
            billingCycle: 'monthly',
            isPublished: true,
            status: 'active',
            modules: ['website', 'branding', 'products', 'ecommerce', 'marketing', 'media', 'kalpbodh', 'real_estate'],
            plugins: ['catalog_builder'],
            features: ['catalog_management', 'billing_management'],
            limits: {
                maxUsers: 3,
                maxProducts: 250,
                storageGb: 5,
                aiCreditsMonthly: 5000,
                maxPublishedPages: 25,
            },
            support: {
                channel: 'email',
                slaHours: 72,
            },
            tokenPolicy: {
                lockFamilies: ['typography', 'appearance'],
                requiredDefaults: ['typography'],
                reasons: {
                    typography: 'Typography controls are locked by Basic plan.',
                    appearance: 'Appearance controls are locked by Basic plan.',
                },
            },
        },
        {
            key: 'pro',
            name: 'Pro',
            badge: 'Growth',
            description: 'Advanced growth plan with richer content and proposal workflows.',
            monthlyPrice: 79,
            yearlyPrice: 790,
            price: 79,
            currency: 'USD',
            billingCycle: 'monthly',
            isPublished: true,
            status: 'active',
            modules: ['website', 'branding', 'products', 'ecommerce', 'marketing', 'media', 'blog', 'portfolio', 'invoicing', 'kalpbodh', 'real_estate'],
            plugins: ['catalog_builder', 'proposal_builder'],
            features: ['catalog_management', 'billing_management', 'kalpbodh_analysis_workspace', 'kalpbodh_strategy_workspace'],
            limits: {
                maxUsers: 12,
                maxProducts: 5000,
                storageGb: 40,
                aiCreditsMonthly: 35000,
                maxPublishedPages: 120,
            },
            support: {
                channel: 'priority_email',
                slaHours: 24,
            },
            tokenPolicy: {
                lockFamilies: ['appearance'],
                requiredDefaults: [],
                reasons: {
                    appearance: 'Advanced appearance controls are locked by Pro plan.',
                },
            },
        },
        {
            key: 'enterprise',
            name: 'Enterprise',
            badge: 'Scale',
            description: 'Scale-grade plan for multi-team operations with premium support.',
            monthlyPrice: 199,
            yearlyPrice: 1990,
            price: 199,
            currency: 'USD',
            billingCycle: 'monthly',
            isPublished: true,
            status: 'active',
            modules: ['website', 'branding', 'products', 'ecommerce', 'bookings', 'marketing', 'media', 'blog', 'portfolio', 'invoicing', 'source', 'kalpbodh', 'real_estate'],
            plugins: ['catalog_builder', 'proposal_builder', 'resume_builder', 'portfolio_builder'],
            features: ['catalog_management', 'billing_management', 'kalpbodh_analysis_workspace', 'kalpbodh_strategy_workspace', 'kalpbodh_artifact_memory'],
            limits: {
                maxUsers: 50,
                maxProducts: 100000,
                storageGb: 250,
                aiCreditsMonthly: 150000,
                maxPublishedPages: 999,
            },
            support: {
                channel: 'dedicated_manager',
                slaHours: 8,
            },
            tokenPolicy: {
                lockFamilies: [],
                requiredDefaults: [],
                reasons: {},
            },
        },
    ];
}

function normalizePlanTier(input: unknown, fallback: AgencyPlanTier): AgencyPlanTier {
    const raw = input && typeof input === 'object' && !Array.isArray(input)
        ? input as Record<string, unknown>
        : {};
    const key = typeof raw.key === 'string' && raw.key.trim() ? normalizeToken(raw.key) : fallback.key;
    const currency = typeof raw.currency === 'string' && raw.currency.trim() ? raw.currency.trim().toUpperCase() : fallback.currency;
    return {
        key,
        name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : fallback.name,
        badge: typeof raw.badge === 'string' && raw.badge.trim() ? raw.badge.trim() : fallback.badge,
        description: typeof raw.description === 'string' ? raw.description.trim() : fallback.description,
        monthlyPrice: toNumber(raw.monthlyPrice, fallback.monthlyPrice, 0),
        yearlyPrice: toNumber(raw.yearlyPrice, fallback.yearlyPrice, 0),
        price: toNumber(raw.price || raw.monthlyPrice, fallback.price || fallback.monthlyPrice, 0),
        currency,
        billingCycle: normalizeBillingCycle(raw.billingCycle || fallback.billingCycle || 'monthly'),
        isPublished: typeof raw.isPublished === 'boolean' ? raw.isPublished : fallback.isPublished,
        status: normalizePlanStatus(raw.status || fallback.status),
        modules: toStringArray(raw.modules).length > 0 ? toStringArray(raw.modules) : fallback.modules,
        plugins: toStringArray(raw.plugins).length > 0 ? toStringArray(raw.plugins) : fallback.plugins,
        features: toStringArray(raw.features),
        limits: {
            maxUsers: toNumber((raw.limits as Record<string, unknown> | undefined)?.maxUsers, fallback.limits.maxUsers, 1),
            maxProducts: toNumber((raw.limits as Record<string, unknown> | undefined)?.maxProducts, fallback.limits.maxProducts, 1),
            storageGb: toNumber((raw.limits as Record<string, unknown> | undefined)?.storageGb, fallback.limits.storageGb, 1),
            aiCreditsMonthly: toNumber((raw.limits as Record<string, unknown> | undefined)?.aiCreditsMonthly, fallback.limits.aiCreditsMonthly, 0),
            maxPublishedPages: toNumber((raw.limits as Record<string, unknown> | undefined)?.maxPublishedPages, fallback.limits.maxPublishedPages, 1),
        },
        support: {
            channel: (
                (raw.support as Record<string, unknown> | undefined)?.channel === 'priority_email'
                || (raw.support as Record<string, unknown> | undefined)?.channel === 'dedicated_manager'
                || (raw.support as Record<string, unknown> | undefined)?.channel === 'email'
            )
                ? (raw.support as Record<string, unknown>).channel as AgencyPlanTier['support']['channel']
                : fallback.support.channel,
            slaHours: toNumber((raw.support as Record<string, unknown> | undefined)?.slaHours, fallback.support.slaHours, 1),
        },
        tokenPolicy: normalizeTokenPolicy(raw.tokenPolicy) || fallback.tokenPolicy,
    };
}

export function getDefaultAgencyTerminology(): Record<string, string> {
    return {
        'nav.media': 'Kalp Vistar',
        'nav.library': 'Kalp Vistar',
        'global.library': 'Kalp Vistar',
        'nav.settings': 'Niyantran',
        'global.controlPanel': 'Niyantran',
        'global.cloud': 'Kalp Megh',
        'global.storage': 'Kalp Megh',
    };
}

export function resolveAgencyIdFromUnknown(value: unknown): string | null {
    if (!value) return null;
    const id = String(value);
    return ObjectId.isValid(id) ? id : null;
}

export function normalizeAgencyEcosystem(
    input: unknown,
    agencyName: string,
    agencyId?: string
): AgencyEcosystemSettings {
    const raw = input && typeof input === 'object' && !Array.isArray(input)
        ? input as Record<string, unknown>
        : {};
    const defaultPlans = buildDefaultPlanCatalog();
    const rawPlans = Array.isArray(raw.planCatalog) ? raw.planCatalog : [];
    const planCatalog = (rawPlans.length > 0 ? rawPlans : defaultPlans)
        .map((item, index) => normalizePlanTier(item, defaultPlans[index] || defaultPlans[defaultPlans.length - 1]))
        .filter((plan, index, array) => array.findIndex((candidate) => candidate.key === plan.key) === index);

    const defaultHubId = agencyId ? `hub_${agencyId.slice(-8)}` : normalizeToken(agencyName || 'agency');
    const terminologyOverrides = {
        ...getDefaultAgencyTerminology(),
        ...(raw.terminologyOverrides && typeof raw.terminologyOverrides === 'object'
            ? Object.fromEntries(
                Object.entries(raw.terminologyOverrides as Record<string, unknown>)
                    .filter(([key, value]) => typeof value === 'string' && key.trim())
                    .map(([key, value]) => [key.trim(), String(value).trim()])
            )
            : {}),
    };

    const whiteLabelRaw = raw.whiteLabel && typeof raw.whiteLabel === 'object'
        ? raw.whiteLabel as Record<string, unknown>
        : {};
    const shortNameFallback = agencyName.trim().split(/\s+/).slice(0, 2).join(' ');

    const mediaRaw = raw.media && typeof raw.media === 'object'
        ? raw.media as Record<string, unknown>
        : {};

    return {
        version: toNumber(raw.version, 1, 1),
        isHubEcosystem: raw.isHubEcosystem === true,
        hubId: typeof raw.hubId === 'string' && raw.hubId.trim() ? normalizeToken(raw.hubId) : defaultHubId,
        terminologyOverrides,
        whiteLabel: {
            brandName: typeof whiteLabelRaw.brandName === 'string' && whiteLabelRaw.brandName.trim()
                ? whiteLabelRaw.brandName.trim()
                : agencyName,
            shortName: typeof whiteLabelRaw.shortName === 'string' && whiteLabelRaw.shortName.trim()
                ? whiteLabelRaw.shortName.trim()
                : shortNameFallback || agencyName,
            logoUrl: typeof whiteLabelRaw.logoUrl === 'string' ? whiteLabelRaw.logoUrl.trim() : '',
            compactLogoUrl: typeof whiteLabelRaw.compactLogoUrl === 'string' ? whiteLabelRaw.compactLogoUrl.trim() : '',
            faviconUrl: typeof whiteLabelRaw.faviconUrl === 'string' ? whiteLabelRaw.faviconUrl.trim() : '',
        },
        media: {
            libraryName: typeof mediaRaw.libraryName === 'string' && mediaRaw.libraryName.trim()
                ? mediaRaw.libraryName.trim()
                : 'Kalp Vistar',
            cloudName: typeof mediaRaw.cloudName === 'string' && mediaRaw.cloudName.trim()
                ? mediaRaw.cloudName.trim()
                : 'Kalp Megh',
            rootPath: typeof mediaRaw.rootPath === 'string' && mediaRaw.rootPath.trim()
                ? mediaRaw.rootPath.trim()
                : `s3://kalp-megh-assets/${agencyId || normalizeToken(agencyName)}`,
            sharedPrefix: typeof mediaRaw.sharedPrefix === 'string' && mediaRaw.sharedPrefix.trim()
                ? mediaRaw.sharedPrefix.trim()
                : '/shared',
            enablePopulateFromKalp: mediaRaw.enablePopulateFromKalp !== false,
            categories: toStringArray(mediaRaw.categories).length > 0
                ? toStringArray(mediaRaw.categories)
                : ['logos', 'icons', 'backgrounds', 'banners', 'videos', 'templates'],
        },
        planCatalog,
        updatedAt: raw.updatedAt instanceof Date
            ? raw.updatedAt
            : (typeof raw.updatedAt === 'string' ? new Date(raw.updatedAt) : new Date()),
    };
}

export function resolveAgencyPlan(input: {
    ecosystem: AgencyEcosystemSettings;
    requestedPlanKey?: string;
}): AgencyPlanTier | null {
    const catalog = Array.isArray(input.ecosystem.planCatalog) ? input.ecosystem.planCatalog : [];
    if (catalog.length === 0) return null;
    const requestedKey = typeof input.requestedPlanKey === 'string' ? normalizeToken(input.requestedPlanKey) : '';
    if (requestedKey) {
        const explicit = catalog.find((plan) => normalizeToken(plan.key) === requestedKey);
        if (explicit) return explicit;
    }
    const firstPublished = catalog.find((plan) => plan.status !== 'archived' && plan.isPublished);
    if (firstPublished) return firstPublished;
    return catalog.find((plan) => plan.status !== 'archived') || catalog[0];
}

export function filterCapabilitiesByAgencyPlan(input: {
    modules: string[];
    plugins: string[];
    plan: AgencyPlanTier | null;
}): { modules: string[]; plugins: string[] } {
    if (!input.plan) {
        return {
            modules: toStringArray(input.modules),
            plugins: toStringArray(input.plugins),
        };
    }
    const allowedModules = new Set(toStringArray(input.plan.modules));
    const allowedPlugins = new Set(toStringArray(input.plan.plugins));

    const nextModules = toStringArray(input.modules).filter((module) => allowedModules.has(module));
    const nextPlugins = toStringArray(input.plugins).filter((plugin) => allowedPlugins.has(plugin));
    return {
        modules: nextModules.length > 0 ? nextModules : toStringArray(input.plan.modules),
        plugins: nextPlugins.length > 0 ? nextPlugins : toStringArray(input.plan.plugins),
    };
}
