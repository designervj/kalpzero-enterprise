export interface SessionDto {
  email: string;
  tenant_id: string;
  role: string;
  name: string;
  isTenantOwner: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  tenant_slug?: string;
}

export interface LoginResponseDto {
  access_token: string;
  expires_at: string;
  session: SessionDto;
}

export interface MagicUser {
  id: string;
  email: string;
  role: string;
  name: string;
  tenant_slug: string | null;
}

export interface MagicOptionsResponseDto {
  users: MagicUser[];
}

export interface AgencyDto {
  id: string;
  slug: string;
  name: string;
  region: string;
  owner_user_id: string;
  created_at: string;
}

export interface RuntimeBootstrapDto {
  kind?: string;
  database?: string;
  collections?: string[];
  collections_created?: string[];
  index_strategy?: string;
  seeded_documents: Array<{ collection: string; document_key: string }>;
  seeded_document_count: number;
  page_slugs: string[];
}

export interface TenantDto {
  id: string;
  agency_id: string;
  slug: string;
  display_name: string;
  infra_mode: string;
  vertical_packs: string[];
  business_type: string | null;
  feature_flags: string[];
  dedicated_profile_id: string | null;
  created_at: string;
  runtime_documents?: {
    kind: string;
    mode: string;
    database: string;
    collection_count: number;
    collections: Record<string, string>;
    bootstrap: RuntimeBootstrapDto;
  };
}

export interface OnboardingReadinessDto {
  ready: boolean;
  environment: string;
  supported_vertical_packs: string[];
  planned_vertical_packs: string[];
  requested_vertical_packs: string[];
  blockers: string[];
  warnings: string[];
  checks: Array<{ key: string; status: string; detail: string }>;
}

export interface StorageTopologyDto {
  control_plane: {
    kind: string;
    driver: string;
    purpose: string[];
  };
  runtime_documents: {
    kind: string;
    mode: string;
    database: string;
    tenant_database_strategy?: string;
    tenant_database_pattern?: string;
    collections: Record<string, string>;
  };
  ops_cache_queue: {
    kind: string;
    driver: string;
    purpose: string[];
  };
}

export interface RegistrySnapshotDto {
  tenant_id: string;
  tenant_record_id: string;
  agency_id: string;
  modules: string[];
  features: string[];
  generated_at: string;
}

export interface AuditEventDto {
  id: string;
  tenant_id: string | null;
  actor_user_id: string;
  action: string;
  subject_type: string;
  subject_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface OutboxEventDto {
  id: string;
  tenant_id: string | null;
  aggregate_id: string;
  event_name: string;
  payload: Record<string, unknown>;
  status: string;
  created_at: string;
}

export interface BlueprintDto {
  tenant_id: string;
  tenant_slug: string;
  version: number;
  business_label: string;
  vertical_packs: string[];
  enabled_modules: string[];
  public_theme: Record<string, string>;
  admin_theme: Record<string, string>;
  public_navigation: Array<{ label: string; href: string; kind: string; icon: string }>;
  admin_navigation: Array<{ label: string; href: string; kind: string; icon: string }>;
  routes: Array<{ key: string; path: string; page_slug: string; visibility: string }>;
  dashboard_widgets: Array<{ key: string; title: string; metric: string; description: string }>;
  vocabulary: Record<string, string>;
}

export interface PublishingPagesResponseDto {
  tenant_id: string;
  pages: Array<{
    tenant_slug: string;
    page_slug: string;
    route_path: string;
    title: string;
    status: string;
    seo_title: string;
    seo_description: string;
    layout: string;
  }>;
}

export interface AuditEventsResponseDto {
  tenant_id: string;
  events: AuditEventDto[];
}

export interface OutboxEventsResponseDto {
  tenant_id: string;
  events: OutboxEventDto[];
}

function normalizeApiBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function isAbsoluteApiBaseUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://");
}

function getBrowserApiBaseUrl() {
  return normalizeApiBaseUrl(
    process.env.NEXT_PUBLIC_KALPZERO_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000"
  );
}

