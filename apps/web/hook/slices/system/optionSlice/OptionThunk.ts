import { CapabilityDefinition } from "@/app/(dashboard)/settings/tenant/tenantType";
import { createAsyncThunk } from "@reduxjs/toolkit";


// Fetch all options
export const fetchOptions = createAsyncThunk<CapabilityDefinition[], void, { rejectValue: string }>(
    'options/fetchOptions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/options');
            if (!response.ok) {
                throw new Error('Failed to fetch options');
            }
            const data = await response.json();
            return data as CapabilityDefinition[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch options');
        }
    }
);

// Fetch a single option by ID
export const fetchOptionById = createAsyncThunk<CapabilityDefinition, string, { rejectValue: string }>(
    'options/fetchOptionById',
    async (optionId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/options/${optionId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch option');
            }
            const data = await response.json();
            return data as CapabilityDefinition;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch option');
        }
    }
);

// Create a new option
export const createOption = createAsyncThunk<CapabilityDefinition, Partial<CapabilityDefinition>, { rejectValue: string }>(
    'options/createOption',
    async (optionData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/options', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(optionData),
            });
            if (!response.ok) {
                throw new Error('Failed to create option');
            }
            const data = await response.json();
            return data as CapabilityDefinition;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create option');
        }
    }
);

// Update an existing option
export const updateOption = createAsyncThunk<CapabilityDefinition, { id: string; data: Partial<CapabilityDefinition> }, { rejectValue: string }>(
    'options/updateOption',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/options/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update option');
            }
            const updatedData = await response.json();
            return updatedData as CapabilityDefinition;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update option');
        }
    }
);

// Delete an option
export const deleteOption = createAsyncThunk<string, string, { rejectValue: string }>(
    'options/deleteOption',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/options/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete option');
            }
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete option');
        }
    }
);
