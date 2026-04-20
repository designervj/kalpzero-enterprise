import { ObjectId } from 'mongodb';
import { getMasterDb } from '@/lib/db';

export interface AgencyLimits {
    maxTenants: number;
    maxBusinesses: number;
    maxStorageMB: number;
    activeTenants: number;
    activeBusinesses: number;
}

export interface AgencyIntegrations {
    mongodbUri?: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsRegion?: string;
    awsBucketName?: string;
}

export interface AgencyPlanTier {
    key: string;
    name: string;
    badge: string;
    description: string;
    price: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly' | 'custom';
    isPublished: boolean;
    status: 'draft' | 'active' | 'archived';
    modules: string[];
    plugins: string[];
    features: string[];
    limits: {
        maxUsers: number;
        maxProducts: number;
        storageGb: number;
        aiCreditsMonthly: number;
        maxPublishedPages: number;
    };
    support: {
        channel: 'email' | 'priority_email' | 'dedicated_manager';
        slaHours: number;
    };
}

export interface AgencyEcosystemSettings {
    version: number;
    isHubEcosystem: boolean;
    hubId: string;
    terminologyOverrides: Record<string, string>;
    whiteLabel: {
        brandName: string;
        shortName: string;
        logoUrl: string;
        compactLogoUrl: string;
        faviconUrl: string;
    };
    media: {
        libraryName: string;
        cloudName: string;
        rootPath: string;
        sharedPrefix: string;
        enablePopulateFromKalp: boolean;
        categories: string[];
    };
    planCatalog: AgencyPlanTier[];
    updatedAt: Date;
}

export interface AgencyDomainSettings {
    enabled: boolean;
    tenantSubdomainEnabled: boolean;
    status: 'draft' | 'active';
    fallbackToPlatform: boolean;
    verifiedAt?: Date | null;
    updatedAt?: Date;
}

export interface AgencyDocument {
    _id: ObjectId;
    name: string;
    ownerId: ObjectId;
    ownerUserId?: ObjectId;
    ownerEmail?: string;
    customDomain?: string;
    domainSettings?: AgencyDomainSettings;
    plan: 'Starter' | 'Pro' | 'Enterprise';
    limits: AgencyLimits;
    infraProfile?: {
        version: number;
        status: 'active' | 'draft' | 'failed';
        activatedAt?: Date;
        updatedAt?: Date;
        database?: Record<string, unknown>;
        storage?: Record<string, unknown>;
        ai?: Record<string, unknown>;
    };
    integrations?: AgencyIntegrations;
    ecosystem?: AgencyEcosystemSettings;
    createdAt: Date;
    updatedAt: Date;
}

export type CreateAgencyPayload = Omit<AgencyDocument, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * Retrieves an Agency by its internal ID.
 */
export async function getAgencyById(id: string | ObjectId): Promise<AgencyDocument | null> {
    if (!id || (typeof id === 'string' && !ObjectId.isValid(id))) return null;
    const db = await getMasterDb();
    const agency = await db.collection<AgencyDocument>('agencies').findOne({ _id: new ObjectId(id) });
    return agency;
}

/**
 * Retrieves an Agency by its assigned custom domain (used by middleware proxy logic).
 */
export async function getAgencyByDomain(domain: string): Promise<AgencyDocument | null> {
    if (!domain) return null;
    const db = await getMasterDb();
    const agency = await db.collection<AgencyDocument>('agencies').findOne({ customDomain: domain });
    return agency;
}

/**
 * Creates a new Agency workspace.
 */
export async function createAgency(payload: CreateAgencyPayload): Promise<ObjectId> {
    const db = await getMasterDb();
    const doc: Omit<AgencyDocument, '_id'> = {
        ...payload,
        ownerId: new ObjectId(payload.ownerId),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const result = await db.collection('agencies').insertOne(doc);
    return result.insertedId;
}
