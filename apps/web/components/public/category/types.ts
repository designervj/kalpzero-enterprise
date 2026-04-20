export type CategoryRecord = {
    name?: string;
    slug?: string;
    type?: string;
    description?: string;
    templateKey?: string;
    page?: {
        title?: string;
        content?: string;
        bannerImage?: string;
        status?: string;
        templateKey?: string;
        seo?: { metaTitle?: string; metaDescription?: string };
    };
};

export type FilterConfig = {
    showPriceFilter?: boolean;
    showSort?: boolean;
    showAttributeFilters?: string[];
    paginationSize?: number;
};

export type AvailableAttr = { name: string; values: string[] };

export type ProductRecord = {
    _id: string;
    name?: string;
    slug?: string;
    sku?: string;
    price?: number;
    primaryImage?: string;
    stock?: number;
    optionValues?: Record<string, string[]>;
};

export type BlogRecord = {
    _id: string;
    title?: string;
    slug?: string;
    excerpt?: string;
    publishedAt?: string;
    coverImage?: string;
    tags?: string[];
};

export type PortfolioRecord = {
    _id: string;
    title?: string;
    slug?: string;
    description?: string;
    thumbnailUrl?: string;
    tags?: string[];
};

export interface CategoryLayoutProps {
    category: CategoryRecord;
    tenantKey: string;
    tenantHint: string;
    preview: boolean;

    // Config
    filterConfig: FilterConfig;

    // Lists
    products: ProductRecord[];
    blogs: BlogRecord[];
    portfolioItems: PortfolioRecord[];

    // Meta
    total: number;
    currentPage: number;
    totalPages: number;
    pageSize: number;
    availableAttributes: AvailableAttr[];
}
