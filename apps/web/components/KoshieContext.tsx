'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type KoshieContextType = {
    activeContext: 'dashboard' | 'builder' | 'settings' | 'commerce' | 'content';
    setActiveContext: (ctx: 'dashboard' | 'builder' | 'settings' | 'commerce' | 'content') => void;
    activeElement: { type: string; id: string; content?: string; label?: string } | null;
    setActiveElement: (el: { type: string; id: string; content?: string; label?: string } | null) => void;
    triggerGrowthNudge: (message: string) => void;
    currentNudge: string | null;
    clearNudge: () => void;
};

const KoshieContext = createContext<KoshieContextType | undefined>(undefined);

export function KoshieProvider({ children }: { children: ReactNode }) {
    const [activeContext, setActiveContext] = useState<'dashboard' | 'builder' | 'settings' | 'commerce' | 'content'>('dashboard');
    const [activeElement, setActiveElement] = useState<{ type: string; id: string; content?: string; label?: string } | null>(null);
    const [currentNudge, setCurrentNudge] = useState<string | null>(null);

    const triggerGrowthNudge = (message: string) => {
        setCurrentNudge(message);
    };

    const clearNudge = () => {
        setCurrentNudge(null);
    };

    return (
        <KoshieContext.Provider value={{
            activeContext, setActiveContext,
            activeElement, setActiveElement,
            triggerGrowthNudge, currentNudge, clearNudge
        }}>
            {children}
        </KoshieContext.Provider>
    );
}

export function useKoshie() {
    const context = useContext(KoshieContext);
    if (context === undefined) {
        throw new Error('useKoshie must be used within a KoshieProvider');
    }
    return context;
}
