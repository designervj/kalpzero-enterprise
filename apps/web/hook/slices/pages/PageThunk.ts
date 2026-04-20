import { createAsyncThunk } from "@reduxjs/toolkit";
import { PageRecord } from "./pagesSlice";

// Fetch all pages
export const fetchPages = createAsyncThunk<PageRecord[], void, { rejectValue: string }>(
    'pages/fetchPages',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/pages');
            if (!response.ok) {
                throw new Error('Failed to fetch pages');
            }
            const data = await response.json();
            return data as PageRecord[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch pages');
        }
    }
);

// Fetch a single page by ID
export const fetchPageById = createAsyncThunk<PageRecord, string, { rejectValue: string }>(
    'pages/fetchPageById',
    async (pageId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/pages/${pageId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch page');
            }
            const data = await response.json();
            return data as PageRecord;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch page');
        }
    }
);

// Create a new page
export const createPage = createAsyncThunk<PageRecord, Partial<PageRecord>, { rejectValue: string }>(
    'pages/createPage',
    async (pageData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pageData),
            });
            if (!response.ok) {
                throw new Error('Failed to create page');
            }
            const data = await response.json();
            return data as PageRecord; // Assuming the API returns the created page record
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create page');
        }
    }
);

// Update an existing page
export const updatePage = createAsyncThunk<PageRecord, { id: string; data: Partial<PageRecord> }, { rejectValue: string }>(
    'pages/updatePage',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/pages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update page');
            }
            const updatedData = await response.json();
            console.log("updatedData response",updatedData)
            console.log("updatedData",updatedData.updatedData)
            return updatedData.updatedData as PageRecord;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update page');
        }
    }
);

// Delete a page
export const deletePage = createAsyncThunk<string, string, { rejectValue: string }>(
    'pages/deletePage',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/pages/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete page');
            }
            // Assuming successful deletion, we just return the id we deleted
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete page');
        }
    }
);
