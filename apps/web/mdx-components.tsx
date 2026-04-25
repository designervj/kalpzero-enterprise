import type { MDXComponents } from "mdx/types";
import Link from "next/link";

import { Callout } from "@/components/docs/Callout";
import { DocsCard, DocsCardGrid, InlineBadge } from "@/components/docs/DocsPrimitives";
import {
  ExecutionFlowDiagram,
  StorageMatrixDiagram,
  WebsiteAutomationDiagram
} from "@/components/docs/TechnicalDiagrams";

function headingClassName(level: "h1" | "h2" | "h3") {
  if (level === "h1") {
    return "text-balance font-heading text-5xl font-semibold leading-[0.96] tracking-tight text-slate-950 sm:text-6xl";
  }

  if (level === "h2") {
    return "mt-14 scroll-mt-28 border-t border-slate-200 pt-10 font-heading text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl";
  }

  return "mt-10 font-heading text-2xl font-semibold tracking-tight text-slate-950";
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ className = "", ...props }) => (
      <h1 className={`${headingClassName("h1")} ${className}`.trim()} {...props} />
    ),
    h2: ({ className = "", ...props }) => (
      <h2 className={`${headingClassName("h2")} ${className}`.trim()} {...props} />
    ),
    h3: ({ className = "", ...props }) => (
      <h3 className={`${headingClassName("h3")} ${className}`.trim()} {...props} />
    ),
    p: ({ className = "", ...props }) => (
      <p className={`mt-6 text-[17px] leading-8 text-slate-600 ${className}`.trim()} {...props} />
    ),
    ul: ({ className = "", ...props }) => (
      <ul className={`mt-6 space-y-3 pl-6 text-[17px] leading-8 text-slate-600 ${className}`.trim()} {...props} />
    ),
    ol: ({ className = "", ...props }) => (
      <ol className={`mt-6 space-y-3 pl-6 text-[17px] leading-8 text-slate-600 ${className}`.trim()} {...props} />
    ),
    li: ({ className = "", ...props }) => (
      <li className={`pl-1 ${className}`.trim()} {...props} />
    ),
    hr: ({ className = "", ...props }) => (
      <hr className={`my-12 border-slate-200 ${className}`.trim()} {...props} />
    ),
    blockquote: ({ className = "", ...props }) => (
      <blockquote
        className={`my-8 rounded-3xl border-l-4 border-blue-500 bg-slate-50 px-5 py-4 text-[16px] leading-7 text-slate-700 ${className}`.trim()}
        {...props}
      />
    ),
    code: ({ className = "", ...props }) => (
      <code
        className={`rounded-lg bg-slate-100 px-2 py-1 text-[0.88em] font-medium text-slate-800 ${className}`.trim()}
        {...props}
      />
    ),
    pre: ({ className = "", ...props }) => (
      <pre
        className={`my-8 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-950 px-5 py-5 text-[14px] leading-7 text-slate-100 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.75)] ${className}`.trim()}
        {...props}
      />
    ),
    table: ({ className = "", ...props }) => (
      <div className="my-8 overflow-x-auto">
        <table className={`min-w-full border-collapse overflow-hidden rounded-3xl border border-slate-200 text-left ${className}`.trim()} {...props} />
      </div>
    ),
    thead: ({ className = "", ...props }) => (
      <thead className={`bg-slate-50 ${className}`.trim()} {...props} />
    ),
    th: ({ className = "", ...props }) => (
      <th className={`border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 ${className}`.trim()} {...props} />
    ),
    td: ({ className = "", ...props }) => (
      <td className={`border-b border-slate-200 px-4 py-3 text-sm leading-6 text-slate-600 ${className}`.trim()} {...props} />
    ),
    a: ({ href = "", className = "", ...props }) => {
      const nextClassName = `font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-900 hover:decoration-blue-400 ${className}`.trim();

      if (href.startsWith("/")) {
        return <Link href={href} className={nextClassName} {...props} />;
      }

      return <a href={href} className={nextClassName} {...props} />;
    },
    Callout,
    DocsCardGrid,
    DocsCard,
    InlineBadge,
    ExecutionFlowDiagram,
    StorageMatrixDiagram,
    WebsiteAutomationDiagram,
    ...components
  };
}
