
export interface Pricing {
  price: number;
  compareAtPrice: number;
  costPerItem: number;
  chargeTax: boolean;
  trackQuantity: boolean;
}

export interface ProductOption {
  attributeSetId: string;
  values: string[];
  selectedValues: string[];
  useForVariants: boolean;
  label: string;
  key: string; // e.g. "size", "color"
}
export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export interface Variant {
  id?: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;

  options: {
    [key: string]: string; // e.g. { size: "M", color: "Black" }
  };

  imageId?: string;
  inventory?: number;
}
export interface Product {
  id?: string;
  name?: string;
  slug?: string;
  sku?: string;
  description?: string;

  status?: "active" | "inactive";
  type?: "physical" | "digital";

  categoryIds?: string[];
  attributeSetIds?: string[];

  pricing?: Pricing;

  options?: ProductOption[];

  gallery?: GalleryItem[];
  primaryImageId?: string;
  primaryCategoryId?: string;

  relatedProductIds?: string[];

  templateKey?: string | null;
  formId?: string | null;

  price?: number;

  brandId?: string | null;
  brand_id?: string | null;

  vendorId?: string | null;
  vendor_id?: string | null;

  collectionIds?: string[];
  collection_ids?: string[];

  seoTitle: string | null;
  seo_title?: string | null;

  seoDescription: string | null;
  seo_description?: string | null;

  productAttributes: any[];
  product_attributes?: any[];

  variants: Variant[];

  createdAt: string;
  created_at?: string;

  updatedAt: string | null;
  updated_at?: string | null;
}

export interface ProductState {
  allProducts: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  isFetchedProducts: boolean;
  isError: boolean;
}