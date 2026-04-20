import type { Db } from 'mongodb';
import { createHash } from 'node:crypto';
import { getMasterDb, getSystemDb, getTenantDb } from '@/lib/db';
import type {
    CommunityBusinessIndexRecord,
    CommunityDiscoveryPageRecord,
    CommunityLeadIndexRecord,
    CommunityLocationFacet,
    CommunityProfile,
    CrawlIndexPolicy,
    DiscoveryFacetPolicy,
} from '@/lib/discovery-types';
import { normalizePublishingSlug } from '@/lib/publishing-governance';

const DEFAULT_DISCOVERY_FACET_POLICY: DiscoveryFacetPolicy = {
    key: 'default',
    enableLocationFacet: true,
    enableIndustryFacet: true,
    enableBusinessTypeFacet: true,
    enableTagFacet: true,
    enableCategoryFacet: true,
    minEntityCountForIndex: 2,
    maxPagesPerFacetType: 500,
};

const DEFAULT_CRAWL_INDEX_POLICY: CrawlIndexPolicy = {
    key: 'default',
    lowSignalNoindexThreshold: 2,
    includeNoindexInFeed: false,
    maxFeedItems: 3000,
};

const DEFAULT_RESERVED_TERMS = [
    'admin',
    'api',
    'auth',
    'claim',
    'catalog',
    'catalog-builder',
    'dashboard',
    'discover',
    'docs',
    'front-builder',
    'front-builder-v2',
    'help',
    'login',
    'proposal',
    'proposal-builder',
    'register',
    'root',
    'settings',
    'support',
    'www',
];

const DEFAULT_TAG_TAXONOMY = [
    { key: 'web-design', label: 'Web Design', category: 'service' },
    { key: 'ecommerce', label: 'Ecommerce', category: 'service' },
    { key: 'portfolio', label: 'Portfolio', category: 'business_type' },
    { key: 'landing-page', label: 'Landing Page', category: 'service' },
    { key: 'local-business', label: 'Local Business', category: 'industry' },
    { key: 'seo', label: 'SEO', category: 'service' },
    { key: 'fashion', label: 'Fashion', category: 'industry' },
    { key: 'garments', label: 'Garments', category: 'industry' },
    { key: 'fitness', label: 'Fitness', category: 'industry' },
    { key: 'technology', label: 'Technology', category: 'industry' },
];

type DiscoveryEssentialsResult = {
    seededFacetPolicy: boolean;
    seededCrawlPolicy: boolean;
    reservedTermsInserted: number;
    tagTaxonomyInserted: number;
};

type CommunityProfileBackfillResult = {
    checked: number;
    updated: number;
    skipped: number;
    updatedTenantKeys: string[];
};

type TenantRecord = Record<string, unknown>;

function normalizeText(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (typeof first === 'string') return first.trim();
        if (typeof first === 'object' && first !== null) {
            const raw = first as Record<string, unknown>;
            return typeof raw.name === 'string'
                ? raw.name
                : typeof raw.key === 'string'
                    ? raw.key
                    : typeof raw.businessType === 'string'
                        ? raw.businessType
                        : '';
        }
    }
    if (typeof value === 'object' && value !== null) {
        const raw = value as Record<string, unknown>;
        return typeof raw.name === 'string'
            ? raw.name
            : typeof raw.key === 'string'
                ? raw.key
                : typeof raw.businessType === 'string'
                    ? raw.businessType
                    : '';
    }
    return '';
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean);
}

export function normalizeDiscoverySlug(value: string): string {
    return normalizePublishingSlug(value || '');
}

function dedupe(values: string[]): string[] {
    return [...new Set(values)];
}

function normalizeTagList(value: unknown): string[] {
    return dedupe(
        asStringArray(value)
            .map((item) => normalizeDiscoverySlug(item))
            .filter(Boolean)
    );
}

function tokenizeForTags(value: string): string[] {
    return value
        .split(/[\s,|/]+/)
        .map((item) => normalizeDiscoverySlug(item))
        .filter((item) => item.length >= 2);
}

function sanitizeKeyword(value: string): string {
    return value.trim().toLowerCase();
}

function toSafeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskPhoneLast4(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return digits.slice(-4);
}

function hashValue(value: string): string {
    if (!value) return '';
    return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function normalizePublicMediaUrl(value: unknown): string {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed || trimmed.length > 2048) return '';

    // Accept site-relative URLs for in-host rendering and absolute http(s) URLs for feeds/cards.
    if (trimmed.startsWith('/')) {
        if (trimmed.startsWith('//')) return '';
        return trimmed;
    }

    try {
        const parsed = new URL(trimmed);
        if (!['http:', 'https:'].includes(parsed.protocol)) return '';
        const host = parsed.hostname.trim().toLowerCase();
        if (!host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return '';
        return parsed.toString();
    } catch {
        return '';
    }
}

function extractUrlsFromUnknown(value: unknown): string[] {
    if (!value) return [];
    if (typeof value === 'string') {
        const normalized = normalizePublicMediaUrl(value);
        return normalized ? [normalized] : [];
    }
    if (Array.isArray(value)) {
        return value.flatMap((item) => extractUrlsFromUnknown(item));
    }
    if (typeof value === 'object') {
        const row = value as Record<string, unknown>;
        return dedupe([
            ...extractUrlsFromUnknown(row.url),
            ...extractUrlsFromUnknown(row.src),
            ...extractUrlsFromUnknown(row.image),
            ...extractUrlsFromUnknown(row.thumbnail),
            ...extractUrlsFromUnknown(row.thumbnailUrl),
            ...extractUrlsFromUnknown(row.coverImage),
            ...extractUrlsFromUnknown(row.coverImageUrl),
            ...extractUrlsFromUnknown(row.heroImage),
            ...extractUrlsFromUnknown(row.heroImageUrl),
            ...extractUrlsFromUnknown(row.logo),
            ...extractUrlsFromUnknown(row.logoUrl),
            ...extractUrlsFromUnknown(row.images),
            ...extractUrlsFromUnknown(row.gallery),
            ...extractUrlsFromUnknown(row.media),
        ]);
    }
    return [];
}

function pickFirstPublicMediaUrl(candidates: unknown[]): string {
    for (const candidate of candidates) {
        const urls = extractUrlsFromUnknown(candidate);
        if (urls.length > 0) return urls[0];
    }
    return '';
}

function normalizeLocationFacet(value: unknown): CommunityLocationFacet | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const row = value as Record<string, unknown>;
    const country = normalizeText(row.country);
    const state = normalizeText(row.state);
    const city = normalizeText(row.city);
    if (!country && !state && !city) return null;
    const countrySlug = normalizeDiscoverySlug(country || 'global') || 'global';
    const stateSlug = normalizeDiscoverySlug(state || 'all-states') || 'all-states';
    const citySlug = normalizeDiscoverySlug(city || 'all-cities') || 'all-cities';
    return {
        country: country || 'Global',
        state: state || 'All States',
        city: city || 'All Cities',
        countrySlug,
        stateSlug,
        citySlug,
    };
}

function deriveLocationTagCandidates(locations: CommunityLocationFacet[], preferredCity: string): string[] {
    const placeholderCityTags = new Set(['all-cities', 'global', 'city']);
    const fromLocations = locations
        .map((location) => normalizeDiscoverySlug(location.citySlug || location.city))
        .filter((value) => value && !placeholderCityTags.has(value));
    const preferredCitySlug = normalizeDiscoverySlug(preferredCity);
    return dedupe([...fromLocations, preferredCitySlug].filter((value) => value && !placeholderCityTags.has(value)));
}

