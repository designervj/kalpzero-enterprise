import { createAsyncThunk } from "@reduxjs/toolkit";
import { Brand } from "./BrandType";
import { buildApiUrl } from "@/lib/api";

// Fetch all brands
export const fetchBrands = createAsyncThunk<
  Brand[],
  { auth_token: string; "x-tenant-db": string; type?: string },
  { rejectValue: string }
>("brand/fetchBrands", async ({ auth_token, "x-tenant-db": xTenantDb, type }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/brands");
    if (type) url.searchParams.append("type", type);

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
      throw new Error(errorData.error || "Failed to fetch brands");
    }
    
    const data = await response.json();
    const result = data?.brands || data;
    return (Array.isArray(result) ? result : []) as Brand[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch brands");
  }
});

// Create a new brand
export const createBrand = createAsyncThunk<
  Brand,
  { brandData: Partial<Brand>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("brand/createBrand", async ({ brandData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/brands");
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create brand");
    }
    const data = await response.json();
    return data.data as Brand;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create brand");
  }
});

// Update a brand
export const updateBrand = createAsyncThunk<
  Brand,
  { id: string; brandData: Partial<Brand>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("brand/updateBrand", async ({ id, brandData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/brands/${id}`);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(brandData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update brand");
    }
    const result = await response.json();
    return result.data as Brand;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update brand");
  }
});

// Delete a brand
export const deleteBrand = createAsyncThunk<
  string,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("brand/deleteBrand", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/brands/${id}`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete brand");
    }
    
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete brand");
  }
});

// Save brand (unified create/update)
export const saveBrand = createAsyncThunk<
  Brand,
  { id?: string; brandData: Partial<Brand>; auth_token: string; "x-tenant-db": string },
  { dispatch: any; rejectValue: string }
>("brand/saveBrand", async ({ id, brandData, auth_token, "x-tenant-db": xTenantDb }, { dispatch, rejectWithValue }) => {
  try {
    let action;
    if (id) {
      action = await dispatch(updateBrand({ id, brandData, auth_token, "x-tenant-db": xTenantDb }));
    } else {
      action = await dispatch(createBrand({ brandData, auth_token, "x-tenant-db": xTenantDb }));
    }

    if (updateBrand.fulfilled.match(action) || createBrand.fulfilled.match(action)) {
      return action.payload as Brand;
    } else {
      return rejectWithValue(action.payload as string);
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Save operation failed");
  }
});
