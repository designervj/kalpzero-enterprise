import { createAsyncThunk } from "@reduxjs/toolkit";
import { CapabilityDefinition } from "@/app/(dashboard)/settings/tenant/tenantType";


// Fetch all plugins
export const fetchPlugins = createAsyncThunk<CapabilityDefinition[], void, { rejectValue: string }>(
    'plugins/fetchPlugins',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/plugins');
            if (!response.ok) {
                throw new Error('Failed to fetch plugins');
            }
            const data = await response.json();
            return data as CapabilityDefinition[];
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch plugins');
        }
    }
);

// Fetch a single plugin by ID
export const fetchPluginById = createAsyncThunk<Plugin, string, { rejectValue: string }>(
    'plugins/fetchPluginById',
    async (pluginId, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/plugins/${pluginId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch plugin');
            }
            const data = await response.json();
            return data as Plugin;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch plugin');
        }
    }
);

// Create a new plugin
export const createPlugin = createAsyncThunk<Plugin, Partial<Plugin>, { rejectValue: string }>(
    'plugins/createPlugin',
    async (pluginData, { rejectWithValue }) => {
        try {
            const response = await fetch('/api/system/plugins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pluginData),
            });
            if (!response.ok) {
                throw new Error('Failed to create plugin');
            }
            const data = await response.json();
            return data as Plugin;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create plugin');
        }
    }
);

// Update an existing plugin
export const updatePlugin = createAsyncThunk<Plugin, { id: string; data: Partial<Plugin> }, { rejectValue: string }>(
    'plugins/updatePlugin',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/plugins/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to update plugin');
            }
            const updatedData = await response.json();
            return updatedData as Plugin;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update plugin');
        }
    }
);

// Delete a plugin
export const deletePlugin = createAsyncThunk<string, string, { rejectValue: string }>(
    'plugins/deletePlugin',
    async (id, { rejectWithValue }) => {
        try {
            const response = await fetch(`/api/system/plugins/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Failed to delete plugin');
            }
            return id;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete plugin');
        }
    }
);
