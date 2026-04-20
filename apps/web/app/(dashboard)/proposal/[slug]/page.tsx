import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMasterDb, getTenantDb } from '@/lib/db';
import { RenderHtml } from '@/components/RenderHtml';
import { toAbsolutePublicUrl } from '@/lib/public-seo';

interface ProposalViewProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type TenantRecord = {
    key?: string;
    publicProfile?: { slug?: string };
};

type ProposalRecord = {
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
        return { tenantHint, proposalSlug: parts.join('--') };
    }
    return { tenantHint: '', proposalSlug: slug };
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

async function loadProposal(tenantKey: string, proposalSlug: string, preview: boolean): Promise<ProposalRecord | null> {
    const tenantDb = await getTenantDb(tenantKey);
    const query: Record<string, unknown> = { slug: proposalSlug };
    if (!preview) query.status = 'published';
    const proposal = await tenantDb.collection('proposals').findOne(query, {
        projection: { title: 1, slug: 1, content: 1, status: 1, seo: 1 },
    }) as ProposalRecord | null;
    return proposal ? JSON.parse(JSON.stringify(proposal)) : null;
}

export async function generateMetadata({ params, searchParams }: ProposalViewProps): Promise<Metadata> {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const { tenantHint, proposalSlug } = parseCombinedSlug(slug);
    const tenantParam = resolveQueryValue(resolvedSearchParams.tenant) || resolveQueryValue(resolvedSearchParams.t);
    const tenantKey = tenantParam || await resolveTenantKey(tenantHint);
    if (!tenantKey) return { title: 'Proposal Not Found', description: 'Proposal not available.' };

    const preview = resolveQueryValue(resolvedSearchParams.preview) === '1';
    const proposal = await loadProposal(tenantKey, proposalSlug, preview);
    if (!proposal) return { title: 'Proposal Not Found', description: 'Proposal not available.' };

    const metaTitle = proposal.seo?.metaTitle || proposal.title || proposalSlug;
    const metaDescription = proposal.seo?.metaDescription || stripHtml(typeof proposal.content === 'string' ? proposal.content : '').slice(0, 160);
    return {
        title: metaTitle,
        description: metaDescription,
        alternates: { canonical: `/proposal/${slug}` },
    };
}

export default async function ProposalViewPage({ params, searchParams }: ProposalViewProps) {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const { tenantHint, proposalSlug } = parseCombinedSlug(slug);
    const tenantParam = resolveQueryValue(resolvedSearchParams.tenant) || resolveQueryValue(resolvedSearchParams.t);
    const tenantKey = tenantParam || await resolveTenantKey(tenantHint);
    if (!tenantKey) notFound();

    const preview = resolveQueryValue(resolvedSearchParams.preview) === '1';
    const proposal = await loadProposal(tenantKey, proposalSlug, preview);
    if (!proposal) notFound();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: proposal.seo?.metaTitle || proposal.title || proposalSlug,
        url: toAbsolutePublicUrl(`/proposal/${slug}`),
        description: proposal.seo?.metaDescription || stripHtml(typeof proposal.content === 'string' ? proposal.content : '').slice(0, 160),
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-100">
            {preview && (
                <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-amber-200">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.3em]">Proposal Preview</p>
                        <Link
                            href={`/proposal-builder?slug=${encodeURIComponent(proposalSlug)}`}
                            className="inline-flex items-center rounded-md border border-amber-300/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:border-amber-200"
                        >
                            Open Proposal Builder
                        </Link>
                    </div>
                </div>
            )}
            <main className="mx-auto max-w-5xl px-6 py-10">
                <RenderHtml html={typeof proposal.content === 'string' ? proposal.content : ''} />
            </main>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </div>
    );
}
