import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMasterDb, getTenantDb } from '@/lib/db';
import { RenderHtml } from '@/components/RenderHtml';
import { toAbsolutePublicUrl } from '@/lib/public-seo';

interface CatalogViewProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type TenantRecord = {
    key?: string;
    publicProfile?: { slug?: string };
};

type CatalogRecord = {
    title?: string;
    slug?: string;
    content?: string;
    status?: string;
    seo?: { metaTitle?: string; metaDescription?: string };
};

function resolveQueryValue(value?: string | string[]): string {
    if (!value) return '';
    return Array.isArray(value) ? (value[0] || '') : value;
}

function parseCombinedSlug(slug: string) {
    const parts = slug.split('--');
    if (parts.length >= 2) {
        const tenantHint = parts.shift() || '';
        return { tenantHint, catalogSlug: parts.join('--') };
    }
    return { tenantHint: '', catalogSlug: slug };
}

function stripHtml(input: string): string {
    return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function resolveTenantKey(tenantHint: string): Promise<string | null> {
    if (!tenantHint) return null;
    const masterDb = await getMasterDb();
    const tenant = await masterDb.collection('tenants').findOne(
        {
            $or: [{ key: tenantHint }, { 'publicProfile.slug': tenantHint }],
        },
        { projection: { key: 1, publicProfile: 1 } }
    ) as TenantRecord | null;
    return tenant?.key ? String(tenant.key) : null;
}

async function loadCatalog(tenantKey: string, catalogSlug: string, preview: boolean): Promise<CatalogRecord | null> {
    const tenantDb = await getTenantDb(tenantKey);
    const query: Record<string, unknown> = { slug: catalogSlug };
    if (!preview) query.status = 'published';
    const catalog = await tenantDb.collection('catalogs').findOne(query, {
        projection: { title: 1, slug: 1, content: 1, status: 1, seo: 1 },
    }) as CatalogRecord | null;
    return catalog ? JSON.parse(JSON.stringify(catalog)) : null;
}

export async function generateMetadata({ params, searchParams }: CatalogViewProps): Promise<Metadata> {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const { tenantHint, catalogSlug } = parseCombinedSlug(slug);
    const tenantParam = resolveQueryValue(resolvedSearchParams.tenant) || resolveQueryValue(resolvedSearchParams.t);
    const tenantKey = tenantParam || await resolveTenantKey(tenantHint);
    if (!tenantKey) return { title: 'Catalog Not Found', description: 'Catalog not available.' };

    const preview = resolveQueryValue(resolvedSearchParams.preview) === '1';
    const catalog = await loadCatalog(tenantKey, catalogSlug, preview);
    if (!catalog) return { title: 'Catalog Not Found', description: 'Catalog not available.' };

    const metaTitle = catalog.seo?.metaTitle || catalog.title || catalogSlug;
    const metaDescription = catalog.seo?.metaDescription || stripHtml(typeof catalog.content === 'string' ? catalog.content : '').slice(0, 160);
    return {
        title: metaTitle,
        description: metaDescription,
        alternates: { canonical: `/catalog/${slug}` },
    };
}

export default async function CatalogViewPage({ params, searchParams }: CatalogViewProps) {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const { tenantHint, catalogSlug } = parseCombinedSlug(slug);
    const tenantParam = resolveQueryValue(resolvedSearchParams.tenant) || resolveQueryValue(resolvedSearchParams.t);
    const tenantKey = tenantParam || await resolveTenantKey(tenantHint);
    if (!tenantKey) notFound();

    const preview = resolveQueryValue(resolvedSearchParams.preview) === '1';
    const exportParam = resolveQueryValue(resolvedSearchParams.export).toLowerCase();
    const exportMode = exportParam === 'pdf' || exportParam === 'print';
    const catalog = await loadCatalog(tenantKey, catalogSlug, preview);
    if (!catalog) notFound();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: catalog.seo?.metaTitle || catalog.title || catalogSlug,
        url: toAbsolutePublicUrl(`/catalog/${slug}`),
        description: catalog.seo?.metaDescription || stripHtml(typeof catalog.content === 'string' ? catalog.content : '').slice(0, 160),
    };

    return (
        <div className={`min-h-screen ${exportMode ? 'bg-white text-slate-950' : 'bg-[#030712] text-slate-100'}`}>
            {preview && !exportMode && (
                <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-amber-200">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.3em]">Catalog Preview</p>
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/catalog-builder?slug=${encodeURIComponent(catalogSlug)}`}
                                className="inline-flex items-center rounded-md border border-amber-300/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:border-amber-200"
                            >
                                Open Catalog Builder
                            </Link>
                        </div>
                    </div>
                </div>
            )}
            {exportMode && (
                <div className="kalp-catalog-export-hint mx-auto max-w-6xl px-6 pt-5 text-xs text-slate-600">
                    PDF export mode is active. Print dialog opens automatically.
                </div>
            )}
            <main className={`mx-auto max-w-6xl px-6 ${exportMode ? 'py-6' : 'py-10'}`}>
                <RenderHtml html={typeof catalog.content === 'string' ? catalog.content : ''} />
            </main>
            {exportMode && (
                <>
                    <style
                        dangerouslySetInnerHTML={{
                            __html: `
                                @page { size: A4; margin: 12mm; }
                                html, body { background: #ffffff !important; color: #0f172a !important; }
                                .kalp-catalog-export-hint { display: none; }
                                @media print {
                                    a { color: #0f172a !important; text-decoration: none !important; }
                                    .kalp-catalog-export-hint { display: none !important; }
                                }
                            `,
                        }}
                    />
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                (function () {
                                  if (typeof window === 'undefined') return;
                                  window.setTimeout(function () {
                                    window.print();
                                  }, 220);
                                })();
                            `,
                        }}
                    />
                </>
            )}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </div>
    );
}
