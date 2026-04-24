import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Brand, BrandState } from './BrandType';
import { fetchBrands, createBrand, updateBrand, deleteBrand } from './BrandThunk';

const initialState: BrandState = {
  allBrands: [],
  currentBrand: null,
  isFetchedBrands: false,
  isError: false,
  isLoading: false,
};

const brandSlice = createSlice({
  name: 'brand',
  initialState,
  reducers: {
    setAllBrands: (state, action: PayloadAction<Brand[]>) => {
      state.allBrands = action.payload;
      state.isFetchedBrands = true;
      state.isError = false;
    },
    setCurrentBrand: (state, action: PayloadAction<Brand | null>) => {
      state.currentBrand = action.payload;
    },
    setBrandFormField: (state, action: PayloadAction<{ field: keyof Brand; value: any }>) => {
      if (state.currentBrand) {
        (state.currentBrand as any)[action.payload.field] = action.payload.value;
      }
    },
    resetBrandForm: (state) => {
      state.currentBrand = {
        name: "",
        slug: "",
        code: "",
        description: "",
        status: "active",
      };
    },
    setBrandLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setBrandError: (state, action: PayloadAction<boolean>) => {
      state.isError = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchBrands.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchedBrands = true;
        state.allBrands = action.payload;
      })
      .addCase(fetchBrands.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Create
      .addCase(createBrand.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createBrand.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allBrands.unshift(action.payload);
      })
      .addCase(createBrand.rejected, (state) => {
        state.isLoading = false;
      })
      // Update
      .addCase(updateBrand.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateBrand.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allBrands.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.allBrands[index] = action.payload;
        }
      })
      .addCase(updateBrand.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete
      .addCase(deleteBrand.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteBrand.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allBrands = state.allBrands.filter(b => b.id !== action.payload );
      })
      .addCase(deleteBrand.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { 
  setAllBrands, 
  setCurrentBrand, 
  setBrandFormField,
  resetBrandForm,
  setBrandLoading, 
  setBrandError 
} = brandSlice.actions;

export default brandSlice.reducer;
