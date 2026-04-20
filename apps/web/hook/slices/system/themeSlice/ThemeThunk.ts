import { createAsyncThunk } from "@reduxjs/toolkit";
import { Theme } from "./ThemeTypes";

// Fetch all themes
export const fetchThemes = createAsyncThunk<Theme[], void, { rejectValue: string }>(
    'themes/fetchThemes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/themes');
            if (!response.ok) {
                throw new Error('Failed to fetch themes');
            }
            const data = await response.json();
            return data as Theme[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch themes');
        }
    }
);

// Fetch a single theme by ID
export const fetchThemeById = createAsyncThunk<Theme, string, { rejectValue: string }>(
    'themes/fetchThemeById',
    async (themeId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/themes/${themeId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch theme');
            }
            const data = await response.json();
            return data as Theme;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch theme');
        }
    }
);

// Create a new theme
export const createTheme = createAsyncThunk<Theme, Partial<Theme>, { rejectValue: string }>(
    'themes/createTheme',
    async (themeData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(themeData),
            });
            if (!response.ok) {
                throw new Error('Failed to create theme');
            }
            const data = await response.json();
            return data as Theme;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create theme');
        }
    }
);

// Update an existing theme
export const updateTheme = createAsyncThunk<Theme, { id: string; data: Partial<Theme> }, { rejectValue: string }>(
    'themes/updateTheme',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/themes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update theme');
            }
            const updatedData = await response.json();
            return updatedData as Theme;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update theme');
        }
    }
);

// Delete a theme
export const deleteTheme = createAsyncThunk<string, string, { rejectValue: string }>(
    'themes/deleteTheme',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/themes/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete theme');
            }
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete theme');
        }
    }
);
