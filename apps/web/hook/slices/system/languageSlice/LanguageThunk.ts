import { createAsyncThunk } from "@reduxjs/toolkit";
import { Language } from "./LanguageTypes";

// Fetch all languages
export const fetchLanguages = createAsyncThunk<Language[], void, { rejectValue: string }>(
    'languages/fetchLanguages',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/languages');
            if (!response.ok) {
                throw new Error('Failed to fetch languages');
            }
            const data = await response.json();
            return data as Language[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch languages');
        }
    }
);

// Fetch a single language by ID
export const fetchLanguageById = createAsyncThunk<Language, string, { rejectValue: string }>(
    'languages/fetchLanguageById',
    async (languageId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/languages/${languageId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch language');
            }
            const data = await response.json();
            return data as Language;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch language');
        }
    }
);

// Create a new language
export const createLanguage = createAsyncThunk<Language, Partial<Language>, { rejectValue: string }>(
    'languages/createLanguage',
    async (languageData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/languages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(languageData),
            });
            if (!response.ok) {
                throw new Error('Failed to create language');
            }
            const data = await response.json();
            return data as Language;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create language');
        }
    }
);

// Update an existing language
export const updateLanguage = createAsyncThunk<Language, { id: string; data: Partial<Language> }, { rejectValue: string }>(
    'languages/updateLanguage',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/languages/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update language');
            }
            const updatedData = await response.json();
            return updatedData as Language;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update language');
        }
    }
);

// Delete a language
export const deleteLanguage = createAsyncThunk<string, string, { rejectValue: string }>(
    'languages/deleteLanguage',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/languages/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete language');
            }
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete language');
        }
    }
);
