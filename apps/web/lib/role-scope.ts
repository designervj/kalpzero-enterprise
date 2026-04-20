export const ROLE_PROFILES = [
    'platform_owner',
    'platform_admin',
    'tenant_owner',
    'tenant_admin',
    'staff',
    'ai_agent',
    'viewer',
] as const;

export type RoleProfileKey = (typeof ROLE_PROFILES)[number];

export interface RoleProfileMeta {
    label: string;
    rank: number;
    bodhHint: string;
}

const DEFAULT_ROLE: RoleProfileKey = 'viewer';

export const ROLE_PROFILE_META: Record<RoleProfileKey, RoleProfileMeta> = {
    platform_owner: {
        label: 'Super Admin',
        rank: 10,
        bodhHint: 'Full platform governance across agencies, businesses, and system contracts.',
    },
    platform_admin: {
        label: 'Platform Admin',
        rank: 8,
        bodhHint: 'Platform operations and system controls without ownership-level actions.',
    },
    tenant_owner: {
        label: 'Agency Admin',
        rank: 7,
        bodhHint: 'Agency-level control of assigned businesses, plans, and policy boundaries.',
    },
    tenant_admin: {
        label: 'Business Admin',
        rank: 5,
        bodhHint: 'Operational control inside one business including content, catalog, and business settings.',
    },
    staff: {
        label: 'Staff',
        rank: 2,
        bodhHint: 'Day-to-day workspace operations with role-limited mutations.',
    },
    ai_agent: {
        label: 'AI Agent',
        rank: 1,
        bodhHint: 'Automation/service principal with strict tenant-safe, read-first bounded execution.',
    },
    viewer: {
        label: 'Viewer',
        rank: 0,
        bodhHint: 'Read-only workspace visibility.',
    },
};

const ROLE_SWITCH_CANDIDATES: Record<RoleProfileKey, RoleProfileKey[]> = {
    platform_owner: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'],
    platform_admin: ['platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'],
    tenant_owner: ['tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'],
    tenant_admin: ['tenant_admin', 'staff', 'ai_agent', 'viewer'],
    staff: ['staff', 'ai_agent', 'viewer'],
    ai_agent: ['ai_agent', 'viewer'],
    viewer: ['viewer'],
};

const READ_ONLY_UI_ROLES: RoleProfileKey[] = ['ai_agent', 'viewer'];

interface RouteScopeRule {
    pathPrefix: string;
    allowedRoles: RoleProfileKey[];
}

const ADMIN_ROUTE_SCOPE_RULES: RouteScopeRule[] = [
    { pathPrefix: '/onboarding', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner'] },
    { pathPrefix: '/admin/registry', allowedRoles: ['platform_owner', 'platform_admin'] },
    { pathPrefix: '/tenants', allowedRoles: ['platform_owner', 'platform_admin'] },
    { pathPrefix: '/admin', allowedRoles: ['platform_owner'] },
    { pathPrefix: '/agency/resources', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner'] },
    { pathPrefix: '/agency/settings', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner'] },
    { pathPrefix: '/tenant/resources', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'] },
    { pathPrefix: '/settings/export', allowedRoles: ['platform_owner', 'platform_admin'] },
    { pathPrefix: '/users', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner'] },
    { pathPrefix: '/settings/platform', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner'] },
    { pathPrefix: '/settings/tenant', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
    { pathPrefix: '/settings/admin-theme', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
    { pathPrefix: '/settings/admin-workspace', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
    { pathPrefix: '/settings/user', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'] },
    { pathPrefix: '/kalpbodh', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'] },
    { pathPrefix: '/terminal', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner'] },
    { pathPrefix: '/discover/qa', allowedRoles: ['platform_owner', 'platform_admin'] },
    { pathPrefix: '/catalog-builder', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
    { pathPrefix: '/proposal-builder', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
    { pathPrefix: '/resume-builder', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
    { pathPrefix: '/portfolio-profile-builder', allowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] },
];

export function isRoleProfile(value: string): value is RoleProfileKey {
    return ROLE_PROFILES.includes(value as RoleProfileKey);
}

export function normalizeRoleProfile(value: string | null | undefined, fallback: RoleProfileKey = DEFAULT_ROLE): RoleProfileKey {
    if (value && isRoleProfile(value)) return value;
    return fallback;
}

export function getRoleMeta(role: string): RoleProfileMeta {
    return ROLE_PROFILE_META[normalizeRoleProfile(role)];
}

export function resolveRoleSwitchCandidates(sessionRole: string): RoleProfileKey[] {
    const normalizedSessionRole = normalizeRoleProfile(sessionRole);
    return ROLE_SWITCH_CANDIDATES[normalizedSessionRole] || [normalizedSessionRole];
}

export function resolveRoleProfileForView(sessionRole: string, requestedRole: string | null | undefined): RoleProfileKey {
    const normalizedSessionRole = normalizeRoleProfile(sessionRole);
    const allowed = resolveRoleSwitchCandidates(normalizedSessionRole);
    const normalizedRequested = normalizeRoleProfile(requestedRole, normalizedSessionRole);
    return allowed.includes(normalizedRequested) ? normalizedRequested : normalizedSessionRole;
}

export function isScopedRoleView(sessionRole: string, activeRole: string): boolean {
    return normalizeRoleProfile(sessionRole) !== normalizeRoleProfile(activeRole);
}

export function canRoleAccessAdminPath(role: string, pathname: string): boolean {
        console.log("normalizedPath.  role",role)
    const normalizedRole = normalizeRoleProfile(role);
    const normalizedPath = pathname.trim().toLowerCase();

    if (!normalizedPath.startsWith('/')) return true;

    const matchedRule = [...ADMIN_ROUTE_SCOPE_RULES]
        .sort((a, b) => b.pathPrefix.length - a.pathPrefix.length)
        .find(rule => normalizedPath === rule.pathPrefix || normalizedPath.startsWith(`${rule.pathPrefix}/`));

    if (!matchedRule) return true;
    return matchedRule.allowedRoles.includes(normalizedRole);
}

export function canRoleMutateUi(role: string): boolean {
    const normalizedRole = normalizeRoleProfile(role);
    return !READ_ONLY_UI_ROLES.includes(normalizedRole);
}
