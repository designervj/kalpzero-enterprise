import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vendor, VendorState } from './VendorType';
import { fetchVendors, createVendor, updateVendor, deleteVendor } from './VendorThunk';

const initialState: VendorState = {
  allVendors: [],
  currentVendor: null,
  isFetchedVendors: false,
  isError: false,
  isLoading: false,
};

const vendorSlice = createSlice({
  name: 'vendor',
  initialState,
  reducers: {
    setAllVendors: (state, action: PayloadAction<Vendor[]>) => {
      state.allVendors = action.payload;
      state.isFetchedVendors = true;
      state.isError = false;
    },
    setCurrentVendor: (state, action: PayloadAction<Vendor | null>) => {
      state.currentVendor = action.payload;
    },
    setVendorFormField: (state, action: PayloadAction<{ field: keyof Vendor; value: any }>) => {
      if (state.currentVendor) {
        (state.currentVendor as any)[action.payload.field] = action.payload.value;
      }
    },
    resetVendorForm: (state) => {
      state.currentVendor = {
        name: "",
        slug: "",
        code: "",
        description: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        status: "active",
      };
    },
    setVendorLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setVendorError: (state, action: PayloadAction<boolean>) => {
      state.isError = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVendors.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchedVendors = true;
        state.allVendors = action.payload;
      })
      .addCase(fetchVendors.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Create
      .addCase(createVendor.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createVendor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allVendors.unshift(action.payload);
      })
      .addCase(createVendor.rejected, (state) => {
        state.isLoading = false;
      })
      // Update
      .addCase(updateVendor.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allVendors.findIndex(v => v.id === action.payload.id);
        if (index !== -1) {
          state.allVendors[index] = action.payload;
        }
      })
      .addCase(updateVendor.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete
      .addCase(deleteVendor.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allVendors = state.allVendors.filter(v => v.id !== action.payload );
      })
      .addCase(deleteVendor.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { 
  setAllVendors, 
  setCurrentVendor, 
  setVendorFormField,
  resetVendorForm,
  setVendorLoading, 
  setVendorError 
} = vendorSlice.actions;

export default vendorSlice.reducer;
