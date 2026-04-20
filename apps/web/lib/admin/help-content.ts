export type AdminHelpRole = 'super_admin' | 'agency_admin' | 'business_admin' | 'member';

export type AdminHelpEntry = {
    key: string;
    title: string;
    summary: string;
    purpose: string;
    whereItReflects: string[];
    dependencies?: string[];
    collections?: string[];
    roles?: string[];
    superAdminNotes?: string[];
};

export const ADMIN_HELP_CONTENT: Record<string, AdminHelpEntry> = {
    business_settings: {
        key: 'business_settings',
        title: 'Business Settings',
        summary: 'Controls the active business identity, public profile, branding, language, and allowed runtime surfaces.',
        purpose: 'This is the main operational settings page for the active business workspace.',
        whereItReflects: [
            'Public business pages and discovery cards',
            'Builder defaults and brand tokens',
            'Business-facing apps, features, add-ons, and publish policies',
        ],
        dependencies: ['Agency plan limits', 'App assignments', 'Active business context'],
        collections: ['kalp_master.tenants', 'tenant brand/profile collections', 'public business projections'],
        roles: ['Super Admin', 'Agency Admin', 'Business Admin'],
        superAdminNotes: [
            'Technical keys remain tenant-scoped even though operator wording says Business.',
            'Business Admin cannot mutate plan-governed app assignments or runtime policy controls.',
        ],
    },
    access_control: {
        key: 'access_control',
        title: 'Access Control',
        summary: 'Shows who can view or change platform, agency, and business surfaces.',
        purpose: 'Explains the effective permission model without exposing raw internals to lower roles.',
        whereItReflects: [
            'Sidebar visibility',
            'Route guards',
            'Mutation controls',
            'Role switching',
        ],
        dependencies: ['Session role', 'Scoped role view', 'Agency plan', 'Enabled apps'],
        collections: ['kalp_system.role_definitions', 'runtime registry snapshot', 'kalp_master.users'],
        roles: ['Super Admin', 'Agency Admin'],
        superAdminNotes: [
            'Role keys remain platform_owner/platform_admin/tenant_owner/tenant_admin for compatibility.',
            'Displayed labels are intentionally Agency Admin and Business Admin.',
        ],
    },
    agency_settings: {
        key: 'agency_settings',
        title: 'Agency Settings',
        summary: 'Controls agency domain behavior, white-label defaults, media library, and plan catalog surfaces.',
        purpose: 'This is the operational control plane for agency-owned business workspaces.',
        whereItReflects: [
            'Agency-branded admin shell',
            'Business subdomain routing',
            'Agency-managed plan visibility',
            'Shared media and terminology packs',
        ],
        dependencies: ['Agency record', 'Domain settings', 'Infra profile', 'Agency ecosystem'],
        collections: ['kalp_master.agencies', 'agency ecosystem definitions', 'agency media library'],
        roles: ['Super Admin', 'Agency Admin'],
        superAdminNotes: [
            'Agency Admin is the visible label for tenant_owner.',
            'Infra profile changes should be explained before apply/rollback actions.',
        ],
    },
    agency_directory: {
        key: 'agency_directory',
        title: 'Agency Directory',
        summary: 'Lists all agencies with plan, domain, infrastructure, usage, and migration status.',
        purpose: 'Gives Super Admin one page to inspect agency health and governance.',
        whereItReflects: [
            'Plan management',
            'Infra migration utilities',
            'Resource observability',
        ],
        dependencies: ['Agency resource summaries', 'Infra assignments', 'Migration jobs'],
        collections: ['kalp_master.agencies', 'kalp_master.tenants', 'audit_events'],
        roles: ['Super Admin'],
        superAdminNotes: [
            'Dry Run previews impact only.',
            'Apply writes new infra assignments.',
            'Rollback restores the last recorded assignment snapshot.',
        ],
    },
    app_access: {
        key: 'app_access',
        title: 'App Access',
        summary: 'Controls which top-level apps are available to the active business.',
        purpose: 'Apps drive sidebar presence, routes, and base operational collections.',
        whereItReflects: [
            'Sidebar composition',
            'Route availability',
            'Feature/add-on eligibility',
        ],
        dependencies: ['Agency plan', 'Enabled app list', 'Business context'],
        collections: ['kalp_master.tenants', 'registry snapshot'],
        roles: ['Super Admin', 'Agency Admin'],
        superAdminNotes: [
            'Stable storage field is enabledModules.',
            'Visible label is Apps.',
        ],
    },
    features_and_addons: {
        key: 'features_and_addons',
        title: 'Features and Add-ons',
        summary: 'Refines behavior inside enabled apps and attaches optional workspaces like builders or exports.',
        purpose: 'Keeps packaging and runtime composition explicit without overloading sidebar navigation.',
        whereItReflects: [
            'Builder availability',
            'Specialized workspaces',
            'Advanced workflow controls',
        ],
        dependencies: ['Enabled apps', 'Agency plan', 'Parent feature dependencies'],
        collections: ['feature_definitions', 'option_definitions', 'plugin_definitions'],
        roles: ['Super Admin', 'Agency Admin'],
        superAdminNotes: [
            'Visible wording is Features, Options, and Add-ons.',
            'Lower roles should not see raw system-flag controls.',
        ],
    },
};

export function getAdminHelpEntry(key: string): AdminHelpEntry | null {
    return ADMIN_HELP_CONTENT[key] || null;
}
