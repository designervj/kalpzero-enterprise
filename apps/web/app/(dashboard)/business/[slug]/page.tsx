import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BusinessProfileView } from '@/components/public/BusinessProfileView';
import { getPublicBusinessBySlug } from '@/lib/public-business';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

// export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
//     const { slug } = await params;
//     const profile = await getPublicBusinessBySlug(slug);
//     if (!profile) {
//         return {
//             title: 'Business Not Found',
//             description: 'This business profile is not available.',
//         };
//     }

//     return {
//         title: profile.seo.title,
//         description: profile.seo.description,
//         alternates: { canonical: `/${profile.publicProfile.slug || slug}` },
//     };
// }

export default async function BusinessPublicProfilePage({ params }: BusinessPageProps) {
    const { slug } = await params;
    const profile = await getPublicBusinessBySlug(slug);
    if (!profile) notFound();

    return <BusinessProfileView profile={profile} canonicalPath={`/${profile.publicProfile.slug || slug}`} />;
}
