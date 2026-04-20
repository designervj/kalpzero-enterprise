export const ACCOUNT_TYPES = ['business', 'personal_portfolio'] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const PROVISIONING_MODES = ['full_tenant', 'lite_profile'] as const;
export type ProvisioningMode = (typeof PROVISIONING_MODES)[number];

export function normalizeAccountType(value: unknown, fallback: AccountType = 'business'): AccountType {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'personal_portfolio') return 'personal_portfolio';
    if (normalized === 'business') return 'business';
    return fallback;
}

export function defaultProvisioningModeForAccountType(accountType: AccountType): ProvisioningMode {
    return accountType === 'personal_portfolio' ? 'lite_profile' : 'full_tenant';
}

export function normalizeProvisioningMode(
    value: unknown,
    fallback: ProvisioningMode = 'full_tenant'
): ProvisioningMode {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'lite_profile') return 'lite_profile';
    if (normalized === 'full_tenant') return 'full_tenant';
    return fallback;
}

export function resolveAccountProvisioning(input: {
    accountType?: unknown;
    provisioningMode?: unknown;
    fallbackAccountType?: AccountType;
    fallbackProvisioningMode?: ProvisioningMode;
}): {
    accountType: AccountType;
    provisioningMode: ProvisioningMode;
} {
    const fallbackAccountType = input.fallbackAccountType || 'business';
    const accountType = normalizeAccountType(input.accountType, fallbackAccountType);
    const defaultProvisioning = defaultProvisioningModeForAccountType(accountType);
    const fallbackProvisioningMode = input.fallbackProvisioningMode || defaultProvisioning;
    const provisioningMode = normalizeProvisioningMode(input.provisioningMode, fallbackProvisioningMode);
    return { accountType, provisioningMode };
}

export function hasExtendedAnalytics(provisioningMode: unknown): boolean {
    return normalizeProvisioningMode(provisioningMode, 'full_tenant') === 'full_tenant';
}
