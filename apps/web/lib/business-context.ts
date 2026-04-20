export interface NavOverrideSpec {
    label?: string;
    path?: string;
    icon?: string;
    parentId?: string;
}

export interface VocabularyTermsSpec {
    catalogPlural: string;
    catalogSingular: string;
    categories: string;
    attributes: string;
    orders: string;
}

export interface TenantVocabularyProfileSpec {
    version: number;
    key: string;
    source: 'auto' | 'manual';
    generatedAt: Date;
    contexts: string[];
    businessType: string;
    industry: string;
    terms: VocabularyTermsSpec;
    navOverrides: Record<string, NavOverrideSpec>;
}

const CANONICAL_TRAVEL_CONTEXT = 'travel-and-tour-package';
const CANONICAL_EDUCATION_CONTEXT = 'education-and-training';

const TRAVEL_CONTEXT_KEYS = new Set<string>([
    'travel-tour-package',
    'travel-and-tour-package',
    'travel-package',
    'tour-package',
    'travel-agency',
    'travel-agencies',
    'travel-and-tour',
    'travel-tour',
    'adventure-and-activity-experience',
    'vacation-rental-homestay',
]);

const EDUCATION_CONTEXT_KEYS = new Set<string>([
    'education-and-training',
    'school-and-institute',
    'school-institute',
    'coaching',
    'coaching-and-mentoring',
    'online-courses',
    'college',
    'college-management',
    'tuition',
    'edtech',
]);

const COMMERCE_CONTEXT_KEYS = new Set<string>([
    'online-store',
    'ecommerce',
    'e-commerce',
    'retail',
    'fashion-boutique',
    'grocery-delivery',
    'commerce',
    'store',
]);

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map(item => item.trim())
                .filter(Boolean)
        )
    );
}

