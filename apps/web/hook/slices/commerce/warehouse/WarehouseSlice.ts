import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Warehouse, WarehouseState } from './WarehouseType';
import { fetchWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, fetchWarehouseById } from './WarehouseThunk';

const initialState: WarehouseState = {
  allWarehouses: [],
  currentWarehouse: null,
  isFetchedWarehouses: false,
  isError: false,
  isLoading: false,
};

const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState,
  reducers: {
    setAllWarehouses: (state, action: PayloadAction<Warehouse[]>) => {
      state.allWarehouses = action.payload;
      state.isFetchedWarehouses = true;
      state.isError = false;
    },
    setCurrentWarehouse: (state, action: PayloadAction<Warehouse | null>) => {
      state.currentWarehouse = action.payload;
    },
    setWarehouseFormField: (state, action: PayloadAction<{ field: keyof Warehouse; value: any }>) => {
      if (state.currentWarehouse) {
        (state.currentWarehouse as any)[action.payload.field] = action.payload.value;
      }
    },
    resetWarehouseForm: (state) => {
      state.currentWarehouse = {
        name: "",
        slug: "",
        code: "",
        city: "",
        country: "",
        status: "active",
        is_default: false,
      };
    },
    setWarehouseLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setWarehouseError: (state, action: PayloadAction<boolean>) => {
      state.isError = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchWarehouses.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchWarehouses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchedWarehouses = true;
        state.allWarehouses = action.payload;
      })
      .addCase(fetchWarehouses.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Create
      .addCase(createWarehouse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createWarehouse.fulfilled, (state, action) => {
        debugger
        state.isLoading = false;
        state.allWarehouses.unshift(action.payload);
      })
      .addCase(createWarehouse.rejected, (state) => {
        state.isLoading = false;
      })
      // Update
      .addCase(updateWarehouse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allWarehouses.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.allWarehouses[index] = action.payload;
        }
      })
      .addCase(updateWarehouse.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete
      .addCase(deleteWarehouse.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allWarehouses = state.allWarehouses.filter(w => w.id !== action.payload );
      })
      .addCase(deleteWarehouse.rejected, (state) => {
        state.isLoading = false;
      })
      // Fetch By ID
      .addCase(fetchWarehouseById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchWarehouseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWarehouse = action.payload;
      })
      .addCase(fetchWarehouseById.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      });
  },
});

export const { 
  setAllWarehouses, 
  setCurrentWarehouse, 
  setWarehouseFormField,
  resetWarehouseForm,
  setWarehouseLoading, 
  setWarehouseError 
} = warehouseSlice.actions;

export default warehouseSlice.reducer;