function deriveLocationKeywordCandidates(locations: CommunityLocationFacet[], preferredCity: string): string[] {
    const placeholderKeywords = new Set(['all cities', 'global', 'city']);
    const cityKeywords = locations
        .map((location) => sanitizeKeyword(location.city || ''))
        .filter((value) => value && !placeholderKeywords.has(value));
    const preferredKeyword = sanitizeKeyword(preferredCity || '');
    return dedupe([...cityKeywords, preferredKeyword].filter((value) => value && !placeholderKeywords.has(value)));
}

export function buildDefaultCommunityProfile(input: {
    industry?: string;
    businessType?: string;
}): CommunityProfile {
    return {
        shortBio: '',
        industry: normalizeText(input.industry) || '',
        businessType: normalizeText(input.businessType) || '',
        preferredCity: '',
        serviceLocations: [],
        discoveryTags: [],
        categories: [],
        searchKeywords: [],
        isDiscoveryEnabled: true,
    };
}

export function normalizeCommunityProfile(
    input: unknown,
    fallback?: { industry?: string; businessType?: string }
): CommunityProfile {
    const defaults = buildDefaultCommunityProfile(fallback || {});
    if (!input || typeof input !== 'object' || Array.isArray(input)) return defaults;
    const row = input as Record<string, unknown>;
    const parsedLocations = Array.isArray(row.serviceLocations)
        ? row.serviceLocations.map(normalizeLocationFacet).filter((item): item is CommunityLocationFacet => Boolean(item))
        : [];
    const preferredCityFromInput = normalizeText(row.preferredCity);
    const preferredCity = preferredCityFromInput || normalizeText(parsedLocations[0]?.city);
    const fallbackPreferredLocation = preferredCity
        ? normalizeLocationFacet({ city: preferredCity })
        : null;
    const locations = parsedLocations.length > 0
        ? parsedLocations
        : (fallbackPreferredLocation ? [fallbackPreferredLocation] : []);
    const locationTags = deriveLocationTagCandidates(locations, preferredCity);
    const locationKeywords = deriveLocationKeywordCandidates(locations, preferredCity);

    return {
        shortBio: normalizeText(row.shortBio),
        industry: normalizeText(row.industry) || defaults.industry,
        businessType: normalizeText(row.businessType) || defaults.businessType,
        preferredCity,
        serviceLocations: locations,
        discoveryTags: dedupe([...normalizeTagList(row.discoveryTags), ...locationTags]).slice(0, 24),
        categories: normalizeTagList(row.categories),
        searchKeywords: dedupe(
            [
                ...asStringArray(row.searchKeywords),
                ...locationKeywords,
            ]
                .map((item) => normalizeText(item).toLowerCase())
                .filter(Boolean)
        ).slice(0, 40),
        isDiscoveryEnabled: row.isDiscoveryEnabled !== false,
    };
}

function resolvePublicProfile(tenant: TenantRecord) {
    const publicProfile = tenant.publicProfile && typeof tenant.publicProfile === 'object'
        ? tenant.publicProfile as Record<string, unknown>
        : {};
    const name = normalizeText(tenant.name) || normalizeText(tenant.key) || 'Business';
    const businessSlug = normalizeDiscoverySlug(
        normalizeText(publicProfile.slug) || normalizeText(tenant.key) || name
    ) || 'business';
    const visibility = normalizeText(publicProfile.visibility) === 'private' ? 'private' : 'public';
    const claimStatus = normalizeText(publicProfile.claimStatus) || normalizeText(tenant.claimStatus) || 'free_unclaimed';

    return {
        businessSlug,
        visibility,
        claimStatus,
        subdomain: normalizeDiscoverySlug(normalizeText(publicProfile.subdomain)),
        headline: normalizeText(publicProfile.headline) || name,
        summary: normalizeText(publicProfile.summary) || `${name} public business profile`,
        seoTitle: normalizeText(publicProfile.seoTitle) || `${name} | Business Profile`,
        seoDescription: normalizeText(publicProfile.seoDescription) || `${name} public profile and offerings.`,
        heroImageUrl: pickFirstPublicMediaUrl([
            publicProfile.heroImage,
            publicProfile.heroImageUrl,
        ]),
        coverImageUrl: pickFirstPublicMediaUrl([
            publicProfile.coverImage,
            publicProfile.coverImageUrl,
        ]),
        logoUrl: pickFirstPublicMediaUrl([
            publicProfile.logo,
            publicProfile.logoUrl,
        ]),
        thumbnailUrl: pickFirstPublicMediaUrl([
            publicProfile.thumbnail,
            publicProfile.thumbnailUrl,
            publicProfile.coverImage,
            publicProfile.coverImageUrl,
            publicProfile.heroImage,
            publicProfile.heroImageUrl,
            publicProfile.logo,
            publicProfile.logoUrl,
        ]),
    };
}

function resolvePublicVisibility(tenant: TenantRecord, profile: ReturnType<typeof resolvePublicProfile>): boolean {
    const lifecycleStatus = normalizeText(tenant.lifecycleStatus).toLowerCase();
    if (profile.visibility === 'private') return false;
    if (profile.claimStatus === 'claimed_inactive') return false;
    if (lifecycleStatus === 'suspended' || lifecycleStatus === 'archived') return false;
    return true;
}

async function resolveTenantContentSignals(tenantKey: string) {
    const tenantDb = await getTenantDb(tenantKey);
    const [publishedPages, publishedCategories, productDocs, travelPackageDocs, portfolioDocs, categoryDocs] = await Promise.all([
        tenantDb.collection('pages').countDocuments({ status: 'published' }),
        tenantDb.collection('categories').countDocuments({ 'page.status': 'published' }),
        tenantDb.collection('products').find(
            { status: { $ne: 'archived' } },
            { projection: { tags: 1, image: 1, thumbnail: 1, images: 1, gallery: 1 } }
        ).toArray(),
        tenantDb.collection('travel_packages').find(
            { status: { $ne: 'draft' } },
            { projection: { tags: 1, image: 1, thumbnail: 1, images: 1, gallery: 1 } }
        ).toArray(),
        tenantDb.collection('portfolio_items').find(
            { status: { $ne: 'archived' } },
            { projection: { image: 1, thumbnail: 1, coverImage: 1, images: 1, gallery: 1 } }
        ).toArray(),
        tenantDb.collection('categories').find(
            { 'page.status': 'published' },
            { projection: { slug: 1, name: 1 } }
        ).toArray(),
    ]);

    const rawTags = [
        ...productDocs.flatMap((item) => {
            if (Array.isArray(item.tags)) return item.tags.filter((tag): tag is string => typeof tag === 'string');
            if (typeof item.tags === 'string') return item.tags.split(',').map((entry) => entry.trim()).filter(Boolean);
            return [];
        }),
        ...travelPackageDocs.flatMap((item) => {
            if (Array.isArray(item.tags)) return item.tags.filter((tag): tag is string => typeof tag === 'string');
            if (typeof item.tags === 'string') return item.tags.split(',').map((entry) => entry.trim()).filter(Boolean);
            return [];
        }),
    ];

    const categorySlugs = dedupe(categoryDocs
        .map((item) => normalizeDiscoverySlug(normalizeText(item.slug) || normalizeText(item.name)))
        .filter(Boolean));

    const productMediaCandidates = dedupe([
        ...productDocs.flatMap((item) => extractUrlsFromUnknown(item)),
        ...travelPackageDocs.flatMap((item) => extractUrlsFromUnknown(item)),
    ]);
    const portfolioMediaCandidates = dedupe(portfolioDocs.flatMap((item) => extractUrlsFromUnknown(item)));
    const mediaCandidates = dedupe([...productMediaCandidates, ...portfolioMediaCandidates]);
    const thumbnailUrl = pickFirstPublicMediaUrl([
        productMediaCandidates,
        portfolioMediaCandidates,
        mediaCandidates,
    ]);
    const heroImageUrl = pickFirstPublicMediaUrl([
        portfolioMediaCandidates,
        productMediaCandidates,
        mediaCandidates,
    ]);

    return {
        publishedPages,
        publishedCategories,
        productCount: productDocs.length + travelPackageDocs.length,
        portfolioCount: portfolioDocs.length,
        categorySlugs,
        tags: normalizeTagList(rawTags),
        media: {
            thumbnailUrl,
            heroImageUrl,
            productMediaUrl: pickFirstPublicMediaUrl([productMediaCandidates]),
            portfolioMediaUrl: pickFirstPublicMediaUrl([portfolioMediaCandidates]),
        },
    };
}

