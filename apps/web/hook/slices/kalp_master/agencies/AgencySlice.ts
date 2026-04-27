import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Agency, AgencyState } from './agencyType';
import { fetchAgencies, createAgencyThunk } from './AgencyThunk';

const initialState: AgencyState = {
  allAgencies: [],
  currentAgency: null,
  isFetchedAllAgencies: false,
  loading: false,
  error: null,
};

export const agencySlice = createSlice({
  name: 'agency',
  initialState,
  reducers: {
    setCurrentAgency: (state, action: PayloadAction<Agency | null>) => {
      state.currentAgency = action.payload;
    },
    clearAgencyState: (state) => {
      state.allAgencies = [];
      state.currentAgency = null;
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchAgencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAgencies.fulfilled, (state, action) => {
        state.loading = false;
        state.allAgencies = action.payload;
        state.isFetchedAllAgencies = true;
        state.error = null;
      })
      .addCase(fetchAgencies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unknown Error';
      })

      // Create
      .addCase(createAgencyThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAgencyThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.allAgencies.unshift(action.payload);
      })
      .addCase(createAgencyThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unknown Error';
      });
  },
});

export const { setCurrentAgency, clearAgencyState } = agencySlice.actions;

export default agencySlice.reducer;
