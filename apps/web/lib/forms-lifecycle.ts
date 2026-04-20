export interface FormUsagePolicy {
    acceptSubmissions: boolean;
    allowAnonymous: boolean;
    collectAttribution: boolean;
    dedupeByEmail: boolean;
    dedupeWindowHours: number;
    allowedSurfaces: string[];
}

export interface FormAnalyticsSnapshot {
    submissionsTotal: number;
    submissionsLast7Days: number;
    submissionsLast30Days: number;
    lastSubmittedAt: Date | null;
    lastSubmittedSurface: string | null;
}

export const DEFAULT_FORM_USAGE_POLICY: FormUsagePolicy = {
    acceptSubmissions: true,
    allowAnonymous: true,
    collectAttribution: true,
    dedupeByEmail: false,
    dedupeWindowHours: 24,
    allowedSurfaces: ['website', 'landing', 'checkout', 'manual'],
};

export function normalizeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
        if (['false', '0', 'no', 'off'].includes(normalized)) return false;
    }
    return fallback;
}

function normalizeNumber(value: unknown, fallback: number): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

export function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map(item => item.trim())
                .filter(Boolean)
        )
    );
}

export function normalizeSurfaceKey(value: unknown): string {
    return normalizeString(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

export function normalizeFormUsagePolicy(value: unknown): FormUsagePolicy {
    const raw = value && typeof value === 'object'
        ? value as Record<string, unknown>
        : {};

    const allowedSurfaces = normalizeStringArray(raw.allowedSurfaces)
        .map(normalizeSurfaceKey)
        .filter(Boolean);

    return {
        acceptSubmissions: normalizeBoolean(raw.acceptSubmissions, DEFAULT_FORM_USAGE_POLICY.acceptSubmissions),
        allowAnonymous: normalizeBoolean(raw.allowAnonymous, DEFAULT_FORM_USAGE_POLICY.allowAnonymous),
        collectAttribution: normalizeBoolean(raw.collectAttribution, DEFAULT_FORM_USAGE_POLICY.collectAttribution),
        dedupeByEmail: normalizeBoolean(raw.dedupeByEmail, DEFAULT_FORM_USAGE_POLICY.dedupeByEmail),
        dedupeWindowHours: Math.max(1, Math.min(720, normalizeNumber(raw.dedupeWindowHours, DEFAULT_FORM_USAGE_POLICY.dedupeWindowHours))),
        allowedSurfaces: allowedSurfaces.length > 0 ? allowedSurfaces : DEFAULT_FORM_USAGE_POLICY.allowedSurfaces,
    };
}

export function normalizeSurfaceBindings(value: unknown): string[] {
    return normalizeStringArray(value)
        .map(normalizeSurfaceKey)
        .filter(Boolean);
}

export function initialFormAnalyticsSnapshot(): FormAnalyticsSnapshot {
    return {
        submissionsTotal: 0,
        submissionsLast7Days: 0,
        submissionsLast30Days: 0,
        lastSubmittedAt: null,
        lastSubmittedSurface: null,
    };
}

export function normalizeFormSlug(value: unknown, title: string): string {
    const raw = normalizeString(value) || title;
    const slug = raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return slug || `form-${Date.now()}`;
}

export function extractSubmissionValues(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
    const raw = payload as Record<string, unknown>;
    const candidate = raw.values;
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
    }
    return raw;
}

export function extractSubmissionMeta(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return {};
    const raw = payload as Record<string, unknown>;
    if (raw.meta && typeof raw.meta === 'object' && !Array.isArray(raw.meta)) {
        return raw.meta as Record<string, unknown>;
    }
    return {};
}

export function getFirstEmail(values: Record<string, unknown>): string {
    const candidates = [
        values.email,
        values.customerEmail,
        values.contactEmail,
    ];
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim().toLowerCase();
        }
    }
    return '';
}
