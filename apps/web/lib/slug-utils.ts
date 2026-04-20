export interface SlugOptions {
    maxLength?: number;
}

export interface AutoSlugInput extends SlugOptions {
    slug?: string | null;
    title?: string | null;
    name?: string | null;
    label?: string | null;
    fallback?: string | null;
}

function trimSlugEdgeDashes(value: string): string {
    return value.replace(/^-+|-+$/g, '');
}

export function normalizeSlug(value: string, options: SlugOptions = {}): string {
    const maxLength = typeof options.maxLength === 'number' && options.maxLength > 0
        ? options.maxLength
        : 80;

    const normalized = trimSlugEdgeDashes(
        value
            .toLowerCase()
            .trim()
            .replace(/&/g, ' and ')
            .replace(/[^a-z0-9]+/g, '-')
    );

    return normalized.slice(0, maxLength).replace(/-+$/g, '');
}

export function createAutoSlug(input: AutoSlugInput): string {
    const source = [
        input.slug,
        input.title,
        input.name,
        input.label,
        input.fallback,
    ].find((value): value is string => typeof value === 'string' && value.trim().length > 0) || 'item';

    return normalizeSlug(source, input);
}
