import type {
  TenantWebsiteDeploymentDto,
  TenantWebsiteDomainDto,
} from "@/lib/api";

type PlatformDomainState = {
  domain: TenantWebsiteDomainDto | null;
  host: string | null;
  url: string | null;
  ready: boolean;
  status: string | null;
  message: string | null;
};

function normalizeHost(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim().toLowerCase().replace(/\.$/, "");
  return normalized || null;
}

function hostFromUrl(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return null;
  }

  try {
    return normalizeHost(new URL(normalized).hostname);
  } catch {
    return null;
  }
}

export function getPlatformDomainState(
  deployment?: TenantWebsiteDeploymentDto | null,
): PlatformDomainState {
  const domains = deployment?.domains ?? [];
  const host =
    normalizeHost(deployment?.platform_host) ?? hostFromUrl(deployment?.platform_url);
  const domain =
    (host
      ? domains.find((entry) => normalizeHost(entry.host) === host)
      : null) ??
    domains.find((entry) => entry.domain_kind === "platform_subdomain") ??
    null;
  const metadataMessage = domain?.metadata?.message;

  return {
    domain,
    host: host ?? normalizeHost(domain?.host),
    url: deployment?.platform_url ?? null,
    ready: domain?.ssl_status === "ready",
    status: domain?.ssl_status ?? null,
    message: typeof metadataMessage === "string" ? metadataMessage : null,
  };
}
