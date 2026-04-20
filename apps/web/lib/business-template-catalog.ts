import type { Db } from 'mongodb';
import { deriveBusinessContexts } from '@/lib/business-context';
import rawCatalog from '@/lib/data/business-attributes.catalog.json';
import { enforceModuleSelectionRules, normalizeModuleList } from '@/lib/module-rules';
import { resolveSeedCategoryBlueprint } from '@/lib/category-seeds';

export type CatalogAttributeDefinition = {
    key: string;
    label: string;
    type: 'select' | 'text' | 'multiselect' | 'number' | 'boolean';
    options: string[];
    hint?: string;
};

export type CatalogAttributeSet = {
    key: string;
    name: string;
    appliesTo: 'product';
    attributes: CatalogAttributeDefinition[];
};

export type CatalogBusinessType = {
    key: string;
    name: string;
    description: string;
    attributePool: string[];
    attributeSets: CatalogAttributeSet[];
    subTypes?: CatalogBusinessType[];
};


export type CatalogIndustry = {
    key: string;
    industry: string;
    businessTypes: CatalogBusinessType[];
};

type CatalogRoot = {
    version: string;
    industries: CatalogIndustry[];
};

type SystemBusinessType = {
    key?: string;
    name?: string;
    icon?: string;
    description?: string;
    enabledModules?: string[];
    featureFlags?: Record<string, boolean>;
    businessContexts?: string[];
    attributePool?: string[];
    attributeSets?: CatalogAttributeSet[];
    attributeSetPreset?: CatalogAttributeSet[];
    categorySeedPreset?: string[];
    [key: string]: unknown;
};


const catalog = rawCatalog as unknown as CatalogRoot;

const INDUSTRY_ICON_MAP: Record<string, string> = {
    'real-estate-and-property': '🏢',
    'hospitality-and-tourism': '🏨',
    'healthcare-and-medical-services': '🏥',
    'architecture-and-interior-design': '🏛️',
    'construction-and-infrastructure': '🏗️',
    'furniture-and-home-furnishings': '🛋️',
    'apparel-and-clothing': '👗',
    'beauty-wellness-and-fitness': '💆',
    'technology-and-it-services': '💻',
};

