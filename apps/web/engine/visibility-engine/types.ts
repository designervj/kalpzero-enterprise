export interface VisibilityMeta {
    scope: 'public' | 'tenant' | 'role' | 'user';

    // Restrictions
    roleMin?: number;                   // Simple int rank representing admin level 
    allowedRoleIds?: string[];          // Restricted to specific roles
    allowedUserIds?: string[];          // Restricted to specific users
    subscriptionMin?: string;           // Hidden if sub tier is too low
    publishState?: 'draft' | 'published' | 'archived'; // Document state
}

export interface VisibilityContext {
    tenantId: string;
    userId?: string;              // Optional for public scope
    roleIds?: string[];           // Optional for public scope
    roleRank?: number;            // E.g., staff=1, admin=5, owner=10
    subscriptionLevel?: string;   // E.g., 'free', 'pro'
}
