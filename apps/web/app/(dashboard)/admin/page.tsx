'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Search, Box, Globe, Calendar, ShoppingBag, FileText, Image, Receipt, Megaphone, Palette, Folder, Check, Languages, Bot, BedDouble, Map } from 'lucide-react';

import { useTranslation } from '@/lib/i18n/context';
import { LanguageManagementView } from '@/components/admin/LanguageManagementView';
import { getAppLabel } from '@/lib/app-labels';
import { INDUSTRIES } from '@/lib/business-templates';

const moduleIcons: Record<string, any> = {
    website: Globe, branding: Palette, products: ShoppingBag, ecommerce: ShoppingBag,
    bookings: Calendar, marketing: Megaphone, blog: FileText, media: Image,
    portfolio: Folder, invoicing: Receipt, kalpbodh: Bot, hotel_management: BedDouble, tour_management: Map,
};

export default function SuperAdminPage() {
    const { t } = useTranslation();
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'tenants' | 'templates' | 'languages'>('tenants');
    const [toast, setToast] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    useEffect(() => {
        fetch('/api/admin/tenants')
            .then(res => {
                if (res.status === 403) { setError('super_admin_required'); return []; }
                if (!res.ok) { setError('auth_error'); return []; }
                return res.json();
            })
            .then(data => { if (Array.isArray(data)) setTenants(data); })
            .catch(() => setError('network_error'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = tenants.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) || t.key?.toLowerCase().includes(search.toLowerCase())
    );

    if (error === 'super_admin_required') {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center">
                    <Shield size={48} className="mx-auto text-rose-400 mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">{t('admin.accessRequired', 'Super Admin Access Required')}</h2>
                    <p className="text-slate-400 text-sm">{t('admin.accessRequiredDesc', 'This page is restricted to platform owners and administrators.')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-xl animate-in slide-in-from-right duration-300">
                    <Check size={14} /> {toast}
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{t('admin.console', 'Super Admin Console')}</h2>
                        <p className="text-slate-400 text-xs font-mono">{t('admin.platformManagement', 'Platform-level management')} • {tenants.length} {t('admin.users', 'tenants')}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {([
                    { id: 'tenants', label: `🏢 ${t('admin.allTenants', 'All Tenants')}` },
                    { id: 'templates', label: `📋 ${t('admin.businessTemplates', 'Business Templates')}` },
                    { id: 'languages', label: `🌐 ${t('admin.languages', 'Language Management')}` },
                ] as const).map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase tracking-wider border transition-all ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TENANTS TAB */}
            {activeTab === 'tenants' && (
                <>
                    <div className="relative max-w-md">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('admin.searchTenants', 'Search tenants...')}
                            className="w-full bg-black/50 border border-slate-700/80 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50" />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="space-y-4">
                            {filtered.map(tenant => (
                                <div key={tenant._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                                                {tenant.industry ? INDUSTRIES.find(i => i.industry === tenant.industry)?.icon || '🏢' : '🏢'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white">{tenant.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{tenant.key} • {tenant.industry || 'No industry'}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${tenant.subscriptionLevel === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : tenant.subscriptionLevel === 'pro' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                                                {tenant.subscriptionLevel || 'starter'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-slate-400">
                                        <span className="flex items-center gap-1"><Users size={12} /> {tenant.userCount || 0} {t('admin.users', 'users')}</span>
                                        <span className="flex items-center gap-1"><Box size={12} /> {tenant.enabledModules?.length || 0} {t('admin.apps', 'apps')}</span>
                                        {tenant.businessType && (
                                            <span className="text-slate-500">
                                                • {Array.isArray(tenant.businessType) 
                                                    ? tenant.businessType.map((b: any) => b.name || b.key || b).join(', ') 
                                                    : (typeof tenant.businessType === 'object' ? (tenant.businessType as any).name || (tenant.businessType as any).key : tenant.businessType)}
                                            </span>
                                        )}
                                    </div>
                                    {tenant.enabledModules?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {tenant.enabledModules.map((mod: string) => {
                                                const Icon = moduleIcons[mod] || Box;
                                                return (
                                                    <span key={mod} className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[8px] font-mono border border-cyan-500/20 uppercase tracking-widest">
                                                        <Icon size={8} /> {getAppLabel(mod)}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filtered.length === 0 && <div className="text-center py-12 text-slate-500 text-sm">{t('admin.noTenants', 'No tenants found.')}</div>}
                        </div>
                    )}
                </>
            )}

            {/* TEMPLATES TAB */}
            {activeTab === 'templates' && (
                <div className="space-y-6">
                    {INDUSTRIES.map(ind => (
                        <div key={ind.industry} className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-800 bg-black/20 flex items-center gap-3">
                                <span className="text-xl">{ind.icon}</span>
                                <h3 className="font-bold text-white">{ind.industry}</h3>
                                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{ind.businessTypes.length} types</span>
                            </div>
                            <div className="divide-y divide-slate-800/50">
                                {ind.businessTypes.map(bt => (
                                    <div key={bt.businessType} className="px-6 py-3 hover:bg-slate-800/20 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span>{bt.icon}</span>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{bt.businessType}</div>
                                                    <div className="text-[10px] text-slate-500">{bt.description}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0 ml-4">
                                                {bt.enabledModules.slice(0, 5).map(m => (
                                                    <span key={m} className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[7px] font-mono border border-cyan-500/20 uppercase">{m}</span>
                                                ))}
                                                {bt.enabledModules.length > 5 && <span className="text-[8px] text-slate-500">+{bt.enabledModules.length - 5}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* LANGUAGES TAB */}
            {activeTab === 'languages' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Languages size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">{t('langManagement.title', 'Language Management')}</h3>
                            <p className="text-slate-400 text-xs">{t('langManagement.subtitle')}</p>
                        </div>
                    </div>
                    <LanguageManagementView onToast={showToast} />
                </div>
            )}
        </div>
    );
}
