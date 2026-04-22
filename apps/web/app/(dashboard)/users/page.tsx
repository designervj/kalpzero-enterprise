'use client';

import { useCallback, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Users, Search, Plus, Shield, UserCheck, UserCog, Crown, Edit3, Trash2, Save, X, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/components/AuthProvider';
import { ScopedReadOnlyNotice } from '@/components/role/ScopedMutationBoundary';
import { canRoleMutateUi } from '@/lib/role-scope';
import { motion, Variants } from 'framer-motion';

type UserStatus = 'active' | 'invited' | 'disabled';

type UserRecord = {
    _id: string;
    name?: string;
    email?: string;
    role?: string;
    tenantKey?: string;
    status?: UserStatus;
    createdAt?: string;
};

type EditUserForm = {
    name: string;
    role: string;
    status: UserStatus;
    tenantKey: string;
};

type InviteUserForm = {
    name: string;
    email: string;
    role: string;
    tenantKey: string;
};

function parseApiError(value: unknown, fallback: string): string {
    if (typeof value === 'object' && value !== null && 'error' in value) {
        const err = (value as { error?: unknown }).error;
        if (typeof err === 'string' && err.trim()) return err;
    }
    return fallback;
}

export default function UsersPage() {
    const { currentProfile, isScopedRoleView } = useAuth();
    const canMutate = canRoleMutateUi(currentProfile);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState<InviteUserForm>({ name: '', email: '', role: 'staff', tenantKey: '' });
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<EditUserForm>({ name: '', role: 'staff', status: 'active', tenantKey: '' });
    const [sessionUser, setSessionUser] = useState<{ userId: string; role: string } | null>(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2200);
    };

    const fetchUsers = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (roleFilter) params.set('role', roleFilter);
        if (search) params.set('search', search);

        fetch(`/api/users?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setUsers(data as UserRecord[]);
                } else {
                    setUsers([]);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [roleFilter, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data?.authenticated && data?.user?.userId && data?.user?.role) {
                    setSessionUser({ userId: data.user.userId as string, role: data.user.role as string });
                }
            })
            .catch(console.error);
    }, []);

    useEffect(() => {
        if (!canMutate && showInvite) {
            setShowInvite(false);
        }
        if (!canMutate && editingUserId) {
            setEditingUserId(null);
        }
    }, [canMutate, showInvite, editingUserId]);

    const handleInvite = async () => {
        if (!canMutate) return;
        if (!inviteForm.name || !inviteForm.email) return;
        setError('');

        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inviteForm),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(parseApiError(data, 'Failed to invite user.'));
                return;
            }

            setInviteForm({ name: '', email: '', role: 'staff', tenantKey: '' });
            setShowInvite(false);
            showToast('User invited');
            fetchUsers();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to invite user.');
        }
    };

    const startEdit = (user: UserRecord) => {
        if (!canMutate) return;
        setEditingUserId(user._id);
        setEditForm({
            name: user.name || '',
            role: user.role || 'staff',
            status: user.status || 'active',
            tenantKey: user.tenantKey || '',
        });
        setError('');
    };

    const handleUpdate = async () => {
        if (!canMutate) return;
        if (!editingUserId) return;
        setSaving(true);
        setError('');
        try {
            const payload: Record<string, unknown> = {
                id: editingUserId,
                name: editForm.name,
                role: editForm.role,
                status: editForm.status,
            };
            if (sessionUser && ['platform_owner', 'platform_admin'].includes(sessionUser.role)) {
                payload.tenantKey = editForm.tenantKey;
            }

            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(parseApiError(data, 'Failed to update user.'));

            showToast('User updated');
            setEditingUserId(null);
            fetchUsers();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to update user.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: UserRecord) => {
        if (!canMutate) return;
        if (!confirm(`Delete user "${user.name || user.email || user._id}"?`)) return;
        setError('');
        try {
            const res = await fetch(`/api/users?id=${encodeURIComponent(user._id)}`, { method: 'DELETE' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(parseApiError(data, 'Failed to delete user.'));

            showToast('User deleted');
            fetchUsers();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Failed to delete user.');
        }
    };

    const roleOptions = (() => {
        if (sessionUser?.role === 'platform_owner') return ['platform_owner', 'platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'];
        if (sessionUser?.role === 'platform_admin') return ['platform_admin', 'tenant_owner', 'tenant_admin', 'staff', 'ai_agent', 'viewer'];
        return ['tenant_admin', 'staff', 'ai_agent', 'viewer'];
    })();

    const roleConfig: Record<string, { color: string; icon: LucideIcon; label: string }> = {
        platform_owner: { color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', icon: Crown, label: 'Platform Owner' },
        platform_admin: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Shield, label: 'Platform Admin' },
        tenant_owner: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: UserCog, label: 'Agency Admin' },
        tenant_admin: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: UserCheck, label: 'Tenant Admin' },
        staff: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: Users, label: 'Staff' },
        ai_agent: { color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: Bot, label: 'AI Agent' },
        viewer: { color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', icon: Shield, label: 'Viewer' },
    };

    const statusColors: Record<UserStatus, string> = {
        active: 'text-emerald-400',
        invited: 'text-amber-400',
        disabled: 'text-rose-400',
    };

    // Animation variants
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 mt-4 relative z-10">
            {toast && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold shadow-xl">
                    {toast}
                </div>
            )}
            
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="px-6 py-8 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                            <Users className="w-8 h-8 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-3">
                                User <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Directory</span>
                            </h2>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-2 text-base max-w-2xl leading-relaxed ml-1 font-medium">
                        {users.length} total active session{users.length !== 1 ? 's' : ''} across the workspace ecosystem.
                    </p>
                </div>

                {canMutate ? (
                    <Button 
                        onClick={() => setShowInvite(!showInvite)} 
                        className="bg-cyan-500 hover:bg-cyan-400 shadow-none text-slate-950 font-bold  rounded-xl px-5 h-12"
                    >
                        <Plus size={18} className="mr-2" /> Invite User
                    </Button>
                ) : null}
            </motion.header>

            <ScopedReadOnlyNotice
                visible={!canMutate && isScopedRoleView}
                message="Read-only scoped view is active. Invite/edit/delete actions are disabled for this role context."
            />

            {showInvite && canMutate && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-slate-900/40 backdrop-blur-md border border-cyan-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(34,211,238,0.05)] overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Plus size={18} className="text-cyan-400" /> New Invitation
                        </h3>
                        <button onClick={() => setShowInvite(false)} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    <div className="flex flex-wrap items-end gap-5">
                        <div className="flex-1 min-w-[200px]">
                            <Label className="mb-2 text-slate-400 font-semibold tracking-wide text-xs uppercase">Full Name</Label>
                            <Input type="text" value={inviteForm.name} onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                                placeholder="John Doe" className="bg-slate-950/50 border-slate-700 h-11 text-white focus:border-cyan-500/50" />
                        </div>
                        <div className="flex-1 min-w-[200px]">
                            <Label className="mb-2 text-slate-400 font-semibold tracking-wide text-xs uppercase">Email</Label>
                            <Input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                placeholder="user@example.com" className="bg-slate-950/50 border-slate-700 h-11 text-white focus:border-cyan-500/50" />
                        </div>
                        <div className="min-w-[150px]">
                            <Label className="mb-2 text-slate-400 font-semibold tracking-wide text-xs uppercase">Role</Label>
                            <Select value={inviteForm.role} onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}>
                                <option value="staff">Staff</option>
                                <option value="tenant_admin">Tenant Admin</option>
                                {sessionUser?.role === 'platform_owner' ? (
                                    <option value="tenant_owner">Agency Admin</option>
                                ) : null}
                                {sessionUser && ['platform_owner', 'platform_admin', 'tenant_owner'].includes(sessionUser.role) ? (
                                    <option value="ai_agent">AI Agent</option>
                                ) : null}
                            </Select>
                        </div>
                        <Button onClick={handleInvite} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500 hover:text-slate-950 h-11 px-8 rounded-xl transition-all">Send Invite</Button>
                    </div>
                </motion.div>
            )}

            {editingUserId && canMutate && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Edit User</h3>
                        <button onClick={() => setEditingUserId(null)} className="p-1.5 rounded hover:bg-slate-700 text-slate-400">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <Input
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            placeholder="Full name"
                        />
                        <Select
                            value={editForm.role}
                            onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                        >
                            {roleOptions.map(role => (
                                <option key={role} value={role}>{role.replace('_', ' ')}</option>
                            ))}
                        </Select>
                        <Select
                            value={editForm.status}
                            onChange={e => setEditForm({ ...editForm, status: e.target.value as UserStatus })}
                        >
                            <option value="active">active</option>
                            <option value="invited">invited</option>
                            <option value="disabled">disabled</option>
                        </Select>
                        {sessionUser && ['platform_owner', 'platform_admin'].includes(sessionUser.role) ? (
                            <Input
                                value={editForm.tenantKey}
                                onChange={e => setEditForm({ ...editForm, tenantKey: e.target.value })}
                                placeholder="tenant key"
                            />
                        ) : (
                            <div className="text-xs text-slate-500 flex items-center">Tenant scope fixed for non-platform roles.</div>
                        )}
                    </div>
                    {error && <div className="text-xs text-rose-400">{error}</div>}
                    <div className="flex justify-end gap-2">
                        <Button onClick={handleUpdate} disabled={saving} variant="default" size="sm">
                            <Save size={12} /> Save Changes
                        </Button>
                        <Button onClick={() => setEditingUserId(null)} variant="secondary" size="sm">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
            >
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row items-center gap-4 bg-slate-900/20 backdrop-blur-sm p-4 rounded-2xl border border-slate-800/50">
                    <div className="relative flex-1 w-full max-w-sm">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <Input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search directory..."
                            className="pl-11 bg-slate-950/50 border-slate-800 h-11 text-white focus:border-purple-500/40 rounded-xl" />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {['', 'platform_owner', 'tenant_admin', 'ai_agent', 'staff'].map(r => (
                            <Button key={r} onClick={() => setRoleFilter(r)} variant="secondary" size="sm"
                                className={`rounded-xl px-4 h-11 transition-all ${roleFilter === r ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800'}`}>
                                {r ? r.replace('_', ' ') : 'All'}
                            </Button>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-sm">No users found.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Tenant</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => {
                                const rc = roleConfig[u.role || 'staff'] || roleConfig.staff;
                                const RoleIcon = rc.icon;
                                return (
                                    <TableRow key={u._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {u.name?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white text-sm">{u.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{u.email}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`gap-1.5 ${rc.color}`}>
                                                <RoleIcon size={10} /> {rc.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-mono text-xs text-slate-400">{u.tenantKey}</TableCell>
                                        <TableCell>
                                            <Badge className={`normal-case tracking-normal ${statusColors[u.status || 'active'] || statusColors.active}`}>
                                                {u.status || 'active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {canMutate ? (
                                                    <>
                                                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-cyan-500/20 hover:text-cyan-400 text-slate-400" onClick={() => startEdit(u)} title="Edit user">
                                                            <Edit3 size={14} />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 text-slate-400" onClick={() => handleDelete(u)} title="Delete user">
                                                            <Trash2 size={14} />
                                                        </Button>
                                                    </>
                                                ) : null}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
                </motion.div>
            </motion.div>
        </div>
    );
}
