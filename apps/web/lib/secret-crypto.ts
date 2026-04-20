import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { SECRET_ENCRYPTION_KEY_SOURCE } from '@/lib/server-env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getEncryptionKey(): Buffer {
    return createHash('sha256').update(SECRET_ENCRYPTION_KEY_SOURCE).digest();
}

function b64urlEncode(value: Buffer): string {
    return value.toString('base64url');
}

function b64urlDecode(value: string): Buffer {
    return Buffer.from(value, 'base64url');
}

export function encryptSecret(plainText: string): string {
    const value = typeof plainText === 'string' ? plainText.trim() : '';
    if (!value) return '';

    const iv = randomBytes(IV_LENGTH);
    const key = getEncryptionKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [b64urlEncode(iv), b64urlEncode(tag), b64urlEncode(encrypted)].join('.');
}

export function decryptSecret(cipherText: string): string | null {
    const value = typeof cipherText === 'string' ? cipherText.trim() : '';
    if (!value) return null;

    const parts = value.split('.');
    if (parts.length !== 3) {
        // Legacy/plaintext fallback for backward compatibility.
        return value;
    }

    try {
        const [ivPart, tagPart, payloadPart] = parts;
        const iv = b64urlDecode(ivPart);
        const tag = b64urlDecode(tagPart);
        const encrypted = b64urlDecode(payloadPart);
        const key = getEncryptionKey();
        const decipher = createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(tag);
        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return decrypted.toString('utf8');
    } catch {
        return null;
    }
}

export function redactSecret(value: string | null | undefined): string {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.length <= 6) return '***';
    return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
}
