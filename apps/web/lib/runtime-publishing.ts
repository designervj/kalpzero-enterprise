import type {
  BlueprintRouteDto,
  BusinessBlueprintDto,
  DashboardWidgetDto,
  DiscoveryDocumentDto,
  NavigationItemDto,
  PageBlockDto,
  PageBlockItemDto,
  PublicSitePayloadDto,
  PublishedPageDocumentDto,
  ThemeTokensDto
} from "@kalpzero/contracts";

function normalizeApiBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

const apiBaseUrl = normalizeApiBaseUrl(
  process.env.KALPZERO_INTERNAL_API_URL ??
  process.env.KALPZERO_API_PROXY_URL ??
  process.env.KALPZERO_PUBLIC_API_URL ??
  "http://127.0.0.1:8012"
);

function titleCaseFromSlug(value: string) {
  return value
    .split(/[-_/]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function fallbackTheme(tenantSlug: string, mode: "public" | "admin"): ThemeTokensDto {
  const brandName = titleCaseFromSlug(tenantSlug);
  if (mode === "admin") {
    return {
      brandName: `${brandName} Admin`,
      primaryColor: "#142235",
      accentColor: "#d65d0e",
      surfaceColor: "#f4f7fb",
      inkColor: "#142235",
      mutedColor: "#697687",
      headingFont: "Space Grotesk",
      bodyFont: "Space Grotesk",
      radiusScale: "soft",
      density: "compact",
      motionProfile: "minimal"
    };
  }

  return {
    brandName,
    primaryColor: "#1d4f91",
    accentColor: "#d65d0e",
    surfaceColor: "#f9f6f1",
    inkColor: "#142235",
    mutedColor: "#697687",
    headingFont: "Fraunces",
    bodyFont: "Space Grotesk",
    radiusScale: "rounded",
    density: "comfortable",
    motionProfile: "calm"
  };
}

function fallbackBlueprintPreview(tenantSlug: string): BusinessBlueprintDto {
  const brandName = titleCaseFromSlug(tenantSlug);
  return {
    tenantId: tenantSlug,
    tenantSlug,
    version: 1,
    businessLabel: brandName,
    verticalPacks: ["commerce", "hotel"],
    enabledModules: ["publishing.pages", "publishing.discovery", "commerce", "hotel"],
    publicTheme: fallbackTheme(tenantSlug, "public"),
    adminTheme: fallbackTheme(tenantSlug, "admin"),
    publicNavigation: [
      { label: "Home", href: "/", kind: "link", icon: "home" },
      { label: "Catalog", href: "/catalog", kind: "link", icon: "bag" },
      { label: "Stay", href: "/stay", kind: "link", icon: "key" },
      { label: "Contact", href: "/contact", kind: "cta", icon: "mail" }
    ],
    adminNavigation: [
      { label: "Overview", href: "/admin", kind: "module", icon: "dashboard" },
      { label: "Publishing", href: "/admin/publishing", kind: "module", icon: "paintbrush" },
      { label: "Operations", href: "/admin/hotel", kind: "module", icon: "stack" }
    ],
    routes: [
      { key: "home", path: "/", pageSlug: "home", visibility: "public" },
      { key: "catalog", path: "/catalog", pageSlug: "catalog", visibility: "public" },
      { key: "stay", path: "/stay", pageSlug: "stay", visibility: "public" }
    ],
    dashboardWidgets: [
      {
        key: "orders",
        title: "Orders",
        metric: "24",
        description: "Observe catalog-driven transactions."
      },
      {
        key: "occupancy",
        title: "Occupancy",
        metric: "81%",
        description: "Preview hospitality operations from the same blueprint."
      }
    ],
    vocabulary: {
      customer: "Guest",
      order: "Order",
      booking: "Reservation",
      location: "Property"
    },
    mobileCapabilities: ["push_notifications", "digital_checkin"]
  };
}

function fallbackPublicSitePayload(tenantSlug: string, pageSlug: string): PublicSitePayloadDto {
  const blueprint = fallbackBlueprintPreview(tenantSlug);
  const pageTitle = pageSlug === "home" ? blueprint.businessLabel : `${blueprint.businessLabel} ${titleCaseFromSlug(pageSlug)}`;

  return {
    tenantSlug,
    businessLabel: blueprint.businessLabel,
    publicTheme: blueprint.publicTheme,
    publicNavigation: blueprint.publicNavigation,
    vocabulary: blueprint.vocabulary,
    page: {
      id: `${tenantSlug}:${pageSlug}`,
      tenantSlug,
      pageSlug,
      routePath: pageSlug === "home" ? "/" : `/${pageSlug}`,
      title: pageTitle,
      status: "live",
      seoTitle: pageTitle,
      seoDescription: "Blueprint-driven public page served from the common Kalp runtime.",
      layout: pageSlug === "catalog" ? "catalog" : "landing",
      blocks: [
        {
          id: "hero",
          kind: "hero",
          eyebrow: blueprint.businessLabel,
          headline: `A tenant-specific ${titleCaseFromSlug(pageSlug)} page without a tenant-specific codebase.`,
          body: "Theme tokens, routes, and content blocks come from one blueprint contract that can later power web, admin, and native surfaces.",
          ctaLabel: "Open Admin Preview",
          ctaHref: `/studio/${tenantSlug}`,
          items: []
        },
        {
          id: "features",
          kind: "feature_grid",
          headline: "Why this architecture scales",
          body: "Each business gets SEO and design flexibility without forking the platform.",
          items: [
            {
              title: "Next.js public runtime",
              description: "SSR and SEO-friendly pages rendered from runtime docs."
            },
            {
              title: "Common API",
              description: "Business logic, modules, and data stay centralized."
            },
            {
              title: "Theme and block registry",
              description: "Distinct UI direction with reusable components."
            }
          ]
        },
        {
          id: "stats",
          kind: "stat_strip",
          headline: "Blueprint Stats",
          items: [
            { title: "Routes", value: `${blueprint.routes.length}` },
            { title: "Modules", value: `${blueprint.enabledModules.length}` },
            { title: "Widgets", value: `${blueprint.dashboardWidgets.length}` }
          ]
        }
      ]
    },
    discovery: {
      tenantSlug,
      headline: `${blueprint.businessLabel} discovery surface`,
      summary: "Discovery cards can be materialized from runtime documents for SEO and search exposure.",
      tags: blueprint.verticalPacks,
      cards: blueprint.routes.map((route) => ({
        title: titleCaseFromSlug(route.key),
        summary: `Public route ${route.path} driven by the blueprint registry.`,
        href: route.path,
        tags: blueprint.verticalPacks
      }))
    }
  };
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(record: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }
  return [];
}

function normalizeThemeTokens(
  value: unknown,
  tenantSlug: string,
  mode: "public" | "admin",
): ThemeTokensDto {
  const fallback = fallbackTheme(tenantSlug, mode);
  if (!isRecord(value)) {
    return fallback;
  }

  const colors = isRecord(value.colors) ? value.colors : {};
  const typography = isRecord(value.typography) ? value.typography : {};
  const radiusScale = readString(value, ["radiusScale", "radius_scale"]);
  const density = readString(value, ["density"]);
  const motionProfile = readString(value, ["motionProfile", "motion_profile"]);

  return {
    brandName:
      readString(value, ["brandName", "brand_name"]) ?? fallback.brandName,
    primaryColor:
      readString(value, ["primaryColor", "primary_color"]) ??
      readString(colors, ["primary"]) ??
      fallback.primaryColor,
    accentColor:
      readString(value, ["accentColor", "accent_color"]) ??
      readString(colors, ["accent"]) ??
      fallback.accentColor,
    surfaceColor:
      readString(value, ["surfaceColor", "surface_color"]) ??
      readString(colors, ["surface", "background"]) ??
      fallback.surfaceColor,
    inkColor:
      readString(value, ["inkColor", "ink_color"]) ??
      readString(colors, ["text"]) ??
      fallback.inkColor,
    mutedColor:
      readString(value, ["mutedColor", "muted_color"]) ??
      fallback.mutedColor,
    headingFont:
      readString(value, ["headingFont", "heading_font"]) ??
      readString(typography, ["headingFont", "heading_font"]) ??
      fallback.headingFont,
    bodyFont:
      readString(value, ["bodyFont", "body_font"]) ??
      readString(typography, ["bodyFont", "body_font"]) ??
      fallback.bodyFont,
    radiusScale:
      radiusScale === "sharp" || radiusScale === "soft" || radiusScale === "rounded"
        ? radiusScale
        : fallback.radiusScale,
    density:
      density === "compact" || density === "comfortable" || density === "spacious"
        ? density
        : fallback.density,
    motionProfile:
      motionProfile === "minimal" || motionProfile === "calm" || motionProfile === "lively"
        ? motionProfile
        : fallback.motionProfile,
  };
}

function normalizeNavigationItem(value: unknown): NavigationItemDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = readString(value, ["label"]);
  const href = readString(value, ["href"]);
  const kind = readString(value, ["kind"]);
  if (!label || !href) {
    return null;
  }

  return {
    label,
    href,
    kind:
      kind === "link" || kind === "cta" || kind === "module"
        ? kind
        : "link",
    icon: readString(value, ["icon"]),
  };
}

function normalizeBlueprintRoute(value: unknown): BlueprintRouteDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = readString(value, ["key"]);
  const path = readString(value, ["path"]);
  const pageSlug = readString(value, ["pageSlug", "page_slug"]);
  const visibility = readString(value, ["visibility"]);
  if (!key || !path || !pageSlug) {
    return null;
  }

  return {
    key,
    path,
    pageSlug,
    visibility: visibility === "private" ? "private" : "public",
  };
}

