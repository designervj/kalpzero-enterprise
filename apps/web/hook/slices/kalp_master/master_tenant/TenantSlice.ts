import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {  fetchTenants, createTenant, updateTenant, deleteTenant } from './TenantThunk';
import { TenantSwitcherOption } from '@/components/AdminLayout';
import { Tenant } from '@/app/(dashboard)/settings/tenant/tenantType';

export interface TenantState {
    allTenant: TenantSwitcherOption[];
    currentTenant: Tenant |null;
    isFetchedAlltenant: boolean;
    loading: boolean;
    error: string | null;
}

const initialState: TenantState = {
    allTenant: [],
    currentTenant: null,
    isFetchedAlltenant: false,
    loading: false,
    error: null,
};

export const tenantSlice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        setCurrentTenant: (state, action: PayloadAction< Tenant|null>) => {
            state.currentTenant = action.payload;
        },
        clearTenantState: (state) => {
            state.allTenant = [];
            state.currentTenant = null;
            state.isFetchedAlltenant = false;
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchTenants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTenants.fulfilled, (state, action) => {
                state.loading = false;
                state.isFetchedAlltenant = true;
                state.allTenant = action.payload;
                state.error = null;
            })
            .addCase(fetchTenants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Create
            .addCase(createTenant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createTenant.fulfilled, (state, action) => {
                state.loading = false;
                state.allTenant.unshift(action.payload);
            })
            .addCase(createTenant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Update
            .addCase(updateTenant.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateTenant.fulfilled, (state, action) => {
                state.loading = false;
               state.currentTenant=action.payload;    
            })
            .addCase(updateTenant.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Unknown Error';
            })

            // Delete
      
    },
});

export const { setCurrentTenant, clearTenantState } = tenantSlice.actions;

export default tenantSlice.reducer;
