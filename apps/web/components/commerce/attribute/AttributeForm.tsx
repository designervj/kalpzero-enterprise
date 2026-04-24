"use client";
import React, { useState } from "react";
import { X, Settings, Zap, Plus, Trash, Save, Layout, List, Type, Hash, ToggleLeft, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AttributeSetRecord, 
  AttributeSetDraft, 
  AttributeFieldDraft 
} from "@/hook/slices/commerce/attribute/attributeType";

interface AttributeFormProps {
  initialData: AttributeSetRecord | null;
  onSubmit: (payload: any) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function createEmptyField(): AttributeFieldDraft {
  return {
    key: "",
    label: "",
    type: "select",
    options: "",
    enabled: true,
  };
}

function createEmptyDraft(): AttributeSetDraft {
  return {
    name: "",
    key: "",
    appliesTo: "product",
    vertical_bindings: "",
    description: "",
    attributes: [createEmptyField()],
  };
}

function fromRecord(record: AttributeSetRecord): AttributeSetDraft {
  return {
    name: record.name || "",
    key: record.key || "",
    appliesTo: record.appliesTo || "product",
    vertical_bindings: Array.isArray(record.vertical_bindings) ? record.vertical_bindings.join(", ") : "",
    description: record.description || "",
    attributes:
      Array.isArray(record.attributes) && record.attributes.length > 0
        ? record.attributes.map((attribute) => ({
            key: attribute.key || "",
            label: attribute.label || "",
            type: attribute.type || "select",
            options: Array.isArray(attribute.options)
              ? attribute.options.join(", ")
              : "",
            enabled: attribute.enabled !== false,
          }))
        : [createEmptyField()],
  };
}

function toPayload(draft: AttributeSetDraft) {
  return {
    name: draft.name.trim(),
    key: draft.key.trim(),
    appliesTo: draft.appliesTo,
    vertical_bindings: draft.vertical_bindings
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    description: draft.description.trim(),
    attributes: draft.attributes
      .map((attribute) => ({
        key: attribute.key.trim(),
        label: attribute.label.trim(),
        type: attribute.type || "select",
        options: attribute.options
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        enabled: attribute.enabled,
      }))
      .filter((attribute) => attribute.key && attribute.label),
  };
}

export default function AttributeForm({ initialData, onSubmit, onCancel, isLoading }: AttributeFormProps) {
  const [form, setForm] = useState<AttributeSetDraft>(
    initialData ? fromRecord(initialData) : createEmptyDraft()
  );

  const updateAttributeField = (
    index: number,
    patch: Partial<AttributeFieldDraft>,
  ) => {
    setForm((prev) => ({
      ...prev,
      attributes: prev.attributes.map((a, i) =>
        i === index ? { ...a, ...patch } : a,
      ),
    }));
  };

  const removeAttributeField = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    const payload = toPayload(form);
    await onSubmit(payload);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-5xl mx-auto bg-slate-900/60 backdrop-blur-3xl border border-slate-800/80 rounded-[2.5rem] p-10 space-y-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] relative overflow-hidden"
    >
      {/* Decorative gradient background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-lg shadow-amber-500/5">
            <Layout size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white flex items-center gap-3">
              {initialData ? "Modify" : "Initialize"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Attribute Set</span>
            </h3>
            <p className="text-sm font-medium text-slate-500 mt-1">
              Configure data schemas and synchronization context for the commerce engine.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="h-12 w-12 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-500 hover:text-white hover:bg-slate-800 transition-all flex items-center justify-center group"
        >
          <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      <div className="relative z-10 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
            Set Designation
          </label>
          <div className="relative group">
            <input
              placeholder="e.g. VEHICLE SPECS"
              value={form.name}
              onChange={(e) => {
                const val = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name: val,
                  key: val.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                }));
              }}
              className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl px-6 text-sm font-bold text-white placeholder:text-slate-700 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 shadow-inner"
            />
          </div>
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
            System Key
          </label>
          <div className="relative group">
            <input
              placeholder="vehicle-specs"
              value={form.key}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  key: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-"),
                }))
              }
              className="w-full h-14 bg-slate-950/50 border border-slate-800 rounded-2xl px-6 text-sm font-mono font-bold text-amber-500/80 lowercase placeholder:text-slate-700 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
            Operational Summary
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe the purpose of this attribute set..."
            className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-sm font-medium text-white placeholder:text-slate-700 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 shadow-inner resize-none"
          />
        </div>
        <div className="space-y-4">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
            Vertical Contexts (CSV)
          </label>
          <textarea
            value={form.vertical_bindings}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, vertical_bindings: e.target.value }))
            }
            placeholder="e.g. automotive, gear, outdoor"
            className="w-full h-32 bg-slate-950/50 border border-slate-800 rounded-2xl p-6 text-sm font-medium text-white placeholder:text-slate-700 focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/5 outline-none transition-all duration-300 shadow-inner resize-none"
          />
        </div>
      </div>

      {/* Attribute Fields */}
      <div className="relative z-10 space-y-8 pt-10 border-t border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
              <Activity size={20} className="text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold text-white tracking-tight">
              Schema Definitions
            </h4>
          </div>
          <button
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                attributes: [...prev.attributes, createEmptyField()],
              }))
            }
            className="px-6 py-3 bg-slate-950/50 border border-slate-800 hover:border-amber-500/50 text-amber-500 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-3 active:scale-95"
          >
            <Plus size={18} /> New Schema Node
          </button>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {form.attributes.map((field, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/30 p-8 rounded-3xl border border-slate-800/50 relative group hover:bg-slate-950/50 transition-all duration-300"
              >
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Hash size={10} /> Node ID
                  </label>
                  <input
                    value={field.key}
                    onChange={(e) =>
                      updateAttributeField(idx, { key: e.target.value })
                    }
                    placeholder="field-key"
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-mono font-bold text-amber-500/80 focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-3 space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Type size={10} /> Label
                  </label>
                  <input
                    value={field.label}
                    onChange={(e) =>
                      updateAttributeField(idx, { label: e.target.value })
                    }
                    placeholder="Field Label"
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold text-white focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2 space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <List size={10} /> Type
                  </label>
                  <div className="relative">
                    <select
                      value={field.type}
                      onChange={(e) =>
                        updateAttributeField(idx, { type: e.target.value })
                      }
                      className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-bold text-slate-300 focus:border-amber-500/50 outline-none appearance-none cursor-pointer"
                    >
                      <option value="select">Selection</option>
                      <option value="text">Input String</option>
                      <option value="number">Numeric</option>
                      <option value="boolean">Boolean</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <Zap size={12} />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-4 space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <ToggleLeft size={10} /> Configuration Options (CSV)
                  </label>
                  <input
                    value={field.options}
                    onChange={(e) =>
                      updateAttributeField(idx, { options: e.target.value })
                    }
                    placeholder="Option A, Option B..."
                    className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-medium text-slate-400 focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-1 flex items-end justify-center pb-0.5">
                  <button
                    onClick={() => removeAttributeField(idx)}
                    className="h-11 w-11 bg-slate-950/80 border border-slate-800 text-slate-600 hover:text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30 rounded-xl transition-all flex items-center justify-center active:scale-90"
                  >
                    <Trash size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-10 flex justify-end gap-5 pt-10 border-t border-slate-800/50">
        <button
          type="button"
          onClick={onCancel}
          className="h-14 px-8 bg-slate-950/50 border border-slate-800 hover:bg-slate-800 hover:text-white text-slate-400 font-bold text-sm rounded-2xl transition-all duration-300"
        >
          Decline
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="h-14 px-12 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-amber-900/20 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-4 disabled:opacity-50 disabled:pointer-events-none"
        >
          {isLoading ? (
            <div className="h-5 w-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          {initialData ? "Synchronize Matrix" : "Deploy Schema"}
        </button>
      </div>
    </motion.div>
  );
}

