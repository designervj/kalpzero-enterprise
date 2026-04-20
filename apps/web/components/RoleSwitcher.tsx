'use client';

import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useAuth } from './AuthProvider';
import { Bot, Briefcase, ChevronDown, Eye, ShieldCheck, Star, UserCircle2, UserCog } from 'lucide-react';
import { getRoleMeta, type RoleProfileKey } from '@/lib/role-scope';

const ROLE_ICON_MAP: Record<RoleProfileKey, ComponentType<{ size?: number; className?: string }>> = {
    platform_owner: UserCircle2,
    platform_admin: UserCog,
    tenant_owner: Briefcase,
    tenant_admin: ShieldCheck,
    staff: ShieldCheck,
    ai_agent: Bot,
    viewer: Eye,
};

export function RoleSwitcher() {
    const { currentProfile, availableProfiles, switchRole, isScopedRoleView, sessionRole } = useAuth();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function onClickOutside(event: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        window.addEventListener('mousedown', onClickOutside);
        return () => window.removeEventListener('mousedown', onClickOutside);
    }, []);

    const currentMeta = getRoleMeta(currentProfile);
    const sessionMeta = getRoleMeta(sessionRole);
    const CurrentIcon = ROLE_ICON_MAP[currentProfile] || ShieldCheck;
    const hasSwitchTargets = availableProfiles.length > 1;
    const roleOptions = useMemo(() => {
        return availableProfiles.map(profile => ({
            profile,
            meta: getRoleMeta(profile),
            icon: ROLE_ICON_MAP[profile] || ShieldCheck,
        }));
    }, [availableProfiles]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => {
                    if (!hasSwitchTargets) return;
                    setOpen(prev => !prev);
                }}
                className={`flex items-center gap-2 bg-slate-950 py-1 px-3 rounded-full border border-slate-800/80 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)] ${hasSwitchTargets ? 'hover:border-cyan-500/40 transition-colors' : ''}`}
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <div className="text-slate-400 flex items-center justify-center p-1 bg-slate-900 rounded-full border border-slate-700/50">
                    <CurrentIcon size={14} className="text-cyan-300" />
                </div>
                <div className="text-xs font-mono font-medium text-slate-200 py-1">
                    {currentMeta.label}
                </div>
                {isScopedRoleView && (
                    <span
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300"
                        title="You are previewing a different role scope"
                    >
                        <Eye size={10} />
                        Preview
                    </span>
                )}
                {hasSwitchTargets && <ChevronDown size={13} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />}
            </button>

            {open && hasSwitchTargets && (
                <div className="absolute right-0 mt-2 w-[340px] max-w-[80vw] rounded-xl border border-slate-700 bg-slate-950/95 backdrop-blur-xl shadow-2xl z-[60] overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-800">
                        <div className="text-[11px] uppercase tracking-widest text-slate-500">Role Context</div>
                        <div className="text-xs text-slate-300 mt-1">Session Role: <span className="text-cyan-300 font-medium">{sessionMeta.label}</span></div>
                        {isScopedRoleView && (
                            <div className="text-[11px] text-amber-300/90 mt-1">Viewing in scoped mode as {currentMeta.label}.</div>
                        )}
                    </div>
                    <div className="p-2 space-y-1">
                        {roleOptions.map(({ profile, meta, icon: Icon }) => {
                            const active = profile === currentProfile;
                            return (
                                <button
                                    key={profile}
                                    type="button"
                                    onClick={() => {
                                        switchRole(profile);
                                        setOpen(false);
                                    }}
                                    className={`w-full text-left rounded-lg px-3 py-2.5 border transition-colors ${active
                                        ? 'border-cyan-500/40 bg-cyan-500/10'
                                        : 'border-slate-800 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/80'
                                        }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <span className={`mt-0.5 ${active ? 'text-cyan-300' : 'text-slate-400'}`}>
                                            <Icon size={14} />
                                        </span>
                                        <div className="min-w-0">
                                            <div className={`text-sm font-medium ${active ? 'text-cyan-100' : 'text-slate-200'}`}>{meta.label}</div>
                                            <div className="text-[11px] text-slate-400 leading-relaxed mt-0.5">{meta.bodhHint}</div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
