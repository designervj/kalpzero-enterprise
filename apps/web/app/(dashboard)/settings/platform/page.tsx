'use client';

import { useEffect, useState } from 'react';
import { Shield, Key, CheckCircle2, Lock, Save, Check, RefreshCw, Users, Settings } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { enforceModuleSelectionRules, toggleModuleWithRules } from '@/lib/module-rules';
import { getAppLabel } from '@/lib/app-labels';
import { HelpTip } from '@/components/HelpTip';

const MODULES = ['website', 'branding', 'products', 'ecommerce', 'bookings', 'marketing', 'blog', 'portfolio', 'media', 'invoicing', 'hotel_management', 'tour_management'];
const ROLES = ['platform_owner', 'platform_admin', 'tenant_admin', 'staff', 'viewer'];
const OPERATIONS = ['read', 'write'];

export default function PlatformSettings() {
    const [snapshot, setSnapshot] = useState<any | null>(null);
    const [tenant, setTenant] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<'permissions' | 'roles' | 'modules'>('permissions');
    const { user } = useAuth();

    useEffect(() => {
        fetch('/api/registry/snapshot').then(res => res.json()).then(setSnapshot).catch(console.error);
        fetch('/api/settings/tenant').then(res => res.json()).then(setTenant).catch(console.error);
    }, []);

    const toggleModule = async (mod: string) => {
        if (!tenant) return;
        const modules = tenant.enabledModules || [];
        const updated = enforceModuleSelectionRules(toggleModuleWithRules(modules, mod)).modules;
        setSaving(true);
        await fetch('/api/settings/tenant', {
            method: 'PUT', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabledModules: updated }),
        });
        setTenant({ ...tenant, enabledModules: updated });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
    };

    if (!snapshot) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4 text-purple-500/50">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/30 border-t-purple-500 animate-spin"></div>
                <span className="font-mono text-xs uppercase tracking-widest text-purple-400">Querying Platform Registry...</span>
            </div>
        );
    }

    const permissions = Object.entries(snapshot.permissions || {});
    const enabledModules = tenant?.enabledModules || [];

    // Build a permission matrix: module × operation → which roles have access
    const getAccessForRole = (role: string, permId: string) => {
        // Platform owner has everything, platform_admin has everything, tenant_admin has write, staff has read, viewer has read
        if (role === 'platform_owner' || role === 'platform_admin') return true;
        if (role === 'tenant_admin') return true;
        if (role === 'staff') return permId.includes('.read');
        if (role === 'viewer') return permId.includes('.read');
        return false;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Access Control</h2>
                        <p className="text-slate-400 text-xs font-mono">
                            {permissions.length} permissions • {enabledModules.length} active apps • 4-guard chain
                        </p>
                    </div>
                </div>
                {saved && (
                    <span className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold border border-emerald-500/30">
                        <Check size={14} /> Saved
                    </span>
                )}
            </div>

            <div className="mb-2">
                <HelpTip topicKey="platform_settings" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {([['permissions', 'Permission Matrix'], ['modules', 'App Access'], ['roles', 'Role Hierarchy']] as const).map(([tab, label]) => (
                    <button key={tab} onClick={() => setActiveTab(tab as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${activeTab === tab ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* PERMISSIONS TAB */}
            {activeTab === 'permissions' && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-3 border-b border-slate-800 bg-black/20">
                        <h3 className="text-xs text-slate-400 uppercase tracking-widest font-bold flex items-center gap-2"><Key size={14} /> Role × Permission Matrix</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold sticky left-0 bg-slate-950/80 backdrop-blur">Permission</th>
                                    {ROLES.map(role => (
                                        <th key={role} className="px-3 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-center">{role.replace('_', ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MODULES.flatMap(mod =>
                                    OPERATIONS.map(op => {
                                        const permId = `perm.${mod}.${op}`;
                                        const isModuleEnabled = enabledModules.includes(mod);
                                        return (
                                            <tr key={permId} className={`border-b border-slate-800/50 ${!isModuleEnabled ? 'opacity-40' : 'hover:bg-slate-800/20'}`}>
                                                <td className="px-4 py-2.5 sticky left-0 bg-slate-950/80 backdrop-blur">
                                                    <div className="font-mono text-xs text-purple-300">{permId}</div>
                                                </td>
                                                {ROLES.map(role => {
                                                    const has = getAccessForRole(role, permId);
                                                    return (
                                                        <td key={role} className="px-3 py-2.5 text-center">
                                                            {has ? (
                                                                <CheckCircle2 size={16} className="inline text-emerald-400" />
                                                            ) : (
                                                                <Lock size={14} className="inline text-slate-600" />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODULES TAB */}
            {activeTab === 'modules' && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">App Enablement</h3>
                    <p className="text-xs text-slate-500 mb-4">Toggle apps on or off for this tenant. Disabled apps are hidden from the sidebar and blocked by the access-control app guard.</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {MODULES.map(mod => {
                            const active = enabledModules.includes(mod);
                            return (
                                <button key={mod} onClick={() => toggleModule(mod)}
                                    className={`p-4 rounded-xl border text-left transition-all ${active ? 'bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(0,240,255,0.1)]' : 'bg-black/30 border-slate-700/50 hover:border-slate-600'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`text-sm font-bold ${active ? 'text-cyan-400' : 'text-slate-500'}`}>{getAppLabel(mod)}</span>
                                        <div className={`w-8 h-4 rounded-full relative transition-all ${active ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                                            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${active ? 'left-4' : 'left-0.5'}`}></div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-slate-500">{active ? '2 permissions active' : 'App disabled'}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ROLES TAB */}
            {activeTab === 'roles' && (
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Users size={16} className="text-purple-400" /> Role Hierarchy
                    </h3>
                    <div className="space-y-3">
                        {[
                            { role: 'platform_owner', label: 'Platform Owner', desc: 'Full platform access. Can manage all tenants, users, and settings.', color: 'rose', level: 'L0' },
                            { role: 'platform_admin', label: 'Platform Admin', desc: 'Platform management access. Can view all tenants and manage platform settings.', color: 'purple', level: 'L1' },
                            { role: 'tenant_admin', label: 'Business Admin', desc: 'Full access within their business. Can manage products, orders, settings, and users.', color: 'cyan', level: 'L2' },
                            { role: 'staff', label: 'Staff', desc: 'Read access to most apps. Write access to assigned areas only.', color: 'emerald', level: 'L3' },
                            { role: 'viewer', label: 'Viewer', desc: 'Read-only access. Can view dashboards and reports but cannot modify data.', color: 'slate', level: 'L4' },
                        ].map(r => (
                            <div key={r.role} className={`flex items-center gap-4 p-4 rounded-xl bg-black/30 border border-slate-800 hover:border-${r.color}-500/30 transition-colors`}>
                                <div className={`w-10 h-10 rounded-lg bg-${r.color}-500/10 border border-${r.color}-500/30 flex items-center justify-center text-${r.color}-400 text-xs font-bold font-mono`}>{r.level}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">{r.label}</span>
                                        <span className="font-mono text-[10px] text-slate-500">{r.role}</span>
                                        {user?.role === r.role && <span className="bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border border-cyan-500/30">You</span>}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                        {r.role === 'platform_owner' ? 'All Permissions' : r.role === 'viewer' ? 'Read Only' : 'Custom'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