function normalizeToken(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeStringArray(value: unknown): string[] {
    return normalizeModuleList(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toKey(value: string): string {
    return normalizeToken(value || '');
}

function toComparableValue(value: unknown): unknown {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map((item) => toComparableValue(item));
    if (!value || typeof value !== 'object') return value;

    const source = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
        if (key === '_id' || key === 'createdAt' || key === 'updatedAt') continue;
        output[key] = toComparableValue(source[key]);
    }
    return output;
}

function inferDefaultModules(industry: string, businessType: string, businessContexts: string[]): string[] {
    const industryKey = toKey(industry);
    const normalized = `${industryKey} ${toKey(businessType)} ${businessContexts.map(toKey).join(' ')}`;

    const modules = new Set<string>(['website', 'products', 'media', 'invoicing']);

    if (normalized.includes('travel') || normalized.includes('tour') || normalized.includes('hotel') || normalized.includes('restaurant') || normalized.includes('fitness') || normalized.includes('salon') || normalized.includes('clinic') || normalized.includes('booking')) {
        modules.add('bookings');
    }

    if (normalized.includes('retail') || normalized.includes('store') || normalized.includes('apparel') || normalized.includes('furniture') || normalized.includes('ecommerce') || normalized.includes('pharmacy') || normalized.includes('product') || normalized.includes('supplement')) {
        modules.add('ecommerce');
    }

    if (normalized.includes('agency') || normalized.includes('consult') || normalized.includes('architect') || normalized.includes('construction') || normalized.includes('technology') || normalized.includes('software') || normalized.includes('services') || normalized.includes('design')) {
        modules.add('portfolio');
    }

    if (normalized.includes('education') || normalized.includes('school') || normalized.includes('coaching') || normalized.includes('training') || normalized.includes('college') || normalized.includes('academy')) {
        modules.add('bookings');
        modules.add('blog');
        modules.add('marketing');
    }

    if (modules.has('ecommerce') || modules.has('bookings') || modules.has('portfolio')) {
        modules.add('marketing');
    }
    if (modules.has('marketing') || modules.has('portfolio')) {
        modules.add('blog');
    }

    return enforceModuleSelectionRules(Array.from(modules)).modules;
}

function inferFeatureFlags(enabledModules: string[]): Record<string, boolean> {
    const set = new Set(enabledModules);
    return {
        hasBookingEngine: set.has('bookings'),
        hasEcommerce: set.has('ecommerce'),
        hasInvoicing: set.has('invoicing'),
        hasMarketing: set.has('marketing'),
        hasPortfolio: set.has('portfolio'),
        hasInventory: set.has('products') && set.has('ecommerce'),
    };
}

function buildBusinessContexts(industry: string, businessType: string): string[] {
    const derived = deriveBusinessContexts({ businessType });
    const contexts = new Set<string>([
        ...derived,
        toKey(industry),
        toKey(businessType),
    ]);
    contexts.delete('');
    return Array.from(contexts);
}

function normalizeAttributeDefinition(value: unknown): CatalogAttributeDefinition | null {
    if (!isRecord(value)) return null;
    const key = typeof value.key === 'string' ? toKey(value.key) : '';
    const label = typeof value.label === 'string' ? value.label.trim() : '';
    if (!key || !label) return null;

    const options = normalizeStringArray(value.options);
    const typeRaw = typeof value.type === 'string' ? value.type : 'select';
    const type = (['select', 'text', 'multiselect', 'number', 'boolean'] as const).includes(typeRaw as CatalogAttributeDefinition['type'])
        ? typeRaw as CatalogAttributeDefinition['type']
        : (options.length > 0 ? 'select' : 'text');

    return {
        key,
        label,
        type,
        options,
        hint: typeof value.hint === 'string' && value.hint.trim() ? value.hint.trim() : undefined,
    };
}

function normalizeAttributeSet(value: unknown, fallbackKey: string): CatalogAttributeSet {
    if (!isRecord(value)) {
        return {
            key: fallbackKey,
            name: 'Core Attributes',
            appliesTo: 'product',
            attributes: [],
        };
    }

    const attributesRaw = Array.isArray(value.attributes) ? value.attributes : [];
    const attributes = attributesRaw
        .map(normalizeAttributeDefinition)
        .filter((item): item is CatalogAttributeDefinition => Boolean(item));

    return {
        key: typeof value.key === 'string' && value.key.trim() ? toKey(value.key) : fallbackKey,
        name: typeof value.name === 'string' && value.name.trim() ? value.name.trim() : 'Core Attributes',
        appliesTo: 'product',
        attributes,
    };
}

function normalizeAttributeSetPreset(value: unknown, fallbackKey: string): CatalogAttributeSet[] {
    if (Array.isArray(value)) {
        return value
            .map((item, index) => normalizeAttributeSet(item, `${fallbackKey}-${index}`))
            .filter(item => item.attributes.length > 0);
    }
    const single = normalizeAttributeSet(value, fallbackKey);
    return single.attributes.length > 0 ? [single] : [];
}

function findBusinessTypeInList(list: CatalogBusinessType[], normalizedBusinessType: string): CatalogBusinessType | null {
    for (const entry of list) {
        if (toKey(entry.key) === normalizedBusinessType || toKey(entry.name) === normalizedBusinessType) {
            return entry;
        }
        if (Array.isArray(entry.subTypes)) {
            const match = findBusinessTypeInList(entry.subTypes, normalizedBusinessType);
            if (match) return match;
        }
    }
    return null;
}


function resolveCatalogBusinessType(industry: string, businessType: string): { industry: CatalogIndustry; businessType: CatalogBusinessType } | null {
    const normalizedIndustry = toKey(industry);
    const normalizedBusinessType = toKey(businessType);

    const matchingIndustries = normalizedIndustry
        ? catalog.industries.filter((entry) => toKey(entry.industry) === normalizedIndustry || toKey(entry.key) === normalizedIndustry)
        : catalog.industries;

    for (const industryEntry of matchingIndustries) {
        const match = findBusinessTypeInList(industryEntry.businessTypes, normalizedBusinessType);
        if (match) return { industry: industryEntry, businessType: match };
    }

    for (const industryEntry of catalog.industries) {
        const match = findBusinessTypeInList(industryEntry.businessTypes, normalizedBusinessType);
        if (match) return { industry: industryEntry, businessType: match };
    }


    if (!normalizedBusinessType) return null;

    const targetTokens = new Set(normalizedBusinessType.split('-').filter(Boolean));
    let bestMatch: { industry: CatalogIndustry; businessType: CatalogBusinessType; score: number } | null = null;

    const scope = matchingIndustries.length > 0 ? matchingIndustries : catalog.industries;
    for (const industryEntry of scope) {
        for (const entry of industryEntry.businessTypes) {
            const candidateKey = `${toKey(entry.key)}-${toKey(entry.name)}`;
            const candidateTokens = new Set(candidateKey.split('-').filter(Boolean));
            const intersection = Array.from(targetTokens).filter(token => candidateTokens.has(token)).length;
            const union = new Set([...Array.from(targetTokens), ...Array.from(candidateTokens)]).size;
            const score = union > 0 ? intersection / union : 0;
            if (!bestMatch || score > bestMatch.score) {
                bestMatch = { industry: industryEntry, businessType: entry, score };
            }
        }
    }

    if (bestMatch && bestMatch.score >= 0.34) {
        return { industry: bestMatch.industry, businessType: bestMatch.businessType };
    }

    return null;
}

export function getBusinessAttributeCatalog(): CatalogRoot {
    return catalog;
}

export function findBusinessTemplateFromCatalog(input: {
    industry?: string;
    businessType?: string;
    existingType?: SystemBusinessType | null;
}): {
    industry: string;
    industryKey: string;
    industryIcon: string;
    businessType: string;
    businessTypeKey: string;
    description: string;
    businessContexts: string[];
    enabledModules: string[];
    featureFlags: Record<string, boolean>;
    attributePool: string[];
    attributeSetPresets: CatalogAttributeSet[];
    categorySeedPreset: string[];
} | null {
    const businessType = typeof input.businessType === 'string' ? input.businessType.trim() : '';
    if (!businessType) return null;

    const industry = typeof input.industry === 'string' ? input.industry.trim() : '';
    const match = resolveCatalogBusinessType(industry, businessType);
    if (!match) return null;

    const existing = input.existingType;
    const contexts = normalizeStringArray(existing?.businessContexts);
    const businessContexts = contexts.length > 0 ? contexts : buildBusinessContexts(match.industry.industry, match.businessType.name);

    const enabledModules = normalizeStringArray(existing?.enabledModules);
    const resolvedEnabledModules = enabledModules.length > 0
        ? enforceModuleSelectionRules(enabledModules).modules
        : inferDefaultModules(match.industry.industry, match.businessType.name, businessContexts);

    const existingFlags = isRecord(existing?.featureFlags) ? existing?.featureFlags : null;
    const featureFlags = existingFlags && Object.keys(existingFlags).length > 0
        ? Object.entries(existingFlags).reduce<Record<string, boolean>>((acc, [key, value]) => {
            if (typeof value === 'boolean') acc[key] = value;
            return acc;
        }, {})
        : inferFeatureFlags(resolvedEnabledModules);

    const fallbackSetKey = `${toKey(match.businessType.key || match.businessType.name)}-core`;
    const attributeSetsFromCatalog = normalizeAttributeSetPreset(
        match.businessType.attributeSets ||
        (match.businessType as any).attributeSetPreset ||
        (match.businessType as any).attributeSet ||
        (match.businessType as any).attributeSets,
        fallbackSetKey
    );
    const attributeSetsFromExisting = normalizeAttributeSetPreset(
        existing?.attributeSets || existing?.attributeSetPreset,
        fallbackSetKey
    );

    const attributeSetPresets = attributeSetsFromExisting.length > 0
        ? attributeSetsFromExisting
        : attributeSetsFromCatalog;


    const existingAttributePool = normalizeStringArray(existing?.attributePool);
    const attributePool = existingAttributePool.length > 0
        ? existingAttributePool
        : Array.from(new Set(attributeSetPresets.flatMap(preset => preset.attributes.map(attr => attr.key))));

    const existingCategorySeedPreset = normalizeStringArray(existing?.categorySeedPreset);
    const categorySeedPreset = existingCategorySeedPreset.length > 0
        ? existingCategorySeedPreset
        : resolveSeedCategoryBlueprint({
            enabledModules: resolvedEnabledModules,
            businessType: match.businessType.name,
            industry: match.industry.industry,
            businessContexts,
        })
            .filter((entry) => entry.type === 'product')
            .map((entry) => entry.name);

    const industryKey = toKey(match.industry.key || match.industry.industry);
    const industryIcon = INDUSTRY_ICON_MAP[industryKey] || '🏢';

    return {
        industry: match.industry.industry,
        industryKey,
        industryIcon,
        businessType: match.businessType.name,
        businessTypeKey: toKey(match.businessType.key || match.businessType.name),
        description: match.businessType.description || '',
        businessContexts,
        enabledModules: resolvedEnabledModules,
        featureFlags,
        attributePool,
        attributeSetPresets,
        categorySeedPreset,
    };
}


export type BusinessTemplateDiff = {
    industry: string;
    businessType?: string;
    action: 'insert' | 'update' | 'unchanged';
    field?: string;
    before?: unknown;
    after?: unknown;
};

export type SyncResult = {
    insertedIndustries: number;
    updatedIndustries: number;
    unchangedIndustries: number;
    totalIndustries: number;
    diffs: BusinessTemplateDiff[];
};

export async function syncSystemBusinessTemplates(
    db: Db,
    options: { dryRun?: boolean } = {}
): Promise<SyncResult> {
    const { dryRun = false } = options;
    const collection = db.collection('business_templates');
    const existingDocs = await collection.find({}).toArray();
    const existingByIndustry = new Map<string, Record<string, unknown>>();

    for (const item of existingDocs) {
        // Use key if available, otherwise fallback to normalized industry name
        const key = typeof item.key === 'string' && item.key.trim()
            ? item.key
            : toKey(typeof item.industry === 'string' ? item.industry : '');
        if (!key) continue;
        existingByIndustry.set(key, item as Record<string, unknown>);
    }

    let insertedIndustries = 0;
    let updatedIndustries = 0;
    let unchangedIndustries = 0;
    const diffs: BusinessTemplateDiff[] = [];
    const now = new Date();

    for (const industryEntry of catalog.industries) {
        const industryKey = industryEntry.key || toKey(industryEntry.industry);
        const existingIndustry = existingByIndustry.get(industryKey);
        const existingTypes = Array.isArray(existingIndustry?.businessTypes) ? existingIndustry?.businessTypes : [];
        const existingTypeMap = new Map<string, SystemBusinessType>();

        for (const typeEntry of existingTypes) {
            if (!isRecord(typeEntry)) continue;
            const key = toKey(typeof typeEntry.key === 'string' ? typeEntry.key : '');
            const name = toKey(typeof typeEntry.name === 'string' ? typeEntry.name : '');
            if (key) existingTypeMap.set(key, typeEntry as SystemBusinessType);
            if (name && !existingTypeMap.has(name)) existingTypeMap.set(name, typeEntry as SystemBusinessType);
        }

        const mergedTypes: SystemBusinessType[] = industryEntry.businessTypes.map((catalogType) => {
            const existingType = existingTypeMap.get(toKey(catalogType.key)) || existingTypeMap.get(toKey(catalogType.name)) || null;
            const resolved = findBusinessTemplateFromCatalog({
                industry: industryEntry.industry,
                businessType: catalogType.name,
                existingType,
            });

            if (!resolved) return existingType || catalogType;

            const merged: SystemBusinessType = {
                ...(existingType || {}),
                key: typeof existingType?.key === 'string' && existingType.key.trim() ? existingType.key : resolved.businessTypeKey,
                name: resolved.businessType,
                icon: typeof existingType?.icon === 'string' && existingType.icon.trim() ? existingType.icon : resolved.industryIcon,
                description: typeof existingType?.description === 'string' && existingType.description.trim()
                    ? existingType.description
                    : resolved.description,
                enabledModules: resolved.enabledModules,
                featureFlags: resolved.featureFlags,
                businessContexts: resolved.businessContexts,
                attributePool: resolved.attributePool,
                attributeSets: resolved.attributeSetPresets,
                attributeSetPreset: resolved.attributeSetPresets,
                categorySeedPreset: resolved.categorySeedPreset,

            };

            if (!merged.createdAt) merged.createdAt = now;
            return merged;
        });

        const existingTypeKeys = new Set(mergedTypes.map((entry) => toKey(typeof entry.key === 'string' ? entry.key : String(entry.name || ''))));
        for (const typeEntry of existingTypes) {
            if (!isRecord(typeEntry)) continue;
            const normalized = toKey(typeof typeEntry.key === 'string' ? typeEntry.key : String(typeEntry.name || ''));
            if (normalized && existingTypeKeys.has(normalized)) continue;
            mergedTypes.push(typeEntry as SystemBusinessType);
        }

        const industryDoc: Record<string, unknown> = {
            ...(existingIndustry || {}),
            industry: industryEntry.industry,
            key: typeof existingIndustry?.key === 'string' && existingIndustry.key.trim() ? existingIndustry.key : industryEntry.key,
            icon: typeof existingIndustry?.icon === 'string' && existingIndustry.icon.trim()
                ? existingIndustry.icon
                : (INDUSTRY_ICON_MAP[industryKey] || '🏢'),
            businessTypes: mergedTypes,
            source: 'business-attributes-catalog',
        };
        delete industryDoc._id;

        if (!industryDoc.createdAt) industryDoc.createdAt = now;

        const nextComparable = JSON.stringify(toComparableValue({
            industry: industryDoc.industry,
            key: industryDoc.key,
            icon: industryDoc.icon,
            source: industryDoc.source,
            businessTypes: industryDoc.businessTypes,
        }));
        const existingComparable = JSON.stringify(toComparableValue({
            industry: existingIndustry?.industry,
            key: existingIndustry?.key,
            icon: existingIndustry?.icon,
            source: existingIndustry?.source,
            businessTypes: existingIndustry?.businessTypes,
        }));

        if (existingIndustry?._id) {
            if (nextComparable === existingComparable) {
                unchangedIndustries += 1;
                diffs.push({ industry: industryEntry.industry, action: 'unchanged' });
                continue;
            }

            // Compute field-level diffs for business types
            const catalogTypeMap = new Map<string, SystemBusinessType>();
            for (const mt of mergedTypes) {
                const k = toKey(typeof mt.key === 'string' ? mt.key : String(mt.name || ''));
                if (k) catalogTypeMap.set(k, mt);
            }
            for (const [btKey, merged] of catalogTypeMap.entries()) {
                const before = existingTypeMap.get(btKey);
                if (!before) {
                    diffs.push({ industry: industryEntry.industry, businessType: String(merged.name || btKey), action: 'insert' });
                    continue;
                }
                const diffFields: string[] = ['enabledModules', 'featureFlags', 'businessContexts', 'attributePool', 'categorySeedPreset', 'description'];
                for (const field of diffFields) {
                    const bVal = JSON.stringify(toComparableValue((before as Record<string, unknown>)[field]));
                    const aVal = JSON.stringify(toComparableValue((merged as Record<string, unknown>)[field]));
                    if (bVal !== aVal) {
                        diffs.push({
                            industry: industryEntry.industry,
                            businessType: String(merged.name || btKey),
                            action: 'update',
                            field,
                            before: (before as Record<string, unknown>)[field],
                            after: (merged as Record<string, unknown>)[field],
                        });
                    }
                }
            }

            updatedIndustries += 1;
            if (!dryRun) {
                industryDoc.updatedAt = now;
                await collection.updateOne(
                    { _id: existingIndustry._id },
                    { $set: industryDoc }
                );
            }
        } else {
            insertedIndustries += 1;
            diffs.push({ industry: industryEntry.industry, action: 'insert' });
            if (!dryRun) {
                industryDoc.updatedAt = now;
                await collection.insertOne(industryDoc);
            }
        }
    }

    const totalIndustries = dryRun
        ? existingDocs.length + insertedIndustries
        : await collection.countDocuments();

    return { insertedIndustries, updatedIndustries, unchangedIndustries, totalIndustries, diffs };
}


