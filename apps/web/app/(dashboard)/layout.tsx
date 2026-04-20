import type { Metadata } from "next";
import "../globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { AdminLayout } from "@/components/AdminLayout";
import { ThemeInjector } from "@/components/ThemeInjector";
import { I18nProvider } from "@/lib/i18n/context";
import { KoshieProvider } from "@/components/KoshieContext";
import { cookies } from "next/headers";
import StoreProvider from "@/hook/store/StoreProvider";

export const metadata: Metadata = {
  title: "Kalp-Zero Dashboard",
  description: "Modular B2B Meta-Dashboard architecture.",
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const activeTenant = cookieStore.get("kalp_active_tenant")?.value || "demo";

  return (
    <StoreProvider>
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
    </StoreProvider>
  );
}
