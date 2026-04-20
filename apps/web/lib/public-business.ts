import type { Db } from "mongodb";
import { getMasterDb, getTenantDb } from "@/lib/db";
import {
  isTravelContextActive,
  resolveBusinessContexts,
} from "@/lib/business-context";
import {
  loadPublishingPolicyBundle,
  normalizeBusinessLifecycleStatus,
  normalizePublishingSlug,
  resolveLifecycleStatusFromClaimStatus,
  validatePublishingSlug,
} from "@/lib/publishing-governance";

export type ClaimStatus =
  | "free_unclaimed"
  | "claimed_pending"
  | "claimed_active"
  | "claimed_inactive";

export interface PublicProfile {
  slug: string;
  visibility: "public" | "private";
  headline: string;
  summary: string;
  logo: string;
  logoUrl: string;
  heroImage: string;
  seoTitle: string;
  seoDescription: string;
  canonicalDomain: string;
  subdomain: string;
  claimStatus: ClaimStatus;
}

export interface PublicBusinessPayload {
  key: string;
  name: string;
  industry: string;
  businessType: string;
  googleAnalyticsId: string;
  subscriptionLevel: string;
  claimStatus: ClaimStatus;
  lifecycleStatus: string;
  publicProfile: PublicProfile;
  brand: Record<string, unknown>;
  brandKit: Record<string, unknown>;
  landingPage: Record<string, unknown> | null;
  featuredProducts: Record<string, unknown>[];
  featuredPortfolio: Record<string, unknown>[];
  seo: {
    title: string;
    description: string;
  };
}

const DEFAULT_BRAND = {
  primary: "#00f0ff",
  secondary: "#8b5cf6",
  accent: "#10b981",
  background: "#030712",
};

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePublicSlug(value: string): string {
  return normalizePublishingSlug(value);
}

export function buildDefaultPublicProfile(
  tenantKey: string,
  tenantName: string,
  businessType?: string,
  industry?: string,
): PublicProfile {
  const slug =
    normalizePublicSlug(tenantName) ||
    normalizePublicSlug(tenantKey) ||
    "business";
  const descriptor = [businessType, industry].filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
  const suffix =
    descriptor.length > 0 ? descriptor.join(" • ") : "Business Profile";

  return {
    slug,
    visibility: "public",
    headline: tenantName,
    summary: `${tenantName} — ${suffix}`,
    logo: "",
    logoUrl: "",
    heroImage: "",
    seoTitle: `${tenantName} | ${suffix}`,
    seoDescription: `${tenantName} public profile and offerings.`,
    canonicalDomain: "",
    subdomain: slug,
    claimStatus: "free_unclaimed",
  };
}

function sanitizeTenantKeyForSlug(value: string): string {
  return normalizePublicSlug(value).replace(/[^a-z0-9-]/g, "");
}

export async function ensureUniquePublicBusinessSlug(
  masterDb: Db,
  preferredSlug: string,
  options?: { excludeTenantKey?: string; maxAttempts?: number },
): Promise<string> {
  const base = normalizePublicSlug(preferredSlug) || "business";
  const maxAttempts =
    typeof options?.maxAttempts === "number" && options.maxAttempts > 0
      ? options.maxAttempts
      : 120;
  const excludeTenantKey =
    typeof options?.excludeTenantKey === "string"
      ? options.excludeTenantKey.trim()
      : "";
  let attempt = 0;

  while (attempt < maxAttempts) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const filter: Record<string, unknown> = {
      $or: [{ "publicProfile.slug": candidate }, { key: candidate }],
    };
    if (excludeTenantKey) {
      filter.key = { $ne: excludeTenantKey };
    }
    const existing = await masterDb
      .collection("tenants")
      .findOne(filter, { projection: { _id: 1, key: 1 } });
    if (!existing) return candidate;
    attempt += 1;
  }

  return `${base}-${Date.now().toString().slice(-6)}`;
}

export async function buildProvisionedPublicProfile(
  masterDb: Db,
  input: {
    tenantKey: string;
    tenantName: string;
    businessType?: string;
    industry?: string;
    requestedSlug?: string;
    excludeTenantKey?: string;
  },
): Promise<PublicProfile> {
  const defaults = buildDefaultPublicProfile(
    input.tenantKey,
    input.tenantName,
    input.businessType,
    input.industry,
  );
  const policy = await loadPublishingPolicyBundle();
  const rawRequested =
    typeof input.requestedSlug === "string" ? input.requestedSlug : "";
  let candidate =
    normalizePublicSlug(rawRequested || defaults.slug || input.tenantKey) ||
    "business";
  const validation = validatePublishingSlug(candidate, policy.slugPolicy);

  if (
    !validation.ok &&
    validation.code !== "reserved" &&
    validation.code !== "blocked_pattern"
  ) {
    const fallback = normalizePublicSlug(input.tenantKey) || "business";
    const fallbackValidation = validatePublishingSlug(
      fallback,
      policy.slugPolicy,
    );
    if (fallbackValidation.ok) {
      candidate = fallbackValidation.normalized;
    } else {
      candidate = `business-${sanitizeTenantKeyForSlug(input.tenantKey) || Date.now().toString().slice(-4)}`;
    }
  } else if (!validation.ok) {
    const safeTail = sanitizeTenantKeyForSlug(input.tenantKey);
    candidate =
      normalizePublicSlug(`${candidate}-${safeTail}`) ||
      normalizePublicSlug(input.tenantKey) ||
      "business";
  } else {
    candidate = validation.normalized;
  }

  const uniqueSlug = await ensureUniquePublicBusinessSlug(masterDb, candidate, {
    excludeTenantKey: input.excludeTenantKey,
  });

  return {
    ...defaults,
    slug: uniqueSlug,
    subdomain: uniqueSlug,
  };
}

