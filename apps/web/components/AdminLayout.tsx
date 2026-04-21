"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RoleSwitcher } from "./RoleSwitcher";
import {
  LayoutDashboard,
  FileText,
  Settings,
  Database,
  Activity,
  Folder,
  Layers,
  LogOut,
  Globe,
  Languages,
  Bot,
  Wand2,
  ChevronsLeft,
  ChevronsRight,
  Search as SearchIcon,
  X,
  Menu,
} from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useTranslation } from "@/lib/i18n/context";
import { PermissionEngine } from "@engine/permission-engine";
import type { NavEntrySpec, RegistrySnapshot } from "@core/contracts/registry";
import { canRoleAccessAdminPath, type RoleProfileKey } from "@/lib/role-scope";
import { KalpBodhQuickDrawer } from "@/components/kalpbodh/KalpBodhQuickDrawer";
import { useKoshie } from "@/components/KoshieContext";
import { resolveAdminIcon } from "@/lib/admin-icon-catalog";
import GetAllTenant from "./tenant/GetAllTenant";
import { useAppSelector } from "@/hook/store/hooks";
import { RootState } from "@/hook/store/store";
import { useSelector } from "react-redux";
import {
  DEFAULT_ADMIN_WORKSPACE,
  applyWorkspaceItemCustomization,
  buildWorkspaceRouteItemId,
  mergeAdminWorkspace,
  type AdminWorkspaceSectionKey,
} from "@/lib/admin-workspace";

const SECTION_META: Record<
  string,
  { label: string; labelKey: string; headingClass: string; dotClass: string }
> = {
  commerce: {
    label: "Commerce",
    labelKey: "section.commerce",
    headingClass: "text-purple-500/70",
    dotClass: "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]",
  },
  operations: {
    label: "Operations",
    labelKey: "section.operations",
    headingClass: "text-orange-500/70",
    dotClass: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]",
  },
  content: {
    label: "Content",
    labelKey: "section.content",
    headingClass: "text-emerald-500/70",
    dotClass: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]",
  },
  engagement: {
    label: "Engagement",
    labelKey: "section.engagement",
    headingClass: "text-amber-500/70",
    dotClass: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]",
  },
  modules: {
    label: "Apps",
    labelKey: "section.modules",
    headingClass: "text-indigo-500/70",
    dotClass: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]",
  },
};

const SECTION_ORDER: Record<string, number> = {
  commerce: 10,
  operations: 20,
  content: 30,
  engagement: 40,
  modules: 50,
};

const FALLBACK_MODULE_NAVS: Record<string, NavEntrySpec[]> = {
  website: [
    {
      id: "nav.website.pages",
      label: "Website Pages",
      path: "/pages",
      parentId: "group.content",
      requiredPermissionId: "perm.website.read",
    },
    {
      id: "nav.website.forms",
      label: "Forms",
      path: "/forms",
      parentId: "group.content",
      requiredPermissionId: "perm.website.forms.read",
    },
  ],
  branding: [
    {
      id: "nav.branding",
      label: "Brand Kit",
      path: "/branding",
      parentId: "group.engagement",
      requiredPermissionId: "perm.branding.read",
    },
  ],
  products: [
    {
      id: "nav.products",
      label: "Products",
      path: "/ecommerce",
      parentId: "group.commerce",
      requiredPermissionId: "perm.products.read",
    },
    {
      id: "nav.products.categories",
      label: "Categories",
      path: "/ecommerce/categories",
      parentId: "group.commerce",
      requiredPermissionId: "perm.products.read",
    },
    {
      id: "nav.products.attributes",
      label: "Attribute Sets",
      path: "/ecommerce/attributes",
      parentId: "group.commerce",
      requiredPermissionId: "perm.products.read",
    },
    {
      id: "nav.travel.packages",
      label: "Travel Packages",
      path: "/travel/packages",
      parentId: "group.commerce",
      requiredPermissionId: "perm.products.read",
    },
  ],
  ecommerce: [
    {
      id: "nav.ecommerce.orders",
      label: "Orders",
      path: "/ecommerce/orders",
      parentId: "group.operations",
      requiredPermissionId: "perm.ecommerce.read",
    },
    {
      id: "nav.ecommerce.payments-shipping",
      label: "Payments & Shipping",
      path: "/commerce/payments-shipping",
      parentId: "group.operations",
      requiredPermissionId: "perm.ecommerce.read",
    },
  ],
  bookings: [
    {
      id: "nav.bookings",
      label: "Bookings",
      path: "/bookings",
      parentId: "group.engagement",
      requiredPermissionId: "perm.bookings.read",
    },
  ],
  marketing: [
    {
      id: "nav.marketing",
      label: "Marketing",
      path: "/marketing",
      parentId: "group.engagement",
      requiredPermissionId: "perm.marketing.read",
    },
  ],
  blog: [
    {
      id: "nav.blog",
      label: "Blog",
      path: "/blog",
      parentId: "group.content",
      requiredPermissionId: "perm.blog.read",
    },
  ],
  portfolio: [
    {
      id: "nav.portfolio",
      label: "Portfolio",
      path: "/portfolio",
      parentId: "group.content",
      requiredPermissionId: "perm.portfolio.read",
    },
  ],
  media: [
    {
      id: "nav.media",
      label: "Media Library",
      path: "/media",
      parentId: "group.content",
      requiredPermissionId: "perm.media.read",
    },
  ],
  invoicing: [
    {
      id: "nav.invoicing",
      label: "Invoicing",
      path: "/invoices",
      parentId: "group.operations",
      requiredPermissionId: "perm.invoicing.read",
    },
  ],
  hotel_management: [
    {
      id: "nav.hotelManagement",
      label: "Hotel Management",
      path: "/hotel-management",
      parentId: "group.operations",
      requiredPermissionId: "perm.hotel_management.read",
    },
  ],
  tour_management: [
    {
      id: "nav.tourManagement",
      label: "Tour Management",
      path: "/tour-management",
      parentId: "group.operations",
      requiredPermissionId: "perm.tour_management.read",
    },
  ],
  real_estate: [
    {
      id: "nav.real_estate",
      label: "Real Estate",
      path: "/real-estate",
      parentId: "group.commerce",
      requiredPermissionId: "perm.real_estate.read",
    },
  ],
  source: [
    {
      id: "nav.source",
      label: "Source",
      path: "/sources",
      parentId: "group.modules",
      requiredPermissionId: "perm.source.read",
    },
  ],
  kalpbodh: [
    {
      id: "nav.kalpbodh",
      label: "KalpBodh",
      path: "/kalpbodh",
      parentId: "group.engagement",
      requiredPermissionId: "perm.kalpbodh.read",
    },
  ],
};

function resolveNavIcon(icon?: string): React.ElementType {
  const resolved = resolveAdminIcon(icon);
  if (resolved) return resolved;
  return Layers;
}

function isPathActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(`${href}/`);
}

