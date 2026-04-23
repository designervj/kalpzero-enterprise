import { configureStore } from "@reduxjs/toolkit";
import authReducer from "@/hook/slices/auth/authSlice";
import pagesReducer from "@/hook/slices/pages/pagesSlice";
import landingTemplateReducer from "@/hook/slices/landingTemplate/landingTemplateSlice";
import tenantReducer from "@/hook/slices/kalp_master/master_tenant/TenantSlice";
import languageReducer from "@/hook/slices/system/languageSlice/LanguageSlice";
import themeReducer from "@/hook/slices/system/themeSlice/ThemeSlice";
import pluginReducer from "@/hook/slices/system/pluginSlice/PluginSlice";
import optionReducer from "@/hook/slices/system/optionSlice/OptionSlice";
import featureReducer from "@/hook/slices/system/featureSlice/FeatureSlice";
import productReducer from "@/hook/slices/prodoductSlice/productSlice";
import categoryReducer from "@/hook/slices/commerce/category/categorySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pages: pagesReducer,
    landingTemplate: landingTemplateReducer,
    tenant: tenantReducer,
    language: languageReducer,
    theme: themeReducer,
    plugin: pluginReducer,
    option: optionReducer,
    feature: featureReducer,
    product: productReducer,
    category: categoryReducer,
  },
});

// Infer the `RootState`,  `AppDispatch`, and `AppStore` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
export type AppStore = typeof store;
