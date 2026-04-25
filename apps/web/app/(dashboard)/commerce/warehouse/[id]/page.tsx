"use client";

import React, { useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import { fetchWarehouseById } from "@/hook/slices/commerce/warehouse/WarehouseThunk";
import {
  Home,
  MapPin,
  Globe,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Database,
  Terminal,
  Hash,
  CheckCircle2
} from "lucide-react";
import Link from "next/link";
import GetTenant from "@/components/adminLayout/GetTenant";

export default function WarehouseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const { currentWarehouse, isLoading, isError } = useSelector((state: RootState) => state.warehouse);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);
  const isApi = useRef<boolean>(false);

  useEffect(() => {
    if (
      id &&
      authUser?.access_token &&
      currentTenant?.mongo_db_name &&
      !isApi.current
    ) {
      isApi.current = true;
      dispatch(
        fetchWarehouseById({
          id,
          auth_token: authUser.access_token,
          "x-tenant-db": currentTenant.mongo_db_name,
        })
      );
    }
  }, [dispatch, id, authUser, currentTenant]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-white/5 border-t-gold rounded-full animate-spin shadow-2xl shadow-gold/20" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-white/40 animate-pulse italic">
          Localized Node Intelligence...
        </span>
      </div>
    );
  }

  if (isError || !currentWarehouse) {
    return (
      <div className="min-h-screen bg-charcoal flex flex-col items-center justify-center gap-6 p-10 text-center">
        <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 rounded-full">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Node Localization Failure</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed max-w-md">
            The requested storage node could not be localized within the secure matrix. Access denied or node decommissioned.
          </p>
        </div>
        <Link
          href="/commerce/warehouse"
          className="h-12 px-10 bg-slate-900 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={16} /> Return to Matrix
        </Link>
      </div>
    );
  }

  return (
    <>
      <GetTenant />
      <div className="min-h-screen bg-charcoal text-white selection:bg-gold/30">
        {/* Tactical Header Navigation */}
        <div className="sticky top-0 z-50 bg-charcoal/80 backdrop-blur-md border-b border-white/5 px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/commerce/warehouse"
              className="h-10 w-10 flex items-center justify-center bg-ink border border-white/5 text-white/40 hover:text-white transition-all group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em] leading-none">Storage Matrix Console</span>
              <h1 className="text-lg font-black uppercase tracking-widest leading-none mt-1">Node Intel: {currentWarehouse.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-ink/50 border border-white/5">
            <Database size={14} className="text-emerald-500" />
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">Node Status: Active</span>
          </div>
        </div>

        <main className="max-w-7xl mx-auto p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Visual Node Data */}
            <div className="lg:col-span-5 space-y-8">
              <div className="aspect-square bg-ink border border-white/5 relative overflow-hidden flex items-center justify-center group shadow-2xl shadow-black/80">
                <Home size={80} className="text-white/5 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Node Code</span>
                    <p className="text-lg font-black uppercase tracking-widest">{currentWarehouse.code || "N/A"}</p>
                  </div>
                  {currentWarehouse.is_default && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500 text-ink text-[8px] font-black uppercase tracking-widest">
                      <CheckCircle2 size={10} /> Primary Node
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ink/40 border border-white/5 p-6 space-y-2">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block italic">Operational Status</span>
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${currentWarehouse.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`} />
                    <span className="text-lg font-black text-white uppercase tracking-widest">{currentWarehouse.status || "UNKNOWN"}</span>
                  </div>
                </div>
                <div className="bg-ink/40 border border-white/5 p-6 space-y-2">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block italic">Localization</span>
                  <span className="text-lg font-black text-gold uppercase tracking-widest">{currentWarehouse.city || "GLOBAL"}</span>
                </div>
              </div>
            </div>

            {/* Tactical Intel Briefing */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-gold" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Geospatial Identity</span>
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{currentWarehouse.name}</h2>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-[9px] font-mono font-bold text-gold/60 uppercase tracking-widest px-3 py-1 bg-gold/5 border border-gold/10 italic">
                    slug: {currentWarehouse.slug}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 italic">
                    uuid: {currentWarehouse.id}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white/40">
                    <Globe size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Network Positioning</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">City Node</span>
                      <span className="text-sm font-bold text-white uppercase tracking-widest">{currentWarehouse.city || "UNSPECIFIED"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Country Matrix</span>
                      <span className="text-sm font-bold text-white uppercase tracking-widest">{currentWarehouse.country || "UNSPECIFIED"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 text-white/40">
                    <Calendar size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Chronology Log</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Commissioned</span>
                      <span className="text-sm font-mono font-bold text-white uppercase">{currentWarehouse.created_at ? new Date(currentWarehouse.created_at).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Last Intel Sync</span>
                      <span className="text-sm font-mono font-bold text-white uppercase">{currentWarehouse.updated_at ? new Date(currentWarehouse.updated_at).toLocaleDateString() : "PENDING"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-ink/40 border border-white/5 p-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gold" />
                <div className="flex items-center gap-3 mb-4">
                  <Hash size={16} className="text-gold" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Operational Metadata</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-black tracking-widest">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/20">Primary Asset</span>
                    <span className={currentWarehouse.is_default ? "text-emerald-500" : "text-white/40"}>{currentWarehouse.is_default ? "YES" : "NO"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/20">Sync Status</span>
                    <span className="text-emerald-500">LIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="p-10 border-t border-white/5 opacity-40">
          <div className="flex items-center gap-3">
            <Terminal size={14} className="text-gold" />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
              Storage Intelligence System | Terminal: Secure | Environment: Production
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
