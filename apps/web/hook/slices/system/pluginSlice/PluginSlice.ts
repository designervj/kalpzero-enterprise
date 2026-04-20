import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {  PluginState } from './PluginTypes';
import {
    fetchPlugins,
    fetchPluginById,
    createPlugin,
    updatePlugin,
    deletePlugin
} from './PluginThunk';
import { CapabilityDefinition } from '@/app/(dashboard)/settings/tenant/tenantType';

const initialState: PluginState = {
    allPlugin: [],
    currentPlugin: null,
    isFetchedPlugin: false,
    loading: false,
    error: null,
};

export const pluginSlice = createSlice({
    name: 'plugin',
    initialState,
    reducers: {
        setCurrentPlugin: (state, action: PayloadAction<CapabilityDefinition | null>) => {
            state.currentPlugin = action.payload;
        },
        clearPluginState: (state) => {
            state.allPlugin = [];
            state.currentPlugin = null;
            state.isFetchedPlugin = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchPlugins.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPlugins.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedPlugin = true;
                state.allPlugin = action.payload;
                state.error = null;
            })
            .addCase(fetchPlugins.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

    },
});

export const { setCurrentPlugin, clearPluginState } = pluginSlice.actions;

export default pluginSlice.reducer;
