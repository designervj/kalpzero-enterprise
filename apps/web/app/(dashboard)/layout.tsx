import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AdminLayout } from "@/components/adminLayout/AdminLayout";
import { ThemeInjector } from "@/components/ThemeInjector";
import { I18nProvider } from "@/lib/i18n/context";
import { KoshieProvider } from "@/components/KoshieContext";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { JWT_SECRET_VALUE } from "@/lib/server-env";

export const metadata: Metadata = {
  title: "Kalp-Zero Dashboard",
  description: "Modular B2B Meta-Dashboard architecture.",
};

const DASHBOARD_JWT_SECRET = new TextEncoder().encode(JWT_SECRET_VALUE);

async function resolveActiveTenant() {
  const cookieStore = await cookies();
  const cookieTenant = cookieStore.get("kalp_active_tenant")?.value?.trim();
  if (cookieTenant) {
    return cookieTenant;
  }

  const sessionToken =
    cookieStore.get("kalp_session")?.value ?? cookieStore.get("auth_token")?.value;
  if (!sessionToken) {
    return "demo";
  }

  try {
    const { payload } = await jwtVerify(sessionToken, DASHBOARD_JWT_SECRET);
    const tokenTenant =
      typeof payload.tenantKey === "string"
        ? payload.tenantKey.trim()
        : typeof payload.tenant_id === "string"
          ? payload.tenant_id.trim()
          : "";
    return tokenTenant || "demo";
  } catch {
    return "demo";
  }
}

import { ThemeProvider } from "@/components/providers/theme-provider";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeTenant = await resolveActiveTenant();

  return (
    <ThemeProvider storageKey="kalp-admin-mode">
      <AuthProvider>
        <I18nProvider>
          <ThemeInjector />
          <KoshieProvider>
            <AdminLayout activeTenant={activeTenant}>
              {children}
            </AdminLayout>
          </KoshieProvider>
        </I18nProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
