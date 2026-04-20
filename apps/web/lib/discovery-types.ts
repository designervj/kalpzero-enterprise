export interface CommunityLocationFacet {
    country: string;
    state: string;
    city: string;
    countrySlug: string;
    stateSlug: string;
    citySlug: string;
}

export interface CommunityProfile {
    shortBio: string;
    industry: string;
    businessType: string;
    preferredCity: string;
    serviceLocations: CommunityLocationFacet[];
    discoveryTags: string[];
    categories: string[];
    searchKeywords: string[];
    isDiscoveryEnabled: boolean;
}

export interface DiscoveryFacetPolicy {
    key: string;
    enableLocationFacet: boolean;
    enableIndustryFacet: boolean;
    enableBusinessTypeFacet: boolean;
    enableTagFacet: boolean;
    enableCategoryFacet: boolean;
    minEntityCountForIndex: number;
    maxPagesPerFacetType: number;
}

export interface CrawlIndexPolicy {
    key: string;
    lowSignalNoindexThreshold: number;
    includeNoindexInFeed: boolean;
    maxFeedItems: number;
}

export interface CommunityBusinessIndexRecord {
    tenantKey: string;
    businessSlug: string;
    canonicalPath: string;
    legacyBusinessPath: string;
    reservedSubdomain: string;
    identity: {
        name: string;
        headline: string;
        summary: string;
        heroImageUrl?: string;
        coverImageUrl?: string;
        logoUrl?: string;
        thumbnailUrl?: string;
    };
    thumbnailUrl?: string;
    facets: {
        industry: string;
        industryLabel: string;
        businessType: string;
        businessTypeLabel: string;
        locations: CommunityLocationFacet[];
        tags: string[];
        categories: string[];
    };
    publishSignals: {
        isPublished: boolean;
        publishedPages: number;
        publishedCategories: number;
        productCount: number;
        portfolioCount: number;
        contentScore: number;
        qualityTier: 'low' | 'medium' | 'high';
    };
    seo: {
        title: string;
        description: string;
        robots: string;
        lastmod: Date;
    };
    updatedAt: Date;
    createdAt: Date;
}

export interface CommunityDiscoveryPageRecord {
    pageType: 'home' | 'location' | 'industry' | 'business_type' | 'tag' | 'category' | 'search_seed';
    routePath: string;
    facetKey: string;
    facetValue: string;
    entityCount: number;
    businessSlugs: string[];
    isIndexable: boolean;
    seo: {
        title: string;
        description: string;
        canonicalUrl: string;
        robots: string;
    };
    generatedFromPolicyVersion: string;
    generatedAt: Date;
    updatedAt: Date;
    createdAt: Date;
}

export interface CommunityLeadIndexRecord {
    tenantKey: string;
    formId: string;
    leadId: string;
    createdAt: Date;
    surface: string;
    sourcePath: string;
    referrerHost: string;
    utm: {
        source: string;
        medium: string;
        campaign: string;
        term: string;
        content: string;
    };
    geo: {
        country: string;
        region: string;
        city: string;
    };
    contactMask: {
        emailHash: string;
        phoneLast4: string;
    };
    updatedAt: Date;
}

export interface DiscoveryBindingManifest {
    version: string;
    templateKey: string;
    routeType:
    | 'business_profile'
    | 'category_page'
    | 'product_page'
    | 'cart_page'
    | 'checkout_page'
    | 'discovery_page';
    bindings: Array<{
        key: string;
        selector: string;
        source: string;
        transform?: string;
        fallback?: string;
    }>;
    collections: Array<{
        key: string;
        selector: string;
        source: string;
        itemTemplateKey?: string;
    }>;
    requiredFields: string[];
    seoBindings: {
        title: string;
        description: string;
        canonicalUrl: string;
        robots: string;
    };
}
