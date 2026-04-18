export const DEFAULT_PLATFORM_ROOT_DOMAIN = 'kalptree.xyz';
export const DEFAULT_JWT_SECRET = 'kalp-zero-default-secret-change-in-production';

function readString(value: string | undefined, fallback = ''): string {
    const trimmed = value?.trim();
    return trimmed ? trimmed : fallback;
}

function readBoolean(value: string | undefined, fallback = false): boolean {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return fallback;
}

export function parseCsvEnv(value: string | undefined): string[] {
    return Array.from(
        new Set(
            (value || '')
                .split(',')
                .map((entry) => entry.trim())
                .filter(Boolean)
        )
    );
}

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const COOKIE_SECURE = IS_PRODUCTION;

export const APP_PORT = readString(process.env.PORT, '3000');
export const MONGODB_URI = readString(process.env.MONGODB_URI, 'mongodb://127.0.0.1:27017');

export const PLATFORM_ROOT_DOMAIN = readString(
    process.env.KALP_PLATFORM_ROOT_DOMAIN
).toLowerCase();
export const PLATFORM_HOME_HOSTS = parseCsvEnv(
    process.env.KALP_PLATFORM_HOME_HOSTS
).map((host) => host.toLowerCase());
export const CANONICAL_PROTOCOL =
    readString(process.env.KALP_CANONICAL_PROTOCOL, 'https').toLowerCase() === 'http'
        ? 'http'
        : 'https';
export const PUBLIC_BASE_URL = readString(process.env.KALP_PUBLIC_BASE_URL);

export const ALLOW_SELF_REGISTRATION =
    readBoolean(process.env.KALP_ALLOW_SELF_REGISTRATION)
    || readBoolean(process.env.NEXT_PUBLIC_KALP_ALLOW_SELF_REGISTRATION);

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const OPENAI_DEFAULT_MODEL = readString(
    process.env.OPENAI_DEFAULT_MODEL,
    'gpt-4o-mini'
);
export const OPENAI_SITE_PLANNER_MODEL = readString(
    process.env.OPENAI_SITE_PLANNER_MODEL,
    OPENAI_DEFAULT_MODEL
);
export const OPENAI_SITE_CONTENT_MODEL = readString(
    process.env.OPENAI_SITE_CONTENT_MODEL,
    OPENAI_DEFAULT_MODEL
);
export const OPENAI_PRODUCT_GENERATION_MODEL = readString(
    process.env.OPENAI_PRODUCT_GENERATION_MODEL,
    OPENAI_SITE_CONTENT_MODEL
);
export const OPENAI_IMAGE_MODEL = readString(
    process.env.OPENAI_IMAGE_MODEL,
    'gpt-image-1'
);
export const KALP_AUTO_SITE_FACTORY = readBoolean(
    process.env.KALP_AUTO_SITE_FACTORY,
    true
);

export const JWT_SECRET_VALUE = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
export const SECRET_ENCRYPTION_KEY_SOURCE =
    process.env.KALP_SECRET_ENCRYPTION_KEY
    || JWT_SECRET_VALUE
    || DEFAULT_JWT_SECRET;

export const AWS_DEFAULT_REGION = readString(process.env.AWS_REGION, 'us-east-1');
export const AWS_DEFAULT_BUCKET = readString(
    process.env.AWS_S3_BUCKET_NAME,
    'kalp-tree-media-bucket'
);
export const AWS_DEFAULT_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || '';
export const AWS_DEFAULT_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || '';

export const PASSPORT_OCR_PROVIDER = readString(
    process.env.PASSPORT_OCR_PROVIDER,
    'none'
).toLowerCase();
export const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || '';

export const ALLOW_SEED_ADMIN_IN_PROD = readBoolean(
    process.env.ALLOW_SEED_ADMIN_IN_PROD
);
export const SEED_ADMIN_EMAIL = readString(process.env.SEED_ADMIN_EMAIL).toLowerCase();
export const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || '';
export const SEED_ADMIN_BOOTSTRAP_TOKEN =
    process.env.SEED_ADMIN_BOOTSTRAP_TOKEN || '';
export const SEED_ADMIN_EXPOSE_CREDENTIALS = readBoolean(
    process.env.SEED_ADMIN_EXPOSE_CREDENTIALS
);
