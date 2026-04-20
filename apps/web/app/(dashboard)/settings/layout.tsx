'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
    Shield, Building2, UserCircle, Palette,
    LayoutDashboard,
    Settings, Users, Database, Globe, BarChart3, ChevronRight
} from 'lucide-react';
import { canRoleAccessAdminPath } from '@/lib/role-scope';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';

interface ControlCenterGroup {
    title: string;
    items: ControlCenterItem[];
}

interface ControlCenterItem {
    href: string;
    label: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { currentProfile, user } = useAuth();
  console.log("currentProfile----",currentProfile)
    // We treat "/settings" as the hub. The children prop handles actual settings page renders.
    // So if pathname === '/settings', we render the dashboard grid. Otherwise we just render children.
    const isHubView = pathname === '/settings';
    const isStandaloneSettingsPage = pathname === '/settings/export';
    const {authUser}= useSelector((state:RootState)=>state.auth)
    // Role-based visibility checks
    const canSeeTenant = canRoleAccessAdminPath(authUser?.role??"", '/settings/tenant');
    const canSeePlatform = canRoleAccessAdminPath(authUser?.role??"", '/settings/platform');
    const canSeeAdminTheme = canRoleAccessAdminPath(authUser?.role??"", '/settings/admin-theme');
    const canSeeAdminWorkspace = canRoleAccessAdminPath(authUser?.role??"", '/settings/admin-workspace');
    const canSeeUser = canRoleAccessAdminPath(authUser?.role??"", '/settings/user');
    const canSeeUsersList = canRoleAccessAdminPath(authUser?.role??"", '/users');
    const canSeeTenantsList = canRoleAccessAdminPath(authUser?.role??"", '/tenants');
    const canSeeAgenciesList = canRoleAccessAdminPath(authUser?.role??"", '/admin/agencies');
    const canSeeAgencySettings = canRoleAccessAdminPath(authUser?.role??"", '/settings/agency');
    const canSeeSystemRegistry = canRoleAccessAdminPath(authUser?.role??"", '/admin/registry');
    const canSeeTenantResources = canRoleAccessAdminPath(authUser?.role??"", '/tenant/resources');
    const canSeeAgencyResources = canRoleAccessAdminPath(authUser?.role??"", '/agency/resources');
    const hasDedicatedWorkspace = user?.provisioningMode === 'full_tenant';


