import { Db } from 'mongodb';
import { getTenantDb } from './db';

const AI_WINDOW_DAYS = 30;

export interface UsageTotals {
    dbDataBytes: number;
    dbStorageBytes: number;
    storageBytes: number;
    mediaCount: number;
    aiMessages30d: number;
    aiSessions30d: number;
}

export interface UsageAlert {
    level: 'warning' | 'critical';
    key: string;
    message: string;
}

export interface TenantUsageSnapshot {
    tenantKey: string;
    tenantName: string;
    agencyId: string | null;
    usage: UsageTotals;
    limits: {
        storageLimitBytes: number | null;
    };
    alerts: UsageAlert[];
}

export interface UsageTrendPoint {
    date: string;
    aiMessages: number;
    aiSessions: number;
    mediaAddedBytes: number;
    cumulativeMediaBytes: number;
    dbDataBytes: number;
    dbStorageBytes: number;
}

export interface UsageTrendSeries {
    days: number;
    source: 'observed' | 'estimated' | 'mixed';
    points: UsageTrendPoint[];
}

function emptyTotals(): UsageTotals {
    return {
        dbDataBytes: 0,
        dbStorageBytes: 0,
        storageBytes: 0,
        mediaCount: 0,
        aiMessages30d: 0,
        aiSessions30d: 0,
    };
}

function normalizeCount(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function buildDayKeys(days: number): string[] {
    const count = Math.max(1, Math.floor(days));
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (count - 1));
    const keys: string[] = [];
    for (let i = 0; i < count; i += 1) {
        const cursor = new Date(start);
        cursor.setUTCDate(start.getUTCDate() + i);
        keys.push(getDayKey(cursor));
    }
    return keys;
}

function addTotals(base: UsageTotals, next: UsageTotals): UsageTotals {
    return {
        dbDataBytes: base.dbDataBytes + next.dbDataBytes,
        dbStorageBytes: base.dbStorageBytes + next.dbStorageBytes,
        storageBytes: base.storageBytes + next.storageBytes,
        mediaCount: base.mediaCount + next.mediaCount,
        aiMessages30d: base.aiMessages30d + next.aiMessages30d,
        aiSessions30d: base.aiSessions30d + next.aiSessions30d,
    };
}

async function fetchDbUsageStats(db: Db): Promise<{ dataSize: number; storageSize: number }> {
    const rawStats = await db.stats();
    return {
        dataSize: normalizeCount(rawStats?.dataSize),
        storageSize: normalizeCount(rawStats?.storageSize),
    };
}

export async function collectTenantUsageSnapshot(input: {
    tenantKey: string;
    tenantName?: string;
    agencyId?: string | null;
    storageLimitMB?: number | null;
}): Promise<TenantUsageSnapshot> {
    const tenantName = input.tenantName?.trim() || input.tenantKey;
    const storageLimitBytes = Number.isFinite(Number(input.storageLimitMB))
        ? Math.max(0, Number(input.storageLimitMB)) * 1024 * 1024
        : null;
    const alerts: UsageAlert[] = [];

    try {
        const tenantDb = await getTenantDb(input.tenantKey);
        const aiWindowStart = new Date(Date.now() - AI_WINDOW_DAYS * 24 * 60 * 60 * 1000);

        const [dbUsage, mediaAgg, aiMessages30d, aiSessions30d] = await Promise.all([
            fetchDbUsageStats(tenantDb),
            tenantDb.collection('media').aggregate([{ $group: { _id: null, totalBytes: { $sum: '$size' }, count: { $sum: 1 } } }]).toArray(),
            tenantDb.collection('ai_messages').countDocuments({ createdAt: { $gte: aiWindowStart } }),
            tenantDb.collection('ai_interactions').countDocuments({ createdAt: { $gte: aiWindowStart } }),
        ]);

        const mediaRow = mediaAgg[0] || {};
        const storageBytes = normalizeCount((mediaRow as Record<string, unknown>).totalBytes);
        const mediaCount = normalizeCount((mediaRow as Record<string, unknown>).count);

        if (storageLimitBytes && storageLimitBytes > 0) {
            const ratio = storageBytes / storageLimitBytes;
            if (ratio >= 1) {
                alerts.push({
                    level: 'critical',
                    key: 'storage_limit',
                    message: 'Storage usage is above configured limit.',
                });
            } else if (ratio >= 0.8) {
                alerts.push({
                    level: 'warning',
                    key: 'storage_limit',
                    message: 'Storage usage crossed 80% of configured limit.',
                });
            }
        }

        return {
            tenantKey: input.tenantKey,
            tenantName,
            agencyId: input.agencyId || null,
            usage: {
                dbDataBytes: dbUsage.dataSize,
                dbStorageBytes: dbUsage.storageSize,
                storageBytes,
                mediaCount,
                aiMessages30d: normalizeCount(aiMessages30d),
                aiSessions30d: normalizeCount(aiSessions30d),
            },
            limits: { storageLimitBytes },
            alerts,
        };
    } catch (error: unknown) {
        alerts.push({
            level: 'warning',
            key: 'usage_probe',
            message: error instanceof Error ? error.message : 'Unable to resolve tenant resource usage.',
        });
        return {
            tenantKey: input.tenantKey,
            tenantName,
            agencyId: input.agencyId || null,
            usage: emptyTotals(),
            limits: { storageLimitBytes },
            alerts,
        };
    }
}

