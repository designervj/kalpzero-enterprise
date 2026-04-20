'use client';

import { useCallback, useEffect, useState } from 'react';
import { Palette, Save, RefreshCw, Check, CheckCircle2, Copy, Paintbrush, LetterText, FileText, Sparkles } from 'lucide-react';
import { applyRuntimeTheme } from '@/lib/theme-runtime';
import { SmartColorPicker } from '@/components/ui/smart-color-picker';

/* ─── Font Options ─── */
const FONT_OPTIONS = [
    'Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans', 'DM Sans', 'Poppins', 'Lato', 'Open Sans',
    'Montserrat', 'Playfair Display', 'Merriweather', 'Source Sans 3', 'Nunito', 'Raleway',
    'Work Sans', 'Manrope', 'Space Grotesk', 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono',
];

const DEFAULT_BRAND = {
    colors: {
        primary: '#00f0ff',
        secondary: '#8b5cf6',
        background: '#030712',
        foreground: '#f8fafc',
        muted: '#94a3b8',
        accent: '#06b6d4',
        destructive: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
        info: '#3b82f6',
        border: '#1e293b',
        ring: '#00f0ff',
        link: '#00f0ff',
        card: '#0f172a',
    },
    buttons: {
        primaryBg: '#00f0ff',
        primaryText: '#000000',
        secondaryBg: '#8b5cf6',
        secondaryText: '#ffffff',
        outlineBorder: '#00f0ff',
        outlineText: '#00f0ff',
        ghostText: '#94a3b8',
        destructiveBg: '#ef4444',
        destructiveText: '#ffffff',
        radius: '8',
    },
    typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        monoFont: 'JetBrains Mono',
        h1Size: '36',
        h2Size: '30',
        h3Size: '24',
        h4Size: '20',
        bodySize: '16',
        smallSize: '14',
        lineHeight: '1.6',
        letterSpacing: '0',
        headingWeight: '700',
        bodyWeight: '400',
    },
    logo: { primary: '', light: '', dark: '', icon: '', favicon: '' },
    voice: { tone: '', personality: '', doList: [], dontList: [] as string[] },
    appearance: { mode: 'dark', chrome: 'glass' },
};

type BrandState = typeof DEFAULT_BRAND;

function mergeBrandState(payload: Partial<BrandState> | null | undefined): BrandState {
    return {
        ...DEFAULT_BRAND,
        ...payload,
        colors: { ...DEFAULT_BRAND.colors, ...(payload?.colors || {}) },
        buttons: { ...DEFAULT_BRAND.buttons, ...(payload?.buttons || {}) },
        typography: { ...DEFAULT_BRAND.typography, ...(payload?.typography || {}) },
        logo: { ...DEFAULT_BRAND.logo, ...(payload?.logo || {}) },
        voice: { ...DEFAULT_BRAND.voice, ...(payload?.voice || {}) },
        appearance: {
            ...DEFAULT_BRAND.appearance,
            ...(payload?.appearance || {}),
        },
    };
}