    console.log("canSeeTenant",canSeeTenant)
    console.log("canSeePlatform",canSeePlatform)
    // Setup the groups per the PRD
    const groups: ControlCenterGroup[] = [

        {
            title: "General",
            items: [
                ...(canSeeTenant ? [{ href: '/settings/tenant', label: 'Business Settings', description: 'Manage brand, public profile, and integrations', icon: <Building2 size={24} />, colorClass: 'text-cyan-400' }] : []),
                ...(canSeeAgencySettings ? [{ href: '/settings/agency', label: 'Agency Settings', description: 'Manage your agency domain and routing modes', icon: <Globe size={24} />, colorClass: 'text-indigo-400' }] : []),
                ...(canSeeUser ? [{ href: '/settings/user', label: 'User Preferences', description: 'Manage your personal account profile and security', icon: <UserCircle size={24} />, colorClass: 'text-emerald-400' }] : []),
            ]
        },
        {
            title: "Configuration",
            items: [
                ...(canSeePlatform ? [{ href: '/settings/platform', label: 'Access Control', description: 'Platform level features, plans, and capabilities', icon: <Shield size={24} />, colorClass: 'text-purple-400' }] : []),
                ...(canSeeUsersList ? [{ href: '/users', label: 'Members & Roles', description: 'Manage directory, permissions, and service accounts', icon: <Users size={24} />, colorClass: 'text-blue-400' }] : []),
                ...(canSeeTenantsList ? [{ href: '/tenants', label: 'Business Directory', description: 'Manage business nodes across the platform', icon: <Database size={24} />, colorClass: 'text-sky-400' }] : []),
                ...(canSeeAgenciesList ? [{ href: '/admin/agencies', label: 'Agency Directory', description: 'Governance for sub-agencies and infrastructure', icon: <Building2 size={24} />, colorClass: 'text-violet-400' }] : []),
                ...(canSeeSystemRegistry ? [{ href: '/admin/registry', label: 'System Registry', description: 'Manage canonical collections and platform versions', icon: <Database size={24} />, colorClass: 'text-rose-400' }] : []),
            ]
        },
        {
            title: "Personalization",
            items: [
                ...(canSeeAdminTheme ? [{ href: '/settings/admin-theme', label: 'Admin Appearance', description: 'Customize the backend theme for your ecosystem', icon: <Palette size={24} />, colorClass: 'text-amber-400' }] : []),
                ...(canSeeAdminWorkspace && hasDedicatedWorkspace ? [{ href: '/settings/admin-workspace', label: 'Workspace Customization', description: 'Control sidebar labels, dashboard cards, widgets, and home layout', icon: <LayoutDashboard size={24} />, colorClass: 'text-cyan-400' }] : []),
                ...(canSeeAgencyResources ? [{ href: '/agency/resources', label: 'Agency Resources', description: 'View aggregate resource usage for your agency', icon: <BarChart3 size={24} />, colorClass: 'text-fuchsia-400' }] : []),
                ...(!canSeeAgencyResources && canSeeTenantResources ? [{ href: '/tenant/resources', label: 'Business Resources', description: 'View resource usage limits and metrics', icon: <BarChart3 size={24} />, colorClass: 'text-fuchsia-400' }] : []),
            ]
        }
    ].filter(g => g.items.length > 0);

    // Standard redirect handling if the user lands on a bad path directly
    useEffect(() => {
        if (!isHubView && !canRoleAccessAdminPath(currentProfile, pathname)) {
            router.replace('/settings');
        }
    }, [currentProfile, pathname, router, isHubView]);

    if (isStandaloneSettingsPage) {
        return (
            <div className="max-w-7xl mx-auto mt-6 relative z-10 animate-in fade-in duration-500">
                {children}
            </div>
        );
    }

    if (!isHubView) {
        return (
            <div className="max-w-6xl mx-auto space-y-6 mt-4 relative z-10 animate-in fade-in duration-300">
                <nav className="flex items-center text-sm font-medium text-slate-500 mb-6 px-2">
                    <Link href="/settings" className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5">
                        <Settings size={14} /> Control Center
                    </Link>
                    <ChevronRight size={14} className="mx-2 text-slate-600" />
                    <span className="text-slate-300">Active Settings</span>
                </nav>
                <div className="relative min-h-[400px]">
                    {children}
                </div>
            </div>
        );
    }


    console.log("groups--",groups)
    return (
        <div className="max-w-6xl mx-auto space-y-8 mt-6 relative z-10 animate-in fade-in duration-500">
            <header className="px-2">
                <h2 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
                    Control <span className="text-cyan-400">Center</span>
                </h2>
                <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">
                    Manage configuration, business profiles, and ecosystem settings. Access is governed by your active Role.
                </p>
            </header>

            <div className="space-y-10">
                {groups.map((group, idx) => (
                    <div key={idx} className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 px-2 flex items-center gap-3">
                            {group.title}
                            <div className="h-px flex-1 bg-slate-800/60 mt-1"></div>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="p-5 flex flex-col gap-3 rounded-xl bg-slate-900/40 border border-slate-800/80 hover:bg-slate-800/80 hover:border-slate-700 transition-all duration-300 group shadow-sm hover:shadow-md"
                                >
                                    <div className={`p-2.5 rounded-lg bg-slate-950/50 w-fit ring-1 ring-slate-800/50 group-hover:scale-110 transition-transform ${item.colorClass}`}>
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors">
                                            {item.label}
                                        </h4>
                                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed group-hover:text-slate-400 transition-colors">
                                            {item.description}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
