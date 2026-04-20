'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { HelpTip } from '@/components/HelpTip';
import { UserCircle, Save, Globe, Palette, ShieldCheck, KeyRound, Loader2 } from 'lucide-react';

export default function UserSettings() {
    const { user, currentProfile } = useAuth();

    const [saving, setSaving] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        language: 'en',
        theme: 'dark'
    });

    useEffect(() => {   
        if (user) {
            setForm(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
        }
    }, [user]);

    const handleSave = () => {
        setSaving(true);
        setStatusMessage('');
        // Mock save delay
        setTimeout(() => {
            setSaving(false);
            setStatusMessage('Preferences updated successfully. Some changes may require a page reload.');
            // Clear message after 3 seconds
            setTimeout(() => setStatusMessage(''), 3000);
        }, 800);
    };

    return (
        <div className="mx-auto w-full max-w-4xl p-6 md:p-8">
            <header className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Personal Session Data</p>
                <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                    <UserCircle className="text-emerald-400" size={24} />
                    User Preferences
                </h1>
                <p className="mt-2 text-sm text-slate-400">
                    Manage your personal account profile, display settings, and active session details.
                </p>
            </header>

            <div className="mb-5">
                <HelpTip topicKey="user_preferences" />
            </div>

            {statusMessage && (
                <div className="mb-5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300 flex items-center gap-2">
                    <ShieldCheck size={16} />
                    {statusMessage}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">

                {/* Profile Form */}
                <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 md:col-span-2">
                    <h2 className="text-lg font-semibold text-white mb-4">Profile Information</h2>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-[11px] uppercase tracking-wider font-semibold text-slate-500">Full Name</label>
                            <input
                                value={form.name}
                                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[11px] uppercase tracking-wider font-semibold text-slate-500">Email Address</label>
                            <input
                                value={form.email}
                                readOnly
                                disabled
                                className="w-full rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm text-slate-400 opacity-80 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-slate-800/60 my-6"></div>

                    <h2 className="text-lg font-semibold text-white mb-4">Display Preferences</h2>

                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                                <Globe size={12} /> Interface Language
                            </label>
                            <select
                                value={form.language}
                                onChange={(e) => setForm(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                            >
                                <option value="en">English (US)</option>
                                <option value="hr">Hrvatski (Croatian)</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                                <Palette size={12} /> Theme
                            </label>
                            <select
                                value={form.theme}
                                onChange={(e) => setForm(prev => ({ ...prev, theme: e.target.value }))}
                                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
                            >
                                <option value="system">System Default</option>
                                <option value="dark">Dark Mode</option>
                                <option value="light">Light Mode</option>
                            </select>
                            <p className="mt-2 text-[10px] text-slate-500">Overrides tenant branding temporarily.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60 transition-colors shadow-sm"
                        >
                            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Preferences
                        </button>
                    </div>
                </section>

                {/* Session Sidebar */}
                <div className="space-y-5">
                    <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Active Session</h3>

                        <div className="space-y-4">
                            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Current Role Lens</span>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-emerald-300 font-mono">{currentProfile}</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Determined by Admin Role Switcher</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                                <span className="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Session MFA</span>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className="text-xs font-medium text-slate-300">Verified at login</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 shadow-sm">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">Connections</h3>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-slate-800">
                            <div className="flex items-center gap-2">
                                {/* <Github size={16} className="text-slate-400" /> */}
                                <span className="text-xs font-medium text-slate-300">GitHub Identity</span>
                            </div>
                            <button className="text-[10px] uppercase font-bold text-slate-500 hover:text-emerald-400 transition-colors">Connect</button>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-slate-800 mt-3">
                            <div className="flex items-center gap-2">
                                <KeyRound size={16} className="text-slate-400" />
                                <span className="text-xs font-medium text-slate-300">Passkeys</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-emerald-500">Active</span>
                        </div>
                    </section>
                </div>
            </div>

        </div>
    );
}
