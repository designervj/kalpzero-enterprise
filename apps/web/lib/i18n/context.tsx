'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

// Static admin UI translation bundles (lazy-loaded per locale)
// IMPORTANT: When adding a new locale JSON file, also add it here.
export const BUNDLED_LOCALES = ['en', 'hi', 'hr', 'zh-hant'] as const;
export type BundledLocale = typeof BUNDLED_LOCALES[number];

const TRANSLATIONS: Record<string, () => Promise<any>> = {
    en: () => import('./en.json').then(m => m.default),
    hi: () => import('./hi.json').then(m => m.default),
    hr: () => import('./hr.json').then(m => m.default),
    'zh-hant': () => import('./zh-hant.json').then(m => m.default),
};

interface I18nContextType {
    locale: string;
    setLocale: (locale: string) => void;
    t: (key: string, fallback?: string) => string;
    /** Locales that are both bundled AND active in kalp_system.languages */
    availableLocales: string[];
    isLoading: boolean;
}

const I18nContext = createContext<I18nContextType>({
    locale: 'en',
    setLocale: () => { },
    t: (key: string) => key,
    availableLocales: [...BUNDLED_LOCALES],
    isLoading: false,
});

/**
 * Fetch the active languages from kalp_system.languages and intersect with
 * bundled locale files. English is always available regardless of DB state.
 */
async function fetchActiveLocales(): Promise<string[]> {
    try {
        const [systemRes, tenantRes] = await Promise.all([
            fetch('/api/system/languages').catch(() => null),
            fetch('/api/settings/tenant').catch(() => null),
        ]);

        const systemLangs: Array<{ code: string; status?: string }> = systemRes && systemRes.ok
            ? await systemRes.json()
            : [];
        const tenantSettings = tenantRes && tenantRes.ok
            ? await tenantRes.json()
            : {};

        const active = Array.isArray(systemLangs)
            ? systemLangs
                .filter(l => l.status === 'active' && TRANSLATIONS[l.code])
                .map(l => l.code)
            : [];

        const tenantLocales = Array.isArray(tenantSettings?.languages)
            ? tenantSettings.languages.filter((code: unknown): code is string => typeof code === 'string' && Boolean(TRANSLATIONS[code]))
            : [];
        const tenantPrimary = typeof tenantSettings?.primaryLanguage === 'string' && TRANSLATIONS[tenantSettings.primaryLanguage]
            ? [tenantSettings.primaryLanguage]
            : [];

        // Always expose bundled locales in picker to avoid EN-only dropdown when DB status lags.
        const merged = Array.from(new Set([
            'en',
            ...active,
            ...tenantPrimary,
            ...tenantLocales,
            ...BUNDLED_LOCALES,
        ]));
        return merged.filter((code) => Boolean(TRANSLATIONS[code]));
    } catch {
        return [...BUNDLED_LOCALES];
    }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState('en');
    const [translations, setTranslations] = useState<Record<string, any>>({});
    const [agencyDictionary, setAgencyDictionary] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [availableLocales, setAvailableLocales] = useState<string[]>([...BUNDLED_LOCALES]);

    // Load translations for the current locale
    useEffect(() => {
        setIsLoading(true);
        const loader = TRANSLATIONS[locale] || TRANSLATIONS.en;
        loader()
            .then(data => setTranslations(data))
            .catch(() => {
                // Fallback to English if locale file doesn't exist
                TRANSLATIONS.en().then(data => setTranslations(data));
            })
            .finally(() => setIsLoading(false));
    }, [locale]);

    // Persist locale preference and update document lang attribute
    const setLocale = useCallback((newLocale: string) => {
        setLocaleState(newLocale);
        if (typeof window !== 'undefined') {
            localStorage.setItem('kalp_locale', newLocale);
            document.documentElement.lang = newLocale;
        }
    }, []);

    // On mount: restore locale from localStorage and fetch DB-active locales
    // useEffect(() => {
    //     let cancelled = false;

    //     const init = async () => {
    //         if (typeof window === 'undefined') return;

    //         // 1. Fetch DB-active locales (non-blocking, graceful on error)
    //         const [active, agencyTerms] = await Promise.all([
    //             fetchActiveLocales(),
    //             fetch('/api/agency/terminology')
    //                 .then(async (res) => (res.ok ? await res.json() : null))
    //                 .catch(() => null),
    //         ]);
    //         if (!cancelled) {
    //             setAvailableLocales(active);
    //             if (agencyTerms?.terminologyOverrides && typeof agencyTerms.terminologyOverrides === 'object') {
    //                 const normalized = Object.fromEntries(
    //                     Object.entries(agencyTerms.terminologyOverrides as Record<string, unknown>)
    //                         .filter(([key, value]) => typeof value === 'string' && key.trim())
    //                         .map(([key, value]) => [key.trim(), String(value)])
    //                 );
    //                 setAgencyDictionary(normalized);
    //             }
    //         }

    //         // 2. Restore saved locale preference
    //         const saved = localStorage.getItem('kalp_locale');
    //         if (saved && TRANSLATIONS[saved]) {
    //             if (!cancelled) {
    //                 setLocaleState(saved);
    //                 document.documentElement.lang = saved;
    //             }
    //             return;
    //         }

    //         // 3. If no saved preference, use tenant primary language
    //         try {
    //             const res = await fetch('/api/settings/tenant');
    //             if (!res.ok) return;
    //             const data = await res.json();
    //             const tenantLocale = typeof data?.primaryLanguage === 'string' ? data.primaryLanguage : '';
    //             if (tenantLocale && TRANSLATIONS[tenantLocale] && !cancelled) {
    //                 setLocaleState(tenantLocale);
    //                 document.documentElement.lang = tenantLocale;
    //             }
    //         } catch {
    //             // silent — English is the default
    //         }
    //     };

    //     init().catch(() => { });

    //     return () => {
    //         cancelled = true;
    //     };
    // }, []);

    // Translation function supporting nested keys: t('nav.dashboard')
    const t = useCallback((key: string, fallback?: string): string => {
        if (agencyDictionary[key]) {
            return agencyDictionary[key];
        }
        const parts = key.split('.');
        let current: any = translations;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return fallback || key; // Return fallback or key itself if translation missing
            }
        }
        return typeof current === 'string' ? current : (fallback || key);
    }, [agencyDictionary, translations]);

    const value = useMemo(() => ({
        locale,
        setLocale,
        t,
        availableLocales,
        isLoading,
    }), [locale, setLocale, t, availableLocales, isLoading]);

    return (
        <I18nContext.Provider value={value}>
            {children}
        </I18nContext.Provider>
    );
}

export function useTranslation() {
    return useContext(I18nContext);
}

export default I18nContext;
