"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from "lucide-react";

import {
  docsSectionsWithPages,
  getDocsPager,
  getDocsPage,
  getDocsSourceHref,
  normalizeDocsHref
} from "@/lib/docs";

type DocsShellProps = {
  children: ReactNode;
};

function Sidebar() {
  const pathname = usePathname();
  const currentHref = normalizeDocsHref(pathname ?? "/docs");

  return (
    <div className="sticky top-24 space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
        <div className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-700">
          Kalp Docs
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Guides for setting up businesses, managing data, using APIs, and publishing websites in Kalp.
        </p>
      </div>

      <nav className="space-y-6">
        {docsSectionsWithPages.map((section) => (
          <div key={section.id}>
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
              {section.title}
            </div>
            <div className="mt-3 space-y-1">
              {section.pages.map((page) => {
                const isActive = page.href === currentHref;

                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    className={`block rounded-2xl px-4 py-3 text-sm transition ${
                      isActive
                        ? "bg-slate-900 text-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.75)]"
                        : "text-slate-600 hover:bg-white hover:text-slate-900"
                    }`}
                  >
                    <div className="font-semibold">{page.title}</div>
                    <div className={`mt-1 text-xs leading-5 ${isActive ? "text-slate-300" : "text-slate-500"}`}>
                      {page.summary}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

function MobileDirectory() {
  const pathname = usePathname();
  const currentHref = normalizeDocsHref(pathname ?? "/docs");

  return (
    <div className="mb-6 lg:hidden">
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {docsSectionsWithPages.flatMap((section) =>
            section.pages.map((page) => {
              const isActive = page.href === currentHref;

              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={`min-w-[220px] rounded-2xl border px-4 py-3 text-sm transition ${
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">
                    {section.title}
                  </div>
                  <div className="mt-2 font-semibold">{page.title}</div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function TableOfContents() {
  const pathname = usePathname();
  const currentPage = getDocsPage(pathname ?? "/docs");

  return (
    <div className="sticky top-24 space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
        <div className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
          On This Page
        </div>
        <div className="mt-4 space-y-3">
          {currentPage.outline.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="block text-sm text-slate-600 transition hover:text-slate-900"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      <a
        href={getDocsSourceHref(currentPage)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-700 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)] transition hover:border-slate-300 hover:text-slate-900"
      >
        <span className="font-semibold">Edit this page</span>
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}

function Pager() {
  const pathname = usePathname();
  const currentPage = getDocsPage(pathname ?? "/docs");
  const pager = getDocsPager(pathname ?? "/docs");

  return (
    <div className="mt-14 border-t border-slate-200 pt-8">
      <div className="mb-4 text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
        Continue Reading
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {pager.previous ? (
          <Link
            href={pager.previous.href}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              <ArrowLeft className="h-4 w-4" />
              Previous
            </div>
            <div className="mt-3 text-lg font-semibold text-slate-900">{pager.previous.title}</div>
          </Link>
        ) : (
          <div className="hidden md:block" />
        )}

        {pager.next ? (
          <Link
            href={pager.next.href}
            className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-right text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-center justify-end gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
              Next
              <ArrowRight className="h-4 w-4" />
            </div>
            <div className="mt-3 text-lg font-semibold text-slate-900">{pager.next.title}</div>
          </Link>
        ) : null}
      </div>

      <div className="mt-6 text-sm text-slate-500">
        Current page: <span className="font-semibold text-slate-900">{currentPage.title}</span>
      </div>
    </div>
  );
}

export function DocsShell({ children }: DocsShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.1),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.08),_transparent_28%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_55%,_#f8fafc)] text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/docs" className="flex items-center gap-3 text-slate-900">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.75)]">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-700">Documentation</div>
              <div className="text-lg font-semibold">Kalp Platform Docs</div>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <Link href="/" className="transition hover:text-slate-900">Home</Link>
            <Link href="/platform" className="transition hover:text-slate-900">Platform</Link>
            <Link href="/login" className="transition hover:text-slate-900">Login</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
        <MobileDirectory />

        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)_220px]">
          <aside className="hidden lg:block">
            <Sidebar />
          </aside>

          <main className="min-w-0">
            <div className="rounded-[32px] border border-slate-200 bg-white/95 px-6 py-8 shadow-[0_28px_90px_-48px_rgba(15,23,42,0.55)] sm:px-8 lg:px-12 lg:py-12">
              <article>{children}</article>
              <Pager />
            </div>
          </main>

          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </div>
  );
}
