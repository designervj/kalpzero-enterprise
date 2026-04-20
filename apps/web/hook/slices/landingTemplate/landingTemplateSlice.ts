import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LandingTemplate } from './landingTemplateTypes';
import {
    fetchLandingTemplates,
    fetchLandingTemplateById,
    createLandingTemplate,
    updateLandingTemplate,
    deleteLandingTemplate
} from './LandingTemplateThunk';

export interface LandingTemplateState {
    allLandingTemplate: LandingTemplate[];
    currentLandingTemplate: LandingTemplate | null;
    isFetchedLandingTemplate: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: LandingTemplateState = {
    allLandingTemplate: [],
    currentLandingTemplate: null,
    isFetchedLandingTemplate: false,
    loading: false,
    error: null,
};

export const landingTemplateSlice = createSlice({
    name: 'landingTemplate',
    initialState,
    reducers: {
        setCurrentLandingTemplate: (state, action: PayloadAction<LandingTemplate | null>) => {
            state.currentLandingTemplate = action.payload;
        },
        clearLandingTemplateState: (state) => {
            state.allLandingTemplate = [];
            state.currentLandingTemplate = null;
            state.isFetchedLandingTemplate = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchLandingTemplates.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLandingTemplates.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedLandingTemplate = true;
                state.allLandingTemplate = action.payload;
                state.error = null;
            })
            .addCase(fetchLandingTemplates.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Fetch Single
         

            // Create
            .addCase(createLandingTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLandingTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.allLandingTemplate.push(action.payload);
            })
            .addCase(createLandingTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Update
            .addCase(updateLandingTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateLandingTemplate.fulfilled, (state, action) => {
                state.loading = false;
                if (state.currentLandingTemplate && state.currentLandingTemplate._id === action.payload._id) {
                    state.currentLandingTemplate = action.payload;
                }
                const index = state.allLandingTemplate.findIndex(t => t._id === action.payload._id);
                if (index !== -1) {
                    state.allLandingTemplate[index] = action.payload;
                }
            })
            .addCase(updateLandingTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Delete
            .addCase(deleteLandingTemplate.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteLandingTemplate.fulfilled, (state, action) => {
                state.loading = false;
                state.allLandingTemplate = state.allLandingTemplate.filter(t => t._id !== action.payload);
                if (state.currentLandingTemplate && state.currentLandingTemplate._id === action.payload) {
                    state.currentLandingTemplate = null;
                }
            })
            .addCase(deleteLandingTemplate.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            });
    },
});

export const { setCurrentLandingTemplate, clearLandingTemplateState } = landingTemplateSlice.actions;

export default landingTemplateSlice.reducer;
