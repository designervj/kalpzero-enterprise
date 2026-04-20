export type AiChatRole = 'system' | 'user' | 'assistant';

export interface AiChatMessage {
    role: AiChatRole;
    content: string;
}

export interface AiChatLegacyMessage {
    role: 'system' | 'user' | 'assistant' | 'agent';
    content: string;
}

export interface AiChatRequestDto {
    messages: AiChatMessage[];
}

export interface AiChatLegacyRequestDto {
    message: string;
    conversationHistory: AiChatLegacyMessage[];
}

export interface AiChatResponseDto {
    reply: string;
    source: 'openai' | 'fallback';
    error?: string;
    errorDetail?: unknown;
}

export type AiSiteFactoryPageSection = {
    title: string;
    body: string;
    bullets: string[];
};

export type AiSiteFactoryPageBlueprint = {
    slug: string;
    title: string;
    type: string;
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl?: string;
    heroImageAlt?: string;
    sections: AiSiteFactoryPageSection[];
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    metaDescription: string;
    keywords: string[];
    isHomepage?: boolean;
};

export type AiSiteFactoryOfferingBlueprint = {
    name: string;
    sku: string;
    type: string;
    category: string;
    price: number;
    description: string;
};

export type AiSiteFactoryTestimonialBlueprint = {
    quote: string;
    author: string;
};

export type AiSiteFactoryFaqBlueprint = {
    question: string;
    answer: string;
};

export type AiSiteFactoryCatalogBlueprint = {
    title: string;
    slug: string;
    intro: string;
    metaDescription: string;
};

export type AiSiteFactoryBlueprint = {
    summary: string;
    track: 'business' | 'commerce' | 'travel' | 'portfolio';
    homepage: AiSiteFactoryPageBlueprint;
    secondaryPages: AiSiteFactoryPageBlueprint[];
    offerings: AiSiteFactoryOfferingBlueprint[];
    testimonials: AiSiteFactoryTestimonialBlueprint[];
    faqs: AiSiteFactoryFaqBlueprint[];
    catalog?: AiSiteFactoryCatalogBlueprint | null;
    notes: string[];
};

export interface AiSiteFactoryRequestDto {
    brief?: string;
    createPages?: boolean;
    createProducts?: boolean;
    createCatalog?: boolean;
    publishPages?: boolean;
    forceRefreshExisting?: boolean;
}

export interface AiSiteFactoryMutationSummary {
    action: 'created' | 'updated' | 'skipped';
    slug: string;
    title: string;
}

export interface AiSiteFactoryModelsUsed {
    planner: string;
    content: string;
    products: string;
    image: string;
}

export interface AiSiteFactoryGeneratedMedia {
    kind: 'hero_image';
    title: string;
    url: string;
    alt: string;
    mimeType: string;
    prompt: string;
    source: 'openai' | 'fallback';
    model: string;
}

export interface AiSiteFactoryResponseDto {
    success: boolean;
    source: 'openai' | 'fallback';
    model: string;
    modelsUsed?: AiSiteFactoryModelsUsed;
    blueprint: AiSiteFactoryBlueprint;
    created: {
        pages: AiSiteFactoryMutationSummary[];
        products: Array<AiSiteFactoryMutationSummary & { sku: string }>;
        catalogs: AiSiteFactoryMutationSummary[];
    };
    media?: AiSiteFactoryGeneratedMedia[];
    homepageSlug: string;
    message: string;
    error?: string;
}

export function extractErrorMessage(error: unknown, fallback = 'Unknown error'): string {
    if (typeof error === 'string' && error.trim()) return error;

    if (error && typeof error === 'object') {
        const obj = error as Record<string, unknown>;

        const directMessage = obj.message;
        if (typeof directMessage === 'string' && directMessage.trim()) return directMessage;

        const nestedError = obj.error;
        if (nestedError && typeof nestedError === 'object') {
            const nestedMessage = (nestedError as Record<string, unknown>).message;
            if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
        }

        try {
            const json = JSON.stringify(error);
            if (json && json !== '{}') return json;
        } catch {
            return fallback;
        }
    }

    return fallback;
}
