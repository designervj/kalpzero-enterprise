import { BrandAssetSpec } from "../tenantType";

export function normalizeBrandKit(brandKit: unknown): Record<string, any> {
    const root = brandKit && typeof brandKit === 'object' ? { ...(brandKit as Record<string, unknown>) } : {};
    const logo = root.logo && typeof root.logo === 'object' ? { ...(root.logo as Record<string, unknown>) } : {};

    const thumbnail = typeof logo.thumbnail === 'string' ? logo.thumbnail : '';
    const icon = typeof logo.icon === 'string' ? logo.icon : thumbnail;

    return {
        ...root,
        logo: {
            ...logo,
            primary: typeof logo.primary === 'string' ? logo.primary : '',
            light: typeof logo.light === 'string' ? logo.light : '',
            dark: typeof logo.dark === 'string' ? logo.dark : '',
            icon: icon || '',
            thumbnail: thumbnail || (typeof logo.icon === 'string' ? logo.icon : ''),
            favicon: typeof logo.favicon === 'string' ? logo.favicon : '',
        },
    };
}

/**
 * Safely extracts a display name from various businessType formats for UI
 */
export function getBusinessTypeDisplay(bt: unknown): string {
    if (!bt) return '';
    if (typeof bt === 'string') return bt.trim();
    if (Array.isArray(bt)) {
        return bt.map(getBusinessTypeDisplay).filter(Boolean).join(', ');
    }
    if (typeof bt === 'object' && bt !== null) {
        const raw = bt as Record<string, any>;
        return raw.name || raw.businessType || raw.key || String(bt);
    }
    return '';
}

export function getFileExtension(name: string): string {
    const parts = name.toLowerCase().split('.');
    if (parts.length < 2) return '';
    return `.${parts[parts.length - 1]}`;
}

export function validateBrandAssetFile(file: File, spec: BrandAssetSpec): string | null {
    if (file.size > spec.maxBytes) {
        const maxMb = (spec.maxBytes / (1024 * 1024)).toFixed(spec.maxBytes < 1024 * 1024 ? 1 : 0);
        return `File too large. Maximum allowed is ${maxMb} MB.`;
    }

    const allowedExtensions = spec.accept.split(',').map(item => item.trim().toLowerCase());
    const ext = getFileExtension(file.name);
    if (!allowedExtensions.includes(ext)) {
        return `Unsupported format. Allowed: ${spec.acceptLabel}.`;
    }

    return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read selected file.'));
        reader.readAsDataURL(file);
    });
}

export function normalizeBusinessContextKey(value: unknown): string {
    if (!value) return "";
    let str = "";
    if (typeof value === "string") str = value;
    else if (Array.isArray(value)) str = value.length > 0 ? normalizeBusinessContextKey(value[0]) : "";
    else if (typeof value === "object" && value !== null) {
        const raw = value as Record<string, any>;
        str = raw.key || raw.businessType || String(value);
    }

    if (!str || typeof str !== "string") return "";

    return str
        .toLowerCase()
        .trim()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function normalizeContextArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => normalizeBusinessContextKey(item))
        .filter(Boolean);
}

export const ALL_MODULES = [
  "website",
  "branding",
  "products",
  "ecommerce",
  "bookings",
  "marketing",
  "blog",
  "portfolio",
  "media",
  "invoicing",
  "source",
  "kalpbodh",
  "hotel_management",
  "tour_management",
];

export const BRAND_ASSET_SPECS: BrandAssetSpec[] = [
  {
    key: "light",
    label: "Logo (For Light Background)",
    guidance: "Recommended 1200x400, transparent PNG/SVG preferred, max 2 MB.",
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    acceptLabel: "PNG, JPG, WEBP, SVG",
    maxBytes: 2 * 1024 * 1024,
  },
  {
    key: "dark",
    label: "Logo (For Dark Background)",
    guidance: "Recommended 1200x400, transparent PNG/SVG preferred, max 2 MB.",
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    acceptLabel: "PNG, JPG, WEBP, SVG",
    maxBytes: 2 * 1024 * 1024,
  },
  {
    key: "thumbnail",
    label: "Thumbnail / App Icon",
    guidance: "Recommended 512x512 square, max 1 MB.",
    accept: ".png,.jpg,.jpeg,.webp,.svg",
    acceptLabel: "PNG, JPG, WEBP, SVG",
    maxBytes: 1024 * 1024,
  },
  {
    key: "favicon",
    label: "Favicon",
    guidance:
      "Recommended 64x64 or 128x128. Prefer .ico, .png, or .svg, max 512 KB.",
    accept: ".ico,.png,.svg,.webp",
    acceptLabel: "ICO, PNG, SVG, WEBP",
    maxBytes: 512 * 1024,
  },
];