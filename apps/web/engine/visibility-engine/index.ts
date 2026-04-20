import { VisibilityContext, VisibilityMeta } from './types';

/**
 * Determines whether a record or field should be visibly rendered to the user.
 * Independent of "permission to act," this controls "permission to see."
 */
export class VisibilityEngine {

    private subTiers: Record<string, number> = {
        'free': 0,
        'pro': 1,
        'enterprise': 2
    };

    public isVisible(meta: VisibilityMeta, ctx: VisibilityContext): boolean {

        // 1. Publish State check
        if (meta.publishState === 'draft') {
            // Only staff/admin can see drafts
            if (!ctx.roleRank || ctx.roleRank < 1) return false;
        } else if (meta.publishState === 'archived') {
            return false; // Nobody sees archived normally via standard lists
        }

        // 2. Subscription minimum
        if (meta.subscriptionMin) {
            const userRank = this.subTiers[ctx.subscriptionLevel || 'free'] ?? -1;
            const reqRank = this.subTiers[meta.subscriptionMin] ?? 999;
            if (userRank < reqRank) return false;
        }

        // 3. Scope rules
        if (meta.scope === 'public') {
            return true; // Visible to everyone if it passes sub/publish checks above
        }

        // tenant scope & onwards requires auth
        if (!ctx.userId || !ctx.tenantId) {
            return false;
        }

        if (meta.scope === 'tenant') {
            return true; // Anyone in the tenant can see
        }

        if (meta.scope === 'role') {
            // Guarded by roles:
            // A) Minimum rank
            if (meta.roleMin !== undefined) {
                if ((ctx.roleRank || 0) < meta.roleMin) return false;
            }
            // B) Specific role match
            if (meta.allowedRoleIds && meta.allowedRoleIds.length > 0) {
                const hasMatch = meta.allowedRoleIds.some(r => ctx.roleIds?.includes(r));
                if (!hasMatch) return false;
            }
            return true;
        }

        if (meta.scope === 'user') {
            // Explicitly for a set of users
            if (meta.allowedUserIds && meta.allowedUserIds.includes(ctx.userId)) {
                return true;
            }
            return false;
        }

        return false; // Fallback deny
    }
}
