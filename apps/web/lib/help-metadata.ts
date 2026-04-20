export const HELP_METADATA_STORE = {
    business_settings: {
        title: "Business Settings",
        summary: "Manage profile, brand assets, and platform identity.",
        purpose: "Provides public details and core application references.",
        whereItReflects: "Used across storefront, apps, and emails.",
        dependencies: "Requires an active billing plan and onboarding initialization.",
        collections: ["tenants"],
        roles: ["tenant_admin", "tenant_owner", "platform_admin"],
        superAdminNotes: "Watch out for 'enabledModules' overrides which take precedence over global plan limits. 'frontendProfile' governs template mappings."
    },
    system_registry: {
        title: "System Registry",
        summary: "The backbone of platform governance.",
        purpose: "Manages Canonical DB definitions, plugin metadata, and KalpBodh agents.",
        whereItReflects: "Global DB structure syncs, multi-tenant deployment rules.",
        dependencies: "Requires kalpbodh and core source code modules.",
        collections: ["kalp_system_registries"],
        roles: ["platform_owner", "platform_admin"],
        superAdminNotes: "Changes here bypass active cache layers. Always invoke the discovery sync manually after saving."
    },
    platform_settings: {
        title: "Access Control",
        summary: "Manage platform access and token lifecycles.",
        purpose: "Governs platform-level API limits and default tenant permissions.",
        whereItReflects: "All tenant auth calls and external incoming API requests.",
        dependencies: "Valid agency and super-admin session token required.",
        collections: ["api_tokens", "role_policies"],
        roles: ["platform_owner", "platform_admin", "tenant_owner"],
        superAdminNotes: "Revoking API keys here kills live external integrations immediately. Rotate slowly."
    },
    business_directory: {
        title: "Business Directory",
        summary: "The platform's list of all managed entities.",
        purpose: "Provides an overview of identity health, plan usage, and status.",
        whereItReflects: "Admin dashboards and cross-tenant billing pipelines.",
        dependencies: "None",
        collections: ["tenants"],
        roles: ["platform_owner", "platform_admin"],
        superAdminNotes: "The 'infrastructureProfile' array manages which cluster shard physically hosts this account's runtime databases."
    },
    agency_settings: {
        title: "Agency Settings",
        summary: "Configure agency-level domains, ecosystem nomenclature, and plan catalogs.",
        purpose: "Allows Agencies to white-label the Control Center and govern the plans offered to their underlying Businesses.",
        whereItReflects: "Tenant URLs (if tenant subdomain is enabled), Sidebar nomenclature, and Tenant Onboarding Plan lists.",
        dependencies: "KalpBodh Agency Ecosystem cluster & Domain routing proxies must be active.",
        collections: ["agencies", "agency_ecosystems"],
        roles: ["platform_owner", "tenant_owner"],
        superAdminNotes: "Watch out for SSL termination issues if the custom domain proxy is misconfigured. Ensure DNS maps to your Ingress controller."
    },
    user_preferences: {
        title: "User Preferences",
        summary: "Your personal session and display settings logic.",
        purpose: "Manage your individual user profile, display language, UI theme, and session details across all KalpZero contexts.",
        whereItReflects: "Only your active dashboard session.",
        dependencies: "Requires active user session token.",
        collections: ["profiles", "users"],
        roles: ["platform_owner", "platform_admin", "tenant_owner", "tenant_admin", "staff", "viewer"],
        superAdminNotes: "Session token hijacking safeguards. Updating language here overrides the active Tenant default language for this session only."
    }
} as const;

export type HelpMetadataKey = keyof typeof HELP_METADATA_STORE;