export function normalizeBusinessContext(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toTitleCase(value: string): string {
    return value
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function pluralizeToken(token: string): string {
    const normalized = token.trim();
    if (!normalized) return 'Products';

    const lower = normalized.toLowerCase();
    if (lower.endsWith('y') && !/[aeiou]y$/.test(lower)) {
        return `${normalized.slice(0, -1)}ies`;
    }
    if (lower.endsWith('s') || lower.endsWith('x') || lower.endsWith('z') || lower.endsWith('ch') || lower.endsWith('sh')) {
        return `${normalized}es`;
    }
    return `${normalized}s`;
}

/**
 * Safely extracts a string key/slug from various businessType formats
 */
export function extractBusinessTypeKey(bt: unknown): string {
    if (!bt) return '';
    if (typeof bt === 'string') return bt.trim();
    if (Array.isArray(bt)) {
        if (bt.length === 0) return '';
        return extractBusinessTypeKey(bt[0]);
    }
    if (typeof bt === 'object' && bt !== null) {
        const raw = bt as Record<string, unknown>;
        return typeof raw.key === 'string' ? raw.key : typeof raw.businessType === 'string' ? raw.businessType : '';
    }
    return '';
}

/**
 * Safely extracts a display name from various businessType formats
 */
export function extractBusinessTypeName(bt: unknown): string {
    if (!bt) return '';
    if (typeof bt === 'string') return bt.trim();
    if (Array.isArray(bt)) {
        return bt.map(extractBusinessTypeName).filter(Boolean).join(', ');
    }
    if (typeof bt === 'object' && bt !== null) {
        const raw = bt as Record<string, unknown>;
        return typeof raw.name === 'string' ? raw.name : typeof raw.businessType === 'string' ? raw.businessType : extractBusinessTypeKey(bt);
    }
    return '';
}

function buildFallbackTerms(businessType: string): VocabularyTermsSpec {
    const trimmed = businessType.trim();
    if (!trimmed) {
        return {
            catalogPlural: 'Products',
            catalogSingular: 'Product',
            categories: 'Categories',
            attributes: 'Attributes',
            orders: 'Orders',
        };
    }

    const base = toTitleCase(trimmed.split('&')[0].split('/')[0]);
    const singular = base || 'Product';
    const plural = pluralizeToken(singular);

    return {
        catalogPlural: plural,
        catalogSingular: singular,
        categories: 'Categories',
        attributes: 'Attributes',
        orders: 'Orders',
    };
}

function getRuleBasedTerms(contexts: string[], businessType: string, industry: string): { key: string; terms: VocabularyTermsSpec; navOverrides: Record<string, NavOverrideSpec> } {
    const contextSet = new Set(contexts.map(toCanonicalBusinessContext));
    const btKey = extractBusinessTypeKey(businessType);
    const lookup = `${normalizeBusinessContext(btKey)} ${normalizeBusinessContext(industry)}`;

    const hasAnyToken = (tokens: string[]): boolean => tokens.some(token => lookup.includes(token));

    if (contextSet.has(CANONICAL_TRAVEL_CONTEXT) || hasAnyToken(['travel', 'tour', 'itinerary', 'trip', 'vacation'])) {
        const terms: VocabularyTermsSpec = {
            catalogPlural: 'Travel Packages',
            catalogSingular: 'Travel Package',
            categories: 'Hotels',
            attributes: 'Package Attributes',
            orders: 'Orders',
        };
        return {
            key: 'travel-vocabulary',
            terms,
            navOverrides: {
                'nav.products': { label: terms.catalogPlural },
                'nav.products.categories': { label: terms.categories },
                'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
                'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
                'nav.travel.packages': { label: terms.catalogPlural, path: '/travel/packages' },
                'nav.travel.hotels': { label: 'Hotels', path: '/travel/catalog/hotels' },
                'nav.travel.activities': { label: 'Activities', path: '/travel/catalog/activities' },
                'nav.travel.transfers': { label: 'Transfers', path: '/travel/catalog/transfers' },
                'nav.travel.customers': { label: 'Customers', path: '/customers' },
            },
        };
    }

    if (contextSet.has(CANONICAL_EDUCATION_CONTEXT) || hasAnyToken(['school', 'education', 'academy', 'coaching', 'college', 'tuition'])) {
        const terms: VocabularyTermsSpec = {
            catalogPlural: 'Programs',
            catalogSingular: 'Program',
            categories: 'Curriculum',
            attributes: 'Program Attributes',
            orders: 'Enrollments',
        };
        return {
            key: 'education-vocabulary',
            terms,
            navOverrides: {
                'nav.products': { label: terms.catalogPlural, path: '/ecommerce' },
                'nav.products.categories': { label: terms.categories, path: '/ecommerce/categories' },
                'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
                'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
            },
        };
    }

    if (hasAnyToken(['hotel', 'resort', 'hospitality'])) {
        const terms: VocabularyTermsSpec = {
            catalogPlural: 'Rooms',
            catalogSingular: 'Room',
            categories: 'Room Types',
            attributes: 'Room Attributes',
            orders: 'Bookings',
        };
        return {
            key: 'hospitality-vocabulary',
            terms,
            navOverrides: {
                'nav.products': { label: terms.catalogPlural, path: '/ecommerce' },
                'nav.products.categories': { label: terms.categories, path: '/ecommerce/categories' },
                'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
                'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
            },
        };
    }

    if (hasAnyToken(['restaurant', 'cafe', 'food', 'dining'])) {
        const terms: VocabularyTermsSpec = {
            catalogPlural: 'Menu Items',
            catalogSingular: 'Menu Item',
            categories: 'Menu Categories',
            attributes: 'Menu Attributes',
            orders: 'Orders',
        };
        return {
            key: 'food-vocabulary',
            terms,
            navOverrides: {
                'nav.products': { label: terms.catalogPlural, path: '/ecommerce' },
                'nav.products.categories': { label: terms.categories, path: '/ecommerce/categories' },
                'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
                'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
            },
        };
    }

    if (hasAnyToken(['property', 'real-estate', 'real-estate', 'brokerage', 'rental'])) {
        const terms: VocabularyTermsSpec = {
            catalogPlural: 'Listings',
            catalogSingular: 'Listing',
            categories: 'Property Types',
            attributes: 'Listing Attributes',
            orders: 'Leads',
        };
        return {
            key: 'property-vocabulary',
            terms,
            navOverrides: {
                'nav.products': { label: terms.catalogPlural, path: '/ecommerce' },
                'nav.products.categories': { label: terms.categories, path: '/ecommerce/categories' },
                'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
                'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
            },
        };
    }

    if (hasAnyToken(['furniture', 'retail', 'wholesale', 'store', 'boutique', 'ecommerce', 'e-commerce', 'apparel', 'electronics'])) {
        const terms: VocabularyTermsSpec = {
            catalogPlural: 'Products',
            catalogSingular: 'Product',
            categories: 'Categories',
            attributes: 'Attributes',
            orders: 'Orders',
        };
        return {
            key: 'commerce-vocabulary',
            terms,
            navOverrides: {
                'nav.products': { label: terms.catalogPlural, path: '/ecommerce' },
                'nav.products.categories': { label: terms.categories, path: '/ecommerce/categories' },
                'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
                'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
            },
        };
    }

    const fallbackTerms = buildFallbackTerms(btKey);
    return {
        key: normalizeBusinessContext(btKey) || 'default-vocabulary',
        terms: fallbackTerms,
        navOverrides: {
            'nav.products': { label: fallbackTerms.catalogPlural, path: '/ecommerce' },
            'nav.products.categories': { label: fallbackTerms.categories, path: '/ecommerce/categories' },
            'nav.products.attributes': { label: fallbackTerms.attributes, path: '/ecommerce/attributes' },
            'nav.ecommerce.orders': { label: fallbackTerms.orders, path: '/ecommerce/orders' },
        },
    };
}

function parseVocabularyProfile(value: unknown): TenantVocabularyProfileSpec | null {
    if (!value || typeof value !== 'object') return null;
    const raw = value as Record<string, unknown>;
    const key = typeof raw.key === 'string' ? raw.key.trim() : '';
    if (!key) return null;

    const termsRaw = raw.terms && typeof raw.terms === 'object'
        ? raw.terms as Record<string, unknown>
        : {};

    const safeTerms = (fallback: VocabularyTermsSpec): VocabularyTermsSpec => ({
        catalogPlural: typeof termsRaw.catalogPlural === 'string' && termsRaw.catalogPlural.trim()
            ? termsRaw.catalogPlural.trim()
            : fallback.catalogPlural,
        catalogSingular: typeof termsRaw.catalogSingular === 'string' && termsRaw.catalogSingular.trim()
            ? termsRaw.catalogSingular.trim()
            : fallback.catalogSingular,
        categories: typeof termsRaw.categories === 'string' && termsRaw.categories.trim()
            ? termsRaw.categories.trim()
            : fallback.categories,
        attributes: typeof termsRaw.attributes === 'string' && termsRaw.attributes.trim()
            ? termsRaw.attributes.trim()
            : fallback.attributes,
        orders: typeof termsRaw.orders === 'string' && termsRaw.orders.trim()
            ? termsRaw.orders.trim()
            : fallback.orders,
    });

    const btKeyFromRaw = extractBusinessTypeKey(raw.businessType);
    const defaultTerms = buildFallbackTerms(btKeyFromRaw);
    const generatedAtValue = raw.generatedAt instanceof Date
        ? raw.generatedAt
        : typeof raw.generatedAt === 'string'
            ? new Date(raw.generatedAt)
            : new Date();
    const generatedAt = Number.isNaN(generatedAtValue.getTime()) ? new Date() : generatedAtValue;

    return {
        version: typeof raw.version === 'number' ? raw.version : 1,
        key,
        source: raw.source === 'manual' ? 'manual' : 'auto',
        generatedAt,
        contexts: normalizeStringArray(raw.contexts).map(toCanonicalBusinessContext),
        businessType: extractBusinessTypeKey(raw.businessType),
        industry: typeof raw.industry === 'string' ? raw.industry : '',
        terms: safeTerms(defaultTerms),
        navOverrides: normalizeNavOverrides(raw.navOverrides),
    };
}

export function buildAutoTenantVocabularyProfile(input: {
    businessType?: unknown;
    industry?: unknown;
    activeBusinessContexts?: unknown;
    businessContexts?: unknown;
    businessProfiles?: unknown;
    profiles?: unknown;
}): TenantVocabularyProfileSpec {
    const businessTypeKey = extractBusinessTypeKey(input.businessType);
    const industry = typeof input.industry === 'string' ? input.industry.trim() : '';
    const contexts = deriveBusinessContexts({
        businessType: businessTypeKey,
        activeBusinessContexts: input.activeBusinessContexts,
        businessContexts: input.businessContexts,
        businessProfiles: input.businessProfiles,
        profiles: input.profiles,
    });
    const mapped = getRuleBasedTerms(contexts, businessTypeKey, industry);

    return {
        version: 1,
        key: mapped.key,
        source: 'auto',
        generatedAt: new Date(),
        contexts,
        businessType: businessTypeKey,
        industry,
        terms: mapped.terms,
        navOverrides: mapped.navOverrides,
    };
}

export function resolveTenantVocabularyProfile(input: {
    existing?: unknown;
    businessType?: unknown;
    industry?: unknown;
    activeBusinessContexts?: unknown;
    businessContexts?: unknown;
    businessProfiles?: unknown;
    profiles?: unknown;
}): TenantVocabularyProfileSpec {
    const existing = parseVocabularyProfile(input.existing);
    if (existing?.source === 'manual') {
        return existing;
    }

    return buildAutoTenantVocabularyProfile({
        businessType: input.businessType ?? existing?.businessType,
        industry: input.industry ?? existing?.industry,
        activeBusinessContexts: input.activeBusinessContexts ?? existing?.contexts,
        businessContexts: input.businessContexts ?? existing?.contexts,
        businessProfiles: input.businessProfiles,
        profiles: input.profiles,
    });
}

function isTravelKeywordContext(context: string): boolean {
    const tokens = context.split('-').filter(Boolean);
    const hasTravelOrTourToken = tokens.includes('travel') || tokens.includes('tour');
    const hasHospitalitySignal = tokens.includes('hospitality') && tokens.includes('tourism');
    return hasTravelOrTourToken || hasHospitalitySignal;
}

function isEducationKeywordContext(context: string): boolean {
    const tokens = context.split('-').filter(Boolean);
    const educationTokens = ['education', 'training', 'school', 'college', 'coaching', 'institute', 'tuition', 'academy'];
    return educationTokens.some(token => tokens.includes(token));
}

function isCommerceKeywordContext(context: string): boolean {
    const tokens = context.split('-').filter(Boolean);
    const commerceTokens = [
        'store',
        'retail',
        'commerce',
        'ecommerce',
        'e',
        'shop',
        'shopify',
        'catalog',
        'product',
    ];
    return commerceTokens.some(token => tokens.includes(token));
}

function inferPrimaryBusinessDomain(input: { businessType?: unknown; industry?: unknown }): 'travel' | 'education' | 'commerce' | null {
    const businessTypeKey = extractBusinessTypeKey(input.businessType);
    const businessTypeNormalized = normalizeBusinessContext(businessTypeKey);
    const industry = typeof input.industry === 'string' ? normalizeBusinessContext(input.industry) : '';
    const lookup = normalizeBusinessContext(`${businessTypeNormalized} ${industry}`.trim());
    if (!lookup) return null;

    if (isTravelKeywordContext(lookup)) return 'travel';
    if (isEducationKeywordContext(lookup)) return 'education';
    if (isCommerceKeywordContext(lookup)) return 'commerce';
    return null;
}

function isCommerceContext(value: string): boolean {
    const normalized = normalizeBusinessContext(value);
    if (!normalized) return false;
    return COMMERCE_CONTEXT_KEYS.has(normalized) || isCommerceKeywordContext(normalized);
}

function resolveContextConflictPolicy(input: {
    contexts: string[];
    businessType?: unknown;
    industry?: unknown;
}): string[] {
    const contexts = Array.from(new Set(input.contexts.map(toCanonicalBusinessContext).filter(Boolean)));
    if (contexts.length <= 1) return contexts;

    const primaryDomain = inferPrimaryBusinessDomain({
        businessType: input.businessType,
        industry: input.industry,
    });
    if (!primaryDomain) return contexts;

    if (primaryDomain === 'commerce') {
        const hasCommerceSignals = contexts.some((context) => isCommerceContext(context));
        if (!hasCommerceSignals) return contexts;
        return contexts.filter((context) => (
            context !== CANONICAL_TRAVEL_CONTEXT && context !== CANONICAL_EDUCATION_CONTEXT
        ));
    }

    if (primaryDomain === 'travel') {
        return contexts.filter((context) => context !== CANONICAL_EDUCATION_CONTEXT);
    }

    if (primaryDomain === 'education') {
        return contexts.filter((context) => context !== CANONICAL_TRAVEL_CONTEXT);
    }

    return contexts;
}

function toCanonicalBusinessContext(value: string): string {
    const normalized = normalizeBusinessContext(value);
    if (!normalized) return '';
    if (TRAVEL_CONTEXT_KEYS.has(normalized)) return CANONICAL_TRAVEL_CONTEXT;
    if (isTravelKeywordContext(normalized)) return CANONICAL_TRAVEL_CONTEXT;
    if (EDUCATION_CONTEXT_KEYS.has(normalized)) return CANONICAL_EDUCATION_CONTEXT;
    if (isEducationKeywordContext(normalized)) return CANONICAL_EDUCATION_CONTEXT;
    return normalized;
}

function extractBusinessContextsFromProfiles(value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const contexts: string[] = [];
    for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
            contexts.push(toCanonicalBusinessContext(item));
            continue;
        }
        if (item && typeof item === 'object') {
            const profile = item as Record<string, unknown>;
            const candidates = [profile.key, profile.context, profile.businessType];
            for (const candidate of candidates) {
                if (typeof candidate === 'string' && candidate.trim()) {
                    contexts.push(toCanonicalBusinessContext(candidate));
                    break;
                }
            }
        }
    }

    return contexts;
}

