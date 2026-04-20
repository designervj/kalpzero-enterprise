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
    const background = colors.background || '#030712';
    const foreground = colors.foreground || '#f8fafc';
    const muted = colors.muted || '#94a3b8';
    const border = colors.border || 'rgba(31, 41, 55, 0.8)';
    const card = colors.card || 'rgba(17, 24, 39, 0.6)';

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

    const requestedMode = appearance.mode;
    let mode = requestedMode === 'light' ? 'light' : 'dark';
    if (requestedMode === 'system' && typeof window !== 'undefined') {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
        mode = prefersDark ? 'dark' : 'light';
    }
    const chrome = appearance.chrome === 'flat' || appearance.chrome === 'solid' ? appearance.chrome : 'glass';
    root.setAttribute('data-theme-mode', mode);
    root.setAttribute('data-theme-chrome', chrome);

    if (layout.sidebar) root.setAttribute('data-admin-sidebar', layout.sidebar);
    if (layout.layout) root.setAttribute('data-admin-layout', layout.layout);
    if (layout.density) root.setAttribute('data-admin-density', layout.density);
    if (layout.direction) root.setAttribute('dir', layout.direction === 'rtl' ? 'rtl' : 'ltr');
}
