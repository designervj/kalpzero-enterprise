'use client';

import { useState, startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Building2, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { getMagicOptions, type MagicUser } from '@/lib/api';
import { resolvePostLoginRoute } from '@/lib/auth-routing';

const roleModes = [
  {
    key: "platform",
    label: "Super Admin",
    description: "Control agencies, tenants, onboarding, and visibility from Kalp."
  },
  {
    key: "tenant",
    label: "Tenant Admin",
    description: "Open the tenant dashboard, modules, and blueprint workspace."
  }
] as const;
type RoleMode = (typeof roleModes)[number]["key"];
export default function LoginPage() {
    const platformDefaults = {
        email: 'admin@kalpzero.com',
        password: '1234567899',
        tenantKey: 'demo-tenant',
    };
    const tenantDefaults = {
        email: 'ops@tenant.com',
        password: 'very-secure-password',
        tenantKey: 'demo-tenant',
    };
    const router = useRouter();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login, magicLogin } = useAuth();
    const [mode, setMode] = useState<RoleMode>("platform");
    const [magicUsers, setMagicUsers] = useState<MagicUser[]>([]);
    const [showMagic, setShowMagic] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    
    const [form, setForm] = useState({
        email: platformDefaults.email,
        password: platformDefaults.password,
        name: '',
        tenantKey: platformDefaults.tenantKey,
    });

    useEffect(() => {
        const fetchMagic = async () => {
            try {
                const response = await getMagicOptions();
                setMagicUsers(response.users);
            } catch (err) {
                console.error("Failed to fetch magic options", err);
            }
        };
        fetchMagic();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        debugger
        setLoading(true);
        setError('');
        try {
            const session = await login({
                email: form.email,
                password: form.password,
                tenant_slug: mode === "tenant" ? form.tenantKey.trim() : undefined
            });
         
            if (session?.role) {
                startTransition(() => {
                    router.push(resolvePostLoginRoute(session.role));
                });
            }
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
        } finally {
            setLoading(false);
        }
    };

    const handleMagicLogin = async (userId: string) => {
        setLoading(true);
        setError('');
        try {
            const session = await magicLogin(userId);
            if (session?.role) {
                startTransition(() => {
                    router.push(resolvePostLoginRoute(session.role));
                });
            }
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Magic login failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#030712]">

            {/* Background effects */}
            <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-900/10 blur-[150px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,#030712_100%)]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">

                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-10">
                    {/* <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)]">
                        <Activity className="w-5 h-5 text-cyan-400" />
                       
                    </div> */}
                    <div className='w-14 h-14'>
                     <img
                            src="/img/favicon.svg"
                            alt="KalpTree Logo"
                            className="h-full w-auto object-contain"

                        />
                        </div>
                    <h1 className="text-2xl font-black tracking-normal  text-white">Kalp<span className="text-cyan-400 font-light">ZERO</span></h1>
                </div>

                {/* Card */}
                <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800 rounded-2xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">

                    <div className="text-center mb-8">
                        {/* <h2 className="text-xl font-bold text-white mb-1">{allowSelfRegistration && isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-slate-400 text-sm">
                            {allowSelfRegistration && isRegister
                                ? 'Initialize your operator identity'
                                : 'Sign in with the email and password issued during business onboarding'}
                        </p> */}
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-rose-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {showMagic && magicUsers.length > 0 && (
                        <div className="mb-8 p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
                            <div className="flex items-center gap-2 mb-4 text-cyan-400">
                                <Fingerprint size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Magic Login (Testing)</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {magicUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleMagicLogin(user.id)}
                                        disabled={loading}
                                        className="group relative flex items-center justify-between p-3 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-cyan-500/50 hover:bg-slate-800 transition-all text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${user.role === 'platform_admin' ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                                                {user.role === 'platform_admin' ? <ShieldCheck size={18} /> : <Building2 size={18} />}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">{user.name}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-tight">
                                                    {user.role} {user.tenant_slug ? `• ${user.tenant_slug}` : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="relative mb-8 text-center">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-800"></div>
                        </div>
                        <span className="relative px-4 bg-[#0a0f1d] text-[10px] uppercase font-bold tracking-widest text-slate-600">
                            {showMagic ? 'Or Manual Auth' : 'Authenticate'}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950/40 p-1">
                            {roleModes.map((roleMode) => (
                                <button
                                    key={roleMode.key}
                                    type="button"
                                    onClick={() => {
                                        setMode(roleMode.key);
                                        setError('');
                                        setForm((current) => ({
                                            ...current,
                                            ...(roleMode.key === "platform" ? platformDefaults : tenantDefaults),
                                        }));
                                    }}
                                    className={`rounded-lg px-4 py-3 text-left transition ${
                                        mode === roleMode.key
                                            ? 'bg-slate-800 text-white shadow-[0_0_20px_rgba(14,165,233,0.15)]'
                                            : 'text-slate-400 hover:bg-slate-900/70 hover:text-slate-200'
                                    }`}
                                >
                                    <div className="text-xs font-bold uppercase tracking-wider">{roleMode.label}</div>
                                    <div className="mt-1 text-[11px] leading-relaxed text-slate-500">
                                        {roleMode.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {isRegister && (
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Full Name</label>
                                <div className="relative">
                                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Email Address</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    placeholder="operator@kalp.io"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Password</label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-12 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {mode === "tenant" && (
                            <div>
                                <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Tenant Workspace</label>
                                <div className="relative">
                                    <Sparkles size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        type="text"
                                        value={form.tenantKey}
                                        onChange={e => setForm({ ...form, tenantKey: e.target.value })}
                                        className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono"
                                        placeholder="demo"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> Authenticating...</>
                            ) : (
                                <>{isRegister ? 'Initialize Identity' : 'Authenticate'} <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>

             
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                                className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                            >
                                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                            </button>
                        </div>
                    
                </div>

                <p className="text-center text-xs text-slate-600 mt-6 font-mono">Kalp-Zero v0.11 • Secure Multi-Tenant Platform</p>
            </div>
        </div>
    );
}
