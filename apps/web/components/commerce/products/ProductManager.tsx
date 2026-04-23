"use client";

import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/lib/store";
import { 
  Plus, 
  Search, 
  Package, 
  Terminal, 
  RefreshCw,
  LayoutGrid
} from "lucide-react";
import { 
  fetchProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "@/hook/slices/commerce/products/ProductThunk";
import { Product } from "@/hook/slices/commerce/products/ProductType";
import ProductForm from "./ProductForm";
import ShowProductTable from "./ShowProductTable";
import { toast } from "sonner";

export default function ProductManager() {
  const dispatch = useDispatch<AppDispatch>();
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { allProducts, isLoading } = useSelector((state: RootState) => state.product);
  const { authUser } = useSelector((state: RootState) => state.auth);
  const { currentTenant } = useSelector((state: RootState) => state.tenant);

  const handleRefresh = () => {
    if (authUser?.access_token && currentTenant?.mongo_db_name) {
      dispatch(fetchProducts({
        auth_token: authUser.access_token,
        'x-tenant-db': currentTenant.mongo_db_name
      }));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDelete = async (product: Product) => {
    if (!product.id) return;
    if (!confirm(`CONFIRM NEUTRALIZATION: Purge product "${product.name}" from inventory?`)) return;
    
    const tId = toast.loading("PURGING PRODUCT MATRIX...");
    try {
      if (authUser?.access_token && currentTenant?.mongo_db_name) {
        await dispatch(deleteProduct({ 
          id: product.id, 
          auth_token: authUser.access_token, 
          'x-tenant-db': currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("PRODUCT PURGED", { id: tId });
      }
    } catch (err: any) {
      toast.error("PURGE FAILURE", { id: tId });
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (!authUser?.access_token || !currentTenant?.mongo_db_name) return;

    const tId = toast.loading(editingProduct ? "Updating product..." : "Creating product...");
    try {
      if (editingProduct?.id) {
        await dispatch(updateProduct({ 
          id: editingProduct.id, 
          payload, 
          auth_token: authUser.access_token, 
          "x-tenant-db": currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Product matrix updated", { id: tId });
      } else {
        await dispatch(createProduct({ 
          payload, 
          auth_token: authUser.access_token, 
          "x-tenant-db": currentTenant.mongo_db_name 
        })).unwrap();
        toast.success("Product registered in matrix", { id: tId });
      }
      setIsFormOpen(false);
      setEditingProduct(null);
    } catch (err: any) {
      toast.error("Process failure: " + (err.message || "Unknown error"), { id: tId });
    }
  };

  if (isFormOpen) {
    return (
      <ProductForm 
        initialData={editingProduct} 
        onSubmit={handleFormSubmit} 
        onCancel={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
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
            Product Inventory
          </h1>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em] italic flex items-center gap-2">
            <LayoutGrid size={12} className="text-amber-500" /> Comprehensive management of physical and digital assets.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
              className="h-12 px-6 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-3"
              onClick={handleRefresh}
          >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Sync Inventory
          </button>
          <button
            className="h-12 px-10 bg-amber-600 text-white hover:bg-amber-500 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-amber-900/20"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={18} /> Register Product
          </button> 
        </div>
      </div>

      {/* Registry Controls */}
      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between bg-slate-950 p-5 rounded-none border border-white/5 shadow-2xl shadow-black/40">
        <div className="relative w-full sm:w-[400px] group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-amber-500 transition-colors"
            size={16}
          />
          <input
            placeholder="FILTER BY DESIGNATION, SKU, OR SLUG..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-12 pr-4 bg-slate-900 border border-white/10 rounded-sm text-xs font-black uppercase tracking-widest text-white placeholder:text-white/10 focus:border-amber-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-white/20 italic text-[10px] font-black uppercase tracking-widest">
          <Package size={14} /> Total Records: {allProducts?.length || 0}
        </div>
      </div>

      <ShowProductTable 
        records={allProducts || []} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
        isLoading={isLoading} 
        search={search} 
      />

      {/* Footer Intel */}
      <div className="flex items-center gap-3 opacity-40">
        <Terminal size={14} className="text-amber-500" />
        <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em]">
          Logistics Terminal: Inventory Secure | Asset Verification: Active
        </span>
      </div>
    </div>
  );
}
