import type { Metadata } from "next";
import { headers } from "next/headers";
import { RuntimeSite } from "../../../components/runtime-site";
import { isTenantHostRequest } from "../../../lib/public-hosts";
import { getPublicSitePayload } from "../../../lib/runtime-publishing";

export const dynamic = "force-dynamic";

interface TenantSitePageProps {
  params: Promise<{
    tenantSlug: string;
    pageSlug?: string[];
  }>;
}

function resolvePageSlug(pageSlug: string[] | undefined) {
  return pageSlug && pageSlug.length > 0 ? pageSlug.join("/") : "home";
}

export async function generateMetadata({ params }: TenantSitePageProps): Promise<Metadata> {
  const { tenantSlug, pageSlug } = await params;
  const payload = await getPublicSitePayload(tenantSlug, resolvePageSlug(pageSlug));

  return {
    title: payload.page.seoTitle ?? payload.page.title,
    description: payload.page.seoDescription
  };
}

export default async function TenantSitePage({ params }: TenantSitePageProps) {
  const { tenantSlug, pageSlug } = await params;
  const host = (await headers()).get("host");
  const payload = await getPublicSitePayload(tenantSlug, resolvePageSlug(pageSlug));

  return <RuntimeSite site={payload} hostMode={isTenantHostRequest(host)} />;
}
