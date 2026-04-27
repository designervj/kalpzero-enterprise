"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/providers/theme-provider";

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  borderHover?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

export function NavItem({
  href,
  icon,
  label,
  active = false,
  borderHover = false,
  collapsed = false,
  onClick,
}: NavItemProps) {
  const router = useRouter();
  const { themeMode } = useTheme();

  const handleClick = () => {
    router.push(href);
    if (onClick) onClick();
  };

  const activeStyles = themeMode === 'light'
    ? "bg-indigo-50/80 text-indigo-700 shadow-sm"
    : "bg-cyan-500/10 text-cyan-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

  const inactiveStyles = themeMode === 'light'
    ? "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200";

  return (
    <button
      onClick={handleClick}
      title={collapsed ? label : undefined}
      className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-300 relative group overflow-hidden ${
        collapsed ? "justify-center px-2" : "px-3"
      } ${active ? activeStyles : inactiveStyles}`}
    >
      {/* Active Indicator Line */}
      {active && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 rounded-r-md transition-all ${
          themeMode === 'light'
            ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"
            : "bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]"
        }`}></div>
      )}

      {/* Icon */}
      <span
        className={`relative z-10 transition-colors ${
          active 
            ? themeMode === 'light' ? "text-indigo-600" : "text-cyan-400" 
            : themeMode === 'light' ? "group-hover:text-indigo-600/80" : "group-hover:text-cyan-400/70"
        }`}
      >
        {icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span
          className={`relative z-10 tracking-wide ${
            active ? "font-semibold" : "font-medium"
          }`}
        >
          {label}
        </span>
      )}

      {/* Optional border glow on hover */}
      {borderHover && !active && (
        <div className={`absolute inset-0 border border-transparent rounded-lg transition-colors pointer-events-none ${
          themeMode === 'light' ? "group-hover:border-indigo-500/20" : "group-hover:border-cyan-500/30"
        }`}></div>
      )}
    </button>
  );
}
