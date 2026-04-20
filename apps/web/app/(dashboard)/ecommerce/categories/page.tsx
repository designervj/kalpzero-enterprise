"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Tag,
  Plus,
  FolderTree,
  Pencil,
  Trash2,
  Link2,
  Eye,
  Rows4,
  List,
  Upload,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { canRoleMutateUi } from "@/lib/role-scope";
import CategoryImportModal from "@/components/categories/CategoryImportModal";
import {
    CATEGORY_TEMPLATE_OPTIONS,
  defaultCategoryTemplateForType,
  getCategoryTemplateLabel,
  normalizeCategoryTemplateKey,
} from "@/lib/commerce-template-options";

type CategoryType = "product" | "portfolio" | "blog";

type CategoryRecord = {
  _id: string;
  name: string;
  slug: string;
  type: CategoryType;
  parentId?: string | null;
  description?: string;
  templateKey?: string;
  page?: {
    title?: string;
    content?: string;
    bannerImage?: string;
    gallery?: Array<{ url: string; alt?: string; order?: number }>;
    templateKey?: string;
    status?: "draft" | "published" | "archived";
    seo?: {
      metaTitle?: string;
      metaDescription?: string;
    };
  };
  entityCount?: number;
  entityCounts?: {
    product?: number;
    blog?: number;
    portfolio?: number;
    total?: number;
  };
};

type CategoryDraft = {
  name: string;
  slug: string;
  type: CategoryType;
  parentId: string | null;
  description: string;
  templateKey: string;
  pageTitle: string;
  pageStatus: "draft" | "published" | "archived";
  pageBannerImage: string;
  pageContent: string;
  pageMetaTitle: string;
  pageMetaDescription: string;
  galleryInput: string;
};

function resolveCategoryType(value: unknown): CategoryType {
  if (value === "portfolio" || value === "blog") return value;
  return "product";
}

function createDraft(type: CategoryType = "product"): CategoryDraft {
  return {
    name: "",
    slug: "",
    type,
    parentId: null,
    description: "",
    templateKey: defaultCategoryTemplateForType(type),
    pageTitle: "",
    pageStatus: "draft",
    pageBannerImage: "",
    pageContent: "",
    pageMetaTitle: "",
    pageMetaDescription: "",
    galleryInput: "",
  };
}

function toDraft(record: CategoryRecord): CategoryDraft {
  const normalizedType: CategoryType = record.type || "product";
  const normalizedTemplate = normalizeCategoryTemplateKey(
    record.page?.templateKey || record.templateKey,
    defaultCategoryTemplateForType(normalizedType),
  );
  return {
    name: record.name || "",
    slug: record.slug || "",
    type: normalizedType,
    parentId: record.parentId || null,
    description: record.description || "",
    templateKey: normalizedTemplate,
    pageTitle: record.page?.title || record.name || "",
    pageStatus: record.page?.status || "draft",
    pageBannerImage: record.page?.bannerImage || "",
    pageContent: record.page?.content || "",
    pageMetaTitle: record.page?.seo?.metaTitle || "",
    pageMetaDescription: record.page?.seo?.metaDescription || "",
    galleryInput: Array.isArray(record.page?.gallery)
      ? record.page!.gallery!.map((item) => item.url).join(", ")
      : "",
  };
}

function toPayload(draft: CategoryDraft) {
  const gallery = draft.galleryInput
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((url, index) => ({ url, alt: "", order: index }));

  return {
    name: draft.name.trim(),
    slug: draft.slug.trim(),
    type: draft.type,
    parentId: draft.parentId || null,
    description: draft.description.trim(),
    templateKey: normalizeCategoryTemplateKey(
      draft.templateKey,
      defaultCategoryTemplateForType(draft.type),
    ),
    page: {
      title: draft.pageTitle.trim() || draft.name.trim(),
      content: draft.pageContent,
      bannerImage: draft.pageBannerImage.trim(),
      gallery,
      templateKey: normalizeCategoryTemplateKey(
        draft.templateKey,
        defaultCategoryTemplateForType(draft.type),
      ),
      status: draft.pageStatus,
      seo: {
        metaTitle:
          draft.pageMetaTitle.trim() ||
          draft.pageTitle.trim() ||
          draft.name.trim(),
        metaDescription: draft.pageMetaDescription.trim(),
      },
    },
  };
}

function readTenantKeyFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )kalp_active_tenant=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function CategoriesPage() {
  const { currentProfile, isScopedRoleView } = useAuth();
  const canMutate = canRoleMutateUi(currentProfile);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [typeFilter, setTypeFilter] = useState<CategoryType | "">("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [toast, setToast] = useState("");
  const [form, setForm] = useState<CategoryDraft>(createDraft);
  const [previewTemplateByCategoryId, setPreviewTemplateByCategoryId] =
    useState<Record<string, string>>({});
  const [showImportModal, setShowImportModal] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (typeFilter) params.set("type", typeFilter);
    params.set("includeCounts", "1");
    const res = await fetch(`/api/ecommerce/categories?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data)) {
      setCategories(data);
      setPreviewTemplateByCategoryId((prev) => {
        const next = { ...prev };
        for (const row of data) {
          if (!row?._id || typeof row._id !== "string") continue;
          const type = resolveCategoryType(row.type);
          if (!next[row._id]) {
            next[row._id] = normalizeCategoryTemplateKey(
              row?.page?.templateKey || row?.templateKey,
              defaultCategoryTemplateForType(type),
            );
          }
        }
        return next;
      });
    } else {
      setCategories([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories().catch(() => setLoading(false));
  }, [typeFilter]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const resetForm = () => {
    setForm(createDraft(typeFilter || "product"));
    setEditingId(null);
    setShowForm(false);
  };

  const totals = useMemo(
    () => ({
      all: categories.length,
      product: categories.filter((item) => item.type === "product").length,
      portfolio: categories.filter((item) => item.type === "portfolio").length,
      blog: categories.filter((item) => item.type === "blog").length,
    }),
    [categories],
  );

  const openCreate = () => {
    if (!canMutate) return;
    setForm(createDraft(typeFilter || "product"));
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (record: CategoryRecord) => {
    if (!canMutate) return;
    setForm(toDraft(record));
    setEditingId(record._id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!canMutate) return;
    const payload = toPayload(form);
    if (!payload.name) {
      showToast("Category name is required.");
      return;
    }

    setSaving(true);
    const endpoint = editingId
      ? `/api/ecommerce/categories/${editingId}`
      : "/api/ecommerce/categories";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      showToast(data?.error || "Failed to save category.");
      return;
    }
    showToast(editingId ? "Category updated." : "Category created.");
    resetForm();
    fetchCategories().catch(() => null);
  };

  const handleDelete = async (record: CategoryRecord) => {
    if (!canMutate) return;
    if (!confirm(`Delete category "${record.name}"?`)) return;
    const res = await fetch(`/api/ecommerce/categories/${record._id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data?.error || "Failed to delete category.");
      return;
    }
    showToast("Category deleted.");
    fetchCategories().catch(() => null);
  };

  const openPreview = (record: CategoryRecord, templateOverride?: string) => {
    const tenantKey = readTenantKeyFromCookie();
    if (!tenantKey) {
      showToast("Active tenant key not found.");
      return;
    }
    const type = resolveCategoryType(record.type);
    const selectedTemplate = normalizeCategoryTemplateKey(
      templateOverride || record.page?.templateKey || record.templateKey,
      defaultCategoryTemplateForType(type),
    );
    const encodedSlug = encodeURIComponent(`${tenantKey}--${record.slug}`);
    const url = `/c/${encodedSlug}?tenant=${encodeURIComponent(tenantKey)}&preview=1&previewTemplate=${encodeURIComponent(selectedTemplate)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const typeColors: Record<string, string> = {
    product: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    portfolio: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    blog: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!canMutate && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {isScopedRoleView
            ? "Scoped role view is read-only. Switch role to create or edit categories."
            : "This role is read-only for category mutations."}
        </div>
      )}
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-semibold text-black shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
            <FolderTree size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Category Management
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Each category can publish its own frontend page with template +
              SEO.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg border px-3 py-2 text-xs ${viewMode === "grid" ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" : "border-slate-700 bg-slate-900/40 text-slate-400"}`}
          >
            <Rows4 size={13} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg border px-3 py-2 text-xs ${viewMode === "list" ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" : "border-slate-700 bg-slate-900/40 text-slate-400"}`}
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            disabled={!canMutate}
            className="inline-flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-bold text-purple-300 hover:bg-purple-500/20 disabled:opacity-50 transition-all"
          >
            <Upload size={16} /> Import JSON
          </button>
          <button
            onClick={openCreate}
            disabled={!canMutate}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-black hover:bg-cyan-400"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            All
          </p>
          <p className="mt-1 text-xl font-bold text-white">{totals.all}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Product
          </p>
          <p className="mt-1 text-xl font-bold text-cyan-300">
            {totals.product}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Portfolio
          </p>
          <p className="mt-1 text-xl font-bold text-purple-300">
            {totals.portfolio}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Blog
          </p>
          <p className="mt-1 text-xl font-bold text-amber-300">{totals.blog}</p>
        </div>
      </div>

      {showForm && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              {editingId ? "Edit Category" : "Create Category"}
            </h3>
            <button
              onClick={resetForm}
              className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Category Name"
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white md:col-span-2"
            />
            <input
              type="text"
              value={form.slug}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, slug: event.target.value }))
              }
              placeholder="slug"
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <select
              value={form.type}
              onChange={(event) => {
                const nextType = event.target.value as CategoryType;
                setForm((prev) => ({
                  ...prev,
                  type: nextType,
                  templateKey: defaultCategoryTemplateForType(nextType),
                }));
              }}
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="product">Product</option>
              <option value="portfolio">Portfolio</option>
              <option value="blog">Blog</option>
            </select>
            <select
              value={form.parentId || ""}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  parentId: event.target.value || null,
                }))
              }
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">None (Top Level)</option>
              {categories
                .filter(
                  (cat) => cat.type === form.type && cat._id !== editingId,
                )
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              value={form.templateKey}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  templateKey: normalizeCategoryTemplateKey(
                    event.target.value,
                    defaultCategoryTemplateForType(prev.type),
                  ),
                }))
              }
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {CATEGORY_TEMPLATE_OPTIONS.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={form.pageTitle}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, pageTitle: event.target.value }))
              }
              placeholder="Page Title"
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <select
              value={form.pageStatus}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  pageStatus: event.target.value as CategoryDraft["pageStatus"],
                }))
              }
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          {editingId && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  openPreview(
                    {
                      _id: editingId,
                      name: form.name,
                      slug: form.slug,
                      type: form.type,
                      templateKey: form.templateKey,
                      page: {
                        templateKey: form.templateKey,
                        status: form.pageStatus,
                      },
                    },
                    form.templateKey,
                  )
                }
                className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200 hover:bg-cyan-500/20"
              >
                <Eye size={12} /> Preview Selected Template
              </button>
              <span className="text-[10px] text-slate-500">
                Draft preview uses `preview=1` with chosen layout override.
              </span>
            </div>
          )}

          <input
            type="text"
            value={form.pageBannerImage}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                pageBannerImage: event.target.value,
              }))
            }
            placeholder="Banner image URL"
            className="mt-3 w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <input
            type="text"
            value={form.galleryInput}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, galleryInput: event.target.value }))
            }
            placeholder="Gallery URLs (comma separated)"
            className="mt-3 w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <textarea
            rows={4}
            value={form.pageContent}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, pageContent: event.target.value }))
            }
            placeholder="Category page content (HTML/text)"
            className="mt-3 w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
          />
          <textarea
            rows={2}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            placeholder="Category Description"
            className="mt-3 w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
          />

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={form.pageMetaTitle}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  pageMetaTitle: event.target.value,
                }))
              }
              placeholder="Meta Title"
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
            <input
              type="text"
              value={form.pageMetaDescription}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  pageMetaDescription: event.target.value,
                }))
              }
              placeholder="Meta Description"
              className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="mt-4">
            <button
              onClick={handleSubmit}
              disabled={saving || !canMutate}
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-emerald-400 disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Category"
                  : "Create Category"}
            </button>
          </div>
        </section>
      )}

      <div className="flex gap-2">
        {(["", "product", "portfolio", "blog"] as const).map((type) => (
          <button
            key={type || "all"}
            onClick={() => setTypeFilter(type)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${typeFilter === type ? "border-cyan-500/30 bg-cyan-500/20 text-cyan-300" : "border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600"}`}
          >
            {type || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-500" />
        </div>
      ) : categories.length === 0 ? (
        <div className="py-16 text-center text-sm text-slate-500">
          No categories found.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => (
            <article
              key={category._id}
              className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-slate-600"
            >
              <div className="mb-3 flex items-start justify-between">
                <Tag
                  size={18}
                  className="text-slate-500 group-hover:text-cyan-400"
                />
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${typeColors[category.type] || typeColors.product}`}
                >
                  {category.type}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                {category.name}
                {category.parentId && (
                  <span className="ml-2 inline-flex items-center gap-1 font-normal text-[10px] text-slate-500">
                    <FolderTree size={10} />{" "}
                    {categories.find((c) => c._id === category.parentId)
                      ?.name || "Parent"}
                  </span>
                )}
              </h3>
              <p className="font-mono text-xs text-slate-500">
                /{category.slug}
              </p>
              <p className="mt-2 text-[11px] text-slate-400 line-clamp-2">
                {category.description || "No description yet."}
              </p>
              <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400">
                <span className="uppercase tracking-widest text-slate-500">
                  Template snapshot:
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-300">
                  {getCategoryTemplateLabel(
                    category.page?.templateKey || category.templateKey,
                    resolveCategoryType(category.type),
                  )}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-400">
                Entities:{" "}
                <span className="font-semibold text-slate-200">
                  {category.entityCount || 0}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                  <select
                    value={normalizeCategoryTemplateKey(
                      previewTemplateByCategoryId[category._id] ||
                        category.page?.templateKey ||
                        category.templateKey,
                      defaultCategoryTemplateForType(
                        resolveCategoryType(category.type),
                      ),
                    )}
                    onChange={(event) => {
                      const nextTemplate = normalizeCategoryTemplateKey(
                        event.target.value,
                        defaultCategoryTemplateForType(
                          resolveCategoryType(category.type),
                        ),
                      );
                      setPreviewTemplateByCategoryId((prev) => ({
                        ...prev,
                        [category._id]: nextTemplate,
                      }));
                    }}
                    className="rounded-md border border-slate-700 bg-black/50 px-1.5 py-1 text-[10px] text-slate-300"
                  >
                    {CATEGORY_TEMPLATE_OPTIONS.map((template) => (
                      <option key={template.key} value={template.key}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                  {canMutate && (
                    <>
                      <button
                        onClick={() => openEdit(category)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-300"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() =>
                    openPreview(
                      category,
                      previewTemplateByCategoryId[category._id] ||
                        category.page?.templateKey ||
                        category.templateKey,
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                >
                  <Eye size={12} /> Preview
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/30">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                  Category
                </th>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                  Type
                </th>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                  Template Snapshot
                </th>
                <th className="px-4 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                  Entities
                </th>
                <th className="px-4 py-2 text-right text-[10px] uppercase tracking-widest text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category._id} className="border-b border-slate-800/70">
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold text-white">
                      {category.name}
                      {category.parentId && (
                        <span className="ml-2 inline-flex items-center gap-1 font-normal text-[10px] text-slate-500">
                          <FolderTree size={10} />{" "}
                          {categories.find((c) => c._id === category.parentId)
                            ?.name || "Parent"}
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-slate-500">
                      /{category.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {category.type}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    <div className="font-semibold text-slate-200">
                      {getCategoryTemplateLabel(
                        category.page?.templateKey || category.templateKey,
                        resolveCategoryType(category.type),
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {normalizeCategoryTemplateKey(
                        category.page?.templateKey || category.templateKey,
                        defaultCategoryTemplateForType(
                          resolveCategoryType(category.type),
                        ),
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {category.page?.status === "published"
                        ? "Published snapshot"
                        : "Draft / non-live"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-300">
                    {category.entityCount || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <select
                        value={normalizeCategoryTemplateKey(
                          previewTemplateByCategoryId[category._id] ||
                            category.page?.templateKey ||
                            category.templateKey,
                          defaultCategoryTemplateForType(
                            resolveCategoryType(category.type),
                          ),
                        )}
                        onChange={(event) => {
                          const nextTemplate = normalizeCategoryTemplateKey(
                            event.target.value,
                            defaultCategoryTemplateForType(
                              resolveCategoryType(category.type),
                            ),
                          );
                          setPreviewTemplateByCategoryId((prev) => ({
                            ...prev,
                            [category._id]: nextTemplate,
                          }));
                        }}
                        className="rounded-md border border-slate-700 bg-black/50 px-1.5 py-1 text-[10px] text-slate-300"
                      >
                        {CATEGORY_TEMPLATE_OPTIONS.map((template) => (
                          <option key={template.key} value={template.key}>
                            {template.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          openPreview(
                            category,
                            previewTemplateByCategoryId[category._id] ||
                              category.page?.templateKey ||
                              category.templateKey,
                          )
                        }
                        className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                      >
                        <Link2 size={13} />
                      </button>
                      {canMutate && (
                        <>
                          <button
                            onClick={() => openEdit(category)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-cyan-300"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-rose-300"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => fetchCategories().catch(() => null)}
      />
    </div>
  );
}
