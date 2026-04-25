import { createAsyncThunk } from "@reduxjs/toolkit";
import { Warehouse } from "./WarehouseType";
import { buildApiUrl } from "@/lib/api";

// Fetch all warehouses
export const fetchWarehouses = createAsyncThunk<
  Warehouse[],
  { auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("warehouse/fetchWarehouses", async ({ auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/warehouses");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });
     
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch warehouses");
    }
    
    const data = await response.json();
    const result = data?.warehouses || data;
    return (Array.isArray(result) ? result : []) as Warehouse[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch warehouses");
  }
});

// Create a new warehouse
export const createWarehouse = createAsyncThunk<
  Warehouse,
  { warehouseData: Partial<Warehouse>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("warehouse/createWarehouse", async ({ warehouseData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/warehouses");
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(warehouseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create warehouse");
    }
    const data = await response.json();
    return data.data as Warehouse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create warehouse");
  }
});

// Update a warehouse
export const updateWarehouse = createAsyncThunk<
  Warehouse,
  { id: string; warehouseData: Partial<Warehouse>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("warehouse/updateWarehouse", async ({ id, warehouseData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/warehouses/${id}`);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(warehouseData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update warehouse");
    }
    const result = await response.json();
    return result.data as Warehouse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update warehouse");
  }
});

// Delete a warehouse
export const deleteWarehouse = createAsyncThunk<
  string,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("warehouse/deleteWarehouse", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/warehouses/${id}`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete warehouse");
    }
    
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete warehouse");
  }
});

// Save warehouse (unified create/update)
export const saveWarehouse = createAsyncThunk<
  Warehouse,
  { id?: string; warehouseData: Partial<Warehouse>; auth_token: string; "x-tenant-db": string },
  { dispatch: any; rejectValue: string }
>("warehouse/saveWarehouse", async ({ id, warehouseData, auth_token, "x-tenant-db": xTenantDb }, { dispatch, rejectWithValue }) => {
  try {
    let action;
    if (id) {
      action = await dispatch(updateWarehouse({ id, warehouseData, auth_token, "x-tenant-db": xTenantDb }));
    } else {
      action = await dispatch(createWarehouse({ warehouseData, auth_token, "x-tenant-db": xTenantDb }));
    }

    if (updateWarehouse.fulfilled.match(action) || createWarehouse.fulfilled.match(action)) {
      return action.payload as Warehouse;
    } else {
      return rejectWithValue(action.payload as string);
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Save operation failed");
  }
});

// Fetch warehouse by ID
export const fetchWarehouseById = createAsyncThunk<
  Warehouse,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("warehouse/fetchWarehouseById", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/warehouses/${id}`);
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch warehouse details");
    }
    const data = await response.json();
    return data.data as Warehouse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch warehouse details");
  }
});