function normalizeDashboardWidget(value: unknown): DashboardWidgetDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const key = readString(value, ["key"]);
  const title = readString(value, ["title"]);
  const metric = readString(value, ["metric"]);
  const description = readString(value, ["description"]);
  if (!key || !title || !metric || !description) {
    return null;
  }

  return { key, title, metric, description };
}

function normalizePageBlockItem(value: unknown): PageBlockItemDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = readString(value, ["title"]);
  if (!title) {
    return null;
  }

  return {
    title,
    description: readString(value, ["description"]),
    value: readString(value, ["value"]),
    href: readString(value, ["href"]),
  };
}

function normalizePageBlock(value: unknown, index: number): PageBlockDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const kind = readString(value, ["kind"]);
  if (!kind) {
    return null;
  }

  return {
    id: readString(value, ["id"]) ?? `block-${index + 1}`,
    kind:
      kind === "hero" ||
      kind === "feature_grid" ||
      kind === "stat_strip" ||
      kind === "cta" ||
      kind === "rich_text"
        ? kind
        : "rich_text",
    eyebrow: readString(value, ["eyebrow"]),
    headline: readString(value, ["headline"]),
    body: readString(value, ["body"]),
    ctaLabel: readString(value, ["ctaLabel", "cta_label"]),
    ctaHref: readString(value, ["ctaHref", "cta_href"]),
    items: Array.isArray(value.items)
      ? value.items
          .map((item) => normalizePageBlockItem(item))
          .filter((item): item is PageBlockItemDto => Boolean(item))
      : [],
  };
}

