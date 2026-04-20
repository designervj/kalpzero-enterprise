import { configureStore } from '@reduxjs/toolkit';
import pagesReducer from '../slices/pages/pagesSlice';
import landingTemplateReducer from '../slices/landingTemplate/landingTemplateSlice';
import tenantReducer from '../slices/kalp_master/master_tenant/TenantSlice';
import languageReducer from '../slices/system/languageSlice/LanguageSlice';
import themeReducer from '../slices/system/themeSlice/ThemeSlice';
import pluginReducer from '../slices/system/pluginSlice/PluginSlice';
import optionReducer from '../slices/system/optionSlice/OptionSlice';
import featureReducer from '../slices/system/featureSlice/FeatureSlice';
import productReducer from '../slices/prodoductSlice/productSlice';
import authReducer from '../slices/auth/authSlice';
export const store = configureStore({
    reducer: {
        auth: authReducer,
        pages: pagesReducer,
        landingTemplate: landingTemplateReducer,
        tenant: tenantReducer,
        language: languageReducer,  
        theme: themeReducer,
        plugin: pluginReducer,
        option:optionReducer,
        feature:featureReducer,
        product: productReducer
       
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