function getServerApiBaseUrl() {
  const publicApiBaseUrl =
    process.env.NEXT_PUBLIC_KALPZERO_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (publicApiBaseUrl && isAbsoluteApiBaseUrl(publicApiBaseUrl)) {
    return normalizeApiBaseUrl(publicApiBaseUrl);
  }

  return "http://127.0.0.1:8000";
}

function resolveApiBaseUrl() {
  return typeof window === "undefined" ? getServerApiBaseUrl() : getBrowserApiBaseUrl();
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  const apiBaseUrl = resolveApiBaseUrl();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        message = payload.detail;
      }
    } catch {
      // Ignore JSON parse failures and fall back to status text.
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl() {
  return resolveApiBaseUrl();
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export interface RegisterPayload {
  email: string;
  password: string;
  tenant_slug?: string;
  role?: string[];
}

export interface RegisterResponseDto {
  access_token: string;
  expires_at: string;
  session: SessionDto;
}

export async function login(payload: LoginPayload) {
  debugger
  return request<LoginResponseDto>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function register(payload: RegisterPayload) {
  return request<RegisterResponseDto>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getCurrentSession(token: string) {
  return request<SessionDto>("/auth/me", undefined, token);
}

export async function getMagicOptions() {
  return request<MagicOptionsResponseDto>("/auth/magic/options");
}

export async function magicLogin(userId: string) {
  return request<LoginResponseDto>("/auth/magic/login", {
    method: "POST",
    body: JSON.stringify({ user_id: userId })
  });
}

export async function getAgencies(token: string) {
  return request<{ agencies: AgencyDto[] }>("/platform/agencies", undefined, token);
}

export async function getTenants(token: string) {
  return request<{ tenants: TenantDto[] }>("/platform/tenants", undefined, token);
}

export async function getOnboardingReadiness(token: string) {
  return request<OnboardingReadinessDto>(
    "/platform/onboarding-readiness?requested_vertical_packs=commerce&requested_vertical_packs=hotel&infra_mode=shared",
    undefined,
    token
  );
}

export async function getStorageTopology(token: string) {
  return request<StorageTopologyDto>("/platform/storage-topology", undefined, token);
}

export async function createAgency(
  token: string,
  payload: { slug: string; name: string; region: string; owner_user_id: string; username?: string; password?: string }
) {
  return request<AgencyDto>(
    "/platform/agencies",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function createTenant(
  token: string,
  payload: {
    agency_slug: string;
    slug: string;
    display_name: string;
    infra_mode: string;
    vertical_pack: string;
    business_type?: string;
    admin_email?: string;
    feature_flags: string[];
    dedicated_profile_id?: string;
    username?: string;
    password?: string;
    tenant_name?: string;
  }
) {
  return request<TenantDto>(
    "/platform/tenants",
    {
      method: "POST",
      body: JSON.stringify(payload)
    },
    token
  );
}

export async function getTenantSummary(token: string) {
  return request<TenantDto>("/platform/tenant", undefined, token);
}

export async function getRegistry(token: string) {
  return request<RegistrySnapshotDto>("/platform/registry", undefined, token);
}

export async function getAuditEvents(token: string, tenantSlug?: string) {
  const query = tenantSlug ? `?tenant_slug=${encodeURIComponent(tenantSlug)}` : "";
  return request<AuditEventsResponseDto>(`/platform/audit${query}`, undefined, token);
}

export async function getOutboxEvents(token: string, tenantSlug?: string) {
  const query = tenantSlug ? `?tenant_slug=${encodeURIComponent(tenantSlug)}` : "";
  return request<OutboxEventsResponseDto>(`/platform/outbox${query}`, undefined, token);
}

export async function getBlueprint(token: string) {
  return request<BlueprintDto>("/publishing/blueprint", undefined, token);
}

export async function getPublishingPages(token: string) {
  return request<PublishingPagesResponseDto>("/publishing/pages", undefined, token);
}
