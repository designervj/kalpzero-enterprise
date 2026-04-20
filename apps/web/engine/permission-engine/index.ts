import { AccessCheck, AccessContext } from './types';
import { RegistrySnapshot } from '@core/contracts/registry';

/**
 * Evaluates whether a user has permission to perform an action based on context and registry rules.
 * 
 * Guard chain:
 * 1. Subscription Tier Check — enforces minimum plan (free < pro < enterprise)
 * 2. Feature Flag Check — requires specific flag to be enabled
 * 3. Module Enablement Check — ensures the module is activated for this tenant/business
 * 4. Registry RBAC Check — verifies the user's role is allowed by the permission spec
 */
export class PermissionEngine {

    private subTiers: Record<string, number> = {
        'free': 0,
        'starter': 0,
        'pro': 1,
        'enterprise': 2
    };

    /**
     * Module-level permission definitions (module → permissions[])
     */
    private modulePermissions: Record<string, { id: string; defaultAllowedRoles: string[] }[]> = {
        website: [{ id: 'perm.website.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.website.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        branding: [{ id: 'perm.branding.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.branding.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        products: [{ id: 'perm.products.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.products.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        ecommerce: [{ id: 'perm.ecommerce.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.ecommerce.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        bookings: [{ id: 'perm.bookings.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.bookings.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        marketing: [{ id: 'perm.marketing.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.marketing.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        blog: [{ id: 'perm.blog.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.blog.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        portfolio: [{ id: 'perm.portfolio.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.portfolio.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        media: [{ id: 'perm.media.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.media.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        invoicing: [{ id: 'perm.invoicing.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.invoicing.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        hotel_management: [{ id: 'perm.hotel_management.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.hotel_management.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
        tour_management: [{ id: 'perm.tour_management.read', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff'] }, { id: 'perm.tour_management.write', defaultAllowedRoles: ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] }],
    };

    /**
     * The core `can` method — 4-guard chain
     */
    public can(snapshot: RegistrySnapshot, ctx: AccessContext, check: AccessCheck): boolean {

        // 1. Subscription Check
        if (check.requiredSubscriptionMin) {
            const userRank = this.subTiers[ctx.subscriptionLevel] ?? -1;
            const reqRank = this.subTiers[check.requiredSubscriptionMin] ?? 999;
            if (userRank < reqRank) return false;
        }

        // 2. Feature Flag Check
        if (check.requiredFlag && !ctx.flags[check.requiredFlag]) {
            return false;
        }

        // 3. Module Enablement Check (NEW)
        if (check.requiredModule) {
            if (!ctx.enabledModules || !ctx.enabledModules.includes(check.requiredModule)) {
                return false;
            }
        }

        // 4. Registry RBAC Check — first try snapshot, then fall back to built-in modulePermissions
        const permDef = snapshot.permissions[check.permissionId];
        if (permDef) {
            const moduleScope = snapshot.modules[permDef.moduleId];
            const spec = moduleScope?.permissions?.find(p => p.id === check.permissionId);
            if (spec?.defaultAllowedRoles) {
                if (!spec.defaultAllowedRoles.some(role => ctx.roleIds.includes(role))) {
                    return false;
                }
            }
        } else {
            // Fallback: check the built-in module permissions
            const moduleName = check.requiredModule || check.permissionId.split('.')[1];
            const modulePerms = this.modulePermissions[moduleName];
            if (modulePerms) {
                const spec = modulePerms.find(p => p.id === check.permissionId);
                if (spec) {
                    if (!spec.defaultAllowedRoles.some(role => ctx.roleIds.includes(role))) {
                        return false;
                    }
                }
            }
            // If no spec found at all, allow by default (open permissions)
        }

        return true;
    }

    /**
     * Get all permissions for a given module
     */
    public getModulePermissions(moduleName: string) {
        return this.modulePermissions[moduleName] || [];
    }

    /**
     * Get all registered module names
     */
    public getRegisteredModules(): string[] {
        return Object.keys(this.modulePermissions);
    }

    /**
     * Check if a user can access a specific module (convenience method)
     */
    public canAccessModule(ctx: AccessContext, moduleName: string): boolean {
        if (!ctx.enabledModules || !ctx.enabledModules.includes(moduleName)) {
            return false;
        }
        return true;
    }
}
