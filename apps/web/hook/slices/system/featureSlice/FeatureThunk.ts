import { CapabilityDefinition } from "@/app/(dashboard)/settings/tenant/tenantType";
import { createAsyncThunk } from "@reduxjs/toolkit";

// Fetch all features
export const fetchFeatures = createAsyncThunk<CapabilityDefinition[], void, { rejectValue: string }>(
    'features/fetchFeatures',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/features');
            if (!response.ok) {
                throw new Error('Failed to fetch features');
            }
            const data = await response.json();
            return data as CapabilityDefinition[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch features');
        }
    }
);

// Fetch a single feature by ID
export const fetchFeatureById = createAsyncThunk<CapabilityDefinition, string, { rejectValue: string }>(
    'features/fetchFeatureById',
    async (featureId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/features/${featureId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch feature');
            }
            const data = await response.json();
            return data as CapabilityDefinition;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch feature');
        }
    }
);

// Create a new feature
export const createFeature = createAsyncThunk<CapabilityDefinition, Partial<CapabilityDefinition>, { rejectValue: string }>(
    'features/createFeature',
    async (featureData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(featureData),
            });
            if (!response.ok) {
                throw new Error('Failed to create feature');
            }
            const data = await response.json();
            return data as CapabilityDefinition;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create feature');
        }
    }
);

// Update an existing feature
export const updateFeature = createAsyncThunk<CapabilityDefinition, { id: string; data: Partial<CapabilityDefinition> }, { rejectValue: string }>(
    'features/updateFeature',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/features/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update feature');
            }
            const updatedData = await response.json();
            return updatedData as CapabilityDefinition;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update feature');
        }
    }
);

// Delete a feature
export const deleteFeature = createAsyncThunk<string, string, { rejectValue: string }>(
    'features/deleteFeature',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/features/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete feature');
            }
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete feature');
        }
    }
);
