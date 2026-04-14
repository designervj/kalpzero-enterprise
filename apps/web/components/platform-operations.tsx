"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Building2, Radio, Send, ShieldCheck } from "lucide-react";

import { ConsoleShell } from "@/components/console-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAuditEvents,
  getOutboxEvents,
  getTenants,
  type AuditEventDto,
  type OutboxEventDto,
  type TenantDto
} from "@/lib/api";

interface OperationsState {
  tenants: TenantDto[];
  auditEvents: AuditEventDto[];
  outboxEvents: OutboxEventDto[];
}

const initialState: OperationsState = {
  tenants: [],
  auditEvents: [],
  outboxEvents: []
};

const PLATFORM_SCOPE = "platform_control";

export function PlatformOperations() {
  const router = useRouter();
  const { session, status, token } = useAuth();
  const [data, setData] = useState<OperationsState>(initialState);
  const [selectedScope, setSelectedScope] = useState(PLATFORM_SCOPE);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.push("/login");
      return;
    }

    if (status !== "authenticated" || !token) {
      return;
    }

    if (!session?.roles.includes("platform_admin")) {
      router.push("/tenant");
      return;
    }

    let active = true;
    setIsBootLoading(true);
    setError(null);

    getTenants(token)
      .then((response) => {
        if (!active) {
          return;
        }
        setData((current) => ({ ...current, tenants: response.tenants }));
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load tenant scopes.");
      })
      .finally(() => {
        if (active) {
          setIsBootLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [router, session?.roles, status, token]);

  useEffect(() => {
    if (status !== "authenticated" || !token || !session?.roles.includes("platform_admin")) {
      return;
    }

    let active = true;
    setIsFeedLoading(true);
    setError(null);

    const tenantSlug = selectedScope === PLATFORM_SCOPE ? undefined : selectedScope;
    Promise.all([getAuditEvents(token, tenantSlug), getOutboxEvents(token, tenantSlug)])
      .then(([auditResponse, outboxResponse]) => {
        if (!active) {
          return;
        }
        setData((current) => ({
          ...current,
          auditEvents: auditResponse.events,
          outboxEvents: outboxResponse.events
        }));
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load operations feed.");
      })
      .finally(() => {
        if (active) {
          setIsFeedLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedScope, session?.roles, status, token]);

  const selectedTenant = useMemo(
    () => data.tenants.find((tenant) => tenant.slug === selectedScope) ?? null,
    [data.tenants, selectedScope]
  );
  const queuedOutboxCount = data.outboxEvents.filter((event) => event.status !== "processed").length;

  if (status === "loading" || isBootLoading) {
    return (
      <ConsoleShell
        scope="platform"
        title="Loading platform operations."
        subtitle="Preparing tenant scopes, audit visibility, and outbox signals."
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
      scope="platform"
      title="Inspect onboarding and runtime activity from one operations feed."
      subtitle="Switch between Kalp control-plane activity and tenant-level audit or outbox signals without leaving the Super Admin console."
    >
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              icon={ShieldCheck}
              label="Scope"
              value={selectedScope === PLATFORM_SCOPE ? "Kalp" : selectedTenant?.display_name ?? selectedScope}
              hint={selectedScope === PLATFORM_SCOPE ? "Platform control plane events" : "Tenant-specific events"}
            />
            <MetricCard
              icon={Activity}
              label="Audit events"
              value={String(data.auditEvents.length)}
              hint="Most recent privileged actions in this scope"
            />
            <MetricCard
              icon={Send}
              label="Outbox events"
              value={String(data.outboxEvents.length)}
              hint="Events waiting for or reflecting async work"
            />
            <MetricCard
              icon={Radio}
              label="Pending feed"
              value={String(queuedOutboxCount)}
              hint="Outbox items still requiring worker attention"
            />
          </section>

          <Card>
            <CardHeader>
              <CardTitle>Recent audit trail</CardTitle>
              <CardDescription>Use this to confirm who changed what before and after onboarding, finance, or operational actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isFeedLoading ? (
                <FeedSkeleton />
              ) : data.auditEvents.length === 0 ? (
                <EmptyState
                  title="No audit events yet"
                  description="This scope has not emitted any visible audit activity yet."
                />
              ) : (
                data.auditEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{event.action}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {event.actor_user_id} • {event.subject_type} • {event.subject_id}
                        </p>
                      </div>
                      <Badge variant="outline">{formatTimestamp(event.created_at)}</Badge>
                    </div>
                    {Object.keys(event.metadata ?? {}).length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(event.metadata).slice(0, 4).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="max-w-full truncate">
                            {key}: {stringifyValue(value)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outbox and worker feed</CardTitle>
              <CardDescription>Track the domain events that should drive downstream worker activity and onboarding side effects.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isFeedLoading ? (
                <FeedSkeleton />
              ) : data.outboxEvents.length === 0 ? (
                <EmptyState
                  title="No outbox events yet"
                  description="This scope has not queued any domain events yet."
                />
              ) : (
                data.outboxEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border/70 bg-background/80 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{event.event_name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          aggregate {event.aggregate_id} • status {event.status}
                        </p>
                      </div>
                      <Badge variant={event.status === "processed" ? "success" : "warning"}>
                        {event.status}
                      </Badge>
                    </div>
                    {Object.keys(event.payload ?? {}).length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {Object.entries(event.payload).slice(0, 4).map(([key, value]) => (
                          <Badge key={key} variant="secondary" className="max-w-full truncate">
                            {key}: {stringifyValue(value)}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Scope selector</CardTitle>
              <CardDescription>Switch between Kalp control-plane activity and tenant-specific operational traces.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ScopeButton
                label="Kalp control plane"
                description="Agency and tenant lifecycle, platform setup, and control-plane actions"
                selected={selectedScope === PLATFORM_SCOPE}
                onClick={() => setSelectedScope(PLATFORM_SCOPE)}
              />
              {data.tenants.map((tenant) => (
                <ScopeButton
                  key={tenant.id}
                  label={tenant.display_name}
                  description={`${tenant.slug} • ${tenant.vertical_packs.join(" + ")} • ${tenant.infra_mode} infra`}
                  selected={selectedScope === tenant.slug}
                  onClick={() => setSelectedScope(tenant.slug)}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current scope summary</CardTitle>
              <CardDescription>Keep the operator grounded in the business context behind the events.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedScope === PLATFORM_SCOPE ? (
                <>
                  <InfoRow label="Scope" value="platform_control" />
                  <InfoRow label="Use this for" value="agency creation, tenant provisioning, readiness validation, and global control-plane checks" />
                  <InfoRow label="Expected event types" value="platform.agency.created, platform.tenant.created, tenant.provisioned" />
                </>
              ) : (
                <>
                  <InfoRow label="Tenant" value={selectedTenant?.display_name ?? selectedScope} />
                  <InfoRow label="Vertical packs" value={selectedTenant?.vertical_packs.join(", ") ?? "unknown"} />
                  <InfoRow label="Runtime DB" value={selectedTenant?.runtime_documents?.database ?? "n/a"} />
                  <InfoRow
                    label="Seeded docs"
                    value={String(selectedTenant?.runtime_documents?.bootstrap.seeded_document_count ?? 0)}
                  />
                  <InfoRow label="Feature flags" value={selectedTenant?.feature_flags.join(", ") || "none"} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to use this screen</CardTitle>
              <CardDescription>This is the operator-facing validation path before trusting onboarding at scale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
              <p>1. Create or update the tenant from the onboarding flow.</p>
              <p>2. Switch to the tenant scope here and verify audit and outbox traces appeared.</p>
              <p>3. Confirm the tenant runtime database, seeded docs, and vertical packs are correct.</p>
              <p>4. Use the tenant admin only after the control-plane and event feed look correct.</p>
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

function MetricCard({
  icon: Icon,
  label,
  value,
  hint
}: {
  icon: typeof ShieldCheck;
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
        <p className="mt-6 text-2xl font-semibold text-foreground">{value}</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function ScopeButton({
  label,
  description,
  selected,
  onClick
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
        selected
          ? "border-primary/30 bg-primary/10"
          : "border-border/70 bg-background/80 hover:border-border hover:bg-white/90"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{label}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        {selected ? <Badge>Active</Badge> : <Badge variant="outline">Open</Badge>}
      </div>
    </button>
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6">
      <p className="text-base font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-2xl border border-border bg-muted/40" />
      ))}
    </>
  );
}

function stringifyValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return "object";
  }
  return String(value);
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}
