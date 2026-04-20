import { MongoClient } from 'mongodb';
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';

export type InfraValidationStatus = 'pass' | 'fail' | 'skip';

export interface InfraValidationCheck {
    key: 'database' | 'storage' | 'ai';
    status: InfraValidationStatus;
    message: string;
    hint?: string;
    latencyMs: number;
}

export interface InfraValidationReport {
    allPassed: boolean;
    checkedAt: Date;
    checks: InfraValidationCheck[];
}

interface DatabaseInput {
    mode: string;
    mongoUri?: string;
    databaseName?: string;
}

interface StorageInput {
    mode: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsRegion?: string;
    awsBucketName?: string;
}

interface AiInput {
    mode: string;
    provider?: string;
    apiKey?: string;
}

interface ProviderCheckConfig {
    endpoint: string;
    headers: Record<string, string>;
}

function nowMs(): number {
    return Date.now();
}

function toMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

function hintForDatabaseError(message: string): string {
    const text = message.toLowerCase();
    if (text.includes('auth') || text.includes('authentication')) return 'Verify Mongo username/password and DB auth source.';
    if (text.includes('timed out') || text.includes('topology') || text.includes('econn')) return 'Verify Mongo network allow-list and cluster endpoint reachability.';
    return 'Check URI format, credentials, and cluster network policy.';
}

function hintForStorageError(message: string): string {
    const text = message.toLowerCase();
    if (text.includes('accessdenied') || text.includes('forbidden')) return 'IAM user must have HeadBucket/ListBucket permission for this bucket.';
    if (text.includes('invalidaccesskeyid') || text.includes('signature')) return 'Verify AWS access key, secret key, and region values.';
    if (text.includes('nosuchbucket') || text.includes('not found')) return 'Bucket name is invalid or not available in this account/region.';
    return 'Check AWS credentials, region, bucket name, and IAM permissions.';
}

function hintForAiError(provider: string, message: string): string {
    const text = message.toLowerCase();
    if (text.includes('401') || text.includes('unauthorized') || text.includes('invalid')) {
        return `The ${provider} API key appears invalid or expired. Regenerate and retry.`;
    }
    if (text.includes('403')) {
        return `The ${provider} key lacks permission for model listing endpoint. Check account/project scopes.`;
    }
    if (text.includes('429') || text.includes('rate')) {
        return `The ${provider} account is rate-limited. Retry later or use a different key.`;
    }
    if (text.includes('timed out') || text.includes('abort')) {
        return `Network timeout while validating ${provider}. Retry and verify outbound connectivity.`;
    }
    return `Verify ${provider} API key and account access policy.`;
}

async function validateDatabase(input: DatabaseInput): Promise<InfraValidationCheck> {
    const startedAt = nowMs();
    if (input.mode !== 'agency_managed_mongo') {
        return {
            key: 'database',
            status: 'skip',
            message: 'Kalp-managed database mode selected.',
            latencyMs: nowMs() - startedAt,
        };
    }

    if (!input.mongoUri?.trim()) {
        return {
            key: 'database',
            status: 'fail',
            message: 'Mongo URI is required for agency-managed database mode.',
            hint: 'Use a full mongodb+srv:// URI with valid credentials.',
            latencyMs: nowMs() - startedAt,
        };
    }

    let client: MongoClient | null = null;
    try {
        client = await MongoClient.connect(input.mongoUri.trim(), {
            serverSelectionTimeoutMS: 4000,
            connectTimeoutMS: 4000,
        });
        const dbName = input.databaseName?.trim() || 'admin';
        await client.db(dbName).command({ ping: 1 });
        return {
            key: 'database',
            status: 'pass',
            message: `Connected successfully to "${dbName}".`,
            latencyMs: nowMs() - startedAt,
        };
    } catch (error: unknown) {
        const message = toMessage(error, 'Failed to connect to agency Mongo database.');
        return {
            key: 'database',
            status: 'fail',
            message,
            hint: hintForDatabaseError(message),
            latencyMs: nowMs() - startedAt,
        };
    } finally {
        if (client) {
            try {
                await client.close();
            } catch {
                // no-op
            }
        }
    }
}

