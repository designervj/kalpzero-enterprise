import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CircleDot,
  Database,
  ExternalLink,
  Globe,
  Layers3,
  Rocket,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Workflow
} from "lucide-react";

type Tone = "blue" | "emerald" | "amber" | "violet";

const toneStyles: Record<Tone, string> = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-100",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-100"
};

const badgeStyles: Record<Tone, string> = {
  blue: "bg-blue-500/15 text-blue-200",
  emerald: "bg-emerald-500/15 text-emerald-200",
  amber: "bg-amber-500/15 text-amber-200",
  violet: "bg-violet-500/15 text-violet-200"
};

type DiagramCardProps = {
  icon: LucideIcon;
  title: string;
  tone: Tone;
  eyebrow?: string;
  bullets: string[];
};

type FlowLaneProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function DiagramCard({ icon: Icon, title, tone, eyebrow, bullets }: DiagramCardProps) {
  return (
    <div className={`rounded-3xl border px-4 py-4 shadow-[0_18px_50px_-32px_rgba(2,6,23,0.65)] ${toneStyles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {eyebrow ? (
            <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${badgeStyles[tone]}`}>
              {eyebrow}
            </div>
          ) : null}
          <div className="mt-3 text-base font-semibold text-white">{title}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {bullets.map((bullet) => (
          <div key={bullet} className="flex items-start gap-2 text-sm leading-6 text-slate-300">
            <CircleDot className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-500" />
            <span>{bullet}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowLane({ title, description, children }: FlowLaneProps) {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">{title}</div>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="hidden items-center justify-center xl:flex">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
        <ArrowRight className="h-5 w-5 text-slate-400" />
      </div>
    </div>
  );
}

export function ExecutionFlowDiagram() {
  return (
    <div className="my-10 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.85)]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-300">Technical Flow</div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Kalp execution graph</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          This is the clean technical interpretation of the onboarding-and-publishing flow: requests enter through the shared platform,
          state is split across purpose-built stores, and tenant-facing surfaces are rendered from one runtime.
        </p>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-[1fr_auto_1.1fr_auto_1fr_auto_1.1fr]">
        <FlowLane title="Entry points" description="Where the platform receives intent and identity.">
          <DiagramCard
            icon={ShieldCheck}
            title="Platform operators"
            tone="blue"
            eyebrow="Actors"
            bullets={[
              "Super admin or agency operator starts onboarding.",
              "Tenant slug, vertical pack, and feature flags are declared here."
            ]}
          />
          <DiagramCard
            icon={Globe}
            title="Public requests"
            tone="violet"
            eyebrow="Runtime input"
            bullets={[
              "Tenant slug and page slug enter from the shared Next.js route.",
              "One route shell resolves many tenant websites."
            ]}
          />
        </FlowLane>

        <FlowArrow />

        <FlowLane title="Kalp services" description="The shared orchestration layer inside the platform.">
          <DiagramCard
            icon={ServerCog}
            title="FastAPI control plane"
            tone="emerald"
            eyebrow="Authority"
            bullets={[
              "Owns tenancy, auth, permissions, onboarding, and vertical contracts.",
              "Acts as the system source of truth for platform decisions."
            ]}
          />
          <DiagramCard
            icon={Workflow}
            title="Onboarding and publish pipeline"
            tone="amber"
            eyebrow="Workflow"
            bullets={[
              "Bootstraps tenant runtime databases and seed documents.",
              "Materializes public runtime state, preview payloads, and deployment metadata."
            ]}
          />
        </FlowLane>

        <FlowArrow />

        <FlowLane title="State layers" description="Each store handles a distinct class of responsibility.">
          <DiagramCard
            icon={Database}
            title="Postgres control records"
            tone="blue"
            eyebrow="Relational"
            bullets={[
              "Agencies, tenants, users, audit, and transactional authority.",
              "Strict governance and fail-closed business boundaries."
            ]}
          />
          <DiagramCard
            icon={Layers3}
            title="Mongo runtime documents"
            tone="violet"
            eyebrow="Document"
            bullets={[
              "Blueprint payloads, public pages, discovery documents, and AI-ready runtime data.",
              "Flexible document model without losing tenant scope."
            ]}
          />
          <DiagramCard
            icon={Sparkles}
            title="Redis and async coordination"
            tone="emerald"
            eyebrow="Operational"
            bullets={[
              "Queueing, cache, and job-style operational coordination.",
              "Supports publish, import, and background execution."
            ]}
          />
        </FlowLane>

        <FlowArrow />

        <FlowLane title="Tenant-facing surfaces" description="Everything that a business or operator finally sees.">
          <DiagramCard
            icon={Globe}
            title="Public tenant site"
            tone="blue"
            eyebrow="Website"
            bullets={[
              "Public route rendering resolves tenant pages from shared runtime documents.",
              "SEO and discovery payloads are driven from the same platform model."
            ]}
          />
          <DiagramCard
            icon={ServerCog}
            title="Tenant admin and studio"
            tone="amber"
            eyebrow="Operator"
            bullets={[
              "Tenant dashboard, admin preview, and studio stay inside one Next.js app.",
              "Operators inspect blueprint behavior without a separate codebase."
            ]}
          />
        </FlowLane>
      </div>
    </div>
  );
}

const matrixColumns = ["Postgres", "MongoDB", "Redis"];

const matrixRows = [
  {
    label: "Agencies, tenants, users, audit",
    values: ["Primary", "", ""]
  },
  {
    label: "Blueprints, public pages, discovery documents",
    values: ["", "Primary", ""]
  },
  {
    label: "Queues, cache, coordination",
    values: ["", "", "Primary"]
  },
  {
    label: "Publishing bootstrap and staged payloads",
    values: ["Indexed metadata", "Primary", "Assists jobs"]
  },
  {
    label: "Auth and operational enforcement",
    values: ["Primary", "Reads tenant context", "Speeds execution"]
  }
];

function matrixCell(value: string) {
  if (!value) {
    return <div className="h-12 rounded-2xl border border-white/5 bg-white/[0.03]" />;
  }

  const primary = value === "Primary";

  return (
    <div
      className={`flex h-12 items-center justify-center rounded-2xl border text-xs font-semibold ${
        primary
          ? "border-blue-400/30 bg-blue-400/15 text-blue-100"
          : "border-amber-400/20 bg-amber-400/10 text-amber-100"
      }`}
    >
      {value}
    </div>
  );
}

export function StorageMatrixDiagram() {
  return (
    <div className="my-10 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.85)]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-300">Responsibility Matrix</div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Which store does what</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          The platform is technical on purpose here: governance remains relational, tenant-authored runtime stays document-shaped,
          and short-lived execution state is kept operational.
        </p>
      </div>

      <div className="overflow-x-auto p-6">
        <div className="grid min-w-[760px] grid-cols-[2fr_repeat(3,1fr)] gap-3">
          <div className="px-4 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-400">Capability</div>
          {matrixColumns.map((column) => (
            <div key={column} className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.28em] text-slate-400">
              {column}
            </div>
          ))}

          {matrixRows.map((row) => (
            <div key={row.label} className="contents">
              <div className="flex min-h-12 items-center rounded-2xl border border-white/5 bg-white/[0.03] px-4 text-sm text-slate-200">
                {row.label}
              </div>
              {row.values.map((value, index) => (
                <div key={`${row.label}-${matrixColumns[index]}`}>{matrixCell(value)}</div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function WebsiteAutomationDiagram() {
  const steps = [
    {
      title: "Tenant onboarding",
      detail: "Platform admin creates the tenant and the provisioning workflow starts.",
      tone: "blue" as const,
      icon: Workflow
    },
    {
      title: "GitHub template source",
      detail: "Kalp reads the configured template repo and generates a business-specific repository.",
      tone: "violet" as const,
      icon: ExternalLink
    },
    {
      title: "Dedicated business repo",
      detail: "The new repo is created under your GitHub owner or org using tenant naming conventions.",
      tone: "emerald" as const,
      icon: Layers3
    },
    {
      title: "Vercel project and first deploy",
      detail: "Kalp creates the Vercel project, applies env values, and waits for the first production deployment.",
      tone: "amber" as const,
      icon: Rocket
    }
  ];

  return (
    <div className="my-10 overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 text-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.85)]">
      <div className="border-b border-white/10 px-6 py-5">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-300">Automation Flow</div>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Repo-to-live website provisioning</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          This is the operational chain behind the optional website automation: Kalp creates the repo, binds the deployment target,
          and returns a production URL back to the onboarding response.
        </p>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-[repeat(4,minmax(0,1fr))]">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="relative">
              <div className={`rounded-3xl border px-5 py-5 shadow-[0_18px_50px_-32px_rgba(2,6,23,0.65)] ${toneStyles[step.tone]}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${badgeStyles[step.tone]}`}>
                    Step {index + 1}
                  </div>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-lg font-semibold text-white">{step.title}</div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{step.detail}</p>
              </div>
              {index < steps.length - 1 ? (
                <div className="hidden xl:flex absolute -right-7 top-1/2 z-10 h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-900">
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Output</div>
            <div className="mt-3 text-sm leading-7 text-slate-200">
              `website_deployment.repo_url`, `website_deployment.production_url`, deployment status, and operator-facing message.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Dependency</div>
            <div className="mt-3 text-sm leading-7 text-slate-200">
              Requires the root GitHub and Vercel credentials to be configured before tenant creation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