function inferModuleKeyFromNav(nav: NavEntrySpec): string | null {
  if (typeof nav?.requiredPermissionId === "string") {
    const match = nav.requiredPermissionId.match(/^perm\.([^.]+)\./);
    if (match?.[1]) return match[1];
  }

  if (typeof nav?.id === "string" && nav.id.startsWith("nav.")) {
    const inferred = nav.id.slice(4).split(".")[0]?.trim();
    if (inferred) return inferred;
  }

  if (typeof nav?.path === "string") {
    const firstSegment = nav.path.replace(/^\//, "").split("/")[0]?.trim();
    if (firstSegment) return firstSegment;
  }

  return null;
}

function normalizeSectionId(parentId: unknown): string {
  if (typeof parentId !== "string") return "modules";
  const trimmed = parentId.trim().toLowerCase();
  if (!trimmed) return "modules";
  if (trimmed.startsWith("group.")) return trimmed.replace("group.", "");
  if (trimmed.startsWith("section.")) return trimmed.replace("section.", "");
  return trimmed;
}

function applyNavOverride(
  nav: NavEntrySpec,
  overrides: Record<string, Partial<NavEntrySpec>>,
): NavEntrySpec {
  const override = overrides[nav.id];
  if (!override) return nav;

  return {
    ...nav,
    label:
      typeof override.label === "string" && override.label.trim()
        ? override.label
        : nav.label,
    path:
      typeof override.path === "string" && override.path.trim()
        ? override.path
        : nav.path,
    icon:
      typeof override.icon === "string" && override.icon.trim()
        ? override.icon
        : nav.icon,
    parentId:
      typeof override.parentId === "string" && override.parentId.trim()
        ? override.parentId
        : nav.parentId,
  };
}

function normalizeBusinessContext(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hasTravelSignals(value: string): boolean {
  const normalized = normalizeBusinessContext(value);
  if (!normalized) return false;
  const travelTokens = [
    "travel",
    "tour",
    "itinerary",
    "trip",
    "vacation",
    "hospitality",
  ];
  return travelTokens.some((token) => normalized.includes(token));
}

const pEngine = new PermissionEngine();

type RuntimeRegistrySnapshot = RegistrySnapshot & {
  enabledModules?: string[];
  enabledPlugins?: string[];
  activeTenantKey?: string;
};

function hasBusinessContext(
  contexts: Set<string>,
  candidates: string[],
): boolean {
  return candidates.some((value) =>
    contexts.has(normalizeBusinessContext(value)),
  );
}

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTenant: string;
}

export interface TenantSwitcherOption {
  _id?: string;
  key?: string;
  name?: string;
  subscriptionLevel?: string;
  agencyId?: string | null;
}

interface AgencyBranding {
  agencyName: string;
  brandName: string;
  shortName: string;
  logoUrl: string;
  compactLogoUrl: string;
}

type SidebarRenderableItem = {
  id: string;
  href: string;
  icon: React.ReactNode;
  label: string;
};

const LOCALE_META: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  hi: { flag: "🇮🇳", label: "HI" },
  hr: { flag: "🇭🇷", label: "HR" },
  "zh-hant": { flag: "🇹🇼", label: "繁中" },
};