function normalizePublishedPageDocument(
  value: unknown,
  tenantSlug: string,
  pageSlug: string,
): PublishedPageDocumentDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const status = readString(value, ["status"]);
  const layout = readString(value, ["layout"]);

  return {
    id: readString(value, ["id"]) ?? `${tenantSlug}:${pageSlug}`,
    tenantSlug:
      readString(value, ["tenantSlug", "tenant_slug"]) ?? tenantSlug,
    pageSlug: readString(value, ["pageSlug", "page_slug"]) ?? pageSlug,
    routePath:
      readString(value, ["routePath", "route_path"]) ??
      (pageSlug === "home" ? "/" : `/${pageSlug}`),
    title:
      readString(value, ["title"]) ??
      `${titleCaseFromSlug(tenantSlug)} ${titleCaseFromSlug(pageSlug)}`,
    status:
      status === "draft" || status === "preview" || status === "live"
        ? status
        : "preview",
    seoTitle: readString(value, ["seoTitle", "seo_title"]),
    seoDescription: readString(value, ["seoDescription", "seo_description"]),
    layout:
      layout === "landing" || layout === "content" || layout === "catalog"
        ? layout
        : "landing",
    blocks: Array.isArray(value.blocks)
      ? value.blocks
          .map((item, index) => normalizePageBlock(item, index))
          .filter((item): item is PageBlockDto => Boolean(item))
      : [],
  };
}

