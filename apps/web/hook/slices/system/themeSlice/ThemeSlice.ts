import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Theme, ThemeState } from './ThemeTypes';
import {
    fetchThemes,
    fetchThemeById,
    createTheme,
    updateTheme,
    deleteTheme
} from './ThemeThunk';

const initialState: ThemeState = {
    allThemes: [],
    currentTheme: null,
    isFetchedTheme: false,
    loading: false,
    error: null,
};

export const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setCurrentTheme: (state, action: PayloadAction<Theme | null>) => {
            state.currentTheme = action.payload;
        },
        clearThemeState: (state) => {
            state.allThemes = [];
            state.currentTheme = null;
            state.isFetchedTheme = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchThemes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchThemes.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedTheme = true;
                state.allThemes = action.payload;
                state.error = null;
            })
            .addCase(fetchThemes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Fetch Single
            .addCase(fetchThemeById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchThemeById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentTheme = action.payload;
            })
            .addCase(fetchThemeById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Create
            .addCase(createTheme.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTheme.fulfilled, (state, action) => {
                state.loading = false;
                state.allThemes.push(action.payload);
            })
            .addCase(createTheme.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Update
            .addCase(updateTheme.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTheme.fulfilled, (state, action) => {
                state.loading = false;
                if (state.currentTheme && state.currentTheme._id === action.payload._id) {
                    state.currentTheme = action.payload;
                }
                const index = state.allThemes.findIndex(t => t._id === action.payload._id);
                if (index !== -1) {
                    state.allThemes[index] = action.payload;
                }
            })
            .addCase(updateTheme.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Delete
            .addCase(deleteTheme.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteTheme.fulfilled, (state, action) => {
                state.loading = false;
                state.allThemes = state.allThemes.filter(t => t._id !== action.payload);
                if (state.currentTheme && state.currentTheme._id === action.payload) {
                    state.currentTheme = null;
                }
            })
            .addCase(deleteTheme.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            });
    },
});

export const { setCurrentTheme, clearThemeState } = themeSlice.actions;

export default themeSlice.reducer;
