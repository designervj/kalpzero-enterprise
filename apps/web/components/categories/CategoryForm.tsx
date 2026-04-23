"use client"

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CategoryType } from '@/hook/slices/commerce/category/categoryType';
import { X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/lib/store';
import { setCurrentCategories } from '@/hook/slices/commerce/category/categorySlice';

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
    const {currentCategories}= useSelector((state:RootState)=>state.category)
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
      parentId: (initialData as any)?.parentId || (currentCategories as any)?.id || null,
      metaTitle: initialData?.metaTitle || '',
      metaDescription: initialData?.metaDescription || '',
    },
  });
  console.log("initialData",initialData)
  const categoryName = watch('name');
  const editingId = (initialData as any)?._id || (initialData as any)?.id;

  // Auto-generate slug from name if slug is empty
  useEffect(() => {
    if (categoryName && !initialData?.slug && !editingId) {
      const generatedSlug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setValue('slug', generatedSlug);
    }
  }, [categoryName, setValue, initialData, editingId]);


  const handleCancel=()=>{
    onCancel();
    dispatch(setCurrentCategories(null));
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Hub Designation</Label>
          <Input 
            id="name" 
            {...register('name')} 
            placeholder="E.G. TACTICAL APPAREL"
            className={cn(
              "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-700 h-12 uppercase tracking-wide",
              errors.name ? 'border-rose-500' : ''
            )}
          />
          {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Network Slug</Label>
          <Input 
            id="slug" 
            {...register('slug')} 
            placeholder="tactical-apparel"
            className={cn(
              "bg-slate-950 border-slate-800 text-indigo-400 font-mono placeholder:text-slate-700 h-12 italic",
              errors.slug ? 'border-rose-500' : ''
            )}
          />
          {errors.slug && <p className="text-xs text-rose-500">{errors.slug.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Taxonomy Type</Label>
          <Input 
            id="type" 
            {...register('type')} 
            placeholder="E.G. ASSET CATALOG"
            className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-700 h-12 uppercase tracking-wide"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="parentId" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Parent Node</Label>
          <Input 
            id="parentName" 
            value={currentCategories?.name} 
            readOnly
            className="bg-slate-950 border-slate-800 text-indigo-400 h-12 uppercase tracking-wide cursor-not-allowed font-bold"
          />
          <input 
            type="hidden" 
            {...register('parentId')} 
            value={currentCategories?.id || (currentCategories as any)?._id || ''} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pageStatus" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Page Status</Label>
          <Select 
            id="pageStatus" 
            {...register('pageStatus')}
            className="bg-slate-900 border-slate-800 rounded-xl text-slate-200 h-12 uppercase tracking-widest text-xs font-bold"
          >
            <option value="active" className="bg-slate-900 text-slate-200">PUBLISHED</option>
            <option value="draft" className="bg-slate-900 text-slate-200">DRAFT LOGIC</option>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Description</Label>
        <Textarea 
          id="description" 
          {...register('description')} 
          placeholder="BRIEF DESCRIPTION OF THE CATEGORY LOGIC..."
          rows={3}
          className="bg-slate-900/50 border-slate-800 text-slate-300 placeholder:text-slate-700 uppercase tracking-tight"
        />
      </div>

      <div className="border-t border-slate-900 pt-6 mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="metaTitle" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">SEO Meta Title</Label>
            <Input 
              id="metaTitle" 
              {...register('metaTitle')} 
              className="bg-slate-900/50 border-slate-800 text-slate-100 h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription" className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">SEO Meta Description</Label>
            <Input 
              id="metaDescription" 
              {...register('metaDescription')} 
              className="bg-slate-900/50 border-slate-800 text-slate-100 h-11"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
        <Button 
          type="button" 
          variant="ghost" 
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="bg-indigo-600 hover:bg-indigo-500"
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
