
export interface Warehouse {
  id?: string;
  name?: string;
  slug?: string;
  code?: string;
  city?: string;
  country?: string;
  status?: "active" | "inactive" | string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WarehouseState {
  allWarehouses: Warehouse[];
  currentWarehouse: Warehouse | null;
  isFetchedWarehouses: boolean;
  isError: boolean;
  isLoading: boolean;
}
