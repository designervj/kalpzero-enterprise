'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, GripVertical, Loader2, Sparkles, X, Zap } from 'lucide-react';
import { useKoshie } from './KoshieContext';

interface KoshieProps {
    initialOpen?: boolean;
}

const SESSION_POSITION_KEY = 'kalp_koshie_position_v1';
const EDGE_GAP = 12;

type Position = { x: number; y: number };

function getDefaultPosition(): Position {
    if (typeof window === 'undefined') return { x: 20, y: 20 };
    return {
        x: Math.max(EDGE_GAP, window.innerWidth - 84),
        y: Math.max(EDGE_GAP, window.innerHeight - 96),
    };
}

function clampPosition(position: Position, width: number, height: number): Position {
    if (typeof window === 'undefined') return position;
    const maxX = Math.max(EDGE_GAP, window.innerWidth - width - EDGE_GAP);
    const maxY = Math.max(EDGE_GAP, window.innerHeight - height - EDGE_GAP);
    return {
        x: Math.min(Math.max(position.x, EDGE_GAP), maxX),
        y: Math.min(Math.max(position.y, EDGE_GAP), maxY),
    };
}

export function Koshie({ initialOpen = false }: KoshieProps) {
    const { activeContext, activeElement, currentNudge, clearNudge } = useKoshie();
    const [isOpen, setIsOpen] = useState(initialOpen);
    const [isThinking, setIsThinking] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 20, y: 20 });
    const positionRef = useRef(position);

    const rootRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({
        pointerId: -1,
        startPointerX: 0,
        startPointerY: 0,
        startX: 0,
        startY: 0,
        moved: false,
    });

    useEffect(() => {
        positionRef.current = position;
    }, [position]);

    const persistPosition = useCallback((nextPosition: Position) => {
        try {
            sessionStorage.setItem(SESSION_POSITION_KEY, JSON.stringify(nextPosition));
        } catch {
            // Ignore browser storage failures.
        }
    }, []);

    const ensureWithinViewport = useCallback(() => {
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosition((prev) => clampPosition(prev, rect.width, rect.height));
    }, []);

    const fetchNudge = useCallback(async () => {
        if (currentNudge) return;
        setIsThinking(true);
        try {
            const res = await fetch('/api/kalpkosh/koshie', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    context: activeContext,
                    elementLabel: activeElement?.label || activeElement?.type,
                }),
            });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (data.success && data.nudge) {
                setMessage(data.nudge);
                setIsOpen(true);
            }
        } catch (err) {
            console.error('[KOSHIE] Nudge fetch failed', err);
        } finally {
            setIsThinking(false);
        }
    }, [activeContext, activeElement?.label, activeElement?.type, currentNudge]);

    useEffect(() => {
        setIsMounted(true);
        try {
            const raw = sessionStorage.getItem(SESSION_POSITION_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as Position;
                setPosition(parsed);
                return;
            }
        } catch {
            // Ignore invalid stored data.
        }
        setPosition(getDefaultPosition());
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchNudge();
        }, 1200);
        return () => clearTimeout(timer);
    }, [fetchNudge]);

    useEffect(() => {
        if (!currentNudge) return;
        setMessage(currentNudge);
        setIsOpen(true);
    }, [currentNudge]);

    useEffect(() => {
        const onResize = () => ensureWithinViewport();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [ensureWithinViewport]);

    useEffect(() => {
        const rect = rootRef.current?.getBoundingClientRect();
        if (!rect) return;
        const clamped = clampPosition(position, rect.width, rect.height);
        if (clamped.x !== position.x || clamped.y !== position.y) {
            setPosition(clamped);
            persistPosition(clamped);
        }
    }, [isOpen, position, persistPosition]);

    const handleCloseMessage = () => {
        setIsOpen(false);
        clearNudge();
    };

    const onDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        dragStateRef.current = {
            pointerId: event.pointerId,
            startPointerX: event.clientX,
            startPointerY: event.clientY,
            startX: position.x,
            startY: position.y,
            moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragStateRef.current.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - dragStateRef.current.startPointerX;
        const deltaY = event.clientY - dragStateRef.current.startPointerY;
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            dragStateRef.current.moved = true;
        }
        const rect = rootRef.current?.getBoundingClientRect();
        const width = rect?.width || 56;
        const height = rect?.height || 56;
        const nextPosition = clampPosition(
            { x: dragStateRef.current.startX + deltaX, y: dragStateRef.current.startY + deltaY },
            width,
            height
        );
        setPosition(nextPosition);
    };

    const onDragEnd = (event: React.PointerEvent<HTMLDivElement>) => {
        if (dragStateRef.current.pointerId !== event.pointerId) return;
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragStateRef.current.pointerId = -1;
        persistPosition(positionRef.current);
    };

    const toggleOpen = () => {
        if (dragStateRef.current.moved) {
            dragStateRef.current.moved = false;
            return;
        }
        setIsOpen((prev) => !prev);
    };

    const displayMessage = message || 'Need help? I can suggest your next setup action.';

    if (!isMounted) return null;

    return (
        <div
            ref={rootRef}
            className="fixed z-[9999] flex max-w-[min(320px,calc(100vw-16px))] flex-col items-end gap-3 pointer-events-none"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            {isOpen && (
                <div className="pointer-events-auto w-[min(320px,calc(100vw-16px))] rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                    <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                            <Sparkles size={10} /> Koshie
                        </span>
                        <button onClick={handleCloseMessage} className="text-slate-500 transition hover:text-white">
                            <X size={12} />
                        </button>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-200">{displayMessage}</p>
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                clearNudge();
                            }}
                            className="flex items-center gap-1 rounded-md border border-cyan-500/20 bg-cyan-500/20 px-2 py-1 text-[10px] font-bold text-cyan-300 transition hover:bg-cyan-500/30"
                        >
                            Understood <ArrowRight size={10} />
                        </button>
                        <button
                            onClick={() => {
                                void fetchNudge();
                            }}
                            disabled={isThinking}
                            className="rounded-md border border-slate-700 bg-slate-800/70 px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-60"
                        >
                            {isThinking ? 'Thinking...' : 'New Suggestion'}
                        </button>
                    </div>
                    <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b border-r border-cyan-500/30 bg-slate-900"></div>
                </div>
            )}

            <div
                className="pointer-events-auto relative group"
                onPointerDown={onDragStart}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
            >
                <button
                    onClick={toggleOpen}
                    className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-500 hover:scale-110 hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] ${isThinking ? 'animate-pulse' : 'animate-float'
                        }`}
                    aria-label="Open Koshie assistant"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.4),transparent)]"></div>
                    {isThinking ? <Loader2 className="relative z-10 h-7 w-7 animate-spin text-white" /> : <Zap className="relative z-10 h-7 w-7 text-white" />}
                    <div className="absolute inset-0 animate-spin-slow rounded-full border border-white/20"></div>
                </button>

                <div className="absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-slate-700 bg-slate-900/85 px-1.5 py-0.5 text-[9px] text-slate-300 opacity-0 transition group-hover:opacity-100">
                    <GripVertical size={10} />
                    Drag
                </div>

                <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-emerald-500">
                    <div className="h-1.5 w-1.5 animate-ping rounded-full bg-white"></div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }
                @keyframes spin-slow {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
