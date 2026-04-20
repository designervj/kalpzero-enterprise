'use client';

import { useState } from 'react';
import { Terminal as TerminalIcon, Send, BrainCircuit, Activity, ShieldAlert, Cpu, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { extractErrorMessage, type AiChatMessage, type AiChatResponseDto } from '@/lib/contracts/ai';

export default function AITerminalPage() {
    const { currentProfile } = useAuth();
    const [messages, setMessages] = useState<Array<{ role: 'user' | 'agent' | 'system'; content: string }>>([
        { role: 'system', content: `Initializing LangChain Reasoning Engine...\nConnection securely established.` },
        { role: 'agent', content: 'Hello. I am the Kalp-Zero restricted agent. I can interface with modules and data exclusively bound to your active tenant database. How may I assist you today?' }
    ]);
    const [inputStr, setInputStr] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputStr.trim() || isProcessing) return;

        const userMsg = inputStr;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInputStr('');
        setIsProcessing(true);

        try {
            // Normalize history for shared chat contract used by onboarding + terminal.
            const history: AiChatMessage[] = messages
                .filter(m => m.role !== 'system')
                .map(m => ({
                    role: m.role === 'agent' ? 'assistant' : m.role,
                    content: m.content,
                }));
            const outgoingMessages = [...history, { role: 'user', content: userMsg }];

            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: outgoingMessages }),
            });

            const data = await res.json() as AiChatResponseDto;

            if (data.error) {
                setMessages(prev => [...prev, { role: 'agent', content: `[ENGINE ERROR]: ${extractErrorMessage(data.error)}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: data.reply }]);
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown network error';
            setMessages(prev => [...prev, { role: 'agent', content: `[NETWORK ERROR]: ${message}` }]);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-500 relative">

            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                        <TerminalIcon size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-white mb-0.5 flex items-center gap-2">
                            Reasoning Terminal
                            <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest border border-emerald-500/30 flex items-center gap-1 font-bold">
                                <Activity size={10} className="animate-pulse" /> Online
                            </span>
                        </h2>
                        <p className="text-slate-400 text-xs font-mono">Bound to active context. Vector isolation enforced.</p>
                    </div>
                </div>

                <div className="hidden md:flex gap-3 text-xs font-mono text-slate-500 px-4 py-2 bg-black/30 border border-slate-800 rounded-lg">
                    <div className="flex items-center gap-1.5"><BrainCircuit size={14} className="text-purple-400" /> LangChain Core</div>
                    <div className="w-px h-4 bg-slate-800 mx-2"></div>
                    <div className="flex items-center gap-1.5"><Cpu size={14} className="text-cyan-400" /> GPT-4o Agent</div>
                </div>
            </div>

            {/* Chat Container */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-10">

                {/* Message Log */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* System Status Messages */}
                            {msg.role === 'system' && (
                                <div className="w-full flex justify-center my-4">
                                    <div className="bg-black/50 border border-slate-800 px-6 py-3 rounded-full text-xs font-mono text-slate-500 text-center flex items-center gap-2">
                                        <Activity size={12} className="text-emerald-500" /> {msg.content}
                                    </div>
                                </div>
                            )}

                            {/* User & Agent Messages */}
                            {msg.role !== 'system' && (
                                <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${msg.role === 'user'
                                        ? 'bg-slate-800 text-slate-400 border-slate-700'
                                        : msg.content.includes('[SYSTEM INTERCEPT]') || msg.content.includes('[ENGINE ERROR]')
                                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                            : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                        }`}>
                                        {msg.role === 'user' ? <User size={14} /> : msg.content.includes('[SYSTEM INTERCEPT]') || msg.content.includes('[ENGINE ERROR]') ? <ShieldAlert size={14} /> : <TerminalIcon size={14} />}
                                    </div>
                                    <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-slate-800 text-slate-200 rounded-tr-sm border border-slate-700'
                                        : msg.content.includes('[SYSTEM INTERCEPT]') || msg.content.includes('[ENGINE ERROR]')
                                            ? 'bg-rose-950/30 text-rose-200 rounded-tl-sm border border-rose-500/30 font-mono shadow-[0_0_15px_rgba(244,63,94,0.1)]'
                                            : 'bg-cyan-950/30 text-cyan-100 rounded-tl-sm border border-cyan-500/20 shadow-[0_0_15px_rgba(0,240,255,0.05)]'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isProcessing && (
                        <div className="flex justify-start">
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
                                    <TerminalIcon size={14} />
                                </div>
                                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-cyan-950/30 border border-cyan-500/20 flex items-center gap-2">
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </span>
                                    <span className="text-xs text-cyan-400/60 font-mono ml-2">Reasoning...</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-black/40 border-t border-slate-800">
                    <form onSubmit={handleSubmit} className="relative flex items-center">
                        <input
                            type="text"
                            value={inputStr}
                            onChange={e => setInputStr(e.target.value)}
                            placeholder={currentProfile === 'staff' ? "Query restricted by PermissionEngine..." : "Interface with the Tenant Module environment..."}
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl pl-5 pr-14 py-4 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium"
                            disabled={isProcessing}
                        />
                        <button
                            type="submit"
                            disabled={!inputStr.trim() || isProcessing}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-lg transition-colors disabled:opacity-30 disabled:hover:bg-cyan-500 cursor-pointer"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>

            </div>

        </div>
    );
}
