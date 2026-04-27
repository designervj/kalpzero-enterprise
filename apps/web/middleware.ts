import { NextRequest, NextResponse } from "next/server";

import { isPlatformHomeHost, isSystemPublicPath, normalizeHost } from "@/lib/public-hosts";

type HostResolutionPayload = {
  tenant_slug?: string;
};

function shouldForceInternalHttp(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function normalizeAbsoluteUrl(value: string | undefined) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function resolveInternalApiBaseUrl() {
  return (
    normalizeAbsoluteUrl(process.env.KALPZERO_INTERNAL_API_URL) ??
    normalizeAbsoluteUrl(process.env.KALPZERO_API_PROXY_URL) ??
    normalizeAbsoluteUrl(process.env.KALPZERO_PUBLIC_API_URL)
  );
}

async function resolveTenantSlug(host: string) {
  const apiBaseUrl = resolveInternalApiBaseUrl();
  if (!apiBaseUrl) {
    return null;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/publishing/public/resolve-host?host=${encodeURIComponent(host)}`,
      {
        headers: { Accept: "application/json" },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as HostResolutionPayload;
    return typeof payload.tenant_slug === "string" && payload.tenant_slug
      ? payload.tenant_slug
      : null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host"));
  if (!host || isPlatformHomeHost(host) || isSystemPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const tenantSlug = await resolveTenantSlug(host);
  if (!tenantSlug) {
    return NextResponse.next();
  }

  if (
    request.nextUrl.pathname === `/${tenantSlug}` ||
    request.nextUrl.pathname.startsWith(`/${tenantSlug}/`)
  ) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname =
    request.nextUrl.pathname === "/"
      ? `/${tenantSlug}`
      : `/${tenantSlug}${request.nextUrl.pathname}`;
  if (shouldForceInternalHttp(rewriteUrl.hostname)) {
    rewriteUrl.protocol = "http";
  }
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: "/:path*",
};
