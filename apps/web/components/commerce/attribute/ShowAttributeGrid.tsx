"use client";

import React, { useMemo } from "react";
import { Edit, Trash, Settings, Layers } from "lucide-react";
import { AttributeSetRecord } from "@/hook/slices/commerce/attribute/attributeType";

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
      <div className="h-64 flex flex-col items-center justify-center gap-4 bg-slate-950 border border-white/5">
        <div className="h-8 w-8 border-2 border-white/5 border-t-amber-500 rounded-full animate-spin shadow-lg shadow-amber-500/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic animate-pulse">
          Decoding Attribute Matrix...
        </span>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-6 bg-slate-950 border border-white/5 opacity-10">
        <Layers size={48} />
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">
          Matrix Node Registry Vacant
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((record) => (
        <div
          key={record._id || record.id}
          className="bg-slate-950 border border-white/5 p-6 space-y-4 hover:border-amber-500/30 transition-all group shadow-2xl shadow-black/40"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-sm font-black text-white uppercase tracking-widest group-hover:text-amber-500 transition-colors">
                {record.name}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold text-amber-500/60 uppercase tracking-widest px-2 py-0.5 bg-slate-900 border border-amber-500/10">
                  {record.key}
                </span>
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                  {record.attributes?.length || 0} LOGIC FIELDS
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(record)}
                className="p-2 text-white/10 hover:text-amber-500 hover:bg-amber-500/10 transition-all"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => onDelete(record)}
                className="p-2 text-white/10 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-white/5">
            {(record.attributes || []).slice(0, 3).map((a, i) => (
              <div
                key={i}
                className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest"
              >
                <span className="text-white/40">{a.label}</span>
                <span className="text-white/20 italic">{a.type}</span>
              </div>
            ))}
            {(record.attributes || []).length > 3 && (
              <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em] pt-1">
                + {(record.attributes || []).length - 3} ADDITIONAL FIELDS
                DETECTED
              </p>
            )}
          </div>

          {record.description && (
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-tight italic line-clamp-2 pt-2 border-t border-white/5">
              {record.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
