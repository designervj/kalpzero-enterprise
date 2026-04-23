import { createAsyncThunk } from "@reduxjs/toolkit";
import { Product } from "./ProductType";
import { getApiBaseUrl } from "@/lib/api";

// Fetch all products
export const fetchProducts = createAsyncThunk<
  Product[],
  { auth_token: string; "x-tenant-db": string; type?: string },
  { rejectValue: string }
>("product/fetchProducts", async ({ auth_token, "x-tenant-db": xTenantDb, type }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/products`);
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
      throw new Error(errorData.error || "Failed to fetch products");
    }
    
    const data = await response.json();
    return (data?.products || data) as Product[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch products");
  }
});

// Create a new product
export const createProduct = createAsyncThunk<
  Product,
  { payload: any; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("product/createProduct", async ({ payload, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/products`);
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
      throw new Error(errorData.error || "Failed to create product");
    }
    const data = await response.json();
    return data.data as Product;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create product");
  }
});

// Update a product
export const updateProduct = createAsyncThunk<
  Product,
  { id: string; payload: any; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("product/updateProduct", async ({ id, payload, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/products/${id}`);
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
      throw new Error(errorData.error || "Failed to update product");
    }
    const result = await response.json();
    return result.data as Product;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update product");
  }
});

// Delete a product
export const deleteProduct = createAsyncThunk<
  string,
  { id: string; auth_token: string; "x-tenant-db": string },
  { rejectValue: string }
>("product/deleteProduct", async ({ id, auth_token, "x-tenant-db": xTenantDb }, { rejectWithValue }) => {
  try {
    const url = new URL(`${getApiBaseUrl()}/commerce/products/${id}`);
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${auth_token}`,
        "x-tenant-db": xTenantDb
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete product");
    }
    
    return id;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete product");
  }
});