/* ─── Helpers ─── */
function hexToRgb(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r} / ${g} / ${b}`;
}

function hexToHsl(hex: string): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16) / 255;
    const g = parseInt(h.substring(2, 4), 16) / 255;
    const b = parseInt(h.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue = 0;
    let sat = 0;
    const light = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        sat = light > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        else if (max === g) hue = ((b - r) / d + 2) / 6;
        else hue = ((r - g) / d + 4) / 6;
    }
    return `${Math.round(hue * 360)}° / ${Math.round(sat * 100)}% / ${Math.round(light * 100)}%`;
}

/* ─── Color Field Component ─── */
function ColorField({ label, value, onChange, help }: { label: string; value: string; onChange: (v: string) => void; help?: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); };
    return (
        <div className="group">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">{label}</label>
            <div className="flex items-center gap-2">
                <SmartColorPicker value={value} onChange={onChange} variant="dark" className="w-[184px]" />
                <div className="flex-1 bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-mono text-white">{value}</div>
                        <div className="text-[9px] text-slate-500 font-mono">{hexToRgb(value)}</div>
                    </div>
                    <button onClick={copy} className="text-slate-500 hover:text-slate-300 transition-colors">
                        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                </div>
            </div>
            {help && <p className="text-[9px] text-slate-600 mt-1">{help}</p>}
        </div>
    );
}

export default function BrandingPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [applying, setApplying] = useState(false);
    const [toast, setToast] = useState('');
    const [section, setSection] = useState<'colors' | 'typography' | 'guidelines'>('colors');
    const [colorTab, setColorTab] = useState<'main' | 'buttons' | 'semantic'>('main');
    const [brand, setBrand] = useState<BrandState>(DEFAULT_BRAND);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };
    const applyThemeLive = useCallback((payload: BrandState) => {
        applyRuntimeTheme(payload);
        window.dispatchEvent(new CustomEvent('kalp-theme-refresh', { detail: { payload } }));
    }, []);

    useEffect(() => {
        fetch('/api/settings/brand').then(r => r.json()).then(data => {
            if (data && !data.error) {
                const merged = mergeBrandState(data);
                setBrand(merged);
                applyThemeLive(merged);
            }
        }).catch(console.error).finally(() => setLoading(false));
    }, [applyThemeLive]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/settings/brand', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brand) });
            applyThemeLive(brand);
            showToast('Brand Kit saved!');
        } catch { showToast('Failed to save.'); }
        setSaving(false);
    };

    const handleApplyLive = () => {
        setApplying(true);
        applyThemeLive(brand);
        showToast('Applied live preview.');
        setTimeout(() => setApplying(false), 200);
    };


    const updateColor = (key: keyof BrandState['colors'], val: string) => setBrand((p: BrandState) => ({ ...p, colors: { ...p.colors, [key]: val } }));
    const updateButton = (key: keyof BrandState['buttons'], val: string) => setBrand((p: BrandState) => ({ ...p, buttons: { ...p.buttons, [key]: val } }));
    const updateTypo = (key: keyof BrandState['typography'], val: string) => setBrand((p: BrandState) => ({ ...p, typography: { ...p.typography, [key]: val } }));

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
            <span className="font-mono text-xs uppercase tracking-widest text-slate-500">Loading Brand Kit...</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-xl animate-in slide-in-from-right duration-300">
                    <CheckCircle2 size={14} /> {toast}
                </div>
            )}

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <Palette size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Brand Kit</h2>
                        <p className="text-slate-400 text-xs">Define your visual identity — colors, typography, and brand guidelines.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleApplyLive}
                        disabled={applying || saving}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-slate-100 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-50 border border-slate-700"
                    >
                        {applying ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Apply Live
                    </button>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-500 text-white rounded-lg text-sm font-bold hover:bg-purple-400 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                        {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />} Save Brand Kit
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-4">
                    <h3 className="text-sm font-bold text-white mb-3">Appearance Controls</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Mode</label>
                            <select
                                value={brand.appearance.mode}
                                onChange={(e) => setBrand((p: BrandState) => ({ ...p, appearance: { ...p.appearance, mode: e.target.value === 'light' ? 'light' : 'dark' } }))}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none appearance-none"
                            >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Chrome Style</label>
                            <select
                                value={brand.appearance.chrome}
                                onChange={(e) => {
                                    const chrome = e.target.value === 'flat' || e.target.value === 'solid' ? e.target.value : 'glass';
                                    setBrand((p: BrandState) => ({ ...p, appearance: { ...p.appearance, chrome } }));
                                }}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none appearance-none"
                            >
                                <option value="glass">Glass</option>
                                <option value="flat">Flat</option>
                                <option value="solid">Solid</option>
                            </select>
                        </div>
                        <p className="text-[11px] text-slate-500">Use <span className="text-slate-300 font-semibold">Apply Live</span> to preview, then <span className="text-slate-300 font-semibold">Save Brand Kit</span> to persist.</p>
                    </div>
                </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-1 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-1.5">
                {([
                    { key: 'colors', label: 'Colors', icon: Paintbrush },
                    { key: 'typography', label: 'Typography', icon: LetterText },
                    { key: 'guidelines', label: 'Brand Guidelines', icon: FileText },
                ] as const).map(tab => {
                    const Icon = tab.icon;
                    const active = section === tab.key;
                    return (
                        <button key={tab.key} onClick={() => setSection(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${active ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
                            <Icon size={14} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── COLORS TAB ─── */}
            {section === 'colors' && (
                <div className="space-y-4">
                    {/* Sub-tabs */}
                    <div className="flex gap-2">
                        {([
                            { key: 'main', label: 'Main Palette' },
                            { key: 'buttons', label: 'Button Styles' },
                            { key: 'semantic', label: 'Semantic Colors' },
                        ] as const).map(t => (
                            <button key={t.key} onClick={() => setColorTab(t.key)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${colorTab === t.key ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-900/40 text-slate-500 border border-slate-800 hover:text-slate-300'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Main Palette */}
                    {colorTab === 'main' && (
                        <div className="space-y-5">
                            {/* Primary Colors */}
                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                                <h3 className="text-sm font-bold text-white mb-1">Primary Colors</h3>
                                <p className="text-[10px] text-slate-500 mb-4">Your brand&apos;s core identity colors used across the entire platform.</p>

                                {/* Preview Bar */}
                                <div className="flex gap-0 rounded-xl overflow-hidden mb-5 h-20">
                                    <div className="flex-1" style={{ backgroundColor: brand.colors.primary }}></div>
                                    <div className="flex-1" style={{ backgroundColor: brand.colors.secondary }}></div>
                                    <div className="flex-1" style={{ backgroundColor: brand.colors.accent }}></div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <ColorField label="Primary" value={brand.colors.primary} onChange={v => updateColor('primary', v)} help="Main brand color — headers, CTAs, active states" />
                                    <ColorField label="Secondary" value={brand.colors.secondary} onChange={v => updateColor('secondary', v)} help="Supporting brand color — accents, highlights" />
                                    <ColorField label="Accent" value={brand.colors.accent} onChange={v => updateColor('accent', v)} help="Attention color — badges, indicators" />
                                </div>
                            </div>

                            {/* Background & Surface */}
                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                                <h3 className="text-sm font-bold text-white mb-1">Backgrounds & Surfaces</h3>
                                <p className="text-[10px] text-slate-500 mb-4">Define the depth layers of your interface.</p>
                                <div className="grid grid-cols-4 gap-4">
                                    <ColorField label="Background" value={brand.colors.background} onChange={v => updateColor('background', v)} help="Page background" />
                                    <ColorField label="Card" value={brand.colors.card} onChange={v => updateColor('card', v)} help="Card/panel surfaces" />
                                    <ColorField label="Border" value={brand.colors.border} onChange={v => updateColor('border', v)} help="Borders, dividers" />
                                    <ColorField label="Foreground" value={brand.colors.foreground} onChange={v => updateColor('foreground', v)} help="Primary text color" />
                                </div>
                            </div>

                            {/* Interactive */}
                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                                <h3 className="text-sm font-bold text-white mb-1">Interactive Elements</h3>
                                <p className="text-[10px] text-slate-500 mb-4">Colors for links, focus rings, and muted text.</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <ColorField label="Link" value={brand.colors.link} onChange={v => updateColor('link', v)} help="Clickable text and hyperlinks" />
                                    <ColorField label="Ring / Focus" value={brand.colors.ring} onChange={v => updateColor('ring', v)} help="Focus outline on inputs and buttons" />
                                    <ColorField label="Muted" value={brand.colors.muted} onChange={v => updateColor('muted', v)} help="Secondary text, placeholders" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Button Styles */}
                    {colorTab === 'buttons' && (
                        <div className="space-y-5">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                                <h3 className="text-sm font-bold text-white mb-1">Button Variants</h3>
                                <p className="text-[10px] text-slate-500 mb-4">Define the look of every button variant in your system.</p>

                                {/* Live Preview */}
                                <div className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl bg-black/40 border border-slate-800/50">
                                    <button style={{ backgroundColor: brand.buttons.primaryBg, color: brand.buttons.primaryText, borderRadius: `${brand.buttons.radius}px` }}
                                        className="px-5 py-2.5 text-sm font-bold transition-all">Primary</button>
                                    <button style={{ backgroundColor: brand.buttons.secondaryBg, color: brand.buttons.secondaryText, borderRadius: `${brand.buttons.radius}px` }}
                                        className="px-5 py-2.5 text-sm font-bold">Secondary</button>
                                    <button style={{ border: `2px solid ${brand.buttons.outlineBorder}`, color: brand.buttons.outlineText, borderRadius: `${brand.buttons.radius}px` }}
                                        className="px-5 py-2.5 text-sm font-bold bg-transparent">Outline</button>
                                    <button style={{ color: brand.buttons.ghostText, borderRadius: `${brand.buttons.radius}px` }}
                                        className="px-5 py-2.5 text-sm font-bold bg-transparent hover:bg-white/5">Ghost</button>
                                    <button style={{ backgroundColor: brand.buttons.destructiveBg, color: brand.buttons.destructiveText, borderRadius: `${brand.buttons.radius}px` }}
                                        className="px-5 py-2.5 text-sm font-bold">Destructive</button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <ColorField label="Primary Button BG" value={brand.buttons.primaryBg} onChange={v => updateButton('primaryBg', v)} />
                                    <ColorField label="Primary Button Text" value={brand.buttons.primaryText} onChange={v => updateButton('primaryText', v)} />
                                    <ColorField label="Secondary Button BG" value={brand.buttons.secondaryBg} onChange={v => updateButton('secondaryBg', v)} />
                                    <ColorField label="Secondary Button Text" value={brand.buttons.secondaryText} onChange={v => updateButton('secondaryText', v)} />
                                    <ColorField label="Outline Border" value={brand.buttons.outlineBorder} onChange={v => updateButton('outlineBorder', v)} />
                                    <ColorField label="Outline Text" value={brand.buttons.outlineText} onChange={v => updateButton('outlineText', v)} />
                                    <ColorField label="Ghost Text" value={brand.buttons.ghostText} onChange={v => updateButton('ghostText', v)} />
                                    <ColorField label="Destructive BG" value={brand.buttons.destructiveBg} onChange={v => updateButton('destructiveBg', v)} />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Button Radius (px)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="24" value={brand.buttons.radius}
                                            onChange={e => updateButton('radius', e.target.value)}
                                            className="flex-1 accent-purple-500" />
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-white font-mono w-8 text-center">{brand.buttons.radius}</span>
                                            <div className="w-12 h-8 border-2 border-purple-500" style={{ borderRadius: `${brand.buttons.radius}px` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Semantic Colors */}
                    {colorTab === 'semantic' && (
                        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                            <h3 className="text-sm font-bold text-white mb-1">Semantic Colors</h3>
                            <p className="text-[10px] text-slate-500 mb-4">Status and feedback colors used across alerts, toasts, and badges.</p>

                            {/* Preview */}
                            <div className="flex gap-3 mb-5">
                                {[
                                    { label: 'Success', color: brand.colors.success },
                                    { label: 'Warning', color: brand.colors.warning },
                                    { label: 'Destructive', color: brand.colors.destructive },
                                    { label: 'Info', color: brand.colors.info },
                                ].map(s => (
                                    <div key={s.label} className="flex-1 rounded-lg p-3 text-center" style={{ backgroundColor: s.color + '15', border: `1px solid ${s.color}40` }}>
                                        <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ backgroundColor: s.color }}></div>
                                        <div className="text-[10px] font-bold" style={{ color: s.color }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorField label="Success" value={brand.colors.success} onChange={v => updateColor('success', v)} help="Confirmations, completed actions" />
                                <ColorField label="Warning" value={brand.colors.warning} onChange={v => updateColor('warning', v)} help="Caution notices, pending states" />
                                <ColorField label="Destructive / Error" value={brand.colors.destructive} onChange={v => updateColor('destructive', v)} help="Errors, delete actions, alerts" />
                                <ColorField label="Info" value={brand.colors.info} onChange={v => updateColor('info', v)} help="Informational notices, tips" />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── TYPOGRAPHY TAB ─── */}
            {section === 'typography' && (
                <div className="space-y-5">
                    {/* Font Families */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <h3 className="text-sm font-bold text-white mb-1">Font Families</h3>
                        <p className="text-[10px] text-slate-500 mb-4">Choose fonts for headings, body text, and code blocks. All fonts load from Google Fonts.</p>
                        <div className="grid grid-cols-3 gap-4">
                            {([
                                { key: 'headingFont', label: 'Heading Font' },
                                { key: 'bodyFont', label: 'Body Font' },
                                { key: 'monoFont', label: 'Monospace Font' },
                            ] as const).map(f => (
                                <div key={f.key}>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">{f.label}</label>
                                    <select value={brand.typography[f.key]} onChange={e => updateTypo(f.key, e.target.value)}
                                        className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none cursor-pointer appearance-none"
                                        style={{ fontFamily: brand.typography[f.key] }}>
                                        {FONT_OPTIONS.map(font => (
                                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Font Scale */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <h3 className="text-sm font-bold text-white mb-1">Type Scale</h3>
                        <p className="text-[10px] text-slate-500 mb-4">Set the size hierarchy for your typography system.</p>

                        {/* Live Preview */}
                        <div className="bg-black/40 rounded-xl p-5 mb-5 border border-slate-800/50 space-y-3">
                            <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h1Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight, letterSpacing: `${brand.typography.letterSpacing}px` }} className="text-white">
                                Heading 1 — {brand.typography.h1Size}px
                            </div>
                            <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h2Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight }} className="text-white">
                                Heading 2 — {brand.typography.h2Size}px
                            </div>
                            <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h3Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight }} className="text-white">
                                Heading 3 — {brand.typography.h3Size}px
                            </div>
                            <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h4Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight }} className="text-slate-300">
                                Heading 4 — {brand.typography.h4Size}px
                            </div>
                            <div style={{ fontFamily: brand.typography.bodyFont, fontSize: `${brand.typography.bodySize}px`, fontWeight: brand.typography.bodyWeight, lineHeight: brand.typography.lineHeight }} className="text-slate-400">
                                Body text — The quick brown fox jumps over the lazy dog. ({brand.typography.bodySize}px)
                            </div>
                            <div style={{ fontFamily: brand.typography.bodyFont, fontSize: `${brand.typography.smallSize}px`, fontWeight: brand.typography.bodyWeight }} className="text-slate-500">
                                Small text — Labels, captions, helper text ({brand.typography.smallSize}px)
                            </div>
                            <div style={{ fontFamily: brand.typography.monoFont, fontSize: `${brand.typography.smallSize}px` }} className="text-cyan-400">
                                <code>const code = &quot;Monospace font preview&quot;;</code>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                            {([
                                { key: 'h1Size', label: 'H1 Size (px)' },
                                { key: 'h2Size', label: 'H2 Size (px)' },
                                { key: 'h3Size', label: 'H3 Size (px)' },
                                { key: 'h4Size', label: 'H4 Size (px)' },
                                { key: 'bodySize', label: 'Body Size (px)' },
                                { key: 'smallSize', label: 'Small Size (px)' },
                                { key: 'headingWeight', label: 'Heading Weight' },
                                { key: 'bodyWeight', label: 'Body Weight' },
                            ] as const).map(f => (
                                <div key={f.key}>
                                    <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">{f.label}</label>
                                    {f.key.includes('Weight') ? (
                                        <select value={brand.typography[f.key]} onChange={e => updateTypo(f.key, e.target.value)}
                                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none cursor-pointer appearance-none">
                                            {['300', '400', '500', '600', '700', '800', '900'].map(w => (
                                                <option key={w} value={w}>{w} {w === '400' ? '(Regular)' : w === '700' ? '(Bold)' : w === '300' ? '(Light)' : w === '600' ? '(Semi-Bold)' : ''}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="number" value={brand.typography[f.key]} onChange={e => updateTypo(f.key, e.target.value)}
                                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Spacing */}
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <h3 className="text-sm font-bold text-white mb-1">Spacing & Rhythm</h3>
                        <p className="text-[10px] text-slate-500 mb-4">Fine-tune reading comfort with line height and letter spacing.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Line Height</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min="1.0" max="2.2" step="0.1" value={brand.typography.lineHeight}
                                        onChange={e => updateTypo('lineHeight', e.target.value)} className="flex-1 accent-purple-500" />
                                    <span className="text-sm text-white font-mono w-10 text-center">{brand.typography.lineHeight}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5">Letter Spacing (px)</label>
                                <div className="flex items-center gap-4">
                                    <input type="range" min="-2" max="5" step="0.5" value={brand.typography.letterSpacing}
                                        onChange={e => updateTypo('letterSpacing', e.target.value)} className="flex-1 accent-purple-500" />
                                    <span className="text-sm text-white font-mono w-10 text-center">{brand.typography.letterSpacing}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── BRAND GUIDELINES TAB ─── */}
            {section === 'guidelines' && (
                <div className="space-y-5">
                    {/* Auto-Generated Brand Document */}
                    <div className="rounded-xl border border-purple-500/20 bg-slate-900/40 overflow-hidden">
                        {/* Document Header */}
                        <div className="p-6 border-b border-slate-800/50" style={{ background: `linear-gradient(135deg, ${brand.colors.primary}10, ${brand.colors.secondary}10)` }}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-md" style={{ backgroundColor: brand.colors.primary }}></div>
                                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Brand Guidelines</span>
                            </div>
                            <h3 className="text-xl font-bold text-white" style={{ fontFamily: brand.typography.headingFont }}>Visual Identity System</h3>
                            <p className="text-xs text-slate-400 mt-1">Auto-generated from your Brand Kit configuration. Updates dynamically.</p>
                        </div>

                        {/* Color Section */}
                        <div className="p-6 border-b border-slate-800/50">
                            <h4 className="text-sm font-bold text-white mb-3" style={{ fontFamily: brand.typography.headingFont }}>Color Palette</h4>

                            <div className="mb-4">
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Primary Colors</p>
                                <div className="flex gap-0 rounded-lg overflow-hidden h-16 mb-2">
                                    {[
                                        { label: 'Primary', color: brand.colors.primary },
                                        { label: 'Secondary', color: brand.colors.secondary },
                                        { label: 'Accent', color: brand.colors.accent },
                                    ].map(c => (
                                        <div key={c.label} className="flex-1" style={{ backgroundColor: c.color }}></div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Primary', color: brand.colors.primary },
                                        { label: 'Secondary', color: brand.colors.secondary },
                                        { label: 'Accent', color: brand.colors.accent },
                                    ].map(c => (
                                        <div key={c.label}>
                                            <div className="text-xs font-bold text-white">{c.label}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{c.color}</div>
                                            <div className="text-[9px] text-slate-500 font-mono">{hexToRgb(c.color)}</div>
                                            <div className="text-[9px] text-slate-500 font-mono">{hexToHsl(c.color)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Semantic Colors</p>
                                <div className="flex gap-3">
                                    {[
                                        { label: 'Success', color: brand.colors.success },
                                        { label: 'Warning', color: brand.colors.warning },
                                        { label: 'Error', color: brand.colors.destructive },
                                        { label: 'Info', color: brand.colors.info },
                                    ].map(c => (
                                        <div key={c.label} className="flex items-center gap-2">
                                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: c.color }}></div>
                                            <div>
                                                <div className="text-[10px] font-bold text-white">{c.label}</div>
                                                <div className="text-[9px] text-slate-500 font-mono">{c.color}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Button System */}
                        <div className="p-6 border-b border-slate-800/50">
                            <h4 className="text-sm font-bold text-white mb-3" style={{ fontFamily: brand.typography.headingFont }}>Button System</h4>
                            <div className="flex flex-wrap gap-3 mb-3">
                                <button style={{ backgroundColor: brand.buttons.primaryBg, color: brand.buttons.primaryText, borderRadius: `${brand.buttons.radius}px` }} className="px-4 py-2 text-xs font-bold">Primary</button>
                                <button style={{ backgroundColor: brand.buttons.secondaryBg, color: brand.buttons.secondaryText, borderRadius: `${brand.buttons.radius}px` }} className="px-4 py-2 text-xs font-bold">Secondary</button>
                                <button style={{ border: `2px solid ${brand.buttons.outlineBorder}`, color: brand.buttons.outlineText, borderRadius: `${brand.buttons.radius}px` }} className="px-4 py-2 text-xs font-bold bg-transparent">Outline</button>
                                <button style={{ color: brand.buttons.ghostText, borderRadius: `${brand.buttons.radius}px` }} className="px-4 py-2 text-xs font-bold bg-transparent">Ghost</button>
                                <button style={{ backgroundColor: brand.buttons.destructiveBg, color: brand.buttons.destructiveText, borderRadius: `${brand.buttons.radius}px` }} className="px-4 py-2 text-xs font-bold">Destructive</button>
                            </div>
                            <div className="text-[10px] text-slate-500">Border radius: {brand.buttons.radius}px · 5 button variants</div>
                        </div>

                        {/* Typography Section */}
                        <div className="p-6 border-b border-slate-800/50">
                            <h4 className="text-sm font-bold text-white mb-3" style={{ fontFamily: brand.typography.headingFont }}>Typography</h4>

                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="bg-black/30 rounded-lg p-3">
                                    <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Heading</div>
                                    <div className="text-lg text-white font-bold" style={{ fontFamily: brand.typography.headingFont }}>{brand.typography.headingFont}</div>
                                    <div className="text-[10px] text-slate-500">Weight: {brand.typography.headingWeight}</div>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3">
                                    <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Body</div>
                                    <div className="text-lg text-white" style={{ fontFamily: brand.typography.bodyFont }}>{brand.typography.bodyFont}</div>
                                    <div className="text-[10px] text-slate-500">Weight: {brand.typography.bodyWeight}</div>
                                </div>
                                <div className="bg-black/30 rounded-lg p-3">
                                    <div className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Monospace</div>
                                    <div className="text-lg text-white" style={{ fontFamily: brand.typography.monoFont }}>{brand.typography.monoFont}</div>
                                    <div className="text-[10px] text-slate-500">Code blocks</div>
                                </div>
                            </div>

                            <div className="space-y-2 bg-black/30 rounded-lg p-4">
                                <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h1Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight }} className="text-white">H1 — {brand.typography.h1Size}px</div>
                                <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h2Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight }} className="text-white">H2 — {brand.typography.h2Size}px</div>
                                <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h3Size}px`, fontWeight: brand.typography.headingWeight, lineHeight: brand.typography.lineHeight }} className="text-white">H3 — {brand.typography.h3Size}px</div>
                                <div style={{ fontFamily: brand.typography.headingFont, fontSize: `${brand.typography.h4Size}px`, fontWeight: brand.typography.headingWeight }} className="text-slate-300">H4 — {brand.typography.h4Size}px</div>
                                <div style={{ fontFamily: brand.typography.bodyFont, fontSize: `${brand.typography.bodySize}px`, fontWeight: brand.typography.bodyWeight, lineHeight: brand.typography.lineHeight }} className="text-slate-400">Body — {brand.typography.bodySize}px · Line height: {brand.typography.lineHeight} · Letter spacing: {brand.typography.letterSpacing}px</div>
                            </div>
                        </div>

                        {/* Color Accessibility */}
                        <div className="p-6">
                            <h4 className="text-sm font-bold text-white mb-3" style={{ fontFamily: brand.typography.headingFont }}>Color Usage & Accessibility</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { bg: brand.colors.primary, text: brand.buttons.primaryText, label: 'Primary on Dark' },
                                    { bg: brand.colors.secondary, text: brand.buttons.secondaryText, label: 'Secondary on Dark' },
                                    { bg: brand.colors.background, text: brand.colors.foreground, label: 'Text on Background' },
                                    { bg: brand.colors.card, text: brand.colors.foreground, label: 'Text on Card' },
                                ].map(combo => (
                                    <div key={combo.label} className="rounded-lg p-3 border border-slate-800/30" style={{ backgroundColor: combo.bg }}>
                                        <div className="text-xs font-bold" style={{ color: combo.text }}>{combo.label}</div>
                                        <div className="text-[10px] mt-0.5" style={{ color: combo.text, opacity: 0.7 }}>The quick brown fox jumps over the lazy dog.</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
