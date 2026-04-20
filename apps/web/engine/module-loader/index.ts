import * as fs from 'fs';
import * as path from 'path';
import { ModuleContract } from '@core/contracts/module';
import { PresetSpec, RegistrySnapshot, ThemeSpec, NavEntrySpec, RouteSpec, ModuleRouteAffordance } from '@core/contracts/registry';

export class ModuleLoaderEngine {
    private registryDir: string;

    constructor(basePath: string) {
        this.registryDir = path.join(basePath, 'platform', 'registry');
    }

    private loadJson<T>(subPath: string): T[] {
        const fullPath = path.join(this.registryDir, subPath);
        if (!fs.existsSync(fullPath)) return [];

        return fs.readdirSync(fullPath)
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const content = fs.readFileSync(path.join(fullPath, file), 'utf-8');
                return JSON.parse(content) as T;
            });
    }

    private normalizeModuleKeys(keys: unknown): string[] {
        if (!Array.isArray(keys)) return [];
        return Array.from(
            new Set(
                keys
                    .filter((key): key is string => typeof key === 'string')
                    .map(key => key.trim())
                    .filter(Boolean)
            )
        );
    }

    public buildModuleRouteIndex(): ModuleRouteAffordance[] {
        const modulesRaw = this.loadJson<ModuleContract>('modules');
        const seen = new Set<string>();
        const entries: ModuleRouteAffordance[] = [];

        for (const mod of modulesRaw) {
            const navEntries = mod.ui?.navigation || [];
            for (const nav of navEntries) {
                if (!nav.path || typeof nav.path !== 'string') continue;
                const normalizedPath = nav.path.trim();
                if (!normalizedPath) continue;
                const key = `${mod.key}::${normalizedPath.toLowerCase()}`;
                if (seen.has(key)) continue;
                seen.add(key);
                entries.push({ moduleKey: mod.key, path: normalizedPath });
            }
        }

        return entries;
    }

    /**
     * Generates a fully composed snapshot for a specific tenant based on their active preset.
     */
    public composeSnapshot(activePresetId: string, runtimeEnabledModuleKeys?: string[]): RegistrySnapshot {
        // 1. Gather all raw resources
        const modulesRaw = this.loadJson<ModuleContract>('modules');
        const presetsRaw = this.loadJson<PresetSpec>('presets');
        const themesRaw = this.loadJson<ThemeSpec>('themes');

        // 2. Find the requested preset
        const preset = presetsRaw.find(p => p.id === activePresetId);
        if (!preset) {
            throw new Error(`Preset ${activePresetId} not found in registry.`);
        }

        const overrideEnabledKeys = runtimeEnabledModuleKeys !== undefined ? this.normalizeModuleKeys(runtimeEnabledModuleKeys) : undefined;
        const effectiveEnabledKeys = overrideEnabledKeys !== undefined
            ? overrideEnabledKeys
            : preset.enabledModuleKeys;
        const enabledKeySet = new Set(effectiveEnabledKeys);

        // 3. Filter enabled modules
        const modules: Record<string, ModuleContract> = {};
        modulesRaw.forEach(mod => {
            // If the mod's human key is in the preset's enabled list, include it
            if (enabledKeySet.has(mod.key)) {
                modules[mod.id] = mod;
            }
        });

        // 4. Compose Navigation, Routes, and Permissions master lists
        const routes: RouteSpec[] = [];
        const navigation: NavEntrySpec[] = [];
        const permissions: Record<string, { description: string, moduleId: string }> = {};
        const aliases: Record<string, string> = {};

        for (const [modId, mod] of Object.entries(modules)) {
            // Registry Aliases: human key maps to stable ID
            aliases[mod.key] = mod.id;

            if (mod.routes) routes.push(...mod.routes);
            if (mod.ui?.navigation) navigation.push(...mod.ui.navigation);

            if (mod.permissions) {
                mod.permissions.forEach(p => {
                    permissions[p.id] = { description: p.description, moduleId: mod.id };
                });
            }
        }

        // 5. Build Themes dictionary
        const themes: Record<string, ThemeSpec> = {};
        themesRaw.forEach(t => {
            themes[t.id] = t;
        });

        // 6. Build Presets dictionary
        const presets: Record<string, PresetSpec> = {};
        presetsRaw.forEach(p => {
            presets[p.id] = p;
        });

        return {
            timestamp: Date.now(),
            modules,
            aliases,
            routes,
            navigation,
            permissions,
            themes,
            presets,
            activePresetId: preset.id,
            activeThemeId: preset.themeId,
        };
    }
}
