"use client";
import React, { useMemo } from "react";
import { Edit, Trash, Settings, Layers, ChevronRight, Activity, Zap } from "lucide-react";
import { AttributeSetRecord } from "@/hook/slices/commerce/attribute/attributeType";
import { motion, AnimatePresence } from "framer-motion";

interface ShowAttributeTableProps {
  records: AttributeSetRecord[];
  onEdit: (record: AttributeSetRecord) => void;
  onDelete: (record: AttributeSetRecord) => void;
  isLoading: boolean;
  search: string;
}

export default function ShowAttributeTable({
  records,
  onEdit,
  onDelete,
  isLoading,
  search,
}: ShowAttributeTableProps) {
  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return records;
    return records.filter(
      (r) =>
        r.name?.toLowerCase().includes(keyword) ||
        r.key?.toLowerCase().includes(keyword),
    );
  }, [records, search]);

  if (isLoading && records.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-900/20 backdrop-blur-md rounded-[2.5rem] border border-slate-800/50 shadow-2xl">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin" />
          <div className="absolute inset-0 h-16 w-16 bg-amber-500/20 blur-xl rounded-full animate-pulse" />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.4em] text-slate-400 animate-pulse">
          Syncing Neural Matrix...
        </span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-900/10 backdrop-blur-sm rounded-[2.5rem] border border-slate-800/30 border-dashed">
        <div className="p-4 bg-slate-800/50 rounded-2xl">
          <Layers size={40} className="text-slate-600" />
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.4em] text-slate-600">
          No Matrix Nodes Detected
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <AnimatePresence mode="popLayout">
        {filtered.map((record, idx) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            key={record._id || record.id}
            className="group relative bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-8 rounded-[1rem] hover:bg-slate-800/60 hover:border-amber-500/30 transition-all duration-500 shadow-xl hover:shadow-amber-500/5 overflow-hidden"
          >
            {/* Hover decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-indigo-500/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 group-hover:border-amber-500/50 transition-colors">
                      <Zap size={14} className="text-amber-400" />
                    </div>
                    <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors duration-300">
                      {record.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-950/80 text-amber-500/80 rounded-md border border-amber-500/20 uppercase tracking-wider">
                      {record.key}
                    </span>
                    <div className="h-1 w-1 rounded-full bg-slate-700" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Activity size={10} className="text-emerald-500" />
                      {record.attributes?.length || 0} Logic Nodes
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                  <button
                    onClick={() => onEdit(record)}
                    className="p-2.5 bg-slate-900/80 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl border border-slate-800 hover:border-amber-500/30 transition-all"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(record)}
                    className="p-2.5 bg-slate-900/80 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-slate-800 hover:border-rose-500/30 transition-all"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 py-6 border-y border-slate-800/50 mb-6">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Field Configuration</p>
                {(record.attributes || []).slice(0, 3).map((a, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center px-4 py-2 bg-slate-950/30 rounded-xl border border-slate-800/30 group-hover:border-slate-700/50 transition-colors"
                  >
                    <span className="text-xs font-semibold text-slate-300">{a.label}</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-900/50 rounded border border-slate-800">{a.type}</span>
                  </div>
                ))}
                {(record.attributes || []).length > 3 && (
                  <div className="pt-2 flex justify-center">
                    <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-[0.2em] px-3 py-1 bg-amber-500/5 rounded-full border border-amber-500/10">
                      + {(record.attributes || []).length - 3} OVERFLOW NODES
                    </span>
                  </div>
                )}
              </div>

              {record.description && (
                <div className="mt-auto">
                   <p className="text-xs font-medium text-slate-500 line-clamp-2 italic leading-relaxed">
                    "{record.description}"
                  </p>
                </div>
              )}
              
              <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
                <ChevronRight size={20} className="text-amber-500/20" />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
