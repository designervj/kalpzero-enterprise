import type { CSSProperties } from "react";
import type { PageBlockDto, PublicSitePayloadDto } from "@kalpzero/contracts";
import Link from "next/link";

type TenantThemeVariables = CSSProperties & Record<`--tenant-${string}`, string>;

function siteVariables(site: PublicSitePayloadDto): CSSProperties {
  const theme = site?.publicTheme || {};

  const vars: TenantThemeVariables = {};
  if (theme.primaryColor) vars["--tenant-primary"] = theme.primaryColor;
  if (theme.accentColor) vars["--tenant-accent"] = theme.accentColor;
  if (theme.surfaceColor) vars["--tenant-surface"] = theme.surfaceColor;
  if (theme.inkColor) vars["--tenant-ink"] = theme.inkColor;
  if (theme.mutedColor) vars["--tenant-muted"] = theme.mutedColor;
  if (theme.headingFont) vars["--tenant-heading"] = theme.headingFont;
  if (theme.bodyFont) vars["--tenant-body"] = theme.bodyFont;

  return vars;
}

function resolveTenantHref(tenantSlug: string, href: string, hostMode: boolean) {
  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  if (hostMode) {
    return href === "/" ? "/" : href;
  }

  return href === "/" ? `/${tenantSlug}` : `/${tenantSlug}${href}`;
}

function renderBlock(block: PageBlockDto, tenantSlug: string, hostMode: boolean) {
  if (block.kind === "hero") {
    return (
      <section key={block.id} className="kz-site__hero">
        {block.eyebrow ? <p className="kz-site__eyebrow">{block.eyebrow}</p> : null}
        {block.headline ? <h1>{block.headline}</h1> : null}
        {block.body ? <p className="kz-site__lead">{block.body}</p> : null}
        {block.ctaLabel && block.ctaHref ? (
          <div className="kz-site__actions">
            <Link href={resolveTenantHref(tenantSlug, block.ctaHref, hostMode)} className="kz-site__cta">
              {block.ctaLabel}
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  if (block.kind === "feature_grid") {
    return (
      <section key={block.id} className="kz-site__panel">
        {block.headline ? <h2>{block.headline}</h2> : null}
        {block.body ? <p className="kz-site__copy">{block.body}</p> : null}
        <div className="kz-site__grid">
          {(block.items ?? []).map((item) => (
            item.href ? (
              <Link
                key={item.title}
                href={resolveTenantHref(tenantSlug, item.href, hostMode)}
                className="kz-site__card kz-site__card--link"
              >
                <h3>{item.title}</h3>
                {item.value ? <strong>{item.value}</strong> : null}
                {item.description ? <p>{item.description}</p> : null}
              </Link>
            ) : (
              <article key={item.title} className="kz-site__card">
                <h3>{item.title}</h3>
                {item.value ? <strong>{item.value}</strong> : null}
                {item.description ? <p>{item.description}</p> : null}
              </article>
            )
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === "stat_strip") {
    return (
      <section key={block.id} className="kz-site__stats">
        {(block.items ?? []).map((item) => (
          <article key={item.title} className="kz-site__stat">
            {item.value ? <strong>{item.value}</strong> : null}
            <span>{item.title}</span>
          </article>
        ))}
      </section>
    );
  }

  if (block.kind === "cta") {
    return (
      <section key={block.id} className="kz-site__panel kz-site__panel--cta">
        {block.headline ? <h2>{block.headline}</h2> : null}
        {block.body ? <p className="kz-site__copy">{block.body}</p> : null}
        {block.ctaLabel && block.ctaHref ? (
          <Link href={resolveTenantHref(tenantSlug, block.ctaHref, hostMode)} className="kz-site__cta">
            {block.ctaLabel}
          </Link>
        ) : null}
      </section>
    );
  }

  return (
    <section key={block.id} className="kz-site__panel">
      {block.headline ? <h2>{block.headline}</h2> : null}
      {block.body ? <p className="kz-site__copy">{block.body}</p> : null}
    </section>
  );
}

export function RuntimeSite({ site, hostMode = false }: { site: PublicSitePayloadDto; hostMode?: boolean }) {
  if (!site) return null;

  return (
    <main className="kz-site" style={siteVariables(site)}>
      <header className="kz-site__header">
        <Link href={hostMode ? "/" : `/${site.tenantSlug}`} className="kz-site__brand">
          {site.businessLabel}
        </Link>
        <nav className="kz-site__nav">
          {(site.publicNavigation || []).map((item) => (
            <Link
              key={`${item.label}:${item.href}`}
              href={resolveTenantHref(site.tenantSlug, item.href, hostMode)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <div className="kz-site__content">
        {(site.page?.blocks || []).map((block) => renderBlock(block, site.tenantSlug, hostMode))}
      </div>
      {site.discovery ? (
        <section className="kz-site__discovery">
          <p className="kz-site__eyebrow">Discovery</p>
          <h2>{site.discovery.headline}</h2>
          <p className="kz-site__copy">{site.discovery.summary}</p>
          <div className="kz-site__grid">
            {(site.discovery.cards || []).map((card) => (
              <article key={card.href} className="kz-site__card">
                <h3>{card.title}</h3>
                <p>{card.summary}</p>
                <Link href={resolveTenantHref(site.tenantSlug, card.href, hostMode)}>
                  Open
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
