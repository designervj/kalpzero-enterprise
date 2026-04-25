
export interface Vendor {
  id?: string;
  name?: string;
  slug?: string;
  code?: string;
  description?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  status?: "active" | "inactive" | string;
  created_at?: string;
  updated_at?: string;
}

export interface VendorState {
  allVendors: Vendor[];
  currentVendor: Vendor | null;
  isFetchedVendors: boolean;
  isError: boolean;
  isLoading: boolean;
}
