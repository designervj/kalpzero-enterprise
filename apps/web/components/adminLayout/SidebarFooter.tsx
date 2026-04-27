"use client";

import React from "react";
import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "../AuthProvider";

import { useSelector } from "react-redux";
import { RootState } from "@/hook/store/store";
import { TenantSwitcherOption } from "@/hook/slices/kalp_master/master_tenant/tenantType";

interface SidebarFooterProps {
  sidebarCollapsed: boolean;
  isMobileMenuOpen: boolean;
  activeTenant: string;
  canSwitchTenant: boolean;
  tenantOptionsLoading: boolean;
  tenantSwitchingTo: string | null;
  tenantOptions: TenantSwitcherOption[];
  setTenantPickerOpen: (open: boolean) => void;
  tenantSwitchError: string;
  onLogout: () => void;
}

export function SidebarFooter({
  sidebarCollapsed,
  isMobileMenuOpen,
  activeTenant,
  canSwitchTenant,
  tenantOptionsLoading,
  tenantSwitchingTo,
  tenantOptions,
  setTenantPickerOpen,
  tenantSwitchError,
  onLogout,
}: SidebarFooterProps) {
  const { t } = useTranslation();
  const {currentTenant}= useSelector((state:RootState)=>state.tenant)
  const {authUser}= useSelector((state:RootState)=>state.auth)
  const isActuallyCollapsed = sidebarCollapsed && !isMobileMenuOpen;

  return (
    <div className="mt-auto border-t border-slate-800/80 bg-black/40 relative p-3">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
      
      {/* Active Node Info */}
      <div
        className={`text-[10px] uppercase tracking-widest text-slate-400 mb-2 font-semibold flex items-center ${
          isActuallyCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <span>{t("topbar.activeNode", "Active Node")}</span>
        {!isActuallyCollapsed && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-500 font-mono">
              {t("topbar.live", "LIVE")}
            </span>
          </span>
        )}
      </div>

      <div
        className={`font-mono text-xs text-cyan-300 bg-cyan-950/30 px-3 py-2 rounded-md border border-cyan-900/50 shadow-inner break-all ${
          isActuallyCollapsed ? "text-center px-1 text-[10px]" : ""
        }`}
      >
        {isActuallyCollapsed ? (
          <span className="text-slate-400">{currentTenant?.mongo_db_name}</span>
        ) : (
          <>
            <span className="text-slate-500 mr-2">db:</span>
            {currentTenant?.mongo_db_name}
          </>
        )}
      </div>

      {/* Tenant Switcher */}
      {!isActuallyCollapsed && canSwitchTenant && (
        <div className="mt-2 space-y-1.5">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">
            {t("topbar.switchTenant", "Switch Tenant")}
          </label>
          <button
            type="button"
            disabled={tenantOptionsLoading || tenantSwitchingTo !== null}
            onClick={() => setTenantPickerOpen(true)}
            className="w-full rounded-md border border-slate-700 bg-slate-950/80 px-2 py-1.5 text-left text-xs text-slate-100 focus:border-cyan-500/60 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 hover:border-cyan-500/40"
          >
            {tenantOptionsLoading ? (
              t("common.loading", "Loading...")
            ) : (
              <span className="flex items-center justify-between">
                <span className="truncate">
                  {/* {tenantOptions.find((item) => item.key === activeTenant)?.name ||
                    activeTenant}{" "}
                  ({activeTenant}) */}
                  {currentTenant?.display_name}
                </span>
                <span className="text-slate-500">
                  {tenantOptions.length || 1}
                </span>
              </span>
            )}
          </button>
          {tenantSwitchingTo && (
            <p className="text-[10px] text-cyan-300/80">
              {t("topbar.switching", "Switching")}... {tenantSwitchingTo}
            </p>
          )}
          {tenantSwitchError && (
            <p className="text-[10px] text-rose-300">{tenantSwitchError}</p>
          )}
        </div>
      )}

      {/* User Info */}
      {authUser && (
        <div
          className={`mt-3 rounded-lg border border-slate-800 bg-slate-900/60 ${
            isActuallyCollapsed ? "p-2" : "p-3"
          }`}
        >
          <div
            className={`flex items-center ${
              isActuallyCollapsed ? "justify-center" : "justify-between"
            } gap-2`}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-bold">
                {authUser?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              {!isActuallyCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs text-white font-medium leading-none truncate">
                    {authUser?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    {authUser?.email}
                  </div>
                </div>
              )}
            </div>

            {!isActuallyCollapsed && (
              <div className="flex items-center gap-1">
                <Link
                  href="/settings/user"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-200"
                  title={t("nav.userSettings", "User Settings")}
                >
                  <Settings size={13} />
                </Link>
                <button
                  onClick={onLogout}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                  title={t("auth.logout", "Logout")}
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}

            {isActuallyCollapsed && (
              <button
                onClick={onLogout}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-rose-500/40 hover:text-rose-300"
                title={t("auth.logout", "Logout")}
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
