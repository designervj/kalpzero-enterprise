import type { SourceExtractedFieldDto, SourceInputType } from '@/lib/contracts/source';

const PARSER_VERSION = 'source-parser-v1';

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function stripHtml(html: string): string {
    return normalizeWhitespace(
        html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<[^>]*>/g, ' ')
    );
}

function toLabel(fieldPath: string): string {
    const tail = fieldPath.split('.').pop() || fieldPath;
    return tail
        .replace(/[_\-]/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function parseCurrencyAmount(input: string): { currency?: string; amount?: number } {
    const value = input.toUpperCase();
    const currencyMatch = value.match(/\b(INR|USD|EUR|GBP|AED|AUD|CAD|JPY)\b/);
    const amountMatch = value.match(/(?:₹|\$|€|£)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/);
    return {
        currency: currencyMatch?.[1],
        amount: amountMatch?.[1] ? Number(amountMatch[1].replace(/,/g, '')) : undefined,
    };
}

function flattenJson(value: unknown, prefix = '', out: Record<string, unknown> = {}): Record<string, unknown> {
    if (value === null || value === undefined) return out;
    if (Array.isArray(value)) {
        out[prefix] = value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ');
        return out;
    }
    if (typeof value !== 'object') {
        if (prefix) out[prefix] = value;
        return out;
    }
    const obj = value as Record<string, unknown>;
    for (const [key, nested] of Object.entries(obj)) {
        const nextPrefix = prefix ? `${prefix}.${key}` : key;
        if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
            flattenJson(nested, nextPrefix, out);
            continue;
        }
        out[nextPrefix] = nested;
    }
    return out;
}

function buildField(fieldPath: string, suggestedValue: unknown, confidence: number, reason: string, targetType: string): SourceExtractedFieldDto {
    const normalizedValue =
        suggestedValue === undefined
            ? null
            : typeof suggestedValue === 'string'
                ? suggestedValue.trim()
                : suggestedValue;
    return {
        fieldPath,
        label: toLabel(fieldPath),
        suggestedValue: normalizedValue as string | number | boolean | null,
        confidence,
        reason,
        targetType,
    };
}

function mapForTravel(normalizedText: string, kv: Record<string, string>): SourceExtractedFieldDto[] {
    const fields: SourceExtractedFieldDto[] = [];
    const title = kv.title || kv.packageTitle || kv.name || '';
    const destination = kv.destination || kv.city || '';
    const duration = kv.tripDuration || kv.duration || kv.trip || '';
    const shortDescription = kv.shortDescription || kv.summary || '';
    const longDescription = kv.longDescription || kv.description || kv.details || normalizedText.slice(0, 1200);

    if (title) fields.push(buildField('title', title, 0.93, 'Mapped from title/name key.', 'travel_package'));
    if (destination) fields.push(buildField('destination', destination, 0.9, 'Mapped from destination/city key.', 'travel_package'));
    if (duration) fields.push(buildField('tripDuration', duration, 0.86, 'Mapped from duration key.', 'travel_package'));
    if (shortDescription) fields.push(buildField('shortDescription', shortDescription, 0.85, 'Mapped from summary key.', 'travel_package'));
    if (longDescription) fields.push(buildField('longDescription', longDescription, 0.82, 'Mapped from long description/body text.', 'travel_package'));

    const parsedPrice = parseCurrencyAmount(kv.price || kv.amount || kv.cost || normalizedText);
    if (parsedPrice.currency) fields.push(buildField('price.currency', parsedPrice.currency, 0.8, 'Parsed currency token.', 'travel_package'));
    if (typeof parsedPrice.amount === 'number') fields.push(buildField('price.amount', parsedPrice.amount, 0.8, 'Parsed numeric amount.', 'travel_package'));

    return fields;
}

function mapForProduct(normalizedText: string, kv: Record<string, string>): SourceExtractedFieldDto[] {
    const fields: SourceExtractedFieldDto[] = [];
    const name = kv.title || kv.name || kv.productName || '';
    const sku = kv.sku || kv.productSku || '';
    const description = kv.description || kv.summary || normalizedText.slice(0, 1000);
    const businessType = kv.businessType || kv.category || '';
    const status = kv.status || '';

    if (name) fields.push(buildField('name', name, 0.93, 'Mapped from title/name key.', 'product'));
    if (sku) fields.push(buildField('sku', sku.toUpperCase(), 0.88, 'Mapped from SKU key.', 'product'));
    if (description) fields.push(buildField('description', description, 0.82, 'Mapped from description/summary/body.', 'product'));
    if (businessType) fields.push(buildField('businessType', businessType, 0.78, 'Mapped from category/business key.', 'product'));
    if (status) fields.push(buildField('status', status.toLowerCase(), 0.74, 'Mapped from status key.', 'product'));

    const parsedPrice = parseCurrencyAmount(kv.price || kv.amount || kv.cost || normalizedText);
    if (typeof parsedPrice.amount === 'number') fields.push(buildField('pricing.price', parsedPrice.amount, 0.84, 'Parsed numeric amount for product pricing.', 'product'));
    if (parsedPrice.currency) fields.push(buildField('pricing.currency', parsedPrice.currency, 0.7, 'Parsed currency token.', 'product'));

    return fields;
}

function parseTextKeyValue(raw: string): Record<string, string> {
    const map: Record<string, string> = {};
    raw.split('\n').forEach((line) => {
        const match = line.match(/^\s*([^:]+)\s*:\s*(.+)$/);
        if (!match) return;
        const key = match[1].trim().replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
        const value = match[2].trim();
        if (!key || !value) return;
        const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
        map[normalizedKey] = value;
    });
    return map;
}

function parseJsonContent(content: string): { kv: Record<string, string>; normalizedJson: Record<string, unknown>; warnings: string[] } {
    const warnings: string[] = [];
    try {
        const parsed = JSON.parse(content);
        const flattened = flattenJson(parsed);
        const kv: Record<string, string> = {};
        for (const [key, value] of Object.entries(flattened)) {
            if (value === null || value === undefined) continue;
            kv[key] = typeof value === 'string' ? value : String(value);
        }
        return { kv, normalizedJson: flattened, warnings };
    } catch {
        warnings.push('Invalid JSON payload. Parsed as plain text fallback.');
        return { kv: parseTextKeyValue(content), normalizedJson: {}, warnings };
    }
}

function buildGenericFields(kv: Record<string, string>): SourceExtractedFieldDto[] {
    return Object.entries(kv)
        .slice(0, 25)
        .map(([fieldPath, value]) => buildField(fieldPath, value, 0.5, 'Generic extracted key-value candidate.', 'generic'));
}

export async function parseSourceInput(inputType: SourceInputType, payload: Record<string, unknown>): Promise<{
    origin: Record<string, unknown>;
    raw: Record<string, unknown>;
    normalized: Record<string, unknown>;
    extractedFields: SourceExtractedFieldDto[];
    warnings: string[];
    confidence: number;
    status: 'ready' | 'pending_manual' | 'error';
    parserVersion: string;
}> {
    const warnings: string[] = [];

    if (inputType === 'file') {
        return {
            origin: {
                fileName: String(payload.fileName || ''),
                mimeType: String(payload.mimeType || ''),
                size: Number(payload.size || 0),
            },
            raw: payload,
            normalized: {},
            extractedFields: [],
            warnings: ['File parsing is not enabled in this phase. Record saved for reference.'],
            confidence: 0,
            status: 'pending_manual',
            parserVersion: PARSER_VERSION,
        };
    }

    let sourceText = '';
    const origin: Record<string, unknown> = {};
    const raw: Record<string, unknown> = { ...payload };
    const normalized: Record<string, unknown> = {};
    let kv: Record<string, string> = {};

    if (inputType === 'link') {
        const url = String(payload.url || '').trim();
        if (!url) throw new Error('URL is required for link source ingestion.');
        origin.url = url;
        const res = await fetch(url, { redirect: 'follow' });
        if (!res.ok) throw new Error(`Unable to fetch URL (${res.status}).`);
        const html = await res.text();
        const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
        const metaDescription = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)?.[1] || '';
        const bodyText = stripHtml(html).slice(0, 8000);
        sourceText = normalizeWhitespace(`${title}\n${metaDescription}\n${bodyText}`);
        normalized.title = normalizeWhitespace(title);
        normalized.metaDescription = normalizeWhitespace(metaDescription);
        normalized.text = bodyText;
        kv = {
            title: String(normalized.title || ''),
            shortDescription: String(normalized.metaDescription || ''),
            description: bodyText,
        };
    } else if (inputType === 'text') {
        sourceText = String(payload.text || '').trim();
        if (!sourceText) throw new Error('Text payload is required.');
        normalized.text = sourceText;
        kv = parseTextKeyValue(sourceText);
    } else if (inputType === 'json') {
        const content = String(payload.json || payload.text || '').trim();
        if (!content) throw new Error('JSON payload is required.');
        sourceText = content;
        const parsed = parseJsonContent(content);
        warnings.push(...parsed.warnings);
        kv = parsed.kv;
        normalized.json = parsed.normalizedJson;
        normalized.text = content;
    }

    const normalizedText = normalizeWhitespace(sourceText);
    const extractedFields: SourceExtractedFieldDto[] = [
        ...mapForTravel(normalizedText, kv),
        ...mapForProduct(normalizedText, kv),
        ...buildGenericFields(kv),
    ];

    const unique = new Map<string, SourceExtractedFieldDto>();
    for (const field of extractedFields) {
        const key = `${field.targetType || 'generic'}::${field.fieldPath}`;
        const existing = unique.get(key);
        if (!existing || field.confidence > existing.confidence) unique.set(key, field);
    }
    const deDupedFields = Array.from(unique.values());
    const confidence = deDupedFields.length > 0
        ? Number((deDupedFields.reduce((sum, item) => sum + item.confidence, 0) / deDupedFields.length).toFixed(2))
        : 0;

    return {
        origin,
        raw,
        normalized,
        extractedFields: deDupedFields,
        warnings,
        confidence,
        status: 'ready',
        parserVersion: PARSER_VERSION,
    };
}
