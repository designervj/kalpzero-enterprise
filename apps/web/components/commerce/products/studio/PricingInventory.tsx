"use client";

import React from "react";
import { DollarSign, Percent, ShieldAlert, Zap } from "lucide-react";

interface PricingInventoryProps {
  pricing: {
    price: string | number;
    compareAtPrice?: string | number;
    costPerItem?: string | number;
    chargeTax?: boolean;
    trackQuantity?: boolean;
    quantity?: number;
  };
  onPricingChange: (field: string, value: any) => void;
}

export const PricingInventory: React.FC<PricingInventoryProps> = ({
  pricing,
  onPricingChange,
}) => {
  return (
    <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-8 shadow-2xl shadow-black/40">
      <div className="flex items-center gap-3 border-l-2 border-gold pl-4">
        <Zap size={18} className="text-gold" />
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Economics & Logistics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Price Field */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <DollarSign size={12} className="text-emerald-400" /> Product Cost
          </label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">$</span>
             <input
                type="text"
                value={pricing.price}
                onChange={(e) => onPricingChange("price", e.target.value)}
                placeholder="199.99"
                className="w-full h-12 bg-ink border border-white/10 rounded-sm pl-8 pr-4 text-sm font-black text-white focus:border-gold outline-none transition-all"
             />
          </div>
        </div>

        {/* Compare At Price Field */}
        <div className="space-y-3 opacity-60">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Percent size={12} className="text-gold" /> Product Retail Price
          </label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 font-bold">$</span>
             <input
                type="text"
                value={pricing.compareAtPrice || ""}
                onChange={(e) => onPricingChange("compareAtPrice", e.target.value)}
                placeholder="249.99"
                className="w-full h-12 bg-ink border border-white/10 rounded-sm pl-8 pr-4 text-sm font-black text-white/40 line-through decoration-gold/40 focus:border-gold outline-none transition-all"
             />
          </div>
        </div>

        {/* Cost Per Item Field */}
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <ShieldAlert size={12} className="text-slate-500" /> Operational Cost
          </label>
          <div className="relative">
             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-bold">$</span>
             <input
                type="text"
                value={pricing.costPerItem || ""}
                onChange={(e) => onPricingChange("costPerItem", e.target.value)}
                placeholder="85.00"
                className="w-full h-12 bg-ink border border-white/10 rounded-sm pl-8 pr-4 text-sm font-black text-white/60 focus:border-gold outline-none transition-all"
             />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-white/5 flex flex-wrap items-center gap-8">
          <label className="flex items-center gap-3 cursor-pointer group">
             <div className="relative">
                <input 
                  type="checkbox" 
                  className="peer hidden" 
                  checked={pricing.chargeTax}
                  onChange={(e) => onPricingChange("chargeTax", e.target.checked)}
                />
                <div className="h-6 w-11 bg-ink border border-white/10 rounded-full peer-checked:bg-emerald-500/20 peer-checked:border-emerald-500/40 transition-all duration-300" />
                <div className="absolute top-1 left-1 h-4 w-4 bg-white/20 rounded-full peer-checked:bg-emerald-400 peer-checked:translate-x-5 transition-all duration-300" />
             </div>
             <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">Enforce Tax Logistics</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
             <div className="relative">
                <input 
                  type="checkbox" 
                  className="peer hidden" 
                  checked={pricing.trackQuantity}
                  onChange={(e) => onPricingChange("trackQuantity", e.target.checked)}
                />
                <div className="h-6 w-11 bg-ink border border-white/10 rounded-full peer-checked:bg-gold/20 peer-checked:border-gold/40 transition-all duration-300" />
                <div className="absolute top-1 left-1 h-4 w-4 bg-white/20 rounded-full peer-checked:bg-gold peer-checked:translate-x-5 transition-all duration-300" />
             </div>
             <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors uppercase tracking-widest">Track Supply Stream</span>
          </label>
      </div>
    </div>
  );
};
