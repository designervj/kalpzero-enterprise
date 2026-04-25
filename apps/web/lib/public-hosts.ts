const DEFAULT_PLATFORM_HOST = "kalptree.xyz";
const SYSTEM_PUBLIC_PREFIXES = [
  "/api",
  "/_next",
  "/docs",
  "/discover",
  "/login",
  "/dashboard",
  "/platform",
  "/studio",
  "/onboarding",
  "/img",
];

export function normalizeHost(value: string | null | undefined) {
  const candidate = (value || "").trim().toLowerCase();
  if (!candidate) {
    return "";
  }
  return candidate.split(":", 1)[0]?.replace(/^\.+|\.+$/g, "") ?? "";
}

function readEnvHosts(value: string | undefined) {
  return (value || "")
    .split(",")
    .map((entry) => normalizeHost(entry))
    .filter(Boolean);
}

function parseConfiguredPublicHost() {
  const candidates = [
    process.env.KALP_PUBLIC_BASE_URL,
    process.env.KALPZERO_PUBLIC_WEB_URL,
  ];

  for (const value of candidates) {
    if (!value) {
      continue;
    }
    try {
      const parsed = new URL(value);
      const normalized = normalizeHost(parsed.host);
      if (normalized) {
        return normalized;
      }
    } catch {
      const normalized = normalizeHost(value);
      if (normalized) {
        return normalized;
      }
    }
  }

  return DEFAULT_PLATFORM_HOST;
}

export function getPlatformRootHost() {
  return parseConfiguredPublicHost();
}

export function getPlatformHomeHosts() {
  const rootHost = getPlatformRootHost();
  return new Set([
    rootHost,
    `www.${rootHost}`,
    "localhost",
    "127.0.0.1",
    "::1",
    ...readEnvHosts(process.env.KALP_PLATFORM_HOME_HOSTS),
  ]);
}

export function isPlatformHomeHost(host: string | null | undefined) {
  return getPlatformHomeHosts().has(normalizeHost(host));
}

export function isTenantHostRequest(host: string | null | undefined) {
  const normalized = normalizeHost(host);
  return Boolean(normalized) && !isPlatformHomeHost(normalized);
}

export function isSystemPublicPath(pathname: string) {
  if (!pathname) {
    return false;
  }

  if (pathname === "/favicon.ico" || pathname === "/robots.txt" || pathname === "/sitemap.xml") {
    return true;
  }

  if (/\.[a-z0-9]+$/i.test(pathname)) {
    return true;
  }

  return SYSTEM_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
