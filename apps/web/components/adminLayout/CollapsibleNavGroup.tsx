"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { NavItem } from "./NavItem";
import { isPathActive } from "./util/utilFunction";
import { usePathname } from "next/navigation";

interface CollapsibleNavGroupProps {
  label: string;
  icon: React.ReactNode;
  children: {
    label: string;
    route: string;
    key: string;
  }[];
  collapsed?: boolean;
}

export function CollapsibleNavGroup({
  label,
  icon,
  children,
  collapsed = false,
}: CollapsibleNavGroupProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand if a child route is active
  useEffect(() => {
    const hasActiveChild = children.some((child) =>
      isPathActive(pathname, child.route),
    );
    if (hasActiveChild) {
      setIsOpen(true);
    }
  }, [pathname, children]);

  const toggleOpen = () => {
    if (collapsed) return; // Don't toggle if collapsed (or handle differently)
    setIsOpen(!isOpen);
  };

  const isAnyChildActive = children.some((child) =>
    isPathActive(pathname, child.route),
  );

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={toggleOpen}
        title={collapsed ? label : undefined}
        className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-300 relative group overflow-hidden ${
          collapsed ? "justify-center px-2" : "px-3"
        } ${
          isAnyChildActive
            ? "bg-cyan-500/5 text-cyan-200/80"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
        }`}
      >
        {/* Active Indicator Line (Subtle for groups) */}
        {isAnyChildActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/3 bg-cyan-500/50 rounded-r-md"></div>
        )}

        {/* Icon */}
        <span
          className={`relative z-10 transition-colors ${
            isAnyChildActive ? "text-cyan-400/80" : "group-hover:text-cyan-400/70"
          }`}
        >
          {icon}
        </span>

        {/* Label */}
        {!collapsed && (
          <span className="relative z-10 tracking-wide flex-1 text-left">
            {label}
          </span>
        )}

        {/* Chevron */}
        {!collapsed && (
          <ChevronDown
            size={14}
            className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""} ${
              isAnyChildActive ? "text-cyan-400/80" : "text-slate-500"
            }`}
          />
        )}
      </button>

      {/* Children */}
      {!collapsed && isOpen && (
        <div className="flex flex-col gap-1 ml-4 pl-4 border-l border-slate-800/50">
          {children.map((child) => (
            <NavItem
              key={child.key}
              href={child.route}
              label={child.label}
              icon={<div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-cyan-500/50" />}
              active={isPathActive(pathname, child.route)}
              collapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
