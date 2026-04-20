import { getTenantDb } from '@/lib/db';
import { cookies } from 'next/headers';
import { PortfolioClient } from './PortfolioClient';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage() {
    const cookieStore = await cookies();
    const activeTenantKey = cookieStore.get('kalp_active_tenant')?.value || 'demo';

    const db = await getTenantDb(activeTenantKey);
    const portfolioCol = db.collection('portfolio_items');
    const rawItems = await portfolioCol.find({}).sort({ createdAt: -1 }).toArray();
    const serializedItems = JSON.parse(JSON.stringify(rawItems));

    return <PortfolioClient items={serializedItems} />;
}
