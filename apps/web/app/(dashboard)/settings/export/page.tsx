'use client';

import { useEffect, useState } from 'react';
import { Download, Eye, Lock, Activity, Sparkles, Palette, Copy, Check, Save, RefreshCw, Wand2 } from 'lucide-react';
import { applyRuntimeTheme } from '@/lib/theme-runtime';
import { SmartColorPicker } from '@/components/ui/smart-color-picker';

type ActiveTab = 'preview' | 'templates' | 'brand' | 'raw';
type ThemeMode = 'dark' | 'light';
type ThemeChrome = 'glass' | 'flat' | 'solid';

type ExportBrand = {
    primary: string;
    secondary: string;
    background: string;
    accent: string;
    fontFamily: string;
    borderRadius: string;
    mode: ThemeMode;
    chrome: ThemeChrome;
};

type ThemePreset = {
    key: string;
    name: string;
    primary: string;
    secondary: string;
    background: string;
    accent?: string;
};

const FONT_OPTIONS = ['Inter', 'Roboto', 'Outfit', 'Poppins', 'DM Sans', 'Plus Jakarta Sans', 'Space Grotesk', 'Manrope'];

const ADMIN_EXPORT_TEMPLATES: Array<{
    key: string;
    label: string;
    description: string;
    brand: Partial<ExportBrand>;
}> = [
    {
        key: 'cyber-glass-dark',
        label: 'Cyber Glass (Dark)',
        description: 'Current dark neon baseline with glass depth.',
        brand: {
            primary: '#00f0ff',
            secondary: '#8b5cf6',
            accent: '#10b981',
            background: '#030712',
            fontFamily: 'Inter',
            borderRadius: '12',
            mode: 'dark',
            chrome: 'glass',
        },
    },
    {
        key: 'minimal-flat-dark',
        label: 'Minimal Flat (Dark)',
        description: 'Less glass, less glow, cleaner dark surface.',
        brand: {
            primary: '#22d3ee',
            secondary: '#38bdf8',
            accent: '#22c55e',
            background: '#0b1220',
            fontFamily: 'DM Sans',
            borderRadius: '8',
            mode: 'dark',
            chrome: 'flat',
        },
    },
    {
        key: 'minimal-flat-light',
        label: 'Minimal Flat (Light)',
        description: 'Light mode with soft contrast and minimal chrome.',
        brand: {
            primary: '#0ea5e9',
            secondary: '#14b8a6',
            accent: '#16a34a',
            background: '#f8fafc',
            fontFamily: 'Plus Jakarta Sans',
            borderRadius: '8',
            mode: 'light',
            chrome: 'flat',
        },
    },
    {
        key: 'clean-solid-light',
        label: 'Clean Solid (Light)',
        description: 'Solid panels and stronger enterprise separation.',
        brand: {
            primary: '#2563eb',
            secondary: '#0891b2',
            accent: '#16a34a',
            background: '#f1f5f9',
            fontFamily: 'Manrope',
            borderRadius: '10',
            mode: 'light',
            chrome: 'solid',
        },
    },
];

const DEFAULT_BRAND: ExportBrand = {
    primary: '#00f0ff',
    secondary: '#8b5cf6',
    background: '#030712',
    accent: '#10b981',
    fontFamily: 'Inter',
    borderRadius: '12',
    mode: 'dark',
    chrome: 'glass',
};

function normalizeMode(value: unknown): ThemeMode {
    return value === 'light' ? 'light' : 'dark';
}

function normalizeChrome(value: unknown): ThemeChrome {
    if (value === 'flat' || value === 'solid') return value;
    return 'glass';
}