export function resolveBusinessContexts(tenant: Record<string, unknown> | null): string[] {
    const explicitContexts = normalizeStringArray(tenant?.activeBusinessContexts || tenant?.businessContexts)
        .map(toCanonicalBusinessContext)
        .filter(Boolean);

    const profileContexts = extractBusinessContextsFromProfiles(
        tenant?.businessProfiles || tenant?.profiles
    );

    const businessTypes = Array.isArray(tenant?.businessTypes) 
        ? tenant.businessTypes 
        : tenant?.businessType ? [tenant.businessType] : [];

    const fallbackBusinessType = businessTypes
        .map(bt => extractBusinessTypeKey(bt))
        .filter(Boolean)
        .map(toCanonicalBusinessContext);

    const inferredContexts = Array.from(
        new Set([...profileContexts, ...fallbackBusinessType].filter(Boolean))
    );

    if (explicitContexts.length === 0) {
        return resolveContextConflictPolicy({
            contexts: inferredContexts,
            businessType: tenant?.businessType,
            industry: tenant?.industry,
        });
    }

    if (inferredContexts.length === 0) {
        return resolveContextConflictPolicy({
            contexts: Array.from(new Set(explicitContexts)),
            businessType: tenant?.businessType,
            industry: tenant?.industry,
        });
    }

    // Self-heal stale historical context leakage:
    // when explicit contexts drift away from current business type/profile-derived contexts
    // and there is no overlap, use inferred contexts as the active runtime set.
    const explicitSet = new Set(explicitContexts);
    const hasOverlap = inferredContexts.some((context) => explicitSet.has(context));
    if (!hasOverlap) {
        return resolveContextConflictPolicy({
            contexts: inferredContexts,
            businessType: tenant?.businessType,
            industry: tenant?.industry,
        });
    }

    return resolveContextConflictPolicy({
        contexts: Array.from(new Set(explicitContexts)),
        businessType: tenant?.businessType,
        industry: tenant?.industry,
    });
}

