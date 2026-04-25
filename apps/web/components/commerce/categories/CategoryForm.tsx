"use client"

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CategoryType } from '@/hook/slices/commerce/category/categoryType';
import { X, Loader2, Globe, Layout, Shield, FileText, Tag, Hash, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/hook/store/store';
import { setCurrentCategories } from '@/hook/slices/commerce/category/categorySlice';
import { motion } from 'framer-motion';

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters'),
  type: z.string().optional(),
  description: z.string().optional(),
  pageStatus: z.enum(['active', 'draft']).default('active'),
  parentId: z.string().optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Partial<CategoryType>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
  allCategories?: CategoryType[];
}

export default function CategoryForm({ initialData, onSubmit, onCancel, isLoading, allCategories = [] }: CategoryFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { currentCategories } = useSelector((state: RootState) => state.category);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      type: initialData?.type || 'standard',
      description: initialData?.description || '',
      pageStatus: (initialData?.pageStatus as any) || 'active',
      parentId: (initialData as any)?.parentId || (currentCategories as any)?.id || (currentCategories as any)?._id || null,
      metaTitle: initialData?.metaTitle || '',
      metaDescription: initialData?.metaDescription || '',
    },
  });

  const categoryName = watch('name');
  const editingId = (initialData as any)?._id || (initialData as any)?.id;

  useEffect(() => {
    if (categoryName && !initialData?.slug && !editingId) {
      const generatedSlug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug);
    }
  }, [categoryName, setValue, initialData, editingId]);

  const handleCancel = () => {
    onCancel();
    dispatch(setCurrentCategories(null));
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="name" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Tag size={12} className="text-indigo-400" /> Hub Designation
          </Label>
          <div className="relative group">
            <Input 
              id="name" 
              {...register('name')} 
              placeholder="E.G. TACTICAL APPAREL"
              className={cn(
                "bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-700 h-14 px-5 rounded-xl font-bold uppercase tracking-tight focus:ring-4 focus:ring-indigo-500/5 transition-all",
                errors.name ? 'border-rose-500/50' : 'focus:border-indigo-500/50'
              )}
            />
            <div className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
          {errors.name && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">{errors.name.message}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="slug" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Hash size={12} className="text-cyan-400" /> Network Slug
          </Label>
          <div className="relative group">
            <Input 
              id="slug" 
              {...register('slug')} 
              placeholder="tactical-apparel"
              className={cn(
                "bg-slate-950/50 border-slate-800 text-cyan-400 font-mono placeholder:text-slate-700 h-14 px-5 rounded-xl italic focus:ring-4 focus:ring-cyan-500/5 transition-all",
                errors.slug ? 'border-rose-500/50' : 'focus:border-cyan-500/50'
              )}
            />
            <div className="absolute inset-0 rounded-xl bg-cyan-500/5 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
          </div>
          {errors.slug && <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest pl-1">{errors.slug.message}</p>}
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="type" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Zap size={12} className="text-amber-400" /> Taxonomy Type
          </Label>
          <Input 
            id="type" 
            {...register('type')} 
            placeholder="E.G. ASSET CATALOG"
            className="bg-slate-950/50 border-slate-800 text-white placeholder:text-slate-700 h-14 px-5 rounded-xl font-bold uppercase tracking-tight focus:border-indigo-500/50 transition-all"
          />
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="parentId" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Layout size={12} className="text-indigo-400" /> Parent Node
          </Label>
          <div className="relative">
            <Input 
              id="parentName" 
              value={currentCategories?.name || 'ROOT DIRECTORY'} 
              readOnly
              className="bg-slate-950/30 border-slate-800/50 text-indigo-400 h-14 px-5 rounded-xl uppercase tracking-widest cursor-not-allowed font-black text-xs italic"
            />
            <input 
              type="hidden" 
              {...register('parentId')} 
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-3">
          <Label htmlFor="pageStatus" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
            <Shield size={12} className="text-emerald-400" /> Logic Status
          </Label>
          <select 
            id="pageStatus" 
            {...register('pageStatus')}
            className="w-full bg-slate-950/50 border border-slate-800 text-white h-14 px-5 rounded-xl font-black uppercase tracking-widest text-[10px] focus:border-indigo-500/50 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="active" className="bg-slate-900">PUBLISHED MATRIX</option>
            <option value="draft" className="bg-slate-900">DRAFT BUFFER</option>
          </select>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="space-y-3">
        <Label htmlFor="description" className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-2">
          <FileText size={12} className="text-slate-400" /> Node Intel
        </Label>
        <Textarea 
          id="description" 
          {...register('description')} 
          placeholder="BRIEF DESCRIPTION OF THE CATEGORY LOGIC..."
          rows={3}
          className="bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-700 rounded-2xl px-5 py-4 font-medium tracking-tight focus:border-indigo-500/50 transition-all resize-none shadow-inner"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="p-8 bg-slate-950/30 border border-slate-800/50 rounded-[2rem] space-y-8">
        <div className="flex items-center gap-3 border-b border-slate-800/50 pb-4">
          <Globe size={16} className="text-indigo-400" />
          <h4 className="text-xs font-black text-white uppercase tracking-[0.3em]">SEO Optimization Matrix</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <Label htmlFor="metaTitle" className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px]">Meta Title</Label>
            <Input 
              id="metaTitle" 
              {...register('metaTitle')} 
              className="bg-slate-950/50 border-slate-800 text-slate-300 h-12 px-5 rounded-xl focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="metaDescription" className="text-slate-600 font-black uppercase tracking-[0.2em] text-[10px]">Meta Description</Label>
            <Input 
              id="metaDescription" 
              {...register('metaDescription')} 
              className="bg-slate-950/50 border-slate-800 text-slate-300 h-12 px-5 rounded-xl focus:border-indigo-500/50 transition-all"
            />
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="flex justify-end gap-5 pt-8 border-t border-slate-800/50">
        <button 
          type="button" 
          onClick={handleCancel}
          disabled={isLoading}
          className="px-8 h-14 text-xs font-black text-slate-500 hover:text-white uppercase tracking-[0.2em] transition-all disabled:opacity-50"
        >
          Abort Action
        </button>
        <button 
          type="submit" 
          disabled={isLoading}
          className="px-10 h-14 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap size={18} fill="currentColor" />
          )}
          {initialData?.id || (initialData as any)?._id ? 'Synchronize Node' : 'Initialize Node'}
        </button>
      </motion.div>
    </motion.form>
  );
}

