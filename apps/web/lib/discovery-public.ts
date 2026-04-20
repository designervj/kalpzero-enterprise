import { getMasterDb } from '@/lib/db';
import { loadCommunityDiscoveryFacets, loadDiscoveryPageByPath, searchCommunityBusinesses } from '@/lib/discovery';

export type DiscoveryBusinessCard = {
    tenantKey: string;
    businessSlug: string;
    canonicalPath: string;
    name: string;
    headline: string;
    summary: string;
    industry: string;
    businessType: string;
    tags: string[];
    thumbnailUrl: string;
    quality: unknown;
    updatedAt: unknown;
};

type DiscoveryLocation = {
    country: string;
    state: string;
    city: string;
    countrySlug: string;
    stateSlug: string;
    citySlug: string;
};

type FallbackDiscoveryListing = {
    tenantKey: string;
    businessSlug: string;
    canonicalPath: string;
    name: string;
    headline: string;
    summary: string;
    industrySlug: string;
    industryLabel: string;
    businessTypeSlug: string;
    businessTypeLabel: string;
    tags: string[];
    categories: string[];
    location: DiscoveryLocation;
    thumbnailUrl: string;
    quality: string;
    updatedAt: string;
};

const FALLBACK_DISCOVERY_LISTINGS: FallbackDiscoveryListing[] = [
    {
        tenantKey: 'demo_fashion_house',
        businessSlug: 'yuvi-garments',
        canonicalPath: '/yuvi-garments',
        name: 'Yuvi Garments',
        headline: 'Premium fashion manufacturing and private label solutions.',
        summary: 'Design-to-delivery garment partner for D2C and retail brands.',
        industrySlug: 'fashion',
        industryLabel: 'Fashion',
        businessTypeSlug: 'business',
        businessTypeLabel: 'Business',
        tags: ['garments', 'private-label', 'ludhiana', 'fashion'],
        categories: ['apparel', 'manufacturing'],
        location: {
            country: 'India',
            state: 'Punjab',
            city: 'Ludhiana',
            countrySlug: 'india',
            stateSlug: 'punjab',
            citySlug: 'ludhiana',
        },
        thumbnailUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=80',
        quality: 'starter',
        updatedAt: '2026-03-01T09:00:00.000Z',
    },
    {
        tenantKey: 'demo_ai_studio',
        businessSlug: 'kalp-ai-agents',
        canonicalPath: '/kalp-ai-agents',
        name: 'Kalp AI Agents',
        headline: 'AI workflow automation for business operations and growth.',
        summary: 'Deploy agentic assistants for support, sales, and content execution.',
        industrySlug: 'technology',
        industryLabel: 'Technology',
        businessTypeSlug: 'agency',
        businessTypeLabel: 'Agency',
        tags: ['ai', 'automation', 'agents', 'delhi'],
        categories: ['consulting', 'automation'],
        location: {
            country: 'India',
            state: 'Delhi',
            city: 'New Delhi',
            countrySlug: 'india',
            stateSlug: 'delhi',
            citySlug: 'new-delhi',
        },
        thumbnailUrl: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
        quality: 'pro',
        updatedAt: '2026-03-04T11:30:00.000Z',
    },
    {
        tenantKey: 'demo_fit_labs',
        businessSlug: 'elite-performance-gym',
        canonicalPath: '/elite-performance-gym',
        name: 'Elite Performance Gym',
        headline: 'Evidence-based fitness plans and coaching for teams and individuals.',
        summary: 'Hybrid coaching programs with performance analytics and community support.',
        industrySlug: 'fitness',
        industryLabel: 'Fitness',
        businessTypeSlug: 'portfolio',
        businessTypeLabel: 'Portfolio',
        tags: ['fitness', 'coaching', 'bangalore', 'wellness'],
        categories: ['wellness', 'coaching'],
        location: {
            country: 'India',
            state: 'Karnataka',
            city: 'Bengaluru',
            countrySlug: 'india',
            stateSlug: 'karnataka',
            citySlug: 'bengaluru',
        },
        thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=80',
        quality: 'pro',
        updatedAt: '2026-03-05T13:45:00.000Z',
    },
];

