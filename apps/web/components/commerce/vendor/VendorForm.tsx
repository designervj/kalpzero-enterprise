"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, Save, Terminal, Type, Hash, Info, User, Mail, Phone, Globe } from "lucide-react";
import { Vendor } from "@/hook/slices/commerce/vendor/VendorType";
import { slugify } from "@/lib/admin-products/utils";

interface VendorFormProps {
  initialData: Vendor | null;
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function VendorForm({ initialData, onSubmit, onCancel, isLoading }: VendorFormProps) {
  const [formData, setFormData] = useState<Partial<Vendor>>({
    name: "",
    slug: "",
    code: "",
    description: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    status: "active",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const update: any = { name };
    // Only auto-update slug if it was empty or matches the slugified version of the previous name
    if (!formData.slug || formData.slug === slugify(formData.name || "")) {
      update.slug = slugify(name);
    }
    setFormData((prev) => ({ ...prev, ...update }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-gold pl-6 py-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="text-white/20 hover:text-gold transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              {initialData ? "Update" : "Add"} <span className="text-gold">Vendor</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest italic">
            <Terminal size={12} className="text-gold/50" />
            {initialData ? `Modifying Vendor: ${initialData.name}` : "Onboarding New Vendor"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            className="h-12 px-8 bg-charcoal border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white hover:border-gold/30 transition-all active:scale-95 flex items-center gap-3 shadow-xl"
            onClick={onCancel}
          >
            cancel
          </button>
          <button
            className="h-12 px-10 bg-olive text-white font-black text-[10px] uppercase tracking-widest hover:bg-olive-lt transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-olive/20 disabled:opacity-50"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {initialData ? "Update Vendor" : "Add Vendor"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Core Identity Section */}
          <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <Info size={40} className="text-gold" />
            </div>
            
            <div className="flex items-center gap-3 border-l-2 border-gold pl-4">
              <Terminal size={18} className="text-gold" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Vendor details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Type size={12} className="text-gold" /> Vendor Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g., GLOBAL LOGISTICS CORP"
                  className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
                />
              </div>

              {/* Code */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Hash size={12} className="text-gold" /> Vendor Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g., VND-1024"
                  className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
                />
              </div>
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                <Globe size={12} className="text-gold" /> Slug
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">
                  /vendor/
                </span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                  placeholder="auto-generated-slug"
                  className="w-full h-12 bg-ink border border-white/10 rounded-sm pl-24 pr-4 text-xs font-bold text-gold lowercase tracking-widest focus:border-gold outline-none transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Vendor Intelligence / Bio</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="DESCRIBE THE VENDOR'S CAPABILITIES AND STRATEGIC IMPORTANCE..."
                className="w-full min-h-[100px] bg-ink border border-white/10 rounded-sm p-4 text-xs font-bold text-white uppercase tracking-widest leading-relaxed focus:border-gold outline-none transition-all placeholder:text-white/10 resize-none"
              />
            </div>
          </div>

          {/* Contact Intel Section */}
          <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40 relative overflow-hidden group">
            <div className="flex items-center gap-3 border-l-2 border-gold pl-4">
              <User size={18} className="text-gold" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Vendor Contact Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Contact Name */}
               <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                   Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                  placeholder="COMMANDER NAME"
                  className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} className="text-gold" /> Secure Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="vendor@nexus.secure"
                  className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} className="text-gold" /> Encrypted Line
                </label>
                <input
                  type="text"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                  placeholder="+X XXX XXX XXXX"
                  className="w-full h-12 bg-ink border border-white/10 rounded-sm px-4 text-xs font-bold uppercase tracking-widest text-white focus:border-gold outline-none transition-all placeholder:text-white/10"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
              <Save size={18} className="text-gold" />
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Operational Status</h3>
            </div>

            <div className="space-y-4">
              {[
                { id: 'active', label: 'Active', color: 'emerald' },
                { id: 'inactive', label: 'Inactive', color: 'red' },
              ].map((s) => (
                <button 
                  key={s.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, status: s.id }))}
                  className={`w-full p-4 border rounded-sm flex items-center justify-between transition-all group ${
                    formData.status === s.id ? "bg-white/5 border-gold shadow-[0_0_15px_rgba(251,191,36,0.1)]" : "bg-ink border-white/5 opacity-40 hover:opacity-100 hover:border-gold/20"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${formData.status === s.id ? `bg-${s.color}-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]` : "bg-white/20"}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.status === s.id ? "text-white" : "text-white/40"}`}>{s.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
