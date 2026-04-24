"use client";

import React from "react";
import { Info, Terminal, Type } from "lucide-react";
import { slugify } from "@/lib/admin-products/utils";

interface GeneralInformationProps {
  name: string;
  sku: string;
  slug: string;
  description: string;
  onFormChange: (field: string, value: any) => void;
  onSlugChange: (slug: string) => void;
}

export const GeneralInformation: React.FC<GeneralInformationProps> = ({
  name,
  sku,
  slug,
  description,
  onFormChange,
  onSlugChange,
}) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onFormChange("name", val);
    if (val && !slug) {
      onSlugChange(slugify(val));
    }
  };

  const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onFormChange("sku", val);
    if (val && !slug) {
      onSlugChange(slugify(val));
    }
  };

  return (
    <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
         <Info size={40} className="text-gold" />
      </div>
      
      <div className="flex items-center gap-3 border-l-2 border-gold pl-4">
        <Terminal size={18} className="text-gold" />
        <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Product Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Type size={12} className="text-gold" /> Product Name
          </label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="ENTER UNIT NAME..."
            className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
          />
        </div>

        {/* SKU Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
            <Terminal size={12} className="text-gold" /> Product Sku
          </label>
          <input
            type="text"
            value={sku}
            onChange={handleSkuChange}
            placeholder="SERIAL-ID-X..."
            className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
          />
        </div>
      </div>

      {/* Slug Field */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
          Slug
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">
            /product/
          </span>
          <input
            type="text"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="auto-generated-slug"
            className="w-full h-12 bg-ink border border-white/10 rounded-sm pl-24 pr-4 text-xs font-bold text-gold lowercase tracking-widest focus:border-gold outline-none transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Description</label>
        <textarea
          value={description}
          onChange={(e) => onFormChange("description", e.target.value)}
          placeholder="DESCRIBE UNIT CAPABILITIES..."
          className="w-full min-h-[120px] bg-ink border border-white/10 rounded-sm p-4 text-xs font-bold text-white uppercase tracking-widest leading-relaxed focus:border-gold outline-none transition-all placeholder:text-white/10 resize-none"
        />
      </div>
    </div>
  );
};