export function deriveBusinessContexts(input: {
    businessType?: unknown;
    activeBusinessContexts?: unknown;
    businessContexts?: unknown;
    businessProfiles?: unknown;
    profiles?: unknown;
}): string[] {
    return resolveBusinessContexts(input as Record<string, unknown>);
}

export function getDefaultNavOverridesForContexts(contexts: string[]): Record<string, NavOverrideSpec> {
    const hasTravelContext = isTravelContextActive(contexts);
    const hasEducationContext = isEducationContextActive(contexts);
    const overrides: Record<string, NavOverrideSpec> = {};

    if (hasTravelContext) {
        overrides['nav.products'] = {
            label: 'Travel Packages',
        };
        overrides['nav.products.categories'] = {
            label: 'Hotels',
        };
    }

    // Apply education naming only when travel context is not active to avoid cross-domain conflicts.
    if (hasEducationContext && !hasTravelContext) {
        overrides['nav.products'] = {
            label: 'Programs',
            path: '/ecommerce',
        };
        overrides['nav.products.categories'] = {
            label: 'Curriculum',
            path: '/ecommerce/categories',
        };
        overrides['nav.ecommerce.orders'] = {
            label: 'Enrollments',
            path: '/ecommerce/orders',
        };
    }

    return overrides;
}

