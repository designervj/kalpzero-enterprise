'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, Home, LayoutDashboard, LogIn, Search, ShieldAlert, Wand2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { canRoleAccessAdminPath } from '@/lib/role-scope';

const ADMIN_ROUTE_PREFIXES = [
    '/admin',
    '/dashboard',
    '/pages',
    '/front-builder',
    '/settings',
    '/discover/qa',
    '/users',
    '/tenants',
    '/terminal',
    '/ecommerce',
    '/marketing',
    '/forms',
];

function isAdminWorkspacePath(pathname: string): boolean {
    return ADMIN_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default function NotFound() {
    const pathname = usePathname() || '/';
    const authCtx = useAuth();
    const isAuthenticated = Boolean(authCtx.user);
    const isAdminPath = isAdminWorkspacePath(pathname);
    const canAccessPath = isAuthenticated ? canRoleAccessAdminPath(authCtx.currentProfile, pathname) : false;
    const isRoutePermissionScoped = isAdminPath && isAuthenticated && !canAccessPath;

    return (
        <div className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-6 py-10">
            <div className="w-full rounded-2xl border border-slate-800 bg-slate-950/55 p-7 text-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300">
                    <AlertTriangle size={18} />
                </div>
                <h1 className="text-2xl font-semibold text-white">404 - Page not found</h1>
                <p className="mt-2 text-sm text-slate-400">
                    {isAdminPath
                        ? 'This workspace page is currently unavailable.'
                        : 'The page you requested does not exist or has moved.'}
                </p>
                <p className="mt-2 rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 font-mono text-xs text-slate-400">
                    Path: {pathname}
                </p>

                {isAdminPath && isAuthenticated && (
                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Technical Diagnostics</p>
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                            <li>Restart dashboard dev server and re-open this route (`apps/dashboard`).</li>
                            <li>Verify route build output includes this path (`npm --prefix apps/dashboard run build`).</li>
                            <li>Run route smoke check (`npm --prefix apps/dashboard run smoke:builder-discover`).</li>
                            {isRoutePermissionScoped && (
                                <li className="text-amber-300">Your current role view is scoped and cannot access this route.</li>
                            )}
                        </ul>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Link href="/dashboard" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                                <LayoutDashboard size={13} />
                                Dashboard
                            </Link>
                            <Link href="/pages" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                                <Home size={13} />
                                Website Pages
                            </Link>
                            <Link href="/front-builder" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                                <Wand2 size={13} />
                                Front Builder
                            </Link>
                            <Link href="/discover/search" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                                <Search size={13} />
                                Discover
                            </Link>
                        </div>
                    </div>
                )}

                {isAdminPath && !isAuthenticated && (
                    <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm text-slate-300">
                        <p className="mb-3">Sign in to access workspace routes.</p>
                        <Link href="/login" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                            <LogIn size={13} />
                            Go to login
                        </Link>
                    </div>
                )}

                {!isAdminPath && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        <Link href="/" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                            <Home size={13} />
                            Home
                        </Link>
                        <Link href="/discover" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                            <Search size={13} />
                            Discover
                        </Link>
                        <Link href="/claim" className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-3 py-1.5 text-xs hover:border-cyan-500/50">
                            <ShieldAlert size={13} />
                            Claim Listing
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
