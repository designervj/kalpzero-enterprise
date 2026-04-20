import { createAsyncThunk } from "@reduxjs/toolkit";
import { LandingTemplate } from "./landingTemplateTypes";

// Fetch all landing templates
export const fetchLandingTemplates = createAsyncThunk<LandingTemplate[], void, { rejectValue: string }>(
    'landingTemplates/fetchLandingTemplates',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/landing-templates');
            if (!response.ok) {
                throw new Error('Failed to fetch landing templates');
            }
            const data = await response.json();
            return data as LandingTemplate[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch landing templates');
        }
    }
);

// Fetch a single landing template by ID
export const fetchLandingTemplateById = createAsyncThunk<LandingTemplate, string, { rejectValue: string }>(
    'landingTemplates/fetchLandingTemplateById',
    async (templateId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/landing-templates/${templateId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch landing template');
            }
            const data = await response.json();
            return data as LandingTemplate;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch landing template');
        }
    }
);

// Create a new landing template
export const createLandingTemplate = createAsyncThunk<LandingTemplate, Partial<LandingTemplate>, { rejectValue: string }>(
    'landingTemplates/createLandingTemplate',
    async (templateData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/landing-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateData),
            });
            if (!response.ok) {
                throw new Error('Failed to create landing template');
            }
            const data = await response.json();
            return data as LandingTemplate;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create landing template');
        }
    }
);

// Update an existing landing template
export const updateLandingTemplate = createAsyncThunk<LandingTemplate, { id: string; data: Partial<LandingTemplate> }, { rejectValue: string }>(
    'landingTemplates/updateLandingTemplate',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/landing-templates/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update landing template');
            }
            const updatedData = await response.json();
            return updatedData as LandingTemplate;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update landing template');
        }
    }
);

// Delete a landing template
export const deleteLandingTemplate = createAsyncThunk<string, string, { rejectValue: string }>(
    'landingTemplates/deleteLandingTemplate',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/landing-templates/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete landing template');
            }
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete landing template');
        }
    }
);
