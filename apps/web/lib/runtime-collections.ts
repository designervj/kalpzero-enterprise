import type { Db, Document } from 'mongodb';

type RuntimeCollectionSpec = {
    name: string;
    indexes?: Array<{
        keys: Document;
        name: string;
        unique?: boolean;
    }>;
};

const MODULE_COLLECTION_SPECS: Record<string, RuntimeCollectionSpec[]> = {
    website: [
        { name: 'pages' },
        { name: 'forms' },
        { name: 'form_responses' },
        { name: 'marketing_leads' },
    ],
    products: [
        { name: 'products' },
        { name: 'variants' },
        { name: 'categories' },
        { name: 'attribute_sets' },
    ],
    ecommerce: [
        { name: 'orders' },
        { name: 'customers' },
    ],
    portfolio: [
        { name: 'portfolio_items' },
    ],
    blog: [
        { name: 'blog_posts' },
        { name: 'comments' },
    ],
    media: [
        { name: 'media' },
    ],
    invoicing: [
        { name: 'invoices' },
    ],
    hotel_management: [
        { name: 'hotels' },
        { name: 'rooms' },
        { name: 'room_types' },
        { name: 'amenities' },
        { name: 'bookings' },
        { name: 'housekeeping_tasks' },
        { name: 'maintenance_tickets' },
        { name: 'meal_plans' },
        { name: 'pricing_rules' },
        { name: 'guests' },
        { name: 'staff' },
    ],
    tour_management: [
        { name: 'tours' },
        { name: 'tour_packages' },
        { name: 'activities' },
        { name: 'departures' },
        { name: 'tour_bookings' },
        { name: 'travelers' },
        { name: 'transfers' },
        { name: 'accommodations' },
        { name: 'tour_pricing_rules' },
    ],
};

const PLUGIN_COLLECTION_SPECS: Record<string, RuntimeCollectionSpec[]> = {
    proposal_builder: [
        {
            name: 'proposals',
            indexes: [
                { keys: { slug: 1 }, name: 'slug_idx' },
                { keys: { status: 1, updatedAt: -1 }, name: 'status_updated_idx' },
            ],
        },
    ],
    catalog_builder: [
        {
            name: 'catalogs',
            indexes: [
                { keys: { slug: 1 }, name: 'slug_idx' },
                { keys: { status: 1, updatedAt: -1 }, name: 'status_updated_idx' },
            ],
        },
    ],
    resume_builder: [
        {
            name: 'resumes',
            indexes: [
                { keys: { slug: 1 }, name: 'slug_idx' },
                { keys: { status: 1, updatedAt: -1 }, name: 'status_updated_idx' },
            ],
        },
    ],
    portfolio_builder: [
        {
            name: 'portfolio_profiles',
            indexes: [
                { keys: { slug: 1 }, name: 'slug_idx' },
                { keys: { status: 1, updatedAt: -1 }, name: 'status_updated_idx' },
            ],
        },
    ],
};

function normalizeStringList(value: unknown): string[] {
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

function collectRequiredSpecs(input: {
    enabledModules?: unknown;
    enabledPlugins?: unknown;
}): RuntimeCollectionSpec[] {
    const enabledModules = normalizeStringList(input.enabledModules);
    const enabledPlugins = normalizeStringList(input.enabledPlugins);
    const specs = new Map<string, RuntimeCollectionSpec>();

    for (const moduleKey of enabledModules) {
        for (const spec of MODULE_COLLECTION_SPECS[moduleKey] || []) {
            specs.set(spec.name, spec);
        }
    }
    for (const pluginKey of enabledPlugins) {
        for (const spec of PLUGIN_COLLECTION_SPECS[pluginKey] || []) {
            specs.set(spec.name, spec);
        }
    }

    return Array.from(specs.values());
}

async function ensureCollection(db: Db, spec: RuntimeCollectionSpec): Promise<void> {
    const existing = await db.listCollections({ name: spec.name }, { nameOnly: true }).toArray();
    if (existing.length === 0) {
        await db.createCollection(spec.name);
    }

    if (Array.isArray(spec.indexes) && spec.indexes.length > 0) {
        const collection = db.collection(spec.name);
        for (const index of spec.indexes) {
            await collection.createIndex(index.keys, {
                name: index.name,
                unique: index.unique === true,
            });
        }
    }
}

export async function ensureRuntimeCollections(input: {
    tenantDb: Db;
    enabledModules?: unknown;
    enabledPlugins?: unknown;
}): Promise<string[]> {
    const specs = collectRequiredSpecs(input);
    const ensured: string[] = [];
    for (const spec of specs) {
        await ensureCollection(input.tenantDb, spec);
        ensured.push(spec.name);
    }
    return ensured;
}
