'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, MapPin, Workflow } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ResponseRecord = {
    _id: string;
    payload?: Record<string, unknown>;
    metadata?: {
        region?: string;
        surface?: string;
        country?: string;
        city?: string;
    };
    createdAt?: string;
};

type AnalyticsPoint = {
    key: string;
    count: number;
};

type FormAnalytics = {
    totalSubmissions?: number;
    submissionsLast7Days?: number;
    submissionsLast30Days?: number;
    lastSubmittedAt?: string | null;
    topRegions?: AnalyticsPoint[];
    topSurfaces?: AnalyticsPoint[];
};

export default function FormResponsesPage() {
    const params = useParams<{ id: string }>();
    const [formTitle, setFormTitle] = useState('Form Responses');
    const [responses, setResponses] = useState<ResponseRecord[]>([]);
    const [analytics, setAnalytics] = useState<FormAnalytics>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [surface, setSurface] = useState('');
    const [region, setRegion] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 50;

    const topRegion = useMemo(() => {
        const regions = Array.isArray(analytics.topRegions) ? analytics.topRegions : [];
        return regions.length > 0 ? `${regions[0].key} (${regions[0].count})` : 'N/A';
    }, [analytics.topRegions]);

    const topSurface = useMemo(() => {
        const surfaces = Array.isArray(analytics.topSurfaces) ? analytics.topSurfaces : [];
        return surfaces.length > 0 ? `${surfaces[0].key} (${surfaces[0].count})` : 'N/A';
    }, [analytics.topSurfaces]);

    useEffect(() => {
        const load = async () => {
            if (!params?.id) return;
            setLoading(true);
            try {
                const query = new URLSearchParams();
                query.set('page', String(page));
                query.set('pageSize', String(pageSize));
                if (search.trim()) query.set('search', search.trim());
                if (surface.trim()) query.set('surface', surface.trim());
                if (region.trim()) query.set('region', region.trim());
                if (fromDate) query.set('from', fromDate);
                if (toDate) query.set('to', toDate);

                const [formRes, respRes, analyticsRes] = await Promise.all([
                    fetch(`/api/forms/${params.id}`),
                    fetch(`/api/forms/${params.id}/responses?${query.toString()}`),
                    fetch(`/api/forms/${params.id}/analytics`),
                ]);

                if (formRes.ok) {
                    const formData = await formRes.json();
                    setFormTitle(formData?.title || 'Form Responses');
                }
                if (respRes.ok) {
                    const respData = await respRes.json();
                    if (Array.isArray(respData.items)) setResponses(respData.items);
                    setTotal(typeof respData.total === 'number' ? respData.total : 0);
                } else {
                    setResponses([]);
                    setTotal(0);
                }
                if (analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    setAnalytics(analyticsData || {});
                } else {
                    setAnalytics({});
                }
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [params?.id, page, search, surface, region, fromDate, toDate]);

    useEffect(() => {
        setPage(1);
    }, [search, surface, region, fromDate, toDate]);

    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <FileText size={22} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">{formTitle}</h2>
                    <p className="text-xs text-slate-500 font-mono">Responses + lifecycle analytics</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Total</div>
                    <div className="text-2xl font-bold text-white">{analytics.totalSubmissions || 0}</div>
                </div>
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40">
                    <div className="text-xs text-slate-500 uppercase tracking-widest">Last 7 Days</div>
                    <div className="text-2xl font-bold text-white">{analytics.submissionsLast7Days || 0}</div>
                </div>
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 flex items-center gap-2">
                    <MapPin size={16} className="text-emerald-400" />
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Top Region</div>
                        <div className="text-sm text-white">{topRegion}</div>
                    </div>
                </div>
                <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/40 flex items-center gap-2">
                    <Workflow size={16} className="text-cyan-400" />
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-widest">Top Surface</div>
                        <div className="text-sm text-white">{topSurface}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search responses..." />
                <Select value={surface} onChange={(event) => setSurface(event.target.value)}>
                    <option value="">All Surfaces</option>
                    <option value="website">Website</option>
                    <option value="landing">Landing</option>
                    <option value="checkout">Checkout</option>
                    <option value="manual">Manual</option>
                </Select>
                <Input value={region} onChange={(event) => setRegion(event.target.value)} placeholder="Region filter..." />
                <Input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                <Input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : responses.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No responses yet.</div>
            ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Summary</TableHead>
                                <TableHead>Surface</TableHead>
                                <TableHead>Region</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {responses.map((resp) => {
                                const payload = resp.payload || {};
                                const keys = Object.keys(payload);
                                const summary = keys.slice(0, 3).map((key) => `${key}: ${String(payload[key])}`).join(' · ');
                                return (
                                    <TableRow key={resp._id}>
                                        <TableCell className="text-xs text-slate-400">
                                            {resp.createdAt ? new Date(resp.createdAt).toLocaleString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-slate-300 text-sm">{summary || '—'}</TableCell>
                                        <TableCell>
                                            <Badge className="normal-case tracking-normal">{resp.metadata?.surface || 'unknown'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="normal-case tracking-normal">{resp.metadata?.region || resp.metadata?.country || 'N/A'}</Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}

            <div className="flex items-center justify-end gap-2">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>
                    Prev
                </Button>
                <div className="text-xs text-slate-500 font-mono">
                    Page {page} / {pageCount}
                </div>
                <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => setPage(prev => Math.min(pageCount, prev + 1))}>
                    Next
                </Button>
            </div>
        </div>
    );
}
