"use client";

import NavigationManager from "@/components/admin/NavigationManager";
import { Menu } from "lucide-react";

export default function NavigationsPage() {
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-500">
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Menu size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Navigation Management
            </h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest font-mono">
              Manage site-wide menus and mega menus
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <NavigationManager />
      </div>
    </div>
  );
}