export default function ExportPage() {
    const [config, setConfig] = useState<Record<string, unknown> | null>(null);
    const [tenant, setTenant] = useState<Record<string, unknown> | null>(null);
    const [brandKit, setBrandKit] = useState<Record<string, unknown> | null>(null);
    const [themePresets, setThemePresets] = useState<ThemePreset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<ActiveTab>('preview');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [applying, setApplying] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');
    const [brand, setBrand] = useState<ExportBrand>(DEFAULT_BRAND);

    useEffect(() => {
        Promise.all([
            fetch('/api/export/config').then(res => res.json()),
            fetch('/api/settings/tenant').then(res => res.json()),
            fetch('/api/settings/brand').then(res => res.json()),
            fetch('/api/system/themes').then(res => res.json()),
        ]).then(([exportData, tenantData, brandData, presetsData]) => {
            if (exportData.error) {
                setError(exportData.error);
                return;
            }

            setConfig(exportData);
            setTenant(tenantData);
            setBrandKit(brandData && !brandData.error ? brandData : null);
            setThemePresets(Array.isArray(presetsData) ? presetsData : []);

            const tenantBrand = (tenantData?.brand || {}) as Record<string, string>;
            const brandColors = (brandData?.colors || {}) as Record<string, string>;
            const typography = (brandData?.typography || {}) as Record<string, string>;
            const buttons = (brandData?.buttons || {}) as Record<string, string>;
            const appearance = (brandData?.appearance || {}) as Record<string, string>;

            setBrand({
                primary: brandColors.primary || tenantBrand.primary || DEFAULT_BRAND.primary,
                secondary: brandColors.secondary || tenantBrand.secondary || DEFAULT_BRAND.secondary,
                background: brandColors.background || tenantBrand.background || DEFAULT_BRAND.background,
                accent: brandColors.accent || tenantBrand.accent || DEFAULT_BRAND.accent,
                fontFamily: typography.bodyFont || DEFAULT_BRAND.fontFamily,
                borderRadius: buttons.radius || DEFAULT_BRAND.borderRadius,
                mode: normalizeMode(appearance.mode),
                chrome: normalizeChrome(appearance.chrome),
            });
        }).catch(err => {
            const message = err instanceof Error ? err.message : 'Failed to load white-label data.';
            setError(message);
        }).finally(() => setLoading(false));
    }, []);

    const toRuntimePayload = (payload: ExportBrand) => ({
        colors: {
            primary: payload.primary,
            secondary: payload.secondary,
            accent: payload.accent,
            background: payload.background,
            foreground: payload.mode === 'light' ? '#0f172a' : '#f8fafc',
            muted: payload.mode === 'light' ? '#475569' : '#94a3b8',
            border: payload.mode === 'light' ? '#94a3b8' : '#1e293b',
            card: payload.mode === 'light' ? '#ffffff' : '#0f172a',
        },
        typography: { bodyFont: payload.fontFamily },
        buttons: { radius: payload.borderRadius },
        appearance: { mode: payload.mode, chrome: payload.chrome },
    });

    const applyBrandLive = (payload: ExportBrand) => {
        const runtimePayload = toRuntimePayload(payload);
        applyRuntimeTheme(runtimePayload);
        window.dispatchEvent(new CustomEvent('kalp-theme-refresh', { detail: { payload: runtimePayload } }));
    };

    const handleApplyToAdmin = () => {
        setApplying(true);
        applyBrandLive(brand);
        setTimeout(() => setApplying(false), 200);
    };

    const applyTemplate = (template: Partial<ExportBrand>, templateKey: string) => {
        const nextBrand: ExportBrand = {
            ...brand,
            ...template,
            mode: normalizeMode(template.mode ?? brand.mode),
            chrome: normalizeChrome(template.chrome ?? brand.chrome),
        };
        setSelectedTemplate(templateKey);
        setBrand(nextBrand);
        applyBrandLive(nextBrand);
    };

    const handleDownload = () => {
        if (!config) return;
        const exportPayload = { ...config, brand };
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kalp-zero-export-${String((config.tenant as Record<string, string> | undefined)?.key || 'config')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCopy = () => {
        if (!config) return;
        const exportPayload = { ...config, brand };
        navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSaveBrand = async () => {
        setSaving(true);
        try {
            const nextBrandKit = {
                ...(brandKit || {}),
                colors: {
                    ...((brandKit?.colors as Record<string, string> | undefined) || {}),
                    primary: brand.primary,
                    secondary: brand.secondary,
                    background: brand.background,
                    accent: brand.accent,
                },
                typography: {
                    ...((brandKit?.typography as Record<string, string> | undefined) || {}),
                    bodyFont: brand.fontFamily,
                },
                buttons: {
                    ...((brandKit?.buttons as Record<string, string> | undefined) || {}),
                    radius: brand.borderRadius,
                },
                appearance: {
                    ...((brandKit?.appearance as Record<string, string> | undefined) || {}),
                    mode: brand.mode,
                    chrome: brand.chrome,
                },
            };

            await Promise.all([
                fetch('/api/settings/tenant', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        brand: {
                            primary: brand.primary,
                            secondary: brand.secondary,
                            background: brand.background,
                            accent: brand.accent,
                        },
                    }),
                }),
                fetch('/api/settings/brand', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nextBrandKit),
                }),
            ]);

            setBrandKit(nextBrandKit);
            applyBrandLive(brand);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                    <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">Loading Export Config...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400"><Lock size={24} /></div>
                    <div><h2 className="text-2xl font-bold text-white">White-Label Export</h2><p className="text-slate-400 text-xs font-mono">Enterprise Feature</p></div>
                </div>
                <div className="max-w-xl mx-auto mt-20 text-center">
                    <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center mx-auto mb-6"><Lock size={32} className="text-slate-500" /></div>
                    <h3 className="text-xl font-bold text-white mb-2">Feature Locked</h3>
                    <p className="text-slate-400 text-sm mb-6">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Download size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                            White-Label Export
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest border border-emerald-500/30 font-bold">Enterprise</span>
                        </h2>
                        <p className="text-slate-400 text-xs font-mono">Templates, live apply, brand customization and export config</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleCopy}
                        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border border-slate-700"
                    >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                    <button
                        onClick={handleApplyToAdmin}
                        disabled={applying}
                        className="flex items-center gap-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
                    >
                        {applying ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                        Apply to Admin
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 bg-emerald-500 text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        <Download size={16} /> Download Config
                    </button>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {([
                    ['preview', '📊 Tenant Overview'],
                    ['templates', '🧩 Templates'],
                    ['brand', '🎨 Brand Editor'],
                    ['raw', '📄 Raw Config'],
                ] as const).map(([tab, label]) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 'preview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4"><Activity size={16} className="text-cyan-400" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Tenant Identity</h3></div>
                        <div className="space-y-3 font-mono text-xs">
                            {[['Key', String((config?.tenant as Record<string, string> | undefined)?.key || '')], ['Name', String((config?.tenant as Record<string, string> | undefined)?.name || '')], ['Industry', String((config?.tenant as Record<string, string> | undefined)?.industry || 'Not set')], ['Subscription', String((config?.subscription as Record<string, string> | undefined)?.level || 'starter')]].map(([label, val]) => (
                                <div key={label} className="flex justify-between py-2 border-b border-slate-800">
                                    <span className="text-slate-500">{label}</span>
                                    <span className="text-cyan-300">{val}</span>
                                </div>
                            ))}
                            <div className="flex justify-between py-2">
                                <span className="text-slate-500">Enabled Modules</span>
                                <span className="text-emerald-400">{Array.isArray(tenant?.enabledModules) ? tenant.enabledModules.length : 0} active</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4"><Sparkles size={16} className="text-purple-400" /><h3 className="text-sm font-bold text-white uppercase tracking-wider">Current Brand</h3></div>
                        <div className="space-y-3">
                            {([['primary', brand.primary], ['secondary', brand.secondary], ['background', brand.background], ['accent', brand.accent]] as const).map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between py-2 border-b border-slate-800">
                                    <span className="text-slate-500 text-xs font-mono">{key}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 rounded" style={{ backgroundColor: val }}></div>
                                        <span className="text-xs font-mono text-slate-300">{val}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 h-12 rounded-lg overflow-hidden flex">
                            <div className="flex-1" style={{ backgroundColor: brand.primary }}></div>
                            <div className="flex-1" style={{ backgroundColor: brand.secondary }}></div>
                            <div className="flex-1" style={{ backgroundColor: brand.accent }}></div>
                            <div className="flex-1" style={{ backgroundColor: brand.background }}></div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'templates' && (
                <div className="space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Admin Templates</h3>
                        <p className="text-xs text-slate-400 mb-4">Pick a template and apply it instantly to the current admin UI. Save after preview to persist.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {ADMIN_EXPORT_TEMPLATES.map((template) => (
                                <button
                                    key={template.key}
                                    onClick={() => applyTemplate(template.brand, template.key)}
                                    className={`text-left rounded-xl border p-4 transition-all ${selectedTemplate === template.key ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-slate-700 bg-black/30 hover:border-slate-500'}`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="font-semibold text-white">{template.label}</span>
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500">{template.brand.mode}/{template.brand.chrome}</span>
                                    </div>
                                    <div className="flex h-5 rounded overflow-hidden border border-slate-700/80 mb-2">
                                        <div className="flex-1" style={{ backgroundColor: template.brand.primary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: template.brand.secondary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: template.brand.background }}></div>
                                    </div>
                                    <p className="text-xs text-slate-400">{template.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">System Theme Presets</h3>
                        <p className="text-xs text-slate-400 mb-4">These are loaded from `kalp_system.theme_presets` and mapped into your brand colors.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {themePresets.map((preset) => (
                                <button
                                    key={preset.key}
                                    onClick={() => applyTemplate({
                                        primary: preset.primary,
                                        secondary: preset.secondary,
                                        background: preset.background,
                                        accent: preset.accent || brand.accent,
                                    }, `preset:${preset.key}`)}
                                    className={`text-left rounded-lg border p-3 transition-all ${selectedTemplate === `preset:${preset.key}` ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-slate-700 bg-black/30 hover:border-slate-500'}`}
                                >
                                    <div className="text-sm font-semibold text-white mb-2">{preset.name}</div>
                                    <div className="flex h-4 rounded overflow-hidden border border-slate-700/80">
                                        <div className="flex-1" style={{ backgroundColor: preset.primary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: preset.secondary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: preset.background }}></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'brand' && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2"><Palette size={16} className="text-purple-400" /> Brand Editor</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleApplyToAdmin}
                                disabled={applying}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-all disabled:opacity-50"
                            >
                                {applying ? <RefreshCw size={14} className="animate-spin" /> : <Wand2 size={14} />}
                                Apply
                            </button>
                            <button onClick={handleSaveBrand} disabled={saving}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${saved ? 'bg-emerald-500 text-black' : 'bg-purple-500 text-white hover:bg-purple-400'}`}>
                                {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Brand'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        {([['primary', 'Primary'], ['secondary', 'Secondary'], ['accent', 'Accent'], ['background', 'Background']] as const).map(([key, label]) => (
                            <div key={key}>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">{label} Color</label>
                                <div className="flex items-center gap-3">
                                    <SmartColorPicker value={brand[key]} onChange={next => setBrand({ ...brand, [key]: next })} variant="dark" className="w-[184px]" />
                                    <input
                                        type="text"
                                        value={brand[key]}
                                        onChange={e => setBrand({ ...brand, [key]: e.target.value })}
                                        className="flex-1 bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-purple-500/50"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Font Family</label>
                            <select
                                value={brand.fontFamily}
                                onChange={e => setBrand({ ...brand, fontFamily: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer appearance-none"
                            >
                                {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Mode</label>
                            <select
                                value={brand.mode}
                                onChange={e => setBrand({ ...brand, mode: normalizeMode(e.target.value) })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer appearance-none"
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Chrome</label>
                            <select
                                value={brand.chrome}
                                onChange={e => setBrand({ ...brand, chrome: normalizeChrome(e.target.value) })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer appearance-none"
                            >
                                <option value="glass">Glass</option>
                                <option value="flat">Flat</option>
                                <option value="solid">Solid</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Border Radius (px)</label>
                            <input
                                type="range"
                                min="0"
                                max="24"
                                value={brand.borderRadius}
                                onChange={e => setBrand({ ...brand, borderRadius: e.target.value })}
                                className="w-full accent-purple-500"
                            />
                            <span className="text-xs text-slate-500 font-mono">{brand.borderRadius}px</span>
                        </div>
                    </div>

                    <div className="border border-slate-700 rounded-xl p-6 mt-4" style={{ backgroundColor: brand.background, fontFamily: brand.fontFamily }}>
                        <h4 className="font-bold text-lg mb-2" style={{ color: brand.primary }}>{String((config?.tenant as Record<string, string> | undefined)?.name || 'Your Brand')}</h4>
                        <p className="text-sm mb-4" style={{ color: brand.mode === 'light' ? '#334155' : '#94a3b8' }}>Live preview of the chosen white-label combination.</p>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 text-sm font-bold text-black" style={{ backgroundColor: brand.primary, borderRadius: `${brand.borderRadius}px` }}>Primary CTA</button>
                            <button className="px-4 py-2 text-sm font-bold text-white" style={{ backgroundColor: brand.secondary, borderRadius: `${brand.borderRadius}px` }}>Secondary</button>
                            <button className="px-4 py-2 text-sm font-bold text-black" style={{ backgroundColor: brand.accent, borderRadius: `${brand.borderRadius}px` }}>Accent</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'raw' && (
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-black/30">
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-slate-400" />
                            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">Raw Config Preview</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">v{String(config?._exportVersion || '1.0.0')}</span>
                    </div>
                    <pre className="p-6 text-xs text-cyan-200/80 font-mono overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
                        {JSON.stringify({ ...config, brand }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
