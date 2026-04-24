"use client";

import React, { useMemo } from "react";
import { Edit, Trash, Package, ShieldCheck, ShieldAlert, Eye, DollarSign, Tag, Boxes, Layers, ChevronRight, Sparkles, Box } from "lucide-react";
import { Product } from "@/hook/slices/commerce/products/ProductType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/lib/store";
import { setCurrentProduct } from "@/hook/slices/commerce/products/ProductSlice";

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
  const router = useRouter();

 const dispatch= useDispatch<AppDispatch>();

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
      <div className="h-80 flex flex-col items-center justify-center gap-6 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[3rem]">
        <div className="h-12 w-12 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
        <span className="text-sm font-black uppercase tracking-[0.4em] text-slate-500 italic animate-pulse">
          Synchronizing Inventory Matrix...
        </span>
      </div>
    );
  }
const handleView = (product: Product) => {
  dispatch(setCurrentProduct(product))
    router.push(`/commerce/product/${product.id}`);
}
  if (filtered.length === 0) {
    return (
      <div className="h-80 flex flex-col items-center justify-center gap-8 bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[3rem] opacity-20 group">
        <div className="p-8 bg-slate-900 rounded-[2rem] border border-slate-800 group-hover:scale-110 transition-transform duration-500">
          <Package size={64} className="text-slate-400" />
        </div>
        <span className="text-sm font-black uppercase tracking-[0.5em] text-slate-500">
          No Assets Detected in Sector
        </span>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/50 rounded-[1rem] overflow-hidden shadow-2xl shadow-black/40">
      <Table>
        <TableHeader className="bg-slate-900/60 border-b border-slate-800/50 h-20">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-10">
              Asset Designation
            </TableHead>
            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              SKU / Serial
            </TableHead>
            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              Unit Credit
            </TableHead>
            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">
              Classification
            </TableHead>
            <TableHead className="text-right text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 px-10">
              Control
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((product) => (
            <TableRow key={product.id} className="group border-slate-800/40 hover:bg-emerald-500/[0.03] transition-all duration-300">
              <TableCell className="px-10 py-5">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 group-hover:scale-105 transition-all duration-300">
                    <Box size={22} />
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                      {product.name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      /{product.slug}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-emerald-500/20 transition-colors">
                  <Tag size={12} className="text-emerald-500/50" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400/80 uppercase tracking-widest">
                    {product.sku || "UNSERIALIZED"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-slate-500" />
                  <span className="text-base font-black text-white tracking-tight">
                    {product.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border ${
                  product.status === "active" 
                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/5 border-rose-500/20 text-rose-400"
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    product.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                  }`} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {product.status || "INACTIVE"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Layers size={14} className="text-slate-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {product.type || "PHYSICAL"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right px-10">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <button
                    onClick={() => handleView(product)}
                    className="h-9 w-9 bg-slate-900 border border-white/5 text-white/40 hover:text-indigo-400 hover:border-indigo-500/30 transition-all flex items-center justify-center"
                   title="View Asset"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(product)}
                    className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-cyan-500/10"
                    title="Calibrate Asset"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(product)}
                    className="h-10 w-10 bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-500 hover:border-rose-500/50 transition-all flex items-center justify-center rounded-xl hover:shadow-lg hover:shadow-rose-500/10"
                    title="Purge Asset"
                  >
                    <Trash size={16} />
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

