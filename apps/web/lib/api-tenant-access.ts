import { NextResponse } from 'next/server';
import { canAccessTenant, getSessionContext, type SessionContext } from '@/lib/api-auth';

export type TenantAccessResult =
    | { ok: true; session: SessionContext; tenantKey: string }
    | { ok: false; response: NextResponse };

interface RequireTenantAccessOptions {
    allowQueryTenant?: boolean;
}

function normalizeTenant(value: string | null | undefined): string {
    return typeof value === 'string' ? value.trim() : '';
}

export async function requireTenantAccess(
    req: Request,
    options: RequireTenantAccessOptions = {}
): Promise<TenantAccessResult> {
    const session = await getSessionContext();
    if (!session) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        };
    }

    const activeTenant = normalizeTenant(session.activeTenant) || normalizeTenant(session.payload.tenantKey) || 'demo';
    let tenantKey = activeTenant;

    if (options.allowQueryTenant) {
        const queryTenant = normalizeTenant(new URL(req.url).searchParams.get('tenant'));
        if (queryTenant) tenantKey = queryTenant;
    }

    if (!canAccessTenant(session, tenantKey)) {
        return {
            ok: false,
            response: NextResponse.json({ error: 'Forbidden: cross-tenant access denied.' }, { status: 403 }),
        };
    }

    return { ok: true, session, tenantKey };
}
