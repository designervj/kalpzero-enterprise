"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ListFilter,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Copy,
  CheckCircle2,
  Circle,
  Settings2,
  Upload,
} from "lucide-react";
import AttributeImportModal from "@/components/attributes/AttributeImportModal";

type AttributeFieldDraft = {
  key: string;
  label: string;
  type: string;
  options: string;
  enabled: boolean;
};

type AttributeSetDraft = {
  name: string;
  key: string;
  appliesTo: string;
  contexts: string;
  description: string;
  attributes: AttributeFieldDraft[];
};

type AttributeSetRecord = {
  _id: string;
  name: string;
  key?: string;
  appliesTo?: string;
  contexts?: string[];
  description?: string;
  attributes?: Array<{
    key?: string;
    label?: string;
    type?: string;
    options?: string[];
    enabled?: boolean;
  }>;
  isSystem?: boolean;
  businessType?: string;
};

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
    contexts: "",
    description: "",
    attributes: [createEmptyField()],
  };
}

function fromRecord(record: AttributeSetRecord): AttributeSetDraft {
  return {
    name: record.name || "",
    key: record.key || "",
    appliesTo: record.appliesTo || "product",
    contexts: Array.isArray(record.contexts) ? record.contexts.join(", ") : "",
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
    contexts: draft.contexts
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

export default function EcommerceAttributesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<AttributeSetRecord[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState<AttributeSetDraft>(createEmptyDraft);
  const [showTagsView, setShowTagsView] = useState(false);
  const [tagsRecord, setTagsRecord] = useState<AttributeSetRecord | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  async function fetchRecords() {
    setLoading(true);
    try {
      const res = await fetch("/api/ecommerce/attributes");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRecords().catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    if (!keyword) return records;
    return records.filter((record) => {
      const haystack = [
        record.name,
        record.key,
        record.appliesTo,
        record.businessType,
        ...(Array.isArray(record.contexts) ? record.contexts : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [records, search]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const resetForm = () => {
    setForm(createEmptyDraft());
    setEditingId(null);
    setShowForm(false);
  };

  const handleClone = async (record: AttributeSetRecord) => {
    setSaving(true);
    const draft = fromRecord(record);
    draft.name = `${draft.name} (Copy)`;
    draft.key = `${draft.key}-copy`;
    const payload = toPayload(draft);

    const res = await fetch("/api/ecommerce/attributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      showToast(data?.error || "Failed to clone attribute set.");
      return;
    }

    showToast("Attribute set cloned.");
    fetchRecords().catch(() => null);
  };

  const handleEdit = (record: AttributeSetRecord) => {
    setForm(fromRecord(record));
    setEditingId(record._id);
    setShowForm(true);
  };

  const handleToggleAttribute = async (
    record: AttributeSetRecord,
    attrKey: string,
  ) => {
    const updatedAttributes = (record.attributes || []).map((attr) => {
      if (attr.key === attrKey) {
        return { ...attr, enabled: attr.enabled === false };
      }
      return attr;
    });

    const res = await fetch(`/api/ecommerce/attributes/${record._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attributes: updatedAttributes }),
    });

    if (res.ok) {
      setRecords((prev) =>
        prev.map((r) =>
          r._id === record._id ? { ...r, attributes: updatedAttributes } : r,
        ),
      );
      if (tagsRecord?._id === record._id) {
        setTagsRecord({ ...record, attributes: updatedAttributes });
      }
    } else {
      showToast("Failed to toggle attribute.");
    }
  };

  const handleSave = async () => {
    const payload = toPayload(form);
    if (!payload.name || payload.attributes.length === 0) {
      showToast("Name and at least one attribute are required.");
      return;
    }

    setSaving(true);
    const endpoint = editingId
      ? `/api/ecommerce/attributes/${editingId}`
      : "/api/ecommerce/attributes";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      showToast(data?.error || "Failed to save attribute set.");
      return;
    }

    showToast(editingId ? "Attribute set updated." : "Attribute set created.");
    resetForm();
    fetchRecords().catch(() => null);
  };

  const handleDelete = async (record: AttributeSetRecord) => {
    if (!confirm(`Delete attribute set "${record.name}"?`)) return;
    const res = await fetch(`/api/ecommerce/attributes/${record._id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data?.error || "Failed to delete attribute set.");
      return;
    }
    showToast("Attribute set deleted.");
    fetchRecords().catch(() => null);
  };

  const updateAttribute = (
    index: number,
    patch: Partial<AttributeFieldDraft>,
  ) => {
    setForm((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attribute, attrIndex) =>
        attrIndex === index ? { ...attribute, ...patch } : attribute,
      ),
    }));
  };

  const removeAttribute = (index: number) => {
    setForm((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((_, attrIndex) => attrIndex !== index),
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-black shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <ListFilter size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Attribute Sets</h1>
            <p className="text-xs text-slate-400">
              Business-calibrated attributes for products and variants.
            </p>
          </div>
        </div>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300 hover:bg-cyan-500/20"
          >
            <Upload size={14} /> Import JSON
          </button>
          <button
            onClick={() => {
              setForm(createEmptyDraft());
              setEditingId(null);
              setShowForm(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400"
          >
            <Plus size={14} /> New Set
          </button>
      </div>

      <div className="max-w-md">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name, key, context..."
          className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
        />
      </div>

      {showForm && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              {editingId ? "Edit Attribute Set" : "Create Attribute Set"}
            </h2>
            <button
              onClick={resetForm}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">
                Name
              </label>
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="Room Plan"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">
                Key
              </label>
              <input
                value={form.key}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, key: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm font-mono text-white"
                placeholder="room-plan"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">
                Applies To
              </label>
              <select
                value={form.appliesTo}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    appliesTo: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
              >
                <option value="product">Product</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">
                Contexts (comma separated)
              </label>
              <input
                value={form.contexts}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, contexts: event.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="travel-and-tour-package, hospitality"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] uppercase tracking-widest text-slate-500">
                Description
              </label>
              <input
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                placeholder="Optional guidance for this set"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Attributes
              </h3>
              <button
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    attributes: [...prev.attributes, createEmptyField()],
                  }))
                }
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
              >
                <Plus size={12} /> Add Field
              </button>
            </div>

            {form.attributes.map((attribute, index) => (
              <div
                key={`${index}-${attribute.key}`}
                className="grid grid-cols-1 gap-2 rounded-lg border border-slate-800 bg-black/20 p-3 md:grid-cols-12"
              >
                <input
                  value={attribute.key}
                  onChange={(event) =>
                    updateAttribute(index, { key: event.target.value })
                  }
                  placeholder="key"
                  className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white md:col-span-2"
                />
                <input
                  value={attribute.label}
                  onChange={(event) =>
                    updateAttribute(index, { label: event.target.value })
                  }
                  placeholder="label"
                  className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white md:col-span-3"
                />
                <select
                  value={attribute.type}
                  onChange={(event) =>
                    updateAttribute(index, { type: event.target.value })
                  }
                  className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white md:col-span-2"
                >
                  <option value="select">Select</option>
                  <option value="multiselect">Multi Select</option>
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <input
                  value={attribute.options}
                  onChange={(event) =>
                    updateAttribute(index, { options: event.target.value })
                  }
                  placeholder="option1, option2, option3"
                  className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white md:col-span-4"
                />
                <button
                  onClick={() => removeAttribute(index)}
                  className="inline-flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-2 text-rose-300 md:col-span-1"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? "Saving..." : editingId ? "Update Set" : "Create Set"}
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="py-16 text-center text-sm text-slate-500">
          Loading attribute sets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No attribute sets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((record) => (
            <article
              key={record._id}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    {record.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {record.key || "no-key"}
                  </p>
                  {record.businessType && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                        {record.businessType}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleClone(record)}
                    title="Clone to new set"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-300"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => {
                      setTagsRecord(record);
                      setShowTagsView(true);
                    }}
                    title="Manage attribute toggles"
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-300"
                  >
                    <Settings2 size={13} />
                  </button>
                  <button
                    onClick={() => handleEdit(record)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(record)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-300"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                {(record.contexts || []).map((context) => (
                  <span
                    key={context}
                    className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] text-cyan-300"
                  >
                    {context}
                  </span>
                ))}
                {record.isSystem && (
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                    System
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                {(record.attributes || [])
                  .slice(0, 5)
                  .map((attribute, index) => (
                    <div
                      key={`${record._id}-${index}`}
                      className="flex items-center justify-between border-b border-slate-800/60 py-1"
                    >
                      <span>{attribute.label || attribute.key}</span>
                      <span className="text-[10px] text-slate-500">
                        {attribute.type || "select"}
                      </span>
                    </div>
                  ))}
                {(record.attributes || []).length > 5 && (
                  <p className="pt-1 text-[11px] text-slate-500">
                    + {(record.attributes || []).length - 5} more fields
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {showTagsView && tagsRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Manage Attributes
                </h2>
                <p className="text-xs text-slate-400">
                  Enable or disable specific attributes for {tagsRecord.name}
                </p>
              </div>
              <button
                onClick={() => setShowTagsView(false)}
                className="rounded-full bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {(tagsRecord.attributes || []).map((attr) => {
                const isEnabled = attr.enabled !== false;
                return (
                  <button
                    key={attr.key}
                    onClick={() => handleToggleAttribute(tagsRecord, attr.key!)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                      isEnabled
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        : "border-slate-800 bg-slate-900/40 text-slate-500 line-through"
                    }`}
                  >
                    {isEnabled ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Circle size={16} />
                    )}
                    {attr.label || attr.key}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowTagsView(false)}
                className="rounded-lg bg-white px-6 py-2 text-sm font-bold text-black hover:bg-slate-200"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <AttributeImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => fetchRecords().catch(() => null)}
      />
    </div>
  );
}
