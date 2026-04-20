'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Pencil, Trash2, X, Save } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { canRoleMutateUi } from '@/lib/role-scope';

export default function BlogPage() {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ title: '', content: '', category: 'General', tags: '', status: 'published' });

    const fetchPosts = () => {
        setLoading(true);
        const params = statusFilter ? `?status=${statusFilter}` : '';
        fetch(`/api/blog/posts${params}`)
            .then(res => res.json())
            .then(data => { if (Array.isArray(data)) setPosts(data); })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPosts(); }, [statusFilter]);

    const resetForm = () => { setForm({ title: '', content: '', category: 'General', tags: '', status: 'published' }); setEditingId(null); setShowForm(false); };

    const handleSubmit = async () => {
        if (!canMutate) return;
        if (!form.title.trim()) return;
        const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), excerpt: form.content.substring(0, 120) };
        if (editingId) {
            await fetch(`/api/blog/posts/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        } else {
            await fetch('/api/blog/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        }
        resetForm();
        fetchPosts();
    };

    const handleEdit = (post: any) => {
        if (!canMutate) return;
        setForm({ title: post.title, content: post.content || '', category: post.category || 'General', tags: (post.tags || []).join(', '), status: post.status || 'published' });
        setEditingId(post._id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!canMutate) return;
        if (!confirm('Delete this blog post?')) return;
        await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' });
        fetchPosts();
    };

    const statusColors: Record<string, string> = {
        published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {!canMutate && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {isScopedRoleView ? 'Scoped role view is read-only. Switch role to create or edit posts.' : 'This role is read-only for blog mutations.'}
                </div>
            )}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Blog & Content</h2>
                        <p className="text-slate-400 text-xs font-mono">{posts.length} post{posts.length !== 1 ? 's' : ''} in this workspace</p>
                    </div>
                </div>
                <button onClick={() => { resetForm(); setShowForm(true); }}
                    disabled={!canMutate}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)]">
                    <Plus size={16} /> New Post
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-bold">{editingId ? 'Edit Post' : 'Create New Post'}</h3>
                        <button onClick={resetForm} className="text-slate-500 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Title</label>
                            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50" placeholder="My First Post" />
                        </div>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Category</label>
                                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none cursor-pointer appearance-none">
                                    <option value="General">General</option>
                                    <option value="Announcements">Announcements</option>
                                    <option value="Tutorials">Tutorials</option>
                                    <option value="Behind the Scenes">Behind the Scenes</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Tags (comma-separated)</label>
                                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50" placeholder="launch, update" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Content</label>
                            <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 min-h-[120px] resize-y" placeholder="Write your post content here..." />
                        </div>
                        <div className="w-32">
                            <label className="block text-xs uppercase tracking-widest text-slate-500 font-semibold mb-2">Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                                className="w-full bg-black/50 border border-slate-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none cursor-pointer appearance-none">
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>
                    </div>
                    <button onClick={handleSubmit}
                        disabled={!canMutate}
                        className="flex items-center gap-2 bg-emerald-500 text-black px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-all">
                        <Save size={14} /> {editingId ? 'Update Post' : 'Publish Post'}
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'published', 'draft'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${statusFilter === s ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:border-slate-600'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {/* Posts */}
            {loading ? (
                <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-sm">No blog posts found. Create your first post!</div>
            ) : (
                <div className="space-y-4">
                    {posts.map(post => (
                        <div key={post._id} className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-white text-lg group-hover:text-cyan-400 transition-colors">{post.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Calendar size={12} /> {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                        <span>by {post.author || 'Admin'}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold border ${statusColors[post.status] || statusColors.draft}`}>{post.status}</span>
                                    {canMutate && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(post)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors" title="Edit">
                                                <Pencil size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(post._id)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors" title="Delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <p className="text-sm text-slate-400 line-clamp-2 mb-3">{post.excerpt || post.content?.substring(0, 150)}</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-slate-800/80 text-slate-400 rounded text-[10px] font-mono border border-slate-700">{post.category}</span>
                                {post.tags?.slice(0, 4).map((tag: string) => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 rounded text-[9px] font-mono border border-cyan-500/20">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
