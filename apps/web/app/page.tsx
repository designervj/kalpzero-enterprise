import type { Metadata } from "next";

import { headers } from "next/headers";
// import CanonicalBusinessProfilePage from "../(public)/[slug]/page";

// import { PLATFORM_HOME_HOSTS } from "@/lib/server-env";
import PublicHomeClient from "@/components/landingPage/PublicHomeClient";
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
  const host = (headerList.get("host") || "").toLowerCase();
  const parts = host.split(".");
//   const homeHosts = PLATFORM_HOME_HOSTS;
//   const isPlatformHome = homeHosts.includes(host);
//   let subdomain = null;

//   if (
//     !isPlatformHome &&
//     (parts.length > 2 || (parts.length > 1 && parts.includes("localhost:3000")))
//   ) {
//     subdomain =
//       parts.length > 1 && parts.includes("localhost:3000")
//         ? true
//         : parts.slice(0, parts.length - 2).join(".");
//   }

//   if (subdomain) {
//     return (
//       <CanonicalBusinessProfilePage
//         params={Promise.resolve({ slug: "nothing" })}
//       />
//     );
//   }

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-fuchsia-500/30 font-sans overflow-x-hidden">
      <JsonLd />
      <main className="mx-auto max-w-7xl px-6 py-0">
        <PublicHomeClient />
      </main>
    </div>
  );
}
