import { createAsyncThunk } from "@reduxjs/toolkit";
import { AttributeSetItem } from "./attributeType";
import { getApiBaseUrl } from "@/lib/api";

// Fetch all attribute sets
export const fetchAttributes = createAsyncThunk<
  AttributeSetItem[],
  { auth_token: string; "x-tenant-db": string; type?: string },
  { rejectValue: string }
>("attribute/fetchAttributes", async ({ auth_token, "x-tenant-db": xTenantDb, type }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/attribute-sets`);
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
      throw new Error(errorData.error || "Failed to fetch attributes");
    }
    
    const data = await response.json();
    return (data?.data || data) as AttributeSetItem[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch attributes");
  }
});

// Create a new attribute set
export const createAttributeSet = createAsyncThunk<
  AttributeSetItem,
  { payload: any; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("attribute/createAttributeSet", async ({ payload, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/attribute-sets`);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create attribute set");
    }
    const data = await response.json();
    return data.data as AttributeSetItem;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create attribute set");
  }
});

// Update an attribute set
export const updateAttributeSet = createAsyncThunk<
  AttributeSetItem,
  { id: string; payload: any; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("attribute/updateAttributeSet", async ({ id, payload, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/attribute-sets/${id}`);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update attribute set");
    }
    const result = await response.json();
    return result.data as AttributeSetItem;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update attribute set");
  }
});

// Delete an attribute set
export const deleteAttributeSet = createAsyncThunk<
  string,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("attribute/deleteAttributeSet", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/attribute-sets/${id}`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete attribute set");
    }
    
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete attribute set");
  }
});

// Bulk import
export const bulkImportAttributes = createAsyncThunk<
  any,
  { data: any[]; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("attribute/bulkImport", async ({ data, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/attribute-sets/bulk`);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify({ items: data }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to import attributes");
    }
    return await response.json();
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to import attributes");
  }
});