function coercePublicProfile(tenant: Record<string, unknown>): PublicProfile {
  const existing =
    tenant.publicProfile && typeof tenant.publicProfile === "object"
      ? (tenant.publicProfile as Record<string, unknown>)
      : {};

  const defaults = buildDefaultPublicProfile(
    String(tenant.key || "business"),
    String(tenant.name || "Business"),
    typeof tenant.businessType === "string" ? tenant.businessType : "",
    typeof tenant.industry === "string" ? tenant.industry : "",
  );

  const claimStatus =
    typeof existing.claimStatus === "string"
      ? existing.claimStatus
      : typeof tenant.claimStatus === "string"
        ? tenant.claimStatus
        : defaults.claimStatus;

  return {
    ...defaults,
    ...existing,
    slug:
      normalizePublicSlug(
        typeof existing.slug === "string" ? existing.slug : defaults.slug,
      ) || defaults.slug,
    claimStatus: claimStatus as ClaimStatus,
  };
}

function isPublicVisible(profile: PublicProfile, preview: boolean): boolean {
  if (preview) return true;
  if (profile.visibility === "private") return false;
  if (profile.claimStatus === "claimed_inactive") return false;
  return true;
}

export async function getPublicBusinessByHost(
  host: string,
  slug?: string,
): Promise<any> {
  if (!host) return null;

  const masterDb = await getMasterDb();

  const tenant = await masterDb.collection("tenants").findOne(
    {
      primaryDomain: {
        $in: [host],
      },
    },
    {
      projection: { key: 1, infraAssignments: 1 },
    },
  );

  if (!tenant) return null;

  const tenatKey = tenant.key;

  if (tenatKey && slug) {
    // return getPublicBusinessPageBySlug(tenatKey, slug);
    return getPublicBusinessAllPages(tenatKey);
  }

  return tenant;
}

export async function getPublicBusinessPageBySlug(
  tenatKey: string,
  slug: string,
  dbsName?: string,
): Promise<any> {
  if (!slug) return null;

  const tenantDb = await getTenantDb(tenatKey);
  const pagesCollection = await tenantDb.collection("pages");
  const page = await pagesCollection.findOne({
    slug: slug,
  });

  if (page) {
    return page;
  } else {
    return null;
  }
}


//get allPages from tenant
export async function getPublicBusinessAllPages(
  tenatKey: string,
  dbsName?: string,
): Promise<any[]> {
  const tenantDb = await getTenantDb(tenatKey);
  const pagesCollection = await tenantDb.collection("pages");
  const pages = await pagesCollection.find({}).toArray();

  return pages || [];
}


export async function getPublicBusinessBySlug(
  slug: string,
  options?: { preview?: boolean },
): Promise<PublicBusinessPayload | null> {
  if (!slug) return null;

  const masterDb = await getMasterDb();
  const tenant = (await masterDb.collection("tenants").findOne({
    $or: [{ "publicProfile.slug": slug }, { key: slug }],
  })) as any;

  if (!tenant) return null;

  const profile = coercePublicProfile(tenant);
  const preview = options?.preview || false;

  if (!isPublicVisible(profile, preview)) return null;

  let landingPage = null;
  let featuredProducts: any[] = [];
  let featuredPortfolio: any[] = [];

  if (tenant.key) {
    try {
      const tenantDb = await getTenantDb(String(tenant.key));
      const [page, products, portfolio] = await Promise.all([
        tenantDb.collection("pages").findOne({ type: "landing" }),
        tenantDb
          .collection("products")
          .find({ status: "published" })
          .limit(6)
          .toArray(),
        tenantDb
          .collection("portfolio_items")
          .find({ status: "published" })
          .limit(6)
          .toArray(),
      ]);
      landingPage = page;
      featuredProducts = products;
      featuredPortfolio = portfolio;
    } catch (err) {
      console.error("Failed to load tenant content signals:", err);
    }
  }

  return {
    key: String(tenant.key),
    name: String(tenant.name || tenant.key),
    industry: String(tenant.industry || ""),
    businessType: String(tenant.businessType || ""),
    googleAnalyticsId: String(tenant.googleAnalyticsId || ""),
    subscriptionLevel: String(tenant.subscriptionLevel || "free"),
    claimStatus: profile.claimStatus,
    lifecycleStatus: String(tenant.lifecycleStatus || "active"),
    publicProfile: profile,
    brand: tenant.brand || DEFAULT_BRAND,
    brandKit: tenant.brandKit || {},
    landingPage,
    featuredProducts,
    featuredPortfolio,
    seo: {
      title: profile.seoTitle || String(tenant.name || tenant.key),
      description: profile.seoDescription || "",
    },
  };
}
