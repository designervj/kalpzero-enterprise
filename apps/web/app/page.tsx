import type { Metadata } from "next";

import { headers } from "next/headers";
import { RuntimeSite } from "@/components/runtime-site";
import PublicHomeClient from "@/components/landingPage/PublicHomeClient";
import { isTenantHostRequest, normalizeHost } from "@/lib/public-hosts";
import { getPublicSitePayload, getTenantSlugForHost } from "@/lib/runtime-publishing";
import { toAbsolutePublicUrl } from "@/lib/seo/public-seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KalpTree | Build, Publish, Discover",
  description:
    "KalpTree helps businesses and creators build pages, publish profiles, and get discovered with SEO-first listings.",
  alternates: { canonical: "/" },
};

function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "KalpTree",
    url: toAbsolutePublicUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: `${toAbsolutePublicUrl("/discover/search")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default async function KalpPublicHomePage() {
  const headerList = await headers();
  const host = normalizeHost(headerList.get("host"));

  if (isTenantHostRequest(host)) {
    const tenantSlug = await getTenantSlugForHost(host);
    if (tenantSlug) {
      const payload = await getPublicSitePayload(tenantSlug, "home");
      return <RuntimeSite site={payload} hostMode />;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-fuchsia-500/30 font-sans overflow-x-hidden">
      <JsonLd />
      <main className="mx-auto max-w-7xl px-6 py-0">
        <PublicHomeClient />
      </main>
    </div>
  );
}
