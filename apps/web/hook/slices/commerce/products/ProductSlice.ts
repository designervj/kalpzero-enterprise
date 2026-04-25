import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, ProductState } from './ProductType';
import { createProduct, deleteProduct, fetchProductById, fetchProducts, updateProduct } from './ProductThunk';


const initialState: ProductState = {
  allProducts: [],
  currentProduct: null,
  isFetchedProducts: false,
  isError: false,
  isLoading: false,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setAllProducts: (state, action: PayloadAction<Product[]>) => {
      state.allProducts = action.payload;
      state.isFetchedProducts = true;
      state.isError = false;
    },
    setCurrentProduct: (state, action: PayloadAction<Product | null>) => {
      state.currentProduct = action.payload;
    },
    setProductFormField: (state, action: PayloadAction<{ field: keyof Product; value: any }>) => {
      if (state.currentProduct) {
        (state.currentProduct as any)[action.payload.field] = action.payload.value;
      }
    },
    setPricingField: (state, action: PayloadAction<{ field: keyof any; value: any }>) => {
      if (state.currentProduct) {
        if (!state.currentProduct.pricing) {
          state.currentProduct.pricing = {
            price: 0,
            compareAtPrice: 0,
            costPerItem: 0,
            chargeTax: true,
            trackQuantity: true,
          };
        }
        (state.currentProduct.pricing as any)[action.payload.field] = action.payload.value;
      }
    },
    resetProductForm: (state) => {
      state.currentProduct = {
        name: "",
        sku: "",
        slug: "",
        description: "",
        status: "active",
        type: "physical",
        categoryIds: [],
        attributeSetIds: [],
        pricing: {
          price: 0,
          compareAtPrice: 0,
          costPerItem: 0,
          chargeTax: true,
          trackQuantity: true,
        },
        options: [],
        variants: [],
        gallery: [],
        primaryImageId: "",
        primaryCategoryId: "",
        relatedProductIds: [],
        templateKey: "product-split",
      };
    },
    setProductLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProductError: (state, action: PayloadAction<boolean>) => {
      state.isError = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchedProducts = true;
        state.allProducts = action.payload;
      })
      .addCase(fetchProducts.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Fetch By ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state) => {
        state.isLoading = false;
        state.isError = true;
      })
      // Create
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allProducts.unshift(action.payload);
      })
      .addCase(createProduct.rejected, (state) => {
        state.isLoading = false;
      })
      // Update
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.allProducts.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.allProducts[index] = action.payload;
        }
      })
      .addCase(updateProduct.rejected, (state) => {
        state.isLoading = false;
      })
      // Delete
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.allProducts = state.allProducts.filter(p => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { 
  setAllProducts, 
  setCurrentProduct, 
  setProductFormField,
  setPricingField,
  resetProductForm,
  setProductLoading, 
  setProductError 
} = productSlice.actions;

export default productSlice.reducer;
