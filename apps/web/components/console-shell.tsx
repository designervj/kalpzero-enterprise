"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ChevronRight, Globe2, LayoutDashboard, LogOut, Palette, Sparkles } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ConsoleNavItem {
  label: string;
  href: string;
  description: string;
}

const platformItems: ConsoleNavItem[] = [
  { label: "Overview", href: "/platform", description: "Control plane visibility" },
  { label: "Onboarding", href: "/platform/onboarding", description: "Create agencies and tenants" },
  { label: "Operations", href: "/platform/operations", description: "Audit and outbox visibility" }
];

const tenantItems: ConsoleNavItem[] = [{ label: "Workspace", href: "/tenant", description: "Tenant dashboard" }];

function iconForScope(scope: "platform" | "tenant") {
  return scope === "platform" ? Building2 : LayoutDashboard;
}

export function ConsoleShell({
  scope,
  title,
  subtitle,
  children
}: {
  scope: "platform" | "tenant";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, session } = useAuth();
  const Icon = iconForScope(scope);
  const navItems = scope === "platform" ? platformItems : tenantItems;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(214,93,14,0.13),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(32,95,78,0.17),_transparent_30%),linear-gradient(180deg,_#f8f2eb_0%,_#eef4f2_100%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 px-4 py-4 md:px-6">
        <aside className="hidden w-[300px] shrink-0 flex-col rounded-[30px] border border-white/60 bg-sidebar/95 p-5 shadow-glow backdrop-blur lg:flex">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-heading text-2xl font-semibold tracking-tight text-foreground">KalpZero</p>
                  <p className="text-sm text-muted-foreground">
                    {scope === "platform" ? "Super Admin Console" : "Tenant Operator Console"}
                  </p>
                </div>
              </div>
            </div>
            <Badge variant={scope === "platform" ? "warning" : "success"}>{scope === "platform" ? "Kalp" : "Tenant"}</Badge>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/60 bg-white/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Signed in as</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{session?.user_id ?? "anonymous"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{session?.tenant_id ?? "no tenant context"}</p>
          </div>

          <nav className="mt-6 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-foreground"
                      : "border-transparent bg-white/55 text-muted-foreground hover:border-border hover:bg-white/80 hover:text-foreground"
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="size-4 opacity-60 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </nav>

          <Separator className="my-6" />

          <div className="space-y-3 rounded-[24px] border border-white/60 bg-gradient-to-br from-white/80 to-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <p className="text-sm font-semibold">Blueprint-led UI</p>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Public site, tenant admin, and future mobile flows now share one business blueprint contract.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/discover">
                  <Globe2 className="size-4" />
                  Discover
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={scope === "platform" ? "/platform/onboarding" : `/studio/${session?.tenant_id ?? "tenant_demo"}`}>
                  <Palette className="size-4" />
                  {scope === "platform" ? "Onboard" : "Preview"}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-2xl"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <main className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col gap-5 rounded-[32px] border border-white/60 bg-white/60 p-4 shadow-glow backdrop-blur md:p-6">
          <div className="flex flex-wrap gap-2 lg:hidden">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant={pathname === item.href ? "default" : "outline"} size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.86),_rgba(255,248,239,0.78))] p-6 shadow-card md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <Badge>{scope === "platform" ? "Kalp Super Admin" : "Tenant Workspace"}</Badge>
                  <span className="text-sm text-muted-foreground">Friendly control surface for onboarding and operations</span>
                </div>
                <h1 className="mt-4 font-heading text-4xl leading-tight text-foreground md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{subtitle}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={scope === "platform" ? "/platform/onboarding" : "/tenant"}>Quick actions</Link>
                </Button>
                <Button asChild>
                  <Link href={scope === "platform" ? "/platform" : "/tenant"}>Open workspace</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1">{children}</div>
        </main>
      </div>
    </div>
  );
}
