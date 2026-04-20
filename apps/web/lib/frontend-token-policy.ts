export type TokenFamily = 'colors' | 'typography' | 'appearance';

export type FrontendTokenPolicy = {
    source: 'default' | 'plan' | 'tenant';
    planKey: string;
    lockFamilies: TokenFamily[];
    requiredDefaults: TokenFamily[];
    reasons: Partial<Record<TokenFamily, string>>;
};

const TOKEN_FAMILIES: TokenFamily[] = ['colors', 'typography', 'appearance'];

type TokenPolicyInput = {
    lockFamilies?: unknown;
    requiredDefaults?: unknown;
    reasons?: unknown;
};

const PLAN_LOCK_FALLBACKS: Record<string, TokenPolicyInput> = {
    basic: {
        lockFamilies: ['typography', 'appearance'],
        requiredDefaults: ['typography'],
        reasons: {
            typography: 'Typography is locked by Basic plan.',
            appearance: 'Appearance controls are locked by Basic plan.',
        },
    },
    starter: {
        lockFamilies: ['typography', 'appearance'],
        requiredDefaults: ['typography'],
        reasons: {
            typography: 'Typography is locked by Starter plan.',
            appearance: 'Appearance controls are locked by Starter plan.',
        },
    },
    free: {
        lockFamilies: ['typography', 'appearance'],
        requiredDefaults: ['typography'],
        reasons: {
            typography: 'Typography is locked by Free plan.',
            appearance: 'Appearance controls are locked by Free plan.',
        },
    },
    pro: {
        lockFamilies: ['appearance'],
        requiredDefaults: [],
        reasons: {
            appearance: 'Advanced appearance controls are locked by Pro plan.',
        },
    },
    growth: {
        lockFamilies: ['appearance'],
        requiredDefaults: [],
        reasons: {
            appearance: 'Advanced appearance controls are locked by Growth plan.',
        },
    },
    enterprise: {
        lockFamilies: [],
        requiredDefaults: [],
        reasons: {},
    },
    scale: {
        lockFamilies: [],
        requiredDefaults: [],
        reasons: {},
    },
};

function normalizeToken(value: string): string {
    return value
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function toFamilyArray(value: unknown): TokenFamily[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .filter((item): item is string => typeof item === 'string')
                .map((item) => normalizeToken(item))
                .filter((item): item is TokenFamily => TOKEN_FAMILIES.includes(item as TokenFamily))
        )
    );
}

function toReasonsRecord(value: unknown): Partial<Record<TokenFamily, string>> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, raw]) => [normalizeToken(key), raw] as const)
        .filter(([key, raw]) => TOKEN_FAMILIES.includes(key as TokenFamily) && typeof raw === 'string')
        .map(([key, raw]) => [key as TokenFamily, String(raw).trim()] as const)
        .filter(([, raw]) => raw.length > 0);
    return Object.fromEntries(entries) as Partial<Record<TokenFamily, string>>;
}

function normalizePolicyInput(value: unknown): TokenPolicyInput {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const raw = value as Record<string, unknown>;
    return {
        lockFamilies: raw.lockFamilies,
        requiredDefaults: raw.requiredDefaults,
        reasons: raw.reasons,
    };
}

function resolvePlanPolicy(
    planKeyInput: string,
    planPolicyInput: unknown
): { lockFamilies: TokenFamily[]; requiredDefaults: TokenFamily[]; reasons: Partial<Record<TokenFamily, string>> } {
    const planKey = normalizeToken(planKeyInput);
    const explicit = normalizePolicyInput(planPolicyInput);
    const fallback = PLAN_LOCK_FALLBACKS[planKey] || {};

    const lockFamilies = toFamilyArray(explicit.lockFamilies).length > 0
        ? toFamilyArray(explicit.lockFamilies)
        : toFamilyArray(fallback.lockFamilies);
    const requiredDefaults = toFamilyArray(explicit.requiredDefaults).length > 0
        ? toFamilyArray(explicit.requiredDefaults)
        : toFamilyArray(fallback.requiredDefaults);
    const reasons = {
        ...toReasonsRecord(fallback.reasons),
        ...toReasonsRecord(explicit.reasons),
    };
    return { lockFamilies, requiredDefaults, reasons };
}

export function resolveFrontendTokenPolicy(input: {
    frontendProfile?: unknown;
    agencyPlan?: unknown;
    subscriptionLevel?: unknown;
}): FrontendTokenPolicy {
    const rawFrontend = input.frontendProfile && typeof input.frontendProfile === 'object' && !Array.isArray(input.frontendProfile)
        ? input.frontendProfile as Record<string, unknown>
        : {};
    const rawPlan = input.agencyPlan && typeof input.agencyPlan === 'object' && !Array.isArray(input.agencyPlan)
        ? input.agencyPlan as Record<string, unknown>
        : {};

    const planKey = normalizeToken(
        typeof rawPlan.key === 'string'
            ? rawPlan.key
            : (typeof input.subscriptionLevel === 'string' ? input.subscriptionLevel : '')
    );

    const planResolved = resolvePlanPolicy(planKey, rawPlan.tokenPolicy);

    const tenantPolicyInput = normalizePolicyInput(rawFrontend.tokenPolicy);
    const tenantLockFamilies = toFamilyArray(tenantPolicyInput.lockFamilies);
    const tenantRequiredDefaults = toFamilyArray(tenantPolicyInput.requiredDefaults);
    const tenantReasons = toReasonsRecord(tenantPolicyInput.reasons);

    const lockFamilies = Array.from(new Set([...planResolved.lockFamilies, ...tenantLockFamilies]));
    const requiredDefaults = Array.from(new Set([...planResolved.requiredDefaults, ...tenantRequiredDefaults]));
    const reasons = {
        ...planResolved.reasons,
        ...tenantReasons,
    };

    const source: FrontendTokenPolicy['source'] = lockFamilies.length > 0
        ? (planResolved.lockFamilies.length > 0 ? 'plan' : (tenantLockFamilies.length > 0 ? 'tenant' : 'default'))
        : (tenantLockFamilies.length > 0 ? 'tenant' : 'default');

    return {
        source,
        planKey,
        lockFamilies,
        requiredDefaults,
        reasons,
    };
}
