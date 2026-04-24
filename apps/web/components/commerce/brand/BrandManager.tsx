"use client";

import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/hook/store/store";
import { 
  Plus, 
  Search, 
  Database, 
  Terminal, 
  RefreshCw,
  LayoutGrid
} from "lucide-react";
import { 
  fetchBrands, 
  deleteBrand, 
  saveBrand 
} from "@/hook/slices/commerce/brand/BrandThunk";
import { Brand } from "@/hook/slices/commerce/brand/BrandType";
import BrandForm from "./BrandForm";
import BrandTable from "./BrandTable";
import { toast } from "sonner";

export default function BrandManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const { allBrands, isLoading, isFetchedBrands } = useSelector((state: RootState) => state.brand);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    if (!isFetchedBrands && authUser?.access_token && currentTenant?.mongo_db_name) {
      handleRefresh();
    }
  }, [authUser, currentTenant, isFetchedBrands]);

  const handleRefresh = () => {
    if (authUser?.access_token && currentTenant?.mongo_db_name) {
      dispatch(fetchBrands({
        auth_token: authUser.access_token,
        'x-tenant-db': currentTenant.mongo_db_name
      }));
    }
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setIsFormOpen(true);
  };

  const handleDelete = async (brand: Brand) => {
    const id = (brand.id) as string;
    if (!confirm(`Are you sure to delete brand "${brand.name}"?`)) return;
    
    const tId = toast.loading("Deleting brand...");
    try {
      if (authUser?.access_token && currentTenant?.mongo_db_name) {
        await dispatch(deleteBrand({ 
          id, 
          auth_token: authUser.access_token, 
          'x-tenant-db': currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Brand deleted successfully", { id: tId });
      }
    } catch (err: any) {
      toast.error("Deletion failed: " + (err.message || "Unknown error"), { id: tId });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (!authUser?.access_token || !currentTenant?.mongo_db_name) return;

    const tId = toast.loading(editingBrand ? "Recalibrating brand..." : "Deploying brand...");
    try {
      const id = editingBrand ? (editingBrand.id) : undefined;
      await dispatch(saveBrand({ 
        id, 
        brandData: payload, 
        auth_token: authUser.access_token, 
        "x-tenant-db": currentTenant.mongo_db_name 
      })).unwrap();
      
      toast.success(editingBrand ? "Brand recalibrated successfully" : "Brand deployed successfully", { id: tId });
      setIsFormOpen(false);
      setEditingBrand(null);
    } catch (err: any) {
      toast.error("Deployment failure: " + (err.message || "Unknown error"), { id: tId });
    }
  };

  if (isFormOpen) {
    return (
      <BrandForm 
        initialData={editingBrand} 
        onSubmit={handleFormSubmit} 
        onCancel={() => {
          setIsFormOpen(false);
          setEditingBrand(null);
        }} 
        isLoading={isLoading} 
      />
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Tactical Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Brand 
          </h1>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
            <LayoutGrid size={12} className="text-gold" /> Manage brand identities and resource mapping.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
              className="h-12 px-6 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"
              onClick={handleRefresh}
          >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Sync Matrix
          </button>
          <button
            className="h-12 px-10 bg-olive text-white hover:bg-olive-lt font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-olive/20"
            onClick={() => {
              setEditingBrand(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} /> Establish Brand
          </button> 
        </div>
      </div>

      {/* Grid Controls */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-charcoal p-5 rounded-none border border-white/5 shadow-2xl shadow-black/40">
        <div className="relative w-full sm:w-[400px] group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors"
            size={16}
          />
          <input
            placeholder="IDENTIFY BRAND BY DESIGNATION OR CODE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-ink border border-white/10 rounded-sm text-xs font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:border-gold outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-white/20 italic text-[10px] font-black uppercase tracking-widest">
          <Database size={14} /> Repository Sync Active
        </div>
      </div>

      <BrandTable 
        brands={allBrands} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
        search={search} 
      />

      {/* Footer Intel */}
      <div className="flex items-center gap-3 opacity-40">
        <Terminal size={14} className="text-gold" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
          Brand Protocol: Secure Link | Stream Encryption: AES-256
        </span>
      </div>
    </div>
  );
}
