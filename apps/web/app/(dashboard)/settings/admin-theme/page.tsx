'use client';

import { useEffect, useMemo, useState } from 'react';
import { Palette, Save, RefreshCw, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SmartColorPicker } from '@/components/ui/smart-color-picker';
import { applyRuntimeTheme } from '@/lib/theme-runtime';
import { ADMIN_THEME_PRESETS, DEFAULT_ADMIN_THEME, mergeAdminTheme, type AdminTheme, type AdminThemePreset } from '@/lib/admin-theme';

const FONT_OPTIONS = [
    'Inter',
    'Plus Jakarta Sans',
    'DM Sans',
    'Manrope',
    'Space Grotesk',
    'Poppins',
    'Roboto',
    'JetBrains Mono',
];

const ADMIN_MODE_PRESETS: Array<{ key: 'default_dark' | 'default_light'; label: string; description: string; mode: 'dark' | 'light' }> = [
    {
        key: 'default_dark',
        label: 'Default Dark',
        description: 'Current Kalp dark baseline',
        mode: 'dark',
    },
    {
        key: 'default_light',
        label: 'Default Light',
        description: 'Light admin baseline',
        mode: 'light',
    },
];

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (val: string) => void }) {
    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
                <SmartColorPicker value={value} onChange={onChange} variant="dark" className="w-[184px]" />
                <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono text-xs" />
            </div>
        </div>
    );
}

