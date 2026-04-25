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
    id: "start-here",
    title: "Start Here",
    description: "What Kalp is and the main words you will see in the product."
  },
  {
    id: "businesses-and-users",
    title: "Businesses and Users",
    description: "How agencies, businesses, users, and access are organized."
  },
  {
    id: "managing-data",
    title: "Managing Data",
    description: "How Kalp stores business data, page content, and business settings."
  },
  {
    id: "apis",
    title: "APIs",
    description: "The main API groups for login, onboarding, and publishing."
  },
  {
    id: "websites-and-deployment",
    title: "Websites and Deployment",
    description: "How websites are created, deployed, and updated live."
  }
];

export const docsPages: DocsPage[] = [
  {
    title: "What is Kalp",
    href: "/docs/getting-started/what-is-kalp",
    section: "start-here",
    summary: "A simple introduction to Kalp, what it does, and when it is a good fit.",
    sourcePath: "apps/web/app/docs/getting-started/what-is-kalp/page.mdx",
    outline: [
      { id: "what-kalp-does", label: "What Kalp does" },
      { id: "what-stays-shared", label: "What stays shared" },
      { id: "main-parts", label: "Main parts" },
      { id: "technical-view", label: "Technical view" },
      { id: "when-to-use-kalp", label: "When to use Kalp" }
    ]
  },
  {
    title: "Key Terms",
    href: "/docs/getting-started/key-terms",
    section: "start-here",
    summary: "Plain-language definitions for agencies, businesses, users, settings, and deployment terms.",
    sourcePath: "apps/web/app/docs/getting-started/key-terms/page.mdx",
    outline: [
      { id: "business-structure", label: "Business structure" },
      { id: "people", label: "People" },
      { id: "settings-and-content", label: "Settings and content" },
      { id: "deployment-terms", label: "Deployment terms" }
    ]
  },
  {
    title: "Agencies and Businesses",
    href: "/docs/getting-started/agency-and-tenant-model",
    section: "businesses-and-users",
    summary: "How Kalp groups businesses, what an agency is, and what gets created during onboarding.",
    sourcePath: "apps/web/app/docs/getting-started/agency-and-tenant-model/page.mdx",
    outline: [
      { id: "agency", label: "Agency" },
      { id: "business", label: "Business" },
      { id: "what-is-created", label: "What is created" },
      { id: "onboarding-flow", label: "Onboarding flow" }
    ]
  },
  {
    title: "Roles and Access",
    href: "/docs/businesses-and-users/roles-and-access",
    section: "businesses-and-users",
    summary: "Who can do what inside Kalp and how the system keeps one business separate from another.",
    sourcePath: "apps/web/app/docs/businesses-and-users/roles-and-access/page.mdx",
    outline: [
      { id: "main-roles", label: "Main roles" },
      { id: "how-access-is-checked", label: "How access is checked" },
      { id: "tenant-boundaries", label: "Tenant boundaries" },
      { id: "common-scenarios", label: "Common scenarios" }
    ]
  },
  {
    title: "How Kalp Stores Data",
    href: "/docs/managing-data/how-kalp-stores-data",
    section: "managing-data",
    summary: "A plain-language explanation of what lives in Postgres, MongoDB, and Redis.",
    sourcePath: "apps/web/app/docs/managing-data/how-kalp-stores-data/page.mdx",
    outline: [
      { id: "why-three-stores", label: "Why three stores" },
      { id: "postgres", label: "Postgres" },
      { id: "mongodb", label: "MongoDB" },
      { id: "redis", label: "Redis" },
      { id: "how-it-works-together", label: "How it works together" }
    ]
  },
  {
    title: "Business Settings and Modules",
    href: "/docs/core-concepts/business-blueprint-runtime",
    section: "managing-data",
    summary: "How Kalp changes menus, modules, labels, and colors for each business without a separate app.",
    sourcePath: "apps/web/app/docs/core-concepts/business-blueprint-runtime/page.mdx",
    outline: [
      { id: "what-these-settings-control", label: "What these settings control" },
      { id: "navigation-and-modules", label: "Navigation and modules" },
      { id: "look-and-feel", label: "Look and feel" },
      { id: "why-kalp-uses-settings", label: "Why Kalp uses settings" }
    ]
  },
  {
    title: "Pages, Content, and Publishing",
    href: "/docs/core-concepts/runtime-documents-and-publishing",
    section: "managing-data",
    summary: "How Kalp stores website pages, preview data, discovery content, and published output.",
    sourcePath: "apps/web/app/docs/core-concepts/runtime-documents-and-publishing/page.mdx",
    outline: [
      { id: "what-is-published", label: "What is published" },
      { id: "page-flow", label: "Page flow" },
      { id: "preview-and-editing", label: "Preview and editing" },
      { id: "public-website-route", label: "Public website route" },
      { id: "publish-cycle", label: "Publish cycle" }
    ]
  },
  {
    title: "API Overview",
    href: "/docs/apis/api-overview",
    section: "apis",
    summary: "The main API groups in Kalp and when to use each one.",
    sourcePath: "apps/web/app/docs/apis/api-overview/page.mdx",
    outline: [
      { id: "base-url", label: "Base URL" },
      { id: "main-route-groups", label: "Main route groups" },
      { id: "auth-and-session", label: "Auth and session" },
      { id: "how-to-pick-an-endpoint", label: "How to pick an endpoint" }
    ]
  },
  {
    title: "Authentication API",
    href: "/docs/apis/authentication-api",
    section: "apis",
    summary: "Login, logout, session, register, profile update, and development-only magic login.",
    sourcePath: "apps/web/app/docs/apis/authentication-api/page.mdx",
    outline: [
      { id: "login", label: "Login" },
      { id: "current-session", label: "Current session" },
      { id: "logout", label: "Logout" },
      { id: "register-and-profile", label: "Register and profile" },
      { id: "dev-only-magic-login", label: "Dev-only magic login" }
    ]
  },
  {
    title: "Business Onboarding API",
    href: "/docs/apis/business-onboarding-api",
    section: "apis",
    summary: "Check readiness, create agencies, create businesses, and read the onboarding response.",
    sourcePath: "apps/web/app/docs/apis/business-onboarding-api/page.mdx",
    outline: [
      { id: "readiness-check", label: "Readiness check" },
      { id: "create-an-agency", label: "Create an agency" },
      { id: "create-a-business", label: "Create a business" },
      { id: "response", label: "Response" }
    ]
  },
  {
    title: "Publishing API",
    href: "/docs/apis/publishing-api",
    section: "apis",
    summary: "Read and update business settings, pages, discovery content, and public website payloads.",
    sourcePath: "apps/web/app/docs/apis/publishing-api/page.mdx",
    outline: [
      { id: "overview", label: "Overview" },
      { id: "business-settings", label: "Business settings" },
      { id: "pages", label: "Pages" },
      { id: "discovery", label: "Discovery" },
      { id: "public-site-data", label: "Public site data" }
    ]
  },
  {
    title: "Business Website Creation",
    href: "/docs/operations/business-website-provisioning",
    section: "websites-and-deployment",
    summary: "How Kalp can create a GitHub repo, connect Vercel, and return a live website URL during onboarding.",
    sourcePath: "apps/web/app/docs/operations/business-website-provisioning/page.mdx",
    outline: [
      { id: "what-it-does", label: "What it does" },
      { id: "what-you-need", label: "What you need" },
      { id: "flow", label: "Flow" },
      { id: "response", label: "Response" }
    ]
  },
  {
    title: "Live Deploy Flow",
    href: "/docs/websites-and-deployment/live-deploy-flow",
    section: "websites-and-deployment",
    summary: "How a push to main becomes a live website update on the Kalp server.",
    sourcePath: "apps/web/app/docs/websites-and-deployment/live-deploy-flow/page.mdx",
    outline: [
      { id: "when-deploy-runs", label: "When deploy runs" },
      { id: "what-happens-on-server", label: "What happens on server" },
      { id: "how-to-check-a-deploy", label: "How to check a deploy" },
      { id: "manual-recovery", label: "Manual recovery" }
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
