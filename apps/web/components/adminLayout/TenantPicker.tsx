"use client";

import React, { useState, useMemo } from "react";
import { X, Search as SearchIcon } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

import { useDispatch } from "react-redux";
import { AppDispatch } from "@/hook/store/store";
import { setCurrentTenant } from "@/hook/slices/kalp_master/master_tenant/TenantSlice";
import { TenantSwitcherOption } from "@/hook/slices/kalp_master/master_tenant/tenantType";
import { useRouter } from "next/navigation";

interface TenantPickerProps {
  isOpen: boolean;
  activeTenant: string;
  tenantOptions: TenantSwitcherOption[];
  onClose: () => void;
  onSwitch: (key: string) => Promise<void> | void;
  switchingTo: string | null;
}

export function TenantPicker({
  isOpen,
  activeTenant,
  tenantOptions,
  onClose,
  onSwitch,
  switchingTo,
}: TenantPickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const dispatch = useDispatch<AppDispatch>()
  const router = useRouter();
  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const source =
      tenantOptions.length > 0
        ? tenantOptions
        : [{ key: activeTenant, name: activeTenant }];
    if (!q) return source;
    return source.filter(
      (item) => {
        const searchKey = (item?.slug || item?.key || "").toLowerCase();
        const searchName = (item?.display_name || item?.name || "").toLowerCase();
        return searchKey.includes(q) || searchName.includes(q);
      }
    );
  }, [tenantOptions, query, activeTenant]);

  if (!isOpen) return null;


  const handleSwitch = (item: TenantSwitcherOption) => {
    dispatch(setCurrentTenant(item))
        router.push(`/dashboard`);
    // onSwitch(item?.slug || item?.key || "");
    onClose();
  };
  
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {t("topbar.switchTenant", "Switch Tenant")}
            </h3>
            <p className="text-[11px] text-slate-500">
              Search by business name or tenant key.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
            aria-label="Close tenant picker"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search & List */}
        <div className="p-4">
          <div className="relative">
            <SearchIcon
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("topbar.searchTenant", "Search tenant...")}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-9 py-2 text-sm text-slate-100 focus:border-cyan-500/60 focus:outline-none"
            />
          </div>

          <div className="mt-3 max-h-[360px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {filteredOptions.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-500 text-center">
                {t("topbar.noTenantsFound", "No tenants match this search.")}
              </div>
            ) : (
              filteredOptions.map((item) => {
                const itemKey = item.slug || item.key;
                const isActive = itemKey === activeTenant;
                return (
                  <button
                    key={itemKey}
                    type="button"
                    onClick={()=>handleSwitch(item)}
                    // onClick={() => onSwitch(item?.slug || item?.key || "")}
                    disabled={switchingTo !== null}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                      isActive
                        ? "border-cyan-500/40 bg-cyan-500/10"
                        : "border-slate-800 bg-slate-900/60 hover:border-slate-600"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-100">
                          {item.display_name || item.name}
                        </div>
                        <div className="truncate text-[11px] font-mono text-slate-500">
                          {item.slug || item.key}
                        </div>
                      </div>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          isActive
                            ? "border-cyan-500/40 text-cyan-300"
                            : "border-slate-700 text-slate-500"
                        }`}
                      >
                        {isActive
                          ? t("common.active", "Active")
                          : item.subscriptionLevel || "tenant"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
