"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Plus,
  Search,
  Building2,
  Database,
  Globe,
  ExternalLink,
  Edit,
  Trash2,
  Clock,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/components/AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { deleteTenant } from "@/hook/slices/kalp_master/master_tenant/TenantThunk";
import GetAllTenant from "@/components/tenant/GetAllTenant";

export default function TenantSettings() {
  const router = useRouter();
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { allTenant, loading: tenantLoading } = useSelector((state: RootState) => state.tenant);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTenants = allTenant.filter(
    (tenant) =>
      tenant.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, slug: string) => {
    if (window.confirm(`Are you sure you want to delete ${slug}?`)) {
      await dispatch(deleteTenant({ id }));
    }
  };

  return (
    <>
      <GetAllTenant />
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-800/50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <Building2 size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Business Directory
              </h2>
              <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
                Manage {allTenant.length} active business units
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50 transition-all w-64"
              />
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
            >
              <Plus size={16} />
              New Business
            </button>
          </div>
        </div>

        {/* Tenant List */}
        <div className="grid grid-cols-1 gap-4">
          {tenantLoading && allTenant.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 bg-slate-900/20 rounded-2xl border border-slate-800/50">
              <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                Fetching Directory...
              </span>
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 bg-slate-900/20 rounded-2xl border border-slate-800/50">
              <Building2 size={48} className="text-slate-700" />
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500 text-center">
                No businesses found matching "{searchTerm}"
              </span>
            </div>
          ) : (
            filteredTenants.map((tenant) => (
              <div
                key={tenant.id}
                className="group bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-5 flex items-center justify-between hover:border-cyan-500/30 transition-all hover:shadow-[0_0_30px_rgba(0,240,255,0.05)]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-all overflow-hidden relative">
                     {tenant.display_name?.charAt(0).toUpperCase()}
                     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {tenant.display_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-slate-500">{tenant.slug}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <Database size={10} className="text-amber-500/70" />
                        {tenant.infra_mode}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <Clock size={10} />
                        {tenant.created_at ? new Date(tenant.created_at).toLocaleDateString() : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={() => router.push(`/settings/tenant/${tenant.id}`)}
                    className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-lg"
                    title="Configure Settings"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => window.open(`https://${tenant.slug}.kalpzero.com`, "_blank")}
                    className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-black transition-all shadow-lg"
                    title="Visit Website"
                  >
                    <ExternalLink size={18} />
                  </button>
                  <div className="w-px h-6 bg-slate-800 mx-1" />
                  <button
                    onClick={() => handleDelete(tenant.id!, tenant.slug!)}
                    className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-black transition-all shadow-lg"
                    title="Terminate Tenant"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}