export function isTravelContextActive(contexts: string[]): boolean {
    return contexts.some(context => toCanonicalBusinessContext(context) === CANONICAL_TRAVEL_CONTEXT);
}

export function isEducationContextActive(contexts: string[]): boolean {
    return contexts.some(context => toCanonicalBusinessContext(context) === CANONICAL_EDUCATION_CONTEXT);
}

export function normalizeNavOverrides(value: unknown): Record<string, NavOverrideSpec> {
    if (!value || typeof value !== 'object') return {};

    const overrides: Record<string, NavOverrideSpec> = {};
    for (const [rawKey, rawOverride] of Object.entries(value as Record<string, unknown>)) {
        const key = rawKey.trim();
        if (!key || !rawOverride || typeof rawOverride !== 'object') continue;

        const parsed = rawOverride as Record<string, unknown>;
        const override: NavOverrideSpec = {};

        if (typeof parsed.label === 'string' && parsed.label.trim()) override.label = parsed.label.trim();
        if (typeof parsed.path === 'string' && parsed.path.trim()) override.path = parsed.path.trim();
        if (typeof parsed.icon === 'string' && parsed.icon.trim()) override.icon = parsed.icon.trim();
        if (typeof parsed.parentId === 'string' && parsed.parentId.trim()) override.parentId = parsed.parentId.trim();

        if (Object.keys(override).length > 0) {
            overrides[key] = override;
        }
    }

    return overrides;
}

