function readPublicBoolean(value: string | undefined): boolean {
    return typeof value === 'string' && value.trim().toLowerCase() === 'true';
}

export const PUBLIC_ALLOW_SELF_REGISTRATION = readPublicBoolean(
    process.env.NEXT_PUBLIC_KALP_ALLOW_SELF_REGISTRATION
);