function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useTranslation();
  const [open, setOpen] = useState(false);
  const meta = LOCALE_META[locale] || LOCALE_META.en;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-slate-900/50 px-2.5 py-1.5 rounded-full border border-slate-800 shadow-inner text-xs hover:border-slate-600 transition-colors"
      >
        <Languages size={12} className="text-slate-400" />
        <span>{meta.flag}</span>
        <span className="text-slate-400 font-bold text-[10px]">
          {meta.label}
        </span>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-xl z-50 min-w-[120px]">
          {availableLocales.map((loc) => {
            const m = LOCALE_META[loc];
            if (!m) return null;
            return (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-800 transition-colors ${locale === loc ? "text-cyan-400 bg-slate-800/50" : "text-slate-300"}`}
              >
                <span>{m.flag}</span>
                <span className="font-medium">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminLayout({ children, activeTenant }: AdminLayoutProps) {
  const authCtx = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { setActiveContext } = useKoshie();
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<RuntimeRegistrySnapshot | null>(
    null,
  );
  const [tenantModules, setTenantModules] = useState<string[]>([]);
  const [tenantOptions, setTenantOptions] = useState<TenantSwitcherOption[]>(
    [],
  );
  const tenantOptionsLoading = false;
  const [tenantSwitchingTo, setTenantSwitchingTo] = useState<string | null>(
    null,
  );


  const [tenantSwitchError, setTenantSwitchError] = useState("");
  const [tenantPickerOpen, setTenantPickerOpen] = useState(false);
  const [tenantPickerQuery, setTenantPickerQuery] = useState("");
  const [quickBodhOpen, setQuickBodhOpen] = useState(false);
  const [agencyBranding, setAgencyBranding] = useState<AgencyBranding>({
    agencyName: "",
    brandName: "KalpZERO",
    shortName: "KalpZERO",
    logoUrl: "",
    compactLogoUrl: "",
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    return window.localStorage.getItem("kalp_admin_sidebar_collapsed") === "1";
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(
      "kalp_admin_sidebar_collapsed",
      isSidebarCollapsed ? "1" : "0",
    );
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (
      pathname.includes("/commerce") ||
      pathname.includes("/ecommerce") ||
      pathname.includes("/invoices") ||
      pathname.includes("/products")
    ) {
      setActiveContext("commerce");
    } else if (
      pathname.includes("/settings") ||
      pathname.includes("/users") ||
      pathname.includes("/tenants")
    ) {
      setActiveContext("settings");
    } else if (
      pathname.includes("/pages") ||
      pathname.includes("/blog") ||
      pathname.includes("/portfolio")
    ) {
      setActiveContext("content");
    } else {
      setActiveContext("dashboard");
    }
  }, [pathname, setActiveContext]);

  useEffect(() => {
    let isCancelled = false;

    fetch("/api/agency/terminology")
      .then(async (res) => (res.ok ? await res.json() : null))
      .then((data) => {
        if (isCancelled || !data || typeof data !== "object") return;
        const whiteLabel =
          data.whiteLabel && typeof data.whiteLabel === "object"
            ? (data.whiteLabel as Record<string, unknown>)
            : {};
        const brandName =
          typeof whiteLabel.brandName === "string" &&
            whiteLabel.brandName.trim()
            ? whiteLabel.brandName.trim()
            : "KalpZERO";
        const shortName =
          typeof whiteLabel.shortName === "string" &&
            whiteLabel.shortName.trim()
            ? whiteLabel.shortName.trim()
            : brandName;
        setAgencyBranding({
          agencyName:
            typeof data.agencyName === "string" ? data.agencyName : "",
          brandName,
          shortName,
          logoUrl:
            typeof whiteLabel.logoUrl === "string"
              ? whiteLabel.logoUrl.trim()
              : "",
          compactLogoUrl:
            typeof whiteLabel.compactLogoUrl === "string"
              ? whiteLabel.compactLogoUrl.trim()
              : "",
        });
      })
      .catch(() => undefined);
    return () => {
      isCancelled = true;
    };
  }, [activeTenant, authCtx.user?.email]);

  useEffect(() => {
    if (authCtx.isLoading || !authCtx.user?.tenantKey) return;

    let isCancelled = false;

    if (Array.isArray(authCtx.user.enabledModules)) {
      setTenantModules(authCtx.user.enabledModules);
    }

    fetch("/api/registry/snapshot", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load registry snapshot.");
        }
        return res.json();
      })
      .then((data) => {
        if (isCancelled) return;
        setSnapshot(data as RuntimeRegistrySnapshot);
        if (Array.isArray(data?.enabledModules)) {
          setTenantModules(data.enabledModules);
        }
      })
      .catch((error) => {
        if (!isCancelled) {
          console.error(error);
        }
      });

    fetch("/api/analytics/summary", { cache: "no-store" })
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (
          isCancelled ||
          !Array.isArray(data?.enabledModules) ||
          data.enabledModules.length === 0
        ) {
          return;
        }
        setTenantModules((prev) =>
          prev.length > 0 ? prev : data.enabledModules,
        );
      })
      .catch(() => { });

    return () => {
      isCancelled = true;
    };
  }, [authCtx.isLoading, authCtx.user?.enabledModules, authCtx.user?.tenantKey]);

  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    if (currentTenant && currentTenant.enabledModules) {
      setTenantModules(currentTenant.enabledModules);
    }
  }, [currentTenant]);

  useEffect(() => {
    if (Array.isArray(authCtx.user?.enabledModules)) {
      setTenantModules(authCtx.user.enabledModules);
    }
  }, [authCtx.user?.enabledModules]);

  const activeRole = authCtx.currentProfile as RoleProfileKey;
  const sessionRole = authCtx.user?.role || authCtx.sessionRole;
  const canSwitchTenant =
    sessionRole === "platform_owner" ||
    sessionRole === "platform_admin" ||
    sessionRole === "tenant_owner";
  const isSidebarCollapseLocked =
    pathname === "/admin/registry" || pathname.startsWith("/admin/registry/");
  const pathnameSegments = pathname.split("/").filter(Boolean);
  const reservedTopLevelRoutes = new Set([
    "admin",
    "blog",
    "bookings",
    "branding",
    "business",
    "catalog",
    "catalog-builder",
    "c",
    "cart",
    "checkout",
    "claim",
    "commerce",
    "customers",
    "dashboard",
    "discover",
    "ecommerce",
    "forms",
    "front-builder",
    "front-builder-v2",
    "invoices",
    "kalpbodh",
    "login",
    "marketing",
    "media",
    "onboarding",
    "p",
    "packages",
    "page",
    "pages",
    "portfolio",
    "product",
    "proposal",
    "proposal-builder",
    "profile",
    "portfolio-profile-builder",
    "real-estate",
    "resume",
    "resume-builder",
    "settings",
    "sources",
    "tenants",
    "terminal",
    "travel",
    "users",
  ]);
  const isLikelyPublicSlugRoute =
    pathnameSegments.length === 1 &&
    !reservedTopLevelRoutes.has(pathnameSegments[0]);

  const activeBusinessContextSet = useMemo(
    () =>
      new Set(
        (Array.isArray(snapshot?.activeBusinessContexts)
          ? snapshot.activeBusinessContexts
          : []
        )
          .filter((context): context is string => typeof context === "string")
          .map(normalizeBusinessContext),
      ),
    [snapshot],
  );
  const enabledPluginSet = useMemo(
    () =>
      new Set(
        (Array.isArray(snapshot?.enabledPlugins) ? snapshot.enabledPlugins : [])
          .filter((key): key is string => typeof key === "string")
          .map((key) => key.trim())
          .filter(Boolean),
      ),
    [snapshot],
  );
  const enabledModuleSet = useMemo(
    () => new Set(tenantModules),
    [tenantModules],
  );
  const workspaceConfig = useMemo(
    () => mergeAdminWorkspace(authCtx.user?.adminWorkspace || null),
    [authCtx.user?.adminWorkspace],
  );
  const isEcommerceWorkspace = useMemo(() => {
    if (enabledModuleSet.size === 0) return false;
    const moduleDriven =
      enabledModuleSet.has("products") && enabledModuleSet.has("ecommerce");
    const contextDriven = hasBusinessContext(activeBusinessContextSet, [
      "online-store",
      "ecommerce",
      "e-commerce",
      "retail",
      "fashion-boutique",
      "grocery-delivery",
    ]);
    return moduleDriven || contextDriven;
  }, [activeBusinessContextSet, enabledModuleSet]);
  const shouldSuppressTravelNav = useMemo(() => {
    // Check if any explicit travel context is active
    const explicitTravelContexts = ["travel-and-tour-package", "travel-agency", "hospitality", "hotel-resort"];
    const hasExplicitTravelContext = hasBusinessContext(activeBusinessContextSet, explicitTravelContexts);

    const profile = snapshot?.vocabularyProfile as
      | { businessType?: unknown; industry?: unknown }
      | undefined;
    const businessType =
      typeof profile?.businessType === "string" ? profile.businessType : "";
    const industry =
      typeof profile?.industry === "string" ? profile.industry : "";
    const lookup = `${businessType} ${industry}`.trim();

    const hasImplicitTravelSignal = lookup ? hasTravelSignals(lookup) : false;

    // Suppress travel navigation if they DO NOT have any travel context or signals.
    return !hasExplicitTravelContext && !hasImplicitTravelSignal;
  }, [activeBusinessContextSet, snapshot]);
  const canShowProposalBuilder = useMemo(() => {
    if (!canRoleAccessAdminPath(activeRole, "/proposal-builder")) return false;
    if (!isEcommerceWorkspace) return true;
    return enabledPluginSet.has("proposal_builder");
  }, [activeRole, enabledPluginSet, isEcommerceWorkspace]);
  const canShowCatalogBuilder = useMemo(() => {
    if (!canRoleAccessAdminPath(activeRole, "/catalog-builder")) return false;
    if (!enabledModuleSet.has("products")) return false;
    return isEcommerceWorkspace || enabledPluginSet.has("catalog_builder");
  }, [activeRole, enabledModuleSet, enabledPluginSet, isEcommerceWorkspace]);
  const canShowResumeBuilder = useMemo(() => {
    if (!canRoleAccessAdminPath(activeRole, "/resume-builder")) return false;
    return enabledPluginSet.has("resume_builder");
  }, [activeRole, enabledPluginSet]);
  const canShowPortfolioProfileBuilder = useMemo(() => {
    if (!canRoleAccessAdminPath(activeRole, "/portfolio-profile-builder"))
      return false;
    return enabledPluginSet.has("portfolio_builder");
  }, [activeRole, enabledPluginSet]);

  // Dynamically evaluate module navigations through the Meta-Engine
  // NOTE: This MUST be above the early return to satisfy React's Rules of Hooks
  const activeModuleNavs = useMemo(() => {
    if (!snapshot?.navigation) return [];

    const navOverrides = snapshot.navigationOverrides || {};
    const permissionCtx = {
      ...authCtx,
      enabledModules: tenantModules
    };

    const filtered = snapshot.navigation.filter((nav: NavEntrySpec) => {
      if (
        Array.isArray(nav.businessContexts) &&
        nav.businessContexts.length > 0
      ) {
        if (activeBusinessContextSet.size === 0) return false;
        const hasContextMatch = nav.businessContexts.some((context) => {
          if (typeof context !== "string") return false;
          return activeBusinessContextSet.has(
            normalizeBusinessContext(context),
          );
        });
        if (!hasContextMatch) return false;
      }

      const requiredModule = inferModuleKeyFromNav(nav);
      if (
        shouldSuppressTravelNav &&
        ((typeof nav.id === "string" && nav.id.startsWith("nav.travel")) ||
          (typeof nav.path === "string" && nav.path.startsWith("/travel/")))
      ) {
        return false;
      }
      if (requiredModule && !enabledModuleSet.has(requiredModule)) {
        return false;
      }
      if (nav.requiredPermissionId) {
        return pEngine.can(snapshot, permissionCtx, {
          permissionId: nav.requiredPermissionId,
          requiredModule: requiredModule || undefined,
        });
      }
      return true;
    });

    const withOverrides = filtered.map((nav) => {
      const override = navOverrides[nav.id];
      if (!override) return nav;

      return {
        ...nav,
        label: override.label || nav.label,
        path: override.path || nav.path,
        icon: override.icon || nav.icon,
        parentId: override.parentId || nav.parentId,
      };
    });

    // De-duplicate shared routes contributed by multiple modules (e.g. Payments & Shipping).
    const dedupedByPath = new Map<string, NavEntrySpec>();
    for (const nav of withOverrides) {
      const key = nav.path.trim().toLowerCase();
      const existing = dedupedByPath.get(key);
      if (!existing || (nav.order || 0) < (existing.order || 0)) {
        dedupedByPath.set(key, nav);
      }
    }

    return Array.from(dedupedByPath.values()).sort(
      (a: NavEntrySpec, b: NavEntrySpec) => (a.order || 0) - (b.order || 0),
    );
  }, [
    activeBusinessContextSet,
    authCtx,
    enabledModuleSet,
    shouldSuppressTravelNav,
    snapshot,
    tenantModules,
  ]);

  const fallbackModuleNavs = useMemo(() => {
    if (tenantModules.length === 0) return [];

    const navOverrides =
      snapshot?.navigationOverrides && typeof snapshot.navigationOverrides === "object"
        ? (snapshot.navigationOverrides as Record<string, Partial<NavEntrySpec>>)
        : {};
    const seenPaths = new Set<string>();
    const items: NavEntrySpec[] = [];

    for (const moduleKey of tenantModules) {
      const navs = FALLBACK_MODULE_NAVS[moduleKey] || [];
      for (const rawNav of navs) {
        if (
          shouldSuppressTravelNav &&
          ((typeof rawNav.id === "string" && rawNav.id.startsWith("nav.travel")) ||
            rawNav.path.startsWith("/travel/"))
        ) {
          continue;
        }
        if (!canRoleAccessAdminPath(activeRole, rawNav.path)) continue;
        const nav = applyNavOverride(rawNav, navOverrides);
        const normalizedPath = nav.path.trim().toLowerCase();
        if (!normalizedPath || seenPaths.has(normalizedPath)) continue;
        seenPaths.add(normalizedPath);
        items.push(nav);
      }
    }

    return items.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [activeRole, shouldSuppressTravelNav, snapshot?.navigationOverrides, tenantModules]);

  const resolvedActiveModuleNavs = useMemo(() => {
    const combined = [...activeModuleNavs];
    const seenPaths = new Set(
      activeModuleNavs.map((nav) => nav.path.trim().toLowerCase()).filter(Boolean),
    );

    for (const nav of fallbackModuleNavs) {
      const normalizedPath = nav.path.trim().toLowerCase();
      if (!normalizedPath || seenPaths.has(normalizedPath)) continue;
      seenPaths.add(normalizedPath);
      combined.push(nav);
    }

    return combined.sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [activeModuleNavs, fallbackModuleNavs]);

  const runtimeNavGroups = useMemo(() => {
    if (resolvedActiveModuleNavs.length === 0) return [];

    const groups = new Map<
      string,
      { id: string; order: number; items: NavEntrySpec[] }
    >();
    for (const nav of resolvedActiveModuleNavs) {
      const sectionId = normalizeSectionId(nav.parentId);
      const existing = groups.get(sectionId);
      if (existing) {
        existing.items.push(nav);
        existing.order = Math.min(existing.order, nav.order || 0);
      } else {
        groups.set(sectionId, {
          id: sectionId,
          order: nav.order || 0,
          items: [nav],
        });
      }
    }

    return Array.from(groups.values())
      .sort((a, b) => {
        const aOrder = SECTION_ORDER[a.id] ?? a.order;
        const bOrder = SECTION_ORDER[b.id] ?? b.order;
        return aOrder - bOrder;
      })
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => (a.order || 0) - (b.order || 0)),
      }));
  }, [resolvedActiveModuleNavs]);

  const runtimeAllowedNavPaths = useMemo(
    () => resolvedActiveModuleNavs.map((nav) => nav.path),
    [resolvedActiveModuleNavs],
  );

  const filteredTenantOptions = useMemo(() => {
    const query = tenantPickerQuery.trim().toLowerCase();
    const source =
      tenantOptions.length > 0
        ? tenantOptions
        : [{ key: activeTenant, name: activeTenant }];
    if (!query) return source;
    return source.filter(
      (item) =>
        item?.key?.toLowerCase().includes(query) ||
        item?.name?.toLowerCase().includes(query),
    );
  }, [tenantOptions, tenantPickerQuery, activeTenant]);

  const { allTenant } = useAppSelector((state: RootState) => state.tenant);
  useEffect(() => {
    if (allTenant.length > 0) {
      setTenantOptions(allTenant);
    }
  }, [allTenant]);
  // useEffect(() => {
  //   if (!authCtx.user || !canSwitchTenant) {
  //     setTenantOptions([]);
  //     setTenantSwitchError("");
  //     setTenantPickerOpen(false);
  //     return;
  //   }

  //   let isCancelled = false;
  //   setTenantOptionsLoading(true);
  //   fetch("/api/auth/tenant-options", { cache: "no-store" })
  //     .then(async (res) => {
  //       const payload = await res.json().catch(() => ({}));
  //       if (!res.ok) {
  //         const message =
  //           typeof payload?.error === "string" && payload.error.trim()
  //             ? payload.error
  //             : "Failed to load tenant options.";
  //         throw new Error(message);
  //       }
  //       const rawItems = Array.isArray(payload?.items) ? payload.items : [];
  //       const normalized = rawItems
  //         .map((item: unknown) => {
  //           if (!item || typeof item !== "object") return null;
  //           const record = item as Record<string, unknown>;
  //           const key = typeof record.key === "string" ? record.key : "";
  //           if (!key) return null;
  //           return {
  //             key,
  //             name:
  //               typeof record.name === "string" && record.name.trim()
  //                 ? record.name
  //                 : key,
  //             subscriptionLevel:
  //               typeof record.subscriptionLevel === "string"
  //                 ? record.subscriptionLevel
  //                 : undefined,
  //           } as TenantSwitcherOption;
  //         })
  //         .filter(
  //           (item: TenantSwitcherOption | null): item is TenantSwitcherOption =>
  //             Boolean(item),
  //         );

  //       if (!isCancelled) {
  //         setTenantOptions(normalized);
  //       }
  //     })
  //     .catch((error: unknown) => {
  //       if (!isCancelled) {
  //         const message =
  //           error instanceof Error
  //             ? error.message
  //             : "Failed to load tenant options.";
  //         setTenantSwitchError(message);
  //         setTenantOptions([]);
  //       }
  //     })
  //     .finally(() => {
  //       if (!isCancelled) setTenantOptionsLoading(false);
  //     });

  //   return () => {
  //     isCancelled = true;
  //   };
  // }, [authCtx.user, canSwitchTenant]);

  useEffect(() => {
    if (!tenantPickerOpen) {
      setTenantPickerQuery("");
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setTenantPickerOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tenantPickerOpen]);

  const handleTenantSwitch = async (nextTenant: string) => {
    if (!nextTenant || nextTenant === activeTenant) return;
    setTenantSwitchError("");
    setTenantSwitchingTo(nextTenant);
    try {
      const res = await fetch("/api/auth/switch-tenant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantKey: nextTenant }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof payload?.error === "string" && payload.error.trim()
            ? payload.error
            : "Failed to switch tenant.",
        );
      }
      setTenantPickerOpen(false);
      window.location.href = pathname || "/dashboard";
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to switch tenant.";
      setTenantSwitchError(message);
      setTenantSwitchingTo(null);
    }
  };

  const canOpenKalpBodhDrawer = useMemo(() => {
    const roleAllowed = canRoleAccessAdminPath(activeRole, "/kalpbodh");
    const hasModule =
      tenantModules.includes("kalpbodh") ||
      runtimeAllowedNavPaths.some((path) => path === "/kalpbodh");
    return roleAllowed && hasModule;
  }, [activeRole, runtimeAllowedNavPaths, tenantModules]);

  const platformNavItems = useMemo(() => {
    const allItems = [
      {
        href: "/settings",
        icon: <Settings size={16} />,
        label: t("nav.settings", "Control Center"),
      },
    ];
    return allItems.filter((item) =>
      canRoleAccessAdminPath(activeRole, item.href),
    );
  }, [activeRole, t]);

  const customizedOverviewNavItems = useMemo(
    () =>
      applyWorkspaceItemCustomization<SidebarRenderableItem>(
        [
          {
            id: buildWorkspaceRouteItemId("/dashboard"),
            href: "/dashboard",
            icon: <LayoutDashboard size={16} />,
            label: t("nav.dashboard", "Dashboard"),
          },
        ],
        {
          order: workspaceConfig.sidebar.itemOrder,
          hidden: workspaceConfig.sidebar.hiddenItems,
          labelOverrides: workspaceConfig.sidebar.labelOverrides,
        },
      ),
    [t, workspaceConfig.sidebar],
  );

  const customizedPlatformNavItems = useMemo(
    () =>
      applyWorkspaceItemCustomization<SidebarRenderableItem>(
        platformNavItems.map((item) => ({
          id: buildWorkspaceRouteItemId(item.href),
          href: item.href,
          icon: item.icon,
          label: item.label,
        })),
        {
          order: workspaceConfig.sidebar.itemOrder,
          hidden: workspaceConfig.sidebar.hiddenItems,
          labelOverrides: workspaceConfig.sidebar.labelOverrides,
        },
      ),
    [platformNavItems, workspaceConfig.sidebar],
  );

  const frontendNavItems = useMemo(() => {
    const items = [
      {
        href: "/pages",
        icon: <FileText size={16} />,
        label: t("nav.websitePages", "Website Pages"),
      },
      {
        href: "/front-builder-v2",
        icon: <Wand2 size={16} />,
        label: t("nav.websiteBuilderV2", "Website Builder V2"),
      },
      {
        href: "/front-builder",
        icon: <Globe size={16} />,
        label: t("nav.frontBuilder", "Front Builder (Legacy)"),
      },
    ];
    if (canShowCatalogBuilder) {
      items.push({
        href: "/catalog-builder",
        icon: <Folder size={16} />,
        label: t("nav.catalogBuilder", "Catalog Builder"),
      });
    }
    if (canShowProposalBuilder) {
      items.push({
        href: "/proposal-builder",
        icon: <FileText size={16} />,
        label: t("nav.proposalBuilder", "Proposal Builder"),
      });
    }
    if (canShowResumeBuilder) {
      items.push({
        href: "/resume-builder",
        icon: <FileText size={16} />,
        label: t("nav.resumeBuilder", "Resume Builder"),
      });
    }
    if (canShowPortfolioProfileBuilder) {
      items.push({
        href: "/portfolio-profile-builder",
        icon: <FileText size={16} />,
        label: t("nav.portfolioProfileBuilder", "Portfolio Builder"),
      });
    }
    if (activeRole === "platform_owner" || activeRole === "platform_admin") {
      items.push({
        href: "/discover/qa",
        icon: <Database size={16} />,
        label: t("nav.discoveryQa", "Discovery QA"),
      });
    }
    return items.filter((item) =>
      canRoleAccessAdminPath(activeRole, item.href),
    );
  }, [
    activeRole,
    canShowCatalogBuilder,
    canShowPortfolioProfileBuilder,
    canShowProposalBuilder,
    canShowResumeBuilder,
    t,
  ]);

  const customizedFrontendNavItems = useMemo(
    () =>
      applyWorkspaceItemCustomization<SidebarRenderableItem>(
        frontendNavItems.map((item) => ({
          id: buildWorkspaceRouteItemId(item.href),
          href: item.href,
          icon: item.icon,
          label: item.label,
        })),
        {
          order: workspaceConfig.sidebar.itemOrder,
          hidden: workspaceConfig.sidebar.hiddenItems,
          labelOverrides: workspaceConfig.sidebar.labelOverrides,
        },
      ),
    [frontendNavItems, workspaceConfig.sidebar],
  );

  const customizedRuntimeNavGroups = useMemo(
    () => {
      const customized = runtimeNavGroups
        .map((group) => ({
          ...group,
          items: applyWorkspaceItemCustomization(
            group.items.map((nav) => ({
              ...nav,
              id:
                typeof nav.id === "string" && nav.id.trim()
                  ? nav.id
                  : buildWorkspaceRouteItemId(nav.path),
              label:
                typeof nav.id === "string"
                  ? t(nav.id, nav.label)
                  : nav.label,
            })),
            {
              order: workspaceConfig.sidebar.itemOrder,
              hidden: workspaceConfig.sidebar.hiddenItems,
              labelOverrides: workspaceConfig.sidebar.labelOverrides,
            },
          ),
        }))
        .filter((group) => group.items.length > 0);

      if (customized.length > 0 || runtimeNavGroups.length === 0) {
        return customized;
      }

      return runtimeNavGroups.map((group) => ({
        ...group,
        items: group.items.map((nav) => ({
          ...nav,
          id:
            typeof nav.id === "string" && nav.id.trim()
              ? nav.id
              : buildWorkspaceRouteItemId(nav.path),
          label:
            typeof nav.id === "string"
              ? t(nav.id, nav.label)
              : nav.label,
        })),
      }));
    },
    [runtimeNavGroups, t, workspaceConfig.sidebar],
  );

  // Route affordance guard: if a module route is not enabled/allowed in runtime snapshot, redirect home.
  useEffect(() => {
    if (!snapshot || authCtx.isLoading) return;
    if (pathname === "/proposal-builder" && !canShowProposalBuilder) {
      router.replace(canShowCatalogBuilder ? "/catalog-builder" : "/dashboard");
      return;
    }
    if (pathname === "/catalog-builder" && !canShowCatalogBuilder) {
      router.replace(
        canShowProposalBuilder ? "/proposal-builder" : "/dashboard",
      );
      return;
    }
    if (pathname === "/resume-builder" && !canShowResumeBuilder) {
      router.replace("/dashboard");
      return;
    }
    if (
      pathname === "/portfolio-profile-builder" &&
      !canShowPortfolioProfileBuilder
    ) {
      router.replace("/dashboard");
      return;
    }
    if (
      pathname === "/onboarding" ||
      pathname === "/login" ||
      pathname === "/" ||
      pathname === "/claim" ||
      pathname.startsWith("/claim/") ||
      pathname === "/pages" ||
      pathname.startsWith("/pages/") ||
      pathname === "/front-builder" ||
      pathname === "/front-builder-v2" ||
      pathname === "/catalog-builder" ||
      pathname === "/proposal-builder" ||
      pathname === "/resume-builder" ||
      pathname === "/portfolio-profile-builder" ||
      pathname.startsWith("/packages/") ||
      pathname.startsWith("/business/") ||
      pathname.startsWith("/catalog/") ||
      pathname.startsWith("/proposal/") ||
      pathname.startsWith("/resume/") ||
      pathname.startsWith("/profile/") ||
      pathname.startsWith("/product/") ||
      pathname.startsWith("/c/") ||
      pathname.startsWith("/cart/") ||
      pathname.startsWith("/checkout/") ||
      pathname === "/discover" ||
      pathname.startsWith("/discover/") ||
      isLikelyPublicSlugRoute
    )
      return;

    if (!canRoleAccessAdminPath(activeRole, pathname)) {
      const fallback = runtimeAllowedNavPaths[0] || "/";
      if (pathname !== fallback) {
        router.replace(fallback);
      }
      return;
    }

    const routeIndex = Array.isArray(snapshot.moduleRouteIndex)
      ? snapshot.moduleRouteIndex
      : [];
    if (routeIndex.length === 0) return;

    const matchedRoute = routeIndex
      .filter((entry) => isPathActive(pathname, entry.path))
      .sort((a, b) => b.path.length - a.path.length)[0];
    if (!matchedRoute) {
      // Guard context-overridden travel routes that may not exist in raw module route index.
      if (pathname.startsWith("/travel/")) {
        const isAllowedTravelNav = runtimeAllowedNavPaths.some((path) =>
          isPathActive(pathname, path),
        );
        if (!isAllowedTravelNav) {
          router.replace("/dashboard");
        }
      }
      return;
    }

    const enabledSet = new Set(tenantModules);
    if (!enabledSet.has(matchedRoute.moduleKey)) {
      router.replace("/dashboard");
      return;
    }

    const isAllowedByRuntimeNav = runtimeAllowedNavPaths.some((path) =>
      isPathActive(pathname, path),
    );
    if (!isAllowedByRuntimeNav) {
      router.replace("/dashboard");
    }
  }, [
    snapshot,
    authCtx.isLoading,
    pathname,
    router,
    tenantModules,
    runtimeAllowedNavPaths,
    activeRole,
    isLikelyPublicSlugRoute,
    canShowProposalBuilder,
    canShowCatalogBuilder,
    canShowResumeBuilder,
    canShowPortfolioProfileBuilder,
  ]);

  const isQuickBodhDrawerOpen = canOpenKalpBodhDrawer && quickBodhOpen;
  const sidebarCollapsed = isQuickBodhDrawerOpen
    ? true
    : isSidebarCollapseLocked
      ? false
      : isSidebarCollapsed;

  const isPublicWorkspacePage =
    pathname.startsWith("/packages/") ||
    pathname.startsWith("/business/") ||
    pathname.startsWith("/product/") ||
    pathname.startsWith("/c/") ||
    pathname.startsWith("/cart/") ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/p/") ||
    pathname === "/" ||
    pathname === "/claim" ||
    pathname.startsWith("/claim/") ||
    pathname === "/front-builder" ||
    pathname === "/front-builder-v2" ||
    pathname === "/catalog-builder" ||
    pathname === "/proposal-builder" ||
    pathname === "/resume-builder" ||
    pathname === "/portfolio-profile-builder" ||
    pathname.startsWith("/catalog/") ||
    pathname.startsWith("/proposal/") ||
    pathname.startsWith("/resume/") ||
    pathname.startsWith("/profile/") ||
    pathname === "/discover" ||
    pathname.startsWith("/discover/") ||
    isLikelyPublicSlugRoute;

  // Bypass layout for full-screen/public pages
  if (
    pathname === "/onboarding" ||
    pathname === "/login" ||
    isPublicWorkspacePage
  ) {
    return (
      <div
        className="min-h-screen text-slate-100 selection:bg-cyan-500/30 font-sans"
        style={{ backgroundColor: "var(--background)", color: "var(--text)" }}
      >
        {children}
      </div>
    );
  }

  // Loading state while auth is initializing
  if (authCtx.isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">
            {t("common.initializingSession", "Initializing Session...")}
          </span>
        </div>
      </div>
    );
  }


  const handlelogout = () => {
    authCtx.logout();
    router.push("/");
  };
  const isDashboardHome = pathname === "/dashboard";
  const shellStyle: React.CSSProperties = isDashboardHome
    ? {
        color: "#e2e8f0",
        background:
          "radial-gradient(circle at top left, rgba(34,211,238,0.12), transparent 24%), radial-gradient(circle at top right, rgba(129,140,248,0.12), transparent 28%), linear-gradient(180deg, #020617 0%, #020817 42%, #030712 100%)",
      }
    : { backgroundColor: "var(--background)", color: "var(--text)" };
  const chromeSurfaceStyle: React.CSSProperties = isDashboardHome
    ? {
        backgroundColor: "rgba(2, 6, 23, 0.82)",
        borderColor: "rgba(51, 65, 85, 0.72)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
      }
    : {
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
      };
  const mainStyle: React.CSSProperties = isDashboardHome
    ? {
        padding: "var(--admin-main-padding)",
        background:
          "linear-gradient(180deg, rgba(2,6,23,0.24) 0%, rgba(2,6,23,0.56) 100%)",
      }
    : { padding: "var(--admin-main-padding)" };
  return (
    <>
      {/* get all tenant */}
      <GetAllTenant />
      <div
        className="kalp-admin-shell h-screen flex w-full text-slate-100 selection:bg-cyan-500/30 overflow-hidden relative"
        style={shellStyle}
      >
        {/* Background Mesh Gradients */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-900/30 blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-900/20 blur-[120px]"></div>
        </div>

        {/* Backdrop for mobile */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-[35] bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed md:sticky top-0 h-screen z-40
            flex flex-col border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all duration-300
            ${sidebarCollapsed && !isMobileMenuOpen ? "w-20" : "w-72"}
            ${isMobileMenuOpen ? "translate-x-0 shadow-2xl shadow-cyan-500/10" : "-translate-x-full md:translate-x-0"}
          `}
          style={chromeSurfaceStyle}
        >
          {/* Logo Header */}
          <div
            className={`h-16 flex items-center border-b border-slate-800/80 relative overflow-hidden bg-black/20 ${sidebarCollapsed && !isMobileMenuOpen ? "px-3 justify-center" : "px-6"}`}
          >
            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div
              className={`relative flex items-center justify-center w-8 h-8 rounded-lg ${sidebarCollapsed && !isMobileMenuOpen ? "" : "mr-3"}`}
            >
              {sidebarCollapsed &&
                !isMobileMenuOpen &&
                agencyBranding.compactLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={agencyBranding.compactLogoUrl}
                  alt={agencyBranding.shortName}
                  className="h-6 w-6 rounded object-contain"
                />
              ) : (
                // <Activity className="w-4 h-4 text-cyan-400" />
                <div className='w-14 h-14'>
                  <img
                    src="/img/favicon.svg"
                    alt="KalpTree Logo"
                    className="h-full w-auto object-contain"

                  />
                </div>
              )}
            </div>
            {(!sidebarCollapsed || isMobileMenuOpen) && (
              <div className="min-w-0">
                {agencyBranding.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={agencyBranding.logoUrl}
                    alt={agencyBranding.brandName}
                    className="h-8 max-w-[170px] object-contain"
                  />
                ) : (
                  <h1 className="text-xl font-black tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent truncate">
                    {agencyBranding.brandName}
                  </h1>
                )}
                {agencyBranding.agencyName ? (
                  <p className="text-[10px] text-slate-500 truncate">
                    {agencyBranding.agencyName}
                  </p>
                ) : null}
              </div>
            )}
            <button
              type="button"
              disabled={isSidebarCollapseLocked}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className={`ml-auto rounded-md border border-slate-700 bg-slate-900/60 p-1.5 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50 ${sidebarCollapsed && !isMobileMenuOpen ? "absolute right-3" : ""} ${isMobileMenuOpen ? "hidden" : "flex"}`}
              title={
                isSidebarCollapseLocked
                  ? "Sidebar collapse is locked on System Registry"
                  : sidebarCollapsed
                    ? "Expand sidebar"
                    : "Collapse sidebar"
              }
            >
              {sidebarCollapsed ? (
                <ChevronsRight size={14} />
              ) : (
                <ChevronsLeft size={14} />
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="p-4 flex-1 overflow-y-auto space-y-6 scrollbar-hide mt-4">
            {/* ── OVERVIEW ── */}
            {customizedOverviewNavItems.length > 0 && (
              <div className="space-y-1">
                <h3
                  className={`text-[10px] uppercase text-slate-500 tracking-[0.2em] font-bold mb-3 flex items-center gap-2 ${sidebarCollapsed && !isMobileMenuOpen ? "justify-center px-0" : "px-3"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  {(!sidebarCollapsed || isMobileMenuOpen) &&
                    (workspaceConfig.sidebar.sectionLabels.overview !==
                      DEFAULT_ADMIN_WORKSPACE.sidebar.sectionLabels.overview
                      ? workspaceConfig.sidebar.sectionLabels.overview
                      : t("section.overview", "Overview"))}
                </h3>
                {customizedOverviewNavItems.map((item) => (
                  <NavItem
                    key={item.id}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isPathActive(pathname, item.href)}
                    collapsed={sidebarCollapsed && !isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
            {customizedFrontendNavItems.length > 0 && (
              <div className="space-y-1">
                <h3
                  className={`text-[10px] uppercase text-cyan-500/70 tracking-[0.2em] font-bold mb-3 flex items-center gap-2 ${sidebarCollapsed && !isMobileMenuOpen ? "justify-center px-0" : "px-3"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
                  {(!sidebarCollapsed || isMobileMenuOpen) &&
                    (workspaceConfig.sidebar.sectionLabels.frontend !==
                      DEFAULT_ADMIN_WORKSPACE.sidebar.sectionLabels.frontend
                      ? workspaceConfig.sidebar.sectionLabels.frontend
                      : t("section.frontend", "Frontend"))}
                </h3>
                {customizedFrontendNavItems.map((item) => (
                  <NavItem
                    key={item.id}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isPathActive(pathname, item.href)}
                    collapsed={sidebarCollapsed && !isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}

            {customizedRuntimeNavGroups.map((group) => {
              const meta = SECTION_META[group.id] || SECTION_META.modules;
              const sectionKey = group.id as AdminWorkspaceSectionKey;
              const sectionLabel =
                sectionKey in workspaceConfig.sidebar.sectionLabels &&
                  workspaceConfig.sidebar.sectionLabels[sectionKey] !==
                  DEFAULT_ADMIN_WORKSPACE.sidebar.sectionLabels[sectionKey]
                  ? workspaceConfig.sidebar.sectionLabels[sectionKey]
                  : t(meta.labelKey, meta.label);
              return (
                <div key={group.id} className="space-y-1">
                  <h3
                    className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-3 flex items-center gap-2 ${meta.headingClass} ${sidebarCollapsed && !isMobileMenuOpen ? "justify-center px-0" : "px-3"}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`}
                    ></span>
                    {(!sidebarCollapsed || isMobileMenuOpen) && sectionLabel}
                  </h3>
                  {group.items.map((nav) => {
                    const IconComponent = resolveNavIcon(nav.icon);
                    return (
                      <NavItem
                        key={nav.id}
                        href={nav.path}
                        icon={<IconComponent size={16} />}
                        label={nav.label}
                        active={isPathActive(pathname, nav.path)}
                        collapsed={sidebarCollapsed && !isMobileMenuOpen}
                        onClick={() => setIsMobileMenuOpen(false)}
                      />
                    );
                  })}
                </div>
              );
            })}

            {/* ── PLATFORM (strict role-scope items) ── */}
            {customizedPlatformNavItems.length > 0 && (
              <div className="space-y-1">
                <h3
                  className={`text-[10px] uppercase text-cyan-500/70 tracking-[0.2em] font-bold mb-3 flex items-center gap-2 ${sidebarCollapsed && !isMobileMenuOpen ? "justify-center px-0" : "px-3"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(0,240,255,0.8)]"></span>
                  {(!sidebarCollapsed || isMobileMenuOpen) &&
                    (workspaceConfig.sidebar.sectionLabels.platform !==
                      DEFAULT_ADMIN_WORKSPACE.sidebar.sectionLabels.platform
                      ? workspaceConfig.sidebar.sectionLabels.platform
                      : t("section.platform", "Platform"))}
                </h3>
                {customizedPlatformNavItems.map((item) => (
                  <NavItem
                    key={item.id}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    active={isPathActive(pathname, item.href)}
                    collapsed={sidebarCollapsed && !isMobileMenuOpen}
                    onClick={() => setIsMobileMenuOpen(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Context Footer */}
          <div className="mt-auto border-t border-slate-800/80 bg-black/40 relative p-3">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
            <div
              className={`text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-semibold flex items-center ${sidebarCollapsed && !isMobileMenuOpen ? "justify-center" : "justify-between"}`}
            >
              <span>{t("topbar.activeNode", "Active Node")}</span>
              {(!sidebarCollapsed || isMobileMenuOpen) && (
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-500 font-mono">
                    {t("topbar.live", "LIVE")}
                  </span>
                </span>
              )}
            </div>
            <div
              className={`font-mono text-xs text-cyan-300 bg-cyan-950/30 px-3 py-2 rounded-md border border-cyan-900/50 shadow-inner break-all ${sidebarCollapsed && !isMobileMenuOpen ? "text-center px-1 text-[10px]" : ""}`}
            >
              {sidebarCollapsed && !isMobileMenuOpen ? (
                <span className="text-slate-400">{activeTenant}</span>
              ) : (
                <>
                  <span className="text-slate-500 mr-2">db:</span>kalp_tenant_
                  {activeTenant}
                </>
              )}
            </div>
            {(!sidebarCollapsed || isMobileMenuOpen) && canSwitchTenant && (
              <div className="mt-2 space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-slate-500">
                  {t("topbar.switchTenant", "Switch Tenant")}
                </label>
                <button
                  type="button"
                  disabled={tenantOptionsLoading || tenantSwitchingTo !== null}
                  onClick={() => setTenantPickerOpen(true)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-left text-xs text-slate-100 focus:border-cyan-500/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 hover:border-cyan-500/40"
                >
                  {tenantOptionsLoading ? (
                    t("common.loading", "Loading...")
                  ) : (
                    <span className="flex items-center justify-between">
                      <span className="truncate">
                        {tenantOptions.find((item) => item.key === activeTenant)
                          ?.name || activeTenant}{" "}
                        ({activeTenant})
                      </span>
                      <span className="text-slate-500">
                        {tenantOptions.length || 1}
                      </span>
                    </span>
                  )}
                </button>
                {tenantSwitchingTo && (
                  <p className="text-[10px] text-cyan-300/80">
                    {t("topbar.switching", "Switching")}... {tenantSwitchingTo}
                  </p>
                )}
                {tenantSwitchError && (
                  <p className="text-[10px] text-rose-300">
                    {tenantSwitchError}
                  </p>
                )}
              </div>
            )}

            {authCtx.user && (
              <div
                className={`mt-3 rounded-lg border border-slate-800 bg-slate-900/60 ${sidebarCollapsed && !isMobileMenuOpen ? "p-2" : "p-3"}`}
              >
                <div
                  className={`flex items-center ${sidebarCollapsed && !isMobileMenuOpen ? "justify-center" : "justify-between"} gap-2`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
                      {authCtx.user.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    {(!sidebarCollapsed || isMobileMenuOpen) && (
                      <div className="min-w-0">
                        <div className="text-xs text-white font-medium leading-none truncate">
                          {authCtx.user.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono truncate">
                          {authCtx.user.email}
                        </div>
                      </div>
                    )}
                  </div>
                  {(!sidebarCollapsed || isMobileMenuOpen) && (
                    <div className="flex items-center gap-1">
                      <Link
                        href="/settings/user"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-200"
                        title={t("nav.userSettings", "User Settings")}
                      >
                        <Settings size={13} />
                      </Link>
                      <button
                        onClick={handlelogout}
                       // onClick={() => authCtx.logout()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                        title={t("auth.logout", "Logout")}
                      >
                        <LogOut size={13} />
                      </button>
                    </div>
                  )}
                  {sidebarCollapsed && !isMobileMenuOpen && (
                    <button
                      onClick={handlelogout}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                      title={t("auth.logout", "Logout")}
                    >
                      <LogOut size={13} />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <div
          className="relative flex min-h-0 min-w-0 flex-1 flex-col transition-[padding-right] duration-300"
          style={{ paddingRight: isQuickBodhDrawerOpen ? 420 : 0 }}
        >
          {/* Glass Topbar */}
          <header
            className="h-16 bg-slate-950/50 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30"
            style={chromeSurfaceStyle}
          >
            <div className="flex items-center gap-3">
              {/* Mobile Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 -ml-2 text-slate-400 hover:text-white md:hidden"
                aria-label="Toggle Menu"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center gap-2 text-sm font-mono text-slate-400">
                <span className="text-cyan-500/50">~</span>
                <span className="text-slate-500">/</span>
                <span className="text-slate-200 truncate max-w-[100px] md:max-w-none">
                  {pathname === "/"
                    ? t("nav.dashboard", "Dashboard")
                    : pathname.replace("/", "")}
                </span>
                <span className="animate-pulse text-cyan-400 font-bold">_</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {canRoleAccessAdminPath(activeRole, "/front-builder-v2") && (
                <Link
                  href="/front-builder-v2"
                  className="hidden xl:inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/40"
                  title="Open Website Builder V2"
                >
                  <Wand2 size={13} />
                  Builder
                </Link>
              )}
              {canShowProposalBuilder && (
                <Link
                  href="/proposal-builder"
                  className="hidden 2xl:inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/40"
                  title="Open Proposal Builder"
                >
                  <FileText size={13} />
                  Proposal
                </Link>
              )}
              {canShowResumeBuilder && (
                <Link
                  href="/resume-builder"
                  className="hidden 2xl:inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/40"
                  title="Open Resume Builder"
                >
                  <FileText size={13} />
                  Resume
                </Link>
              )}
              {canShowPortfolioProfileBuilder && (
                <Link
                  href="/portfolio-profile-builder"
                  className="hidden 2xl:inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-cyan-500/40"
                  title="Open Portfolio Builder"
                >
                  <FileText size={13} />
                  Portfolio
                </Link>
              )}
              {canOpenKalpBodhDrawer && (
                <button
                  type="button"
                  onClick={() => setQuickBodhOpen((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${isQuickBodhDrawerOpen
                      ? "border-cyan-400/60 bg-cyan-500/20 text-cyan-100"
                      : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500"
                    }`}
                  title="Open KalpBodh quick assistant"
                >
                  <Bot size={13} />
                  Ask
                </button>
              )}
              {/* Language Switcher */}
              <LanguageSwitcher />
              <div className="hidden sm:flex items-center gap-4 bg-slate-900/50 px-2 py-1.5 rounded-full border border-slate-800 shadow-inner">
                <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-2">
                  {t("topbar.role", "Role")}:
                </div>
                <RoleSwitcher />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main
            className="kalp-admin-main flex-1 min-h-0 overflow-y-auto relative"
            style={mainStyle}
          >
            <div className="kalp-admin-page">{children}</div>
          </main>
        </div>

        {tenantPickerOpen && canSwitchTenant && (
          <div className="absolute inset-0 z-[80] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {t("topbar.switchTenant", "Switch Tenant")}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Search by business name or tenant key.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTenantPickerOpen(false)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  aria-label="Close tenant picker"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="p-4">
                <div className="relative">
                  <SearchIcon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                  <input
                    value={tenantPickerQuery}
                    onChange={(event) =>
                      setTenantPickerQuery(event.target.value)
                    }
                    placeholder="Search tenant..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-9 py-2 text-sm text-slate-100 focus:border-cyan-500/60 focus:outline-none"
                  />
                </div>
                <div className="mt-3 max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  {filteredTenantOptions.length === 0 ? (
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-500">
                      No tenants match this search.
                    </div>
                  ) : (
                    filteredTenantOptions.map((item) => {
                      const isActive = item.key === activeTenant;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => {
                            void handleTenantSwitch(item?.key ?? "");
                          }}
                          disabled={tenantSwitchingTo !== null}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition ${isActive
                              ? "border-cyan-500/40 bg-cyan-500/10"
                              : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                            } disabled:cursor-not-allowed disabled:opacity-70`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-100">
                                {item.name}
                              </div>
                              <div className="truncate text-[11px] font-mono text-slate-500">
                                {item.key}
                              </div>
                            </div>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${isActive
                                  ? "border-cyan-500/40 text-cyan-300"
                                  : "border-slate-700 text-slate-500"
                                }`}
                            >
                              {isActive
                                ? "Active"
                                : item.subscriptionLevel || "tenant"}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {canOpenKalpBodhDrawer && (
          <KalpBodhQuickDrawer
            open={isQuickBodhDrawerOpen}
            onClose={() => setQuickBodhOpen(false)}
          />
        )}
        {/* <Koshie /> */}
      </div>
    </>
  );
}

function NavItem({
  href,
  icon,
  label,
  active = false,
  borderHover = false,
  collapsed = false,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  borderHover?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    router.push(href);
    if (onClick) onClick();
  };

  return (
    <button
      onClick={handleClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-300 relative group overflow-hidden ${collapsed ? "justify-center px-2" : "px-3"} ${active ? "bg-cyan-500/10 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"}`}
    >
      {/* Active Indicator Line */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-cyan-400 rounded-r-md shadow-[0_0_10px_rgba(0,240,255,0.8)]"></div>
      )}

      {/* Icon */}
      <span
        className={`relative z-10 transition-colors ${active ? "text-cyan-400" : "group-hover:text-cyan-400/70"}`}
      >
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span
          className={`relative z-10 tracking-wide ${active ? "font-medium" : "font-normal"}`}
        >
          {label}
        </span>
      )}

      {/* Optional border glow on hover */}
      {borderHover && !active && (
        <div className="absolute inset-0 border border-transparent group-hover:border-cyan-500/30 rounded-lg transition-colors pointer-events-none"></div>
      )}
    </button>
  );
}
