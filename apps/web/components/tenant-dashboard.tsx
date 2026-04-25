"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, LayoutTemplate, Layers3, Navigation } from "lucide-react";

import { ConsoleShell } from "@/components/console-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBlueprint,
  getPublishingPages,
  getRegistry,
  getTenantSummary,
  type BlueprintDto,
  type PublishingPagesResponseDto,
  type RegistrySnapshotDto,
  type TenantDto
} from "@/lib/api";

interface TenantState {
  tenant: TenantDto | null;
  registry: RegistrySnapshotDto | null;
  blueprint: BlueprintDto | null;
  pages: PublishingPagesResponseDto["pages"];
}

const initialState: TenantState = {
  tenant: null,
  registry: null,
  blueprint: null,
  pages: []
};

export function TenantDashboard() {
  const router = useRouter();
  const { session, status, token } = useAuth();
  const [data, setData] = useState<TenantState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.push("/login");
      return;
    }

    if (status !== "authenticated" || !token) {
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.all([getTenantSummary(token), getRegistry(token), getBlueprint(token), getPublishingPages(token)])
      .then(([tenant, registry, blueprint, pages]) => {
        if (!active) {
          return;
        }
        setData({
          tenant,
          registry,
          blueprint,
          pages: pages.pages
        });
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load tenant workspace.");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router, status, token]);

  if (status === "loading" || isLoading) {
    return (
      <ConsoleShell
        scope="tenant"
        title="Loading the tenant workspace."
        subtitle="Pulling registry, blueprint, and seeded pages from the canonical runtime."
      >
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-3xl border border-border bg-muted/50" />
          ))}
        </div>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell
      scope="tenant"
      title={`${data.tenant?.display_name ?? "Tenant"} operator workspace`}
      subtitle="This is the first tenant-facing admin shell. It surfaces registry modules, blueprint signals, and publishing assets without exposing platform internals."
    >
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-4">
            <TenantMetric icon={Building2} label="Vertical packs" value={String(data.tenant?.vertical_packs.length ?? 0)} hint={(data.tenant?.vertical_packs ?? []).join(", ")} />
            <TenantMetric icon={Layers3} label="Modules" value={String(data.registry?.modules.length ?? 0)} hint="Registry-driven access surface" />
            <TenantMetric icon={LayoutTemplate} label="Pages" value={String(data.pages.length)} hint="Blueprint-seeded publishing pages" />
            <TenantMetric
              icon={Navigation}
              label="Navigation"
              value={String(data.blueprint?.admin_navigation.length ?? 0)}
              hint="Admin nav comes from the tenant blueprint"
            />
          </section>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Publishing assets</CardTitle>
                <CardDescription>Every onboarded tenant starts with a working blueprint and a seeded public page set.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href={`/studio/${data.tenant?.slug ?? "tenant_demo"}`}>Studio preview</Link>
                </Button>
                <Button asChild>
                  <Link href={data.tenant?.website_deployment?.production_url ?? `/${data.tenant?.slug ?? "tenant_demo"}`}>
                    Open public site
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.pages.map((page) => (
                <div key={page.page_slug} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{page.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.route_path} • {page.layout} • SEO ready
                      </p>
                    </div>
                    <Badge variant={page.status === "live" ? "success" : "outline"}>{page.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Blueprint widgets</CardTitle>
              <CardDescription>These are the operator-facing dashboard blocks currently exposed by the tenant blueprint.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {(data.blueprint?.dashboard_widgets ?? []).map((widget) => (
                <div key={widget.key} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <p className="font-semibold text-foreground">{widget.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{widget.description}</p>
                  <p className="mt-4 text-2xl font-semibold text-foreground">{widget.metric}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Tenant summary</CardTitle>
              <CardDescription>Keep the business owner focused on what exists, not how it was provisioned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Tenant slug" value={data.tenant?.slug ?? "n/a"} />
              <InfoRow label="Infra mode" value={data.tenant?.infra_mode ?? "n/a"} />
              <InfoRow label="Runtime DB" value={data.tenant?.runtime_documents?.database ?? "n/a"} />
              <InfoRow label="Seeded docs" value={String(data.tenant?.runtime_documents?.bootstrap.seeded_document_count ?? 0)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vocabulary map</CardTitle>
              <CardDescription>The tenant blueprint translates platform concepts into business language.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(data.blueprint?.vocabulary ?? {}).map(([key, value]) => (
                <div key={key} className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{key}</p>
                  <p className="mt-2 font-medium text-foreground">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {error ? (
            <Card className="border-destructive/40">
              <CardContent className="p-6 text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </ConsoleShell>
  );
}

function TenantMetric({
  icon: Icon,
  label,
  value,
  hint
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="bg-white/82">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Icon className="size-5" />
          </div>
          <Badge variant="outline">{label}</Badge>
        </div>
        <p className="mt-6 text-3xl font-semibold text-foreground">{value}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}
