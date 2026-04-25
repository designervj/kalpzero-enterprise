"use client";

import React from "react";
import { Edit2, Trash2, Hash, MapPin, Globe, AlertCircle, Home, CheckCircle2 } from "lucide-react";
import { Warehouse } from "@/hook/slices/commerce/warehouse/WarehouseType";
import { formatDate } from "../util/DateFormate";

interface WarehouseTableProps {
  warehouses: Warehouse[];
  onEdit: (warehouse: Warehouse) => void;
  onDelete: (warehouse: Warehouse) => void;
  isLoading: boolean;
  search: string;
}

export default function WarehouseTable({ warehouses, onEdit, onDelete, isLoading, search }: WarehouseTableProps) {
  const filteredWarehouses = warehouses.filter((warehouse) =>
    warehouse?.name?.toLowerCase().includes(search.toLowerCase()) ||
    warehouse?.code?.toLowerCase().includes(search.toLowerCase()) ||
    warehouse?.city?.toLowerCase().includes(search.toLowerCase()) ||
    warehouse?.country?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && filteredWarehouses.length === 0) {
    return (
      <div className="w-full bg-charcoal border border-white/5 rounded-none overflow-hidden">
        <div className="h-12 bg-ink border-b border-white/5 animate-pulse" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b border-white/5 animate-pulse opacity-50" />
        ))}
      </div>
    );
  }

  if (filteredWarehouses.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-charcoal border border-dashed border-white/10 rounded-sm">
        <AlertCircle size={40} className="text-white/10" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
          No warehouses found in matrix
        </span>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-charcoal border border-white/5 rounded-none shadow-2xl shadow-black/60">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="bg-ink border-b border-white/10">
            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
              Warehouse Intel
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
              Location
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
              Status
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
              Timeline
            </th>
            <th className="px-6 py-4 text-[10px] font-black text-white/40 uppercase tracking-[0.3em] text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filteredWarehouses.map((warehouse) => (
            <tr 
              key={warehouse.id}
              className="group hover:bg-white/[0.02] transition-all duration-300 relative"
            >
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white uppercase tracking-tighter group-hover:text-gold transition-colors">
                      {warehouse.name}
                    </span>
                    {warehouse.is_default && (
                      <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                        <CheckCircle2 size={10} /> Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-[9px] font-black text-gold uppercase tracking-widest bg-ink/50 px-2 py-0.5 rounded-sm border border-gold/10">
                      <Hash size={10} /> {warehouse.code}
                    </span>
                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest truncate max-w-[200px]">
                      ID: {warehouse.id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] text-white/60 font-bold uppercase tracking-widest">
                    <MapPin size={12} className="text-gold/40" /> {warehouse.city || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-white/40 font-medium tracking-wide uppercase">
                    <Globe size={12} className="text-white/10" /> {warehouse.country || "N/A"}
                  </div>
                </div>
              </td>

              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <span className={`block h-2 w-2 rounded-full ${warehouse.status === 'active' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'}`} />
                    <span className={`absolute inset-0 animate-ping h-2 w-2 rounded-full ${warehouse.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-20`} />
                  </div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                    {warehouse.status || "UNKNOWN"}
                  </span>
                </div>
              </td>

              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                    Created At
                  </span>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-wide">
                    {formatDate(warehouse.created_at)}
                  </span>
                </div>
              </td>

              <td className="px-6 py-5">
                <div className="flex items-center justify-end gap-2 opacity-20 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => onEdit(warehouse)}
                    className="h-9 px-4 bg-ink border border-white/5 text-white/40 hover:text-gold hover:border-gold/30 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                  <button 
                    onClick={() => onDelete(warehouse)}
                    className="h-9 w-9 flex items-center justify-center bg-ink border border-white/5 text-white/40 hover:text-red-500 hover:border-red-500/30 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
