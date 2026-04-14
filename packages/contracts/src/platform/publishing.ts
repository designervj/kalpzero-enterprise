export interface BrandProfileDto {
  tenantId: string;
  legalName: string;
  displayName: string;
  supportEmail?: string;
  supportPhone?: string;
  primaryColor: string;
  accentColor: string;
}

export interface DomainProfileDto {
  id: string;
  tenantId: string;
  host: string;
  isPrimary: boolean;
  sslStatus: "pending" | "active" | "error";
}

export interface PageDto {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  status: "draft" | "preview" | "live";
  seoTitle?: string;
  seoDescription?: string;
}

export interface MediaAssetDto {
  id: string;
  tenantId: string;
  kind: "image" | "video" | "document";
  storageKey: string;
  altText?: string;
}

export interface FormDto {
  id: string;
  tenantId: string;
  key: string;
  title: string;
  fields: Array<{ key: string; label: string; type: string; required: boolean }>;
}

export interface FormResponseDto {
  id: string;
  formId: string;
  tenantId: string;
  submittedAt: string;
  payload: Record<string, unknown>;
}

export interface ThemeTokensDto {
  brandName: string;
  primaryColor: string;
  accentColor: string;
  surfaceColor: string;
  inkColor: string;
  mutedColor: string;
  headingFont: string;
  bodyFont: string;
  radiusScale: "sharp" | "soft" | "rounded";
  density: "compact" | "comfortable" | "spacious";
  motionProfile: "minimal" | "calm" | "lively";
}

export interface NavigationItemDto {
  label: string;
  href: string;
  kind: "link" | "cta" | "module";
  icon?: string;
}

export interface BlueprintRouteDto {
  key: string;
  path: string;
  pageSlug: string;
  visibility: "public" | "private";
}

export interface DashboardWidgetDto {
  key: string;
  title: string;
  metric: string;
  description: string;
}

export interface BusinessBlueprintDto {
  tenantId: string;
  tenantSlug: string;
  version: number;
  businessLabel: string;
  verticalPacks: string[];
  enabledModules: string[];
  publicTheme: ThemeTokensDto;
  adminTheme: ThemeTokensDto;
  publicNavigation: NavigationItemDto[];
  adminNavigation: NavigationItemDto[];
  routes: BlueprintRouteDto[];
  dashboardWidgets: DashboardWidgetDto[];
  vocabulary: Record<string, string>;
  mobileCapabilities: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PageBlockItemDto {
  title: string;
  description?: string;
  value?: string;
  href?: string;
}

export interface PageBlockDto {
  id: string;
  kind: "hero" | "feature_grid" | "stat_strip" | "cta" | "rich_text";
  eyebrow?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  items?: PageBlockItemDto[];
}

export interface PublishedPageDocumentDto {
  id: string;
  tenantSlug: string;
  pageSlug: string;
  routePath: string;
  title: string;
  status: "draft" | "preview" | "live";
  seoTitle?: string;
  seoDescription?: string;
  layout: "landing" | "content" | "catalog";
  blocks: PageBlockDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscoveryCardDto {
  title: string;
  summary: string;
  href: string;
  tags: string[];
}

export interface DiscoveryDocumentDto {
  tenantSlug: string;
  headline: string;
  summary: string;
  tags: string[];
  cards: DiscoveryCardDto[];
  updatedAt?: string;
}

export interface PublicSitePayloadDto {
  tenantSlug: string;
  businessLabel: string;
  publicTheme: ThemeTokensDto;
  publicNavigation: NavigationItemDto[];
  vocabulary: Record<string, string>;
  page: PublishedPageDocumentDto;
  discovery: DiscoveryDocumentDto;
}
