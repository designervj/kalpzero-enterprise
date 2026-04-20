export interface MarketingMetricsDto {
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
}

export interface MarketingAnalyticsResponseDto {
    activeCampaigns: number;
    newLeads30d: number;
    content: number;
    campaigns: { total: number; active: number };
    budget: { total: number; spent: number };
    performance: { impressions: number; clicks: number; ctr: string };
    leads: { total: number; hot: number; byStage: Record<string, number> };
    coupons: { total: number; active: number };
    posts: { total: number; scheduled: number };
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: string;
}

export interface MarketingCampaignBudgetDto {
    total: number;
    currency: string;
    perChannel?: Record<string, number>;
}

export interface MarketingCampaignDto {
    _id?: string | number | { toString(): string };
    name?: string;
    status?: string;
    channels?: string[];
    budget?: MarketingCampaignBudgetDto;
    schedule?: Record<string, unknown>;
    content?: Record<string, unknown>;
    audience?: Record<string, unknown>;
    performance?: MarketingMetricsDto;
    analytics?: MarketingMetricsDto;
    brandCompliant?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface MarketingContentItemDto {
    _id?: string | number | { toString(): string };
    type?: string;
    title?: string;
    platform?: string;
    thumbnailUrl?: string;
    dimensions?: { width?: number; height?: number };
    status?: string;
}

export interface MarketingLeadDto {
    _id?: string | number | { toString(): string };
    name?: string;
    email?: string;
    phone?: string;
    source?: { type?: string };
    score?: number;
    status?: string;
    stage?: string;
    createdAt?: string | Date;
}

export interface MarketingCouponDto {
    _id?: string | number | { toString(): string };
    code?: string;
    type?: 'percentage' | 'flat' | 'free_shipping' | 'buy_x_get_y' | string;
    value?: number;
    scope?: 'global' | 'product' | 'category' | 'firstOrder' | string;
    scopeProductIds?: string[];
    scopeCategoryIds?: string[];
    status?: 'active' | 'inactive' | string;
    usedCount?: number;
    maxUses?: number;
    startsAt?: string;
    expiresAt?: string;
    rules?: { minOrderAmount?: number; maxUsesPerUser?: number };
    createdAt?: string;
}

export interface MarketingPostDto {
    _id?: string | number | { toString(): string };
    content?: string;
    platforms?: string[];
    status?: string;
}

export interface MarketingEmailDto {
    _id?: string | number | { toString(): string };
    subject?: string;
    previewText?: string;
    status?: string;
    stats?: { sent?: number; opened?: number; clicked?: number };
}

export type MarketingSocialAccountsDto = Record<string, { connected?: boolean;[key: string]: unknown }>;
export interface MarketingAdProviderDto {
    connected?: boolean;
    status?: string;
    customerId?: string;
    businessId?: string;
    adAccountId?: string;
}

export interface MarketingAdAccountsDto {
    google?: MarketingAdProviderDto;
    meta?: MarketingAdProviderDto;
    [key: string]: MarketingAdProviderDto | undefined;
}

export interface MarketingContentFormDto {
    type: string;
    title: string;
    platform: string;
    dimensions: { width: number; height: number };
}

export interface MarketingCampaignFormDto {
    name: string;
    channels: string[];
    budget: { total: number; currency: string };
}

export interface MarketingLeadFormDto {
    name: string;
    email: string;
    phone: string;
    source: { type: string };
    tags: string[];
}

export interface MarketingCouponFormDto {
    code: string;
    type: 'percentage' | 'flat' | 'free_shipping' | string;
    value: number;
    scope: 'global' | 'product' | 'category' | 'firstOrder' | string;
    scopeProductIds?: string[];
    scopeCategoryIds?: string[];
    maxUses?: number;
    startsAt?: string;
    expiresAt?: string;
    rules: { minOrderAmount: number; maxUsesPerUser: number };
}

export interface MarketingEmailFormDto {
    subject: string;
    previewText: string;
    templateId: string;
    status: string;
    audience: { type: string };
}
