export interface TenantOwnerAdminRef {
  email?: string;
  userId?: string;
}

export interface OwnerAdminUser {
  userId: string;
  name: string;
  email: string;
  status: string;
  role: string;
}

export interface TenantRecord {
  _id: string;
  key: string;
  name: string;
  subscriptionLevel: string;
  industry?: string;
  businessType?: unknown;
  claimStatus?: string;
  createdAt: string;
  ownerAdmin?: TenantOwnerAdminRef;
  ownerAdminUser?: OwnerAdminUser | null;
  accountType?: "business" | "personal_portfolio" | string;
  provisioningMode?: "full_tenant" | "lite_profile" | string;
  primaryDomain?: string[];
  publicProfile?: {
    slug?: string;
    subdomain?: string;
    canonicalDomain?: string;
  };
  languages?: string[];
  primaryLanguage?: string;
  enabledModules?: string[];
  userCount?: number;
  businessContexts?: string[];
}

export type DeleteState = {
  tenant: TenantRecord;
  purgeTenantDb: boolean;
};

export type TenantEditFormState = {
  name: string;
  subscriptionLevel: string;
  industry: string;
  businessTypeInput: string;
  claimStatus: string;
  accountType: string;
  provisioningMode: string;
  primaryDomainsInput: string;
  languagesInput: string;
  primaryLanguage: string;
  publicSlug: string;
  ownerAdminName: string;
  ownerAdminEmail: string;
  enabledModules: string[];
};

export const KNOWN_MODULE_KEYS = [
  "website",
  "branding",
  "products",
  "ecommerce",
  "bookings",
  "marketing",
  "blog",
  "portfolio",
  "media",
  "invoicing",
  "source",
  "kalpbodh",
  "hotel_management",
  "tour_management",
];

export function parseApiError(value: unknown, fallback: string): string {
  if (typeof value === "object" && value !== null && "error" in value) {
    const error = (value as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

export function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCommaSeparatedInput(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

export function describeBusinessType(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        const record = item as Record<string, unknown>;
        if (typeof record.name === "string" && record.name.trim()) {
          return record.name.trim();
        }
        if (typeof record.key === "string" && record.key.trim()) {
          return record.key.trim();
        }
        return "";
      })
      .filter(Boolean)
      .join(", ");
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.name === "string" && record.name.trim()) {
      return record.name.trim();
    }
    if (typeof record.key === "string" && record.key.trim()) {
      return record.key.trim();
    }
  }
  return "";
}

export function deriveTenantDatabaseLabel(tenant: TenantRecord): string {
  return tenant.provisioningMode === "lite_profile"
    ? "Shared master database"
    : `kalp_tenant_${tenant.key}`;
}

export function buildEditForm(tenant: TenantRecord): TenantEditFormState {
  return {
    name: tenant.name || "",
    subscriptionLevel: tenant.subscriptionLevel || "starter",
    industry: tenant.industry || "",
    businessTypeInput: describeBusinessType(tenant.businessType),
    claimStatus: tenant.claimStatus || "free_unclaimed",
    accountType: tenant.accountType || "business",
    provisioningMode: tenant.provisioningMode || "full_tenant",
    primaryDomainsInput: toStringList(tenant.primaryDomain).join(", "),
    languagesInput: toStringList(tenant.languages).join(", "),
    primaryLanguage: tenant.primaryLanguage || "en",
    publicSlug: tenant.publicProfile?.slug || "",
    ownerAdminName: tenant.ownerAdminUser?.name || "",
    ownerAdminEmail:
      tenant.ownerAdminUser?.email || tenant.ownerAdmin?.email || "",
    enabledModules: toStringList(tenant.enabledModules),
  };
}
