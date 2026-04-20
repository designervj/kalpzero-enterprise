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
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  applyWorkspaceItemCustomization,
  mergeAdminWorkspace,
} from '@/lib/admin-workspace';
import { colorMap, DashboardSummary, KpiCard } from './dashboardType';

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

export default function DashboardPage() {
  const auth = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
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
            iconClass: 'text-cyan-400',
            label: 'Open Front Builder',
            href: '/front-builder',
            description: 'Create or edit tenant landing pages with templates, blocks, and HTML import.',
          },
          {
            id: 'quick.pages',
            icon: FileText,
            iconClass: 'text-emerald-400',
            label: 'Manage Website Pages',
            href: '/pages',
            description: 'See all pages, statuses, previews, and open any page directly in Front Builder.',
          },
          {
            id: 'quick.discover',
            icon: Globe,
            iconClass: 'text-amber-400',
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
    [homeConfig.hiddenQuickActions, homeConfig.labelOverrides, homeConfig.quickActionOrder],
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
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-black/20">
              <div className="flex items-center gap-2">
                <Truck size={16} className="text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{homeConfig.labelOverrides['widget.orders'] || recentOrdersHeading}</h3>
              </div>
              <Link href={ordersHref} className="text-xs text-cyan-400 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-slate-800/50">
              {(data?.recentOrders || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">{emptyOrdersText}</div>
              ) : (
                (data?.recentOrders || []).map((order, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div>
                      <div className="text-sm text-white font-medium">{order.orderNumber || `ORD-${i + 1}`}</div>
                      <div className="text-xs text-slate-500">{order.customer?.name || 'Unknown customer'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">${Number(order.total || 0).toFixed(2)}</div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold ${order.status === 'delivered' ? 'text-emerald-400' : order.status === 'pending' ? 'text-amber-400' : 'text-cyan-400'}`}>
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
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-black/20">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{homeConfig.labelOverrides['widget.posts'] || 'Recent Posts'}</h3>
              </div>
              <Link href="/blog" className="text-xs text-cyan-400 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-slate-800/50">
              {(data?.recentPosts || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No posts yet</div>
              ) : (
                (data?.recentPosts || []).map((post, i) => (
                  <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div>
                      <div className="text-sm text-white font-medium">{post.title || `Post ${i + 1}`}</div>
                      <div className="text-xs text-slate-500">{post.category || 'General'}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-widest font-bold border ${post.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
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
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-black/20">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">{homeConfig.labelOverrides['widget.packages'] || 'Recent Packages'}</h3>
              </div>
              <Link href={productsHref} className="text-xs text-cyan-400 hover:underline">View all →</Link>
            </div>
            <div className="divide-y divide-slate-800/50">
              {(data?.recentPackages || []).length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No packages yet</div>
              ) : (
                (data?.recentPackages || []).map((pkg, i) => (
                  <div key={pkg.slug || i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-800/20 transition-colors">
                    <div>
                      <div className="text-sm text-white font-medium">{pkg.title || `Package ${i + 1}`}</div>
                      <div className="text-xs text-slate-500">{pkg.destination || 'Unknown destination'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {(pkg.price?.currency || 'INR')} {Number(pkg.price?.amount || 0).toLocaleString()}
                      </div>
                      <div className={`text-[10px] uppercase tracking-widest font-bold ${pkg.status === 'published' ? 'text-emerald-400' : 'text-amber-400'}`}>
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
  }, [data, emptyOrdersText, hasOrdersFeed, hasPostsFeed, homeConfig.hiddenWidgets, homeConfig.labelOverrides, homeConfig.widgetOrder, ordersHref, productsHref, recentOrdersHeading]);

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
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">Loading Workspace Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className={layoutClasses.hero}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-1">
            {pageTitle}
          </h2>
          <p className="text-slate-400 text-sm">
            {pageSubtitle} •
            <span className="ml-1 text-cyan-400 font-semibold uppercase text-xs">{data?.subscriptionLevel || 'starter'} Plan</span>
          </p>
        </div>
        {homeConfig.layout !== 'default' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-md p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
              Home Layout
            </div>
            <div className="mt-2 text-sm font-semibold text-white capitalize">
              {homeConfig.layout}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              This dashboard is using the tenant workspace layout preset saved in Workspace Customization.
            </p>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${layoutClasses.quickActions}`}>
        {quickActions.map(({ id, icon: Icon, iconClass, label, href, description }) => (
          <Link key={id} href={href} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-5 hover:border-cyan-500/40 transition-all group">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={iconClass} />
              <span className="text-sm font-semibold text-white">{label}</span>
            </div>
            <p className="text-xs text-slate-400">{description}</p>
          </Link>
        ))}
      </div>

      <div className={`grid gap-4 ${layoutClasses.kpis}`}>
        {kpis.map(({ id, icon: Icon, label, value, color, href }) => {
          const c = colorMap[color] || colorMap.cyan;
          return (
            <Link key={id} href={href} className={`bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group ${c.shadow}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg ${c.bg} border ${c.border} flex items-center justify-center ${c.text}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">{label}</span>
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-black text-white">{value}</div>
                <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      {dashboardWidgets.length > 0 && (
        <div className={`grid gap-6 ${layoutClasses.widgets}`}>
          {dashboardWidgets.map((widget) => (
            <div key={widget.id}>{widget.element}</div>
          ))}
        </div>
      )}
    </div>
  );
}
