import { getMasterDb } from '@/lib/db';

export type CommercePublishPolicy = {
    cartEnabled: boolean;
    checkoutEnabled: boolean;
    includeTransactionalInSitemap: boolean;
    transactionalNoindex: boolean;
};

export type TenantCommerceContext = {
    tenantKey: string;
    tenantSlug: string;
    policy: CommercePublishPolicy;
};

const DEFAULT_POLICY: CommercePublishPolicy = {
    cartEnabled: true,
    checkoutEnabled: true,
    includeTransactionalInSitemap: false,
    transactionalNoindex: true,
};

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => item.trim().toLowerCase())
                .filter(Boolean)
        )
    );
}

export function resolveCommercePublishPolicy(input: {
    frontendProfile?: unknown;
    enabledModules?: unknown;
}): CommercePublishPolicy {
    const profile = input.frontendProfile && typeof input.frontendProfile === 'object' && !Array.isArray(input.frontendProfile)
        ? input.frontendProfile as Record<string, unknown>
        : {};
    const raw = profile.commercePublishPolicy && typeof profile.commercePublishPolicy === 'object' && !Array.isArray(profile.commercePublishPolicy)
        ? profile.commercePublishPolicy as Record<string, unknown>
        : {};

    const enabledModules = normalizeStringArray(input.enabledModules);
    const ecommerceEnabled = enabledModules.length === 0
        ? true
        : enabledModules.includes('ecommerce') || enabledModules.includes('products');
    const cartEnabled = ecommerceEnabled && (typeof raw.cartEnabled === 'boolean' ? raw.cartEnabled : DEFAULT_POLICY.cartEnabled);

    return {
        cartEnabled,
        checkoutEnabled: cartEnabled && (typeof raw.checkoutEnabled === 'boolean' ? raw.checkoutEnabled : DEFAULT_POLICY.checkoutEnabled),
        includeTransactionalInSitemap: typeof raw.includeTransactionalInSitemap === 'boolean'
            ? raw.includeTransactionalInSitemap
            : DEFAULT_POLICY.includeTransactionalInSitemap,
        transactionalNoindex: typeof raw.transactionalNoindex === 'boolean'
            ? raw.transactionalNoindex
            : DEFAULT_POLICY.transactionalNoindex,
    };
}

type TenantRecord = {
    key?: string;
    enabledModules?: unknown;
    frontendProfile?: unknown;
    publicProfile?: {
        slug?: string;
    };
};

export async function resolveTenantCommerceContextByHint(hintInput: string): Promise<TenantCommerceContext | null> {
    const hint = String(hintInput || '').trim();
    if (!hint) return null;
    const masterDb = await getMasterDb();
    const tenant = await masterDb.collection('tenants').findOne(
        {
            $or: [
                { key: hint },
                { 'publicProfile.slug': hint },
            ],
        },
        {
            projection: {
                key: 1,
                enabledModules: 1,
                frontendProfile: 1,
                publicProfile: 1,
            },
        }
    ) as TenantRecord | null;
    if (!tenant?.key) return null;

    const tenantKey = String(tenant.key);
    const tenantSlug = typeof tenant.publicProfile?.slug === 'string' && tenant.publicProfile.slug.trim()
        ? tenant.publicProfile.slug.trim()
        : tenantKey;

    return {
        tenantKey,
        tenantSlug,
        policy: resolveCommercePublishPolicy({
            frontendProfile: tenant.frontendProfile,
            enabledModules: tenant.enabledModules,
        }),
    };
}
