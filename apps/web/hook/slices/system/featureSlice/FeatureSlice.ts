import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {  FeatureState } from './FeatureTypes';
import {
    fetchFeatures,
    fetchFeatureById,
    createFeature,
    updateFeature,
    deleteFeature
} from './FeatureThunk';
import { CapabilityDefinition } from '@/app/(dashboard)/settings/tenant/tenantType';

const initialState: FeatureState = {
    allFeatures: [],
    currentFeature: null,
    isFetchedFeature: false,
    loading: false,
    error: null,
};

export const featureSlice = createSlice({
    name: 'feature',
    initialState,
    reducers: {
        setCurrentFeature: (state, action: PayloadAction<CapabilityDefinition | null>) => {
            state.currentFeature = action.payload;
        },
        clearFeatureState: (state) => {
            state.allFeatures = [];
            state.currentFeature = null;
            state.isFetchedFeature = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchFeatures.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFeatures.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedFeature = true;
                state.allFeatures = action.payload;
                state.error = null;
            })
            .addCase(fetchFeatures.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Fetch Single
            .addCase(fetchFeatureById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFeatureById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentFeature = action.payload;
            })
            .addCase(fetchFeatureById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Create
            .addCase(createFeature.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createFeature.fulfilled, (state, action) => {
                state.loading = false;
                state.allFeatures.push(action.payload);
            })
            .addCase(createFeature.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

          

      
    },
});

export const { setCurrentFeature, clearFeatureState } = featureSlice.actions;

export default featureSlice.reducer;