async function validateStorage(input: StorageInput): Promise<InfraValidationCheck> {
    const startedAt = nowMs();
    if (input.mode !== 'agency_managed_s3') {
        return {
            key: 'storage',
            status: 'skip',
            message: 'Kalp-managed storage mode selected.',
            latencyMs: nowMs() - startedAt,
        };
    }

    const accessKeyId = input.awsAccessKeyId?.trim() || '';
    const secretAccessKey = input.awsSecretAccessKey?.trim() || '';
    const region = input.awsRegion?.trim() || '';
    const bucket = input.awsBucketName?.trim() || '';
    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
        return {
            key: 'storage',
            status: 'fail',
            message: 'AWS access key, secret, region, and bucket are required for agency-managed storage mode.',
            hint: 'Fill all required S3 fields before validation.',
            latencyMs: nowMs() - startedAt,
        };
    }

    try {
        const client = new S3Client({
            region,
            credentials: { accessKeyId, secretAccessKey },
        });
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
        return {
            key: 'storage',
            status: 'pass',
            message: `S3 bucket "${bucket}" is reachable.`,
            latencyMs: nowMs() - startedAt,
        };
    } catch (error: unknown) {
        const message = toMessage(error, 'Failed to validate agency S3 bucket access.');
        return {
            key: 'storage',
            status: 'fail',
            message,
            hint: hintForStorageError(message),
            latencyMs: nowMs() - startedAt,
        };
    }
}

async function validateAi(input: AiInput): Promise<InfraValidationCheck> {
    const startedAt = nowMs();
    if (input.mode !== 'agency_managed_ai') {
        return {
            key: 'ai',
            status: 'skip',
            message: 'Kalp-managed AI mode selected.',
            latencyMs: nowMs() - startedAt,
        };
    }

    const provider = (input.provider || 'openai').trim().toLowerCase();
    const apiKey = input.apiKey?.trim() || '';
    if (!apiKey) {
        return {
            key: 'ai',
            status: 'fail',
            message: 'API key is required for agency-managed AI mode.',
            hint: 'Enter a provider key and default model before validation.',
            latencyMs: nowMs() - startedAt,
        };
    }

    const providerConfig = resolveProviderCheckConfig(provider, apiKey);
    if (!providerConfig) {
        return {
            key: 'ai',
            status: 'fail',
            message: `Provider "${provider}" is not yet supported for live validation. Supported: openai, anthropic, google, gemini, openrouter, groq, xai.`,
            hint: 'Switch to a supported provider or extend validation adapter contract.',
            latencyMs: nowMs() - startedAt,
        };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
        const response = await fetch(providerConfig.endpoint, {
            method: 'GET',
            headers: providerConfig.headers,
            signal: controller.signal,
            cache: 'no-store',
        });
        if (!response.ok) {
            const bodyText = await response.text().catch(() => '');
            const message = `${provider} validation failed (${response.status}). ${bodyText.slice(0, 220)}`.trim();
            return {
                key: 'ai',
                status: 'fail',
                message,
                hint: hintForAiError(provider, message),
                latencyMs: nowMs() - startedAt,
            };
        }
        return {
            key: 'ai',
            status: 'pass',
            message: `${provider} key validation succeeded.`,
            latencyMs: nowMs() - startedAt,
        };
    } catch (error: unknown) {
        const message = toMessage(error, 'Failed to validate AI provider key.');
        return {
            key: 'ai',
            status: 'fail',
            message,
            hint: hintForAiError(provider, message),
            latencyMs: nowMs() - startedAt,
        };
    } finally {
        clearTimeout(timeout);
    }
}

function resolveProviderCheckConfig(provider: string, apiKey: string): ProviderCheckConfig | null {
    const normalized = provider.trim().toLowerCase();
    const bearerHeaders = { Authorization: `Bearer ${apiKey}` };

    if (normalized === 'openai') {
        return {
            endpoint: 'https://api.openai.com/v1/models',
            headers: bearerHeaders,
        };
    }
    if (normalized === 'anthropic') {
        return {
            endpoint: 'https://api.anthropic.com/v1/models',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
        };
    }
    if (normalized === 'google' || normalized === 'gemini' || normalized === 'google-gemini') {
        return {
            endpoint: `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
            headers: {},
        };
    }
    if (normalized === 'openrouter') {
        return {
            endpoint: 'https://openrouter.ai/api/v1/models',
            headers: bearerHeaders,
        };
    }
    if (normalized === 'groq') {
        return {
            endpoint: 'https://api.groq.com/openai/v1/models',
            headers: bearerHeaders,
        };
    }
    if (normalized === 'xai' || normalized === 'x.ai') {
        return {
            endpoint: 'https://api.x.ai/v1/models',
            headers: bearerHeaders,
        };
    }
    return null;
}

export async function validateInfraProfile(input: {
    database: DatabaseInput;
    storage: StorageInput;
    ai: AiInput;
}): Promise<InfraValidationReport> {
    const checks = await Promise.all([
        validateDatabase(input.database),
        validateStorage(input.storage),
        validateAi(input.ai),
    ]);
    return {
        allPassed: checks.every((check) => check.status !== 'fail'),
        checkedAt: new Date(),
        checks,
    };
}
