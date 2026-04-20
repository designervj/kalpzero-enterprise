'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Bot, History, Loader2, MessageCircle, Plus, Send, Wrench, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getAppLabel } from '@/lib/app-labels';
import type {
    KalpBodhBootstrapDto,
    KalpBodhIssueAdviceDto,
    KalpBodhMessageDto,
    KalpBodhSessionDto,
} from '@/lib/contracts/kalpbodh';

interface KalpBodhQuickDrawerProps {
    open: boolean;
    onClose: () => void;
}

type QuickDrawerTab = 'chat' | 'history';

function toId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value && 'toString' in value && typeof (value as { toString: () => string }).toString === 'function') {
        return (value as { toString: () => string }).toString();
    }
    return '';
}

function formatRelative(value: unknown): string {
    if (!value) return '';
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
}

export function KalpBodhQuickDrawer({ open, onClose }: KalpBodhQuickDrawerProps) {
    const auth = useAuth();
    const [activeTab, setActiveTab] = useState<QuickDrawerTab>('chat');
    const [bootstrap, setBootstrap] = useState<KalpBodhBootstrapDto | null>(null);
    const [sessions, setSessions] = useState<KalpBodhSessionDto[]>([]);
    const [activeSessionId, setActiveSessionId] = useState('');
    const [messages, setMessages] = useState<KalpBodhMessageDto[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState<KalpBodhIssueAdviceDto | null>(null);
    const roleView = auth.currentProfile;
    const canOpenTenantSettings = ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin'].includes(roleView);

    const loadBootstrap = useCallback(async () => {
        const res = await fetch(`/api/kalpbodh/bootstrap?roleView=${encodeURIComponent(roleView)}`);
        const data = await res.json();
        if (!res.ok || data?.error) {
            throw new Error(data?.error || 'Failed to load KalpAI scope.');
        }
        setBootstrap(data as KalpBodhBootstrapDto);
    }, [roleView]);

    const loadSessions = useCallback(async (): Promise<KalpBodhSessionDto[]> => {
        const res = await fetch(`/api/kalpbodh/sessions?roleView=${encodeURIComponent(roleView)}&limit=20`);
        const data = await res.json();
        if (!res.ok || data?.error) {
            throw new Error(data?.error || 'Failed to load KalpAI sessions.');
        }
        const list = Array.isArray(data) ? data as KalpBodhSessionDto[] : [];
        setSessions(list);
        if (!activeSessionId && list.length > 0) {
            setActiveSessionId(toId(list[0]?._id));
        }
        return list;
    }, [activeSessionId, roleView]);

    const createSession = useCallback(async () => {
        const res = await fetch('/api/kalpbodh/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                roleView,
                title: 'Quick Ask Session',
            }),
        });
        const data = await res.json();
        if (!res.ok || data?.error || !data?.session) {
            throw new Error(data?.error || 'Failed to create session.');
        }
        const created = data.session as KalpBodhSessionDto;
        setSessions((prev) => [created, ...prev]);
        setActiveSessionId(toId(created._id));
    }, [roleView]);

    const loadMessages = useCallback(async (sessionId: string) => {
        if (!sessionId) return;
        const res = await fetch(`/api/kalpbodh/sessions/${sessionId}/messages?roleView=${encodeURIComponent(roleView)}`);
        const data = await res.json();
        if (!res.ok || data?.error) {
            throw new Error(data?.error || 'Failed to load messages.');
        }
        setMessages(Array.isArray(data) ? data as KalpBodhMessageDto[] : []);
    }, [roleView]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        setError('');

        Promise.all([loadBootstrap(), loadSessions()])
            .then(async ([, list]) => {
                if (cancelled) return;
                const currentSessionId = activeSessionId || toId(list[0]?._id);
                if (!currentSessionId) {
                    await createSession();
                }
            })
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load KalpAI drawer.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, loadBootstrap, loadSessions, activeSessionId, createSession]);

    useEffect(() => {
        if (!open || !activeSessionId) return;
        loadMessages(activeSessionId).catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load chat history.');
        });
    }, [open, activeSessionId, loadMessages]);

    const sendMessage = async (presetPrompt?: string) => {
        const outgoing = (presetPrompt || draft).trim();
        if (!outgoing || !activeSessionId || sending) return;
        try {
            setSending(true);
            setError('');
            if (!presetPrompt) setDraft('');
            const res = await fetch('/api/kalpbodh/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleView,
                    sessionId: activeSessionId,
                    message: outgoing,
                }),
            });
            const data = await res.json();
            if (!res.ok || (!data?.message && data?.error)) {
                throw new Error(data?.error || 'Failed to send message.');
            }
            if (data?.warning && typeof data.warning === 'object') {
                setWarning(data.warning as KalpBodhIssueAdviceDto);
            } else {
                setWarning(null);
            }
            await Promise.all([loadMessages(activeSessionId), loadSessions()]);
            setActiveTab('chat');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const copyDiagnostics = async () => {
        if (!warning?.diagnostics) return;
        const payload = JSON.stringify(warning.diagnostics, null, 2);
        if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(payload);
            return;
        }
        const textArea = document.createElement('textarea');
        textArea.value = payload;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    };

    const suggestions = useMemo(() => bootstrap?.suggestions.slice(0, 4) || [], [bootstrap]);

    return (
        <aside
            className={`fixed right-0 top-0 z-50 h-screen w-[420px] border-l border-slate-800/80 bg-slate-950/95 backdrop-blur-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
            aria-hidden={!open}
        >
            <div className="flex h-full flex-col">
                <div className="border-b border-slate-800/80 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-white">
                            <Bot className="h-4 w-4 text-cyan-300" />
                            <span className="font-semibold">KalpAI</span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-md border border-slate-700 p-1.5 text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-full bg-slate-900 p-1">
                        <button
                            type="button"
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'chat' ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                        >
                            <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> Chat</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`flex-1 rounded-full px-3 py-1.5 text-xs font-semibold transition ${activeTab === 'history' ? 'bg-slate-200 text-slate-900' : 'text-slate-400'}`}
                        >
                            <span className="inline-flex items-center gap-1"><History className="h-3.5 w-3.5" /> History</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-1 items-center justify-center text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mx-3 mt-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
                                {error}
                            </div>
                        )}
                        {warning && (
                            <div className="mx-3 mt-3 rounded-lg border border-amber-500/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
                                <div className="mb-1 flex items-center gap-1.5 font-medium">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    {warning.title}
                                </div>
                                <div className="text-[11px] text-amber-200/90">{warning.message}</div>
                                <div className="mt-2 flex gap-2">
                                    {canOpenTenantSettings && (
                                        <button
                                            type="button"
                                            onClick={() => window.location.assign('/settings/tenant')}
                                            className="inline-flex items-center gap-1 rounded border border-amber-300/40 px-2 py-1 text-[10px] text-amber-100"
                                        >
                                            <Wrench className="h-3 w-3" />
                                            Tenant Settings
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => copyDiagnostics().catch(() => undefined)}
                                        className="inline-flex items-center gap-1 rounded border border-slate-600 px-2 py-1 text-[10px] text-slate-200"
                                    >
                                        Copy Diagnostics
                                    </button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'history' ? (
                            <div className="flex-1 overflow-y-auto p-3">
                                <button
                                    type="button"
                                    onClick={() => createSession().catch((err) => setError(err instanceof Error ? err.message : 'Failed to create session.'))}
                                    className="mb-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    New Session
                                </button>
                                <div className="space-y-2">
                                    {sessions.map((session) => {
                                        const sessionId = toId(session._id);
                                        const active = sessionId === activeSessionId;
                                        return (
                                            <button
                                                key={sessionId}
                                                type="button"
                                                onClick={() => {
                                                    setActiveSessionId(sessionId);
                                                    setActiveTab('chat');
                                                }}
                                                className={`w-full rounded-lg border px-3 py-2 text-left transition ${active ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'}`}
                                            >
                                                <div className="truncate text-xs font-semibold text-slate-100">{session.title || 'Session'}</div>
                                                <div className="mt-1 text-[10px] text-slate-500">{formatRelative(session.updatedAt)}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                                    {messages.map((item, idx) => (
                                        <div key={`${toId(item._id) || idx}`} className={`rounded-lg border px-3 py-2 text-xs ${item.role === 'assistant' ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-100' : 'border-slate-700 bg-slate-900 text-slate-100'}`}>
                                            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">{item.role}</div>
                                            <div className="whitespace-pre-wrap leading-relaxed">{item.content}</div>
                                        </div>
                                    ))}
                                    {messages.length === 0 && (
                                        <div className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-500">
                                            Start a scoped chat.
                                        </div>
                                    )}
                                    {suggestions.length > 0 && (
                                        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2">
                                            <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Suggestions</div>
                                            <div className="space-y-1.5">
                                                {suggestions.map((item) => (
                                                    <button
                                                        key={item.key}
                                                        type="button"
                                                        onClick={() => sendMessage(item.prompt).catch(() => undefined)}
                                                        className="w-full rounded border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-left text-[11px] text-slate-200 transition hover:border-cyan-500/40"
                                                    >
                                                        {item.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="border-t border-slate-800/80 p-3">
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            sendMessage().catch(() => undefined);
                                        }}
                                        className="space-y-2"
                                    >
                                        <textarea
                                            value={draft}
                                            onChange={(event) => setDraft(event.target.value)}
                                            rows={3}
                                            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40"
                                            placeholder="Ask KalpAI..."
                                        />
                                        <div className="flex items-center justify-between gap-2">
                                            <Link href="/kalpbodh" className="text-[10px] text-cyan-300 hover:underline">
                                                Open full workspace
                                            </Link>
                                            <button
                                                type="submit"
                                                disabled={sending || !draft.trim() || !activeSessionId}
                                                className="inline-flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2.5 py-1.5 text-[11px] text-cyan-100 disabled:opacity-50"
                                            >
                                                {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                                Send
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
}
