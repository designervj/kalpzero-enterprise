"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Trash, Zap } from "lucide-react";
import { VariantRow } from "@/lib/admin-products/utils";

interface VariantMatrixProps {
  variants: VariantRow[];
  onVariantsChange: (variants: VariantRow[]) => void;
}

export const VariantMatrix: React.FC<VariantMatrixProps> = ({
  variants,
  onVariantsChange,
}) => {
  const updateVariant = (id: string, field: keyof VariantRow, value: any) => {
    const next = variants.map((v) =>
      (v.id === id || v.sku === id) ? { ...v, [field]: value } : v
    );
    onVariantsChange(next);
  };

  const removeVariant = (id: string) => {
     const next = variants.filter(v => v.id !== id && v.sku !== id);
     onVariantsChange(next);
  };

  return (
    <div className="bg-charcoal border border-white/5 rounded-sm overflow-hidden shadow-2xl shadow-black/40">
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
          <Zap size={18} className="text-gold" />
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Operational Variant Grid</h3>
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{variants.length} UNITS DETECTED</span>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-ink/60 border-b border-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-6 py-5">Variant Designation</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Serial SKU</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Deployment Cost</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Supply Level</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/20 px-6">Controls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.length === 0 ? (
              <TableRow className="border-none hover:bg-transparent">
                <TableCell colSpan={5} className="h-48 text-center bg-ink/20">
                   <div className="flex flex-col items-center gap-4 opacity-10 italic">
                      <RefreshCw size={32} />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Initialize Matrix to Spawn Units</span>
                   </div>
                </TableCell>
              </TableRow>
            ) : (
              variants.map((v, idx) => (
                <TableRow key={v.id || v.sku || idx} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className="text-xs font-bold text-white uppercase tracking-tight group-hover:text-gold transition-colors italic">{v.title}</span>
                       <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">UNIT ID: {v.id?.slice(-8) || 'GEN-NEW'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <input 
                      type="text"
                      value={v.sku}
                      onChange={(e) => updateVariant(v.id || v.sku || "", "sku", e.target.value)}
                      className="w-full h-9 bg-ink border border-white/10 rounded-sm px-3 text-[10px] font-black text-white/60 focus:border-gold outline-none"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                       <span className="absolute left-2 top-1/2 -translate-y-1/2 text-white/20 text-[10px] font-bold">$</span>
                       <input 
                         type="text"
                         value={v.price}
                         onChange={(e) => updateVariant(v.id || v.sku || "", "price", Number(e.target.value) || 0)}
                         className="w-full h-9 bg-ink border border-white/10 rounded-sm pl-5 pr-2 text-[10px] font-black text-gold focus:border-gold outline-none"
                       />
                    </div>
                  </TableCell>
                  <TableCell>
                    <input 
                      type="text"
                      value={v.stock}
                      onChange={(e) => updateVariant(v.id || v.sku || "", "stock", Number(e.target.value) || 0)}
                      className="w-full h-9 bg-ink border border-white/10 rounded-sm px-3 text-[10px] font-black text-white focus:border-gold outline-none"
                    />
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <button 
                      onClick={() => removeVariant(v.id || v.sku || "")}
                      className="p-2 bg-white/5 border border-white/5 text-white/20 hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/10 transition-all rounded-sm shadow-xl active:scale-95"
                    >
                       <Trash size={14} />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
