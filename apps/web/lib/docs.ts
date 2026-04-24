export type DocsOutlineItem = {
  id: string;
  label: string;
};

export type DocsPage = {
  title: string;
  href: string;
  section: string;
  summary: string;
  sourcePath: string;
  outline: DocsOutlineItem[];
};

export type DocsSection = {
  id: string;
  title: string;
  description: string;
};

export const docsSections: DocsSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Platform intent, actors, and the shared model."
  },
  {
    id: "core-concepts",
    title: "Core Concepts",
    description: "Blueprints, runtime documents, and publishing flow."
  },
  {
    id: "operations",
    title: "Operations",
    description: "Provisioning, deployment, and automation surfaces."
  }
];

export const docsPages: DocsPage[] = [
  {
    title: "What is Kalp",
    href: "/docs/getting-started/what-is-kalp",
    section: "getting-started",
    summary: "The product definition, wave-one focus, and why Kalp stays shared across tenants.",
    sourcePath: "apps/web/app/docs/getting-started/what-is-kalp/page.mdx",
    outline: [
      { id: "platform-definition", label: "Platform definition" },
      { id: "technical-topology", label: "Technical topology" },
      { id: "why-shared-platform", label: "Why shared platform" },
      { id: "wave-one-verticals", label: "Wave one verticals" },
      { id: "best-fit", label: "Best fit" }
    ]
  },
  {
    title: "Agency and Tenant Model",
    href: "/docs/getting-started/agency-and-tenant-model",
    section: "getting-started",
    summary: "How agencies, tenants, platform admins, and tenant admins relate inside the control plane.",
    sourcePath: "apps/web/app/docs/getting-started/agency-and-tenant-model/page.mdx",
    outline: [
      { id: "control-plane", label: "Control plane" },
      { id: "agency-layer", label: "Agency layer" },
      { id: "tenant-layer", label: "Tenant layer" },
      { id: "operator-flow", label: "Operator flow" }
    ]
  },
  {
    title: "Business Blueprint Runtime",
    href: "/docs/core-concepts/business-blueprint-runtime",
    section: "core-concepts",
    summary: "The contract that drives navigation, modules, theme tokens, routes, and workspace behavior.",
    sourcePath: "apps/web/app/docs/core-concepts/business-blueprint-runtime/page.mdx",
    outline: [
      { id: "blueprint-contract", label: "Blueprint contract" },
      { id: "modules-and-navigation", label: "Modules and navigation" },
      { id: "theme-and-components", label: "Theme and components" },
      { id: "why-no-forks", label: "Why no forks" }
    ]
  },
  {
    title: "Runtime Documents and Publishing",
    href: "/docs/core-concepts/runtime-documents-and-publishing",
    section: "core-concepts",
    summary: "How Postgres, MongoDB, Redis, public routes, and studio previews work together.",
    sourcePath: "apps/web/app/docs/core-concepts/runtime-documents-and-publishing/page.mdx",
    outline: [
      { id: "three-layer-storage", label: "Three-layer storage" },
      { id: "runtime-resolution-flow", label: "Runtime resolution flow" },
      { id: "public-runtime", label: "Public runtime" },
      { id: "admin-preview", label: "Admin preview" },
      { id: "publishing-cycle", label: "Publishing cycle" }
    ]
  },
  {
    title: "Business Website Provisioning",
    href: "/docs/operations/business-website-provisioning",
    section: "operations",
    summary: "How onboarding can create a GitHub repo, connect Vercel, and return a live business URL.",
    sourcePath: "apps/web/app/docs/operations/business-website-provisioning/page.mdx",
    outline: [
      { id: "onboarding-trigger", label: "Onboarding trigger" },
      { id: "github-template", label: "GitHub template" },
      { id: "vercel-project", label: "Vercel project" },
      { id: "automation-sequence", label: "Automation sequence" },
      { id: "response-shape", label: "Response shape" }
    ]
  }
];

const docsPageMap = new Map(docsPages.map((page) => [page.href, page]));

export const docsSectionsWithPages = docsSections.map((section) => ({
  ...section,
  pages: docsPages.filter((page) => page.section === section.id)
}));

export function normalizeDocsHref(pathname: string) {
  if (!pathname || pathname === "/") {
    return docsPages[0]?.href ?? "/docs";
  }

  const normalized = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  if (normalized === "/docs") {
    return docsPages[0]?.href ?? "/docs";
  }

  return normalized;
}

export function getDocsPage(pathname: string) {
  return docsPageMap.get(normalizeDocsHref(pathname)) ?? docsPages[0];
}

export function getDocsPager(pathname: string) {
  const currentHref = normalizeDocsHref(pathname);
  const currentIndex = docsPages.findIndex((page) => page.href === currentHref);

  if (currentIndex === -1) {
    return {
      previous: null,
      next: docsPages[0] ?? null
    };
  }

  return {
    previous: currentIndex > 0 ? docsPages[currentIndex - 1] : null,
    next: currentIndex < docsPages.length - 1 ? docsPages[currentIndex + 1] : null
  };
}

export function getDocsSourceHref(page: DocsPage) {
  return `https://github.com/hideepakrai/kalpzero-enterprise/blob/main/${page.sourcePath}`;
}
