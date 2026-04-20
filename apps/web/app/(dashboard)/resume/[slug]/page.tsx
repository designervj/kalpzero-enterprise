import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getMasterDb, getTenantDb } from '@/lib/db';
import { RenderHtml } from '@/components/RenderHtml';
import { toAbsolutePublicUrl } from '@/lib/public-seo';

interface ResumeViewProps {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

type TenantRecord = {
    key?: string;
    publicProfile?: { slug?: string };
};

type ResumeRecord = {
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
        return { tenantHint, resumeSlug: parts.join('--') };
    }
    return { tenantHint: '', resumeSlug: slug };
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

async function loadResume(tenantKey: string, resumeSlug: string, preview: boolean): Promise<ResumeRecord | null> {
    const tenantDb = await getTenantDb(tenantKey);
    const query: Record<string, unknown> = { slug: resumeSlug };
    if (!preview) query.status = 'published';
    const resume = await tenantDb.collection('resumes').findOne(query, {
        projection: { title: 1, slug: 1, content: 1, status: 1, seo: 1 },
    }) as ResumeRecord | null;
    return resume ? JSON.parse(JSON.stringify(resume)) : null;
}

export async function generateMetadata({ params, searchParams }: ResumeViewProps): Promise<Metadata> {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const { tenantHint, resumeSlug } = parseCombinedSlug(slug);
    const tenantParam = resolveQueryValue(resolvedSearchParams.tenant) || resolveQueryValue(resolvedSearchParams.t);
    const tenantKey = tenantParam || await resolveTenantKey(tenantHint);
    if (!tenantKey) return { title: 'Resume Not Found', description: 'Resume not available.' };

    const preview = resolveQueryValue(resolvedSearchParams.preview) === '1';
    const resume = await loadResume(tenantKey, resumeSlug, preview);
    if (!resume) return { title: 'Resume Not Found', description: 'Resume not available.' };

    const metaTitle = resume.seo?.metaTitle || resume.title || resumeSlug;
    const metaDescription = resume.seo?.metaDescription || stripHtml(typeof resume.content === 'string' ? resume.content : '').slice(0, 160);
    return {
        title: metaTitle,
        description: metaDescription,
        alternates: { canonical: `/resume/${slug}` },
    };
}

export default async function ResumeViewPage({ params, searchParams }: ResumeViewProps) {
    const { slug } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const { tenantHint, resumeSlug } = parseCombinedSlug(slug);
    const tenantParam = resolveQueryValue(resolvedSearchParams.tenant) || resolveQueryValue(resolvedSearchParams.t);
    const tenantKey = tenantParam || await resolveTenantKey(tenantHint);
    if (!tenantKey) notFound();

    const preview = resolveQueryValue(resolvedSearchParams.preview) === '1';
    const resume = await loadResume(tenantKey, resumeSlug, preview);
    if (!resume) notFound();

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: resume.seo?.metaTitle || resume.title || resumeSlug,
        url: toAbsolutePublicUrl(`/resume/${slug}`),
        description: resume.seo?.metaDescription || stripHtml(typeof resume.content === 'string' ? resume.content : '').slice(0, 160),
    };

    return (
        <div className="min-h-screen bg-[#030712] text-slate-100">
            {preview && (
                <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-amber-200">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.3em]">Resume Preview</p>
                        <Link
                            href={`/resume-builder?slug=${encodeURIComponent(resumeSlug)}`}
                            className="inline-flex items-center rounded-md border border-amber-300/40 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider hover:border-amber-200"
                        >
                            Open Resume Builder
                        </Link>
                    </div>
                </div>
            )}
            <main className="mx-auto max-w-6xl px-6 py-10">
                <RenderHtml html={typeof resume.content === 'string' ? resume.content : ''} />
            </main>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </div>
    );
}
