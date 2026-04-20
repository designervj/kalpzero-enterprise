import type { Db } from 'mongodb';
import { deriveBusinessContexts, isEducationContextActive, isTravelContextActive } from '@/lib/business-context';
import { normalizeModuleList } from '@/lib/module-rules';

export type SeedCategory = {
    name: string;
    slug: string;
    type: 'product' | 'portfolio' | 'blog';
};

type SyncCategorySeedsInput = {
    enabledModules: string[];
    businessType?: string;
    industry?: string;
    businessContexts?: string[];
    templateCategorySeedPreset?: string[];
    attributeSetNames?: string[];
};

const LEGACY_GENERIC_PRODUCT_SLUGS = new Set([
    'apparel',
    'electronics',
    'accessories',
    'home-living',
    'digital-goods',
]);

function normalizeToken(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toTitleCase(value: string): string {
    return value
        .split('-')
        .filter(Boolean)
        .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
        .join(' ');
}

function slugify(value: string): string {
    return normalizeToken(value);
}

function isArrayOfStrings(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function normalizeNameList(value: unknown): string[] {
    if (!isArrayOfStrings(value)) return [];
    return Array.from(
        new Set(
            value
                .map((item) => item.trim())
                .filter(Boolean)
        )
    );
}

function buildProductSeedsFromNames(names: string[]): SeedCategory[] {
    const normalized = normalizeNameList(names);
    return normalized.map((name) => ({
        name,
        slug: slugify(name),
        type: 'product' as const,
    }));
}

function resolveProductCategorySeeds(input: {
    businessType: string;
    industry: string;
    businessContexts: string[];
    templateCategorySeedPreset?: string[];
    attributeSetNames?: string[];
}): SeedCategory[] {
    const attributePresetNames = normalizeNameList(input.attributeSetNames);
    if (attributePresetNames.length > 0) {
        return buildProductSeedsFromNames(attributePresetNames);
    }

    const preset = normalizeNameList(input.templateCategorySeedPreset);
    if (preset.length > 0) return buildProductSeedsFromNames(preset);

    const isTravel = isTravelContextActive(input.businessContexts);
    const isEducation = isEducationContextActive(input.businessContexts);
    const lookup = `${normalizeToken(input.businessType)} ${normalizeToken(input.industry)} ${input.businessContexts.map(normalizeToken).join(' ')}`;
    const has = (tokens: string[]) => tokens.some((token) => lookup.includes(token));

    if (isTravel || has(['travel', 'tour', 'itinerary', 'trip'])) {
        return buildProductSeedsFromNames([
            'Domestic Tours',
            'International Tours',
            'Honeymoon Packages',
            'Adventure Trips',
        ]);
    }

    if (isEducation || has(['education', 'school', 'academy', 'coaching', 'college'])) {
        return buildProductSeedsFromNames([
            'Foundation Programs',
            'Skill Courses',
            'Certification Tracks',
            'Workshops',
        ]);
    }

    if (has(['property', 'real-estate', 'brokerage', 'rental', 'coworking', 'listing'])) {
        return buildProductSeedsFromNames([
            'Residential',
            'Commercial',
            'Plots & Land',
            'Co-Working',
            'Investment',
        ]);
    }

    if (has(['hotel', 'resort', 'hospitality'])) {
        return buildProductSeedsFromNames([
            'Standard Rooms',
            'Deluxe Rooms',
            'Suites',
            'Villas',
        ]);
    }

    if (has(['restaurant', 'food', 'cafe', 'dining'])) {
        return buildProductSeedsFromNames([
            'Starters',
            'Main Course',
            'Beverages',
            'Desserts',
        ]);
    }

    return buildProductSeedsFromNames([
        'Apparel',
        'Electronics',
        'Accessories',
        'Home & Living',
        'Digital Goods',
    ]);
}

export function resolveSeedCategoryBlueprint(input: SyncCategorySeedsInput): SeedCategory[] {
    const moduleSet = new Set(normalizeModuleList(input.enabledModules));
    const businessType = typeof input.businessType === 'string' ? input.businessType.trim() : '';
    const industry = typeof input.industry === 'string' ? input.industry.trim() : '';
    const businessContexts = Array.from(
        new Set(
            deriveBusinessContexts({
                businessType,
                businessContexts: input.businessContexts,
            })
        )
    );

    const categories: SeedCategory[] = [];
    if (moduleSet.has('products') || moduleSet.has('ecommerce') || isTravelContextActive(businessContexts) || isEducationContextActive(businessContexts)) {
        categories.push(...resolveProductCategorySeeds({
            businessType,
            industry,
            businessContexts,
            templateCategorySeedPreset: input.templateCategorySeedPreset,
            attributeSetNames: input.attributeSetNames,
        }));
    }

    if (moduleSet.has('portfolio')) {
        categories.push(
            { name: 'Branding', slug: 'branding', type: 'portfolio' },
            { name: 'Web Design', slug: 'web-design', type: 'portfolio' },
            { name: 'Marketing', slug: 'marketing', type: 'portfolio' }
        );
    }

    if (moduleSet.has('blog')) {
        categories.push(
            { name: 'Announcements', slug: 'announcements', type: 'blog' },
            { name: 'Guides', slug: 'guides', type: 'blog' }
        );
    }

    return Array.from(
        new Map(
            categories.map((item) => [`${item.type}:${item.slug}`, item])
        ).values()
    );
}

function collectSlugUsage(rows: Array<Record<string, unknown>>, selector: (row: Record<string, unknown>) => string[]): Set<string> {
    const used = new Set<string>();
    for (const row of rows) {
        const values = selector(row);
        for (const value of values) {
            const slug = slugify(value);
            if (slug) used.add(slug);
        }
    }
    return used;
}

function createSeedCategoryDocument(entry: SeedCategory) {
    const now = new Date();
    return {
        name: entry.name,
        slug: entry.slug,
        type: entry.type,
        parentId: null,
        description: '',
        source: 'system-seed',
        seedGroup: 'business-template-default',
        templateKey: `${entry.type}-category-default`,
        page: {
            title: entry.name,
            content: '',
            bannerImage: '',
            gallery: [],
            templateKey: `${entry.type}-category-default`,
            status: 'draft',
            seo: {
                metaTitle: entry.name,
                metaDescription: '',
            },
        },
        createdAt: now,
        updatedAt: now,
    };
}

export async function syncTenantCategorySeeds(
    db: Db,
    input: SyncCategorySeedsInput
): Promise<{ inserted: number; deleted: number; desired: number }> {
    const desired = resolveSeedCategoryBlueprint(input);
    const categoriesCol = db.collection('categories');

    const existing = await categoriesCol.find({}).toArray();
    const existingByTypeSlug = new Map<string, Record<string, unknown>>();
    for (const row of existing) {
        const type = typeof row.type === 'string' ? row.type : '';
        const slug = typeof row.slug === 'string' ? row.slug : '';
        if (!type || !slug) continue;
        existingByTypeSlug.set(`${type}:${slug}`, row as Record<string, unknown>);
    }

    let inserted = 0;
    for (const entry of desired) {
        const key = `${entry.type}:${entry.slug}`;
        if (existingByTypeSlug.has(key)) continue;
        await categoriesCol.insertOne(createSeedCategoryDocument(entry));
        inserted += 1;
    }

    const desiredByType = {
        product: new Set(desired.filter((item) => item.type === 'product').map((item) => item.slug)),
        blog: new Set(desired.filter((item) => item.type === 'blog').map((item) => item.slug)),
        portfolio: new Set(desired.filter((item) => item.type === 'portfolio').map((item) => item.slug)),
    };

    const [products, blogPosts, portfolioItems] = await Promise.all([
        db.collection('products').find({}, { projection: { categoryIds: 1 } }).toArray(),
        db.collection('blog_posts').find({}, { projection: { category: 1, categories: 1 } }).toArray(),
        db.collection('portfolio_items').find({}, { projection: { category: 1, categories: 1 } }).toArray(),
    ]);

    const usedProductSlugs = collectSlugUsage(products as Array<Record<string, unknown>>, (row) => {
        const raw = row.categoryIds;
        if (!Array.isArray(raw)) return [];
        return raw.filter((item): item is string => typeof item === 'string');
    });
    const usedBlogSlugs = collectSlugUsage(blogPosts as Array<Record<string, unknown>>, (row) => {
        const values: string[] = [];
        if (typeof row.category === 'string') values.push(row.category);
        if (Array.isArray(row.categories)) values.push(...row.categories.filter((item): item is string => typeof item === 'string'));
        return values;
    });
    const usedPortfolioSlugs = collectSlugUsage(portfolioItems as Array<Record<string, unknown>>, (row) => {
        const values: string[] = [];
        if (typeof row.category === 'string') values.push(row.category);
        if (Array.isArray(row.categories)) values.push(...row.categories.filter((item): item is string => typeof item === 'string'));
        return values;
    });

    let deleted = 0;
    for (const row of existing as Array<Record<string, unknown>>) {
        const id = row._id;
        const type = typeof row.type === 'string' ? row.type : '';
        const slug = typeof row.slug === 'string' ? slugify(row.slug) : '';
        if (!id || !type || !slug) continue;

        const source = typeof row.source === 'string' ? row.source : '';
        const canDeleteSeed = source === 'system-seed';
        const isLegacyGenericProduct = type === 'product' && LEGACY_GENERIC_PRODUCT_SLUGS.has(slug);

        if (!canDeleteSeed && !isLegacyGenericProduct) continue;

        const expected = type === 'product'
            ? desiredByType.product
            : type === 'blog'
                ? desiredByType.blog
                : type === 'portfolio'
                    ? desiredByType.portfolio
                    : null;
        if (!expected) continue;
        if (expected.has(slug) && !isLegacyGenericProduct) continue;

        const isUsed = type === 'product'
            ? usedProductSlugs.has(slug)
            : type === 'blog'
                ? usedBlogSlugs.has(slug)
                : usedPortfolioSlugs.has(slug);
        if (isUsed) continue;

        await categoriesCol.deleteOne({ _id: id });
        deleted += 1;
    }

    return {
        inserted,
        deleted,
        desired: desired.length,
    };
}

export function extractTemplateCategorySeedPreset(templateBusinessType: unknown): string[] {
    if (!templateBusinessType || typeof templateBusinessType !== 'object' || Array.isArray(templateBusinessType)) {
        return [];
    }
    const raw = templateBusinessType as Record<string, unknown>;
    return normalizeNameList(raw.categorySeedPreset);
}

export function buildCategorySeedPresetFromAttributePool(attributePool: unknown): string[] {
    if (!isArrayOfStrings(attributePool)) return [];
    const normalized = Array.from(new Set(attributePool.map((item) => normalizeToken(item)).filter(Boolean)));
    if (normalized.length === 0) return [];
    return normalized.slice(0, 6).map((token) => toTitleCase(token));
}
