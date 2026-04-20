import * as XLSX from 'xlsx';
import { deriveBusinessContexts } from '@/lib/business-context';
import { enforceModuleSelectionRules } from '@/lib/module-rules';
import { resolveSeedCategoryBlueprint } from '@/lib/category-seeds';

type AttributeType = 'select' | 'text' | 'multiselect' | 'number' | 'boolean';

export interface ImportedAttributeDefinition {
    key: string;
    label: string;
    type: AttributeType;
    options: string[];
    hint?: string;
}

export interface ImportedVerticalDefinition {
    key: string;
    name: string;
    description: string;
    attributePool: string[];
    attributeSetPreset: {
        key: string;
        name: string;
        appliesTo: 'product';
        attributes: ImportedAttributeDefinition[];
    }[];
    vocabulary: {
        key: string;
        terms: {
            catalogPlural: string;
            catalogSingular: string;
            categories: string;
            attributes: string;
            orders: string;
        };
        navOverrides: Record<string, { label: string; path: string }>;
    };
}

export interface ParsedBusinessAttributeWorkbook {
    industryKey: string;
    industryName: string;
    sheetName: string;
    verticals: ImportedVerticalDefinition[];
    warnings: string[];
}

const REAL_ESTATE_VERTICAL_DESCRIPTION: Record<string, string> = {
    'property-listing-brokerage': 'Manage residential/commercial listings, brokerage transactions, lead qualification, and deal closure lifecycle.',
    'coworking-shared-space': 'Manage shared space inventory, seat/cabin allocations, plans, memberships, and occupancy operations.',
    'property-management-service': 'Manage managed properties, tenant contracts, service requests, maintenance workflows, and compliance records.',
    'property-development-project': 'Manage development projects, unit inventory, launch stages, possession milestones, and project sales lifecycle.',
    'real-estate-consulting-valuation': 'Manage consulting/valuation engagements, valuation methodologies, advisory deliverables, and client reports.',
    'real-estate-investment-product': 'Manage investment products, expected returns, risk profiles, lock-in rules, and investor lifecycle records.',
};

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
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
}

function uniqueStrings(items: string[]): string[] {
    return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)));
}

function parseOptions(value: string): string[] {
    const cleaned = value
        .replace(/[•]/g, ',')
        .replace(/\s+or\s+/gi, '/')
        .replace(/\u2013|\u2014/g, '-')
        .trim();

    if (!cleaned) return [];
    if (/^(na|n\/a|not applicable)$/i.test(cleaned)) return [];

    const parts = cleaned
        .split(/\r?\n|\/|,|;|\|/)
        .map((item) => item.trim())
        .filter(Boolean);

    return uniqueStrings(parts);
}

function inferAttributeType(rawValue: string, options: string[]): AttributeType {
    const normalized = rawValue.trim().toLowerCase();
    if (!normalized) return 'text';
    if (/yes\s*\/\s*no|true\s*\/\s*false/.test(normalized)) return 'boolean';
    if (options.length > 1) return 'select';
    if (options.length === 1) return 'select';
    if (/\b(number|count|qty|quantity|area|size|sqft|sq\.?\s*ft)\b/.test(normalized)) return 'number';
    return 'text';
}

function inferVocabularyForVertical(verticalName: string): ImportedVerticalDefinition['vocabulary'] {
    const key = normalizeToken(verticalName);

    let terms = {
        catalogPlural: 'Listings',
        catalogSingular: 'Listing',
        categories: 'Property Categories',
        attributes: 'Property Attributes',
        orders: 'Leads',
    };

    if (key.includes('coworking') || key.includes('shared-space')) {
        terms = {
            catalogPlural: 'Spaces',
            catalogSingular: 'Space',
            categories: 'Space Categories',
            attributes: 'Space Attributes',
            orders: 'Bookings',
        };
    } else if (key.includes('management')) {
        terms = {
            catalogPlural: 'Managed Properties',
            catalogSingular: 'Managed Property',
            categories: 'Property Segments',
            attributes: 'Management Attributes',
            orders: 'Service Requests',
        };
    } else if (key.includes('development')) {
        terms = {
            catalogPlural: 'Projects',
            catalogSingular: 'Project',
            categories: 'Project Segments',
            attributes: 'Project Attributes',
            orders: 'Bookings',
        };
    } else if (key.includes('consulting') || key.includes('valuation')) {
        terms = {
            catalogPlural: 'Advisory Cases',
            catalogSingular: 'Advisory Case',
            categories: 'Advisory Categories',
            attributes: 'Case Attributes',
            orders: 'Engagements',
        };
    } else if (key.includes('investment')) {
        terms = {
            catalogPlural: 'Investment Products',
            catalogSingular: 'Investment Product',
            categories: 'Investment Categories',
            attributes: 'Investment Attributes',
            orders: 'Subscriptions',
        };
    }

    return {
        key: `real-estate-${key}-vocabulary`,
        terms,
        navOverrides: {
            'nav.products': { label: terms.catalogPlural, path: '/ecommerce' },
            'nav.products.categories': { label: terms.categories, path: '/ecommerce/categories' },
            'nav.products.attributes': { label: terms.attributes, path: '/ecommerce/attributes' },
            'nav.ecommerce.orders': { label: terms.orders, path: '/ecommerce/orders' },
        },
    };
}