function isTravelNavigationOverride(key: string, override: NavOverrideSpec): boolean {
    const normalizedKey = key.trim().toLowerCase();
    if (normalizedKey.startsWith('nav.travel')) return true;
    const path = typeof override.path === 'string' ? override.path.trim().toLowerCase() : '';
    if (path.startsWith('/travel/')) return true;
    return false;
}

function applyNavigationDomainPolicy(input: {
    overrides: Record<string, NavOverrideSpec>;
    businessType?: unknown;
    industry?: unknown;
}): Record<string, NavOverrideSpec> {
    const primaryDomain = inferPrimaryBusinessDomain({
        businessType: input.businessType,
        industry: input.industry,
    });
    if (!primaryDomain) return input.overrides;
    if (primaryDomain === 'travel') return input.overrides;

    const filteredEntries = Object.entries(input.overrides).filter(
        ([key, override]) => !isTravelNavigationOverride(key, override)
    );
    return Object.fromEntries(filteredEntries);
}

export function getNavigationOverridesForTenant(tenant: Record<string, unknown> | null): {
    activeBusinessContexts: string[];
    vocabularyProfile: TenantVocabularyProfileSpec;
    navigationOverrides: Record<string, NavOverrideSpec>;
} {
    const activeBusinessContexts = resolveBusinessContexts(tenant);
    const vocabularyProfile = resolveTenantVocabularyProfile({
        existing: tenant?.vocabularyProfile,
        businessType: tenant?.businessType,
        industry: tenant?.industry,
        activeBusinessContexts: activeBusinessContexts,
        businessContexts: tenant?.businessContexts,
        businessProfiles: tenant?.businessProfiles,
    });

    const mergedOverrides = {
        ...getDefaultNavOverridesForContexts(activeBusinessContexts),
        ...normalizeNavOverrides(vocabularyProfile.navOverrides),
        ...normalizeNavOverrides(tenant?.navOverrides),
    };
    const navigationOverrides = applyNavigationDomainPolicy({
        overrides: mergedOverrides,
        businessType: tenant?.businessType ?? vocabularyProfile.businessType,
        industry: tenant?.industry ?? vocabularyProfile.industry,
    });

    return {
        activeBusinessContexts,
        vocabularyProfile,
        navigationOverrides,
    };
}
