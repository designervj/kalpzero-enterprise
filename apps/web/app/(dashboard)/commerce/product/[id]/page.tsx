"use client";

import React, { useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/lib/store";
import { fetchProductById } from "@/hook/slices/commerce/products/ProductThunk";
import {
  Package,
  Tag,
  Layers,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Globe,
  Database
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const dispatch = useDispatch<AppDispatch>();

  const { currentProduct, isLoading, isError } = useSelector((state: RootState) => state.product);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);
   const isApi= useRef<boolean>(false);
  useEffect(() => {
    if (
      id &&
      authUser?.access_token &&
      currentTenant?.mongo_db_name &&
      !isApi.current &&
      currentProduct === null
    ) {
      isApi.current=true;
      dispatch(
        fetchProductById({
          id,
          auth_token: authUser.access_token,
          "x-tenant-db": currentTenant.mongo_db_name,
        })
      );
    }
  }, [dispatch, id, authUser, currentTenant,currentProduct]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 border-4 border-white/5 border-t-amber-500 rounded-full animate-spin shadow-2xl shadow-amber-500/20" />
        <span className="text-xs font-black uppercase tracking-[0.5em] text-white/40 animate-pulse italic">
          Decoding Asset Intelligence...
        </span>
      </div>
    );
  }

  if (isError || !currentProduct) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6 p-10 text-center">
        <div className="h-20 w-20 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 rounded-full">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white uppercase tracking-widest">Initialization Failure</h1>
          <p className="text-xs text-white/40 uppercase tracking-widest leading-relaxed max-w-md">
            The requested product matrix could not be localized within the secure repository. Access denied or record purged.
          </p>
        </div>
        <Link
          href="/commerce/products"
          className="h-12 px-10 bg-slate-900 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={16} /> Return to Inventory
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-950 text-white selection:bg-amber-500/30">
        {/* Tactical Header Navigation */}
        <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/commerce/products"
              className="h-10 w-10 flex items-center justify-center bg-slate-900 border border-white/5 text-white/40 hover:text-white transition-all group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none">Commerce Console</span>
              <h1 className="text-lg font-black uppercase tracking-widest leading-none mt-1">Asset Detail: {currentProduct.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-white/5">
            <Database size={14} className="text-emerald-500" />
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">Status: Localized</span>
          </div>
        </div>

        <main className="max-w-7xl mx-auto p-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="grid lg:grid-cols-12 gap-12">
            {/* Visual Data Module */}
            <div className="lg:col-span-5 space-y-8">
              <div className="aspect-square bg-slate-900 border border-white/5 relative overflow-hidden flex items-center justify-center group shadow-2xl shadow-black/80">
                <Package size={80} className="text-white/5 group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent opacity-60" />
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block">Unit Designation</span>
                    <p className="text-lg font-black uppercase tracking-widest">{currentProduct.sku || "N/A"}</p>
                  </div>
                  <Badge className={`${currentProduct.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} font-black text-[9px] uppercase tracking-widest rounded-none h-6 px-3`}>
                    {currentProduct.status || "INACTIVE"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-white/5 p-4 space-y-1">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block italic">Unit Credit</span>
                  <span className="text-xl font-black text-amber-500">${currentProduct.price?.toFixed(2) || "0.00"}</span>
                </div>
                <div className="bg-slate-900/40 border border-white/5 p-4 space-y-1">
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block italic">Asset Type</span>
                  <span className="text-xl font-black text-white uppercase tracking-widest">{currentProduct.type || "PHYSICAL"}</span>
                </div>
              </div>
            </div>

            {/* Intelligence Briefing Module */}
            <div className="lg:col-span-7 space-y-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Tag size={16} className="text-amber-500" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Operational Identity</span>
                </div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">{currentProduct.name}</h2>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="text-[9px] font-mono font-bold text-amber-500/60 uppercase tracking-widest px-3 py-1 bg-amber-500/5 border border-amber-500/10 italic">
                    slug: {currentProduct.slug}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest px-3 py-1 bg-white/5 border border-white/10 italic">
                    uuid: {currentProduct.id}
                  </span>
                </div>
              </div>

              <div className="space-y-6 bg-slate-900/40 border border-white/5 p-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <div className="flex items-center gap-3">
                  <Layers size={16} className="text-amber-500" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Contextual Data Breifing</span>
                </div>
                <p className="text-sm font-medium text-white/60 leading-relaxed uppercase tracking-tight">
                  {currentProduct.description || "NO OPERATIONAL INTEL PROVIDED FOR THIS ASSET."}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/40">
                    <Globe size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Network Synchronization</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                      <span className="text-white/20">Public Access</span>
                      <span className="text-emerald-500">Enabled</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                      <span className="text-white/20">Index Priority</span>
                      <span className="text-white">High-Level</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-white/40">
                    <Calendar size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Chronology Log</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                      <span className="text-white/20">Registered</span>
                      <span className="text-white font-mono">{currentProduct.createdAt ? new Date(currentProduct.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest">
                      <span className="text-white/20">Last Sync</span>
                      <span className="text-white font-mono">{currentProduct.updatedAt ? new Date(currentProduct.updatedAt).toLocaleDateString() : "PENDING"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Matrix (Placeholders for Category/Variants/Attributes) */}
          <div className="space-y-8 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-900 border border-white/5 flex items-center justify-center text-white/20 italic font-black text-xs">02</div>
                <h3 className="text-lg font-black uppercase tracking-widest">Relational Hierarchy</h3>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900/20 border border-white/5 p-6 space-y-4 group hover:bg-slate-900/40 transition-all">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Categories</span>
                <div className="flex flex-wrap gap-2">
                  {currentProduct.categoryIds?.length ? currentProduct.categoryIds.map((cid, i) => (
                    <Badge key={i} className="bg-slate-950 border border-white/10 text-white/40 font-black text-[8px] uppercase tracking-widest rounded-none">
                      NODE-{cid.slice(-4)}
                    </Badge>
                  )) : <span className="text-[10px] italic text-white/10 uppercase">Unassigned Hierarchy</span>}
                </div>
              </div>

              <div className="bg-slate-900/20 border border-white/5 p-6 space-y-4 group hover:bg-slate-900/40 transition-all opacity-50 grayscale">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Variants (Secure Link)</span>
                <p className="text-[10px] italic text-white/20 uppercase">Module Locked: No variants detected in matrix context.</p>
              </div>

              <div className="bg-slate-900/20 border border-white/5 p-6 space-y-4 group hover:bg-slate-900/40 transition-all opacity-50 grayscale">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Attribute Overrides</span>
                <p className="text-[10px] italic text-white/20 uppercase">Module Locked: No custom attributes locally defined.</p>
              </div>
            </div>
          </div>
        </main>

        {/* Terminal Footer Info */}
        <footer className="p-10 border-t border-white/5 opacity-40">
          <div className="flex items-center gap-3">
            <Terminal size={14} className="text-amber-500" />
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
              Asset Intelligence System | Terminal: Secure | Data Protocol: AES-256 | Environment: Production
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}

function Terminal(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" x2="20" y1="19" y2="19" />
    </svg>
  );
}
