interface ThemePayload {
    colors?: Record<string, string>;
    brand?: Record<string, string>;
    buttons?: Record<string, string>;
    typography?: Record<string, string>;
    appearance?: Record<string, string>;
    layout?: Record<string, string>;
    borderRadius?: string | number;
}

function hexToRgb(hex: string): string {
    const value = hex.replace('#', '');
    if (value.length !== 6) return '0 240 255';
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `${r} ${g} ${b}`;
}

export function getThemeMode(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'dark';
    const saved = localStorage.getItem('kalp-theme-mode');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ? 'dark' : 'light';
}

export function setThemeMode(mode: 'light' | 'dark'): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('kalp-theme-mode', mode);
    document.documentElement.setAttribute('data-theme-mode', mode);
    // Dispatch event to notify components if needed
    window.dispatchEvent(new CustomEvent('kalp-theme-mode-change', { detail: { mode } }));
}

export function applyRuntimeTheme(payload: ThemePayload): void {
    const root = document.documentElement;
    const colors = payload.colors || payload.brand || {};
    const buttons = payload.buttons || {};
    const typography = payload.typography || {};
    const appearance = payload.appearance || {};
    const layout = payload.layout || {};

    const primary = colors.primary || '#00f0ff';
    const secondary = colors.secondary || '#8b5cf6';
    const accent = colors.accent || '#10b981';
    
    // Default mode logic
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem('kalp-theme-mode') : null;
    const requestedMode = appearance.mode;
    let mode: 'light' | 'dark' = 'dark';
    
    if (savedMode === 'light' || savedMode === 'dark') {
        mode = savedMode as 'light' | 'dark';
    } else if (requestedMode === 'light') {
        mode = 'light';
    } else if (requestedMode === 'system' && typeof window !== 'undefined') {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
        mode = prefersDark ? 'dark' : 'light';
    }

    const background = colors.background || (mode === 'light' ? '#f8fafc' : '#030712');
    const foreground = colors.foreground || (mode === 'light' ? '#0f172a' : '#f8fafc');
    const muted = colors.muted || (mode === 'light' ? '#64748b' : '#94a3b8');
    const border = colors.border || (mode === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(31, 41, 55, 0.8)');
    const card = colors.card || (mode === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(17, 24, 39, 0.6)');

    root.style.setProperty('--color-primary', primary);
    root.style.setProperty('--color-secondary', secondary);
    root.style.setProperty('--color-accent', accent);
    root.style.setProperty('--color-background', background);

    root.style.setProperty('--primary', primary);
    root.style.setProperty('--secondary', secondary);
    root.style.setProperty('--background', background);
    root.style.setProperty('--surface', card);
    root.style.setProperty('--text', foreground);
    root.style.setProperty('--muted', muted);
    root.style.setProperty('--border', border);
    root.style.setProperty('--gradient-primary-rgb', hexToRgb(primary));
    root.style.setProperty('--gradient-secondary-rgb', hexToRgb(secondary));

    if (typography.bodyFont) root.style.setProperty('--font-brand', typography.bodyFont);
    const radius = buttons.radius || payload.borderRadius;
    if (radius) root.style.setProperty('--radius', `${radius}px`);

    const chrome = appearance.chrome === 'flat' || appearance.chrome === 'solid' ? appearance.chrome : 'glass';
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-theme-chrome', chrome);

    if (layout.sidebar) root.setAttribute('data-admin-sidebar', layout.sidebar);
    if (layout.layout) root.setAttribute('data-admin-layout', layout.layout);
    if (layout.density) root.setAttribute('data-admin-density', layout.density);
    if (layout.direction) root.setAttribute('dir', layout.direction === 'rtl' ? 'rtl' : 'ltr');
}