function normalizeDiscoveryDocument(
  value: unknown,
  tenantSlug: string,
): DiscoveryDocumentDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const cards = Array.isArray(value.cards)
    ? value.cards
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }
          const title = readString(item, ["title"]);
          const summary = readString(item, ["summary"]);
          const href = readString(item, ["href"]);
          if (!title || !summary || !href) {
            return null;
          }
          return {
            title,
            summary,
            href,
            tags: readStringList(item.tags),
          };
        })
        .filter(
          (item): item is DiscoveryDocumentDto["cards"][number] =>
            Boolean(item),
        )
    : [];

  return {
    tenantSlug:
      readString(value, ["tenantSlug", "tenant_slug"]) ?? tenantSlug,
    headline:
      readString(value, ["headline"]) ??
      `${titleCaseFromSlug(tenantSlug)} discovery surface`,
    summary:
      readString(value, ["summary"]) ??
      "Discovery metadata is available for this tenant.",
    tags: readStringList(value.tags),
    cards,
  };
}

function normalizeVocabulary(value: unknown): Record<string, string> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>((acc, [key, item]) => {
    if (typeof item === "string" && item.trim()) {
      acc[key] = item.trim();
    }
    return acc;
  }, {});
}

function normalizeBusinessBlueprint(
  value: unknown,
  tenantSlug: string,
): BusinessBlueprintDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const fallback = fallbackBlueprintPreview(tenantSlug);
  const verticalPacks = readStringList(
    value.verticalPacks ?? value.vertical_packs ?? value.vertical_pack,
  );
  const enabledModules = readStringList(
    value.enabledModules ?? value.enabled_modules,
  );
  const rawDashboardWidgets = value.dashboardWidgets ?? value.dashboard_widgets;
  const rawPublicNavigation = value.publicNavigation ?? value.public_navigation;
  const rawAdminNavigation = value.adminNavigation ?? value.admin_navigation;
  const routes = Array.isArray(value.routes)
    ? value.routes
        .map((item) => normalizeBlueprintRoute(item))
        .filter((item): item is BlueprintRouteDto => Boolean(item))
    : [];
  const dashboardWidgets = Array.isArray(rawDashboardWidgets)
    ? rawDashboardWidgets
        .map((item: unknown) => normalizeDashboardWidget(item))
        .filter((item): item is DashboardWidgetDto => Boolean(item))
    : [];
  const publicNavigation = Array.isArray(rawPublicNavigation)
    ? rawPublicNavigation
        .map((item: unknown) => normalizeNavigationItem(item))
        .filter((item): item is NavigationItemDto => Boolean(item))
    : [];
  const adminNavigation = Array.isArray(rawAdminNavigation)
    ? rawAdminNavigation
        .map((item: unknown) => normalizeNavigationItem(item))
        .filter((item): item is NavigationItemDto => Boolean(item))
    : [];
  const versionValue = value.version;

  return {
    tenantId: readString(value, ["tenantId", "tenant_id"]) ?? tenantSlug,
    tenantSlug:
      readString(value, ["tenantSlug", "tenant_slug"]) ?? tenantSlug,
    version:
      typeof versionValue === "number" && Number.isFinite(versionValue)
        ? versionValue
        : fallback.version,
    businessLabel:
      readString(value, ["businessLabel", "business_label"]) ??
      fallback.businessLabel,
    verticalPacks:
      verticalPacks.length > 0 ? verticalPacks : fallback.verticalPacks,
    enabledModules:
      enabledModules.length > 0 ? enabledModules : fallback.enabledModules,
    publicTheme: normalizeThemeTokens(
      value.publicTheme ?? value.public_theme,
      tenantSlug,
      "public",
    ),
    adminTheme: normalizeThemeTokens(
      value.adminTheme ?? value.admin_theme,
      tenantSlug,
      "admin",
    ),
    publicNavigation:
      publicNavigation.length > 0 ? publicNavigation : fallback.publicNavigation,
    adminNavigation:
      adminNavigation.length > 0 ? adminNavigation : fallback.adminNavigation,
    routes: routes.length > 0 ? routes : fallback.routes,
    dashboardWidgets:
      dashboardWidgets.length > 0
        ? dashboardWidgets
        : fallback.dashboardWidgets,
    vocabulary: {
      ...fallback.vocabulary,
      ...normalizeVocabulary(value.vocabulary),
    },
    mobileCapabilities:
      readStringList(value.mobileCapabilities ?? value.mobile_capabilities)
        .length > 0
        ? readStringList(value.mobileCapabilities ?? value.mobile_capabilities)
        : fallback.mobileCapabilities,
  };
}

