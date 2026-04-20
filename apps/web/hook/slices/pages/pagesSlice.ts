import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { createPage, deletePage, fetchPageById, fetchPages, updatePage } from './PageThunk';


export type PageRecord = {
    _id: string;
    name: string;
    slug: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
}
// Define the state interface
export interface PagesState {
    allPages: PageRecord[];
    currentPage: PageRecord | null;
    isFetched: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: PagesState = {
    allPages: [],
    currentPage: null,
    isFetched: false,
    loading: false,
    error: null,
};

// --- Thunks for CRUD Operations ---



// --- Slice ---
export const pagesSlice = createSlice({
    name: 'pages',
    initialState,
    reducers: {
        // Standard synchronous actions if needed
        setCurrentPage: (state, action: PayloadAction<PageRecord | null>) => {
            state.currentPage = action.payload;
        },
        clearPagesState: (state) => {
            state.allPages = [];
            state.currentPage = null;
            state.isFetched = false;
            state.loading = false;
            state.error = null;
        },
        setAllPages: (state, action: PayloadAction<PageRecord[]>) => {
            state.allPages = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch Pages
            .addCase(fetchPages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPages.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetched = true;
                state.allPages = action.payload;
                state.error = null;
            })
            .addCase(fetchPages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Fetch Single Page
            .addCase(fetchPageById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPageById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPage = action.payload;
                // Optionally update the page in allPages list if it exists
                const index = state.allPages.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.allPages[index] = action.payload;
                }
            })
            .addCase(fetchPageById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Create Page
            .addCase(createPage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPage.fulfilled, (state, action) => {
                state.loading = false;
                state.allPages.push(action.payload);
            })
            .addCase(createPage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Update Page
            .addCase(updatePage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePage.fulfilled, (state, action) => {
                state.loading = false;
                debugger
                if (state.currentPage && state.currentPage._id === action.payload._id) {
                    state.currentPage = action.payload;
                }
                const index = state.allPages.findIndex(p => p._id === action.payload._id);
                if (index !== -1) {
                    state.allPages[index] = action.payload;
                }
            })
            .addCase(updatePage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Delete Page
            .addCase(deletePage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePage.fulfilled, (state, action) => {
                state.loading = false;
                state.allPages = state.allPages.filter(p => p._id !== action.payload);
                if (state.currentPage && state.currentPage._id === action.payload) {
                    state.currentPage = null;
                }
            })
            .addCase(deletePage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            });
    },
});

export const { setCurrentPage, clearPagesState,setAllPages } = pagesSlice.actions;

export default pagesSlice.reducer;
