
import type { AdminWorkspace } from '@/lib/admin-workspace';

export type CapabilityDefinition = {
    key: string;
    label: string;
    moduleKey: string;
    parentKey?: string;
    status?: 'active' | 'disabled' | 'draft';
    defaultEnabled?: boolean;
    businessContexts?: string[];
};

export type AgencyPlanTier = {
    key: string;
    name: string;
    badge?: string;
    price?: number;
    currency?: string;
    billingCycle?: string;
};


export type TenantSettingsFormState = {
    name: string;
    industry: string;
    googleAnalyticsId: string;
    businessType: string;
    accountType: 'business' | 'personal_portfolio';
    provisioningMode: 'full_tenant' | 'lite_profile';
    subscriptionLevel: string;
    agencyPlanKey: string;
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    enabledModules: string[];
    enabledFeatures: string[];
    enabledOptions: string[];
    enabledPlugins: string[];
    featureFlags: Record<string, boolean>;
    languages: string[];
    primaryLanguage: string;
    aiRuntime: {
        defaultModel: string;
        fallbackModels: string[];
        temperature: number;
        managedConnectorEnabled: boolean;
        byokConnectorEnabled: boolean;
    };
    claimStatus: string;
    publicProfile: {
        slug: string;
        visibility: string;
        headline: string;
        summary: string;
        seoTitle: string;
        seoDescription: string;
        canonicalDomain: string;
        subdomain: string;
    };
    commercePublishPolicy: {
        cartEnabled: boolean;
        checkoutEnabled: boolean;
        includeTransactionalInSitemap: boolean;
        transactionalNoindex: boolean;
    };
    brandKit: Record<string, any>;
};

export type BrandAssetKey = 'light' | 'dark' | 'thumbnail' | 'favicon';

export type BrandAssetSpec = {
    key: BrandAssetKey;
    label: string;
    guidance: string;
    accept: string;
    acceptLabel: string;
    maxBytes: number;
};

export interface Tenant {
    // Fields from the updated backend API
    id?: string;
    agency_id?: string;
    slug?: string;
    display_name?: string;
    infra_mode?: string;
    business_type?: string | null;
    created_at?: string;
    dedicated_profile_id?: string | null;
    feature_flags?: string[];
    mongo_db_name?: string;
    runtime_documents?: {
        kind: string;
        mode: string;
        database: string;
        collection_count: number;
        collections: Record<string, any>;
    };
    vertical_packs?: string[];

    // Legacy fields
    _id?: string;
    key?: string;
    name?: string;
    industry?: string;
    googleAnalyticsId?: string;
    businessType?: string;
    brand?: BrandColors;
    languages?: string[];
    primaryLanguage?: string;
    publicProfile?: PublicProfile;
    brandKit?: {
        logo?: Record<string, string>;
    };
    enabledFeatures?: string[];
    enabledOptions?: string[];
    enabledPlugins?: string[];
    enabledModules?: string[];
    featureFlags?: FeatureFlags;
    aiRuntime?: AiRuntime;

    accountType?: string;
    provisioningMode?: string;
    subscriptionLevel?: string;
    agencyPlanKey?: string;


    businessContexts?: string[];
    activeBusinessContexts?: string[];
    vocabularyProfile?: VocabularyProfile;

    communityProfile?: CommunityProfile;
    claimStatus?: string;
    lifecycleStatus?: string;
    agencyId?: { $oid?: string };

    services?: Record<string, any>;
    createdAt?: { $date?: string };
    createdBy?: string;
    agencyPlan?: AgencyPlan;

    agencyPlanSource?: string;


    frontendProfile?: FrontendProfile;
    adminWorkspace?: AdminWorkspace | null;


    updatedAt?: { $date?: string };


}

export interface VocabularyProfile {
    version: number;
    key: string;
    source: string;
    generatedAt: { $date: string };
    contexts: string[];
    businessType: string;
    industry: string;
    terms: {
        catalogPlural: string;
        catalogSingular: string;
        categories: string;
        attributes: string;
        orders: string;
    };
    navOverrides: Record<string, { label: string; path: string }>;
}

export interface PublicProfile {
    slug?: string;
    visibility?: string;
    headline?: string;
    summary?: string;
    heroImage?: string;
    seoTitle?: string;
    seoDescription?: string;
    canonicalDomain?: string;
    subdomain?: string;
    claimStatus?: string;
}

export interface CommunityProfile {
    shortBio: string;
    industry: string;
    businessType: string;
    preferredCity: string;
    serviceLocations: string[];
    discoveryTags: string[];
    categories: string[];
    searchKeywords: string[];
    isDiscoveryEnabled: boolean;
}

export interface FeatureFlags {
    hasMediaLibrary?: boolean;
    hasBookingEngine?: boolean;
    hasEcommerce?: boolean;
    hasInvoicing?: boolean;
    sourceModuleEnabled?: boolean;
    sourcePilotTravel?: boolean;
    hasMarketing?: boolean;
    hasPortfolio?: boolean;
    sourcePilotProducts?: boolean;
    hasBlog?: boolean;
    hasBrandKit?: boolean;
    customerCoreEnabled?: boolean;
}

export interface AgencyPlan {
    key: string;
    name: string;
    badge: string;
    price: number;
    currency: string;
    billingCycle: string;
    limits: {
        maxUsers: number;
        maxProducts: number;
        storageGb: number;
        aiCreditsMonthly: number;
        maxPublishedPages: number;
    };
    support: {
        channel: string;
        slaHours: number;
    };
    tokenPolicy: {
        lockFamilies: string[];
        requiredDefaults: string[];
        reasons: Record<string, string>;
    };
}

export interface BrandColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
}

export interface FrontendProfile {
    commercePublishPolicy?: {
        cartEnabled?: boolean;
        checkoutEnabled?: boolean;
        includeTransactionalInSitemap?: boolean;
        transactionalNoindex?: boolean;
    };
    defaultLandingTemplateKey?: string;
    tokenPolicy?: {
        lockFamilies?: string[];
        requiredDefaults?: string[];
        reasons?: Record<string, string>;
    };
}

export interface AiRuntime {
    defaultModel: string;
    fallbackModels: string[];
    temperature: number;
    managedConnectorEnabled: boolean;
    byokConnectorEnabled: boolean;
}