function normalizePublicSitePayload(
  value: unknown,
  tenantSlug: string,
  pageSlug: string,
): PublicSitePayloadDto | null {
  if (!isRecord(value)) {
    return null;
  }

  const fallback = fallbackPublicSitePayload(tenantSlug, pageSlug);
  const rawPublicNavigation = value.publicNavigation ?? value.public_navigation;
  const publicNavigation = Array.isArray(rawPublicNavigation)
    ? rawPublicNavigation
        .map((item: unknown) => normalizeNavigationItem(item))
        .filter((item): item is NavigationItemDto => Boolean(item))
    : [];
  const page = normalizePublishedPageDocument(value.page, tenantSlug, pageSlug);
  const discovery = normalizeDiscoveryDocument(value.discovery, tenantSlug);
  const vocabulary = normalizeVocabulary(value.vocabulary);

  return {
    tenantSlug:
      readString(value, ["tenantSlug", "tenant_slug"]) ?? tenantSlug,
    businessLabel:
      readString(value, ["businessLabel", "business_label"]) ??
      fallback.businessLabel,
    publicTheme: normalizeThemeTokens(
      value.publicTheme ?? value.public_theme,
      tenantSlug,
      "public",
    ),
    publicNavigation:
      publicNavigation.length > 0 ? publicNavigation : fallback.publicNavigation,
    vocabulary:
      Object.keys(vocabulary).length > 0 ? vocabulary : fallback.vocabulary,
    page: page ?? fallback.page,
    discovery: discovery ?? fallback.discovery,
  };
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch {
    return null;
  }
}

export async function getTenantSlugForHost(host: string): Promise<string | null> {
  const payload = await fetchJson(
    `${apiBaseUrl}/publishing/public/resolve-host?host=${encodeURIComponent(host)}`,
  );
  if (!isRecord(payload)) {
    return null;
  }

  return (
    readString(payload, ["tenantSlug", "tenant_slug"]) ?? null
  );
}

export async function getPublicSitePayload(
  tenantSlug: string,
  pageSlug: string
): Promise<PublicSitePayloadDto> {
  const payload = await fetchJson(
    `${apiBaseUrl}/publishing/public/${tenantSlug}/site?page_slug=${encodeURIComponent(pageSlug)}`
  );
  return (
    normalizePublicSitePayload(payload, tenantSlug, pageSlug) ??
    fallbackPublicSitePayload(tenantSlug, pageSlug)
  );
}

export async function getBlueprintPreview(tenantSlug: string): Promise<BusinessBlueprintDto> {
  const payload = await fetchJson(
    `${apiBaseUrl}/publishing/public/${tenantSlug}/blueprint-preview`
  );
  return (
    normalizeBusinessBlueprint(payload, tenantSlug) ??
    fallbackBlueprintPreview(tenantSlug)
  );
}
