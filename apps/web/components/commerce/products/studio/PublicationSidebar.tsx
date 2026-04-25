"use client";

import { Check, LayoutGrid, Monitor, ShieldAlert, Zap } from "lucide-react";
import { CategoryType } from "@/hook/slices/commerce/category/categoryType";

interface PublicationSidebarProps {
  status: string;
  templateKey: string;
  allCategories: CategoryType[];
  categoryIds: string[];
  primaryCategoryId: string;
  relatedProductCandidates: any[];
  relatedProductIds: string[];
  onFormChange: (field: string, value: any) => void;
  onToggleCategory: (id: string) => void;
  onToggleRelatedProduct: (id: string) => void;
  allForms: any[];
  formId: string;
}

export const PublicationSidebar: React.FC<PublicationSidebarProps> = ({
  status,
  templateKey,
  allCategories,
  categoryIds,
  primaryCategoryId,
  relatedProductCandidates,
  relatedProductIds,
  onFormChange,
  onToggleCategory,
  onToggleRelatedProduct,
  allForms,
  formId,
}) => {
  return (
    <div className="space-y-6">
      {/* Deployment Status */}
      <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
          <Monitor size={18} className="text-gold" />
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Deployment Logic</h3>
        </div>

        <div className="space-y-4">
           {[
             { id: 'active', label: 'Combat Ready (Active)', color: 'emerald' },
             { id: 'draft', label: 'Undercover (Draft)', color: 'amber' },
             { id: 'archived', label: 'Decommissioned (Archived)', color: 'red' },
           ].map((s) => (
             <button 
               key={s.id}
               type="button"
               onClick={() => onFormChange("status", s.id)}
               className={`w-full p-4 border rounded-sm flex items-center justify-between transition-all group ${
                 status === s.id ? "bg-white/5 border-gold shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "bg-ink border-white/5 opacity-40 hover:opacity-100 hover:border-gold/20"
               }`}
             >
                <div className="flex items-center gap-3">
                   <div className={`h-2 w-2 rounded-full ${status === s.id ? `bg-${s.color}-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]` : "bg-white/20"}`} />
                   <span className={`text-[10px] font-black uppercase tracking-widest ${status === s.id ? "text-white" : "text-white/40"}`}>{s.label}</span>
                </div>
                {status === s.id && <Check size={14} className="text-gold" />}
             </button>
           ))}
        </div>
      </div>

      {/* Categories Selection */}
      <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
          <LayoutGrid size={18} className="text-gold" />
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Sector Assignment</h3>
        </div>

        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
           {allCategories.map((cat: any) => {
             const categoryId = cat.id || cat._id;
             if (!categoryId) return null;
             
             return (
              <label 
                key={categoryId}
                className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                  categoryIds.includes(categoryId) ? "bg-white/5 border-gold/30" : "bg-ink/40 border-white/5 hover:border-gold/10"
                }`}
              >
                 <div className="relative">
                    <input 
                      type="checkbox" 
                      className="peer hidden" 
                      checked={categoryIds.includes(categoryId)}
                      onChange={() => onToggleCategory(categoryId)}
                    />
                    <div className="h-4 w-4 bg-ink border border-white/20 rounded-none peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center">
                       <Check size={10} className="text-ink font-black scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                 </div>
                 <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${categoryIds.includes(categoryId) ? "text-white" : "text-white/30"}`}>{cat.name || cat.title}</span>
                    <span className="text-[7px] font-bold text-white/10 uppercase tracking-widest italic">{cat.slug}</span>
                 </div>
              </label>
             );
           })}
        </div>
      </div>

      {/* Operations Support (Related Products) */}
      <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
          <ShieldAlert size={18} className="text-gold" />
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Operational Support</h3>
        </div>

        <div className="max-h-[200px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
           {relatedProductCandidates.map((p) => {
             const productId = p.id || p._id;
             if (!productId) return null;

             return (
              <label 
                key={productId}
                className={`flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                  relatedProductIds.includes(productId) ? "bg-white/5 border-gold/30" : "bg-ink/40 border-white/5"
                }`}
              >
                 <input 
                   type="checkbox" 
                   className="peer hidden" 
                   checked={relatedProductIds.includes(productId)}
                   onChange={() => onToggleRelatedProduct(productId)}
                 />
                 <div className="h-4 w-4 bg-ink border border-white/20 rounded-none peer-checked:bg-gold peer-checked:border-gold transition-all flex items-center justify-center">
                    <Check size={10} className="text-ink font-black scale-0 peer-checked:scale-100 transition-transform" />
                 </div>
                 <span className={`text-[10px] font-black uppercase tracking-widest ${relatedProductIds.includes(productId) ? "text-white" : "text-white/30"}`}>{p.name}</span>
              </label>
             );
           })}
        </div>
      </div>

      {/* Custom Form Integration */}
      <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
          <Zap size={18} className="text-gold" />
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Custom Intelligence</h3>
        </div>

        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest italic">Attach Matrix Node</span>
            <select 
              value={formId}
              onChange={(e) => onFormChange("formId", e.target.value)}
              className="w-full bg-ink border border-white/10 rounded-sm p-3 text-[10px] font-black uppercase tracking-widest text-gold italic focus:border-gold/50 outline-none transition-all"
            >
              <option value="">NO FORM ATTACHED</option>
              {allForms.map((f: any) => (
                <option key={f._id} value={f._id}>{f.name.toUpperCase()}</option>
              ))}
            </select>
          </label>
          <div className="p-3 bg-gold/5 border border-gold/10 rounded-sm">
             <p className="text-[8px] text-white/30 uppercase leading-relaxed font-bold tracking-tighter">
                Linked forms enable data capture during deployment (Custom Product Build).
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};
