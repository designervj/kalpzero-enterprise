'use client';
import { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    FileText,
    Megaphone,
    Share2,
    BarChart3,
    Users,
    Ticket,
    Mail,
    Plus,
    X,
    Calendar,
    Globe,
    CheckCircle2,
    Clock,
    PlayCircle,
    type LucideIcon
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import type {
    MarketingAdAccountsDto,
    MarketingAnalyticsResponseDto,
    MarketingCampaignDto,
    MarketingCampaignFormDto,
    MarketingContentFormDto,
    MarketingContentItemDto,
    MarketingCouponDto,
    MarketingCouponFormDto,
    MarketingEmailDto,
    MarketingEmailFormDto,
    MarketingLeadDto,
    MarketingLeadFormDto,
    MarketingPostDto,
    MarketingSocialAccountsDto
} from '@/lib/contracts/marketing';
import { useAuth } from '@/components/AuthProvider';
import { ScopedReadOnlyNotice } from '@/components/role/ScopedMutationBoundary';
import { canRoleMutateUi } from '@/lib/role-scope';

function StatCard({ title, value, trend, icon, type }: { title: string, value: string | number, trend: string, icon: React.ReactNode, type: 'increase' | 'decrease' | 'neutral' }) {
    return (
        <div className="bg-[#0c0c14] border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    {icon}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded ${type === 'increase' ? 'bg-emerald-500/10 text-emerald-400' :
                    type === 'decrease' ? 'bg-rose-500/10 text-rose-400' :
                        'bg-slate-500/10 text-slate-400'
                    }`}>
                    {trend}
                </div>
            </div>
            <div>
                <div className="text-2xl font-bold text-white mb-1">{value}</div>
                <div className="text-sm text-slate-400">{title}</div>
            </div>
        </div>
    );
}

type MarketingSection =
    | 'dashboard'
    | 'content'
    | 'campaigns'
    | 'social'
    | 'ads'
    | 'leads'
    | 'coupons'
    | 'email';

const MOCK_PIPELINE = [
    { name: 'Lead', current: 1240, target: 1500, color: 'emerald' },
    { name: 'MQL', current: 850, target: 1000, color: 'blue' },
    { name: 'SQL', current: 420, target: 500, color: 'amber' },
    { name: 'Opportunity', current: 150, target: 200, color: 'purple' },
    { name: 'Customer', current: 42, target: 50, color: 'rose' }
];

export default function MarketingPage() {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [section, setSection] = useState<MarketingSection>('dashboard');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    // Data State
    const [analytics, setAnalytics] = useState<MarketingAnalyticsResponseDto | null>(null);
    const [contentItems, setContentItems] = useState<MarketingContentItemDto[]>([]);
    const [campaigns, setCampaigns] = useState<MarketingCampaignDto[]>([]);
    const [leads, setLeads] = useState<MarketingLeadDto[]>([]);
    const [coupons, setCoupons] = useState<MarketingCouponDto[]>([]);
    const [posts, setPosts] = useState<MarketingPostDto[]>([]);
    const [socialAccounts, setSocialAccounts] = useState<MarketingSocialAccountsDto>({});
    const [adAccounts, setAdAccounts] = useState<MarketingAdAccountsDto>({});
    const [emails, setEmails] = useState<MarketingEmailDto[]>([]);

    // Create modals
    const [showCreateContent, setShowCreateContent] = useState(false);
    const [showCreateCampaign, setShowCreateCampaign] = useState(false);
    const [showCreateLead, setShowCreateLead] = useState(false);
    const [showCreateCoupon, setShowCreateCoupon] = useState(false);
    const [showCreateEmail, setShowCreateEmail] = useState(false);

    // Forms
    const [contentForm, setContentForm] = useState<MarketingContentFormDto>({ type: 'banner', title: '', platform: 'instagram', dimensions: { width: 1080, height: 1080 } });
    const [campaignForm, setCampaignForm] = useState<MarketingCampaignFormDto>({ name: '', channels: [], budget: { total: 0, currency: 'USD' } });
    const [leadForm, setLeadForm] = useState<MarketingLeadFormDto>({ name: '', email: '', phone: '', source: { type: 'manual' }, tags: [] });
    const [couponForm, setCouponForm] = useState<MarketingCouponFormDto>({ code: '', type: 'percentage', value: 0, scope: 'global', rules: { minOrderAmount: 0, maxUsesPerUser: 1 } });
    const [emailForm, setEmailForm] = useState<MarketingEmailFormDto>({ subject: '', previewText: '', templateId: 'blank', status: 'draft', audience: { type: 'all' } });

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('/api/marketing/analytics').then(r => r.json()),
            fetch('/api/marketing/content').then(r => r.json()),
            fetch('/api/marketing/campaigns').then(r => r.json()),
            fetch('/api/marketing/leads').then(r => r.json()),
            fetch('/api/marketing/coupons').then(r => r.json()),
            fetch('/api/marketing/posts').then(r => r.json()),
            fetch('/api/marketing/social').then(r => r.json()),
            fetch('/api/marketing/ads').then(r => r.json()),
            fetch('/api/marketing/email').then(r => r.json()),
        ]).then(([stats, content, camps, lds, cpns, psts, social, ads, ems]) => {
            setAnalytics((stats || null) as MarketingAnalyticsResponseDto | null);
            setContentItems((Array.isArray(content) ? content : []) as MarketingContentItemDto[]);
            setCampaigns((Array.isArray(camps) ? camps : []) as MarketingCampaignDto[]);
            setLeads((Array.isArray(lds) ? lds : []) as MarketingLeadDto[]);
            setCoupons((Array.isArray(cpns) ? cpns : []) as MarketingCouponDto[]);
            setPosts((Array.isArray(psts) ? psts : []) as MarketingPostDto[]);
            setSocialAccounts((social || {}) as MarketingSocialAccountsDto);
            setAdAccounts((ads || {}) as MarketingAdAccountsDto);
            setEmails((Array.isArray(ems) ? ems : []) as MarketingEmailDto[]);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (canMutate) return;
        setShowCreateContent(false);
        setShowCreateCampaign(false);
        setShowCreateLead(false);
        setShowCreateCoupon(false);
        setShowCreateEmail(false);
    }, [canMutate]);

    const createContent = async () => {
        if (!canMutate) return;
        setSaving(true);
        const res = await fetch('/api/marketing/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contentForm) });
        const result = await res.json();
        if (result.error) { showToast(result.error); setSaving(false); return; }
        const items = await fetch('/api/marketing/content').then(r => r.json());
        setContentItems((Array.isArray(items) ? items : []) as MarketingContentItemDto[]);
        setShowCreateContent(false);
        setContentForm({ type: 'banner', title: '', platform: 'instagram', dimensions: { width: 1080, height: 1080 } });
        showToast('Asset created!'); setSaving(false);
    };

    const createCampaign = async () => {
        if (!canMutate) return;
        setSaving(true);
        const res = await fetch('/api/marketing/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(campaignForm) });
        const result = await res.json();
        if (result.error) { showToast(result.error); setSaving(false); return; }
        const items = await fetch('/api/marketing/campaigns').then(r => r.json());
        setCampaigns((Array.isArray(items) ? items : []) as MarketingCampaignDto[]);
        setShowCreateCampaign(false);
        setCampaignForm({ name: '', channels: [], budget: { total: 0, currency: 'USD' } });
        showToast('Campaign created!'); setSaving(false);
    };

    const createLead = async () => {
        if (!canMutate) return;
        setSaving(true);
        const res = await fetch('/api/marketing/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leadForm) });
        const result = await res.json();
        if (result.error) { showToast(result.error); setSaving(false); return; }
        const items = await fetch('/api/marketing/leads').then(r => r.json());
        setLeads((Array.isArray(items) ? items : []) as MarketingLeadDto[]);
        setShowCreateLead(false);
        setLeadForm({ name: '', email: '', phone: '', source: { type: 'manual' }, tags: [] });
        showToast('Lead added!'); setSaving(false);
    };

    const createCoupon = async () => {
        if (!canMutate) return;
        setSaving(true);
        const res = await fetch('/api/marketing/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(couponForm) });
        const result = await res.json();
        if (result.error) { showToast(result.error); setSaving(false); return; }
        const items = await fetch('/api/marketing/coupons').then(r => r.json());
        setCoupons((Array.isArray(items) ? items : []) as MarketingCouponDto[]);
        setShowCreateCoupon(false);
        setCouponForm({ code: '', type: 'percentage', value: 0, scope: 'global', rules: { minOrderAmount: 0, maxUsesPerUser: 1 } });
        showToast('Coupon created!'); setSaving(false);
    };

    const createEmail = async () => {
        if (!canMutate) return;
        setSaving(true);
        const res = await fetch('/api/marketing/email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(emailForm) });
        const result = await res.json();
        if (result.error) { showToast(result.error); setSaving(false); return; }
        const items = await fetch('/api/marketing/email').then(r => r.json());
        setEmails((Array.isArray(items) ? items : []) as MarketingEmailDto[]);
        setShowCreateEmail(false);
        setEmailForm({ subject: '', previewText: '', templateId: 'blank', status: 'draft', audience: { type: 'all' } });
        showToast('Email Campaign created!'); setSaving(false);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
    );

    const NAV_ITEMS: { id: MarketingSection; label: string; icon: LucideIcon }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'content', label: 'Content Studio', icon: FileText },
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'social', label: 'Social Hub', icon: Share2 },
        { id: 'ads', label: 'Ad Manager', icon: BarChart3 },
        { id: 'leads', label: 'Leads & CRM', icon: Users },
        { id: 'coupons', label: 'Coupons', icon: Ticket },
        { id: 'email', label: 'Email Marketing', icon: Mail },
    ];

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: Record<string, string> = {
            draft: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
            active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        };
        const style = colors[status.toLowerCase()] || colors.draft;
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${style}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden">
            {toast && (
                <div className="fixed bottom-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm z-50 flex items-center gap-2">
                    <CheckCircle2 size={16} /> {toast}
                </div>
            )}

            {/* Left Sidebar */}
            <div className="w-64 border-r border-[#1a1a24] bg-[#0c0c14] flex flex-col p-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Marketing Suite</div>
                <nav className="flex-1 space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = section === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setSection(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
                                    }`}
                            >
                                <Icon size={18} className={isActive ? 'text-amber-500' : 'text-slate-500'} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-black p-8">
                <div className="mb-6">
                    <ScopedReadOnlyNotice
                        visible={!canMutate && isScopedRoleView}
                        message="Read-only scoped view is active. Marketing create/update actions are disabled for this role context."
                    />
                </div>
                {/* ─── DASHBOARD ─── */}
                {section === 'dashboard' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h2 className="text-xl font-bold text-white">Marketing Overview</h2>
                                <p className="text-xs text-slate-400 mt-1">Multi-channel performance and lead velocity.</p>
                            </div>
                        </div>

                        {/* Top Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard title="Active Campaigns" value={analytics?.activeCampaigns || 0} trend="+2 this week" icon={<Megaphone size={16} />} type="neutral" />
                            <StatCard title="Total Leads (30d)" value={analytics?.newLeads30d || 0} trend="+15% MoM" icon={<Users size={16} />} type="increase" />
                            <StatCard title="Total Spend" value="$0.00" trend="On budget" icon={<BarChart3 size={16} />} type="neutral" />
                            <StatCard title="ROAS (Avg)" value="0.0x" trend="Need more data" icon={<Globe size={16} />} type="decrease" />
                        </div>

                        {/* Pipeline Visualization */}
                        <div className="bg-[#0c0c14] border border-slate-800 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-6">Marketing-to-Sales Pipeline</h3>
                            <div className="flex h-32 gap-2">
                                {MOCK_PIPELINE.map((stage, i) => {
                                    const percentage = (stage.current / stage.target) * 100;
                                    const w = 100 - (i * 15); // Funnel effect width
                                    return (
                                        <div key={stage.name} className="flex-1 flex flex-col justify-end group">
                                            <div className="text-center mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="text-[10px] text-slate-400">Conversion</div>
                                                <div className="text-xs font-bold text-white">{i === 0 ? '-' : '24%'}</div>
                                            </div>
                                            <div
                                                className={`w-full bg-slate-800/50 rounded-t-sm border-x border-t border-slate-700 relative`}
                                                style={{ height: '100%', clipPath: `polygon(0 0, 100% 0, ${100 - (w / 2)}% 100%, ${w / 2}% 100%)` }}
                                            >
                                                <div
                                                    className={`absolute bottom-0 w-full rounded-t-sm transition-all duration-1000 ${stage.color === 'emerald' ? 'bg-emerald-500/40 border-emerald-500/60' :
                                                        stage.color === 'blue' ? 'bg-blue-500/40 border-blue-500/60' :
                                                            stage.color === 'amber' ? 'bg-amber-500/40 border-amber-500/60' :
                                                                stage.color === 'purple' ? 'bg-purple-500/40 border-purple-500/60' :
                                                                    'bg-rose-500/40 border-rose-500/60'
                                                        } border-t`}
                                                    style={{ height: `${percentage}%` }}
                                                />
                                            </div>
                                            <div className="text-center mt-3">
                                                <div className="text-xs font-bold text-slate-300">{stage.name}</div>
                                                <div className="text-lg font-mono text-white mt-1">{stage.current.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── CONTENT STUDIO ─── */}
                {section === 'content' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Content Studio</h2>
                                <p className="text-xs text-slate-400 mt-1">Design banners, ad creatives, and social assets (Brand Locked by default).</p>
                            </div>
                            {canMutate ? (
                                <button onClick={() => setShowCreateContent(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">
                                    <Plus size={14} /> New Asset
                                </button>
                            ) : null}
                        </div>

                        {contentItems.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 text-sm">
                                <FileText size={32} className="mx-auto mb-3 opacity-30" />
                                No assets created yet. Click New Asset to start designing.
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                {contentItems.map((item, index) => (
                                    <div key={String(item._id || `content-${index}`)} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors group cursor-pointer">
                                        <div className="aspect-square bg-slate-800/50 flex items-center justify-center relative">
                                            {item.thumbnailUrl ? (
                                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs text-slate-500 uppercase tracking-widest">{item.dimensions?.width}x{item.dimensions?.height}</span>
                                            )}
                                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-[9px] px-2 py-1 rounded text-white font-mono uppercase">
                                                {item.type}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-[10px] text-slate-500 capitalize">{item.platform}</span>
                                                <StatusBadge status={item.status || 'draft'} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create Content Modal */}
                        {showCreateContent && canMutate && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                <div className="bg-[#0c0c14] border border-slate-800 rounded-xl w-[400px] p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Create New Asset</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Asset Name</label>
                                            <input value={contentForm.title} onChange={e => setContentForm({ ...contentForm, title: e.target.value })}
                                                className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="e.g. Summer Sale Feed Post" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Asset Type</label>
                                                <select value={contentForm.type} onChange={e => setContentForm({ ...contentForm, type: e.target.value })}
                                                    className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                                                    <option value="banner">Banner</option>
                                                    <option value="social_post">Social Post</option>
                                                    <option value="ad_creative">Ad Creative</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-400 mb-1">Target Platform</label>
                                                <select value={contentForm.platform} onChange={e => setContentForm({ ...contentForm, platform: e.target.value })}
                                                    className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm">
                                                    <option value="instagram">Instagram</option>
                                                    <option value="facebook">Facebook</option>
                                                    <option value="linkedin">LinkedIn</option>
                                                    <option value="google_ads">Google Ads</option>
                                                    <option value="website">Website</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3">
                                            <CheckCircle2 size={16} className="text-amber-500 shrink-0 mt-0.5" />
                                            <div className="text-[10px] text-amber-500 leading-tight">
                                                This asset will be generated using your active Brand Kit (colors, fonts, logo) automatically.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-6 justify-end">
                                        <button onClick={() => setShowCreateContent(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={createContent} disabled={saving || !contentForm.title}
                                            className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
                                            {saving ? 'Creating...' : 'Open Editor'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}


                {/* ─── CAMPAIGNS ─── */}
                {section === 'campaigns' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Campaigns</h2>
                                <p className="text-xs text-slate-400 mt-1">Manage multi-channel marketing campaigns.</p>
                            </div>
                            {canMutate ? (
                                <button onClick={() => setShowCreateCampaign(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">
                                    <Plus size={14} /> New Campaign
                                </button>
                            ) : null}
                        </div>

                        {campaigns.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 text-sm">
                                <Megaphone size={32} className="mx-auto mb-3 opacity-30" />
                                No campaigns running.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {campaigns.map((camp, index) => (
                                    <div key={String(camp._id || `campaign-${index}`)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-sm font-bold text-white">{camp.name}</h4>
                                                <StatusBadge status={camp.status || 'draft'} />
                                            </div>
                                            <div className="flex items-center gap-4 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                                                <span>Budget: ${camp.budget?.total}</span>
                                                <span className="flex gap-1">
                                                    Channels: {camp.channels?.join(', ') || 'None'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-500">Spend</div>
                                                <div className="text-sm font-mono text-white">${camp.performance?.spend || 0}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-500">Impressions</div>
                                                <div className="text-sm font-mono text-white">{camp.performance?.impressions || 0}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-[10px] text-slate-500">Clicks</div>
                                                <div className="text-sm font-mono text-white">{camp.performance?.clicks || 0}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create Campaign Modal */}
                        {showCreateCampaign && canMutate && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                <div className="bg-[#0c0c14] border border-slate-800 rounded-xl w-[500px] p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">New Campaign Setup</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Campaign Name</label>
                                            <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
                                                className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="e.g. Q3 New Product Launch" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-2">Target Channels</label>
                                            <div className="flex gap-2">
                                                {['Google Ads', 'Meta Ads', 'LinkedIn', 'Email'].map(ch => (
                                                    <label key={ch} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded px-3 py-1.5 cursor-pointer hover:border-slate-600">
                                                        <input type="checkbox" className="accent-amber-500"
                                                            checked={campaignForm.channels.includes(ch)}
                                                            onChange={(e) => {
                                                                const updated = e.target.checked
                                                                    ? [...campaignForm.channels, ch]
                                                                    : campaignForm.channels.filter((c: string) => c !== ch);
                                                                setCampaignForm({ ...campaignForm, channels: updated });
                                                            }}
                                                        />
                                                        <span className="text-xs text-white">{ch}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Total Budget (USD)</label>
                                            <input type="number" value={campaignForm.budget.total} onChange={e => setCampaignForm({ ...campaignForm, budget: { ...campaignForm.budget, total: Number(e.target.value) } })}
                                                className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="1000" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-6 justify-end">
                                        <button onClick={() => setShowCreateCampaign(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={createCampaign} disabled={saving || !campaignForm.name}
                                            className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
                                            {saving ? 'Creating...' : 'Create Campaign'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── SOCIAL HUB ─── */}
                {section === 'social' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Social Hub</h2>
                                <p className="text-xs text-slate-400 mt-1">Connect accounts and schedule posts.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-5 gap-3">
                            {['instagram', 'facebook', 'linkedin', 'twitter', 'youtube'].map((platform) => {
                                const isConnected = socialAccounts[platform]?.connected;
                                return (
                                    <div key={platform} className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors ${isConnected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-slate-800'}`}>
                                        <div className="capitalize text-sm font-bold text-white mb-2">{platform}</div>
                                        {isConnected ? (
                                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12} /> Connected</div>
                                        ) : (
                                            canMutate ? (
                                                <button className="text-[10px] bg-slate-800 text-white px-3 py-1 rounded hover:bg-slate-700">Connect</button>
                                            ) : (
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Read-only</div>
                                            )
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="mt-8">
                            <h3 className="text-sm font-bold text-white mb-4">Scheduled Posts</h3>
                            {posts.length === 0 ? (
                                <div className="text-center py-10 text-slate-500 text-sm border border-slate-800 border-dashed rounded-xl">
                                    No upcoming content scheduled.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {posts.map((p, index) => (
                                        <div key={String(p._id || `post-${index}`)} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <div className="text-xs font-bold text-white">{p.content}</div>
                                                <div className="text-[10px] text-slate-500">Platforms: {p.platforms?.join(', ')}</div>
                                            </div>
                                            <StatusBadge status={p.status || 'draft'} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── AD MANAGER ─── */}
                {section === 'ads' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Ad Manager Connections</h2>
                                <p className="text-xs text-slate-400 mt-1">Connect your ad accounts to push campaigns and pull analytics.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Google Ads */}
                            <div className="bg-[#0c0c14] border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                                            <img src="https://www.gstatic.com/images/branding/product/1x/ads_24dp.png" alt="Google Ads" className="w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Google Ads</h3>
                                            <div className="text-[10px] text-slate-500">Search, Display, YouTube</div>
                                        </div>
                                    </div>
                                    <StatusBadge status={adAccounts.google?.status || 'disconnected'} />
                                </div>
                                {adAccounts.google?.connected ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">Customer ID</span>
                                            <span className="font-mono text-slate-300">{adAccounts.google.customerId}</span>
                                        </div>
                                        {canMutate ? (
                                            <button className="text-xs text-rose-400 hover:text-rose-300 mt-2 font-bold">Disconnect</button>
                                        ) : (
                                            <div className="text-xs text-slate-500 mt-2 font-bold">Read-only mode</div>
                                        )}
                                    </div>
                                ) : (
                                    canMutate ? (
                                        <button className="w-full py-2 bg-[#4285F4] hover:bg-[#3367D6] text-white rounded-lg text-sm font-bold transition-colors">
                                            Sign in with Google
                                        </button>
                                    ) : (
                                        <div className="text-xs text-slate-500">Read-only mode</div>
                                    )
                                )}
                            </div>

                            {/* Meta Ads */}
                            <div className="bg-[#0c0c14] border border-slate-800 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#1877F2] rounded-lg flex items-center justify-center text-white">
                                            <span className="font-bold text-xl leading-none">f</span>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Meta Ads</h3>
                                            <div className="text-[10px] text-slate-500">Facebook, Instagram</div>
                                        </div>
                                    </div>
                                    <StatusBadge status={adAccounts.meta?.status || 'disconnected'} />
                                </div>
                                {adAccounts.meta?.connected ? (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">Business ID</span>
                                            <span className="font-mono text-slate-300">{adAccounts.meta.businessId}</span>
                                        </div>
                                        <div className="flex justify-between text-xs border-b border-slate-800 pb-2">
                                            <span className="text-slate-500">Ad Account</span>
                                            <span className="font-mono text-slate-300">{adAccounts.meta.adAccountId}</span>
                                        </div>
                                        {canMutate ? (
                                            <button className="text-xs text-rose-400 hover:text-rose-300 mt-2 font-bold">Disconnect</button>
                                        ) : (
                                            <div className="text-xs text-slate-500 mt-2 font-bold">Read-only mode</div>
                                        )}
                                    </div>
                                ) : (
                                    canMutate ? (
                                        <button className="w-full py-2 bg-[#1877F2] hover:bg-[#166FE5] text-white rounded-lg text-sm font-bold transition-colors">
                                            Connect Meta Account
                                        </button>
                                    ) : (
                                        <div className="text-xs text-slate-500">Read-only mode</div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── LEADS & CRM ─── */}
                {section === 'leads' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Leads & CRM</h2>
                                <p className="text-xs text-slate-400 mt-1">Manage inbound leads and track sales conversions.</p>
                            </div>
                            {canMutate ? (
                                <button onClick={() => setShowCreateLead(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">
                                    <Plus size={14} /> Add Lead
                                </button>
                            ) : null}
                        </div>

                        {leads.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 text-sm">
                                <Users size={32} className="mx-auto mb-3 opacity-30" />
                                No leads yet. Leads captured from forms and ads will appear here.
                            </div>
                        ) : (
                            <div className="bg-[#0c0c14] border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 border-b border-slate-800 text-xs uppercase tracking-widest text-slate-500">
                                        <tr>
                                            <th className="px-4 py-3">Name</th>
                                            <th className="px-4 py-3">Contact</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Source</th>
                                            <th className="px-4 py-3">Added</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {leads.map((l, index) => (
                                            <tr key={String(l._id || `lead-${index}`)} className="hover:bg-slate-900/50">
                                                <td className="px-4 py-3 font-medium text-white">{l.name}</td>
                                                <td className="px-4 py-3">
                                                    <div className="text-xs">{l.email}</div>
                                                    <div className="text-[10px] text-slate-500">{l.phone}</div>
                                                </td>
                                                <td className="px-4 py-3"><StatusBadge status={l.status || 'new'} /></td>
                                                <td className="px-4 py-3 text-xs capitalize">{l.source?.type}</td>
                                                <td className="px-4 py-3 text-xs">{l.createdAt ? new Date(l.createdAt).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Add Lead Modal */}
                        {showCreateLead && canMutate && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                <div className="bg-[#0c0c14] border border-slate-800 rounded-xl w-[400px] p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">Add Manual Lead</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                                            <input value={leadForm.name} onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                                className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="John Doe" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Email</label>
                                            <input type="email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                                className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="john@example.com" />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-400 mb-1">Phone</label>
                                            <input value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                                className="w-full bg-black border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" placeholder="+1 555-0000" />
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-5 justify-end">
                                        <button onClick={() => setShowCreateLead(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={createLead} disabled={saving || (!leadForm.name && !leadForm.email)}
                                            className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
                                            {saving ? 'Saving...' : 'Add Lead'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── COUPONS ─── */}
                {section === 'coupons' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Coupons & Promos</h2>
                                <p className="text-xs text-slate-400 mt-1">Create discount codes for eCommerce and Checkout links.</p>
                            </div>
                            {canMutate ? (
                                <button onClick={() => setShowCreateCoupon(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">
                                    <Plus size={14} /> Create Coupon
                                </button>
                            ) : null}
                        </div>

                        {coupons.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 text-sm">
                                <Ticket size={32} className="mx-auto mb-3 opacity-30" />
                                No coupons created.
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-4">
                                {coupons.map((c, index) => (
                                    <div key={String(c._id || `coupon-${index}`)} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="px-2 py-1 bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded font-mono font-bold text-sm tracking-widest uppercase">
                                                    {c.code}
                                                </div>
                                                <StatusBadge status={c.status || 'active'} />
                                            </div>
                                            <div className="text-lg font-bold text-white">
                                                {c.type === 'percentage' ? `${c.value}% OFF` : c.type === 'free_shipping' ? 'Free Shipping' : `$${c.value} OFF`}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Scope: {c.scope}</div>
                                            {c.expiresAt && <div className="text-[10px] text-rose-400 mt-0.5">Expires: {new Date(c.expiresAt).toLocaleDateString()}</div>}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between text-xs text-slate-400">
                                            <span>Uses: {c.usedCount || 0}{c.maxUses ? `/${c.maxUses}` : ''}</span>
                                            <span>Min Order: ${c.rules?.minOrderAmount || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create Coupon Modal */}
                        {showCreateCoupon && canMutate && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                <div className="bg-[#0c0c14] border border-slate-800 rounded-xl w-[520px] p-6 max-h-[90vh] overflow-y-auto">
                                    <h3 className="text-lg font-bold text-white mb-4">Create Promo Code</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Coupon Code</label>
                                            <input value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                                className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono uppercase focus:border-amber-500 outline-none" placeholder="e.g. SUMMER2024" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Discount Type</label>
                                                <select value={couponForm.type} onChange={e => setCouponForm({ ...couponForm, type: e.target.value })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:border-amber-500 outline-none">
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="flat">Fixed Amount</option>
                                                    <option value="free_shipping">Free Shipping</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
                                                    {couponForm.type === 'free_shipping' ? 'Value (N/A)' : couponForm.type === 'percentage' ? 'Percentage (%)' : 'Amount'}
                                                </label>
                                                <input type="number" value={couponForm.value} onChange={e => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                                                    disabled={couponForm.type === 'free_shipping'}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none disabled:opacity-40" min="0" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Scope</label>
                                                <select value={couponForm.scope} onChange={e => setCouponForm({ ...couponForm, scope: e.target.value })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:border-amber-500 outline-none">
                                                    <option value="global">Global (all products)</option>
                                                    <option value="firstOrder">First Order Only</option>
                                                    <option value="product">Specific Products</option>
                                                    <option value="category">Specific Category</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Max Uses (total)</label>
                                                <input type="number" value={couponForm.maxUses || ''} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value ? Number(e.target.value) : undefined })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" placeholder="Unlimited" min="1" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Start Date</label>
                                                <input type="date" value={couponForm.startsAt || ''} onChange={e => setCouponForm({ ...couponForm, startsAt: e.target.value || undefined })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Expiry Date</label>
                                                <input type="date" value={couponForm.expiresAt || ''} onChange={e => setCouponForm({ ...couponForm, expiresAt: e.target.value || undefined })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Minimum Order ($)</label>
                                                <input type="number" value={couponForm.rules.minOrderAmount} onChange={e => setCouponForm({ ...couponForm, rules: { ...couponForm.rules, minOrderAmount: Number(e.target.value) } })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" min="0" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Max Uses Per User</label>
                                                <input type="number" value={couponForm.rules.maxUsesPerUser} onChange={e => setCouponForm({ ...couponForm, rules: { ...couponForm.rules, maxUsesPerUser: Number(e.target.value) } })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" min="1" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-5 justify-end">
                                        <button onClick={() => setShowCreateCoupon(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={createCoupon} disabled={saving || !couponForm.code || (couponForm.type !== 'free_shipping' && couponForm.value <= 0)}
                                            className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
                                            {saving ? 'Creating...' : 'Create Coupon'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── EMAIL MARKETING ─── */}
                {section === 'email' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">Email Marketing</h2>
                                <p className="text-xs text-slate-400 mt-1">Send targeted email campaigns using your brand templates.</p>
                            </div>
                            {canMutate ? (
                                <button onClick={() => setShowCreateEmail(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-bold hover:bg-amber-400">
                                    <Plus size={14} /> New Campaign
                                </button>
                            ) : null}
                        </div>

                        {emails.length === 0 ? (
                            <div className="text-center py-16 text-slate-500 text-sm">
                                <Mail size={32} className="mx-auto mb-3 opacity-30" />
                                No email campaigns yet. Create your first broadcast or drip campaign.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {emails.map((e, index) => (
                                    <div key={String(e._id || `email-${index}`)} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                                        <div className="flex flex-col gap-1 w-full">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-sm font-bold text-white max-w-lg truncate">{e.subject || 'Untitled'}</h4>
                                                    <StatusBadge status={e.status || 'draft'} />
                                                </div>
                                                <div className="flex items-center gap-6 text-center">
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Sent</div>
                                                        <div className="text-sm font-mono text-white mt-0.5">{e.stats?.sent || 0}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Open Rate</div>
                                                        <div className="text-sm font-mono text-blue-400 mt-0.5">{e.stats?.sent ? Math.round((((e.stats?.opened ?? 0)) / e.stats.sent) * 100) : 0}%</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Click Rate</div>
                                                        <div className="text-sm font-mono text-emerald-400 mt-0.5">{e.stats?.sent ? Math.round((((e.stats?.clicked ?? 0)) / e.stats.sent) * 100) : 0}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-500 truncate max-w-lg">{e.previewText}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Create Email Modal */}
                        {showCreateEmail && canMutate && (
                            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                                <div className="bg-[#0c0c14] border border-slate-800 rounded-xl w-[520px] p-6">
                                    <h3 className="text-lg font-bold text-white mb-4">New Email Campaign</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Subject Line</label>
                                            <input value={emailForm.subject} onChange={e => setEmailForm({ ...emailForm, subject: e.target.value })}
                                                className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" placeholder="e.g. 50% Off Summer Sale" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Preview Text</label>
                                            <input value={emailForm.previewText} onChange={e => setEmailForm({ ...emailForm, previewText: e.target.value })}
                                                className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none" placeholder="Catchy preview message..." />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Template</label>
                                                <select value={emailForm.templateId} onChange={e => setEmailForm({ ...emailForm, templateId: e.target.value })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:border-amber-500 outline-none">
                                                    <option value="blank">Blank Theme</option>
                                                    <option value="newsletter">Newsletter</option>
                                                    <option value="promotion">Promo / Sale</option>
                                                    <option value="welcome">Welcome Flow</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">Audience</label>
                                                <select value={emailForm.audience.type} onChange={e => setEmailForm({ ...emailForm, audience: { type: e.target.value } })}
                                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm appearance-none focus:border-amber-500 outline-none">
                                                    <option value="all">All Subscribers</option>
                                                    <option value="customers">Customers Only</option>
                                                    <option value="leads">Leads (Non-Customers)</option>
                                                    <option value="segment">Custom Segment</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-5 justify-end">
                                        <button onClick={() => setShowCreateEmail(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                                        <button onClick={createEmail} disabled={saving || !emailForm.subject}
                                            className="px-4 py-2 bg-amber-500 text-black rounded-lg text-sm font-bold hover:bg-amber-400 disabled:opacity-50">
                                            {saving ? 'Creating...' : 'Create Email'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
