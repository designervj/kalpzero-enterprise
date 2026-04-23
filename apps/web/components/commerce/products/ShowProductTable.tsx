"use client";

import React, { useMemo } from "react";
import { Edit, Trash, Package, ShieldCheck, ShieldAlert, Eye } from "lucide-react";
import { Product } from "@/hook/slices/commerce/products/ProductType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ShowProductTableProps {
  records: Product[];
  onEdit: (record: Product) => void;
  onDelete: (record: Product) => void;
  isLoading: boolean;
  search: string;
}

export default function ShowProductTable({
  records,
  onEdit,
  onDelete,
  isLoading,
  search,
}: ShowProductTableProps) {
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
    <div className="bg-slate-950 border border-white/5 rounded-none overflow-hidden shadow-2xl shadow-black/80">
      <Table>
        <TableHeader className="bg-slate-900/60 border-b border-white/5">
          <TableRow className="hover:bg-transparent border-none h-16">
            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 px-8">
              Product Designation
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
              SKU / Serial
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
              Unit Credit (Price)
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
              Status
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
              Type
            </TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.25em] text-white/40 px-8">
              Calibration (Actions)
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((product) => (
            <TableRow key={product.id} className="group border-slate-900 hover:bg-white/[0.02] transition-colors">
              <TableCell className="px-8 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                    {product.name}
                  </span>
                  <span className="text-[9px] font-mono font-bold text-white/20 uppercase tracking-widest italic">
                    /{product.slug}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[10px] font-mono font-bold text-amber-500/60 uppercase tracking-widest px-2 py-0.5 bg-slate-900 border border-amber-500/10 rounded-sm">
                  {product.sku || "NO-SKU"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-xs font-black text-white tracking-widest">
                  ${product.price?.toFixed(2) || "0.00"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    product.status === "active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500"
                  }`} />
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    product.status === "active" ? "text-emerald-500" : "text-rose-500"
                  }`}>
                    {product.status || "INACTIVE"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {product.type || "PHYSICAL"}
                </span>
              </TableCell>
              <TableCell className="text-right px-8">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => window.open(`/commerce/product/${product.id}`, '_blank')}
                    className="h-9 w-9 bg-slate-900 border border-white/5 text-white/40 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center"
                    title="View Product"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="h-9 w-9 bg-slate-900 border border-white/5 text-white/40 hover:text-amber-500 hover:border-amber-500/30 transition-all flex items-center justify-center"
                    title="Edit Product"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="h-9 w-9 bg-slate-900 border border-white/5 text-white/40 hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center justify-center"
                    title="Delete Product"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
