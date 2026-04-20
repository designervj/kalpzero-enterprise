import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language, LanguageState } from './LanguageTypes';
import {
    fetchLanguages,
    fetchLanguageById,
    createLanguage,
    updateLanguage,
    deleteLanguage
} from './LanguageThunk';

const initialState: LanguageState = {
    allLanguage: [],
    currentLanguage: null,
    isFetchedLanguage: false,
    loading: false,
    error: null,
};

export const languageSlice = createSlice({
    name: 'language',
    initialState,
    reducers: {
        setCurrentLanguage: (state, action: PayloadAction<Language | null>) => {
            state.currentLanguage = action.payload;
        },
        clearLanguageState: (state) => {
            state.allLanguage = [];
            state.currentLanguage = null;
            state.isFetchedLanguage = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchLanguages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLanguages.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedLanguage = true;
                state.allLanguage = action.payload;
                state.error = null;
            })
            .addCase(fetchLanguages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Fetch Single
            .addCase(fetchLanguageById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchLanguageById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentLanguage = action.payload;
            })
            .addCase(fetchLanguageById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Create
            .addCase(createLanguage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createLanguage.fulfilled, (state, action) => {
                state.loading = false;
                state.allLanguage.push(action.payload);
            })
            .addCase(createLanguage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Update
            .addCase(updateLanguage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateLanguage.fulfilled, (state, action) => {
                state.loading = false;
                if (state.currentLanguage && state.currentLanguage._id === action.payload._id) {
                    state.currentLanguage = action.payload;
                }
                const index = state.allLanguage.findIndex(t => t._id === action.payload._id);
                if (index !== -1) {
                    state.allLanguage[index] = action.payload;
                }
            })
            .addCase(updateLanguage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Delete
            .addCase(deleteLanguage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteLanguage.fulfilled, (state, action) => {
                state.loading = false;
                state.allLanguage = state.allLanguage.filter(t => t._id !== action.payload);
                if (state.currentLanguage && state.currentLanguage._id === action.payload) {
                    state.currentLanguage = null;
                }
            })
            .addCase(deleteLanguage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            });
    },
});

export const { setCurrentLanguage, clearLanguageState } = languageSlice.actions;

export default languageSlice.reducer;
