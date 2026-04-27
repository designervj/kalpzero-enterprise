'use client';

import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import {
  ShoppingBag,
  Truck,
  Folder,
  FileText,
  Image,
  Users,
  Receipt,
  ArrowRight,
  TrendingUp,
  Calendar,
  MapPin,
  Wand2,
  Globe,
  LayoutDashboard,
  Palette,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Badge } from '@/components/ui/badge';
import {
  applyWorkspaceItemCustomization,
  mergeAdminWorkspace,
} from '@/lib/admin-workspace';
import { colorMap, DashboardSummary, KpiCard } from './dashboardType';
import { useTheme } from '@/components/providers/theme-provider';

type DashboardQuickAction = {
  id: string;
  icon: ElementType;
  iconClass: string;
  label: string;
  href: string;
  description: string;
};

type DashboardWidgetCard = {
  id: string;
  label: string;
  element: ReactNode;
};

function hasModule(data: DashboardSummary | null, moduleKey: string): boolean {
  if (!data) return false;
  if (!Array.isArray(data.enabledModules) || data.enabledModules.length === 0) return true;
  return data.enabledModules.includes(moduleKey);
}

function toPluralFeedLabel(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  if (/[sxz]$/i.test(trimmed) || /sh$/i.test(trimmed) || /ch$/i.test(trimmed)) return trimmed;
  if (/[^aeiou]y$/i.test(trimmed)) return `${trimmed.slice(0, -1)}ies`;
  if (/s$/i.test(trimmed)) return trimmed;
  return `${trimmed}s`;
}

