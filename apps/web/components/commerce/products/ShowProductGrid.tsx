"use client";

import React, { useMemo } from "react";
import { Edit, Trash, Package, ShieldCheck, ShieldAlert } from "lucide-react";
import { Product } from "@/hook/slices/commerce/products/ProductType";

interface ShowProductGridProps {
  records: Product[];
  onEdit: (record: Product) => void;
  onDelete: (record: Product) => void;
  isLoading: boolean;
  search: string;
}

export default function ShowProductGrid({
  records,
  onEdit,
  onDelete,
  isLoading,
  search,
}: ShowProductGridProps) {
  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return records;
    return records.filter(
      (r) =>
        r.name?.toLowerCase().includes(keyword) ||
        r.sku?.toLowerCase().includes(keyword) ||
        r.slug?.toLowerCase().includes(keyword)
    );
  }, [records, search]);

  if (isLoading && records.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-slate-950 border border-white/5">
        <div className="h-8 w-8 border-2 border-white/5 border-t-amber-500 rounded-full animate-spin shadow-lg shadow-amber-500/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic animate-pulse">
          Accessing Inventory Matrix...
        </span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-950 border border-white/5 opacity-10">
        <Package size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">
          Product Registry Vacant
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((product) => (
        <div
          key={product.id}
          className="bg-slate-950 border border-white/5 p-6 space-y-4 hover:border-amber-500/30 transition-all group shadow-2xl shadow-black/40 relative overflow-hidden"
        >
          {/* Status Indicator */}
          <div className="absolute top-0 right-0 p-1">
            {product.status === "active" ? (
              <ShieldCheck size={12} className="text-emerald-500 opacity-20" />
            ) : (
              <ShieldAlert size={12} className="text-rose-500 opacity-20" />
            )}
          </div>

          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                {product.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold text-amber-500/60 uppercase tracking-widest px-2 py-0.5 bg-slate-900 border border-amber-500/10">
                  {product.sku || "NO-SKU"}
                </span>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                  {product.type || "PHYSICAL"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(product)}
                className="p-2 text-white/10 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => onDelete(product)}
                className="p-2 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">
                Unit Credit
              </span>
              <span className="text-xs font-black text-white tracking-widest">
                ${product.price?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest block">
                Status
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest ${
                product.status === "active" ? "text-emerald-500" : "text-rose-500"
              }`}>
                {product.status || "INACTIVE"}
              </span>
            </div>
          </div>

          {product.description && (
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-tight italic line-clamp-2 pt-2 border-t border-white/5">
              {product.description}
            </p>
          )}

          {/* Footer Metadata */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-1">
              {product.categoryIds?.slice(0, 2).map((cat, idx) => (
                <span key={idx} className="text-[7px] font-black text-white/10 bg-white/5 px-1 uppercase tracking-tighter">
                  CAT-{idx + 1}
                </span>
              ))}
            </div>
            <span className="text-[7px] font-mono text-white/5 uppercase">
              UUID: {product.id?.slice(0, 8)}...
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
