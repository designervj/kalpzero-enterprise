"use client";

import React, { useState } from "react";
import { X, Settings, Zap, Plus, Trash, Save } from "lucide-react";
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
    <div className="bg-slate-950 border-l-4 border-amber-500 p-8 space-y-8 shadow-2xl shadow-black/60 animate-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-slate-900 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-widest">
              {initialData ? "Modify Attribute Set" : "Add New Attribute Set"}
            </h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest italic mt-1">
              Define data fields and synchronization contexts.
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
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Set Designation
          </label>
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
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-black text-white uppercase tracking-widest focus:border-amber-500 outline-none"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Serial Key
          </label>
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
            className="w-full h-12 bg-slate-900 border border-white/10 rounded-sm px-4 text-xs font-mono font-bold text-amber-500 lowercase tracking-widest focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Operational Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="DESCRIBE SET PURPOSE..."
            className="w-full h-24 bg-slate-900 border border-white/10 rounded-sm p-4 text-xs font-bold text-white uppercase tracking-widest focus:border-amber-500 outline-none resize-none"
          />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">
            Vertical Bindings (CSV)
          </label>
          <textarea
            value={form.vertical_bindings}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, vertical_bindings: e.target.value }))
            }
            placeholder="e.g. automotive, gear, outdoor"
            className="w-full h-24 bg-slate-900 border border-white/10 rounded-sm p-4 text-xs font-bold text-white uppercase tracking-widest focus:border-amber-500 outline-none resize-none"
          />
        </div>
      </div>

      {/* Attribute Fields */}
      <div className="space-y-6 pt-6 border-t border-white/5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Zap size={14} className="text-amber-500" /> Matrix Fields
          </h4>
          <button
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                attributes: [...prev.attributes, createEmptyField()],
              }))
            }
            className="px-4 py-2 bg-slate-900 border border-white/10 text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
          >
            <Plus size={14} /> Add Data Field
          </button>
        </div>

        <div className="space-y-4">
          {form.attributes.map((field, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-900/40 p-4 border border-white/5 rounded-sm relative group"
            >
              <div className="md:col-span-2 space-y-2">
                <label className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">
                  KEY
                </label>
                <input
                  value={field.key}
                  onChange={(e) =>
                    updateAttributeField(idx, { key: e.target.value })
                  }
                  placeholder="field-key"
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-sm px-3 text-[10px] font-mono font-bold text-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-3 space-y-2">
                <label className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">
                  LABEL
                </label>
                <input
                  value={field.label}
                  onChange={(e) =>
                    updateAttributeField(idx, { label: e.target.value })
                  }
                  placeholder="Field Label"
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-sm px-3 text-[10px] font-bold text-white uppercase focus:border-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">
                  TYPE
                </label>
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateAttributeField(idx, { type: e.target.value })
                  }
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-sm px-3 text-[10px] font-black text-white uppercase focus:border-amber-500 outline-none appearance-none"
                >
                  <option value="select">Select</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
              </div>
              <div className="md:col-span-4 space-y-2">
                <label className="text-[8px] font-black text-white/20 uppercase tracking-widest leading-none">
                  OPTIONS (CSV)
                </label>
                <input
                  value={field.options}
                  onChange={(e) =>
                    updateAttributeField(idx, { options: e.target.value })
                  }
                  placeholder="Option A, Option B..."
                  className="w-full h-9 bg-slate-900 border border-white/10 rounded-sm px-3 text-[10px] font-bold text-white/60 focus:border-amber-500 outline-none"
                />
              </div>
              <div className="md:col-span-1 flex items-end justify-center pb-1">
                <button
                  onClick={() => removeAttributeField(idx)}
                  className="p-2 text-white/10 hover:text-rose-500 transition-colors"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-8 bg-slate-900 border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-widest hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="h-12 px-12 bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-amber-900/20 flex items-center gap-3"
        >
          {isLoading ? (
            <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {initialData ? "Update Attribute Set" : "Create Attribute Set"}
        </button>
      </div>
    </div>
  );
}
