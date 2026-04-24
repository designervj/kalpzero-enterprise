"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Product } from "@/hook/slices/commerce/products/ProductType";
import { 
  X, 
  Loader2, 
  Tag, 
  Hash, 
  DollarSign, 
  Shield, 
  FileText, 
  Zap, 
  Box,
  Layout,
  Globe,
  Database,
  Layers,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters"),
  sku: z.string().min(2, "SKU must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  status: z.enum(["active", "inactive"]).default("active"),
  type: z.enum(["physical", "digital"]).default("physical"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      sku: initialData?.sku || "",
      description: initialData?.description || "",
      price: initialData?.price || 0,
      status: (initialData?.status as any) || "active",
      type: (initialData?.type as any) || "physical",
    },
  });

  const productName = watch("name");

  useEffect(() => {
    if (productName && !initialData?.slug) {
      const generatedSlug = productName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setValue("slug", generatedSlug);
    }
  }, [productName, setValue, initialData]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.form 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-10"
    >
      {/* Primary Identification Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="name" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Tag size={12} className="text-emerald-400" /> Asset Designation
          </Label>
          <div className="relative group">
            <Input
              id="name"
              {...register("name")}
              placeholder="E.G. QUANTUM CORE V2"
              className={cn(
                "bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-700 h-14 px-5 rounded-xl font-bold uppercase tracking-tight focus:ring-4 focus:ring-emerald-500/5 transition-all",
                errors.name ? "border-rose-500/50" : "focus:border-emerald-500/50"
              )}
            />
            <div className="absolute inset-0 rounded-xl bg-emerald-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
          {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">{errors.name.message}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="sku" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Hash size={12} className="text-cyan-400" /> Serial SKU
          </Label>
          <div className="relative group">
            <Input
              id="sku"
              {...register("sku")}
              placeholder="SKU-8829-X"
              className={cn(
                "bg-slate-950/50 border-slate-800 text-cyan-400 font-mono placeholder:text-slate-700 h-14 px-5 rounded-xl uppercase tracking-widest focus:ring-4 focus:ring-cyan-500/5 transition-all",
                errors.sku ? "border-rose-500/50" : "focus:border-cyan-500/50"
              )}
            />
            <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
          {errors.sku && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">{errors.sku.message}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="slug" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Globe size={12} className="text-blue-400" /> Network Slug
          </Label>
          <Input
            id="slug"
            {...register("slug")}
            placeholder="quantum-core-v2"
            className="bg-slate-950/50 border-slate-800 text-slate-400 font-mono h-14 px-5 rounded-xl italic focus:border-blue-500/50 transition-all"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="type" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Layers size={12} className="text-amber-400" /> Classification
          </Label>
          <select
            id="type"
            {...register("type")}
            className="w-full bg-slate-950/50 border border-slate-800 text-white h-14 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
          >
            <option value="physical" className="bg-slate-900">PHYSICAL ASSET</option>
            <option value="digital" className="bg-slate-900">DIGITAL ASSET</option>
          </select>
        </motion.div>
      </div>

      {/* Pricing & Status Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-slate-950/30 border border-slate-800/50 rounded-[2rem]">
        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="price" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <DollarSign size={12} className="text-emerald-400" /> Unit Credit (Price)
          </Label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">$</div>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              className="bg-slate-950/50 border-slate-800 text-white pl-10 pr-5 h-14 rounded-xl font-black tracking-tight focus:border-emerald-500/50 transition-all"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="status" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Shield size={12} className="text-emerald-400" /> Matrix Status
          </Label>
          <select
            id="status"
            {...register("status")}
            className="w-full bg-slate-950/50 border border-slate-800 text-white h-14 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] focus:border-emerald-500/50 outline-none appearance-none cursor-pointer"
          >
            <option value="active" className="bg-slate-900">OPERATIONAL</option>
            <option value="inactive" className="bg-slate-900">INACTIVE</option>
          </select>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="space-y-3">
        <Label htmlFor="description" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
          <FileText size={12} className="text-slate-400" /> Asset Specifications
        </Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="DETAILED TECHNICAL SPECIFICATIONS AND ASSET DATA..."
          rows={5}
          className="bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-700 rounded-2xl px-5 py-4 font-medium tracking-tight focus:border-emerald-500/50 transition-all resize-none shadow-inner"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end gap-5 pt-8 border-t border-slate-800/50">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-8 h-14 text-xs font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          Abort Protocol
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-10 h-14 rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-900/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap size={18} fill="currentColor" />
          )}
          {initialData?.id ? "Synchronize Asset" : "Initialize Asset"}
        </button>
      </motion.div>
    </motion.form>
  );
}

