'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext<{ value: string; setValue: (v: string) => void }>({ value: '', setValue: () => {} });

export function Tabs({ defaultValue, children, className }: { defaultValue: string; children: React.ReactNode; className?: string }) {
    const [value, setValue] = useState(defaultValue);
    return (
        <TabsContext.Provider value={{ value, setValue }}>
            <div className={cn("flex flex-col gap-6", className)}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            "inline-flex items-center justify-start rounded-xl bg-slate-900/40 backdrop-blur-md border border-slate-800/50 p-1.5 gap-1",
            className
        )}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value: triggerValue, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const { value, setValue } = useContext(TabsContext);
    const isActive = value === triggerValue;
    return (
        <button
            type="button"
            onClick={() => setValue(triggerValue)}
            className={cn(
                "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2.5 text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
                isActive 
                    ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-[1.02] z-10" 
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40",
                className
            )}
        >
            {children}
        </button>
    );
}

export function TabsContent({ value: contentValue, children, className }: { value: string; children: React.ReactNode; className?: string }) {
    const { value } = useContext(TabsContext);
    if (value !== contentValue) return null;
    return (
        <div className={cn(
            "outline-none animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out", 
            className
        )}>
            {children}
        </div>
    );
}
