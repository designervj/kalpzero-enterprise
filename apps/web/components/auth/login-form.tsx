"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Hotel, ShoppingBag, Eye, EyeOff } from "lucide-react";

import { useAuth } from "@/components/providers/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resolvePostLoginRoute } from "@/lib/auth-routing";

const roleModes = [
  {
    key: "platform",
    label: "Super Admin",
    description: "Control agencies, tenants, onboarding, and visibility from Kalp."
  },
  {
    key: "tenant",
    label: "Tenant Admin",
    description: "Open the tenant dashboard, modules, and blueprint workspace."
  }
] as const;

type RoleMode = (typeof roleModes)[number]["key"];

export function LoginForm() {
  const platformDefaults = {
    email: "founder@kalpzero.com",
    password: "very-secure-password",
    tenantSlug: "demo-tenant"
  };
  const tenantDefaults = {
    email: "ops@tenant.com",
    password: "very-secure-password",
    tenantSlug: "demo-tenant"
  };
  const router = useRouter();
  const { login } = useAuth();
  const [mode, setMode] = useState<RoleMode>("platform");
  const [email, setEmail] = useState(platformDefaults.email);
  const [password, setPassword] = useState(platformDefaults.password);
  const [tenantSlug, setTenantSlug] = useState(platformDefaults.tenantSlug);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const helperCopy = useMemo(() => {
    if (mode === "platform") {
      return "Use the Kalp founder login to open the Super Admin console.";
    }
    return "Use any tenant operator email and provide the tenant slug you want to open.";
  }, [mode]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      const session = await login({
        email,
        password,
        // tenant_slug: mode === "tenant" ? tenantSlug : undefined
      });
      startTransition(() => {
        router.push(resolvePostLoginRoute(session.role));
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="grid min-h-screen gap-6 bg-[radial-gradient(circle_at_top_left,_rgba(190,63,20,0.15),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(33,92,79,0.18),_transparent_32%),linear-gradient(180deg,_#f8f3ec_0%,_#eef4f2_100%)] px-4 py-8 md:grid-cols-[1.1fr_0.9fr] md:px-8">
      <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(145deg,_rgba(255,255,255,0.88),_rgba(255,248,239,0.72))] p-8 shadow-glow backdrop-blur md:p-10">
        <Badge className="mb-5">KalpZero Enterprise</Badge>
        <h1 className="max-w-3xl font-heading text-5xl leading-[0.95] text-foreground md:text-6xl">
          Super Admin and tenant onboarding without exposing the platform internals.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
          This console is designed for operators, not engineers. Kalp manages infra, blueprints, and tenant runtime
          boundaries while businesses get a clear dashboard and their own branded public experience.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card className="bg-white/70">
            <CardHeader className="pb-3">
              <ShoppingBag className="size-5 text-primary" />
              <CardTitle className="text-xl">Commerce-first</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
              Products, variations, pricing, stock, orders, fulfillment, and payments.
            </CardContent>
          </Card>
          <Card className="bg-white/70">
            <CardHeader className="pb-3">
              <Hotel className="size-5 text-primary" />
              <CardTitle className="text-xl">Hospitality-ready</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
              Properties, rooms, reservations, operations, staff, folios, and public stay pages.
            </CardContent>
          </Card>
          <Card className="bg-white/70">
            <CardHeader className="pb-3">
              <Building2 className="size-5 text-primary" />
              <CardTitle className="text-xl">Tenant aware</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
              Every onboarded tenant gets a seeded runtime database, blueprint, and public content surface.
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="self-center border-white/80 bg-white/86">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>{helperCopy}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-muted p-1">
            {roleModes.map((roleMode) => (
              <button
                key={roleMode.key}
                type="button"
                className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                  mode === roleMode.key ? "bg-background shadow-sm" : "text-muted-foreground"
                }`}
                onClick={() => {
                  setMode(roleMode.key);
                  setError(null);
                  const defaults = roleMode.key === "platform" ? platformDefaults : tenantDefaults;
                  setEmail(defaults.email);
                  setPassword(defaults.password);
                  setTenantSlug(defaults.tenantSlug);
                }}
              >
                <div className="font-semibold text-foreground">{roleMode.label}</div>
                <div className="mt-1 text-xs leading-5">{roleMode.description}</div>
              </button>
            ))}
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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
            </div>
            {mode === "tenant" ? (
              <div className="space-y-2">
                <Label htmlFor="tenant-slug">Tenant slug</Label>
                <Input
                  id="tenant-slug"
                  placeholder="demo-tenant"
                  value={tenantSlug}
                  onChange={(event) => setTenantSlug(event.target.value)}
                />
              </div>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" size="lg" disabled={isPending}>
                {isPending ? "Signing in..." : mode === "platform" ? "Open Super Admin" : "Open Tenant Dashboard"}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  const defaults = mode === "platform" ? platformDefaults : tenantDefaults;
                  setEmail(defaults.email);
                  setPassword(defaults.password);
                  setTenantSlug(defaults.tenantSlug);
                }}
              >
                Use defaults
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
