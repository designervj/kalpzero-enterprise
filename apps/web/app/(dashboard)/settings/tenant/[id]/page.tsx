"use client"

import FetchTenantId from "@/components/tenant/FetchTenantId";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  Check,
  RefreshCw,
  Building2,
  Database,
  Globe,
  Shield,
  Activity,
  Layers,
  Flag,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { useAuth } from "@/components/AuthProvider";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { updateTenant } from "@/hook/slices/kalp_master/master_tenant/TenantThunk";
import { TenantSwitcherOption } from "@/hook/slices/kalp_master/master_tenant/tenantType";
import { X } from "lucide-react";
export default function TenantDetails(){
      const router = useRouter();
  const authCtx = useAuth();
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<any>({
    id: "",
    agency_id: "",
    slug: "",
    display_name: "",
    infra_mode: "shared",
    vertical_packs: [],
    business_type: "",
    feature_flags: [],
    dedicated_profile_id: "",
    mongo_db_name: "",
    created_at: "",
    runtime_documents: {
      kind: "",
      mode: "",
      database: "",
      collection_count: 0,
      collections: {},
      bootstrap: {},
    },
    website_deployment: {
      status: "disabled",
      provider: "",
      repo_name: "",
      message: "",
    },
  });

  useEffect(() => {
    if (currentTenant) {
      setForm({
        ...form,
        ...currentTenant,
        vertical_packs: currentTenant.vertical_packs || [],
        feature_flags: currentTenant.feature_flags || [],
      });
      setLoading(false);
    }
  }, [currentTenant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updateTenant(form));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save tenant settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (field: string, value: string) => {
    setForm((prev: any) => {
      const items = prev[field] || [];
      const nextItems = items.includes(value)
        ? items.filter((i: string) => i !== value)
        : [...items, value];
      return { ...prev, [field]: nextItems };
    });
  };

//   if (loading) {
//     return (
//       <div className="flex flex-col items-center justify-center p-20 gap-4">
//         <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"></div>
//         <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
//           {t("common.loading", "Loading settings...")}
//         </span>
//       </div>
//     );
//   }


    return(
        <>
            <FetchTenantId/>
             <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-800/50 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Tenant Configuration
            </h2>
            <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
              ID: {form.id} • {form.infra_mode} mode
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all border border-slate-700/50"
          >
            <X size={16} />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
            saved
              ? "bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              : "bg-cyan-500 text-black hover:bg-cyan-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : saved ? (
            <Check size={16} />
          ) : (
            <Save size={16} />
          )}
          {saving ? "Saving..." : saved ? "Success!" : "Apply Changes"}
        </button>
      </div>
    </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Identity */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Building2 size={16} className="text-cyan-400" /> Identity & Branding
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full bg-black/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-700"
                placeholder="Business Name"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Identifier Slug
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-black/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                placeholder="business-slug"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Business Type
              </label>
              <input
                type="text"
                value={form.business_type}
                onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                className="w-full bg-black/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                placeholder="e.g., commerce, service"
              />
            </div>
          </div>
        </div>

        {/* Infrastructure */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <Database size={16} className="text-amber-400" /> Infrastructure Mode
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Deployment Mode
              </label>
              <select
                value={form.infra_mode}
                onChange={(e) => setForm({ ...form, infra_mode: e.target.value })}
                className="w-full bg-black/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="shared">Shared Infrastructure</option>
                <option value="dedicated">Dedicated Infrastructure</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Dedicated Profile ID
              </label>
              <input
                type="text"
                value={form.dedicated_profile_id || ""}
                onChange={(e) => setForm({ ...form, dedicated_profile_id: e.target.value })}
                className="w-full bg-black/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-500/50 transition-all font-mono"
                placeholder="N/A"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">
                Database Name
              </label>
              <input
                type="text"
                readOnly
                value={form.mongo_db_name}
                className="w-full bg-black/20 border border-slate-800/50 rounded-xl px-4 py-3 text-slate-500 text-sm focus:outline-none font-mono cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Vertical Packs */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl col-span-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers size={16} className="text-emerald-400" /> Vertical Packs
          </h3>
          <div className="flex flex-wrap gap-3">
            {["commerce", "service", "booking", "real-estate"].map((pack) => {
              const active = form.vertical_packs.includes(pack);
              return (
                <button
                  key={pack}
                  onClick={() => toggleArrayItem("vertical_packs", pack)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    active
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                      : "bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  {pack.charAt(0).toUpperCase() + pack.slice(1)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Flags */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl col-span-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Flag size={16} className="text-violet-400" /> Feature Flags
          </h3>
          <div className="flex flex-wrap gap-3">
            {["seo-suite", "advanced-analytics", "white-label", "api-access"].map((flag) => {
              const active = form.feature_flags.includes(flag);
              return (
                <button
                  key={flag}
                  onClick={() => toggleArrayItem("feature_flags", flag)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                    active
                      ? "bg-violet-500/10 border-violet-500/30 text-violet-400 shadow-[0_0_15px_rgba(139,92,246,0.1)]"
                      : "bg-black/20 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  {flag.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Runtime & Deployment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Runtime Docs */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity size={16} className="text-blue-400" /> Runtime Status
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Database Engine</span>
              <span className="text-white font-mono">{form.runtime_documents?.kind || "N/A"}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Collections Managed</span>
              <span className="text-white font-mono">{form.runtime_documents?.collection_count || 0}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Seeded Documents</span>
              <span className="text-white font-mono">{form.runtime_documents?.bootstrap?.seeded_document_count || 0}</span>
            </div>
            <div className="pt-2">
              <span className="text-[10px] text-slate-600 uppercase font-bold">Active Collections</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.keys(form.runtime_documents?.collections || {}).map(c => (
                  <span key={c} className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] text-blue-300 font-mono">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Website Deployment */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Globe size={16} className="text-emerald-400" /> Frontend Deployment
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${
                form.website_deployment?.status === "disabled" ? "bg-slate-800 text-slate-400" : "bg-emerald-500/20 text-emerald-400"
              }`}>
                {form.website_deployment?.status || "Unknown"}
              </div>
              <span className="text-xs text-slate-400 font-mono">{form.website_deployment?.repo_name}</span>
            </div>
            {form.website_deployment?.message && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-3">
                <Shield size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-200/80 leading-relaxed italic">
                  {form.website_deployment.message}
                </p>
              </div>
            )}
            <div className="flex gap-4 pt-2">
              <button disabled className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-cyan-400 transition-colors disabled:cursor-not-allowed">
                View Repository
              </button>
              <button disabled className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-cyan-400 transition-colors disabled:cursor-not-allowed">
                Open Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata / Footer */}
      <div className="flex justify-between items-center px-4 text-[10px] text-slate-600 font-mono">
        <span>Created: {new Date(form.created_at).toLocaleString()}</span>
        <span className="uppercase tracking-widest">Enterprise Mode Enabled</span>
      </div>
    </div>
            
        </>
    )
}