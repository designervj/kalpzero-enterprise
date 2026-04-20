import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OptionState } from './OptionTypes';
import {
    fetchOptions,
    fetchOptionById,
    createOption,
    updateOption,
    deleteOption
} from './OptionThunk';
import { CapabilityDefinition } from '@/app/(dashboard)/settings/tenant/tenantType';

const initialState: OptionState = {
    allOptions: [],
    currentOption: null,
    isFetchedOption: false,
    loading: false,
    error: null,
};

export const optionSlice = createSlice({
    name: 'option',
    initialState,
    reducers: {
        setCurrentOption: (state, action: PayloadAction<CapabilityDefinition | null>) => {
            state.currentOption = action.payload;
        },
        clearOptionState: (state) => {
            state.allOptions = [];
            state.currentOption = null;
            state.isFetchedOption = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchOptions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOptions.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedOption = true;
                state.allOptions = action.payload;
                state.error = null;
            })
            .addCase(fetchOptions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Fetch Single
            .addCase(fetchOptionById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOptionById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentOption = action.payload;
            })
            .addCase(fetchOptionById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Create
            .addCase(createOption.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOption.fulfilled, (state, action) => {
                state.loading = false;
                state.allOptions.push(action.payload);
            })
            .addCase(createOption.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

      

        
    },
});

export const { setCurrentOption, clearOptionState } = optionSlice.actions;

export default optionSlice.reducer;
