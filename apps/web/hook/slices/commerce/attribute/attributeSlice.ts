import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AttributeSetItem } from './attributeType';
import { fetchAttributes, createAttributeSet, updateAttributeSet, deleteAttributeSet } from './attributeThunk';

interface AttributeState {
  allAttributes: AttributeSetItem[];
  currentAttribute: AttributeSetItem | null;
  isFetchedAttributes: boolean;
  isError: boolean;
  isLoading: boolean;
}

const initialState: AttributeState = {
  allAttributes: [],
  currentAttribute: null,
  isFetchedAttributes: false,
  isError: false,
  isLoading: false,
};

const attributeSlice = createSlice({
  name: 'attribute',
  initialState,
  reducers: {
    setAllAttributes: (state, action: PayloadAction<AttributeSetItem[]>) => {
      state.allAttributes = action.payload;
      state.isFetchedAttributes = true;
      state.isError = false;
    },
    setCurrentAttribute: (state, action: PayloadAction<AttributeSetItem | null>) => {
      state.currentAttribute = action.payload;
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
      .addCase(fetchAttributes.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchAttributes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchedAttributes = true;
        state.allAttributes = action.payload;
      })
      .addCase(fetchAttributes.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Create
      .addCase(createAttributeSet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createAttributeSet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allAttributes.unshift(action.payload);
      })
      .addCase(createAttributeSet.rejected, (state) => {
        state.isLoading = false;
      })
      // Update
      .addCase(updateAttributeSet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateAttributeSet.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allAttributes.findIndex(a => (a._id === action.payload._id || a.id === action.payload.id));
        if (index !== -1) {
          state.allAttributes[index] = action.payload;
        }
      })
      .addCase(updateAttributeSet.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete
      .addCase(deleteAttributeSet.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteAttributeSet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allAttributes = state.allAttributes.filter(a => (a._id !== action.payload && a.id !== action.payload));
      })
      .addCase(deleteAttributeSet.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { 
  setAllAttributes, 
  setCurrentAttribute, 
  setLoading, 
  setError 
} = attributeSlice.actions;

export default attributeSlice.reducer;
