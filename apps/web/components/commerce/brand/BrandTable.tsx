"use client";

import React from "react";
import { Edit2, Trash2, Shield, Hash, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Brand } from "@/hook/slices/commerce/brand/BrandType";

interface BrandTableProps {
  brands: Brand[];
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  isLoading: boolean;
  search: string;
}

export default function BrandTable({ brands, onEdit, onDelete, isLoading, search }: BrandTableProps) {
  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase()) ||
    brand.code.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading && filteredBrands.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-charcoal animate-pulse border border-white/5 rounded-sm" />
        ))}
      </div>
    );
  }

  if (filteredBrands.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-charcoal border border-dashed border-white/10 rounded-sm">
        <AlertCircle size={40} className="text-white/10" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
          No brands found in matrix
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredBrands.map((brand) => (
        <div 
          key={brand.id}
          className="group relative bg-charcoal border border-white/5 rounded-sm p-6 space-y-4 hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5 transition-all duration-500 overflow-hidden"
        >
          {/* Tactical Background Element */}
          <div className="absolute -top-4 -right-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
             <Shield size={120} />
          </div>

          <div className="flex items-start justify-between relative">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-gold transition-colors">
                {brand.name}
              </h3>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[8px] font-black text-white/40 uppercase tracking-widest bg-ink px-2 py-1 rounded-sm border border-white/5">
                  <Hash size={10} className="text-gold" /> {brand.code}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${brand.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'} shadow-[0_0_8px_rgba(16,185,129,0.3)]`} />
              </div>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
              <button 
                onClick={() => onEdit(brand)}
                className="p-2 bg-ink border border-white/5 text-white/40 hover:text-gold hover:border-gold/30 transition-all"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => onDelete(brand)}
                className="p-2 bg-ink border border-white/5 text-white/40 hover:text-red-500 hover:border-red-500/30 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-3 relative">
            <p className="text-[10px] text-white/30 font-medium leading-relaxed uppercase tracking-wide line-clamp-2 italic">
              {brand.description || "NO NARRATIVE DEFINED FOR THIS ENTITY."}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                 <LinkIcon size={12} className="text-gold/40" />
                 <span className="text-[9px] font-bold text-gold/60 lowercase tracking-widest">{brand.slug}</span>
              </div>
              <span className="text-[8px] font-black text-white/10 uppercase tracking-widest">
                ID: {brand.code}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