export default function AdminThemeSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [applying, setApplying] = useState(false);
    const [activePreset, setActivePreset] = useState('custom');
    const [theme, setTheme] = useState<AdminTheme>(DEFAULT_ADMIN_THEME);
    const [presets, setPresets] = useState<AdminThemePreset[]>(ADMIN_THEME_PRESETS);

    const applyLive = (payload: AdminTheme) => {
        applyRuntimeTheme(payload);
        window.dispatchEvent(new CustomEvent('kalp-theme-refresh', { detail: { payload } }));
    };

    useEffect(() => {
        Promise.all([
            fetch('/api/settings/admin-theme').then(res => res.json()),
            fetch('/api/system/admin-themes').then(res => res.json()).catch(() => []),
        ])
            .then(([data, systemPresets]) => {
                if (data && !data.error) {
                    const merged = mergeAdminTheme(data);
                    setTheme(merged);
                    applyLive(merged);
                }
                if (Array.isArray(systemPresets) && systemPresets.length > 0) {
                    const mapped = systemPresets.map((preset: any) => ({
                        key: String(preset.key || preset._id || 'preset'),
                        label: String(preset.name || preset.label || 'Preset'),
                        description: String(preset.description || ''),
                        theme: preset.theme || {},
                    })) as AdminThemePreset[];
                    setPresets(mapped);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const palette = useMemo(() => theme.colors, [theme.colors]);

    const handleSave = async () => {
        setSaving(true);
        await fetch('/api/settings/admin-theme', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(theme),
        });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleApply = () => {
        setApplying(true);
        applyLive(theme);
        setTimeout(() => setApplying(false), 250);
    };

    const handlePreset = (presetKey: string) => {
        const preset = presets.find(p => p.key === presetKey);
        if (!preset) return;
        const merged = mergeAdminTheme({
            ...theme,
            ...preset.theme,
            colors: { ...theme.colors, ...(preset.theme.colors || {}) },
            typography: { ...theme.typography, ...(preset.theme.typography || {}) },
            buttons: { ...theme.buttons, ...(preset.theme.buttons || {}) },
            appearance: { ...theme.appearance, ...(preset.theme.appearance || {}) },
            layout: { ...theme.layout, ...(preset.theme.layout || {}) },
        });
        setActivePreset(presetKey);
        setTheme(merged);
        applyLive(merged);
    };

    const applyModePreset = (mode: 'light' | 'dark') => {
        const lightColors = {
            primary: '#0ea5e9',
            secondary: '#6366f1',
            accent: '#16a34a',
            background: '#f0f4f8',
            foreground: '#0f172a',
            muted: '#475569',
            border: '#cbd5e1',
            card: '#ffffff',
        };
        const darkColors = {
            primary: DEFAULT_ADMIN_THEME.colors.primary,
            secondary: DEFAULT_ADMIN_THEME.colors.secondary,
            accent: DEFAULT_ADMIN_THEME.colors.accent,
            background: DEFAULT_ADMIN_THEME.colors.background,
            foreground: DEFAULT_ADMIN_THEME.colors.foreground,
            muted: DEFAULT_ADMIN_THEME.colors.muted,
            border: DEFAULT_ADMIN_THEME.colors.border,
            card: DEFAULT_ADMIN_THEME.colors.card,
        };
        const merged = mergeAdminTheme({
            ...theme,
            appearance: { ...theme.appearance, mode },
            colors: mode === 'light' ? lightColors : darkColors,
        });
        setActivePreset(mode === 'light' ? 'default-light' : 'default-dark');
        setTheme(merged);
        applyLive(merged);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
                <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Loading admin theme...</span>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(14,165,233,0.25)]">
                        <Palette size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Admin Theme</h2>
                        <p className="text-slate-400 text-xs">Separate admin appearance from tenant branding.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleApply} disabled={applying || saving}>
                        {applying ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Apply Live
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                        {saving ? 'Saving...' : saved ? 'Saved' : 'Save Theme'}
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4 space-y-4 lg:col-span-2">
                    <div>
                        <h3 className="text-sm font-bold text-white">Quick Modes</h3>
                        <p className="text-[11px] text-slate-500">Use explicit defaults or jump directly to template presets.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        {ADMIN_MODE_PRESETS.map((preset) => (
                            <button
                                key={preset.key}
                                type="button"
                                onClick={() => applyModePreset(preset.mode)}
                                className="rounded-lg border border-slate-700 bg-black/25 p-3 text-left transition hover:border-cyan-400/60"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-white">{preset.label}</span>
                                    <Badge className="text-[9px] uppercase tracking-widest bg-slate-800/80 border border-slate-700 text-slate-300">
                                        {preset.mode}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-[11px] text-slate-400">{preset.description}</p>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={() => document.getElementById('admin-theme-templates')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            className="rounded-lg border border-violet-500/40 bg-violet-500/10 p-3 text-left transition hover:border-violet-400"
                        >
                            <div className="text-sm font-semibold text-violet-100">Admin Templates</div>
                            <p className="mt-1 text-[11px] text-violet-200/90">Open full template catalog and apply any preset.</p>
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4 space-y-4">
                    <div id="admin-theme-templates">
                        <h3 className="text-sm font-bold text-white">Admin Templates</h3>
                        <p className="text-[11px] text-slate-500">Pick a baseline and customize afterwards.</p>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {presets.map(preset => {
                            const isActive = activePreset === preset.key;
                            const colors = mergeAdminTheme(preset.theme).colors;
                            return (
                                <button
                                    key={preset.key}
                                    type="button"
                                    onClick={() => handlePreset(preset.key)}
                                    className={`text-left rounded-lg border p-3 transition-all ${isActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700 bg-black/30 hover:border-slate-500'}`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-sm font-semibold text-white">{preset.label}</span>
                                        <Badge className="text-[9px] uppercase tracking-widest bg-slate-800/80 border border-slate-700 text-slate-300">
                                            {preset.theme.appearance?.mode || 'dark'}
                                        </Badge>
                                    </div>
                                    <div className="flex h-5 rounded-md overflow-hidden mb-2 border border-slate-700/80">
                                        <div className="flex-1" style={{ backgroundColor: colors.primary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: colors.secondary }}></div>
                                        <div className="flex-1" style={{ backgroundColor: colors.background }}></div>
                                    </div>
                                    <p className="text-[11px] text-slate-400">{preset.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4 space-y-4">
                    <h3 className="text-sm font-bold text-white">Appearance Controls</h3>

                    <div className="space-y-2">
                        <Label>Theme Mode</Label>
                        <Select
                            value={theme.appearance.mode}
                            onChange={e => setTheme({ ...theme, appearance: { ...theme.appearance, mode: e.target.value as AdminTheme['appearance']['mode'] } })}
                        >
                            <option value="system">System</option>
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Chrome Style</Label>
                        <Select
                            value={theme.appearance.chrome}
                            onChange={e => setTheme({ ...theme, appearance: { ...theme.appearance, chrome: e.target.value as AdminTheme['appearance']['chrome'] } })}
                        >
                            <option value="glass">Glass</option>
                            <option value="flat">Flat</option>
                            <option value="solid">Solid</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Sidebar</Label>
                        <Select
                            value={theme.layout.sidebar}
                            onChange={e => setTheme({ ...theme, layout: { ...theme.layout, sidebar: e.target.value as AdminTheme['layout']['sidebar'] } })}
                        >
                            <option value="inset">Inset</option>
                            <option value="floating">Floating</option>
                            <option value="sidebar">Sidebar</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Layout</Label>
                        <Select
                            value={theme.layout.layout}
                            onChange={e => setTheme({ ...theme, layout: { ...theme.layout, layout: e.target.value as AdminTheme['layout']['layout'] } })}
                        >
                            <option value="default">Default</option>
                            <option value="compact">Compact</option>
                            <option value="full">Full</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Density</Label>
                        <Select
                            value={theme.layout.density}
                            onChange={e => setTheme({ ...theme, layout: { ...theme.layout, density: e.target.value as AdminTheme['layout']['density'] } })}
                        >
                            <option value="default">Default</option>
                            <option value="compact">Compact</option>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Direction</Label>
                        <Select
                            value={theme.layout.direction}
                            onChange={e => setTheme({ ...theme, layout: { ...theme.layout, direction: e.target.value as AdminTheme['layout']['direction'] } })}
                        >
                            <option value="ltr">Left to Right</option>
                            <option value="rtl">Right to Left</option>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-white">Theme Tokens</h3>
                    <p className="text-[11px] text-slate-500">Adjust main palette colors (admin only).</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <ColorField label="Primary" value={palette.primary} onChange={val => setTheme({ ...theme, colors: { ...theme.colors, primary: val } })} />
                    <ColorField label="Secondary" value={palette.secondary} onChange={val => setTheme({ ...theme, colors: { ...theme.colors, secondary: val } })} />
                    <ColorField label="Accent" value={palette.accent} onChange={val => setTheme({ ...theme, colors: { ...theme.colors, accent: val } })} />
                    <ColorField label="Background" value={palette.background} onChange={val => setTheme({ ...theme, colors: { ...theme.colors, background: val } })} />
                    <ColorField label="Card" value={palette.card} onChange={val => setTheme({ ...theme, colors: { ...theme.colors, card: val } })} />
                    <ColorField label="Border" value={palette.border} onChange={val => setTheme({ ...theme, colors: { ...theme.colors, border: val } })} />
                </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4 space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-white">Typography</h3>
                    <p className="text-[11px] text-slate-500">Admin UI typography choices.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                        <Label>Heading Font</Label>
                        <Select
                            value={theme.typography.headingFont}
                            onChange={e => setTheme({ ...theme, typography: { ...theme.typography, headingFont: e.target.value } })}
                        >
                            {FONT_OPTIONS.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Body Font</Label>
                        <Select
                            value={theme.typography.bodyFont}
                            onChange={e => setTheme({ ...theme, typography: { ...theme.typography, bodyFont: e.target.value } })}
                        >
                            {FONT_OPTIONS.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Mono Font</Label>
                        <Select
                            value={theme.typography.monoFont}
                            onChange={e => setTheme({ ...theme, typography: { ...theme.typography, monoFont: e.target.value } })}
                        >
                            {FONT_OPTIONS.map(font => (
                                <option key={font} value={font}>{font}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
