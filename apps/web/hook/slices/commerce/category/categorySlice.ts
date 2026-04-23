import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CategoryType } from './categoryType';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from './categoryThunk';



interface CategoryState {
  allCategories: CategoryType[];
  currentCategories: CategoryType|null;
  isFetchedCategories: boolean;
  isError: boolean;
  isLoading: boolean;
}

const initialState: CategoryState = {
  allCategories: [],
  currentCategories: null,
  isFetchedCategories: false,
  isError: false,
  isLoading: false,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    setAllCategories: (state, action: PayloadAction<CategoryType[]>) => {
      state.allCategories = action.payload;
      state.isFetchedCategories = true;
      state.isError = false;
    },
    setCurrentCategories: (state, action: PayloadAction<CategoryType|null>) => {
      state.currentCategories = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<boolean>) => {
      state.isError = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchedCategories = true;
        state.allCategories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Create
      .addCase(createCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allCategories.unshift(action.payload);
      })
      .addCase(createCategory.rejected, (state) => {
        state.isLoading = false;
      })
      // Update
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allCategories.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.allCategories[index] = action.payload;
        }
      })
      .addCase(updateCategory.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allCategories = state.allCategories.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { 
  setAllCategories, 
  setCurrentCategories, 
  setLoading, 
  setError 
} = categorySlice.actions;

export default categorySlice.reducer;
