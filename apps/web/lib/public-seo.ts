import {
    APP_PORT,
    DEFAULT_PLATFORM_ROOT_DOMAIN,
    IS_PRODUCTION,
    PLATFORM_ROOT_DOMAIN,
    PUBLIC_BASE_URL,
} from '@/lib/server-env';

const DEFAULT_PLATFORM_DOMAIN = DEFAULT_PLATFORM_ROOT_DOMAIN;

export function resolvePublicBaseUrl(): string {
    const explicit = PUBLIC_BASE_URL;
    if (explicit) {
        return explicit.replace(/\/+$/, '');
    }

    if (!IS_PRODUCTION) {
        const localPort = APP_PORT;
        return `http://localhost:${localPort}`.replace(/\/+$/, '');
    }

    const rootDomain = PLATFORM_ROOT_DOMAIN || DEFAULT_PLATFORM_DOMAIN;
    const host = rootDomain || DEFAULT_PLATFORM_DOMAIN;
    return `https://${host}`.replace(/\/+$/, '');
}

export function toAbsolutePublicUrl(pathOrUrl: string): string {
    const input = (pathOrUrl || '').trim();
    if (!input) return resolvePublicBaseUrl();
    if (/^https?:\/\//i.test(input)) return input;
    const normalizedPath = input.startsWith('/') ? input : `/${input}`;
    return `${resolvePublicBaseUrl()}${normalizedPath}`;
}
