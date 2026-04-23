import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CategoryType } from './categoryType';
import { fetchCategories } from './categoryThunk';



interface CategoryState {
  allCategories: CategoryType[];
  currentCategories: CategoryType[];
  isFetchedCategories: boolean;
  isError: boolean;
  isLoading: boolean;
}

const initialState: CategoryState = {
  allCategories: [],
  currentCategories: [],
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
    setCurrentCategories: (state, action: PayloadAction<CategoryType[]>) => {
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
