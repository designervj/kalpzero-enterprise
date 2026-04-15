import { Dispatch, SetStateAction, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { TenantFormType } from "./TenantType";

const VERTICAL_PACK_OPTIONS = [
  {
    value: "commerce",
    label: "Commerce",
    description: "Catalogs, orders, inventory, and fulfillment.",
    badge: "Approved",
    available: true
  },
  {
    value: "hotel",
    label: "Hotel",
    description: "Properties, reservations, and operations.",
    badge: "Approved",
    available: true
  },
  {
    value: "travel",
    label: "Travel",
    description: "Planned for onboarding after the pilot scope.",
    badge: "Approved",
    available: true
  }
] as const;

export function CreateTenantForm({
  tenantForm,
  setTenantForm,
  onCreateTenant,
  isSubmittingTenant
}: {
  tenantForm: TenantFormType;
  setTenantForm: Dispatch<SetStateAction<TenantFormType>>;
  onCreateTenant: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmittingTenant: boolean;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2. Create the tenant</CardTitle>
        <CardDescription>Pick one approved vertical pack for the tenant. Dedicated infra also needs a profile id.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onCreateTenant}>
          <Field label="Agency slug">
            <Input
              value={tenantForm.agency_slug}
              onChange={(event) => setTenantForm((current) => ({ ...current, agency_slug: event.target.value }))}
            />
          </Field>
          <Field label="Tenant slug">
            <Input
              value={tenantForm.slug}
              onChange={(event) => setTenantForm((current) => ({ ...current, slug: event.target.value }))}
            />
          </Field>
          <Field label="Display name">
            <Input
              value={tenantForm.display_name}
              onChange={(event) => {
                const name = event.target.value;
                const slug = name.toLowerCase().replace(/\s+/g, '-');
                setTenantForm((current) => ({ ...current, display_name: name, slug, tenant_name: name }));
              }}
            />
          </Field>
          <Field label="Tenant name">
            <Input
              value={tenantForm.tenant_name}
              onChange={(event) => setTenantForm((current) => ({ ...current, tenant_name: event.target.value }))}
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={tenantForm.password}
                onChange={(event) => setTenantForm((current) => ({ ...current, password: event.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </Field>
          <div className="md:col-span-2 space-y-2">
            <Label>Business Type</Label>
            <div className="grid gap-3 sm:grid-cols-3">
              {VERTICAL_PACK_OPTIONS.map((option) => {
                const selected = tenantForm.businessType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={!option.available}
                    onClick={() => setTenantForm((current) => ({ ...current, businessType: option.value }))}
                    className={cn(
                      "cursor-pointer rounded-2xl border p-4 text-left transition-all",
                      selected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-background/80 hover:border-primary/40",
                      !option.available && "cursor-not-allowed opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">{option.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                      </div>
                      <Badge variant={selected ? "success" : option.available ? "outline" : "warning"}>
                        {selected ? "Selected" : option.badge}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          {tenantForm.businessType === "commerce" && (
            <div className="md:col-span-2">
              <Field label="Vertical">
                <select
                  value={tenantForm.vertical_pack || ""}
                  onChange={(event) => setTenantForm((current) => ({ ...current, vertical_pack: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="" disabled>Select a vertical</option>
                  <option value="apparel">Apparel</option>
                  <option value="furniture">Furniture</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          )}
          {/* <Field label="Dedicated profile id">
            <Input
              value={tenantForm.dedicated_profile_id}
              onChange={(event) =>
                setTenantForm((current) => ({ ...current, dedicated_profile_id: event.target.value }))
              }
            />
          </Field> */}
          <Field label="Feature flags">
            <Textarea
              className="min-h-11"
              value={tenantForm.feature_flags}
              onChange={(event) =>
                setTenantForm((current) => ({ ...current, feature_flags: event.target.value }))
              }
            />
          </Field>
          <div className="md:col-span-2 flex flex-wrap gap-2">
           { <Badge>{tenantForm?.businessType}</Badge>}
            {tenantForm?.vertical_pack && <Badge variant="outline">{tenantForm?.vertical_pack}</Badge>}
            {/* <Badge variant="secondary">single selection</Badge> */}
          </div>
          <div className="md:col-span-2">
            <Button type="submit" size="lg" disabled={isSubmittingTenant}>
              {isSubmittingTenant ? "Provisioning tenant..." : "Create tenant"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
