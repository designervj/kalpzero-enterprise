import { createAsyncThunk } from "@reduxjs/toolkit";
import { Tenant } from "@/app/(dashboard)/settings/tenant/tenantType";
import { buildApiUrl } from "@/lib/api";
import { TenantSwitcherOption } from "./tenantType";



// Fetch all tenants
export const fetchTenants = createAsyncThunk<
  TenantSwitcherOption[],
  { auth_token: string },
  { rejectValue: string }
>("tenant/fetchTenants", async ({ auth_token }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/platform/tenants");
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`
      }
    });

    console.log(" response", response)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch tenants");
    }
    const data = await response.json();
    console.log(" all tenant  data", data)
    return data?.tenants as TenantSwitcherOption[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch tenants");
  }
});

// Create a new tenant
export const createTenant = createAsyncThunk<
  TenantSwitcherOption,
  Partial<TenantSwitcherOption>,
  { rejectValue: string }
>("tenant/createTenant", async (tenantData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tenantData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create tenant");
    }
    const data = await response.json();
    return data as TenantSwitcherOption;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create tenant");
  }
});

// Update an existing tenant
export const updateTenant = createAsyncThunk<
  Tenant,
  Tenant,
  { rejectValue: string }
>("tenant/updateTenant", async (tenantData, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/settings/tenant", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tenantData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update tenant");
    }
    const result = await response.json();
    // The API returns { success: true, modifiedCount: N }.
    // We need to return the updated tenant data for the slice.
    // Since the API doesn't return the full doc, we'll return the input data merged with identifier.
    return { ...tenantData } as Tenant;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update tenant");
  }
});

// Delete a tenant
export const deleteTenant = createAsyncThunk<
  string,
  { id?: string; key?: string; purgeTenantDb?: boolean },
  { rejectValue: string }
>(
  "tenant/deleteTenant",
  async ({ id, key, purgeTenantDb }, { rejectWithValue }) => {
    try {
      const url = new URL("/api/admin/tenants", window.location.origin);
      if (id) url.searchParams.append("id", id);
      if (key) url.searchParams.append("key", key);
      if (purgeTenantDb) url.searchParams.append("purgeTenantDb", "1");

      const response = await fetch(url.toString(), {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete tenant");
      }
      return key || id || "";
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete tenant");
    }
  },
);

// Fetch a single tenant by ID
export const  fetchTenantById = createAsyncThunk<
  Tenant,
  { id: string; auth_token: string },
  { rejectValue: string }
>("tenant/fetchTenantById", async ({ id, auth_token }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/platform/tenant");
    url.searchParams.append("id", id); // May not be strictly necessary, but keeping it to not break interfaces

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}` // the backend accepts this based on api.ts 'request' fn
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch tenant");
    }
  
    const data = await response.json();
   
    return data as Tenant;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch tenant");
  }
});