function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeSlug(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeLocationValue(value: string): string {
    return normalizeSlug(value);
}

function pickFirstUrl(candidates: unknown[]): string {
    for (const candidate of candidates) {
        const value = normalizeString(candidate);
        if (value && /^(https?:)?\/\//i.test(value)) return value;
    }
    return '';
}

function toBusinessCard(row: Record<string, unknown>): DiscoveryBusinessCard {
    const identity = row.identity && typeof row.identity === 'object'
        ? row.identity as Record<string, unknown>
        : {};
    const facets = row.facets && typeof row.facets === 'object'
        ? row.facets as Record<string, unknown>
        : {};
    const thumbnailUrl = pickFirstUrl([
        row.thumbnailUrl,
        identity.thumbnailUrl,
        identity.logoUrl,
        identity.coverImageUrl,
    ]);
    return {
        tenantKey: normalizeString(row.tenantKey),
        businessSlug: normalizeString(row.businessSlug),
        canonicalPath: normalizeString(row.canonicalPath) || `/${normalizeString(row.businessSlug)}`,
        name: normalizeString(identity.name) || normalizeString(row.businessSlug),
        headline: normalizeString(identity.headline),
        summary: normalizeString(identity.summary),
        industry: normalizeString(facets.industryLabel) || normalizeString(facets.industry),
        businessType: normalizeString(facets.businessTypeLabel) || normalizeString(facets.businessType),
        tags: Array.isArray(facets.tags)
            ? facets.tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0).slice(0, 8)
            : [],
        thumbnailUrl,
        quality: row.publishSignals && typeof row.publishSignals === 'object'
            ? (row.publishSignals as Record<string, unknown>).qualityTier
            : '',
        updatedAt: row.updatedAt || null,
    };
}

function fallbackToBusinessCard(row: FallbackDiscoveryListing): DiscoveryBusinessCard {
    return {
        tenantKey: row.tenantKey,
        businessSlug: row.businessSlug,
        canonicalPath: row.canonicalPath,
        name: row.name,
        headline: row.headline,
        summary: row.summary,
        industry: row.industryLabel,
        businessType: row.businessTypeLabel,
        tags: row.tags,
        thumbnailUrl: row.thumbnailUrl,
        quality: row.quality,
        updatedAt: row.updatedAt,
    };
}

function getFallbackCards(limit = 30): DiscoveryBusinessCard[] {
    return FALLBACK_DISCOVERY_LISTINGS
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, Math.max(1, limit))
        .map((row) => fallbackToBusinessCard(row));
}

