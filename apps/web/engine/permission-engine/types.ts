export interface AccessContext {
    tenantId: string;
    userId: string;
    roleIds: string[];         // e.g., ["staff", "tenant_admin"]
    subscriptionLevel: string; // e.g., "free", "pro", "enterprise"
    flags: Record<string, boolean>; // e.g., { "beta_feature": true }
    enabledModules: string[];  // e.g., ["website", "ecommerce", "bookings"]
    businessTemplate?: string; // e.g., "Hotel Room Booking"
}

export interface AccessCheck {
    permissionId: string;           // E.g., 'perm.portfolio.read'
    requiredSubscriptionMin?: string; // Optional: Enforces minimum plan for this action
    requiredFlag?: string;            // Optional: Action requires a specific flag
    requiredModule?: string;          // Optional: Module must be enabled for this tenant
    resource?: {
        type: string;
        id?: string;
    };
}
