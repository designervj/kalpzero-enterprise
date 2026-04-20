import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { getMasterDb } from '@/lib/db';
import { verifyToken, type JwtPayload } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export const PLATFORM_ROLES = ['platform_owner', 'platform_admin'] as const;
export const TENANT_ADMIN_ROLES = ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'] as const;
export const READ_ONLY_MUTATION_ROLES = ['viewer', 'ai_agent'] as const;

export interface SessionContext {
    payload: JwtPayload;
    activeTenant: string;
}

export function isPlatformRole(role: string): boolean {
    return PLATFORM_ROLES.includes(role as (typeof PLATFORM_ROLES)[number]);
}

export function hasAnyRole(role: string, allowedRoles: readonly string[]): boolean {
    return allowedRoles.includes(role);
}

export function canMutateTenantScope(role: string): boolean {
    return !READ_ONLY_MUTATION_ROLES.includes(role as (typeof READ_ONLY_MUTATION_ROLES)[number]);
}

export function canAccessTenant(session: SessionContext, tenantKey: string): boolean {
    if (isPlatformRole(session.payload.role)) return true;
    return session.payload.tenantKey === tenantKey;
}

/**
 * Resolve the effective tenant key for API handlers and enforce tenant isolation.
 * Returns null when a non-platform actor tries to access a tenant outside session scope.
 */
export function resolveAuthorizedTenantKey(session: SessionContext): string | null {
    const tenantKey = session.activeTenant || session.payload.tenantKey || 'demo';
    if (!tenantKey) return null;
    if (!canAccessTenant(session, tenantKey)) return null;
    return tenantKey;
}

export async function requireTenantAccess(): Promise<
    | { ok: true; session: SessionContext; tenantKey: string }
    | { ok: false; response: NextResponse }
> {
    const session = await getSessionContext();
    if (!session) {
        return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    const tenantKey = resolveAuthorizedTenantKey(session);
    if (!tenantKey) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Forbidden: cross-tenant access denied.' }, { status: 403 }),
        };
    }

    return { ok: true, session, tenantKey };
}

export async function requireTenantMutationAccess(): Promise<
    | { ok: true; session: SessionContext; tenantKey: string }
    | { ok: false; response: NextResponse }
> {
    const access = await requireTenantAccess();
    if (!access.ok) return access;

    if (!canMutateTenantScope(access.session.payload.role)) {
        return {
            ok: false,
            response: NextResponse.json(
                {
                    error: `Read-only role "${access.session.payload.role}" cannot perform mutations in this context.`,
                },
                { status: 403 }
            ),
        };
    }

    return access;
}

export async function getSessionContext(): Promise<SessionContext | null> {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('kalp_session')?.value;
    if (!sessionToken) return null;

    const payload = await verifyToken(sessionToken);
    if (!payload) return null;

    return {
        payload,
        activeTenant: cookieStore.get('kalp_active_tenant')?.value || payload.tenantKey || 'demo',
    };
}

export async function getTenantByKey(key: string): Promise<{ key: string; subscriptionLevel?: string; name?: string; agencyId?: string } | null> {
    const masterDb = await getMasterDb();
    const tenant = await masterDb.collection('tenants').findOne(
        { key },
        { projection: { key: 1, subscriptionLevel: 1, name: 1, agencyId: 1 } }
    );
    if (!tenant) return null;
    return {
        key: tenant.key as string,
        subscriptionLevel: (tenant.subscriptionLevel as string | undefined) || undefined,
        name: (tenant.name as string | undefined) || undefined,
        agencyId: tenant.agencyId ? (tenant.agencyId as ObjectId).toString() : undefined,
    };
}

export async function getUserById(userId: string): Promise<{ _id: string; role?: string; tenantKey?: string; email?: string; agencyId?: string } | null> {
    if (!ObjectId.isValid(userId)) return null;
    const masterDb = await getMasterDb();
    const user = await masterDb.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { _id: 1, role: 1, tenantKey: 1, email: 1, agencyId: 1 } }
    );
    if (!user) return null;
    return {
        _id: user._id.toString(),
        role: user.role as string | undefined,
        tenantKey: user.tenantKey as string | undefined,
        email: user.email as string | undefined,
        agencyId: user.agencyId ? (user.agencyId as ObjectId).toString() : undefined,
    };
}
