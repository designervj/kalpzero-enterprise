'use client';

import { useState, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';

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
    const router = useRouter();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [mode, setMode] = useState<RoleMode>("platform");
    // const [email, setEmail] = useState("founder@kalpzero.com");
    // const [password, setPassword] = useState("1234567899");
    const [form, setForm] = useState({
        email: 'founder@kalpzero.com',
        password: '1234567899',
        name: '',
        tenantKey: 'demo',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const session = await login({
                email: form.email,
                password: form.password,
                tenant_slug: mode === "tenant" ? form.tenantKey : undefined
            });
            console.log(session);
            
            if (session?.roles) {
                startTransition(() => {
                    router.push(session.roles.includes("platform_admin") ? "/platform" : "/tenant");
                });
            }
        } catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
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

                    <form onSubmit={handleSubmit} className="space-y-5">

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
                                    type="password"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        {isRegister && (
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
