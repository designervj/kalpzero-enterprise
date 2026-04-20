import type { Db } from 'mongodb';
import { getSystemDb } from '@/lib/db';

export const BUSINESS_LIFECYCLE_STATUSES = [
    'draft_intake',
    'identity_validated',
    'slug_reserved',
    'free_page_live',
    'domain_pending',
    'domain_verified',
    'claimed',
    'tenant_provisioning',
    'tenant_live',
    'paused',
    'suspended',
    'archived',
] as const;

export type BusinessLifecycleStatus = (typeof BUSINESS_LIFECYCLE_STATUSES)[number];

export type DomainBindingStatus =
    | 'pending_dns'
    | 'verified_dns'
    | 'ssl_issued'
    | 'active'
    | 'inactive'
    | 'error';

export interface SlugPolicyDefinition {
    key: string;
    minLength: number;
    maxLength: number;
    blockNumericOnly: boolean;
    requireLetter: boolean;
    reservedTerms: string[];
    blockedContains: string[];
}

export interface DomainPolicyDefinition {
    key: string;
    allowPlatformSubdomain: boolean;
    allowCustomDomain: boolean;
    requireDnsVerification: boolean;
    requireSsl: boolean;
    autoProvisionSsl: boolean;
}

export interface PublishWorkflowDefinition {
    key: string;
    initialStatus: BusinessLifecycleStatus;
    allowedStatuses: BusinessLifecycleStatus[];
    transitionMap: Record<BusinessLifecycleStatus, BusinessLifecycleStatus[]>;
}

export interface PublishingPolicyBundle {
    slugPolicy: SlugPolicyDefinition;
    domainPolicy: DomainPolicyDefinition;
    workflow: PublishWorkflowDefinition;
}

const DEFAULT_RESERVED_TERMS = [
    'admin',
    'api',
    'app',
    'auth',
    'billing',
    'cdn',
    'dashboard',
    'dns',
    'docs',
    'help',
    'kalp',
    'kalptree',
    'kalpzero',
    'mail',
    'platform',
    'root',
    'settings',
    'support',
    'system',
    'tenant',
    'terms',
    'www',
];

const DEFAULT_BLOCKED_CONTAINS = [
    '--',
    '__',
];

const BUSINESS_LIFECYCLE_TRANSITION_MAP: Record<BusinessLifecycleStatus, BusinessLifecycleStatus[]> = {
    draft_intake: ['identity_validated', 'archived'],
    identity_validated: ['slug_reserved', 'draft_intake', 'archived'],
    slug_reserved: ['free_page_live', 'identity_validated', 'archived'],
    free_page_live: ['domain_pending', 'claimed', 'paused', 'archived'],
    domain_pending: ['domain_verified', 'free_page_live', 'paused', 'archived'],
    domain_verified: ['claimed', 'domain_pending', 'paused', 'archived'],
    claimed: ['tenant_provisioning', 'paused', 'archived'],
    tenant_provisioning: ['tenant_live', 'paused', 'archived'],
    tenant_live: ['paused', 'suspended', 'archived'],
    paused: ['tenant_live', 'free_page_live', 'suspended', 'archived'],
    suspended: ['paused', 'archived'],
    archived: [],
};

export const DEFAULT_PUBLISHING_POLICY: PublishingPolicyBundle = {
    slugPolicy: {
        key: 'default',
        minLength: 3,
        maxLength: 80,
        blockNumericOnly: true,
        requireLetter: true,
        reservedTerms: DEFAULT_RESERVED_TERMS,
        blockedContains: DEFAULT_BLOCKED_CONTAINS,
    },
    domainPolicy: {
        key: 'default',
        allowPlatformSubdomain: true,
        allowCustomDomain: true,
        requireDnsVerification: true,
        requireSsl: true,
        autoProvisionSsl: true,
    },
    workflow: {
        key: 'default',
        initialStatus: 'draft_intake',
        allowedStatuses: [...BUSINESS_LIFECYCLE_STATUSES],
        transitionMap: BUSINESS_LIFECYCLE_TRANSITION_MAP,
    },
};

