import type { PassportOcrResultDto, TravelPassportDto } from '@/lib/contracts/travel';
import { OCR_SPACE_API_KEY, PASSPORT_OCR_PROVIDER } from '@/lib/server-env';

interface OcrTextResult {
    provider: string;
    rawText: string;
    warnings: string[];
}

function normalizeDate(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return '';

    const compact = trimmed.replace(/[^0-9]/g, '');
    if (compact.length === 8) {
        const y = compact.slice(0, 4);
        const m = compact.slice(4, 6);
        const d = compact.slice(6, 8);
        return `${y}-${m}-${d}`;
    }

    const parts = trimmed.split(/[\/\-.\s]+/).filter(Boolean);
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
        const [d, m, y] = parts;
        const fullYear = y.length === 2 ? `20${y}` : y;
        return `${fullYear}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }

    return '';
}

function parseMrzDate(value: string, asExpiry: boolean): string {
    if (!/^[0-9]{6}$/.test(value)) return '';
    const yy = Number(value.slice(0, 2));
    const mm = value.slice(2, 4);
    const dd = value.slice(4, 6);
    const nowYear = new Date().getFullYear();
    const nowYY = Number(String(nowYear).slice(2));

    let fullYear = 2000 + yy;
    if (!asExpiry && yy > nowYY) fullYear = 1900 + yy;
    if (asExpiry && yy < nowYY - 20) fullYear = 2100 + yy;

    return `${String(fullYear)}-${mm}-${dd}`;
}

function sanitizeText(raw: string): string {
    return raw.replace(/\r/g, '\n').replace(/\u00a0/g, ' ').trim();
}

function parseByRegex(text: string): PassportOcrResultDto {
    const get = (re: RegExp): string => {
        const match = text.match(re);
        return match?.[1]?.trim() || '';
    };

    const passportNumber =
        get(/passport\s*(?:no|number|#)?\s*[:\-]?\s*([A-Z0-9]{6,12})/i) ||
        get(/\b([A-Z][0-9]{7,8})\b/i);
    const nationality = get(/nationality\s*[:\-]?\s*([A-Z][A-Za-z ]{1,40})/i);
    const issuingCountry = get(/(?:issuing\s*country|authority)\s*[:\-]?\s*([A-Z][A-Za-z ]{1,40})/i);
    const surname = get(/surname\s*[:\-]?\s*([A-Z][A-Za-z<'\- ]{1,60})/i);
    const givenName =
        get(/given\s*name[s]?\s*[:\-]?\s*([A-Z][A-Za-z<'\- ]{1,60})/i) ||
        get(/name\s*[:\-]?\s*([A-Z][A-Za-z<'\- ]{1,60})/i);
    const dateOfBirth =
        normalizeDate(get(/(?:date\s*of\s*birth|dob)\s*[:\-]?\s*([0-9][0-9\/\-.\s]{5,15})/i));
    const expiryDate =
        normalizeDate(get(/(?:date\s*of\s*expiry|expiry\s*date|valid\s*until)\s*[:\-]?\s*([0-9][0-9\/\-.\s]{5,15})/i));
    const gender = get(/(?:sex|gender)\s*[:\-]?\s*([MFX])/i).toUpperCase();

    const fullName = [givenName, surname].filter(Boolean).join(' ').trim();
    const passport: TravelPassportDto = {
        passportNumber,
        issuingCountry,
        nationality,
        dateOfBirth,
        expiryDate,
        gender,
        rawText: text,
        ocrConfidence: 0,
    };

    return {
        fullName: fullName || undefined,
        nationality: nationality || undefined,
        passport,
    };
}

function parseMrz(text: string, current: PassportOcrResultDto): PassportOcrResultDto {
    const lines = text
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const mrzLines = lines.filter(line => line.includes('<') && line.length >= 30);
    if (mrzLines.length < 2) return current;

    const line1 = mrzLines[mrzLines.length - 2].replace(/\s/g, '');
    const line2 = mrzLines[mrzLines.length - 1].replace(/\s/g, '');
    if (line1.length < 30 || line2.length < 30) return current;

    const issuingCountry = line1.slice(2, 5).replace(/</g, '');
    const namesSegment = line1.slice(5).split('<<');
    const surname = namesSegment[0]?.replace(/</g, ' ').trim() || '';
    const givenName = namesSegment.slice(1).join(' ').replace(/</g, ' ').trim();
    const passportNumber = line2.slice(0, 9).replace(/</g, '');
    const nationality = line2.slice(10, 13).replace(/</g, '');
    const dateOfBirth = parseMrzDate(line2.slice(13, 19), false);
    const gender = line2.slice(20, 21).replace(/</g, '').toUpperCase();
    const expiryDate = parseMrzDate(line2.slice(21, 27), true);

    const merged: PassportOcrResultDto = {
        ...current,
        fullName: current.fullName || [givenName, surname].filter(Boolean).join(' ').trim() || undefined,
        nationality: current.nationality || nationality || undefined,
        passport: {
            ...current.passport,
            passportNumber: current.passport.passportNumber || passportNumber,
            issuingCountry: current.passport.issuingCountry || issuingCountry,
            nationality: current.passport.nationality || nationality,
            dateOfBirth: current.passport.dateOfBirth || dateOfBirth,
            expiryDate: current.passport.expiryDate || expiryDate,
            gender: current.passport.gender || gender,
        },
    };
    return merged;
}

function computeConfidence(result: PassportOcrResultDto): number {
    const checks = [
        Boolean(result.passport.passportNumber),
        Boolean(result.passport.nationality),
        Boolean(result.passport.dateOfBirth),
        Boolean(result.passport.expiryDate),
        Boolean(result.fullName),
    ];
    const score = checks.filter(Boolean).length / checks.length;
    return Number(score.toFixed(2));
}

export function extractPassportDataFromText(rawText: string): PassportOcrResultDto {
    const text = sanitizeText(rawText);
    const regexResult = parseByRegex(text);
    const merged = parseMrz(text, regexResult);
    const confidence = computeConfidence(merged);
    return {
        ...merged,
        passport: {
            ...merged.passport,
            rawText: text,
            ocrConfidence: confidence,
        },
    };
}

async function runOcrSpace(file: File): Promise<OcrTextResult> {
    const apiKey = OCR_SPACE_API_KEY;
    if (!apiKey) {
        throw new Error('OCR provider configured as "ocr_space" but OCR_SPACE_API_KEY is missing.');
    }

    const form = new FormData();
    form.append('apikey', apiKey);
    form.append('language', 'eng');
    form.append('isOverlayRequired', 'false');
    form.append('file', file, file.name || 'passport.jpg');

    const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: form,
    });
    const payload = await response.json();
    if (!response.ok || payload?.IsErroredOnProcessing) {
        const err = payload?.ErrorMessage?.join?.(', ') || payload?.ErrorMessage || 'OCR.Space request failed.';
        throw new Error(String(err));
    }

    const rawText = Array.isArray(payload?.ParsedResults)
        ? payload.ParsedResults.map((item: { ParsedText?: string }) => item.ParsedText || '').join('\n')
        : '';

    return {
        provider: 'ocr_space',
        rawText: sanitizeText(rawText),
        warnings: [],
    };
}

export async function extractPassportDataFromFile(file: File, fallbackText = ''): Promise<{
    extracted: PassportOcrResultDto;
    provider: string;
    warnings: string[];
}> {
    const provider = PASSPORT_OCR_PROVIDER;

    let ocrResult: OcrTextResult | null = null;
    if (provider === 'ocr_space') {
        ocrResult = await runOcrSpace(file);
    } else if (fallbackText.trim()) {
        ocrResult = {
            provider: 'manual_text',
            rawText: fallbackText.trim(),
            warnings: ['OCR provider not configured. Parsed from manually supplied text.'],
        };
    } else {
        throw new Error('No OCR provider configured. Set PASSPORT_OCR_PROVIDER=ocr_space and OCR_SPACE_API_KEY.');
    }

    const extracted = extractPassportDataFromText(ocrResult.rawText);
    return {
        extracted,
        provider: ocrResult.provider,
        warnings: ocrResult.warnings,
    };
}
