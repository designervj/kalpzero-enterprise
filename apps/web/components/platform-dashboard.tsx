"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Database, ShieldCheck, Store } from "lucide-react";

import { ConsoleShell } from "@/components/console-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAgencies,
  getOnboardingReadiness,
  getStorageTopology,
  getTenants,
  type AgencyDto,
  type OnboardingReadinessDto,
  type StorageTopologyDto,
  type TenantDto
} from "@/lib/api";

interface PlatformState {
  agencies: AgencyDto[];
  tenants: TenantDto[];
  readiness: OnboardingReadinessDto | null;
  storage: StorageTopologyDto | null;
}

const defaultState: PlatformState = {
  agencies: [],
  tenants: [],
  readiness: null,
  storage: null
};

export function PlatformDashboard() {
  const router = useRouter();
  const { login, session, status, token } = useAuth();
  const [data, setData] = useState<PlatformState>(defaultState);
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

    if (session?.role !== "platform_admin") {
      router.push("/tenant");
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    Promise.all([getAgencies(token), getTenants(token), getOnboardingReadiness(token), getStorageTopology(token)])
      .then(([agencies, tenants, readiness, storage]) => {
        if (!active) {
          return;
        }
        setData({
          agencies: agencies.agencies,
          tenants: tenants.tenants,
          readiness,
          storage
        });
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load platform data.");
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router, session?.role, status, token]);

  async function openTenantWorkspace(tenantSlug: string) {
    try {
      await login({
        email: "ops@tenant.com",
        password: "very-secure-password",
        // tenant_slug: tenantSlug
      });
      router.push("/tenant");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to open tenant workspace.");
    }
  }

  if (status === "loading" || isLoading) {
    return <LoadingState />;
  }

  return (
    <ConsoleShell
      scope="platform"
      title="Operate Kalp from one clear Super Admin surface."
      subtitle="Agencies, tenants, readiness, storage, and quick tenant access are grouped into a practical control plane for pilot onboarding."
    >
      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard icon={Building2} label="Agencies" value={String(data.agencies.length)} hint="Business groups currently registered" />
            <MetricCard icon={Store} label="Tenants" value={String(data.tenants.length)} hint="Pilot tenants ready for onboarding and preview" />
            <MetricCard
              icon={ShieldCheck}
              label="Readiness"
              value={data.readiness?.ready ? "Ready" : "Attention"}
              hint={`${data.readiness?.supported_vertical_packs.join(", ") ?? "No packs"} approved`}
            />
            <MetricCard
              icon={Database}
              label="Runtime strategy"
              value={data.storage?.runtime_documents.tenant_database_strategy === "per_tenant_database" ? "Per tenant" : "Shared"}
              hint="Mongo runtime docs stay isolated per tenant"
            />
          </section>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Tenant visibility</CardTitle>
                <CardDescription>Open tenant admin directly after onboarding or inspect its runtime database bootstrap.</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/platform/operations">View operations</Link>
                </Button>
                <Button asChild>
                  <Link href="/platform/onboarding">Create tenant</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.tenants.length === 0 ? (
                <EmptyState
                  title="No tenants yet"
                  description="Use the onboarding page to create the first agency and tenant. The tenant runtime database and blueprint will be seeded automatically."
                />
              ) : (
                data.tenants.map((tenant) => (
                  <div key={tenant.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-foreground">{tenant.display_name}</h3>
                          <Badge variant="outline">{tenant.slug}</Badge>
                        </div>
                        {/* <p className="mt-1 text-sm text-muted-foreground">
                          {tenant?.vertical_packs?.join(" + ")} • {tenant.infra_mode} infra • runtime DB{" "}
                          <span className="font-medium text-foreground">{tenant.runtime_documents?.database ?? "pending"}</span>
                        </p> */}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => openTenantWorkspace(tenant.slug)}>
                          Open tenant admin
                        </Button>
                        <Button asChild>
                          <Link href={`/${tenant.slug}`}>Open public site</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <StatPill label="Seeded docs" value={String(tenant.runtime_documents?.bootstrap.seeded_document_count ?? 0)} />
                      <StatPill label="Pages" value={(tenant.runtime_documents?.bootstrap.page_slugs ?? []).join(", ") || "none"} />
                      <StatPill label="Website" value={tenant.website_deployment?.status ?? "disabled"} />
                    </div>
                    {tenant.website_deployment?.production_url ? (
                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Vercel URL:</span>
                        <a
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                          href={tenant.website_deployment.production_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {tenant.website_deployment.production_url}
                        </a>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agencies</CardTitle>
              <CardDescription>High-level control plane owners. Keep this business language simple for non-technical operators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.agencies.length === 0 ? (
                <EmptyState title="No agencies yet" description="Create an agency first, then add one or more tenants underneath it." />
              ) : (
                data.agencies.map((agency) => (
                  <div key={agency.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold">{agency.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {agency.slug} • {agency.region.toUpperCase()} • owner {agency.owner_user_id}
                        </p>
                      </div>
                      <Badge variant="secondary">{new Date(agency.created_at).toLocaleDateString()}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Onboarding readiness</CardTitle>
              <CardDescription>Expose guardrails before the operator starts creating external businesses.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(data.readiness?.checks ?? []).map((check) => (
                <div key={check.key} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold capitalize text-foreground">{check.key.replace(/_/g, " ")}</p>
                    <Badge variant={check.status === "pass" ? "success" : check.status === "warn" ? "warning" : "outline"}>
                      {check.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{check.detail}</p>
                </div>
              ))}
              {data.readiness?.warnings.length ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {data.readiness.warnings.join(" ")}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage topology</CardTitle>
              <CardDescription>Kalp controls the hybrid model while tenant content remains isolated.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <TopologyRow label="Control plane" value={`${data.storage?.control_plane.driver ?? "sql"} / agencies / tenants / audit`} />
              <TopologyRow label="Runtime docs" value={data.storage?.runtime_documents.tenant_database_pattern ?? "per tenant Mongo DB"} />
              <TopologyRow label="Ops layer" value={`${data.storage?.ops_cache_queue.driver ?? "redis"} / queue / cache / coordination`} />
            </CardContent>
          </Card>

          {error ? (
            <Card className="border-destructive/40">
              <CardHeader>
                <CardTitle>Load issue</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-destructive">{error}</CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </ConsoleShell>
  );
}

function LoadingState() {
  return (
    <ConsoleShell
      scope="platform"
      title="Loading the Super Admin workspace."
      subtitle="Fetching agencies, tenants, readiness checks, and storage topology."
    >
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-3xl border border-border bg-muted/50" />
        ))}
      </div>
    </ConsoleShell>
  );
}

function MetricCard({
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

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-white/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function TopologyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
