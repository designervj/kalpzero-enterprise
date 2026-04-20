'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, Copy, Loader2, Plus, Send, Shield, Sparkles, Tag, Wrench } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getAppLabel } from '@/lib/app-labels';
import type {
    KalpBodhBootstrapDto,
    KalpBodhIssueAdviceDto,
    KalpBodhMessageDto,
    KalpBodhSessionDto,
    KalpBodhUsageDto,
} from '@/lib/contracts/kalpbodh';

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

export default function KalpBodhPage() {
    const auth = useAuth();
    const [bootstrap, setBootstrap] = useState<KalpBodhBootstrapDto | null>(null);
    const [sessions, setSessions] = useState<KalpBodhSessionDto[]>([]);
    const [activeSessionId, setActiveSessionId] = useState('');
    const [messages, setMessages] = useState<KalpBodhMessageDto[]>([]);
    const [draft, setDraft] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState<KalpBodhIssueAdviceDto | null>(null);
    const [usage, setUsage] = useState<KalpBodhUsageDto | null>(null);

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

    const loadSessions = useCallback(async () => {
        const res = await fetch(`/api/kalpbodh/sessions?roleView=${encodeURIComponent(roleView)}&limit=30`);
        const data = await res.json();
        if (!res.ok || data?.error) {
            throw new Error(data?.error || 'Failed to load sessions.');
        }
        const list = Array.isArray(data) ? data as KalpBodhSessionDto[] : [];
        setSessions(list);
        if (!activeSessionId && list.length > 0) {
            setActiveSessionId(toId(list[0]?._id));
        }
        if (!activeSessionId && list.length === 0) {
            const createRes = await fetch('/api/kalpbodh/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleView,
                    title: 'Role Scoped Session',
                }),
            });
            const createData = await createRes.json();
            if (!createRes.ok || createData?.error) {
                throw new Error(createData?.error || 'Failed to initialize session.');
            }
            const created = createData?.session as KalpBodhSessionDto;
            const createdId = toId(created?._id);
            if (createdId) {
                setSessions([created]);
                setActiveSessionId(createdId);
            }
        }
    }, [activeSessionId, roleView]);

    const loadUsage = useCallback(async () => {
        const res = await fetch('/api/kalpbodh/usage?days=7');
        const data = await res.json();
        if (!res.ok || data?.error) {
            throw new Error(data?.error || 'Failed to load AI usage summary.');
        }
        setUsage(data as KalpBodhUsageDto);
    }, []);

    const loadMessages = useCallback(async (sessionId: string) => {
        if (!sessionId) {
            setMessages([]);
            return;
        }
        const res = await fetch(`/api/kalpbodh/sessions/${sessionId}/messages?roleView=${encodeURIComponent(roleView)}`);
        const data = await res.json();
        if (!res.ok || data?.error) {
            throw new Error(data?.error || 'Failed to load messages.');
        }
        setMessages(Array.isArray(data) ? data as KalpBodhMessageDto[] : []);
    }, [roleView]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError('');
        Promise.all([loadBootstrap(), loadSessions(), loadUsage()])
            .catch((err) => {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load KalpAI.');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [loadBootstrap, loadSessions, loadUsage]);

    useEffect(() => {
        if (!activeSessionId) return;
        loadMessages(activeSessionId).catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load messages.');
        });
    }, [activeSessionId, loadMessages]);

    const createSession = async (title?: string) => {
        try {
            setError('');
            const res = await fetch('/api/kalpbodh/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roleView,
                    title: title || 'New KalpAI Session',
                }),
            });
            const data = await res.json();
            if (!res.ok || data?.error || !data?.session) {
                throw new Error(data?.error || 'Failed to create session.');
            }
            const created = data.session as KalpBodhSessionDto;
            const createdId = toId(created._id);
            setSessions((prev) => [created, ...prev]);
            setActiveSessionId(createdId);
            setMessages([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create session.');
        }
    };

    const sendMessage = async (overridePrompt?: string) => {
        const outgoing = (overridePrompt || draft).trim();
        if (!outgoing || !activeSessionId || sending) return;

        try {
            setSending(true);
            setError('');
            if (!overridePrompt) setDraft('');
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
            await Promise.all([loadMessages(activeSessionId), loadSessions(), loadUsage()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const suggestionItems = useMemo(() => bootstrap?.suggestions || [], [bootstrap]);

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

    if (loading) {
        return (
            <div className="mx-auto max-w-[1400px]">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 p-8 text-slate-300">
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-300" />
                        Loading KalpAI workspace...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-[1400px] space-y-4">
            <section className="rounded-2xl border border-cyan-500/30 bg-slate-950/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-200">
                            <Bot className="h-3.5 w-3.5" />
                            KalpAI
                        </div>
                        <h1 className="mt-3 text-2xl font-semibold text-white">Scoped Analysis Workspace</h1>
                        <p className="mt-1 text-sm text-slate-400">
                            Role-aware interaction plane with tenant-safe context, retention policy, and session history.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => createSession()}
                        className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:bg-cyan-500/20"
                    >
                        <Plus className="h-4 w-4" />
                        New Session
                    </button>
                </div>
            </section>

            {error && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            )}

            {warning && (
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-sm text-amber-100">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-amber-200">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="font-semibold">{warning.title}</span>
                            </div>
                            <p>{warning.message}</p>
                            <p className="text-amber-200/90"><span className="font-semibold">Tenant/Agency:</span> {warning.tenantAction}</p>
                            <p className="text-amber-200/90"><span className="font-semibold">Super Admin:</span> {warning.adminAction}</p>
                            <p className="text-amber-200/80"><span className="font-semibold">Support:</span> {warning.supportAction}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            {canOpenTenantSettings && (
                                <button
                                    type="button"
                                    onClick={() => window.location.assign('/settings/tenant')}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-400/50 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-100 transition hover:bg-amber-500/20"
                                >
                                    <Wrench className="h-3.5 w-3.5" />
                                    Open Tenant Settings
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => copyDiagnostics().catch(() => undefined)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-slate-600 bg-slate-900/40 px-2.5 py-1.5 text-xs text-slate-200 transition hover:border-slate-500"
                            >
                                <Copy className="h-3.5 w-3.5" />
                                Copy Diagnostics
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <section className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
                <aside className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3">
                    <div className="mb-3 text-xs uppercase tracking-[0.16em] text-slate-500">Sessions</div>
                    <div className="space-y-2">
                        {sessions.map((session) => {
                            const id = toId(session._id);
                            const isActive = activeSessionId === id;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setActiveSessionId(id)}
                                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${isActive
                                        ? 'border-cyan-500/40 bg-cyan-500/10'
                                        : 'border-slate-800 bg-slate-900/30 hover:border-slate-700'
                                        }`}
                                >
                                    <div className="truncate text-sm font-medium text-slate-100">{session.title || 'Untitled Session'}</div>
                                    <div className="mt-1 text-[11px] text-slate-500">{formatRelative(session.updatedAt)}</div>
                                </button>
                            );
                        })}
                        {sessions.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-500">
                                No sessions yet.
                            </div>
                        )}
                    </div>
                </aside>

                <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="rounded-full border border-slate-700 px-2 py-1">{bootstrap?.scope.roleLabel || 'Role'}</span>
                        <span className="rounded-full border border-slate-700 px-2 py-1">{bootstrap?.scope.tenantKey || 'tenant'}</span>
                    </div>
                    <div className="h-[420px] space-y-3 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900/20 p-3">
                        {messages.map((item, index) => (
                            <div
                                key={`${toId(item._id) || index}`}
                                className={`rounded-lg border px-3 py-2 text-sm ${item.role === 'assistant'
                                    ? 'border-cyan-500/25 bg-cyan-500/10 text-cyan-50'
                                    : item.role === 'system'
                                        ? 'border-slate-700 bg-slate-800/40 text-slate-300'
                                        : 'border-slate-700 bg-slate-900 text-slate-100'
                                    }`}
                            >
                                <div className="mb-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{item.role}</div>
                                <div className="whitespace-pre-wrap leading-relaxed">{item.content}</div>
                            </div>
                        ))}
                        {messages.length === 0 && (
                            <div className="rounded-lg border border-dashed border-slate-800 px-3 py-8 text-center text-sm text-slate-500">
                                Start a scoped conversation.
                            </div>
                        )}
                    </div>
                    <div className="mt-3 flex items-end gap-2">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    sendMessage().catch(() => undefined);
                                }
                            }}
                            className="h-20 flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-500/50"
                            placeholder="Ask KalpAI with your current role scope..."
                        />
                        <button
                            type="button"
                            onClick={() => sendMessage()}
                            disabled={sending || !activeSessionId || !draft.trim()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 text-sm text-cyan-200 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Send
                        </button>
                    </div>
                </div>

                <aside className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                        <Shield className="h-3.5 w-3.5 text-slate-400" />
                        Scope
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">{bootstrap?.scope.bodhHint}</p>

                    <div className="mt-4 space-y-3 text-xs text-slate-400">
                        <div>
                            <div className="text-slate-500">Enabled Apps</div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {(bootstrap?.scope.enabledModules || []).map((item) => (
                                    <span key={item} className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200">{getAppLabel(item)}</span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">Business Contexts</div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {(bootstrap?.scope.businessContexts || []).map((item) => (
                                    <span key={item} className="rounded-full border border-slate-700 px-2 py-0.5 text-[11px] text-slate-200">{item}</span>
                                ))}
                                {(bootstrap?.scope.businessContexts || []).length === 0 && (
                                    <span className="text-[11px] text-slate-500">No context tags.</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="text-slate-500">Retention</div>
                            <div className="mt-1 text-slate-200">
                                Sessions: {bootstrap?.retentionPolicy.sessionTtlDays ?? 7} days
                            </div>
                            <div className="text-slate-200">
                                Artifacts: {bootstrap?.retentionPolicy.artifactTtlDays ?? 7} days
                            </div>
                        </div>

                        {usage && (
                            <div>
                                <div className="text-slate-500">AI Consumption (last 7 days)</div>
                                <div className="mt-1 space-y-1 text-slate-200">
                                    <div>Total messages: {usage.totals.messages}</div>
                                    <div>OpenAI replies: {usage.totals.openAiReplies}</div>
                                    <div>Fallback replies: {usage.totals.fallbackReplies}</div>
                                </div>
                                {usage.byActor.length > 0 && (
                                    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2">
                                        <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-slate-500">Top users</div>
                                        <div className="space-y-1">
                                            {usage.byActor.slice(0, 3).map((actor) => (
                                                <div key={actor.actorUserId} className="flex items-center justify-between text-[11px] text-slate-300">
                                                    <span className="truncate pr-2">{actor.actorUserId}</span>
                                                    <span>{actor.messages}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="mt-5 border-t border-slate-800 pt-4">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                            Suggestions
                        </div>
                        <div className="space-y-2">
                            {suggestionItems.slice(0, 8).map((item) => (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => sendMessage(item.prompt)}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900/40 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-cyan-500/40 hover:bg-cyan-500/10"
                                >
                                    <div className="font-medium">{item.label}</div>
                                    <div className="mt-1 line-clamp-2 text-[11px] text-slate-400">{item.prompt}</div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {item.moduleScopes.slice(0, 2).map((moduleKey) => (
                                            <span key={moduleKey} className="inline-flex items-center gap-1 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] text-slate-400">
                                                <Tag className="h-2.5 w-2.5" />
                                                {getAppLabel(moduleKey)}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            ))}
                            {suggestionItems.length === 0 && (
                                <div className="rounded-lg border border-dashed border-slate-800 px-3 py-6 text-center text-xs text-slate-500">
                                    No scoped suggestions yet.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}
