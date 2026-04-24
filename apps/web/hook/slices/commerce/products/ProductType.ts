
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
  draftValue?: string;
}
export interface GalleryItem {
  id: string;
  url: string;
  alt: string;
  order: number;
}

export interface ProductAttribute {
  attributeId: string;
  value: string;
}

export interface Variant {
  id?: string;
  sku?: string;
  title?: string;
  price?: number;
  currency?: string;
  stock?: number;
  attributeValues?: ProductAttribute[];
  compareAtPrice?: number;
  imageId?: string;
  // UI Helper
  optionValues?: {
    [key: string]: string;
  };
  status?: string;
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

  pricing?: Pricing; // Keep for UI compatibility
  options?: ProductOption[]; // Keep for UI compatibility

  gallery?: GalleryItem[];
  primaryImageId?: string;
  primaryCategoryId?: string;

  relatedProductIds?: string[];

  templateKey?: string | null;
  formId?: string | null;

  price?: number;

  brandId?: string | null;
  vendorId?: string | null;

  collectionIds?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  productAttributes?: ProductAttribute[];
  variants?: Variant[];

  createdAt?: string;
  updatedAt?: string;
}

export interface ProductState {
  allProducts: Product[];
  currentProduct: Product | null;
  isLoading: boolean;
  isFetchedProducts: boolean;
  isError: boolean;
}