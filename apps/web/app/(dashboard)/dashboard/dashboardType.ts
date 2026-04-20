import { ElementType } from "react";

 export const colorMap = {
  cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', shadow: 'shadow-[0_0_15px_rgba(0,240,255,0.15)]' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', shadow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
  rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', shadow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]' },
  sky: { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', shadow: 'shadow-[0_0_15px_rgba(14,165,233,0.15)]' },
  violet: { bg: 'bg-violet-500/10', border: 'border-violet-500/30', text: 'text-violet-400', shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.15)]' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
} as const;

 export interface NavOverride {
  label?: string;
  path?: string;
}

 export interface VocabularyTerms {
  catalogPlural?: string;
  catalogSingular?: string;
  categories?: string;
  attributes?: string;
  orders?: string;
}

 export interface VocabularyProfile {
  key?: string;
  terms?: VocabularyTerms;
}

 export interface DashboardOrder {
  orderNumber?: string;
  customer?: { name?: string };
  total?: number;
  status?: string;
}

 export interface DashboardPost {
  title?: string;
  category?: string;
  status?: string;
}

 export interface DashboardPackage {
  title?: string;
  destination?: string;
  status?: string;
  slug?: string;
  price?: { currency?: string; amount?: number };
}

 export interface DashboardSummary {
  productCount: number;
  packageCount: number;
  orderCount: number;
  revenue: number;
  portfolioCount: number;
  blogCount: number;
  mediaCount: number;
  invoiceCount: number;
  bookingCount: number;
  userCount: number;
  subscriptionLevel: string;
  tenantName: string;
  industry: string;
  businessType: string;
  enabledModules: string[];
  activeBusinessContexts: string[];
  navigationOverrides: Record<string, NavOverride>;
  vocabularyProfile?: VocabularyProfile;
  isTravelContext: boolean;
  recentOrders: DashboardOrder[];
  recentPosts: DashboardPost[];
  recentPackages: DashboardPackage[];
}

 export interface KpiCard {
  icon: ElementType;
  label: string;
  value: string | number;
  color: keyof typeof colorMap;
  href: string;
}
