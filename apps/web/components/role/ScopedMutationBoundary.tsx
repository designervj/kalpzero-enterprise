'use client';

import type { ReactNode } from 'react';

interface ScopedReadOnlyNoticeProps {
    visible: boolean;
    message: string;
}

interface ScopedMutationActionProps {
    canMutate: boolean;
    children: ReactNode;
    fallback?: ReactNode;
}

export function ScopedReadOnlyNotice({ visible, message }: ScopedReadOnlyNoticeProps) {
    if (!visible) return null;
    return (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl p-4 text-sm">
            {message}
        </div>
    );
}

export function ScopedMutationAction({ canMutate, children, fallback = null }: ScopedMutationActionProps) {
    if (!canMutate) return <>{fallback}</>;
    return <>{children}</>;
}
