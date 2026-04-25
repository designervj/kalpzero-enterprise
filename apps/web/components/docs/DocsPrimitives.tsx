import type { ReactNode } from "react";

type DocsCardGridProps = {
  children: ReactNode;
};

type DocsCardProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

type InlineBadgeProps = {
  children: ReactNode;
};

export function DocsCardGrid({ children }: DocsCardGridProps) {
  return <div className="my-8 grid gap-4 md:grid-cols-2">{children}</div>;
}

export function DocsCard({ title, eyebrow, children }: DocsCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
      {eyebrow ? (
        <div className="text-[11px] font-black uppercase tracking-[0.26em] text-blue-700">
          {eyebrow}
        </div>
      ) : null}
      <h3 className="mt-3 text-xl font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 text-[15px] leading-7 text-slate-600">{children}</div>
    </div>
  );
}

export function InlineBadge({ children }: InlineBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
      {children}
    </span>
  );
}
