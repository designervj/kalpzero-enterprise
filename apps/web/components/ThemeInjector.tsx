'use client';

import { useEffect } from 'react';
import { applyRuntimeTheme } from '@/lib/theme-runtime';

const RESERVED_PUBLIC_TOP_LEVEL_ROUTES = new Set([
    'admin',
    'api',
    'blog',
    'bookings',
    'branding',
    'business',
    'catalog',
    'catalog-builder',
    'c',
    'cart',
    'checkout',
    'claim',
    'commerce',
    'customers',
    'dashboard',
    'discover',
    'ecommerce',
    'forms',
    'front-builder',
    'front-builder-v2',
    'invoices',
    'kalpbodh',
    'login',
    'marketing',
    'media',
    'onboarding',
    'p',
    'packages',
    'page',
    'pages',
    'portfolio',
    'product',
    'proposal',
    'proposal-builder',
    'profile',
    'portfolio-profile-builder',
    'resume',
    'resume-builder',
    'settings',
    'sources',
    'tenants',
    'terminal',
    'travel',
    'users',
]);

function isLikelyPublicSlugPath(pathname: string): boolean {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length !== 1) return false;
    return !RESERVED_PUBLIC_TOP_LEVEL_ROUTES.has(parts[0]);
}

function resolveTenantHint(pathname: string): string {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return '';

    if (pathname.startsWith('/business/')) return parts[1] || '';
    if (pathname.startsWith('/p/tenant/')) return parts[2] || '';

    if (pathname.startsWith('/p/')
        || pathname.startsWith('/c/')
        || pathname.startsWith('/product/')
        || pathname.startsWith('/catalog/')
        || pathname.startsWith('/resume/')
        || pathname.startsWith('/profile/')
        || pathname.startsWith('/cart/')
        || pathname.startsWith('/checkout/')) {
        const routeSlug = parts[1] || '';
        return routeSlug.includes('--') ? routeSlug.split('--')[0] : routeSlug;
    }

    if (isLikelyPublicSlugPath(pathname)) return parts[0] || '';
    return '';
}

/**
 * ThemeInjector
 * Fetches tenant brand tokens and injects them as CSS variables.
 * Supports both authenticated dashboard routes and public business pages.
 */
export function ThemeInjector() {
    useEffect(() => {
        const loadTheme = async () => {
            const pathname = window.location.pathname;
            const tenantHint = resolveTenantHint(pathname);
            if (tenantHint) {
                const publicRes = await fetch(`/api/public/business/${encodeURIComponent(tenantHint)}`);
                if (publicRes.ok) {
                    const data = await publicRes.json();
                    applyRuntimeTheme(data.brandKit || { brand: data.brand || {} });
                    return;
                }
            }

            const adminThemeRes = await fetch('/api/settings/admin-theme');
            if (adminThemeRes.ok) {
                const adminThemeData = await adminThemeRes.json();
                applyRuntimeTheme(adminThemeData || {});
                return;
            }

            const brandRes = await fetch('/api/settings/brand');
            if (brandRes.ok) {
                const brandData = await brandRes.json();
                applyRuntimeTheme(brandData || {});
                return;
            }

            const tenantRes = await fetch('/api/settings/tenant');
            if (tenantRes.ok) {
                const tenantData = await tenantRes.json();
                applyRuntimeTheme({ brand: tenantData.brand || {} });
            }
        };

        const handleRefresh = (event: Event) => {
            const detail = (event as CustomEvent<{ payload?: unknown }>).detail;
            if (detail?.payload && typeof detail.payload === 'object') {
                applyRuntimeTheme(detail.payload as Record<string, unknown>);
                return;
            }
            loadTheme().catch(() => { });
        };

        loadTheme().catch(() => { });
        window.addEventListener('kalp-theme-refresh', handleRefresh);
        return () => {
            window.removeEventListener('kalp-theme-refresh', handleRefresh);
        };
    }, []);

    return null;
}
