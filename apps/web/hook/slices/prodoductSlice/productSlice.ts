import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../../components/public/product/types';

export interface ProductState {
    allProduct: Product[];
    fetchedLoading: boolean;
    productLoading: boolean;
    error: string | null;
}

const initialState: ProductState = {
    allProduct: [],
    fetchedLoading: false,
    productLoading: false,
    error: null,
};

export const productSlice = createSlice({
    name: 'product',
    initialState,
    reducers: {
        setAllProducts: (state, action: PayloadAction<Product[]>) => {
            state.allProduct = action.payload;
        },
        setFetchedLoading: (state, action: PayloadAction<boolean>) => {
            state.fetchedLoading = action.payload;
        },
        setProductLoading: (state, action: PayloadAction<boolean>) => {
            state.productLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
        },
        clearProductState: (state) => {
            state.allProduct = [];
            state.fetchedLoading = false;
            state.productLoading = false;
            state.error = null;
        }
    }
});

export const { setAllProducts, setFetchedLoading, setProductLoading, setError, clearProductState } = productSlice.actions;

export default productSlice.reducer;
