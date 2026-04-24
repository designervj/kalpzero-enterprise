import { createAsyncThunk } from "@reduxjs/toolkit";
import { CategoryType } from "./categoryType";
import { buildApiUrl } from "@/lib/api";

// Fetch all categories
export const fetchCategories = createAsyncThunk<
  CategoryType[],
  { auth_token: string; "x-tenant-db": string; type?: string },
  { rejectValue: string }
>("category/fetchCategories", async ({ auth_token, "x-tenant-db": xTenantDb, type }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/categories");
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
      throw new Error(errorData.error || "Failed to fetch categories");
    }
    
    // Assuming backend returns an array of categories or an object with an items array
    const data = await response.json();
    console.log("dat commerce", data);
    const result = data?.categories || data;
    return (Array.isArray(result) ? result : []) as CategoryType[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch categories");
  }
});

// Create a new category
export const createCategory = createAsyncThunk<
  CategoryType,
  { categoryData: Partial<CategoryType>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("category/createCategory", async ({ categoryData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/commerce/categories");
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create category");
    }
    const data = await response.json();
    return data as CategoryType;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create category");
  }
});

// Update a category
export const updateCategory = createAsyncThunk<
  CategoryType,
  { id: string; categoryData: Partial<CategoryType>; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("category/updateCategory", async ({ id, categoryData, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/categories/${id}`);
    const response = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update category");
    }
    const result = await response.json();
    return result as CategoryType;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update category");
  }
});

// Delete a category
export const deleteCategory = createAsyncThunk<
  string,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("category/deleteCategory", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl(`/commerce/categories/${id}`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete category");
    }
    
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete category");
  }
});
