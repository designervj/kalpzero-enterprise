'use client';

import { useState, useEffect } from 'react';
import { Receipt, Plus, Clock, CheckCircle2, AlertCircle, Send, DollarSign, Calendar, Pencil, Trash2, X, Save } from 'lucide-react';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ customerName: '', customerEmail: '', total: '', status: 'draft', dueDate: '', notes: '' });

    const fetchInvoices = () => {
        setLoading(true);
        const params = statusFilter ? `?status=${statusFilter}` : '';
        fetch(`/api/invoices${params}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setInvoices(data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchInvoices(); }, [statusFilter]);

    const resetForm = () => { setForm({ customerName: '', customerEmail: '', total: '', status: 'draft', dueDate: '', notes: '' }); setEditingId(null); setShowForm(false); };

    const handleSubmit = async () => {
        const payload = {
            customer: { name: form.customerName, email: form.customerEmail },
            total: parseFloat(form.total) || 0,
            status: form.status,
            dueDate: form.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
            notes: form.notes,
        };
        if (editingId) {
            await fetch(`/api/invoices/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        resetForm();
        fetchInvoices();
    };

    const handleEdit = (inv: any) => {
        setForm({
            customerName: inv.customer?.name || '', customerEmail: inv.customer?.email || '',
            total: String(inv.total || 0), status: inv.status || 'draft',
            dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
            notes: inv.notes || '',
        });
        setEditingId(inv._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this invoice?')) return;
        await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
        fetchInvoices();
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
        fetchInvoices();
    };

    const totalOutstanding = invoices.filter(i => i.status !== 'paid').reduce((s, i) => s + (i.total || 0), 0);
    const paidTotal = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total || 0), 0);

    const statusConfig: Record<string, { icon: any; color: string; bg: string }> = {
        draft: { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' },
        sent: { icon: Send, color: 'text-cyan-400', bg: 'bg-cyan-500/20 border-cyan-500/30' },
        paid: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
        overdue: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/30' },
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Receipt size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Invoicing</h2>
                        <p className="text-slate-400 text-xs font-mono">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 bg-cyan-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                    <Plus size={16} /> New Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-emerald-400" /><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Paid</span></div>
                    <div className="text-2xl font-black text-emerald-400">${paidTotal.toFixed(2)}</div>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-2"><AlertCircle size={16} className="text-amber-400" /><span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Outstanding</span></div>
                    <div className="text-2xl font-black text-amber-400">${totalOutstanding.toFixed(2)}</div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white font-bold">{editingId ? 'Edit Invoice' : 'Create New Invoice'}</h3>
                        <button onClick={resetForm} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Customer Name</label>
                            <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" placeholder="Acme Corp" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Customer Email</label>
                            <input type="email" value={form.customerEmail} onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" placeholder="billing@acme.com" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Total ($)</label>
                            <input type="number" value={form.total} onChange={e => setForm({ ...form, total: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" placeholder="0.00" />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Due Date</label>
                            <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Notes</label>
                            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 resize-none" placeholder="Additional notes..." />
                        </div>
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-1">Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700/80 rounded-lg px-3 py-2 text-white text-sm focus:outline-none appearance-none cursor-pointer">
                                <option value="draft">Draft</option>
                                <option value="sent">Sent</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSubmit}
                        className="flex items-center gap-2 bg-emerald-500 text-black px-5 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all">
                        <Save size={14} /> {editingId ? 'Update Invoice' : 'Create Invoice'}
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'draft', 'sent', 'paid', 'overdue'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Invoice List */}
            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
            ) : invoices.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No invoices found. Create your first invoice!</div>
            ) : (
                <div className="space-y-4">
                    {invoices.map(inv => {
                        const cfg = statusConfig[inv.status] || statusConfig.draft;
                        const StatusIcon = cfg.icon;
                        return (
                            <div key={inv._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${cfg.bg}`}>
                                            <StatusIcon size={18} className={cfg.color} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-sm font-mono">{inv.invoiceNumber}</div>
                                            <div className="text-xs text-slate-500">{inv.customer?.name} • {inv.customer?.email || ''}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-lg font-black text-white">${inv.total?.toFixed(2)}</div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                                <Calendar size={10} />
                                                Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {inv.status === 'draft' && (
                                                <button onClick={() => handleStatusChange(inv._id, 'sent')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors" title="Mark as Sent">
                                                    <Send size={14} />
                                                </button>
                                            )}
                                            {inv.status === 'sent' && (
                                                <button onClick={() => handleStatusChange(inv._id, 'paid')} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors" title="Mark as Paid">
                                                    <CheckCircle2 size={14} />
                                                </button>
                                            )}
                                            <button onClick={() => handleEdit(inv)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors" title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(inv._id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {inv.items?.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {inv.items.map((item: any, i: number) => (
                                            <span key={i} className="bg-black/30 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                                                {item.description} <span className="text-slate-500">×{item.qty}</span> <span className="text-emerald-400 ml-1">${item.price?.toFixed(2)}</span>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
