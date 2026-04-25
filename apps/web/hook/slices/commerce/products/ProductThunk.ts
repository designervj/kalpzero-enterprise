import { createAsyncThunk } from "@reduxjs/toolkit";
import { Product } from "./ProductType";
import { buildApiUrl } from "@/lib/api";

// Fetch all products
export const fetchProducts = createAsyncThunk<
  Product[],
  { auth_token?: string; "x-tenant-db"?: string; type?: string } | void,
  { state: any; rejectValue: string }
>("product/fetchProducts", async (args, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const auth_token = args?.auth_token || state.auth?.authUser?.access_token;
    const xTenantDb = args?.["x-tenant-db"] || state.tenant?.currentTenant?.mongo_db_name;

    if (!auth_token || !xTenantDb) {
      throw new Error("Missing authentication or tenant database information");
    }

    const url = buildApiUrl("/commerce/products");
    if (args?.type) url.searchParams.append("type", args.type);

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
})

// Fetch a single product by ID
export const fetchProductById = createAsyncThunk<
  Product,
  { id: string; auth_token?: string; "x-tenant-db"?: string },
  { state: any; rejectValue: string }
>("product/fetchProductById", async ({ id, auth_token: argToken, "x-tenant-db": argDb }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const auth_token = argToken || state.auth?.authUser?.access_token;
    const xTenantDb = argDb || state.tenant?.currentTenant?.mongo_db_name;

    if (!auth_token || !xTenantDb) throw new Error("Missing auth info");

    const url = buildApiUrl(`/commerce/products/${id}`);
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
      throw new Error(errorData.error || "Failed to fetch product");
    }
    const result = await response.json();
    return result as Product;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch product");
  }
});

// Create a new product
export const createProduct = createAsyncThunk<
  Product,
  { payload: any; auth_token?: string; "x-tenant-db"?: string },
  { state: any; rejectValue: string }
>("product/createProduct", async ({ payload, auth_token: argToken, "x-tenant-db": argDb }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const auth_token = argToken || state.auth?.authUser?.access_token;
    const xTenantDb = argDb || state.tenant?.currentTenant?.mongo_db_name;

    if (!auth_token || !xTenantDb) throw new Error("Missing auth info");

    const url = buildApiUrl("/commerce/products");
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
  { id: string; payload: any; auth_token?: string; "x-tenant-db"?: string },
  { state: any; rejectValue: string }
>("product/updateProduct", async ({ id, payload, auth_token: argToken, "x-tenant-db": argDb }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const auth_token = argToken || state.auth?.authUser?.access_token;
    const xTenantDb = argDb || state.tenant?.currentTenant?.mongo_db_name;

    if (!auth_token || !xTenantDb) throw new Error("Missing auth info");

    const url = buildApiUrl(`/commerce/products/${id}`);
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
  { id: string; auth_token?: string; "x-tenant-db"?: string },
  { state: any; rejectValue: string }
>("product/deleteProduct", async ({ id, auth_token: argToken, "x-tenant-db": argDb }, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const auth_token = argToken || state.auth?.authUser?.access_token;
    const xTenantDb = argDb || state.tenant?.currentTenant?.mongo_db_name;

    if (!auth_token || !xTenantDb) throw new Error("Missing auth info");

    const url = buildApiUrl(`/commerce/products/${id}`);
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

// Save product (unified create/update)
export const saveProduct = createAsyncThunk<
  Product,
  { id?: string; payload: any; auth_token?: string; "x-tenant-db"?: string },
  { state: any; rejectValue: string }
>("product/saveProduct", async ({ id, payload, auth_token, "x-tenant-db": xTenantDb }, { dispatch, rejectWithValue }) => {
  try {
    let action;
    if (id) {
      action = await dispatch(updateProduct({ id, payload, auth_token, "x-tenant-db": xTenantDb }));
    } else {
      action = await dispatch(createProduct({ payload, auth_token, "x-tenant-db": xTenantDb }));
    }

    if (updateProduct.fulfilled.match(action) || createProduct.fulfilled.match(action)) {
      return action.payload as Product;
    } else {
      return rejectWithValue(action.payload as string);
    }
  } catch (error: any) {
    return rejectWithValue(error.message || "Save operation failed");
  }
});
