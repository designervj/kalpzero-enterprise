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
  Truck
} from "lucide-react";
import { 
  fetchVendors, 
  deleteVendor, 
  saveVendor 
} from "@/hook/slices/commerce/vendor/VendorThunk";
import { Vendor } from "@/hook/slices/commerce/vendor/VendorType";
import VendorForm from "./VendorForm";
import VendorTable from "./VendorTable";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function VendorManager() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const { allVendors, isLoading, isFetchedVendors } = useSelector((state: RootState) => state.vendor);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  // Check for ID in search params for direct edit access
  useEffect(() => {
    const editId = searchParams.get("id");
    if (editId && isFetchedVendors && !isFormOpen) {
      const vendor = allVendors.find(v => v.id === editId);
      if (vendor) {
        setEditingVendor(vendor);
        setIsFormOpen(true);
      }
    }
  }, [searchParams, isFetchedVendors, allVendors, isFormOpen]);

  useEffect(() => {
    if (!isFetchedVendors && authUser?.access_token && currentTenant?.mongo_db_name) {
      handleRefresh();
    }
  }, [authUser, currentTenant, isFetchedVendors]);

  const handleRefresh = () => {
    if (authUser?.access_token && currentTenant?.mongo_db_name) {
      dispatch(fetchVendors({
        auth_token: authUser.access_token,
        'x-tenant-db': currentTenant.mongo_db_name
      }));
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsFormOpen(true);
    // Update URL to reflect editing state if desired
    router.push(`${pathname}?id=${vendor.id}`);
  };

  const handleDelete = async (vendor: Vendor) => {
    const id = (vendor.id) as string;
    if (!confirm(`Are you sure to delete vendor "${vendor.name}"?`)) return;
    
    const tId = toast.loading("Decommissioning vendor...");
    try {
      if (authUser?.access_token && currentTenant?.mongo_db_name) {
        await dispatch(deleteVendor({ 
          id, 
          auth_token: authUser.access_token, 
          'x-tenant-db': currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Vendor removed from matrix", { id: tId });
      }
    } catch (err: any) {
      toast.error("Decommission failure: " + (err.message || "Unknown error"), { id: tId });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (!authUser?.access_token || !currentTenant?.mongo_db_name) return;

    const tId = toast.loading(editingVendor ? "Recalibrating vendor intel..." : "Deploying vendor asset...");
    try {
      const id = editingVendor ? (editingVendor.id) : undefined;
      await dispatch(saveVendor({ 
        id, 
        vendorData: payload, 
        auth_token: authUser.access_token, 
        "x-tenant-db": currentTenant.mongo_db_name 
      })).unwrap();
      
      toast.success(editingVendor ? "Vendor intel recalibrated" : "Vendor asset deployed", { id: tId });
      closeForm();
    } catch (err: any) {
      toast.error("Vendor not added: " + (err.message || "Unknown error"), { id: tId });
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
    router.push(pathname); // Clear ID from URL
  };

  if (isFormOpen) {
    return (
      <VendorForm 
        initialData={editingVendor} 
        onSubmit={handleFormSubmit} 
        onCancel={closeForm} 
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
            Vendor <span className="text-gold">Registry</span>
          </h1>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
            <Truck size={12} className="text-gold" /> Manage supply chain entities and vendor intelligence.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
              className="h-12 px-6 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"
              onClick={handleRefresh}
          >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Sync Registry
          </button>
          <button
            className="h-12 px-10 bg-olive text-white hover:bg-olive-lt font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-olive/20"
            onClick={() => {
              setEditingVendor(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} /> Onboard Vendor
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
            placeholder="IDENTIFY VENDOR BY NAME, CODE OR CONTACT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-ink border border-white/10 rounded-sm text-xs font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:border-gold outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-white/20 italic text-[10px] font-black uppercase tracking-widest">
          <Database size={14} /> Global Supply Node Active
        </div>
      </div>

      <VendorTable 
        vendors={allVendors} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
        search={search} 
      />

      {/* Footer Intel */}
      <div className="flex items-center gap-3 opacity-40">
        <Terminal size={14} className="text-gold" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
          Vendor Protocol: High Priority | Registry Encryption: Grade A
        </span>
      </div>
    </div>
  );
}
