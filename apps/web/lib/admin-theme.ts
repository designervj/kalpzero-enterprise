export type AdminThemeMode = 'light' | 'dark' | 'system';
export type AdminThemeChrome = 'glass' | 'flat' | 'solid';
export type AdminThemeSidebar = 'inset' | 'floating' | 'sidebar';
export type AdminThemeLayout = 'default' | 'compact' | 'full';
export type AdminThemeDensity = 'default' | 'compact';
export type AdminThemeDirection = 'ltr' | 'rtl';

export type AdminTheme = {
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        foreground: string;
        muted: string;
        border: string;
        card: string;
    };
    buttons: {
        radius: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        monoFont: string;
    };
    appearance: {
        mode: AdminThemeMode;
        chrome: AdminThemeChrome;
    };
    layout: {
        sidebar: AdminThemeSidebar;
        layout: AdminThemeLayout;
        density: AdminThemeDensity;
        direction: AdminThemeDirection;
    };
};

export type AdminThemePreset = {
    key: string;
    label: string;
    description: string;
    theme: Partial<AdminTheme>;
};

export const DEFAULT_ADMIN_THEME: AdminTheme = {
    colors: {
        primary: '#00f0ff',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        background: '#030712',
        foreground: '#f8fafc',
        muted: '#94a3b8',
        border: '#1e293b',
        card: '#0f172a',
    },
    buttons: {
        radius: '12',
    },
    typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        monoFont: 'JetBrains Mono',
    },
    appearance: {
        mode: 'dark',
        chrome: 'glass',
    },
    layout: {
        sidebar: 'inset',
        layout: 'default',
        density: 'default',
        direction: 'ltr',
    },
};

export const ADMIN_THEME_PRESETS: AdminThemePreset[] = [
    {
        key: 'kalp-digital-glass',
        label: 'Kalp Digital Glass',
        description: 'Current neon-glass baseline with atmospheric glow.',
        theme: {
            colors: {
                primary: '#00f0ff',
                secondary: '#8b5cf6',
                accent: '#06b6d4',
                background: '#030712',
                foreground: '#f8fafc',
                muted: '#94a3b8',
                border: '#1e293b',
                card: '#0f172a',
            },
            buttons: { radius: '12' },
            typography: { headingFont: 'Inter', bodyFont: 'Inter', monoFont: 'JetBrains Mono' },
            appearance: { mode: 'dark', chrome: 'glass' },
            layout: { sidebar: 'inset', layout: 'default', density: 'default', direction: 'ltr' },
        },
    },
    {
        key: 'shadcn-slate-dark',
        label: 'ShadCN Slate Dark',
        description: 'Sleek dark admin with flatter surfaces and subtle borders.',
        theme: {
            colors: {
                primary: '#38bdf8',
                secondary: '#6366f1',
                accent: '#22c55e',
                background: '#0b1120',
                foreground: '#e2e8f0',
                muted: '#94a3b8',
                border: '#1f2937',
                card: '#0f172a',
            },
            buttons: { radius: '8' },
            typography: { headingFont: 'Inter', bodyFont: 'Inter', monoFont: 'JetBrains Mono' },
            appearance: { mode: 'dark', chrome: 'flat' },
            layout: { sidebar: 'inset', layout: 'default', density: 'default', direction: 'ltr' },
        },
    },
    {
        key: 'shadcn-slate-light',
        label: 'ShadCN Slate Light',
        description: 'Light, clean admin with solid cards and soft contrast.',
        theme: {
            colors: {
                primary: '#0ea5e9',
                secondary: '#6366f1',
                accent: '#16a34a',
                background: '#f8fafc',
                foreground: '#0f172a',
                muted: '#64748b',
                border: '#e2e8f0',
                card: '#ffffff',
            },
            buttons: { radius: '8' },
            typography: { headingFont: 'Inter', bodyFont: 'Inter', monoFont: 'JetBrains Mono' },
            appearance: { mode: 'light', chrome: 'solid' },
            layout: { sidebar: 'inset', layout: 'default', density: 'default', direction: 'ltr' },
        },
    },
    {
        key: 'minimal-flat-dark',
        label: 'Minimal Flat Dark',
        description: 'Reduced glow, crisp dark surfaces for focus-heavy work.',
        theme: {
            colors: {
                primary: '#22d3ee',
                secondary: '#38bdf8',
                accent: '#22c55e',
                background: '#0b1220',
                foreground: '#e2e8f0',
                muted: '#94a3b8',
                border: '#334155',
                card: '#111827',
            },
            buttons: { radius: '6' },
            typography: { headingFont: 'DM Sans', bodyFont: 'DM Sans', monoFont: 'JetBrains Mono' },
            appearance: { mode: 'dark', chrome: 'flat' },
            layout: { sidebar: 'inset', layout: 'default', density: 'compact', direction: 'ltr' },
        },
    },
];

export function mergeAdminTheme(payload?: Partial<AdminTheme> | null): AdminTheme {
    return {
        ...DEFAULT_ADMIN_THEME,
        ...(payload || {}),
        colors: { ...DEFAULT_ADMIN_THEME.colors, ...(payload?.colors || {}) },
        buttons: { ...DEFAULT_ADMIN_THEME.buttons, ...(payload?.buttons || {}) },
        typography: { ...DEFAULT_ADMIN_THEME.typography, ...(payload?.typography || {}) },
        appearance: { ...DEFAULT_ADMIN_THEME.appearance, ...(payload?.appearance || {}) },
        layout: { ...DEFAULT_ADMIN_THEME.layout, ...(payload?.layout || {}) },
    };
}
