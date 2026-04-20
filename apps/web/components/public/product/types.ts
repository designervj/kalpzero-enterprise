export type GalleryItem = { id: string; url: string; alt?: string; order?: number };
export type ProductOption = {  
      key: string,
      label: string,
      values: string[],
      useForVariants: boolean
    };

export type Variant = {
    _id?: string;
    sku?: string;
    title?: string;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    status?: string;
    optionValues?: Record<string, string>;
    imageId?: string;
};

export type Product = {
    _id?: any;
    type?: string;
    name?: string;
    slug?: string;
    sku?: string;
    status?: string;
    categoryIds?: string[];
    attributeSetId?: string;

    description?: string;
    price?: number;
    pricing?: {
        price?: number;
        compareAtPrice?: number;
        costPerItem?: number;
        chargeTax?: boolean;
        trackQuantity?: boolean;
    };
    options?: ProductOption[];
    sourceRefs?: [];
    gallery?: GalleryItem[];
    images?: string[];
    primaryImageId?: string;
    primaryCategoryId?: string;

    relatedProductIds?: string[];
    businessType?: string;
    templateKey?: string;
    createdAt?: any;
    updatedAt?: any;
};

export type RelatedProduct = { _id: string; name?: string; slug?: string; price?: number; primaryImage?: string };

export interface ProductLayoutProps {
    product: Product;
    variants: Variant[];
    gallery: GalleryItem[];
    images: string[];
    options: ProductOption[];
    relatedProducts: RelatedProduct[];
    basePrice: number;
    compareAtPrice: number;
    primaryImg: string;
    tenantKey: string;
    tenantSlug: string;
    cartEnabled: boolean;
    checkoutEnabled: boolean;
}
