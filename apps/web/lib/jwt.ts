import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { JWT_SECRET_VALUE } from '@/lib/server-env';

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

export interface JwtPayload extends JWTPayload {
    userId: string;
    email: string;
    role: string;
    tenantKey: string;
    subscriptionLevel: string;
    agencyId?: string;
}

export async function signToken(payload: JwtPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as unknown as JwtPayload;
    } catch {
        return null;
    }
}
