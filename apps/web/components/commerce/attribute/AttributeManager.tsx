"use client";

import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import { 
  Plus, 
  Search, 
  Database, 
  Terminal, 
  Layers, 
  Upload,
  RefreshCw
} from "lucide-react";
import { 
  deleteAttributeSet, 
  fetchAttributes, 
  updateAttributeSet, 
  createAttributeSet,
  bulkImportAttributes
} from "@/hook/slices/commerce/attribute/attributeThunk";
import { AttributeSetRecord } from "@/hook/slices/commerce/attribute/attributeType";
import AttributeForm from "./AttributeForm";
import AttributeImportModal from "./AttributeImportModal";
import { toast } from "sonner";
import ShowAttributeGrid from "./ShowAttributeGrid";

export default function AttributeManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttributeSetRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const { allAttributes, isLoading } = useSelector((state: RootState) => state.attribute);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  const handleRefresh = () => {
    if (authUser?.access_token && currentTenant?.mongo_db_name) {
      dispatch(fetchAttributes({
        auth_token: authUser.access_token,
        'x-tenant-db': currentTenant.mongo_db_name
      }));
    }
  };

  const handleEdit = (record: AttributeSetRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  const handleDelete = async (record: AttributeSetRecord) => {
    const id = (record._id || record.id) as string;
    if (!confirm(`CONFIRM DESTRUCTION: Delete attribute set "${record.name}"?`)) return;
    
    const tId = toast.loading("PURGING MATRIX...");
    try {
      if (authUser?.access_token && currentTenant?.mongo_db_name) {
        await dispatch(deleteAttributeSet({ 
          id, 
          auth_token: authUser.access_token, 
          'x-tenant-db': currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("MATRIX PURGED", { id: tId });
      }
    } catch (err: any) {
      toast.error("PURGE FAILURE", { id: tId });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (!authUser?.access_token || !currentTenant?.mongo_db_name) return;

    const tId = toast.loading("Updating attribute set...");
    try {
      if (editingRecord?._id || editingRecord?.id) {
        const id = (editingRecord._id || editingRecord.id) as string;
        await dispatch(updateAttributeSet({ 
          id, 
          payload, 
          auth_token: authUser.access_token, 
          "x-tenant-db": currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Updated attribute set successfully", { id: tId });
      } else {
        await dispatch(createAttributeSet({ 
          payload, 
          auth_token: authUser.access_token, 
          "x-tenant-db": currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Created attribute set successfully", { id: tId });
      }
      setIsFormOpen(false);
      setEditingRecord(null);
    } catch (err: any) {
      toast.error("Failed to create attribute set", { id: tId });
    }
  };

  const handleImportSuccess = () => {
    handleRefresh();
    setShowImportModal(false);
  };

  if (isFormOpen) {
    return (
      <AttributeForm 
        initialData={editingRecord} 
        onSubmit={handleFormSubmit} 
        onCancel={() => {
          setIsFormOpen(false);
          setEditingRecord(null);
        }} 
        isLoading={isLoading} 
      />
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tactical Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Attribute List
          </h1>
          {/* <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
            <Layers size={12} className="text-amber-500" /> Component-level attribute
            sets for product variant generation.
          </p> */}
        </div>
        <div className="flex items-center gap-4">
          <button
            className="h-12 px-6 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"
            onClick={() => setShowImportModal(true)}
          >
            <Upload size={16} /> Bulk Manifest
          </button>
          <button
              className="h-12 px-6 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"
              onClick={handleRefresh}
          >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Sync Matrix
          </button>
          <button
            className="h-12 px-10 bg-amber-600 text-white hover:bg-amber-500 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-amber-900/20"
            onClick={() => {
              setEditingRecord(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} /> Add Attribute Set
          </button> 
        </div>
      </div>

      {/* Grid Controls */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-slate-950 p-5 rounded-none border border-white/5 shadow-2xl shadow-black/40">
        <div className="relative w-full sm:w-[400px] group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors"
            size={16}
          />
          <input
            placeholder="IDENTIFY MATRIX BY DESIGNATION OR KEY..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-slate-900 border border-white/10 rounded-sm text-xs font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:border-amber-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-white/20 italic text-[10px] font-black uppercase tracking-widest">
          <Database size={14} /> Repository Sync Active
        </div>
      </div>

      <ShowAttributeGrid 
        records={allAttributes} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
        search={search} 
      />

      {/* Footer Intel */}
      <div className="flex items-center gap-3 opacity-40">
        <Terminal size={14} className="text-amber-500" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
          Logistics Terminal: Secure Link | Stream Encryption: AES-256
        </span>
      </div>

      <AttributeImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onSuccess={handleImportSuccess} 
      />
    </div>
  );
}
