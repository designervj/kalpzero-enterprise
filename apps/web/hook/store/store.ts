import { configureStore } from '@reduxjs/toolkit';
import pagesReducer from '../slices/pages/pagesSlice';
import landingTemplateReducer from '../slices/landingTemplate/landingTemplateSlice';
import tenantReducer from '../slices/kalp_master/master_tenant/TenantSlice';
import languageReducer from '../slices/system/languageSlice/LanguageSlice';
import themeReducer from '../slices/system/themeSlice/ThemeSlice';
import pluginReducer from '../slices/system/pluginSlice/PluginSlice';
import optionReducer from '../slices/system/optionSlice/OptionSlice';
import featureReducer from '../slices/system/featureSlice/FeatureSlice';
import productReducer from '../slices/commerce/products/ProductSlice';
import authReducer from '../slices/auth/authSlice';
import categoryReducer from '../slices/commerce/category/categorySlice';
import attributeReducer from '../slices/commerce/attribute/attributeSlice';
import brandReducer from '../slices/commerce/brand/BrandSlice';
import vendorReducer from '../slices/commerce/vendor/VendorSlice';
import warehouseReducer from '../slices/commerce/warehouse/WarehouseSlice';
import agencyReducer from '../slices/kalp_master/agencies/AgencySlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tenant: tenantReducer,
        pages: pagesReducer,
        landingTemplate: landingTemplateReducer,
        category: categoryReducer,
        attribute: attributeReducer,
        language: languageReducer,  
        theme: themeReducer,
        plugin: pluginReducer,
        option:optionReducer,
        feature:featureReducer,
        product: productReducer,
        brand: brandReducer,
        vendor: vendorReducer,
        warehouse: warehouseReducer,
        agency: agencyReducer
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
