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
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">How a request moves through Kalp</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          This is the simple technical view: a request comes into the shared app, Kalp reads the right data from the right store,
          and the result is shown as a website page, dashboard screen, or preview.
        </p>
      </div>

      <div className="grid gap-4 p-6 xl:grid-cols-[1fr_auto_1.1fr_auto_1fr_auto_1.1fr]">
        <FlowLane title="Requests" description="Where Kalp receives user actions and website traffic.">
          <DiagramCard
            icon={ShieldCheck}
            title="Platform operators"
            tone="blue"
            eyebrow="Actors"
            bullets={[
              "A platform admin or agency operator creates and manages businesses.",
              "This is where onboarding, settings, and admin actions begin."
            ]}
          />
          <DiagramCard
            icon={Globe}
            title="Public requests"
            tone="violet"
            eyebrow="Website traffic"
            bullets={[
              "Visitors open a business website page through the shared Next.js app.",
              "One route can serve many different business websites."
            ]}
          />
        </FlowLane>

        <FlowArrow />

        <FlowLane title="API and jobs" description="The shared backend and background work inside Kalp.">
          <DiagramCard
            icon={ServerCog}
            title="FastAPI admin and system layer"
            tone="emerald"
            eyebrow="Backend"
            bullets={[
              "Handles login, permissions, business setup, publishing, and app rules.",
              "This is the main backend for the Kalp product."
            ]}
          />
          <DiagramCard
            icon={Workflow}
            title="Onboarding and publish jobs"
            tone="amber"
            eyebrow="Background work"
            bullets={[
              "Creates starter business data, page data, and publishable website data.",
              "Also prepares preview data and website deployment details."
            ]}
          />
        </FlowLane>

        <FlowArrow />

        <FlowLane title="Data stores" description="Each store is used for a different kind of data.">
          <DiagramCard
            icon={Database}
            title="Postgres records"
            tone="blue"
            eyebrow="Structured data"
            bullets={[
              "Stores businesses, users, permissions, audit records, and other structured data.",
              "Used when the data must stay strict and reliable."
            ]}
          />
          <DiagramCard
            icon={Layers3}
            title="Mongo content and page docs"
            tone="violet"
            eyebrow="Flexible content"
            bullets={[
              "Stores business settings, website pages, discovery content, and flexible page data.",
              "Used when a business needs editable content and changing page shapes."
            ]}
          />
          <DiagramCard
            icon={Sparkles}
            title="Redis cache and queues"
            tone="emerald"
            eyebrow="Fast operations"
            bullets={[
              "Stores short-lived cache and queue data.",
              "Helps with publish jobs, imports, and faster repeated reads."
            ]}
          />
        </FlowLane>

        <FlowArrow />

        <FlowLane title="What people see" description="The screens and websites that Kalp finally shows.">
          <DiagramCard
            icon={Globe}
            title="Public tenant site"
            tone="blue"
            eyebrow="Website"
            bullets={[
              "The public website reads page content from the stored business content documents.",
              "Search-friendly page data and discovery data come from the same source."
            ]}
          />
          <DiagramCard
            icon={ServerCog}
            title="Dashboard and preview"
            tone="amber"
            eyebrow="Admin area"
            bullets={[
              "The business dashboard and preview tools run inside the same Next.js app.",
              "Teams can preview changes without building a separate website app."
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
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">Which data lives where</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Kalp uses more than one store because business records, website content, and short-lived job data are not the same kind of problem.
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
        <h3 className="mt-3 text-2xl font-semibold tracking-tight">How a business website goes live</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          This is the optional website flow: Kalp creates the business repo, connects the deploy target,
          and returns the live website URL to the onboarding response.
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
              `website_deployment.repo_url`, `website_deployment.production_url`, the deploy status, and a message for the operator.
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">Dependency</div>
            <div className="mt-3 text-sm leading-7 text-slate-200">
              Requires GitHub and Vercel credentials to be set in the root `.env` before the business is created.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
