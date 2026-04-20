'use client';

import { useState, useEffect } from 'react';
import { Truck, Package, Clock, CheckCircle2, AlertCircle, DollarSign } from 'lucide-react';

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        const params = statusFilter ? `?status=${statusFilter}` : '';
        fetch(`/api/ecommerce/orders${params}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setOrders(data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [statusFilter]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const processingCount = orders.filter(o => o.status === 'processing').length;

    const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
        pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
        processing: { icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
        delivered: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
        cancelled: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' },
    };

    const paymentColors: Record<string, string> = {
        paid: 'text-emerald-400',
        awaiting: 'text-amber-400',
        failed: 'text-rose-400',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                    <Truck size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Orders Dashboard</h2>
                    <p className="text-slate-400 text-xs font-mono">Track and manage customer orders</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-emerald-400" /><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Total Revenue</span></div>
                    <div className="text-2xl font-black text-emerald-400">${totalRevenue.toFixed(2)}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-amber-400" /><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Pending</span></div>
                    <div className="text-2xl font-black text-amber-400">{pendingCount}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><Package size={16} className="text-cyan-400" /><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Processing</span></div>
                    <div className="text-2xl font-black text-cyan-400">{processingCount}</div>
                </div>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2">
                {['', 'pending', 'processing', 'delivered', 'cancelled'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No orders found.</div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => {
                        const cfg = statusConfig[order.status] || statusConfig.pending;
                        const StatusIcon = cfg.icon;
                        return (
                            <div key={order._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${cfg.bg}`}>
                                            <StatusIcon size={18} className={cfg.color} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm">{order.orderNumber}</div>
                                            <div className="text-xs text-slate-500">{order.customer?.name} • {order.customer?.email}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-black text-white">${order.total?.toFixed(2)}</div>
                                        <div className={`text-[10px] uppercase tracking-widest font-bold ${paymentColors[order.paymentStatus] || 'text-slate-400'}`}>
                                            {order.paymentStatus}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {order.items?.map((item: any, i: number) => (
                                        <div key={i} className="bg-black/30 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                                            <span className="text-white font-medium">{item.productName}</span>
                                            {item.variant && <span className="text-slate-500 ml-1">({item.variant})</span>}
                                            <span className="text-slate-500 ml-1">×{item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-[10px] text-slate-600 font-mono">
                                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
