"use client";

import React, { useState } from "react";
import { X, Package, Shield, Save, Tag, Layers, FileText } from "lucide-react";
import { Product } from "@/hook/slices/commerce/products/ProductType";

interface ProductFormProps {
  initialData: Product | null;
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function createEmptyDraft(): Partial<Product> {
  return {
    name: "",
    slug: "",
    sku: "",
    price: 0,
    status: "active",
    type: "physical",
    description: "",
    categoryIds: [],
  };
}

export default function ProductForm({ initialData, onSubmit, onCancel, isLoading }: ProductFormProps) {
  const [form, setForm] = useState<Partial<Product>>(
    initialData || createEmptyDraft()
  );

  const handleSave = async () => {
    // Ensure numeric price
    const payload = {
      ...form,
      price: Number(form.price),
    };
    await onSubmit(payload);
  };

  return (
    <div className="bg-slate-950 border-l-4 border-amber-500 p-8 space-y-8 shadow-2xl shadow-black/60 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-900 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Package size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">
              {initialData ? "Modify Product Matrix" : "Add New Product"}
            </h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic mt-1">
              Configure inventory specifications and distribution parameters.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="h-10 w-10 bg-slate-900 border border-white/5 text-white/20 hover:text-white transition-all flex items-center justify-center"
        >
          <X size={18} />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Tag size={12} className="text-amber-500" /> Designation
          </label>
          <input
            placeholder="e.g. TACTICAL OVERLAY V1"
            value={form.name}
            onChange={(e) => {
              const val = e.target.value;
              setForm((prev) => ({
                ...prev,
                name: val,
                slug: val.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
              }));
            }}
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-black text-white uppercase tracking-widest focus:border-amber-500 outline-none"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Layers size={12} className="text-amber-500" /> Serial Key (SLUG)
          </label>
          <input
            placeholder="tactical-overlay-v1"
            value={form.slug}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9-]/g, "-"),
              }))
            }
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-mono font-bold text-amber-500 lowercase tracking-widest focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            SKU (Stock Keeping Unit)
          </label>
          <input
            placeholder="SKU-001-X"
            value={form.sku}
            onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-bold text-white uppercase tracking-widest focus:border-amber-500 outline-none"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Unit Credit (Price)
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value as any }))}
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-black text-amber-500 tracking-widest focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Registry Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as any }))}
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-black text-white uppercase tracking-widest focus:border-amber-500 outline-none appearance-none"
          >
            <option value="active">ACTIVE</option>
            <option value="inactive">INACTIVE</option>
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Product Category (Type)
          </label>
          <select
            value={form.type}
            onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as any }))}
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-black text-white uppercase tracking-widest focus:border-amber-500 outline-none appearance-none"
          >
            <option value="physical">PHYSICAL ASSET</option>
            <option value="digital">DIGITAL ASSET</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
          <FileText size={12} className="text-amber-500" /> Asset Intelligence (Description)
        </label>
        <textarea
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="DESCRIBE PRODUCT CAPABILITIES..."
          className="w-full h-32 bg-slate-900 border border-white/10 rounded-sm p-4 text-xs font-bold text-white uppercase tracking-widest focus:border-amber-500 outline-none resize-none"
        />
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-8 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white"
        >
          Abort
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="h-12 px-12 bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-amber-900/20 flex items-center gap-3"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Shield size={16} />
          )}
          {initialData ? "Sync Product Matrix" : "Register New Product"}
        </button>
      </div>
    </div>
  );
}
