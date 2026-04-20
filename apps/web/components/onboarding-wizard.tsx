"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Database, Layers3, Rocket } from "lucide-react";

import { ConsoleShell } from "@/components/console-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createAgency,
  createTenant,
  register,
  type AgencyDto,
  type TenantDto,
} from "@/lib/api";
import { CreateAgencyForm } from "@/components/agency/create-agency-form";
import { CreateTenantForm } from "@/components/tenant/create-tenant-form";
import { AgencyFormType } from "./agency/AgencyType";

export function OnboardingWizard() {
  const router = useRouter();
  const { session, status, token } = useAuth();
  const [agencyForm, setAgencyForm] = useState<AgencyFormType>({
    slug: "demo-agency",
    name: "Demo Agency",
    region: "in",
    owner_user_id: "founder@kalpzero.com",
    username: "",
    password: "",
  });
  const [tenantForm, setTenantForm] = useState({
    agency_slug: "demo-agency",
    slug: "demo-tenant",
    display_name: "Demo Tenant",
    businessType: "commerce",
    vertical_pack: "",
    dedicated_profile_id: "dedicated-infra-demo",
    feature_flags: "seo-suite,custom-domain",
    password: "",
    tenant_name: "",
  });

  console.log(tenantForm);

  const [createdAgency, setCreatedAgency] = useState<AgencyDto | null>(null);
  const [createdTenant, setCreatedTenant] = useState<TenantDto | null>(null);
  const [isSubmittingAgency, setIsSubmittingAgency] = useState(false);
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "anonymous") {
      router.push("/login");
      return;
    }
    if (
      status === "authenticated" &&
      session?.role !== "platform_admin"
    ) {
      router.push("/tenant");
    }
  }, [router, session?.role, status]);

  async function onCreateAgency(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setIsSubmittingAgency(true);
    setError(null);

    try {
      const agency = await createAgency(token, {
        slug: agencyForm.slug ?? "",
        name: agencyForm.name ?? "",
        region: agencyForm.region ?? "",
        owner_user_id: agencyForm.owner_user_id ?? "",
        username: agencyForm.username || undefined,
        password: agencyForm.password || undefined,
      });

      // Register the agency owner user
      if (agencyForm.username && agencyForm.password) {
        try {
          await register({
            email: agencyForm.username,
            password: agencyForm.password,
            tenant_slug: "platform_control",
          });
        } catch (regError) {
          console.error("Agency owner registration failed:", regError);
        }
      }

      setCreatedAgency(agency);
      setTenantForm((current) => ({ ...current, agency_slug: agency.slug }));
    } catch (submissionError: any) {
      const message = submissionError?.detail || submissionError?.message || "Unable to create agency.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setIsSubmittingAgency(false);
    }
  }

  async function onCreateTenant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    setIsSubmittingTenant(true);
    setError(null);

    try {
      const tenant = await createTenant(token, {
        agency_slug: tenantForm.agency_slug,
        slug: tenantForm.slug,
        display_name: tenantForm.display_name,
        infra_mode: "dedicated",
        vertical_pack: tenantForm.businessType,
        business_type: tenantForm.vertical_pack,
        admin_email: tenantForm.tenant_name,
        dedicated_profile_id: tenantForm.dedicated_profile_id,
        feature_flags: tenantForm.feature_flags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      // Register the tenant admin user
      if (tenantForm.tenant_name && tenantForm.password) {
        try {
          await register({
            email: tenantForm.tenant_name,
            password: tenantForm.password,
            tenant_slug: tenant.slug,
          });
        } catch (regError) {
          console.error("Tenant admin registration failed:", regError);
        }
      }

      setCreatedTenant(tenant);
      
      // Automatic redirection
      setTimeout(() => {
        router.push(`/tenant`);
      }, 3000);

    } catch (submissionError: any) {
      const message = submissionError?.detail || submissionError?.message || "Unable to create tenant.";
      setError(typeof message === "string" ? message : JSON.stringify(message));
    } finally {
      setIsSubmittingTenant(false);
    }
  }

  return (
    <ConsoleShell
      scope="platform"
      title="Onboard a business with guided steps, not raw system forms."
      subtitle="Create the agency, create the tenant, and let Kalp provision the runtime database and baseline blueprint automatically."
    >
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <CreateAgencyForm
            agencyForm={agencyForm}
            setAgencyForm={setAgencyForm}
            setTenantForm={setTenantForm as any}
            onCreateAgency={onCreateAgency}
            isSubmittingAgency={isSubmittingAgency}
          />

          <CreateTenantForm
            tenantForm={tenantForm as any}
            setTenantForm={setTenantForm as any}
            onCreateTenant={onCreateTenant}
            isSubmittingTenant={isSubmittingTenant}
          />

          {error ? (
            <Card className="border-destructive/40">
              <CardContent className="p-6 text-sm text-destructive">
                {error}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>What happens automatically</CardTitle>
              <CardDescription>
                Kalp provisions the technical pieces so the operator sees
                business language instead of infrastructure tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickStep
                icon={Rocket}
                title="Tenant record created"
                description="The control plane stores the tenant, infra mode, selected pack, and feature flags."
              />
              <QuickStep
                icon={Database}
                title="Runtime DB provisioned"
                description="A tenant-scoped Mongo database is created from the canonical naming strategy."
              />
              <QuickStep
                icon={Layers3}
                title="Publishing seeded"
                description="Blueprint, site pages, and discovery documents are inserted so the public runtime is usable immediately."
              />
            </CardContent>
          </Card>

          {createdAgency ? (
            <Card>
              <CardHeader>
                <CardTitle>Agency created</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-foreground">Name:</span>{" "}
                  {createdAgency.name}
                </p>
                <p>
                  <span className="font-medium text-foreground">Slug:</span>{" "}
                  {createdAgency.slug}
                </p>
                <p className="text-muted-foreground">
                  Tenant onboarding can now use this agency immediately.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {createdTenant ? (
            <Card className="border-primary/25">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-primary" />
                  <CardTitle>Tenant provisioned</CardTitle>
                </div>
                <CardDescription>
                  Use these runtime details to validate the onboarding pipeline
                  and then open the tenant workspace.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow
                  label="Tenant"
                  value={`${createdTenant.display_name} (${createdTenant.slug})`}
                />
                <InfoRow
                  label="Vertical pack"
                  value={createdTenant.vertical_packs[0] ?? "n/a"}
                />
                <InfoRow
                  label="Business type"
                  value={createdTenant.business_type ?? "n/a"}
                />
                <InfoRow
                  label="Dedicated profile"
                  value={createdTenant.dedicated_profile_id ?? "n/a"}
                />
                <InfoRow
                  label="Runtime DB"
                  value={createdTenant.runtime_documents?.database ?? "n/a"}
                />
                <InfoRow
                  label="Seeded docs"
                  value={String(
                    createdTenant.runtime_documents?.bootstrap
                      .seeded_document_count ?? 0,
                  )}
                />
                <InfoRow
                  label="Page slugs"
                  value={
                    (
                      createdTenant.runtime_documents?.bootstrap.page_slugs ??
                      []
                    ).join(", ") || "none"
                  }
                />
                <div className="flex gap-2 pt-3">
                  <Button asChild>
                    <Link href="/platform">Back to Super Admin</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/login">Open login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </ConsoleShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function QuickStep({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Rocket;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}
