"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  X,
  Info,
  Layers,
  Boxes,
  List,
  Eye,
  Download,
  Plus,
  Trash2,
  ChevronRight,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { BusinessTemplateEditor } from "./BusinessTemplateEditor";
import { AdminIconPicker } from "@/components/ui/admin-icon-picker";
import { DEFAULT_ADMIN_ICON_KEY } from "@/lib/admin-icon-catalog";

interface IndustryEditorProps {
  initialData: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function IndustryEditor({
  initialData,
  onSave,
  onCancel,
  saving,
}: IndustryEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type");
  const action = searchParams.get("action");

  const [industryData, setIndustryData] = useState(initialData);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(
    initialType ? [initialType] : [],
  );

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handleIndustryUpdate = (updates: any) => {
    setIndustryData({ ...industryData, ...updates });
  };

  const handleBtUpdate = (key: string, updatedBt: any) => {
    const nextTypes = industryData.businessTypes.map((bt: any) =>
      bt.key === key ? updatedBt : bt,
    );
    setIndustryData({ ...industryData, businessTypes: nextTypes });
  };

  const addNewBusinessType = () => {
    const tempId = `new-${Date.now()}`;
    const newBt = {
      key: "",
      name: "",
      _tempId: tempId, // Temporary ID for stable expansion tracking
      icon: DEFAULT_ADMIN_ICON_KEY,
      enabledModules: [],
      featureFlags: {},
      attributePool: [],
      attributeSetPreset: {
        key: "",
        name: "",
        appliesTo: "product",
        attributes: [],
      },
      categorySeedPreset: [],
    };
    setIndustryData((prev: any) => ({
      ...prev,
      businessTypes: [...prev.businessTypes, newBt],
    }));
    setExpandedKeys([tempId]);
  };

  // Handle action parameter
  useEffect(() => {
    if (action === "add" && initialData.businessTypes) {
        addNewBusinessType();
        // Clear param to avoid re-triggering on data updates if any
        window.history.replaceState(null, '', window.location.pathname);
    }
  }, [action]);

  const deleteBusinessType = (key: string) => {
    if (!confirm("Are you sure you want to delete this business type?")) return;
    const nextTypes = industryData.businessTypes.filter(
      (bt: any) => bt.key !== key,
    );
    setIndustryData({ ...industryData, businessTypes: nextTypes });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/60 z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-emerald-400">
            <LayoutGrid size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">
              {industryData.industry || "New Industry"}{" "}
              <span className="text-slate-500 font-normal">{industryData.industry ? "Editor" : "Builder"}</span>
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Industry Registry • {industryData.businessTypes?.length || 0}{" "}
              Types
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSave(industryData)}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg text-sm font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Save size={16} /> {saving ? "Saving..." : "Save All Changes"}
          </button>
          <div className="h-6 w-px bg-slate-800 mx-1" />
          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 hover:text-white transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-12">
        {/* Top Section: Industry Settings */}
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="text-cyan-400" size={20} />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Industry Settings</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-2xl border border-slate-800 bg-black/20">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Industry Name</label>
                <input
                  value={industryData.industry}
                  onChange={(e) => handleIndustryUpdate({ industry: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                  placeholder="e.g. Retail & Commerce"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Industry Key (Slug)</label>
                <input
                  value={industryData.key || ""}
                  onChange={(e) => handleIndustryUpdate({ key: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-cyan-500/50 outline-none font-mono transition-all"
                  placeholder="retail-and-commerce"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center border-l border-slate-800 pl-8">
              <AdminIconPicker
                value={industryData.icon || DEFAULT_ADMIN_ICON_KEY}
                onChange={(val) => handleIndustryUpdate({ icon: val })}
                label="Industry Icon"
              />
            </div>
          </div>
        </div>

        {/* Middle Section: Business Types Accordion */}
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Boxes className="text-emerald-400" size={20} />
              <h2 className="text-xl font-bold text-white uppercase tracking-tight">Business Types</h2>
            </div>
            <button
               onClick={addNewBusinessType}
               className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
            >
              <Plus size={14} /> Add New Business Type
            </button>
          </div>

          <div className="space-y-4">
            {industryData.businessTypes.map((bt: any, index: number) => {
              const btKey = bt.key || bt._tempId || `new-${index}`;
              const isExpanded = expandedKeys.includes(btKey);
              
              return (
                <div 
                  key={btKey}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-slate-700 bg-slate-800/40 shadow-2xl' : 'border-slate-800 bg-slate-900/20 hover:border-slate-700'}`}
                >
                  {/* Accordion Header */}
                  <div 
                    onClick={() => toggleExpand(btKey)}
                    className="flex items-center justify-between p-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg border transition-colors ${isExpanded ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500 group-hover:text-slate-300'}`}>
                        <Eye size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">{bt.name || "Untitled Business Type"}</h3>
                        <p className="text-[10px] text-slate-500 font-mono italic">{bt.key || "no-key-yet"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBusinessType(bt.key); }}
                        className="p-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={18} className={`text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-cyan-500' : ''}`} />
                    </div>
                  </div>

                  {/* Accordion Body */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 p-1 bg-black/20 animate-in slide-in-from-top-2 duration-300">
                      <BusinessTemplateEditor
                        initialData={{
                          ...bt,
                          industry: industryData.industry,
                          industryKey: industryData.key || industryData.industry.toLowerCase().replace(/\s+/g, '-')
                        }}
                        onSave={(data) => handleBtUpdate(bt.key, data)}
                        onCancel={() => toggleExpand(btKey)}
                        saving={false}
                        isNested={true}
                        hideIndustryFields={true}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {industryData.businessTypes.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-slate-800 border-dashed opacity-40">
              <Boxes size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-sm font-bold tracking-widest uppercase text-slate-500">No business types defined yet</p>
              <button 
                onClick={addNewBusinessType}
                className="mt-4 text-emerald-400 hover:underline text-xs font-bold"
              >
                Click here to add the first one
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="max-w-4xl mx-auto pt-12 pb-24 border-t border-slate-800/50 flex justify-center">
            <button
                type="button"
                onClick={() => onSave(industryData)}
                disabled={saving}
                className="flex items-center gap-3 px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl text-lg font-black transition-all shadow-2xl shadow-emerald-500/30 disabled:opacity-50"
            >
                <Save size={24} /> {saving ? "Saving..." : "Save All Configuration"}
            </button>
        </div>
      </div>
    </div>
  );
}
