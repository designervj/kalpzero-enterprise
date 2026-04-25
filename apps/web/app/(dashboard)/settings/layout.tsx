'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
    Shield, Building2, UserCircle, Palette,
    LayoutDashboard,
    Settings, Users, Database, Globe, BarChart3, ChevronRight, Sparkles
} from 'lucide-react';
import { canRoleAccessAdminPath } from '@/lib/role-scope';
import { useSelector } from 'react-redux';
import { RootState } from '@/hook/store/store';
import { motion, Variants } from 'framer-motion';

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
    // const { currentProfile, user } = useAuth();

    const {authUser} = useSelector((state:RootState)=>state.auth)
    // We treat "/settings" as the hub. The children prop handles actual settings page renders.
    // So if pathname === '/settings', we render the dashboard grid. Otherwise we just render children.
    const isHubView = pathname === '/settings';
    const isStandaloneSettingsPage = pathname === '/settings/export';
    const activeRole = authUser?.role ? authUser.role : 'viewer';
    // Role-based visibility checks
    const canSeeTenant = canRoleAccessAdminPath(activeRole, '/settings/tenant');
    const canSeePlatform = canRoleAccessAdminPath(activeRole, '/settings/platform');
    const canSeeAdminTheme = canRoleAccessAdminPath(activeRole, '/settings/admin-theme');
    const canSeeAdminWorkspace = canRoleAccessAdminPath(activeRole, '/settings/admin-workspace');
    const canSeeUser = canRoleAccessAdminPath(activeRole, '/settings/user');
    const canSeeUsersList = canRoleAccessAdminPath(activeRole, '/users');
    const canSeeTenantsList = canRoleAccessAdminPath(activeRole, '/tenants');
    const canSeeAgenciesList = canRoleAccessAdminPath(activeRole, '/admin/agencies');
    const canSeeAgencySettings = canRoleAccessAdminPath(activeRole, '/settings/agency');
    const canSeeSystemRegistry = canRoleAccessAdminPath(activeRole, '/admin/registry');
    const canSeeTenantResources = canRoleAccessAdminPath(activeRole, '/tenant/resources');
    const canSeeAgencyResources = canRoleAccessAdminPath(activeRole, '/agency/resources');
    // const hasDedicatedWorkspace = authUser?.provisioningMode === 'full_tenant';
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
                // ...(canSeeAdminWorkspace && hasDedicatedWorkspace ? [{ href: '/settings/admin-workspace', label: 'Workspace Customization', description: 'Control sidebar labels, dashboard cards, widgets, and home layout', icon: <LayoutDashboard size={24} />, colorClass: 'text-cyan-400' }] : []),
                ...(canSeeAgencyResources ? [{ href: '/agency/resources', label: 'Agency Resources', description: 'View aggregate resource usage for your agency', icon: <BarChart3 size={24} />, colorClass: 'text-fuchsia-400' }] : []),
                ...(!canSeeAgencyResources && canSeeTenantResources ? [{ href: '/tenant/resources', label: 'Business Resources', description: 'View resource usage limits and metrics', icon: <BarChart3 size={24} />, colorClass: 'text-fuchsia-400' }] : []),
            ]
        }
    ].filter(g => g.items.length > 0);

    // Standard redirect handling if the user lands on a bad path directly
    useEffect(() => {
        if (!isHubView && !canRoleAccessAdminPath(activeRole, pathname)) {
            router.replace('/settings');
        }
    }, [activeRole, pathname, router, isHubView]);

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
            {/* Background decorative elements */}
            <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="px-6 py-8 border-b border-slate-800/50 bg-slate-900/20 backdrop-blur-md rounded-3xl"
            >
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-sm">
                        <Settings className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-3">
                            Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Center</span>
                        </h2>
                    </div>
                </div>
                <p className="text-slate-400 mt-2 text-base max-w-3xl leading-relaxed ml-1 font-medium">
                    Manage configuration, business profiles, and ecosystem settings. Your access and visible controls are governed dynamically by your active Role.
                </p>
            </motion.header>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-12 px-2"
            >
                {groups.map((group, idx) => (
                    <motion.div variants={itemVariants} key={idx} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                {group.title}
                            </h3>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {group.items.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="group relative p-6 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700 hover:shadow-lg transition-all duration-500 overflow-hidden"
                                >
                                    {/* Hover gradient background */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                    
                                    {/* Hover glow effect */}
                                    <div className="absolute -inset-px rounded-2xl border border-white/0 group-hover:border-white/5 transition-colors duration-500 pointer-events-none"></div>

                                    <div className="relative z-10 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <div className={`p-3 rounded-xl bg-slate-950/80 shadow-inner border border-slate-800/80 group-hover:scale-110 transition-transform duration-500 ${item.colorClass}`}>
                                                {item.icon}
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-slate-800/50 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                                                <ChevronRight className="w-4 h-4 text-slate-400" />
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-lg font-bold text-slate-200 group-hover:text-white transition-colors duration-300">
                                                {item.label}
                                            </h4>
                                            <p className="text-sm text-slate-400 mt-2 leading-relaxed group-hover:text-slate-300 transition-colors duration-300 font-medium">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
