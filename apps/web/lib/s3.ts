import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getMasterDb } from './db';
import { ObjectId } from 'mongodb';
import { decryptSecret } from './secret-crypto';
import {
    AWS_DEFAULT_ACCESS_KEY,
    AWS_DEFAULT_BUCKET,
    AWS_DEFAULT_REGION,
    AWS_DEFAULT_SECRET_KEY,
    IS_PRODUCTION,
} from './server-env';

const DEFAULT_REGION = AWS_DEFAULT_REGION;
const DEFAULT_BUCKET = AWS_DEFAULT_BUCKET;
const DEFAULT_ACCESS_KEY = AWS_DEFAULT_ACCESS_KEY;
const DEFAULT_SECRET_KEY = AWS_DEFAULT_SECRET_KEY;

if (IS_PRODUCTION) {
    if (!DEFAULT_REGION || !DEFAULT_ACCESS_KEY || !DEFAULT_SECRET_KEY || !DEFAULT_BUCKET) {
        console.warn('System AWS S3 credentials must be configured in production for the Default Storage profile.');
    }
}

export interface StorageConfig {
    region: string;
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    mode: 'default' | 'self';
}

/**
 * Resolves the S3 Configuration for a Tenant.
 * If the tenant has a custom storage profile active, it uses their AWS credentials.
 * Otherwise, it falls back to the System Default bucket.
 */
export async function resolveTenantStorageConfig(tenantKey: string, agencyId?: string): Promise<StorageConfig> {
    const masterDb = await getMasterDb();
    const tenant = await masterDb.collection('tenants').findOne(
        { key: tenantKey },
        { projection: { storageProfile: 1, agencyId: 1, infraAssignments: 1 } }
    );

    const infraAssignments = tenant?.infraAssignments && typeof tenant.infraAssignments === 'object'
        ? tenant.infraAssignments as Record<string, unknown>
        : {};
    const infraStorage = infraAssignments.storage && typeof infraAssignments.storage === 'object'
        ? infraAssignments.storage as Record<string, unknown>
        : {};
    if (infraStorage.mode === 'agency_managed_s3') {
        const accessKey = decryptSecret(typeof infraStorage.awsAccessKeyIdEncrypted === 'string' ? infraStorage.awsAccessKeyIdEncrypted : "");
        const secretKey = decryptSecret(typeof infraStorage.awsSecretAccessKeyEncrypted === 'string' ? infraStorage.awsSecretAccessKeyEncrypted : '');
        const region = typeof infraStorage.awsRegion === 'string' ? infraStorage.awsRegion.trim() : '';
        const bucketName = typeof infraStorage.awsBucketName === 'string' ? infraStorage.awsBucketName.trim() : '';
        if (accessKey && secretKey && region && bucketName) {
            return {
                mode: 'self',
                region,
                bucketName,
                accessKeyId: accessKey,
                secretAccessKey: secretKey,
            };
        }
    }

    // 1. Check Tenant-Level Override directly
    const profile = tenant?.storageProfile;
    if (profile && profile.mode === 'self' && profile.awsAccessKeyId && profile.awsSecretAccessKey && profile.awsRegion && profile.awsBucketName) {
        return {
            mode: 'self',
            region: profile.awsRegion,
            bucketName: profile.awsBucketName,
            accessKeyId: profile.awsAccessKeyId,
            secretAccessKey: profile.awsSecretAccessKey,
        };
    }

    // 2. Check Agency-Level Override
    const actualAgencyId = agencyId || tenant?.agencyId;
    if (actualAgencyId) {
        const agency = await masterDb.collection('agencies').findOne(
            { _id: new ObjectId(actualAgencyId) },
            { projection: { integrations: 1, infraProfile: 1 } }
        );

        const infraProfile = agency?.infraProfile && typeof agency.infraProfile === 'object'
            ? agency.infraProfile as Record<string, unknown>
            : {};
        const infraStorageProfile = infraProfile.storage && typeof infraProfile.storage === 'object'
            ? infraProfile.storage as Record<string, unknown>
            : {};
        const infraAccessKey = decryptSecret(typeof infraStorageProfile.awsAccessKeyIdEncrypted === 'string'
            ? infraStorageProfile.awsAccessKeyIdEncrypted
            : '');
        const infraSecret = decryptSecret(typeof infraStorageProfile.awsSecretAccessKeyEncrypted === 'string'
            ? infraStorageProfile.awsSecretAccessKeyEncrypted
            : '');
        const infraRegion = typeof infraStorageProfile.awsRegion === 'string' ? infraStorageProfile.awsRegion.trim() : '';
        const infraBucket = typeof infraStorageProfile.awsBucketName === 'string' ? infraStorageProfile.awsBucketName.trim() : '';

        if (infraStorageProfile.mode === 'agency_managed_s3' && infraAccessKey && infraSecret && infraRegion && infraBucket) {
            return {
                mode: 'self',
                region: infraRegion,
                bucketName: infraBucket,
                accessKeyId: infraAccessKey,
                secretAccessKey: infraSecret,
            };
        }

        const legacy = agency?.integrations;
        if (legacy && legacy.awsAccessKeyId && legacy.awsSecretAccessKey && legacy.awsRegion && legacy.awsBucketName) {
            return {
                mode: 'self',
                region: legacy.awsRegion,
                bucketName: legacy.awsBucketName,
                accessKeyId: legacy.awsAccessKeyId,
                secretAccessKey: legacy.awsSecretAccessKey,
            };
        }
    }

    // 3. Fallback to System Default
    return {
        mode: 'default',
        region: DEFAULT_REGION,
        bucketName: DEFAULT_BUCKET,
        accessKeyId: DEFAULT_ACCESS_KEY,
        secretAccessKey: DEFAULT_SECRET_KEY,
    };
}

/**
 * Builds an ephemeral S3 Client based on the resolved configuration.
 */
function buildClient(config: StorageConfig): S3Client {
    return new S3Client({
        region: config.region,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
        },
    });
}

/**
 * Uploads a file buffer to the Tenant's delegated S3 Bucket (Default or Self).
 */
export async function uploadMediaToS3(tenantKey: string, key: string, body: Buffer, contentType: string, agencyId?: string): Promise<string> {
    const config = await resolveTenantStorageConfig(tenantKey, agencyId);
    const s3Client = buildClient(config);

    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
    });

    await s3Client.send(command);
    return `https://${config.bucketName}.s3.${config.region}.amazonaws.com/${key}`;
}

/**
 * Deletes an object from the Tenant's delegated S3 Bucket.
 */
export async function deleteMediaFromS3(tenantKey: string, key: string, agencyId?: string): Promise<void> {
    const config = await resolveTenantStorageConfig(tenantKey, agencyId);
    const s3Client = buildClient(config);

    const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    await s3Client.send(command);
}
