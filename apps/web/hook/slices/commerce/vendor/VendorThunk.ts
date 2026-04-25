import { createAsyncThunk } from "@reduxjs/toolkit";
import { Vendor } from "./VendorType";
import { buildApiUrl } from "@/lib/api";

// Fetch all vendors
export const fetchVendors = createAsyncThunk<
  Vendor[],
  { auth_token: string; "x-tenant-db": string; type?: string },
  { rejectValue: string }
>("vendor/fetchVendors", async ({ auth_token, "x-tenant-db": xTenantDb, type }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/vendors");
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
      throw new Error(errorData.error || "Failed to fetch vendors");
    }
    
    const data = await response.json();
    const result = data?.vendors || data;
    return (Array.isArray(result) ? result : []) as Vendor[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch vendors");
  }
});

// Create a new vendor
export const createVendor = createAsyncThunk<
  Vendor,
  { vendorData: Partial<Vendor>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("vendor/createVendor", async ({ vendorData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/vendors");
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(vendorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create vendor");
    }
    const data = await response.json();
    return data.data as Vendor;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create vendor");
  }
});

// Update a vendor
export const updateVendor = createAsyncThunk<
  Vendor,
  { id: string; vendorData: Partial<Vendor>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("vendor/updateVendor", async ({ id, vendorData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/vendors/${id}`);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(vendorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update vendor");
    }
    const result = await response.json();
    return result.data as Vendor;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update vendor");
  }
});

// Delete a vendor
export const deleteVendor = createAsyncThunk<
  string,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("vendor/deleteVendor", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/vendors/${id}`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete vendor");
    }
    
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete vendor");
  }
});

// Save vendor (unified create/update)
export const saveVendor = createAsyncThunk<
  Vendor,
  { id?: string; vendorData: Partial<Vendor>; auth_token: string; "x-tenant-db": string },
  { dispatch: any; rejectValue: string }
>("vendor/saveVendor", async ({ id, vendorData, auth_token, "x-tenant-db": xTenantDb }, { dispatch, rejectWithValue }) => {
  try {
    let action;
    if (id) {
      action = await dispatch(updateVendor({ id, vendorData, auth_token, "x-tenant-db": xTenantDb }));
    } else {
      action = await dispatch(createVendor({ vendorData, auth_token, "x-tenant-db": xTenantDb }));
    }

    if (updateVendor.fulfilled.match(action) || createVendor.fulfilled.match(action)) {
      return action.payload as Vendor;
    } else {
      return rejectWithValue(action.payload as string);
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Save operation failed");
  }
});
