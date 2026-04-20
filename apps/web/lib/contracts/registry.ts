export interface NavEntrySpec {
    id: string;
    label: string;
    path: string;
    icon?: string;
    parentId?: string;
    order?: number;
    requiredPermissionId?: string;
    businessContexts?: string[];
}

export interface RegistrySnapshot {
    timestamp: number;
    activePresetId: string;
    activeThemeId?: string;
    navigation: NavEntrySpec[];
    navigationOverrides?: Record<string, Partial<NavEntrySpec>>;
    activeBusinessContexts?: string[];
    enabledPlugins?: string[];
    vocabularyProfile?: any;
    modules: Record<string, import('./module').ModuleContract>;
    aliases: Record<string, string>;
    routes: any[];
    permissions: Record<string, { description: string; moduleId: string }>;
    themes: Record<string, any>;
    presets: Record<string, any>;
    // Runtime extension fields
    moduleRouteIndex?: ModuleRouteAffordance[];
    enabledModules?: string[];
    activeTenantKey?: string;
    featureDefinitions?: any[];
    optionDefinitions?: any[];
    pluginDefinitions?: any[];
    enabledFeatures?: string[];
    enabledOptions?: string[];
}

export interface ThemeSpec {
    id: string;
    name: string;
    // Add more fields as discovered
}

export interface PresetSpec {
    id: string;
    name: string;
    enabledModuleKeys: string[];
    themeId: string;
}

export interface RouteSpec {
    path: string;
    component?: string;
}

export interface ModuleRouteAffordance {
    moduleKey: string;
    path: string;
}
