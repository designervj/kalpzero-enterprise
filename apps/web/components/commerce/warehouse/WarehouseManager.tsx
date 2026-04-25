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
  Home
} from "lucide-react";
import { 
  fetchWarehouses, 
  deleteWarehouse, 
  saveWarehouse 
} from "@/hook/slices/commerce/warehouse/WarehouseThunk";
import { Warehouse } from "@/hook/slices/commerce/warehouse/WarehouseType";
import WarehouseForm from "./WarehouseForm";
import WarehouseTable from "./WarehouseTable";
import { toast } from "sonner";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export default function WarehouseManager() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const { allWarehouses, isLoading, isFetchedWarehouses } = useSelector((state: RootState) => state.warehouse);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  useEffect(() => {
    const editId = searchParams.get("id");
    if (editId && isFetchedWarehouses && !isFormOpen) {
      const warehouse = allWarehouses.find(w => w.id === editId);
      if (warehouse) {
        setEditingWarehouse(warehouse);
        setIsFormOpen(true);
      }
    }
  }, [searchParams, isFetchedWarehouses, allWarehouses, isFormOpen]);

  useEffect(() => {
    if (!isFetchedWarehouses && authUser?.access_token && currentTenant?.mongo_db_name) {
      handleRefresh();
    }
  }, [authUser, currentTenant, isFetchedWarehouses]);

  const handleRefresh = () => {
    if (authUser?.access_token && currentTenant?.mongo_db_name) {
      dispatch(fetchWarehouses({
        auth_token: authUser.access_token,
        'x-tenant-db': currentTenant.mongo_db_name
      }));
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsFormOpen(true);
    router.push(`${pathname}?id=${warehouse.id}`);
  };

  const handleDelete = async (warehouse: Warehouse) => {
    const id = (warehouse.id) as string;
    if (!confirm(`Are you sure to delete warehouse "${warehouse.name}"?`)) return;
    
    const tId = toast.loading("Removing warehouse...");
    try {
      if (authUser?.access_token && currentTenant?.mongo_db_name) {
        await dispatch(deleteWarehouse({ 
          id, 
          auth_token: authUser.access_token, 
          'x-tenant-db': currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Storage node removed from matrix", { id: tId });
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || "Failed to remove warehouse"), { id: tId });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (!authUser?.access_token || !currentTenant?.mongo_db_name) return;

    const tId = toast.loading(editingWarehouse ? "Updating warehouse" : "Adding new warehouse");
    try {
      const id = editingWarehouse ? (editingWarehouse.id) : undefined;
      await dispatch(saveWarehouse({ 
        id, 
        warehouseData: payload, 
        auth_token: authUser.access_token, 
        "x-tenant-db": currentTenant.mongo_db_name 
      })).unwrap();
      
      toast.success(editingWarehouse ? "Warehouse updated successfully" : "New warehouse added successfully", { id: tId });
      closeForm();
    } catch (err: any) {
      toast.error("Operation failed: " + (err.message || "Failed to update warehouse"), { id: tId });
    }
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingWarehouse(null);
    router.push(pathname);
  };

  if (isFormOpen) {
    return (
      <WarehouseForm 
        initialData={editingWarehouse} 
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
            Warehouses
          </h1>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
            <Home size={12} className="text-gold" /> Manage Warehouses.
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
              setEditingWarehouse(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} /> Add Warehouse
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
            placeholder="IDENTIFY NODE BY NAME, CODE OR CITY..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-ink border border-white/10 rounded-sm text-xs font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:border-gold outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-white/20 italic text-[10px] font-black uppercase tracking-widest">
          <Database size={14} /> Global Storage Network Active
        </div>
      </div>

      <WarehouseTable 
        warehouses={allWarehouses} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
        search={search} 
      />

      {/* Footer Intel */}
      <div className="flex items-center gap-3 opacity-40">
        <Terminal size={14} className="text-gold" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
          Warehouse Protocol: Optimized | Registry Status: Secure
        </span>
      </div>
    </div>
  );
}
