import { createAsyncThunk } from "@reduxjs/toolkit";
import { buildApiUrl } from "@/lib/api";
import { Agency } from "./agencyType";

// Fetch all agencies
export const fetchAgencies = createAsyncThunk<
  Agency[],
  { auth_token: string },
  { rejectValue: string }
>("agency/fetchAgencies", async ({ auth_token }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/platform/agencies");
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch agencies");
    }
    const data = await response.json();
  
    return data?.agencies as Agency[];
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch agencies");
  }
});

// Create a new agency
export const createAgencyThunk = createAsyncThunk<
  Agency,
  { auth_token: string; payload: Partial<Agency> },
  { rejectValue: string }
>("agency/createAgency", async ({ auth_token, payload }, { rejectWithValue }) => {
  try {
    const url = buildApiUrl("/platform/agencies");
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${auth_token}`
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create agency");
    }
    const data = await response.json();
    return data as Agency;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create agency");
  }
});