function toQualityTier(score: number): 'low' | 'medium' | 'high' {
    if (score >= 14) return 'high';
    if (score >= 6) return 'medium';
    return 'low';
}

function sliceTopEntries<T extends { count: number }>(entries: T[], limit: number): T[] {
    if (entries.length <= limit) return entries;
    return entries
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

export async function ensureDiscoveryIndexes(masterDbInput?: Db): Promise<void> {
    const masterDb = masterDbInput || await getMasterDb();
    await Promise.all([
        masterDb.collection('community_business_index').createIndex({ tenantKey: 1 }, { unique: true, name: 'uniq_tenant_key' }),
        masterDb.collection('community_business_index').createIndex({ businessSlug: 1 }, { unique: true, name: 'uniq_business_slug' }),
        masterDb.collection('community_business_index').createIndex({ 'facets.industry': 1, 'publishSignals.isPublished': 1 }, { name: 'facet_industry_idx' }),
        masterDb.collection('community_business_index').createIndex({ 'facets.businessType': 1, 'publishSignals.isPublished': 1 }, { name: 'facet_business_type_idx' }),
        masterDb.collection('community_business_index').createIndex({ 'facets.tags': 1, 'publishSignals.isPublished': 1 }, { name: 'facet_tags_idx' }),
        masterDb.collection('community_business_index').createIndex({ 'facets.categories': 1, 'publishSignals.isPublished': 1 }, { name: 'facet_categories_idx' }),
        masterDb.collection('community_discovery_pages').createIndex({ routePath: 1 }, { unique: true, name: 'uniq_route_path' }),
        masterDb.collection('community_discovery_pages').createIndex({ pageType: 1, isIndexable: 1 }, { name: 'page_type_indexable_idx' }),
        masterDb.collection('community_lead_index').createIndex({ tenantKey: 1, leadId: 1 }, { unique: true, name: 'uniq_lead_per_tenant' }),
        masterDb.collection('community_lead_index').createIndex({ createdAt: -1 }, { name: 'lead_created_at_idx' }),
        masterDb.collection('subdomain_reservations').createIndex({ subdomain: 1 }, { unique: true, name: 'uniq_subdomain' }),
        masterDb.collection('discovery_generation_runs').createIndex({ createdAt: -1 }, { name: 'run_created_at_idx' }),
    ]);
}

export async function loadDiscoveryFacetPolicy(systemDbInput?: Db): Promise<DiscoveryFacetPolicy> {
    const systemDb = systemDbInput || await getSystemDb();
    const doc = await systemDb.collection('discovery_facet_policies').findOne({ key: 'default' }) as Record<string, unknown> | null;
    return {
        ...DEFAULT_DISCOVERY_FACET_POLICY,
        ...(doc || {}),
        key: 'default',
        enableLocationFacet: doc?.enableLocationFacet !== false,
        enableIndustryFacet: doc?.enableIndustryFacet !== false,
        enableBusinessTypeFacet: doc?.enableBusinessTypeFacet !== false,
        enableTagFacet: doc?.enableTagFacet !== false,
        enableCategoryFacet: doc?.enableCategoryFacet !== false,
        minEntityCountForIndex: typeof doc?.minEntityCountForIndex === 'number'
            ? Math.max(1, Math.floor(doc.minEntityCountForIndex))
            : DEFAULT_DISCOVERY_FACET_POLICY.minEntityCountForIndex,
        maxPagesPerFacetType: typeof doc?.maxPagesPerFacetType === 'number'
            ? Math.max(10, Math.floor(doc.maxPagesPerFacetType))
            : DEFAULT_DISCOVERY_FACET_POLICY.maxPagesPerFacetType,
    };
}

export async function loadCrawlIndexPolicy(systemDbInput?: Db): Promise<CrawlIndexPolicy> {
    const systemDb = systemDbInput || await getSystemDb();
    const doc = await systemDb.collection('crawl_index_policies').findOne({ key: 'default' }) as Record<string, unknown> | null;
    return {
        ...DEFAULT_CRAWL_INDEX_POLICY,
        ...(doc || {}),
        key: 'default',
        lowSignalNoindexThreshold: typeof doc?.lowSignalNoindexThreshold === 'number'
            ? Math.max(1, Math.floor(doc.lowSignalNoindexThreshold))
            : DEFAULT_CRAWL_INDEX_POLICY.lowSignalNoindexThreshold,
        includeNoindexInFeed: doc?.includeNoindexInFeed === true,
        maxFeedItems: typeof doc?.maxFeedItems === 'number'
            ? Math.max(100, Math.floor(doc.maxFeedItems))
            : DEFAULT_CRAWL_INDEX_POLICY.maxFeedItems,
    };
}

export async function seedDiscoveryEssentials(options?: {
    systemDb?: Db;
    requestedBy?: string;
}): Promise<DiscoveryEssentialsResult> {
    const systemDb = options?.systemDb || await getSystemDb();
    const now = new Date();
    const actor = normalizeText(options?.requestedBy) || 'system';
    let seededFacetPolicy = false;
    let seededCrawlPolicy = false;
    let reservedTermsInserted = 0;
    let tagTaxonomyInserted = 0;

    const facetExisting = await systemDb.collection('discovery_facet_policies').findOne({ key: 'default' });
    if (!facetExisting) {
        await systemDb.collection('discovery_facet_policies').insertOne({
            ...DEFAULT_DISCOVERY_FACET_POLICY,
            key: 'default',
            createdAt: now,
            createdBy: actor,
            updatedAt: now,
            updatedBy: actor,
        });
        seededFacetPolicy = true;
    }

    const crawlExisting = await systemDb.collection('crawl_index_policies').findOne({ key: 'default' });
    if (!crawlExisting) {
        await systemDb.collection('crawl_index_policies').insertOne({
            ...DEFAULT_CRAWL_INDEX_POLICY,
            key: 'default',
            createdAt: now,
            createdBy: actor,
            updatedAt: now,
            updatedBy: actor,
        });
        seededCrawlPolicy = true;
    }

    const existingReservedTerms = new Set(
        (await systemDb.collection('reserved_terms')
            .find({}, { projection: { term: 1 } })
            .toArray())
            .map((row) => normalizeDiscoverySlug(normalizeText(row.term)))
            .filter(Boolean)
    );

    const reservedRows = DEFAULT_RESERVED_TERMS
        .map((term) => normalizeDiscoverySlug(term))
        .filter(Boolean)
        .filter((term) => !existingReservedTerms.has(term))
        .map((term) => ({
            key: `reserved_${term}`,
            term,
            scope: 'slug',
            source: 'discovery_seed',
            active: true,
            createdAt: now,
            createdBy: actor,
            updatedAt: now,
            updatedBy: actor,
        }));

    if (reservedRows.length > 0) {
        const result = await systemDb.collection('reserved_terms').bulkWrite(
            reservedRows.map((row) => ({
                updateOne: {
                    filter: { key: row.key },
                    update: { $setOnInsert: row },
                    upsert: true,
                },
            }))
        );
        reservedTermsInserted = result.upsertedCount;
    }

    const existingTagKeys = new Set(
        (await systemDb.collection('tag_taxonomy')
            .find({}, { projection: { key: 1 } })
            .toArray())
            .map((row) => normalizeDiscoverySlug(normalizeText(row.key)))
            .filter(Boolean)
    );

    const tagRows = DEFAULT_TAG_TAXONOMY
        .map((row) => ({
            key: normalizeDiscoverySlug(row.key),
            label: normalizeText(row.label),
            category: normalizeDiscoverySlug(row.category) || 'general',
        }))
        .filter((row) => row.key && row.label)
        .filter((row) => !existingTagKeys.has(row.key))
        .map((row) => ({
            ...row,
            description: '',
            active: true,
            source: 'discovery_seed',
            createdAt: now,
            createdBy: actor,
            updatedAt: now,
            updatedBy: actor,
        }));

    if (tagRows.length > 0) {
        const result = await systemDb.collection('tag_taxonomy').bulkWrite(
            tagRows.map((row) => ({
                updateOne: {
                    filter: { key: row.key },
                    update: { $setOnInsert: row },
                    upsert: true,
                },
            }))
        );
        tagTaxonomyInserted = result.upsertedCount;
    }

    return {
        seededFacetPolicy,
        seededCrawlPolicy,
        reservedTermsInserted,
        tagTaxonomyInserted,
    };
}

export async function backfillTenantCommunityProfiles(options?: {
    tenantKeys?: string[];
    masterDb?: Db;
    onlyMissing?: boolean;
}): Promise<CommunityProfileBackfillResult> {
    const masterDb = options?.masterDb || await getMasterDb();
    const now = new Date();
    const onlyMissing = options?.onlyMissing !== false;
    const requestedTenantKeys = dedupe((options?.tenantKeys || []).map((key) => normalizeText(key)).filter(Boolean));
    const tenantFilter = requestedTenantKeys.length > 0
        ? { key: { $in: requestedTenantKeys } }
        : {};

    const tenants = await masterDb.collection('tenants').find(
        tenantFilter,
        {
            projection: {
                key: 1,
                name: 1,
                industry: 1,
                businessType: 1,
                communityProfile: 1,
            },
        }
    ).toArray() as TenantRecord[];

    let checked = 0;
    let updated = 0;
    let skipped = 0;
    const updatedTenantKeys: string[] = [];

    for (const tenant of tenants) {
        const tenantKey = normalizeText(tenant.key);
        if (!tenantKey) continue;
        checked += 1;

        const industry = normalizeText(tenant.industry);
        const businessType = normalizeText(tenant.businessType);
        const name = normalizeText(tenant.name) || tenantKey;
        const current = normalizeCommunityProfile(tenant.communityProfile, { industry, businessType });
        const contentSignals = await resolveTenantContentSignals(tenantKey);
        const locationTagCandidates = deriveLocationTagCandidates(current.serviceLocations, current.preferredCity);
        const locationKeywordCandidates = deriveLocationKeywordCandidates(current.serviceLocations, current.preferredCity);

        const derivedTagCandidates = dedupe([
            ...contentSignals.tags,
            normalizeDiscoverySlug(industry),
            ...tokenizeForTags(industry),
            normalizeDiscoverySlug(businessType),
            ...tokenizeForTags(businessType),
            ...tokenizeForTags(name),
            ...locationTagCandidates,
        ]).filter(Boolean);

        const derivedKeywords = dedupe([
            sanitizeKeyword(name),
            sanitizeKeyword(industry),
            sanitizeKeyword(businessType),
            ...derivedTagCandidates.map((tag) => sanitizeKeyword(tag.replace(/-/g, ' '))),
            ...locationKeywordCandidates,
        ]).filter(Boolean);

        const next = {
            ...current,
            industry: current.industry || industry,
            businessType: current.businessType || businessType,
            preferredCity: current.preferredCity || normalizeText(current.serviceLocations[0]?.city),
            discoveryTags: onlyMissing
                ? (current.discoveryTags.length > 0 ? current.discoveryTags : derivedTagCandidates.slice(0, 24))
                : dedupe([...current.discoveryTags, ...derivedTagCandidates]).slice(0, 24),
            categories: onlyMissing
                ? (current.categories.length > 0 ? current.categories : contentSignals.categorySlugs.slice(0, 30))
                : dedupe([...current.categories, ...contentSignals.categorySlugs]).slice(0, 30),
            searchKeywords: onlyMissing
                ? (current.searchKeywords.length > 0 ? current.searchKeywords : derivedKeywords.slice(0, 40))
                : dedupe([...current.searchKeywords, ...derivedKeywords]).slice(0, 40),
            isDiscoveryEnabled: current.isDiscoveryEnabled !== false,
        };

        if (JSON.stringify(current) === JSON.stringify(next)) {
            skipped += 1;
            continue;
        }

        await masterDb.collection('tenants').updateOne(
            { key: tenantKey },
            {
                $set: {
                    communityProfile: next,
                    updatedAt: now,
                },
            }
        );
        updated += 1;
        updatedTenantKeys.push(tenantKey);
    }

    return {
        checked,
        updated,
        skipped,
        updatedTenantKeys,
    };
}

export async function upsertCommunityBusinessIndex(
    tenantKey: string,
    options?: { masterDb?: Db }
): Promise<CommunityBusinessIndexRecord | null> {
    if (!tenantKey) return null;
    const masterDb = options?.masterDb || await getMasterDb();
    const tenant = await masterDb.collection('tenants').findOne(
        { key: tenantKey },
        {
            projection: {
                key: 1,
                name: 1,
                industry: 1,
                businessType: 1,
                claimStatus: 1,
                lifecycleStatus: 1,
                publicProfile: 1,
                communityProfile: 1,
                updatedAt: 1,
            },
        }
    ) as TenantRecord | null;

    if (!tenant) return null;

    const publicProfile = resolvePublicProfile(tenant);
    const fallbackCommunity = normalizeCommunityProfile(tenant.communityProfile, {
        industry: normalizeText(tenant.industry),
        businessType: normalizeText(tenant.businessType),
    });
    const content = await resolveTenantContentSignals(tenantKey);
    const isVisible = resolvePublicVisibility(tenant, publicProfile);
    const isPublished = isVisible && fallbackCommunity.isDiscoveryEnabled;
    const contentScore = content.publishedPages + content.publishedCategories + content.productCount + content.portfolioCount + fallbackCommunity.discoveryTags.length;

    const locationTagSet = deriveLocationTagCandidates(fallbackCommunity.serviceLocations, fallbackCommunity.preferredCity);
    const tagSet = dedupe([...locationTagSet, ...fallbackCommunity.discoveryTags, ...content.tags]).filter(Boolean);
    const categorySet = dedupe([...fallbackCommunity.categories, ...content.categorySlugs]).filter(Boolean);
    const heroImageUrl = pickFirstPublicMediaUrl([
        publicProfile.heroImageUrl,
        publicProfile.coverImageUrl,
        content.media.heroImageUrl,
        content.media.portfolioMediaUrl,
        content.media.productMediaUrl,
    ]);
    const thumbnailUrl = pickFirstPublicMediaUrl([
        publicProfile.thumbnailUrl,
        publicProfile.logoUrl,
        publicProfile.coverImageUrl,
        publicProfile.heroImageUrl,
        content.media.thumbnailUrl,
        content.media.productMediaUrl,
        content.media.portfolioMediaUrl,
    ]);
    const logoUrl = pickFirstPublicMediaUrl([publicProfile.logoUrl]);
    const coverImageUrl = pickFirstPublicMediaUrl([
        publicProfile.coverImageUrl,
        publicProfile.heroImageUrl,
        content.media.heroImageUrl,
    ]);
    const now = new Date();

    const record: CommunityBusinessIndexRecord = {
        tenantKey,
        businessSlug: publicProfile.businessSlug,
        canonicalPath: `/${publicProfile.businessSlug}`,
        legacyBusinessPath: `/business/${publicProfile.businessSlug}`,
        reservedSubdomain: publicProfile.subdomain || publicProfile.businessSlug,
        identity: {
            name: normalizeText(tenant.name) || tenantKey,
            headline: publicProfile.headline,
            summary: fallbackCommunity.shortBio || publicProfile.summary,
            heroImageUrl,
            coverImageUrl,
            logoUrl,
            thumbnailUrl,
        },
        thumbnailUrl,
        facets: {
            industry: normalizeDiscoverySlug(fallbackCommunity.industry || normalizeText(tenant.industry)),
            industryLabel: fallbackCommunity.industry || normalizeText(tenant.industry) || 'General',
            businessType: normalizeDiscoverySlug(fallbackCommunity.businessType || normalizeText(tenant.businessType)),
            businessTypeLabel: fallbackCommunity.businessType || normalizeText(tenant.businessType) || 'Business',
            locations: fallbackCommunity.serviceLocations,
            tags: tagSet,
            categories: categorySet,
        },
        publishSignals: {
            isPublished,
            publishedPages: content.publishedPages,
            publishedCategories: content.publishedCategories,
            productCount: content.productCount,
            portfolioCount: content.portfolioCount,
            contentScore,
            qualityTier: toQualityTier(contentScore),
        },
        seo: {
            title: publicProfile.seoTitle,
            description: publicProfile.seoDescription,
            robots: isPublished ? 'index,follow' : 'noindex,nofollow',
            lastmod: (tenant.updatedAt instanceof Date ? tenant.updatedAt : now),
        },
        updatedAt: now,
        createdAt: now,
    };
    const { createdAt: businessCreatedAt, ...businessUpsertRecord } = record;

    await masterDb.collection('community_business_index').updateOne(
        { tenantKey },
        {
            $set: {
                ...businessUpsertRecord,
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: businessCreatedAt,
            },
        },
        { upsert: true }
    );

    const reservation = record.reservedSubdomain || record.businessSlug;
    if (reservation) {
        const existingReservation = await masterDb.collection('subdomain_reservations').findOne(
            { subdomain: reservation },
            { projection: { tenantKey: 1 } }
        ) as Record<string, unknown> | null;
        const existingTenantKey = normalizeText(existingReservation?.tenantKey);
        if (!existingTenantKey || existingTenantKey === tenantKey) {
            await masterDb.collection('subdomain_reservations').updateOne(
                { subdomain: reservation },
                {
                    $set: {
                        subdomain: reservation,
                        tenantKey,
                        targetCanonicalPath: record.canonicalPath,
                        mode: 'reserve_redirect',
                        status: 'reserved',
                        updatedAt: now,
                    },
                    $setOnInsert: {
                        createdAt: now,
                    },
                },
                { upsert: true }
            );
        }
    }

    return record;
}

export async function rebuildCommunityDiscoveryPages(options?: { masterDb?: Db; systemDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    const systemDb = options?.systemDb || await getSystemDb();
    const [facetPolicy, crawlPolicy] = await Promise.all([
        loadDiscoveryFacetPolicy(systemDb),
        loadCrawlIndexPolicy(systemDb),
    ]);

    const businesses = await masterDb.collection('community_business_index').find(
        { 'publishSignals.isPublished': true },
        {
            projection: {
                businessSlug: 1,
                identity: 1,
                facets: 1,
                publishSignals: 1,
                seo: 1,
                updatedAt: 1,
            },
        }
    ).toArray() as Array<Record<string, unknown>>;

    const locationMap = new Map<string, { label: string; count: number; slugs: Set<string> }>();
    const industryMap = new Map<string, { label: string; count: number; slugs: Set<string> }>();
    const businessTypeMap = new Map<string, { label: string; count: number; slugs: Set<string> }>();
    const tagMap = new Map<string, { label: string; count: number; slugs: Set<string> }>();
    const categoryMap = new Map<string, { label: string; count: number; slugs: Set<string> }>();

    for (const row of businesses) {
        const businessSlug = normalizeText(row.businessSlug);
        if (!businessSlug) continue;
        const facets = row.facets && typeof row.facets === 'object' ? row.facets as Record<string, unknown> : {};
        const locations = Array.isArray(facets.locations) ? facets.locations : [];

        if (facetPolicy.enableLocationFacet) {
            for (const location of locations) {
                const normalized = normalizeLocationFacet(location);
                if (!normalized) continue;
                const key = `${normalized.countrySlug}/${normalized.stateSlug}/${normalized.citySlug}`;
                const label = `${normalized.city}, ${normalized.state}, ${normalized.country}`;
                const entry = locationMap.get(key) || { label, count: 0, slugs: new Set<string>() };
                entry.count += 1;
                entry.slugs.add(businessSlug);
                locationMap.set(key, entry);
            }
        }

        if (facetPolicy.enableIndustryFacet) {
            const industrySlug = normalizeDiscoverySlug(normalizeText(facets.industry));
            if (industrySlug) {
                const label = normalizeText(facets.industryLabel) || industrySlug;
                const entry = industryMap.get(industrySlug) || { label, count: 0, slugs: new Set<string>() };
                entry.count += 1;
                entry.slugs.add(businessSlug);
                industryMap.set(industrySlug, entry);
            }
        }

        if (facetPolicy.enableBusinessTypeFacet) {
            const businessTypeSlug = normalizeDiscoverySlug(normalizeText(facets.businessType));
            if (businessTypeSlug) {
                const label = normalizeText(facets.businessTypeLabel) || businessTypeSlug;
                const entry = businessTypeMap.get(businessTypeSlug) || { label, count: 0, slugs: new Set<string>() };
                entry.count += 1;
                entry.slugs.add(businessSlug);
                businessTypeMap.set(businessTypeSlug, entry);
            }
        }

        if (facetPolicy.enableTagFacet) {
            for (const tag of normalizeTagList(facets.tags)) {
                const entry = tagMap.get(tag) || { label: tag, count: 0, slugs: new Set<string>() };
                entry.count += 1;
                entry.slugs.add(businessSlug);
                tagMap.set(tag, entry);
            }
        }

        if (facetPolicy.enableCategoryFacet) {
            for (const category of normalizeTagList(facets.categories)) {
                const entry = categoryMap.get(category) || { label: category, count: 0, slugs: new Set<string>() };
                entry.count += 1;
                entry.slugs.add(businessSlug);
                categoryMap.set(category, entry);
            }
        }
    }

    const now = new Date();
    const policyVersion = `facet:${facetPolicy.minEntityCountForIndex}-${facetPolicy.maxPagesPerFacetType}|crawl:${crawlPolicy.lowSignalNoindexThreshold}`;
    const indexThreshold = Math.max(facetPolicy.minEntityCountForIndex, crawlPolicy.lowSignalNoindexThreshold);

    const rows: CommunityDiscoveryPageRecord[] = [];
    rows.push({
        pageType: 'home',
        routePath: '/discover',
        facetKey: 'root',
        facetValue: 'all',
        entityCount: businesses.length,
        businessSlugs: businesses
            .map((row) => normalizeText(row.businessSlug))
            .filter(Boolean)
            .slice(0, 200),
        isIndexable: true,
        seo: {
            title: 'Discover Businesses | KalpTree',
            description: 'Explore businesses by location, industry, business type, and tags on KalpTree.',
            canonicalUrl: '/discover',
            robots: 'index,follow',
        },
        generatedFromPolicyVersion: policyVersion,
        generatedAt: now,
        updatedAt: now,
        createdAt: now,
    });

    rows.push({
        pageType: 'search_seed',
        routePath: '/discover/search',
        facetKey: 'search',
        facetValue: 'seed',
        entityCount: businesses.length,
        businessSlugs: [],
        isIndexable: true,
        seo: {
            title: 'Search Businesses | KalpTree Discovery',
            description: 'Search KalpTree businesses with filters for location, industry, business type, tags, and categories.',
            canonicalUrl: '/discover/search',
            robots: 'index,follow',
        },
        generatedFromPolicyVersion: policyVersion,
        generatedAt: now,
        updatedAt: now,
        createdAt: now,
    });

    const locationEntries = sliceTopEntries(
        Array.from(locationMap.entries()).map(([key, value]) => ({ key, ...value })),
        facetPolicy.maxPagesPerFacetType
    );
    for (const entry of locationEntries) {
        const routePath = `/discover/location/${entry.key}`;
        const isIndexable = entry.count >= indexThreshold;
        rows.push({
            pageType: 'location',
            routePath,
            facetKey: 'location',
            facetValue: entry.key,
            entityCount: entry.count,
            businessSlugs: Array.from(entry.slugs).slice(0, 200),
            isIndexable,
            seo: {
                title: `${entry.label} Businesses | KalpTree Discovery`,
                description: `Explore ${entry.label} businesses published on KalpTree.`,
                canonicalUrl: routePath,
                robots: isIndexable ? 'index,follow' : 'noindex,follow',
            },
            generatedFromPolicyVersion: policyVersion,
            generatedAt: now,
            updatedAt: now,
            createdAt: now,
        });
    }

    const industryEntries = sliceTopEntries(
        Array.from(industryMap.entries()).map(([key, value]) => ({ key, ...value })),
        facetPolicy.maxPagesPerFacetType
    );
    for (const entry of industryEntries) {
        const routePath = `/discover/industry/${entry.key}`;
        const isIndexable = entry.count >= indexThreshold;
        rows.push({
            pageType: 'industry',
            routePath,
            facetKey: 'industry',
            facetValue: entry.key,
            entityCount: entry.count,
            businessSlugs: Array.from(entry.slugs).slice(0, 200),
            isIndexable,
            seo: {
                title: `${entry.label} Businesses | KalpTree Discovery`,
                description: `Find businesses in ${entry.label} listed on KalpTree.`,
                canonicalUrl: routePath,
                robots: isIndexable ? 'index,follow' : 'noindex,follow',
            },
            generatedFromPolicyVersion: policyVersion,
            generatedAt: now,
            updatedAt: now,
            createdAt: now,
        });
    }

    const businessTypeEntries = sliceTopEntries(
        Array.from(businessTypeMap.entries()).map(([key, value]) => ({ key, ...value })),
        facetPolicy.maxPagesPerFacetType
    );
    for (const entry of businessTypeEntries) {
        const routePath = `/discover/business-type/${entry.key}`;
        const isIndexable = entry.count >= indexThreshold;
        rows.push({
            pageType: 'business_type',
            routePath,
            facetKey: 'business_type',
            facetValue: entry.key,
            entityCount: entry.count,
            businessSlugs: Array.from(entry.slugs).slice(0, 200),
            isIndexable,
            seo: {
                title: `${entry.label} Services | KalpTree Discovery`,
                description: `Browse ${entry.label} businesses on KalpTree.`,
                canonicalUrl: routePath,
                robots: isIndexable ? 'index,follow' : 'noindex,follow',
            },
            generatedFromPolicyVersion: policyVersion,
            generatedAt: now,
            updatedAt: now,
            createdAt: now,
        });
    }

    const tagEntries = sliceTopEntries(
        Array.from(tagMap.entries()).map(([key, value]) => ({ key, ...value })),
        facetPolicy.maxPagesPerFacetType
    );
    for (const entry of tagEntries) {
        const routePath = `/discover/tag/${entry.key}`;
        const isIndexable = entry.count >= indexThreshold;
        rows.push({
            pageType: 'tag',
            routePath,
            facetKey: 'tag',
            facetValue: entry.key,
            entityCount: entry.count,
            businessSlugs: Array.from(entry.slugs).slice(0, 200),
            isIndexable,
            seo: {
                title: `${entry.label} Businesses | KalpTree Discovery`,
                description: `Discover businesses tagged "${entry.label}" on KalpTree.`,
                canonicalUrl: routePath,
                robots: isIndexable ? 'index,follow' : 'noindex,follow',
            },
            generatedFromPolicyVersion: policyVersion,
            generatedAt: now,
            updatedAt: now,
            createdAt: now,
        });
    }

    const categoryEntries = sliceTopEntries(
        Array.from(categoryMap.entries()).map(([key, value]) => ({ key, ...value })),
        facetPolicy.maxPagesPerFacetType
    );
    for (const entry of categoryEntries) {
        const routePath = `/discover/category/${entry.key}`;
        const isIndexable = entry.count >= indexThreshold;
        rows.push({
            pageType: 'category',
            routePath,
            facetKey: 'category',
            facetValue: entry.key,
            entityCount: entry.count,
            businessSlugs: Array.from(entry.slugs).slice(0, 200),
            isIndexable,
            seo: {
                title: `${entry.label} Category Businesses | KalpTree Discovery`,
                description: `Discover businesses grouped under ${entry.label} on KalpTree.`,
                canonicalUrl: routePath,
                robots: isIndexable ? 'index,follow' : 'noindex,follow',
            },
            generatedFromPolicyVersion: policyVersion,
            generatedAt: now,
            updatedAt: now,
            createdAt: now,
        });
    }

    const col = masterDb.collection('community_discovery_pages');
    await col.deleteMany({});
    if (rows.length > 0) {
        await col.insertMany(rows);
    }

    return {
        totalPages: rows.length,
        indexablePages: rows.filter((row) => row.isIndexable).length,
        noindexPages: rows.filter((row) => !row.isIndexable).length,
        policy: {
            facetPolicy,
            crawlPolicy,
            indexThreshold,
        },
    };
}

export async function syncTenantDiscoveryProjection(
    tenantKey: string,
    options?: { masterDb?: Db; systemDb?: Db }
) {
    const masterDb = options?.masterDb || await getMasterDb();
    const systemDb = options?.systemDb || await getSystemDb();
    await ensureDiscoveryIndexes(masterDb);
    await upsertCommunityBusinessIndex(tenantKey, { masterDb });
    return rebuildCommunityDiscoveryPages({ masterDb, systemDb });
}

export async function regenerateCommunityDiscovery(options?: {
    syncBusinessIndex?: boolean;
    tenantKeys?: string[];
    populateEssentials?: boolean;
    backfillCommunityProfiles?: boolean;
    backfillOnlyMissing?: boolean;
    masterDb?: Db;
    systemDb?: Db;
    requestedBy?: string;
    trigger?: 'manual' | 'nightly_reconcile' | 'publish_event';
}) {
    const masterDb = options?.masterDb || await getMasterDb();
    const systemDb = options?.systemDb || await getSystemDb();
    await ensureDiscoveryIndexes(masterDb);

    const essentials = options?.populateEssentials
        ? await seedDiscoveryEssentials({ systemDb, requestedBy: options?.requestedBy })
        : null;

    let tenantKeys = options?.tenantKeys || [];
    const profileBackfill = options?.backfillCommunityProfiles
        ? await backfillTenantCommunityProfiles({
            tenantKeys,
            masterDb,
            onlyMissing: options?.backfillOnlyMissing !== false,
        })
        : null;

    const syncBusinessIndex = options?.syncBusinessIndex !== false;
    if (syncBusinessIndex && tenantKeys.length === 0) {
        const tenants = await masterDb.collection('tenants').find({}, { projection: { key: 1 } }).toArray();
        tenantKeys = tenants
            .map((tenant) => normalizeText(tenant.key))
            .filter(Boolean);
    }

    const normalizedBackfillTenantKeys = dedupe(profileBackfill?.updatedTenantKeys || []);

    if (syncBusinessIndex) {
        for (const tenantKey of tenantKeys) {
            await upsertCommunityBusinessIndex(tenantKey, { masterDb });
        }
    } else if (normalizedBackfillTenantKeys.length > 0) {
        for (const tenantKey of normalizedBackfillTenantKeys) {
            await upsertCommunityBusinessIndex(tenantKey, { masterDb });
        }
    }

    const pageStats = await rebuildCommunityDiscoveryPages({ masterDb, systemDb });
    const run = {
        trigger: options?.trigger || 'manual',
        syncBusinessIndex,
        populateEssentials: options?.populateEssentials === true,
        backfillCommunityProfiles: options?.backfillCommunityProfiles === true,
        tenantCount: tenantKeys.length,
        essentials,
        profileBackfill,
        ...pageStats,
        requestedBy: normalizeText(options?.requestedBy),
        createdAt: new Date(),
    };
    await masterDb.collection('discovery_generation_runs').insertOne(run);
    return run;
}

export async function getCommunityDiscoveryStatus(options?: { masterDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    await ensureDiscoveryIndexes(masterDb);
    const systemDb = await getSystemDb();
    const [businessCount, discoveryCount, leadCount, indexableCount, noindexCount, latestRun, facetPolicyCount, crawlPolicyCount, taxonomyCount] = await Promise.all([
        masterDb.collection('community_business_index').countDocuments({}),
        masterDb.collection('community_discovery_pages').countDocuments({}),
        masterDb.collection('community_lead_index').countDocuments({}),
        masterDb.collection('community_discovery_pages').countDocuments({ isIndexable: true }),
        masterDb.collection('community_discovery_pages').countDocuments({ isIndexable: false }),
        masterDb.collection('discovery_generation_runs').findOne({}, { sort: { createdAt: -1 } }),
        systemDb.collection('discovery_facet_policies').countDocuments({ key: 'default' }),
        systemDb.collection('crawl_index_policies').countDocuments({ key: 'default' }),
        systemDb.collection('tag_taxonomy').countDocuments({ active: { $ne: false } }),
    ]);
    return {
        businessCount,
        discoveryPageCount: discoveryCount,
        indexableDiscoveryPageCount: indexableCount,
        noindexDiscoveryPageCount: noindexCount,
        leadMirrorCount: leadCount,
        essentialsCoverage: {
            hasFacetPolicy: facetPolicyCount > 0,
            hasCrawlPolicy: crawlPolicyCount > 0,
            tagTaxonomyCount: taxonomyCount,
        },
        latestRun,
        recommendedNightlyReconcileCron: '0 2 * * *',
    };
}

export async function searchCommunityBusinesses(params: {
    q?: string;
    industry?: string;
    businessType?: string;
    tag?: string;
    category?: string;
    country?: string;
    state?: string;
    city?: string;
    page?: number;
    pageSize?: number;
}, options?: { masterDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    const page = typeof params.page === 'number' && params.page > 0 ? Math.floor(params.page) : 1;
    const pageSizeRaw = typeof params.pageSize === 'number' ? Math.floor(params.pageSize) : 24;
    const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
    const skip = (page - 1) * pageSize;

    const filter: Record<string, unknown> = {
        'publishSignals.isPublished': true,
    };

    const industry = normalizeDiscoverySlug(params.industry || '');
    const businessType = normalizeDiscoverySlug(params.businessType || '');
    const tag = normalizeDiscoverySlug(params.tag || '');
    const category = normalizeDiscoverySlug(params.category || '');
    const country = normalizeDiscoverySlug(params.country || '');
    const state = normalizeDiscoverySlug(params.state || '');
    const city = normalizeDiscoverySlug(params.city || '');

    if (industry) filter['facets.industry'] = industry;
    if (businessType) filter['facets.businessType'] = businessType;
    if (tag) filter['facets.tags'] = tag;
    if (category) filter['facets.categories'] = category;
    if (country || state || city) {
        const locationMatch: Record<string, unknown> = {};
        if (country) locationMatch.countrySlug = country;
        if (state) locationMatch.stateSlug = state;
        if (city) locationMatch.citySlug = city;
        filter['facets.locations'] = { $elemMatch: locationMatch };
    }

    const q = normalizeText(params.q || '');
    if (q) {
        const rx = new RegExp(toSafeRegex(q), 'i');
        filter.$or = [
            { 'identity.name': rx },
            { 'identity.headline': rx },
            { 'identity.summary': rx },
            { 'facets.tags': rx },
        ];
    }

    const col = masterDb.collection('community_business_index');
    const [total, rows] = await Promise.all([
        col.countDocuments(filter),
        col.find(filter)
            .sort({ 'publishSignals.contentScore': -1, updatedAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .toArray(),
    ]);

    return {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        items: rows.map((row) => ({
            tenantKey: normalizeText(row.tenantKey),
            businessSlug: normalizeText(row.businessSlug),
            canonicalPath: normalizeText(row.canonicalPath),
            legacyBusinessPath: normalizeText(row.legacyBusinessPath),
            thumbnailUrl: pickFirstPublicMediaUrl([
                row.thumbnailUrl,
                (row.identity as Record<string, unknown>)?.thumbnailUrl,
                (row.identity as Record<string, unknown>)?.logoUrl,
                (row.identity as Record<string, unknown>)?.coverImageUrl,
            ]),
            identity: row.identity || {},
            facets: row.facets || {},
            publishSignals: row.publishSignals || {},
            seo: row.seo || {},
            updatedAt: row.updatedAt || null,
        })),
    };
}

export async function loadCommunityDiscoveryFacets(options?: { masterDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    const rows = await masterDb.collection('community_business_index').find(
        { 'publishSignals.isPublished': true },
        { projection: { facets: 1 } }
    ).toArray();

    const industry = new Map<string, number>();
    const businessType = new Map<string, number>();
    const tags = new Map<string, number>();
    const categories = new Map<string, number>();
    const locations = new Map<string, number>();

    for (const row of rows) {
        const facets = row.facets && typeof row.facets === 'object' ? row.facets as Record<string, unknown> : {};
        const industryKey = normalizeDiscoverySlug(normalizeText(facets.industry));
        if (industryKey) industry.set(industryKey, (industry.get(industryKey) || 0) + 1);
        const businessTypeKey = normalizeDiscoverySlug(normalizeText(facets.businessType));
        if (businessTypeKey) businessType.set(businessTypeKey, (businessType.get(businessTypeKey) || 0) + 1);
        for (const tag of normalizeTagList(facets.tags)) {
            tags.set(tag, (tags.get(tag) || 0) + 1);
        }
        for (const category of normalizeTagList(facets.categories)) {
            categories.set(category, (categories.get(category) || 0) + 1);
        }
        const locationRows = Array.isArray(facets.locations) ? facets.locations : [];
        for (const location of locationRows) {
            const normalized = normalizeLocationFacet(location);
            if (!normalized) continue;
            const key = `${normalized.countrySlug}/${normalized.stateSlug}/${normalized.citySlug}`;
            locations.set(key, (locations.get(key) || 0) + 1);
        }
    }

    const toFacetRows = (source: Map<string, number>) =>
        Array.from(source.entries())
            .map(([value, count]) => ({ value, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 200);

    return {
        industry: toFacetRows(industry),
        businessType: toFacetRows(businessType),
        tags: toFacetRows(tags),
        categories: toFacetRows(categories),
        locations: toFacetRows(locations),
    };
}

export async function loadDiscoveryPageByPath(routePath: string, options?: { masterDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;
    return masterDb.collection('community_discovery_pages').findOne({ routePath: normalized });
}

export async function loadDiscoveryFeed(params?: { limit?: number }, options?: { masterDb?: Db; systemDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    const systemDb = options?.systemDb || await getSystemDb();
    const crawlPolicy = await loadCrawlIndexPolicy(systemDb);
    const requestedLimit = typeof params?.limit === 'number' ? Math.floor(params.limit) : 500;
    const limit = Math.min(crawlPolicy.maxFeedItems, Math.max(1, requestedLimit));

    const filter: Record<string, unknown> = {
        'publishSignals.isPublished': true,
    };
    if (!crawlPolicy.includeNoindexInFeed) {
        filter['publishSignals.contentScore'] = { $gte: crawlPolicy.lowSignalNoindexThreshold };
        filter['seo.robots'] = { $not: /noindex/i };
    }

    const rows = await masterDb.collection('community_business_index').find(
        filter,
        {
            projection: {
                tenantKey: 1,
                businessSlug: 1,
                canonicalPath: 1,
                thumbnailUrl: 1,
                identity: 1,
                facets: 1,
                seo: 1,
                updatedAt: 1,
            },
        }
    )
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

    return rows.map((row) => {
        const facets = row.facets && typeof row.facets === 'object' ? row.facets as Record<string, unknown> : {};
        const firstLocation = Array.isArray(facets.locations) && facets.locations.length > 0
            ? normalizeLocationFacet(facets.locations[0])
            : null;
        return {
            tenantKey: normalizeText(row.tenantKey),
            businessSlug: normalizeText(row.businessSlug),
            canonicalUrl: normalizeText(row.canonicalPath) || `/${normalizeText(row.businessSlug)}`,
            name: normalizeText((row.identity as Record<string, unknown>)?.name),
            headline: normalizeText((row.identity as Record<string, unknown>)?.headline),
            summary: normalizeText((row.identity as Record<string, unknown>)?.summary),
            thumbnailUrl: pickFirstPublicMediaUrl([
                row.thumbnailUrl,
                (row.identity as Record<string, unknown>)?.thumbnailUrl,
                (row.identity as Record<string, unknown>)?.logoUrl,
                (row.identity as Record<string, unknown>)?.coverImageUrl,
                (row.identity as Record<string, unknown>)?.heroImageUrl,
            ]),
            industry: normalizeText(facets.industryLabel) || normalizeText(facets.industry),
            businessType: normalizeText(facets.businessTypeLabel) || normalizeText(facets.businessType),
            location: firstLocation
                ? {
                    country: firstLocation.country,
                    state: firstLocation.state,
                    city: firstLocation.city,
                    path: `/discover/location/${firstLocation.countrySlug}/${firstLocation.stateSlug}/${firstLocation.citySlug}`,
                }
                : null,
            tags: normalizeTagList(facets.tags),
            categories: normalizeTagList(facets.categories),
            seo: row.seo || {},
            updatedAt: row.updatedAt || null,
        };
    });
}

export function normalizeSubdomainReservation(value: unknown): string {
    return normalizeDiscoverySlug(normalizeText(value)).replace(/[^a-z0-9-]/g, '');
}

export async function mirrorCommunityLeadIndex(input: {
    tenantKey: string;
    formId: string;
    leadId: string;
    sourcePath?: string;
    surface?: string;
    referrerHost?: string;
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
        term?: string;
        content?: string;
    };
    geo?: {
        country?: string;
        region?: string;
        city?: string;
    };
    contact?: {
        email?: string;
        phone?: string;
    };
}, options?: { masterDb?: Db }) {
    const masterDb = options?.masterDb || await getMasterDb();
    await ensureDiscoveryIndexes(masterDb);
    const now = new Date();

    const record: CommunityLeadIndexRecord = {
        tenantKey: normalizeText(input.tenantKey),
        formId: normalizeText(input.formId),
        leadId: normalizeText(input.leadId),
        createdAt: now,
        surface: normalizeText(input.surface) || 'website',
        sourcePath: normalizeText(input.sourcePath),
        referrerHost: normalizeText(input.referrerHost),
        utm: {
            source: normalizeText(input.utm?.source),
            medium: normalizeText(input.utm?.medium),
            campaign: normalizeText(input.utm?.campaign),
            term: normalizeText(input.utm?.term),
            content: normalizeText(input.utm?.content),
        },
        geo: {
            country: normalizeText(input.geo?.country),
            region: normalizeText(input.geo?.region),
            city: normalizeText(input.geo?.city),
        },
        contactMask: {
            emailHash: hashValue(normalizeText(input.contact?.email)),
            phoneLast4: maskPhoneLast4(normalizeText(input.contact?.phone)),
        },
        updatedAt: now,
    };
    const { createdAt: leadCreatedAt, ...leadUpsertRecord } = record;

    await masterDb.collection('community_lead_index').updateOne(
        { tenantKey: record.tenantKey, leadId: record.leadId },
        {
            $set: leadUpsertRecord,
            $setOnInsert: { createdAt: leadCreatedAt },
        },
        { upsert: true }
    );
}
