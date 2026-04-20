/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { RenderHtml } from "@/components/RenderHtml";
import { GoogleAnalytics } from "@next/third-parties/google";
import type { PublicBusinessPayload } from "@/lib/public-business";
import { toAbsolutePublicUrl } from "@/lib/public-seo";

function currencyLabel(currency?: string): string {
  return (currency || "USD").toUpperCase();
}

function pickFirstAssetUrl(candidates: unknown[]): string {
  const isRenderableAsset = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
    if (trimmed.startsWith("data:image/")) return true;
    return /^(https?:)?\/\//i.test(trimmed);
  };

  for (const candidate of candidates) {
    if (typeof candidate === "string" && isRenderableAsset(candidate)) {
      return candidate.trim();
    }
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === "string" && isRenderableAsset(item)) {
          return item.trim();
        }
        if (item && typeof item === "object") {
          const row = item as Record<string, unknown>;
          const nested =
            typeof row.url === "string"
              ? row.url
              : typeof row.src === "string"
                ? row.src
                : "";
          if (nested && isRenderableAsset(nested))
            return nested.trim();
        }
      }
    }
  }
  return "";
}

export function BusinessProfileView(props: {
  profile: PublicBusinessPayload;
  canonicalPath: string;
}) {
  const { profile, canonicalPath } = props;
  const primary =
    typeof profile.brand.primary === "string"
      ? profile.brand.primary
      : "#00f0ff";
  const secondary =
    typeof profile.brand.secondary === "string"
      ? profile.brand.secondary
      : "#8b5cf6";
  const heroImage = pickFirstAssetUrl([profile.publicProfile.heroImage]);
  const businessLogo = pickFirstAssetUrl([
    profile.publicProfile.logoUrl,
    profile.publicProfile.logo,
    (profile.brandKit as { logo?: { primary?: string } })?.logo?.primary,
    (profile.brandKit as { logo?: { light?: string } })?.logo?.light,
    (profile.brandKit as { logo?: { dark?: string } })?.logo?.dark,
    (profile.brandKit as { logo?: { icon?: string } })?.logo?.icon,
    (profile.brand as { logo?: unknown })?.logo,
  ]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.name,
    url: toAbsolutePublicUrl(canonicalPath),
    description: profile.publicProfile.summary || profile.seo.description,
    industry: profile.industry || undefined,
    slogan: profile.publicProfile.headline || undefined,
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100">
      <section
        className="border-b border-slate-800/70"
        style={{
          background: `linear-gradient(135deg, ${primary}22, ${secondary}22)`,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-14">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="inline-flex items-center rounded-full border border-slate-700 bg-black/40 px-3 py-1 text-[11px] uppercase tracking-wider text-slate-300">
                  {profile.industry || "Business"}
                </span>
                <span className="text-[11px] uppercase tracking-wider text-slate-400">
                  {profile.claimStatus === "free_unclaimed"
                    ? "Free Profile"
                    : "Claimed Profile"}
                </span>
              </div>
              <div className="mb-4 flex items-center gap-4">
                {businessLogo ? (
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-slate-700 bg-black/30 p-3">
                    <img
                      src={businessLogo}
                      alt={`${profile.name} logo`}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-700 bg-black/30 text-xl font-semibold text-cyan-200/90">
                    {(profile.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                    Brand Identity
                  </div>
                  <div className="mt-1 text-xl font-semibold text-white">
                    {profile.name}
                  </div>
                </div>
              </div>
              <h1 className="text-4xl font-black text-white">
                {profile.publicProfile.headline || profile.name}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                {profile.publicProfile.summary || profile.seo.description}
              </p>
              <div className="mt-4 text-sm text-slate-400">
                {profile.businessType ? `${profile.businessType} • ` : ""}
                {profile.key}
              </div>
            </div>
            <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={`${profile.name} hero`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-center text-slate-300">
                  <div>
                    <div className="text-4xl font-semibold text-cyan-300/90">
                      {(profile.name || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      Hero Placeholder
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-[10px] uppercase tracking-wider text-slate-200">
                {profile.publicProfile.slug}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        {profile.landingPage &&
          typeof profile.landingPage.content === "string" && (
            <section className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-6">
              <h2 className="text-xl font-bold text-white mb-2">
                {typeof profile.landingPage.title === "string"
                  ? profile.landingPage.title
                  : "About"}
              </h2>
              <RenderHtml html={profile.landingPage.content} />
            </section>
          )}

        {profile.featuredProducts.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              Featured Offerings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.featuredProducts.map((item, idx) => {
                const titleCandidate =
                  typeof item.title === "string"
                    ? item.title
                    : typeof item.name === "string"
                      ? item.name
                      : "";
                const title = titleCandidate || `Item ${idx + 1}`;
                const description = (
                  typeof item.shortDescription === "string"
                    ? item.shortDescription
                    : typeof item.description === "string"
                      ? item.description
                      : ""
                ).slice(0, 140);
                const amount =
                  typeof (item as { price?: { amount?: number } }).price
                    ?.amount === "number"
                    ? (item as { price: { amount: number } }).price.amount
                    : typeof item.price === "number"
                      ? item.price
                      : null;
                const currency =
                  typeof (item as { price?: { currency?: string } }).price
                    ?.currency === "string"
                    ? (item as { price: { currency: string } }).price.currency
                    : "USD";
                const imageUrl = pickFirstAssetUrl([
                  (item as { image?: unknown }).image,
                  (item as { thumbnail?: unknown }).thumbnail,
                  (item as { images?: unknown }).images,
                ]);

                return (
                  <article
                    key={`${title}-${idx}`}
                    className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4"
                  >
                    <div className="mb-3 h-36 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-cyan-200/90">
                          {(title || "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white mb-1">{title}</h3>
                    {description && (
                      <p className="text-sm text-slate-400 mb-3">
                        {description}
                      </p>
                    )}
                    {amount !== null && (
                      <div className="text-emerald-400 font-bold text-sm">
                        {currencyLabel(currency)}{" "}
                        {Number(amount).toLocaleString()}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {profile.featuredPortfolio.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              Portfolio Highlights
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profile.featuredPortfolio.map((item, idx) => {
                const title = String(item.title || `Project ${idx + 1}`);
                const imageUrl = pickFirstAssetUrl([
                  (item as { image?: unknown }).image,
                  (item as { thumbnail?: unknown }).thumbnail,
                  (item as { coverImage?: unknown }).coverImage,
                  (item as { images?: unknown }).images,
                ]);
                return (
                  <article
                    key={`${String(item.title || "portfolio")}-${idx}`}
                    className="rounded-xl border border-slate-800/70 bg-slate-900/40 p-4"
                  >
                    <div className="mb-3 h-36 overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-cyan-200/90">
                          {title.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-white">{title}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {String(item.category || "Portfolio")}
                    </p>
                    {typeof item.description === "string" && (
                      <p className="text-sm text-slate-400 mt-3">
                        {item.description.slice(0, 120)}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800/70 py-8 px-6 text-center text-xs text-slate-500">
        Powered by KalpZero business profile.{" "}
        <Link href="/login" className="text-cyan-400 hover:underline">
          Claim or manage this business
        </Link>
      </footer>
      {profile.googleAnalyticsId && (
        <GoogleAnalytics gaId={profile.googleAnalyticsId} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
