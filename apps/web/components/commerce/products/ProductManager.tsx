"use client";

import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/hook/store/store";
import { 
  Plus, 
  Search, 
  Package, 
  Terminal, 
  RefreshCw,
  LayoutGrid,
  Sparkles,
  Zap,
  Box,
  Database,
  ArrowRight,
  ChevronRight,
  X,
  Layers,
  ShoppingBag
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
import { motion, AnimatePresence } from "framer-motion";

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
    if (!confirm(`Are you sure to delete product "${product.name}"?`)) return;
    
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
    console.log("handleFormSubmit payload", payload);
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
        // isLoading={isLoading}
      />
    );
  }

  return (

    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tactical Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 border-b border-white/5 pb-8"
      >
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">
            Product
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
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <RefreshCw size={20} className={`${isLoading ? 'animate-spin' : ''} text-emerald-400`} /> Sync Repository
          </button>
          <button
            className="group h-14 px-8 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-4 rounded-2xl shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={22} strokeWidth={3} /> Register Asset
          </button>
        </div>
      </motion.header>

      {/* Registry Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-8 items-center justify-between bg-slate-900/30 backdrop-blur-md p-8 rounded-[1rem] border border-slate-800/50 shadow-2xl"
      >
        <div className="relative w-full sm:w-[500px] group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors duration-300" size={20} />
          <input
            placeholder="IDENTIFY ASSET BY SKU, NAME OR SERIAL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-16 pl-16 pr-8 bg-slate-950/50 border border-slate-800 rounded-2xl text-sm font-bold tracking-tight text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all duration-300 shadow-inner"
          />
        </div>
        <div className="flex items-center gap-6 px-8 py-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
            <span className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em]">Inventory Uplink Active</span>
          </div>
          <div className="w-[1px] h-4 bg-slate-800" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{allProducts?.length || 0} Assets Indexed</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <ShowProductTable 
          records={allProducts || []} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
          isLoading={isLoading} 
          search={search} 
        />
      </motion.div>

      {/* Premium Footer Intel */}
      <motion.footer 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="flex items-center justify-center gap-6 py-12"
      >
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
        <div className="flex items-center gap-4 px-6 py-2.5 bg-slate-900/40 rounded-full border border-slate-800/50 backdrop-blur-sm">
          <Terminal size={16} className="text-emerald-400" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
            Executive Console: Sector 4-B | Inventory Integrity: Verified
          </span>
          <Sparkles size={14} className="text-emerald-500/40" />
        </div>
        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      </motion.footer>
    </div>
  );
}

