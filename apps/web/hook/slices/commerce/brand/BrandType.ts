
export interface Brand {
  id?: string;
  name: string;
  slug: string;
  code: string;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BrandState {
  allBrands: Brand[];
  currentBrand: Brand | null;
  isFetchedBrands: boolean;
  isError: boolean;
  isLoading: boolean;
}
