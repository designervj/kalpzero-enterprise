"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import { 
  Plus, 
  Search, 
  Database, 
  Terminal, 
  Layers, 
  Upload,
  RefreshCw,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <div className="max-w-7xl mx-auto space-y-10 mt-4 relative z-10">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      {/* Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="px-0 py-2  rounded-[2.5rem] shadow-2xl shadow-black/20"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 shadow-lg shadow-amber-500/5">
              <Layers className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
                Attribute <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Matrix</span>
              </h1>
              <p className="text-slate-400 mt-2 text-base max-w-xl font-medium leading-relaxed">
                Manage component-level attribute sets for product <br></br> variant generation and logic-driven commerce fields.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="group relative h-12 px-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-sm transition-all duration-300 flex items-center gap-3 overflow-hidden"
              onClick={() => setShowImportModal(true)}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Upload size={18} className="text-amber-400" /> Bulk Manifest
            </button>
            <button
              className="group relative h-12 px-6 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-sm transition-all duration-300 flex items-center gap-3 overflow-hidden"
              onClick={handleRefresh}
            >
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''} text-indigo-400`} /> Sync Matrix
            </button>
            <button
              className="group relative h-12 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-lg shadow-amber-900/20 hover:shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-3 overflow-hidden"
              onClick={() => {
                setEditingRecord(null);
                setIsFormOpen(true);
              }}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <Plus size={20} /> Add Set
            </button> 
          </div>
        </div>
      </motion.header>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-slate-900/30 backdrop-blur-md p-6 rounded-[1rem] border border-slate-800/50 shadow-xl"
      >
        <div className="relative w-full sm:w-[450px] group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors duration-300"
            size={18}
          />
          <input
            placeholder="IDENTIFY MATRIX BY DESIGNATION OR KEY..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-14 pr-6 bg-slate-950/50 border border-slate-800 rounded-2xl text-sm font-medium text-white placeholder:text-slate-600 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 shadow-inner"
          />
        </div>
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-emerald-400/80 text-xs font-bold uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <Database size={14} /> Repository Sync Active
        </div>
      </motion.div>

      {/* Grid Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <ShowAttributeGrid 
          records={allAttributes} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          isLoading={isLoading} 
          search={search} 
        />
      </motion.div>

      {/* Premium Footer Intel */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 1, delay: 1 }}
        className="flex items-center justify-center gap-4 py-8"
      >
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/40 rounded-full border border-slate-800/50">
          <Terminal size={14} className="text-amber-500" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Logistics Terminal: Secure Link | AES-256
          </span>
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      </motion.div>

      <AttributeImportModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
        onSuccess={handleImportSuccess} 
      />
    </div>
  );
}