function countFacet(values: string[]): Array<{ value: string; count: number }> {
    const map = new Map<string, number>();
    for (const value of values) {
        const normalized = normalizeString(value);
        if (!normalized) continue;
        map.set(normalized, (map.get(normalized) || 0) + 1);
    }
    return Array.from(map.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
}

function buildFallbackFacets() {
    return {
        industry: countFacet(FALLBACK_DISCOVERY_LISTINGS.map((row) => row.industrySlug)),
        businessType: countFacet(FALLBACK_DISCOVERY_LISTINGS.map((row) => row.businessTypeSlug)),
        tags: countFacet(FALLBACK_DISCOVERY_LISTINGS.flatMap((row) => row.tags.map((tag) => normalizeSlug(tag)))),
        categories: countFacet(FALLBACK_DISCOVERY_LISTINGS.flatMap((row) => row.categories.map((category) => normalizeSlug(category)))),
        locations: countFacet(
            FALLBACK_DISCOVERY_LISTINGS.map((row) => (
                `${row.location.countrySlug}/${row.location.stateSlug}/${row.location.citySlug}`
            ))
        ),
    };
}

function buildFallbackSearchItems(rows: FallbackDiscoveryListing[]) {
    return rows.map((row) => ({
        tenantKey: row.tenantKey,
        businessSlug: row.businessSlug,
        canonicalPath: row.canonicalPath,
        legacyBusinessPath: `/business/${row.businessSlug}`,
        thumbnailUrl: row.thumbnailUrl,
        identity: {
            name: row.name,
            headline: row.headline,
            summary: row.summary,
            thumbnailUrl: row.thumbnailUrl,
        },
        facets: {
            industry: row.industrySlug,
            industryLabel: row.industryLabel,
            businessType: row.businessTypeSlug,
            businessTypeLabel: row.businessTypeLabel,
            tags: row.tags.map((tag) => normalizeSlug(tag)),
            categories: row.categories.map((category) => normalizeSlug(category)),
            locations: [row.location],
        },
        publishSignals: { isPublished: true, qualityTier: row.quality, contentScore: 12 },
        seo: { robots: 'index,follow' },
        updatedAt: row.updatedAt,
    }));
}

function filterFallbackRows(params: {
    q?: string;
    industry?: string;
    businessType?: string;
    tag?: string;
    category?: string;
    country?: string;
    state?: string;
    city?: string;
}) {
    const q = normalizeString(params.q || '').toLowerCase();
    const industry = normalizeSlug(params.industry || '');
    const businessType = normalizeSlug(params.businessType || '');
    const tag = normalizeSlug(params.tag || '');
    const category = normalizeSlug(params.category || '');
    const country = normalizeLocationValue(params.country || '');
    const state = normalizeLocationValue(params.state || '');
    const city = normalizeLocationValue(params.city || '');

    return FALLBACK_DISCOVERY_LISTINGS.filter((row) => {
        if (industry && row.industrySlug !== industry) return false;
        if (businessType && row.businessTypeSlug !== businessType) return false;
        if (tag && !row.tags.map((item) => normalizeSlug(item)).includes(tag)) return false;
        if (category && !row.categories.map((item) => normalizeSlug(item)).includes(category)) return false;
        if (country && row.location.countrySlug !== country) return false;
        if (state && row.location.stateSlug !== state) return false;
        if (city && row.location.citySlug !== city) return false;
        if (!q) return true;
        const haystack = [
            row.name,
            row.headline,
            row.summary,
            row.industryLabel,
            row.businessTypeLabel,
            row.location.city,
            ...row.tags,
            ...row.categories,
        ]
            .join(' ')
            .toLowerCase();
        return haystack.includes(q);
    });
}

function getFallbackPage(routePath: string): { page: Record<string, unknown>; items: DiscoveryBusinessCard[] } | null {
    const normalizedRoute = normalizeString(routePath).startsWith('/') ? normalizeString(routePath) : `/${normalizeString(routePath)}`;
    const parts = normalizedRoute.split('/').filter(Boolean);
    if (parts.length < 3 || parts[0] !== 'discover') return null;

    const facetType = parts[1];
    const slugA = normalizeSlug(parts[2] || '');
    const slugB = normalizeSlug(parts[3] || '');
    const slugC = normalizeSlug(parts[4] || '');

    let filtered: FallbackDiscoveryListing[] = [];
    let title = 'Discovery';
    let description = 'Discover listed businesses.';

    if (facetType === 'industry') {
        filtered = filterFallbackRows({ industry: slugA });
        title = `Industry: ${slugA}`;
        description = `Businesses listed under ${slugA}.`;
    } else if (facetType === 'business-type') {
        filtered = filterFallbackRows({ businessType: slugA });
        title = `Business Type: ${slugA}`;
        description = `Businesses listed under ${slugA}.`;
    } else if (facetType === 'tag') {
        filtered = filterFallbackRows({ tag: slugA });
        title = `Tag: ${slugA}`;
        description = `Businesses tagged with ${slugA}.`;
    } else if (facetType === 'category') {
        filtered = filterFallbackRows({ category: slugA });
        title = `Category: ${slugA}`;
        description = `Businesses listed under category ${slugA}.`;
    } else if (facetType === 'location') {
        filtered = filterFallbackRows({ country: slugA, state: slugB, city: slugC });
        title = `Businesses in ${slugC || slugB || slugA}`;
        description = `Businesses listed for ${slugC || 'city'}, ${slugB || 'state'}, ${slugA || 'country'}.`;
    } else {
        return null;
    }

    if (filtered.length === 0) return null;
    const cards = filtered.map((row) => fallbackToBusinessCard(row));
    const robots = cards.length < 2 ? 'noindex,follow' : 'index,follow';
    return {
        page: {
            routePath: normalizedRoute,
            businessSlugs: cards.map((card) => card.businessSlug),
            isIndexable: robots === 'index,follow',
            seo: {
                title,
                description,
                robots,
            },
        },
        items: cards,
    };
}

function isDbConnectivityError(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase();
    return (
        message.includes('mongoserverselectionerror')
        || message.includes('failed to connect')
        || message.includes('ssl')
        || message.includes('tls')
        || message.includes('econnrefused')
        || message.includes('timed out')
    );
}

export async function loadDiscoveryBusinessCardsBySlugs(slugs: string[]) {
    if (!slugs.length) return [];
    try {
        const masterDb = await getMasterDb();
        const rows = await masterDb.collection('community_business_index').find(
            {
                businessSlug: { $in: slugs },
                'publishSignals.isPublished': true,
            },
            {
                projection: {
                    tenantKey: 1,
                    businessSlug: 1,
                    canonicalPath: 1,
                    thumbnailUrl: 1,
                    identity: 1,
                    facets: 1,
                    publishSignals: 1,
                    updatedAt: 1,
                },
            }
        ).toArray() as Array<Record<string, unknown>>;

        const mapped = new Map(rows.map((row) => [normalizeString(row.businessSlug), toBusinessCard(row)]));
        return slugs.map((slug) => mapped.get(slug)).filter((item): item is DiscoveryBusinessCard => Boolean(item));
    } catch (error) {
        if (!isDbConnectivityError(error)) throw error;
        const mapped = new Map(
            FALLBACK_DISCOVERY_LISTINGS.map((row) => [normalizeString(row.businessSlug), fallbackToBusinessCard(row)])
        );
        return slugs.map((slug) => mapped.get(normalizeString(slug))).filter((item): item is DiscoveryBusinessCard => Boolean(item));
    }
}

export async function loadDiscoveryPagePayload(routePath: string) {
    try {
        const masterDb = await getMasterDb();
        const page = await loadDiscoveryPageByPath(routePath, { masterDb }) as Record<string, unknown> | null;
        if (!page) {
            return getFallbackPage(routePath);
        }
        const slugs = Array.isArray(page.businessSlugs)
            ? page.businessSlugs
                .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                .slice(0, 200)
            : [];
        const items = await loadDiscoveryBusinessCardsBySlugs(slugs);
        return {
            page,
            items,
        };
    } catch (error) {
        if (!isDbConnectivityError(error)) throw error;
        return getFallbackPage(routePath);
    }
}

export async function loadDiscoveryHomeCards(limit = 30) {
    try {
        const masterDb = await getMasterDb();
        const rows = await masterDb.collection('community_business_index').find(
            { 'publishSignals.isPublished': true },
            {
                projection: {
                    tenantKey: 1,
                    businessSlug: 1,
                    canonicalPath: 1,
                    thumbnailUrl: 1,
                    identity: 1,
                    facets: 1,
                    publishSignals: 1,
                    updatedAt: 1,
                },
            }
        )
            .sort({ 'publishSignals.contentScore': -1, updatedAt: -1 })
            .limit(limit)
            .toArray() as Array<Record<string, unknown>>;

        return rows.map((row) => toBusinessCard(row));
    } catch (error) {
        if (!isDbConnectivityError(error)) throw error;
        return getFallbackCards(limit);
    }
}

export async function loadDiscoveryFacetsSafe() {
    try {
        const payload = await loadCommunityDiscoveryFacets({ masterDb: await getMasterDb() });
        return {
            ...payload,
            source: 'database' as const,
        };
    } catch (error) {
        if (!isDbConnectivityError(error)) throw error;
        return {
            ...buildFallbackFacets(),
            source: 'fallback' as const,
        };
    }
}

export async function searchDiscoveryBusinessesSafe(params: {
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
}) {
    try {
        const payload = await searchCommunityBusinesses(params, { masterDb: await getMasterDb() });
        return {
            ...payload,
            source: 'database' as const,
        };
    } catch (error) {
        if (!isDbConnectivityError(error)) throw error;
        const page = typeof params.page === 'number' && params.page > 0 ? Math.floor(params.page) : 1;
        const pageSizeRaw = typeof params.pageSize === 'number' ? Math.floor(params.pageSize) : 24;
        const pageSize = Math.min(100, Math.max(1, pageSizeRaw));
        const filtered = filterFallbackRows(params);
        const total = filtered.length;
        const start = (page - 1) * pageSize;
        const rows = filtered.slice(start, start + pageSize);
        return {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            items: buildFallbackSearchItems(rows),
            source: 'fallback' as const,
        };
    }
}