function inferDefaultModules(vertical: ImportedVerticalDefinition): string[] {
    const key = normalizeToken(vertical.key);
    const modules = new Set<string>(['website', 'products', 'media', 'invoicing', 'marketing', 'blog']);

    if (key.includes('coworking') || key.includes('shared-space') || key.includes('listing') || key.includes('development')) {
        modules.add('bookings');
    }

    if (
        key.includes('listing') ||
        key.includes('management') ||
        key.includes('development') ||
        key.includes('investment') ||
        key.includes('consulting')
    ) {
        modules.add('ecommerce');
    }

    modules.add('portfolio');
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

export function getDefaultTemplateShapeFromVertical(input: {
    industryKey: string;
    vertical: ImportedVerticalDefinition;
    icon?: string;
}): {
    enabledModules: string[];
    featureFlags: Record<string, boolean>;
    businessContexts: string[];
    categorySeedPreset: string[];
    icon: string;
} {
    const enabledModules = inferDefaultModules(input.vertical);
    const featureFlags = inferFeatureFlags(enabledModules);
    const derivedContexts = deriveBusinessContexts({
        businessType: input.vertical.name,
        businessContexts: [input.industryKey, input.vertical.key],
    });
    const businessContexts = uniqueStrings([input.industryKey, input.vertical.key, ...derivedContexts]);
    const categorySeedPreset = resolveSeedCategoryBlueprint({
        enabledModules,
        businessType: input.vertical.name,
        industry: input.industryKey,
        businessContexts,
    })
        .filter((entry) => entry.type === 'product')
        .map((entry) => entry.name);

    return {
        enabledModules,
        featureFlags,
        businessContexts,
        categorySeedPreset,
        icon: input.icon || '🏢',
    };
}

export function parseBusinessAttributeWorkbook(buffer: Buffer, input?: {
    industryName?: string;
    industryKey?: string;
}): ParsedBusinessAttributeWorkbook {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) {
        throw new Error('Workbook is empty.');
    }
    const sheet = workbook.Sheets[firstSheet];
    const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        raw: false,
        defval: '',
    }) as unknown[][];

    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error('No tabular rows found in workbook.');
    }

    let headerRowIndex = rows.findIndex((row) => {
        if (!Array.isArray(row) || row.length < 2) return false;
        const firstCell = String(row[0] || '').toLowerCase();
        return firstCell.includes('attribute');
    });
    if (headerRowIndex < 0) headerRowIndex = 0;

    const headerRow = rows[headerRowIndex] || [];
    const verticalColumns: Array<{ index: number; name: string; key: string }> = [];
    for (let col = 1; col < headerRow.length; col += 1) {
        const name = String(headerRow[col] || '').trim();
        if (!name) continue;
        const key = normalizeToken(name);
        if (!key) continue;
        verticalColumns.push({ index: col, name, key });
    }

    if (verticalColumns.length === 0) {
        throw new Error('No business vertical columns found. Expected columns after "Attribute Pool".');
    }

    const verticalAttributeMap = new Map<string, Map<string, ImportedAttributeDefinition>>();
    for (const column of verticalColumns) {
        verticalAttributeMap.set(column.key, new Map());
    }

    const warnings: string[] = [];
    for (let rowIdx = headerRowIndex + 1; rowIdx < rows.length; rowIdx += 1) {
        const row = rows[rowIdx];
        if (!Array.isArray(row)) continue;
        const rawLabel = String(row[0] || '').trim();
        if (!rawLabel) continue;

        const label = rawLabel.replace(/\s+/g, ' ').trim();
        const key = normalizeToken(label);
        if (!key) continue;

        for (const vertical of verticalColumns) {
            const rawCell = String(row[vertical.index] || '').trim();
            if (!rawCell) continue;

            const options = parseOptions(rawCell);
            const type = inferAttributeType(rawCell, options);
            const verticalMap = verticalAttributeMap.get(vertical.key);
            if (!verticalMap) continue;

            const existing = verticalMap.get(key);
            if (existing) {
                existing.options = uniqueStrings([...existing.options, ...options]);
                if (existing.type !== 'boolean' && type === 'boolean') existing.type = 'boolean';
                continue;
            }

            verticalMap.set(key, {
                key,
                label,
                type,
                options,
            });
        }
    }

    const industryName = (input?.industryName || 'Real Estate & Property').trim();
    const industryKey = normalizeToken(input?.industryKey || industryName);
    const verticals: ImportedVerticalDefinition[] = [];

    for (const vertical of verticalColumns) {
        const attributeMap = verticalAttributeMap.get(vertical.key);
        const attributes = attributeMap ? Array.from(attributeMap.values()) : [];
        if (attributes.length === 0) {
            warnings.push(`Vertical "${vertical.name}" had no mapped attributes and was skipped.`);
            continue;
        }

        const description = REAL_ESTATE_VERTICAL_DESCRIPTION[vertical.key]
            || `Manage ${toTitleCase(vertical.name)} workflows and their business-specific attribute model.`;
        const attributePool = attributes.map((item) => item.key);
        const vocabulary = inferVocabularyForVertical(vertical.name);

        verticals.push({
            key: vertical.key,
            name: vertical.name,
            description,
            attributePool,
            attributeSetPreset: [
                {
                    key: `${industryKey}-${vertical.key}-core`,
                    name: `${vertical.name} Attributes`,
                    appliesTo: 'product',
                    attributes,
                },
            ],
            vocabulary,
        });
    }

    return {
        industryKey,
        industryName,
        sheetName: firstSheet,
        verticals,
        warnings,
    };
}
