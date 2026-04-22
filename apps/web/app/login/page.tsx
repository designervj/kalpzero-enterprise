'use client';

import { useState, startTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, Building2, Fingerprint, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { motion } from 'framer-motion';
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
        email: 'allied@admin.com',
        password: '1234567899',

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

        setLoading(true);
        setError('');
        try {
            const session = await login({
                email: form.email,
                password: form.password,
                // tenant_slug: mode === "tenant" ? form.tenantKey.trim() : undefined
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



    return (
        <div className="min-h-screen flex w-full bg-[#030712] overflow-hidden font-sans">
            
            {/* Left Panel - Branding & Visuals */}
            <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 border-r border-slate-800/50 bg-slate-950 overflow-hidden">
                {/* Dynamic Background Mesh */}
                <div className="absolute inset-0 z-0 opacity-50">
                    <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-cyan-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse duration-10000"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/20 blur-[120px] rounded-full mix-blend-screen"></div>
                    <div className="absolute top-[40%] left-[20%] w-[50%] h-[50%] bg-blue-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
                </div>

                {/* Grid Pattern overlay */}
                <div className="absolute inset-0 z-0 bg-[url('/img/grid.svg')] bg-center opacity-5"></div>

                <div className="relative z-10">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-12 h-12 bg-slate-900/50 border border-slate-700/50 rounded-xl flex items-center justify-center p-2 backdrop-blur-sm shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                            <img src="/img/img.svg" alt="KalpZero" className="w-full h-full object-contain" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white">
                            Kalp<span className="text-cyan-400 font-light">ZERO</span>
                        </h1>
                    </motion.div>
                </div>

                <div className="relative z-10 max-w-lg mb-20">
                    <motion.h2 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-6"
                    >
                        Secure, Scalable <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400">Multi-Tenant</span> Platform.
                    </motion.h2>
                    <motion.p 
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        className="text-lg text-slate-400 leading-relaxed"
                    >
                        Access your dedicated ecosystem. Manage users, orchestrate resources, and control your business infrastructure with enterprise-grade security.
                    </motion.p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.4 }}
                        className="flex items-center gap-6 mt-10"
                    >
                        <div className="flex -space-x-4">
                            <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-700"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-600"></div>
                            <div className="w-10 h-10 rounded-full border-2 border-slate-950 bg-cyan-900/50 flex items-center justify-center text-xs font-bold text-cyan-400 backdrop-blur-sm">+2k</div>
                        </div>
                        <div className="text-sm font-medium text-slate-400">
                            Trusted by innovative <span className="text-slate-200">enterprises</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-[#030712]">
                
                {/* Mobile Logo */}
                <div className="absolute top-8 left-8 lg:hidden flex items-center gap-3 z-20">
                    <div className="w-10 h-10 bg-slate-900/50 border border-slate-700/50 rounded-lg flex items-center justify-center p-2 backdrop-blur-sm">
                        <img src="/img/favicon.svg" alt="KalpZero" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-black text-white">Kalp<span className="text-cyan-400 font-light">ZERO</span></h1>
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-[440px] relative z-10"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
                            {isRegister ? 'Create Account' : 'Welcome Back'}
                        </h2>
                        <p className="text-slate-400 font-medium">
                            {isRegister 
                                ? 'Initialize your enterprise identity' 
                                : 'Sign in to access your secure workspace'}
                        </p>
                    </div>

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm font-medium flex items-center gap-3"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                            {error}
                        </motion.div>
                    )}

                    {/* Role Selector */}
                    <div className="grid grid-cols-2 gap-3 mb-8 p-1.5 bg-slate-900/50 rounded-2xl border border-slate-800/80 backdrop-blur-sm">
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
                                className={`relative rounded-xl px-4 py-3 text-left transition-all duration-300 ${mode === roleMode.key
                                        ? 'bg-slate-800/80 text-white shadow-md shadow-black/20 border border-slate-700/50'
                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30 border border-transparent'
                                    }`}
                            >
                                <div className={`text-xs font-black uppercase tracking-widest mb-1 ${mode === roleMode.key ? 'text-cyan-400' : ''}`}>
                                    {roleMode.label}
                                </div>
                                <div className={`text-[10px] leading-relaxed ${mode === roleMode.key ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {roleMode.description}
                                </div>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isRegister && (
                            <div className="space-y-2">
                                <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold ml-1">Full Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <User size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:bg-slate-900 transition-all shadow-inner"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:bg-slate-900 transition-all shadow-inner"
                                    placeholder="operator@kalp.io"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[11px] uppercase tracking-widest text-slate-500 font-bold ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-11 pr-12 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:bg-slate-900 transition-all shadow-inner font-medium tracking-wider"
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative group overflow-hidden bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-4 rounded-xl text-sm font-black tracking-wide transition-all hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {/* Button highlight effect */}
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            
                            <div className="relative flex items-center justify-center gap-3">
                                {loading ? (
                                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Authenticating</>
                                ) : (
                                    <>{isRegister ? 'Initialize Identity' : 'Secure Authenticate'} <ArrowRight size={18} /></>
                                )}
                            </div>
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => { setIsRegister(!isRegister); setError(''); }}
                            className="text-sm font-medium text-slate-500 hover:text-white transition-colors inline-block pb-1 border-b border-transparent hover:border-cyan-500"
                        >
                            {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                        </button>
                    </div>
                </motion.div>
                
                {/* Footer text for right panel */}
                <div className="absolute bottom-8 text-center w-full max-w-[440px] px-6">
                    <p className="text-[10px] text-slate-600 font-mono tracking-widest uppercase">
                        Kalp-Zero v0.11 • System Operational
                    </p>
                </div>
            </div>
        </div>
    );
}