export function aggregateTenantUsage(tenants: TenantUsageSnapshot[]): {
    totals: UsageTotals;
    warningCount: number;
    criticalCount: number;
} {
    return tenants.reduce(
        (acc, tenant) => {
            acc.totals = addTotals(acc.totals, tenant.usage);
            for (const alert of tenant.alerts) {
                if (alert.level === 'critical') acc.criticalCount += 1;
                if (alert.level === 'warning') acc.warningCount += 1;
            }
            return acc;
        },
        {
            totals: emptyTotals(),
            warningCount: 0,
            criticalCount: 0,
        }
    );
}

function normalizeTrendMap(input: Array<{ _id?: unknown; count?: unknown; totalBytes?: unknown }>, key: 'count' | 'totalBytes'): Map<string, number> {
    const map = new Map<string, number>();
    for (const row of input) {
        const day = typeof row._id === 'string' ? row._id : '';
        if (!day) continue;
        if (key === 'count') {
            map.set(day, normalizeCount(row.count));
            continue;
        }
        map.set(day, normalizeCount(row.totalBytes));
    }
    return map;
}

export async function collectTenantTrendSeries(input: {
    tenantKey: string;
    days: number;
    usageSnapshot?: UsageTotals | null;
}): Promise<UsageTrendSeries> {
    const days = Math.max(1, Math.floor(input.days));
    const dayKeys = buildDayKeys(days);
    const startDate = new Date(`${dayKeys[0]}T00:00:00.000Z`);
    const usageSnapshot = input.usageSnapshot || null;

    const fallbackDbData = normalizeCount(usageSnapshot?.dbDataBytes);
    const fallbackDbStorage = normalizeCount(usageSnapshot?.dbStorageBytes);
    const currentStorageBytes = normalizeCount(usageSnapshot?.storageBytes);

    try {
        const tenantDb = await getTenantDb(input.tenantKey);
        const [aiMessageRows, aiSessionRows, mediaRows] = await Promise.all([
            tenantDb.collection('ai_messages').aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            ]).toArray(),
            tenantDb.collection('ai_interactions').aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            ]).toArray(),
            tenantDb.collection('media').aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, totalBytes: { $sum: '$size' } } },
            ]).toArray(),
        ]);

        const aiMessageByDay = normalizeTrendMap(aiMessageRows as Array<{ _id?: unknown; count?: unknown }>, 'count');
        const aiSessionByDay = normalizeTrendMap(aiSessionRows as Array<{ _id?: unknown; count?: unknown }>, 'count');
        const mediaByDay = normalizeTrendMap(mediaRows as Array<{ _id?: unknown; totalBytes?: unknown }>, 'totalBytes');

        const totalMediaAddsInWindow = dayKeys.reduce((acc, day) => acc + normalizeCount(mediaByDay.get(day)), 0);
        const estimatedWindowBase = Math.max(0, currentStorageBytes - totalMediaAddsInWindow);
        let cumulativeMedia = estimatedWindowBase;

        const points: UsageTrendPoint[] = dayKeys.map((day) => {
            const mediaAddedBytes = normalizeCount(mediaByDay.get(day));
            cumulativeMedia += mediaAddedBytes;
            return {
                date: day,
                aiMessages: normalizeCount(aiMessageByDay.get(day)),
                aiSessions: normalizeCount(aiSessionByDay.get(day)),
                mediaAddedBytes,
                cumulativeMediaBytes: cumulativeMedia,
                dbDataBytes: fallbackDbData,
                dbStorageBytes: fallbackDbStorage,
            };
        });

        const hasObservedAi = points.some((point) => point.aiMessages > 0 || point.aiSessions > 0);
        const hasObservedMedia = points.some((point) => point.mediaAddedBytes > 0);
        return {
            days,
            source: hasObservedAi || hasObservedMedia ? 'observed' : 'estimated',
            points,
        };
    } catch {
        const points: UsageTrendPoint[] = dayKeys.map((day) => ({
            date: day,
            aiMessages: 0,
            aiSessions: 0,
            mediaAddedBytes: 0,
            cumulativeMediaBytes: currentStorageBytes,
            dbDataBytes: fallbackDbData,
            dbStorageBytes: fallbackDbStorage,
        }));
        return {
            days,
            source: 'estimated',
            points,
        };
    }
}

export function aggregateTrendSeries(input: {
    seriesList: UsageTrendSeries[];
    days: number;
}): UsageTrendSeries {
    const days = Math.max(1, Math.floor(input.days));
    const dayKeys = buildDayKeys(days);
    const pointsByDay = new Map<string, UsageTrendPoint>();
    dayKeys.forEach((day) => {
        pointsByDay.set(day, {
            date: day,
            aiMessages: 0,
            aiSessions: 0,
            mediaAddedBytes: 0,
            cumulativeMediaBytes: 0,
            dbDataBytes: 0,
            dbStorageBytes: 0,
        });
    });

    let observedCount = 0;
    for (const series of input.seriesList) {
        if (!series?.points?.length) continue;
        if (series.source === 'observed' || series.source === 'mixed') observedCount += 1;
        for (const point of series.points) {
            const existing = pointsByDay.get(point.date);
            if (!existing) continue;
            existing.aiMessages += normalizeCount(point.aiMessages);
            existing.aiSessions += normalizeCount(point.aiSessions);
            existing.mediaAddedBytes += normalizeCount(point.mediaAddedBytes);
            existing.cumulativeMediaBytes += normalizeCount(point.cumulativeMediaBytes);
            existing.dbDataBytes += normalizeCount(point.dbDataBytes);
            existing.dbStorageBytes += normalizeCount(point.dbStorageBytes);
        }
    }

    const source: UsageTrendSeries['source'] = observedCount === 0
        ? 'estimated'
        : observedCount === input.seriesList.length
            ? 'observed'
            : 'mixed';

    return {
        days,
        source,
        points: dayKeys.map((day) => pointsByDay.get(day) as UsageTrendPoint),
    };
}
