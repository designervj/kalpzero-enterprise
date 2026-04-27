"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Plus,
  Search,
  Building2,
  Edit,
  ExternalLink,
  MapPin,
  Clock,
  User,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/hook/store/store";
import GetAllAgencies from "@/components/agency/GetAllAgencies";
import { Agency } from "@/hook/slices/kalp_master/agencies/agencyType";
import { setCurrentAgency } from "@/hook/slices/kalp_master/agencies/AgencySlice";

export default function AgencySettingsPage() {
  const router = useRouter();
  const { allAgencies, loading } = useSelector((state: RootState) => state.agency);
  const [searchTerm, setSearchTerm] = useState("");
   const dispatch= useDispatch<AppDispatch>()
  const filteredAgencies = allAgencies.filter(
    (agency) =>
      agency.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleEdit=(agency:Agency)=>{
    dispatch(setCurrentAgency(agency))
  router.push(`/settings/agency/${agency.id}`)
  }
    
  
  return (
    <>
      <GetAllAgencies />
      <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between sticky top-0 z-10 bg-black/60 backdrop-blur-xl p-4 rounded-2xl border border-slate-800/50 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <Globe size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Agency Directory
              </h2>
              <p className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">
                Manage {allAgencies.length} registered agencies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={16} />
              <input
                type="text"
                placeholder="Search agencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-black/40 border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-all w-64"
              />
            </div>
            <button
              onClick={() => router.push("/onboarding")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all"
            >
              <Plus size={16} />
              Create Agency
            </button>
          </div>
        </div>

        {/* Agency List */}
        <div className="grid grid-cols-1 gap-4">
          {loading && allAgencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 bg-slate-900/20 rounded-2xl border border-slate-800/50">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500">
                Loading Agencies...
              </span>
            </div>
          ) : filteredAgencies.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4 bg-slate-900/20 rounded-2xl border border-slate-800/50">
              <Building2 size={48} className="text-slate-700" />
              <span className="font-mono text-xs uppercase tracking-widest text-slate-500 text-center">
                No agencies found matching "{searchTerm}"
              </span>
            </div>
          ) : (
            filteredAgencies.map((agency) => (
              <div
                key={agency.id}
                className="group bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-2xl p-5 flex items-center justify-between hover:border-indigo-500/30 transition-all hover:shadow-[0_0_30px_rgba(99,102,241,0.05)]"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all overflow-hidden relative">
                    {agency.name?.charAt(0).toUpperCase()}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {agency.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-slate-500">{agency.slug}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        <MapPin size={10} className="text-indigo-500/70" />
                        {agency.region}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <User size={10} />
                        {agency.owner_user_id}
                      </div>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <Clock size={10} />
                        {new Date(agency?.created_at || "").toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <button
                    onClick={()=>handleEdit(agency)}
                    className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all shadow-lg"
                    title="Agency Ecosystem"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => window.open(`https://${agency.slug}.kalpzero.com`, "_blank")}
                    className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all shadow-lg"
                    title="Public Portal"
                  >
                    <ExternalLink size={18} />
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