function normalizeTerm(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function dedupeTerms(values: string[]): string[] {
    return [...new Set(values.map(normalizeTerm).filter(Boolean))];
}

export function normalizePublishingSlug(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

export function isBusinessLifecycleStatus(value: string): value is BusinessLifecycleStatus {
    return BUSINESS_LIFECYCLE_STATUSES.includes(value as BusinessLifecycleStatus);
}

export function normalizeBusinessLifecycleStatus(
    value: unknown,
    fallback: BusinessLifecycleStatus = DEFAULT_PUBLISHING_POLICY.workflow.initialStatus
): BusinessLifecycleStatus {
    if (typeof value === 'string' && isBusinessLifecycleStatus(value)) return value;
    return fallback;
}

export function canTransitionBusinessLifecycle(
    fromStatus: BusinessLifecycleStatus,
    toStatus: BusinessLifecycleStatus
): boolean {
    if (fromStatus === toStatus) return true;
    const allowed = BUSINESS_LIFECYCLE_TRANSITION_MAP[fromStatus] || [];
    return allowed.includes(toStatus);
}

export function resolveLifecycleStatusFromClaimStatus(
    claimStatus: string | null | undefined,
    fallback: BusinessLifecycleStatus = 'free_page_live'
): BusinessLifecycleStatus {
    switch ((claimStatus || '').trim().toLowerCase()) {
        case 'free_unclaimed':
            return 'free_page_live';
        case 'claimed_pending':
            return 'claimed';
        case 'claimed_active':
            return 'tenant_live';
        case 'claimed_inactive':
            return 'suspended';
        default:
            return fallback;
    }
}

export interface SlugValidationResult {
    ok: boolean;
    normalized: string;
    code?: 'empty' | 'too_short' | 'too_long' | 'numeric_only' | 'missing_letter' | 'reserved' | 'blocked_pattern';
    error?: string;
}

export function validatePublishingSlug(input: string, policy: SlugPolicyDefinition): SlugValidationResult {
    const normalized = normalizePublishingSlug(input);
    if (!normalized) {
        return { ok: false, normalized, code: 'empty', error: 'Slug is required.' };
    }
    if (normalized.length < policy.minLength) {
        return {
            ok: false,
            normalized,
            code: 'too_short',
            error: `Slug must be at least ${policy.minLength} characters.`,
        };
    }
    if (normalized.length > policy.maxLength) {
        return {
            ok: false,
            normalized,
            code: 'too_long',
            error: `Slug cannot exceed ${policy.maxLength} characters.`,
        };
    }
    if (policy.blockNumericOnly && /^\d+$/.test(normalized)) {
        return { ok: false, normalized, code: 'numeric_only', error: 'Numeric-only slugs are not allowed.' };
    }
    if (policy.requireLetter && !/[a-z]/.test(normalized)) {
        return { ok: false, normalized, code: 'missing_letter', error: 'Slug must include at least one letter.' };
    }

    const reservedTerms = new Set(dedupeTerms(policy.reservedTerms));
    if (reservedTerms.has(normalized)) {
        return { ok: false, normalized, code: 'reserved', error: `Slug "${normalized}" is reserved.` };
    }

    const blockedTokens = dedupeTerms(policy.blockedContains);
    const blockedToken = blockedTokens.find((token) => token && normalized.includes(token));
    if (blockedToken) {
        return {
            ok: false,
            normalized,
            code: 'blocked_pattern',
            error: `Slug contains blocked pattern "${blockedToken}".`,
        };
    }

    return { ok: true, normalized };
}

export async function loadPublishingPolicyBundle(systemDb?: Db): Promise<PublishingPolicyBundle> {
    const db = systemDb || await getSystemDb();
    const [slugPolicyRaw, domainPolicyRaw, workflowRaw, reservedRaw] = await Promise.all([
        db.collection('slug_policies').findOne({ key: 'default' }),
        db.collection('domain_policies').findOne({ key: 'default' }),
        db.collection('publish_workflow_definitions').findOne({ key: 'default' }),
        db.collection('reserved_terms').find({ active: { $ne: false } }, { projection: { term: 1 } }).toArray(),
    ]);

    const reservedFromCollection = reservedRaw
        .map((entry) => (typeof entry.term === 'string' ? entry.term : ''))
        .filter(Boolean);

    const slugPolicy: SlugPolicyDefinition = {
        ...DEFAULT_PUBLISHING_POLICY.slugPolicy,
        ...(slugPolicyRaw || {}),
        key: 'default',
        minLength: typeof slugPolicyRaw?.minLength === 'number' ? slugPolicyRaw.minLength : DEFAULT_PUBLISHING_POLICY.slugPolicy.minLength,
        maxLength: typeof slugPolicyRaw?.maxLength === 'number' ? slugPolicyRaw.maxLength : DEFAULT_PUBLISHING_POLICY.slugPolicy.maxLength,
        blockNumericOnly: typeof slugPolicyRaw?.blockNumericOnly === 'boolean'
            ? slugPolicyRaw.blockNumericOnly
            : DEFAULT_PUBLISHING_POLICY.slugPolicy.blockNumericOnly,
        requireLetter: typeof slugPolicyRaw?.requireLetter === 'boolean'
            ? slugPolicyRaw.requireLetter
            : DEFAULT_PUBLISHING_POLICY.slugPolicy.requireLetter,
        reservedTerms: dedupeTerms([
            ...DEFAULT_PUBLISHING_POLICY.slugPolicy.reservedTerms,
            ...(Array.isArray(slugPolicyRaw?.reservedTerms) ? slugPolicyRaw.reservedTerms : []),
            ...reservedFromCollection,
        ]),
        blockedContains: dedupeTerms([
            ...DEFAULT_PUBLISHING_POLICY.slugPolicy.blockedContains,
            ...(Array.isArray(slugPolicyRaw?.blockedContains) ? slugPolicyRaw.blockedContains : []),
        ]),
    };

    const domainPolicy: DomainPolicyDefinition = {
        ...DEFAULT_PUBLISHING_POLICY.domainPolicy,
        ...(domainPolicyRaw || {}),
        key: 'default',
        allowPlatformSubdomain: typeof domainPolicyRaw?.allowPlatformSubdomain === 'boolean'
            ? domainPolicyRaw.allowPlatformSubdomain
            : DEFAULT_PUBLISHING_POLICY.domainPolicy.allowPlatformSubdomain,
        allowCustomDomain: typeof domainPolicyRaw?.allowCustomDomain === 'boolean'
            ? domainPolicyRaw.allowCustomDomain
            : DEFAULT_PUBLISHING_POLICY.domainPolicy.allowCustomDomain,
        requireDnsVerification: typeof domainPolicyRaw?.requireDnsVerification === 'boolean'
            ? domainPolicyRaw.requireDnsVerification
            : DEFAULT_PUBLISHING_POLICY.domainPolicy.requireDnsVerification,
        requireSsl: typeof domainPolicyRaw?.requireSsl === 'boolean'
            ? domainPolicyRaw.requireSsl
            : DEFAULT_PUBLISHING_POLICY.domainPolicy.requireSsl,
        autoProvisionSsl: typeof domainPolicyRaw?.autoProvisionSsl === 'boolean'
            ? domainPolicyRaw.autoProvisionSsl
            : DEFAULT_PUBLISHING_POLICY.domainPolicy.autoProvisionSsl,
    };

    const workflowAllowed = Array.isArray(workflowRaw?.allowedStatuses)
        ? workflowRaw.allowedStatuses.filter((value: unknown): value is BusinessLifecycleStatus =>
            typeof value === 'string' && isBusinessLifecycleStatus(value)
        )
        : DEFAULT_PUBLISHING_POLICY.workflow.allowedStatuses;

    const workflow: PublishWorkflowDefinition = {
        ...DEFAULT_PUBLISHING_POLICY.workflow,
        ...(workflowRaw || {}),
        key: 'default',
        initialStatus: normalizeBusinessLifecycleStatus(workflowRaw?.initialStatus, DEFAULT_PUBLISHING_POLICY.workflow.initialStatus),
        allowedStatuses: workflowAllowed.length > 0 ? workflowAllowed : DEFAULT_PUBLISHING_POLICY.workflow.allowedStatuses,
        transitionMap: BUSINESS_LIFECYCLE_TRANSITION_MAP,
    };

    return { slugPolicy, domainPolicy, workflow };
}