function humanizeToken(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;
  return trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function DashboardPage() {
  const auth = useAuth();
  const { themeMode } = useTheme();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const dashboardPanelClass = useMemo(() => 
    `rounded-[28px] border transition-all duration-300 backdrop-blur-xl ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-xl shadow-slate-200/50' 
        : 'border-slate-800/80 bg-slate-950/60 shadow-[0_24px_80px_-36px_rgba(34,211,238,0.35)]'
    }`, [themeMode]);

  const dashboardWidgetClass = useMemo(() => 
    `rounded-[28px] border transition-all duration-300 backdrop-blur-xl overflow-hidden ${
      themeMode === 'light' 
        ? 'border-slate-200 bg-white shadow-lg shadow-slate-200/40' 
        : 'border-slate-800/80 bg-slate-950/70 shadow-[0_24px_80px_-36px_rgba(34,211,238,0.32)]'
    }`, [themeMode]);

  const workspaceConfig = useMemo(
    () => mergeAdminWorkspace(auth.user?.adminWorkspace || null),
    [auth.user?.adminWorkspace],
  );

  useEffect(() => {
    fetch('/api/analytics/summary')
      .then(res => res.json())
      .then((payload: DashboardSummary) => setData(payload))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const vocabularyTerms = data?.vocabularyProfile?.terms || {};
  const productsOverride = data?.navigationOverrides?.['nav.products'];
  const ordersOverride = data?.navigationOverrides?.['nav.ecommerce.orders'];
  const productsLabel = productsOverride?.label || vocabularyTerms.catalogPlural || (data?.isTravelContext ? 'Travel Packages' : 'Products');
  const productsHref = productsOverride?.path || (data?.isTravelContext ? '/travel/packages' : '/ecommerce');
  const ordersLabel = ordersOverride?.label || vocabularyTerms.orders || 'Orders';
  const ordersHref = ordersOverride?.path || '/ecommerce/orders';
  const recentOrdersHeading = `Recent ${toPluralFeedLabel(ordersLabel, 'Orders')}`;
  const emptyOrdersText = `No ${toPluralFeedLabel(ordersLabel, 'orders').toLowerCase()} yet`;
  const productsValue = data?.isTravelContext ? data?.packageCount || 0 : data?.productCount || 0;
  const homeConfig = workspaceConfig.dashboardHome;
  const pageTitle = homeConfig.headline || `${data?.tenantName || 'Workspace'} Dashboard`;
  const pageSubtitle =
    homeConfig.subheadline ||
    (auth.user?.provisioningMode === 'full_tenant'
      ? 'Real-time metrics from your isolated tenant database'
      : 'Shared admin workspace with tenant-scoped metrics and modules');
  const planLabel = humanizeToken(data?.subscriptionLevel, 'Starter');
  const businessTypeLabel = humanizeToken(data?.businessType, 'Workspace');
  const layoutLabel = humanizeToken(homeConfig.layout, 'Default');
  const runtimeLabel =
    auth.user?.provisioningMode === 'full_tenant'
      ? 'Isolated tenant runtime'
      : 'Shared admin runtime';
  const enabledModulesLabel =
    data?.enabledModules && data.enabledModules.length > 0
      ? `${data.enabledModules.length} active modules`
      : 'Adaptive module set';
  const summaryPills = [
    { label: 'Plan', value: planLabel },
    { label: 'Business', value: businessTypeLabel },
    { label: 'Runtime', value: runtimeLabel },
    { label: 'Modules', value: enabledModulesLabel },
  ];

  const kpis = useMemo(() => {
    if (!data) return [] as Array<KpiCard & { id: string }>;

    const cards: Array<KpiCard & { id: string }> = [];

    if (hasModule(data, 'products')) {
      cards.push({ id: 'kpi.products', icon: ShoppingBag, label: productsLabel, value: productsValue, color: 'cyan', href: productsHref });
    }
    if (hasModule(data, 'ecommerce')) {
      cards.push({ id: 'kpi.orders', icon: Truck, label: ordersLabel, value: data.orderCount || 0, color: 'amber', href: ordersHref });
      cards.push({ id: 'kpi.revenue', icon: TrendingUp, label: 'Revenue', value: `$${(data.revenue || 0).toFixed(2)}`, color: 'emerald', href: ordersHref });
    }
    if (hasModule(data, 'bookings') && !hasModule(data, 'ecommerce')) {
      cards.push({ id: 'kpi.bookings', icon: Calendar, label: 'Bookings', value: data.bookingCount || 0, color: 'amber', href: '/bookings' });
    }
    if (hasModule(data, 'portfolio')) {
      cards.push({ id: 'kpi.portfolio', icon: Folder, label: 'Portfolio', value: data.portfolioCount || 0, color: 'purple', href: '/portfolio' });
    }
    if (hasModule(data, 'blog')) {
      cards.push({ id: 'kpi.blog', icon: FileText, label: 'Blog Posts', value: data.blogCount || 0, color: 'rose', href: '/blog' });
    }
    if (hasModule(data, 'media')) {
      cards.push({ id: 'kpi.media', icon: Image, label: 'Media', value: data.mediaCount || 0, color: 'sky', href: '/media' });
    }

    cards.push({ id: 'kpi.users', icon: Users, label: 'Users', value: data.userCount || 0, color: 'violet', href: '/users' });

    if (hasModule(data, 'invoicing')) {
      cards.push({ id: 'kpi.invoices', icon: Receipt, label: 'Invoices', value: data.invoiceCount || 0, color: 'orange', href: '/invoices' });
    }

    return applyWorkspaceItemCustomization(cards, {
      order: homeConfig.kpiOrder,
      hidden: homeConfig.hiddenKpis,
      labelOverrides: homeConfig.labelOverrides,
    });
  }, [data, homeConfig.hiddenKpis, homeConfig.kpiOrder, homeConfig.labelOverrides, ordersHref, ordersLabel, productsHref, productsLabel, productsValue]);

  const quickActions = useMemo(
    () =>
      applyWorkspaceItemCustomization<DashboardQuickAction>(
        [
          {
            id: 'quick.front-builder',
            icon: Wand2,
            iconClass: themeMode === 'light' ? 'text-indigo-600' : 'text-cyan-400',
            label: 'Open Front Builder',
            href: '/front-builder',
            description: 'Create or edit tenant landing pages with templates, blocks, and HTML import.',
          },
          {
            id: 'quick.pages',
            icon: FileText,
            iconClass: themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400',
            label: 'Manage Website Pages',
            href: '/pages',
            description: 'See all pages, statuses, previews, and open any page directly in Front Builder.',
          },
          {
            id: 'quick.discover',
            icon: Globe,
            iconClass: themeMode === 'light' ? 'text-amber-600' : 'text-amber-400',
            label: 'View Discovery Front',
            href: '/discover',
            description: 'Open the public discovery routes and verify frontend listing visibility and SEO pages.',
          },
        ],
        {
          order: homeConfig.quickActionOrder,
          hidden: homeConfig.hiddenQuickActions,
          labelOverrides: homeConfig.labelOverrides,
        },
      ),
    [homeConfig.hiddenQuickActions, homeConfig.labelOverrides, homeConfig.quickActionOrder, themeMode],
  );

  const hasOrdersFeed = hasModule(data, 'ecommerce');
  const hasPostsFeed = hasModule(data, 'blog');
  const dashboardWidgets = useMemo(() => {
    const widgets: DashboardWidgetCard[] = [];
    if (hasOrdersFeed) {
      widgets.push({
        id: 'widget.orders',
        label: recentOrdersHeading,
        element: (
          <div className={dashboardWidgetClass}>
            <div className={`flex items-center justify-between gap-3 border-b px-6 py-4 transition-colors ${
              themeMode === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/90 bg-slate-950/40'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  themeMode === 'light' ? 'border-amber-200 bg-amber-50' : 'border-amber-500/30 bg-amber-500/10'
                }`}>
                  <Truck size={16} className={themeMode === 'light' ? 'text-amber-600' : 'text-amber-400'} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {homeConfig.labelOverrides['widget.orders'] || recentOrdersHeading}
                  </h3>
                  <p className="text-[11px] text-slate-500">Latest order activity from your workspace feed</p>
                </div>
              </div>
              <Link href={ordersHref} className={`text-[11px] font-semibold transition-colors ${
                themeMode === 'light' ? 'text-indigo-600 hover:text-indigo-700' : 'text-cyan-400 hover:text-cyan-300'
              }`}>View all →</Link>
            </div>
            <div className={`divide-y transition-colors ${themeMode === 'light' ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
              {(data?.recentOrders || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">{emptyOrdersText}</div>
              ) : (
                (data?.recentOrders || []).map((order, i) => (
                  <div key={i} className={`px-6 py-3 flex items-center justify-between transition-colors ${
                    themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20'
                  }`}>
                    <div>
                      <div className={`text-sm font-medium transition-colors ${
                        themeMode === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>{order.orderNumber || `ORD-${i + 1}`}</div>
                      <div className="text-xs text-slate-500">{order.customer?.name || 'Unknown customer'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold transition-colors ${
                        themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400'
                      }`}>${Number(order.total || 0).toFixed(2)}</div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
                        order.status === 'delivered' 
                          ? themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400' 
                          : order.status === 'pending' 
                            ? themeMode === 'light' ? 'text-amber-600' : 'text-amber-400' 
                            : themeMode === 'light' ? 'text-indigo-600' : 'text-cyan-400'
                      }`}>
                        {order.status || 'processing'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ),
      });
    }
    if (hasPostsFeed) {
      widgets.push({
        id: 'widget.posts',
        label: 'Recent Posts',
        element: (
          <div className={dashboardWidgetClass}>
            <div className={`flex items-center justify-between gap-3 border-b px-6 py-4 transition-colors ${
              themeMode === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/90 bg-slate-950/40'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  themeMode === 'light' ? 'border-emerald-200 bg-emerald-50' : 'border-emerald-500/30 bg-emerald-500/10'
                }`}>
                  <FileText size={16} className={themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400'} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {homeConfig.labelOverrides['widget.posts'] || 'Recent Posts'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Publishing items waiting for review or already live</p>
                </div>
              </div>
              <Link href="/blog" className={`text-[11px] font-semibold transition-colors ${
                themeMode === 'light' ? 'text-indigo-600 hover:text-indigo-700' : 'text-cyan-400 hover:text-cyan-300'
              }`}>View all →</Link>
            </div>
            <div className={`divide-y transition-colors ${themeMode === 'light' ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
              {(data?.recentPosts || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No posts yet</div>
              ) : (
                (data?.recentPosts || []).map((post, i) => (
                  <div key={i} className={`px-6 py-3 flex items-center justify-between transition-colors ${
                    themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20'
                  }`}>
                    <div>
                      <div className={`text-sm font-medium transition-colors ${
                        themeMode === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>{post.title || `Post ${i + 1}`}</div>
                      <div className="text-xs text-slate-500">{post.category || 'General'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border transition-all ${
                      post.status === 'published' 
                        ? themeMode === 'light' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                        : themeMode === 'light' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {post.status || 'draft'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ),
      });
    }
    if (data?.isTravelContext && hasModule(data, 'products')) {
      widgets.push({
        id: 'widget.packages',
        label: 'Recent Packages',
        element: (
          <div className={dashboardWidgetClass}>
            <div className={`flex items-center justify-between gap-3 border-b px-6 py-4 transition-colors ${
              themeMode === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/90 bg-slate-950/40'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${
                  themeMode === 'light' ? 'border-indigo-200 bg-indigo-50' : 'border-cyan-500/30 bg-cyan-500/10'
                }`}>
                  <MapPin size={16} className={themeMode === 'light' ? 'text-indigo-600' : 'text-cyan-400'} />
                </div>
                <div>
                  <h3 className={`text-sm font-bold uppercase tracking-wider transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>
                    {homeConfig.labelOverrides['widget.packages'] || 'Recent Packages'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Travel inventory and pricing surfaced from the latest package data</p>
                </div>
              </div>
              <Link href={productsHref} className={`text-[11px] font-semibold transition-colors ${
                themeMode === 'light' ? 'text-indigo-600 hover:text-indigo-700' : 'text-cyan-400 hover:text-cyan-300'
              }`}>View all →</Link>
            </div>
            <div className={`divide-y transition-colors ${themeMode === 'light' ? 'divide-slate-100' : 'divide-slate-800/50'}`}>
              {(data?.recentPackages || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No packages yet</div>
              ) : (
                (data?.recentPackages || []).map((pkg, i) => (
                  <div key={pkg.slug || i} className={`px-6 py-3 flex items-center justify-between transition-colors ${
                    themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-800/20'
                  }`}>
                    <div>
                      <div className={`text-sm font-medium transition-colors ${
                        themeMode === 'light' ? 'text-slate-900' : 'text-white'
                      }`}>{pkg.title || `Package ${i + 1}`}</div>
                      <div className="text-xs text-slate-500">{pkg.destination || 'Unknown destination'}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold transition-colors ${
                        themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400'
                      }`}>
                        {(pkg.price?.currency || 'INR')} {Number(pkg.price?.amount || 0).toLocaleString()}
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold transition-colors ${
                        pkg.status === 'published' 
                          ? themeMode === 'light' ? 'text-emerald-600' : 'text-emerald-400' 
                          : themeMode === 'light' ? 'text-amber-600' : 'text-amber-400'
                      }`}>
                        {pkg.status || 'draft'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ),
      });
    }
    return applyWorkspaceItemCustomization(widgets, {
      order: homeConfig.widgetOrder,
      hidden: homeConfig.hiddenWidgets,
      labelOverrides: homeConfig.labelOverrides,
    });
  }, [data, emptyOrdersText, hasOrdersFeed, hasPostsFeed, homeConfig.hiddenWidgets, homeConfig.labelOverrides, homeConfig.widgetOrder, ordersHref, productsHref, recentOrdersHeading, themeMode, dashboardWidgetClass]);

  const layoutClasses = useMemo(() => {
    switch (homeConfig.layout) {
      case 'focus':
        return {
          hero: 'lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:items-start gap-6',
          quickActions: 'grid-cols-1 md:grid-cols-2',
          kpis: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3',
          widgets: 'grid-cols-1',
        };
      case 'split':
        return {
          hero: 'lg:grid lg:grid-cols-[1fr_1fr] lg:items-start gap-6',
          quickActions: 'grid-cols-1 md:grid-cols-3',
          kpis: 'grid-cols-2 md:grid-cols-4',
          widgets: dashboardWidgets.length > 1 ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1',
        };
      default:
        return {
          hero: '',
          quickActions: 'grid-cols-1 md:grid-cols-3',
          kpis: 'grid-cols-2 md:grid-cols-4',
          widgets: hasOrdersFeed && hasPostsFeed ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1',
        };
    }
  }, [dashboardWidgets.length, hasOrdersFeed, hasPostsFeed, homeConfig.layout]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-20">
        <div className={`h-8 w-8 rounded-full border-2 animate-spin ${
          themeMode === 'light' ? 'border-indigo-200 border-t-indigo-600' : 'border-cyan-500/30 border-t-cyan-500'
        }`}></div>
        <span className={`font-mono text-xs uppercase tracking-widest ${
          themeMode === 'light' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Loading workspace analytics...
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-8 animate-in fade-in duration-500 transition-colors ${
      themeMode === 'light' ? 'text-slate-900' : 'text-slate-100'
    }`}>
      <div className={layoutClasses.hero}>
        <div className={`${dashboardPanelClass} relative overflow-hidden p-6 md:p-7`}>
          <div className={`absolute inset-0 transition-opacity duration-500 ${
            themeMode === 'light' ? 'opacity-[0.03] bg-gradient-to-br from-indigo-500 to-blue-500' : 'bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(129,140,248,0.16),transparent_38%)]'
          }`} />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
              <div className="flex gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all ${
                  themeMode === 'light' 
                    ? 'border-indigo-100 bg-indigo-50 text-indigo-600 shadow-sm' 
                    : 'border-cyan-500/30 bg-slate-800/70 text-cyan-400 shadow-[0_0_20px_rgba(14,165,233,0.25)]'
                }`}>
                  <LayoutDashboard size={22} />
                </div>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className={`border text-[10px] uppercase tracking-widest transition-colors ${
                      themeMode === 'light' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-700 bg-slate-800/80 text-slate-300'
                    }`}>
                      Workspace Home
                    </Badge>
                    <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Theme-ready command surface
                    </span>
                  </div>
                  <h2 className={`text-3xl font-bold tracking-tight transition-colors md:text-4xl ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>{pageTitle}</h2>
                  <p className={`mt-3 max-w-3xl text-sm leading-6 transition-colors md:text-[15px] ${
                    themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {pageSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/settings/admin-theme"
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-all ${
                    themeMode === 'light'
                      ? 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-indigo-300 hover:bg-slate-50'
                      : 'border-slate-700/80 bg-slate-950/85 text-slate-100 shadow-[0_18px_40px_-28px_rgba(14,165,233,0.45)] hover:border-cyan-400/40 hover:bg-slate-900/95 hover:text-white'
                  }`}
                >
                  <Palette size={14} />
                  Admin Theme
                </Link>
                <Link
                  href="/settings/admin-workspace"
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition-all ${
                    themeMode === 'light'
                      ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-sm hover:border-amber-300 hover:bg-amber-100'
                      : 'border-amber-500/30 bg-amber-500/12 text-amber-50 shadow-[0_18px_40px_-28px_rgba(217,119,6,0.48)] hover:border-amber-400/50 hover:bg-amber-500/18'
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  Workspace Customization
                </Link>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {summaryPills.map((item) => (
                <div key={item.label} className={`rounded-2xl border px-4 py-3 transition-all ${
                  themeMode === 'light' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800/80 bg-slate-950/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
                }`}>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.label}</p>
                  <p className={`mt-2 text-sm font-semibold transition-colors ${
                    themeMode === 'light' ? 'text-slate-900' : 'text-white'
                  }`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        {homeConfig.layout !== 'default' && (
          <div className={`${dashboardPanelClass} p-5`}>
            <div className="mb-3 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                themeMode === 'light' ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-violet-500/30 bg-violet-500/10 text-violet-300'
              }`}>
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Home Layout
                </div>
                <div className={`mt-1 text-sm font-semibold transition-colors ${
                  themeMode === 'light' ? 'text-slate-900' : 'text-white'
                }`}>{layoutLabel}</div>
              </div>
            </div>
            <p className={`text-xs leading-5 transition-colors ${
              themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              This dashboard is using the tenant workspace layout preset saved in Workspace Customization.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workspace controls</p>
            <h3 className={`mt-1 text-lg font-bold transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}>Quick Actions</h3>
          </div>
          <p className="text-xs text-slate-500">Operational shortcuts for editing, reviewing, and publishing.</p>
        </div>
        <div className={`grid gap-4 ${layoutClasses.quickActions}`}>
          {quickActions.map(({ id, icon: Icon, iconClass, label, href, description }) => (
            <Link
              key={id}
              href={href}
              className={`${dashboardPanelClass} group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 ${
                themeMode === 'light' ? 'hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5' : 'hover:border-cyan-500/40'
              }`}
            >
              {themeMode === 'dark' && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />}
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                  themeMode === 'light' ? 'border-slate-100 bg-slate-50' : 'border-white/10 bg-slate-950/90'
                } ${iconClass}`}>
                  <Icon size={18} />
                </div>
                <ArrowRight size={15} className={`mt-1 transition-colors ${
                  themeMode === 'light' ? 'text-slate-300 group-hover:text-indigo-600' : 'text-slate-600 group-hover:text-cyan-400'
                }`} />
              </div>
              <div className="mt-4">
                <div className={`text-sm font-semibold transition-colors ${
                  themeMode === 'light' ? 'text-slate-900' : 'text-white'
                }`}>{label}</div>
                <p className={`mt-2 text-xs leading-6 transition-colors ${
                  themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Live analytics</p>
            <h3 className={`mt-1 text-lg font-bold transition-colors ${
              themeMode === 'light' ? 'text-slate-900' : 'text-white'
            }`}>Key Workspace Signals</h3>
          </div>
          <p className="text-xs text-slate-500">These cards stay aligned with the current tenant vocabulary and enabled modules.</p>
        </div>
        <div className={`grid gap-4 ${layoutClasses.kpis}`}>
          {kpis.map(({ id, icon: Icon, label, value, color, href }) => {
            const c = colorMap[color] || colorMap.cyan;
            return (
              <Link
                key={id}
                href={href}
                className={`${dashboardPanelClass} group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 ${
                  themeMode === 'light' ? 'hover:border-slate-300' : `hover:border-slate-600 ${c.shadow}`
                }`}
              >
                {themeMode === 'dark' && <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />}
                <div className="flex items-center justify-between gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-all ${
                    themeMode === 'light' 
                      ? `border-slate-100 bg-slate-50 ${c.text}` 
                      : `${c.border} ${c.bg} ${c.text}`
                  }`}>
                    <Icon size={18} />
                  </div>
                  <Badge className={`border text-[10px] uppercase tracking-widest transition-colors ${
                    themeMode === 'light' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-700 bg-slate-800/80 text-slate-300'
                  }`}>
                    {label}
                  </Badge>
                </div>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <div>
                    <div className={`text-3xl font-black tracking-tight transition-colors ${
                      themeMode === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>{value}</div>
                    <p className="mt-2 text-xs text-slate-500">Open module details and underlying records.</p>
                  </div>
                  <ArrowRight size={14} className={`mb-1 transition-colors ${
                    themeMode === 'light' ? 'text-slate-300 group-hover:text-indigo-600' : 'text-slate-600 group-hover:text-cyan-400'
                  }`} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {dashboardWidgets.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Operational feed</p>
              <h3 className={`mt-1 text-lg font-bold transition-colors ${
                themeMode === 'light' ? 'text-slate-900' : 'text-white'
              }`}>Recent Activity</h3>
            </div>
            <p className="text-xs text-slate-500">Orders, posts, and packages are surfaced here using the current workspace schema.</p>
          </div>
          <div className={`grid gap-6 ${layoutClasses.widgets}`}>
            {dashboardWidgets.map((widget) => (
              <div key={widget.id}>{widget.element}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
