"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  FolderPlus,
  ImagePlus,
  Link2,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  MapPin,
  Key,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { canRoleMutateUi } from "@/lib/role-scope";

type PropertyOption = {
  key: string;
  label: string;
  values: string[];
  selectedValues: string[];
  draftValue: string;
  attributeSetId?: string;
  attributeSetName?: string;
};

type PropertyGalleryItem = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function sanitizeKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseGallery(value: unknown): PropertyGalleryItem[] {
  if (!Array.isArray(value)) return [];
  const items: PropertyGalleryItem[] = value
    .map((item, index) => {
      if (typeof item === "string") {
        const url = item.trim();
        if (!url) return null;
        return {
          id: `gallery-${index + 1}`,
          url,
          alt: "",
          order: index,
        };
      }
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const url = typeof row.url === "string" ? row.url.trim() : "";
      if (!url) return null;
      return {
        id:
          typeof row.id === "string" && row.id.trim()
            ? row.id.trim()
            : `gallery-${index + 1}`,
        url,
        alt: typeof row.alt === "string" ? row.alt : "",
        order: typeof row.order === "number" ? row.order : index,
      };
    })
    .filter((item): item is PropertyGalleryItem => Boolean(item));

  return items
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      resolve(result);
    };
    reader.onerror = () =>
      reject(new Error(`Unable to read file: ${file.name}`));
    reader.readAsDataURL(file);
  });
}

function readTenantKeyFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )kalp_active_tenant=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function PropertyStudioPage() {
  const { currentProfile, isScopedRoleView } = useAuth();
  const canMutate = canRoleMutateUi(currentProfile);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditing = Boolean(editId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [attributeSets, setAttributeSets] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<
    Array<{ _id: string; filename?: string; url?: string }>
  >([]);
  const [toast, setToast] = useState("");
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [galleryAltDraft, setGalleryAltDraft] = useState("");
  const [mediaSelection, setMediaSelection] = useState("");
  const [propertySlug, setPropertySlug] = useState("");
  const [selectedBtKey, setSelectedBtKey] = useState<string>("");
  const [activeAttributeSetId, setActiveAttributeSetId] = useState("");

  const [form, setForm] = useState({
    name: "",
    propertyId: "",
    location: "",
    description: "",
    status: "active",
    type: "property",
    businessType: [] as string[],
    categoryIds: [] as string[],
    attributeSetIds: [] as string[],
    pricing: {
      price: "",
      compareAtPrice: "",
      costPerItem: "",
      chargeTax: false,
      trackQuantity: false,
    },
    options: [] as PropertyOption[],
    gallery: [] as PropertyGalleryItem[],
    primaryImageId: "",
    primaryCategoryId: "",
  });

  const availableAttributeSets = useMemo(() => {
    return attributeSets.filter((set: any) => {
      const alreadyAdded = form.attributeSetIds.includes(set.key || set._id);
      if (alreadyAdded) return false;
      const setBtKey = set.businessTypeKey || "";
      if (selectedBtKey) {
        return setBtKey === selectedBtKey;
      }
      return !setBtKey;
    });
  }, [attributeSets, form.attributeSetIds, selectedBtKey]);

  const selectedAttributeSets = useMemo(
    () =>
      attributeSets.filter((set: any) => {
        const setKey = set.key || set._id;
        return (
          form.attributeSetIds.includes(setKey) ||
          form.attributeSetIds.some(
            (id) => id === set.key || id === set._id || id === set.name,
          )
        );
      }),
    [attributeSets, form.attributeSetIds],
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [categoryRes, attrRes, tenantRes, mediaRes] =
        await Promise.all([
          fetch("/api/ecommerce/categories"),
          fetch("/api/ecommerce/attributes"),
          fetch("/api/settings/tenant"),
          fetch("/api/media?type=image"),
        ]);

      const [categoryData, attrData, tenantData, mediaData] =
        await Promise.all([
          categoryRes.json(),
          attrRes.json(),
          tenantRes.json(),
          mediaRes.json(),
        ]);

      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setAttributeSets(Array.isArray(attrData) ? attrData : []);
      setMediaItems(Array.isArray(mediaData) ? mediaData : []);
      
      const businessType =
        typeof tenantData?.businessType === "string"
          ? [tenantData.businessType]
          : Array.isArray(tenantData?.businessType)
            ? tenantData.businessType
            : (typeof tenantData?.businessType === 'object' && tenantData?.businessType !== null 
                ? [tenantData.businessType] 
                : []);

      const btypes = Array.isArray(businessType) ? businessType : [];
      if (btypes.length > 0) {
        const firstBtKey = typeof btypes[0] === "object" ? btypes[0].key : btypes[0];
        setSelectedBtKey(firstBtKey || "");
      }

      if (isEditing && editId) {
        const propertyRes = await fetch(`/api/real-estate/properties/${editId}`);
        const propertyData = await propertyRes.json();

        const matchedAttributeSetIds = (Array.isArray(attrData) ? attrData : [])
          .filter(
            (set: any) =>
              (Array.isArray(propertyData?.attributeSetIds) &&
                propertyData.attributeSetIds.includes(set._id || set.key)) ||
              set?._id === propertyData?.attributeSetId ||
              set?.key === propertyData?.attributeSetId,
          )
          .map((set: any) => set.key || set._id || "");

        const propertyOptions: PropertyOption[] =
          Array.isArray(propertyData?.options) && propertyData.options.length > 0
            ? propertyData.options.map((option: any) => ({
                key: option.key || sanitizeKey(option.label || ""),
                label: option.label || option.key || "",
                values: Array.isArray(option.values) ? option.values : [],
                selectedValues: Array.isArray(option.selectedValues)
                  ? option.selectedValues
                  : [],
                draftValue: "",
                attributeSetId: option.attributeSetId,
                attributeSetName: option.attributeSetName,
              }))
            : [];

        if (matchedAttributeSetIds.length > 0) {
          setActiveAttributeSetId(matchedAttributeSetIds[0]);
        }

        const gallery = parseGallery(
          Array.isArray(propertyData?.gallery)
            ? propertyData.gallery
            : propertyData?.images,
        );

        setForm({
          name: propertyData?.name || "",
          propertyId: propertyData?.sku || "",
          location: propertyData?.location || "",
          description: propertyData?.description || "",
          status: propertyData?.status || "active",
          type: "property",
          businessType: Array.isArray(propertyData?.businessType)
            ? propertyData.businessType
            : businessType,
          categoryIds: Array.isArray(propertyData?.categoryIds)
            ? propertyData.categoryIds
            : [],
          attributeSetIds: matchedAttributeSetIds,
          pricing: {
            price: String(propertyData?.pricing?.price || propertyData?.price || ""),
            compareAtPrice: String(propertyData?.pricing?.compareAtPrice || ""),
            costPerItem: String(propertyData?.pricing?.costPerItem || ""),
            chargeTax: !!propertyData?.pricing?.chargeTax,
            trackQuantity: !!propertyData?.pricing?.trackQuantity,
          },
          options: propertyOptions,
          gallery,
          primaryImageId: propertyData?.primaryImageId || gallery[0]?.id || "",
          primaryCategoryId: propertyData?.primaryCategoryId || "",
        });
        setPropertySlug(propertyData?.slug || "");
      } else {
        setForm((prev) => ({
          ...prev,
          businessType: Array.isArray(businessType) ? businessType : [],
        }));
      }

      setLoading(false);
    };

    load().catch(() => setLoading(false));
  }, [editId, isEditing]);

  const toggleAttributeSet = (attributeSetId: string) => {
    if (!attributeSetId) return;

    setForm((prev) => {
      const isRemoving = prev.attributeSetIds.includes(attributeSetId);
      const nextIds = isRemoving
        ? prev.attributeSetIds.filter((id) => id !== attributeSetId)
        : [...prev.attributeSetIds, attributeSetId];

      if (isRemoving) {
        return {
          ...prev,
          attributeSetIds: nextIds,
          options: prev.options.filter((opt) => opt.attributeSetId !== attributeSetId),
        };
      }

      const found = attributeSets.find(
        (set: any) => set._id === attributeSetId || set.key === attributeSetId,
      );

      if (!found) return { ...prev, attributeSetIds: nextIds };

      const setOptions: PropertyOption[] = (
        Array.isArray(found.attributes) ? found.attributes : []
      )
        .filter((attr: any) => attr.enabled !== false)
        .map((attr: any) => ({
          key: sanitizeKey(attr.key || attr.label || ""),
          label: attr.label || attr.key || "Option",
          values: Array.isArray(attr.options) ? attr.options : [],
          selectedValues: [],
          draftValue: "",
          attributeSetId: found.key || found._id,
          attributeSetName: found.name,
        }));

      return {
        ...prev,
        attributeSetIds: nextIds,
        options: [...prev.options, ...setOptions],
      };
    });
  };

  const toggleOptionValue = (index: number, value: string) => {
    const normalized = value.trim();
    if (!normalized) return;
    setForm((prev) => {
      const options = [...prev.options];
      const option = options[index];
      const exists = option.selectedValues.includes(normalized);
      options[index] = {
        ...option,
        selectedValues: exists
          ? option.selectedValues.filter((item) => item !== normalized)
          : [...option.selectedValues, normalized],
      };
      return { ...prev, options };
    });
  };

  const addCustomOptionValue = (index: number) => {
    const draftValue = form.options[index]?.draftValue?.trim() || "";
    if (!draftValue) return;
    setForm((prev) => {
      const options = [...prev.options];
      const option = options[index];
      const nextValues = option.values.includes(draftValue) ? option.values : [...option.values, draftValue];
      const nextSelected = option.selectedValues.includes(draftValue) ? option.selectedValues : [...option.selectedValues, draftValue];

      options[index] = {
        ...option,
        values: nextValues,
        selectedValues: nextSelected,
        draftValue: "",
      };

      return { ...prev, options };
    });
  };

  const toggleCategory = (categoryId: string) => {
    setForm((prev) => {
      const exists = prev.categoryIds.includes(categoryId);
      const nextIds = exists
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return {
        ...prev,
        categoryIds: nextIds,
        primaryCategoryId: !exists && nextIds.length === 1 ? categoryId : prev.primaryCategoryId,
      };
    });
  };

  const addGalleryItem = (url: string, alt = "") => {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return;
    setForm((prev) => {
      const id = `gallery-${Date.now()}`;
      return {
        ...prev,
        gallery: [...prev.gallery, { id, url: normalizedUrl, alt, order: prev.gallery.length }],
        primaryImageId: prev.primaryImageId || id,
      };
    });
  };

  const handleSave = async () => {
    if (!canMutate) return;
    if (!form.name.trim() || !form.propertyId.trim()) {
      showToast("Name and Property ID are required.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      sku: form.propertyId.trim(),
      location: form.location.trim(),
      type: "property",
      description: form.description,
      status: form.status,
      businessType: form.businessType,
      categoryIds: form.categoryIds,
      primaryCategoryId: form.primaryCategoryId || null,
      attributeSetIds: form.attributeSetIds,
      slug: propertySlug.trim() || slugify(form.name),
      pricing: {
        price: Number(form.pricing.price || 0),
        compareAtPrice: Number(form.pricing.compareAtPrice || 0),
        chargeTax: false,
        trackQuantity: false,
      },
      options: form.options.map((option) => ({
        key: option.key,
        label: option.label,
        values: option.selectedValues,
        attributeSetId: option.attributeSetId,
        attributeSetName: option.attributeSetName,
      })),
      gallery: form.gallery.sort((a, b) => a.order - b.order),
      primaryImageId: form.primaryImageId || form.gallery[0]?.id || "",
    };

    const endpoint = isEditing ? `/api/real-estate/properties/${editId}` : "/api/real-estate/properties";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSaving(false);
    if (res.ok) {
      showToast(isEditing ? "Property updated." : "Property created.");
      router.push("/real-estate");
    } else {
      const data = await res.json();
      showToast(data?.error || "Failed to save property.");
    }
  };

  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    return categories
      .filter((c) => c.parentId === parentId || (parentId === null && (!c.parentId || c.parentId === "null")))
      .map((category) => {
        const selected = form.categoryIds.includes(category.slug);
        const isPrimary = form.primaryCategoryId === category.slug;
        return (
          <div key={category._id} className="space-y-1" style={{ marginLeft: level > 0 ? `${level * 12}px` : "0" }}>
            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${selected ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" : "border-slate-800 bg-black/30 text-slate-400 hover:border-slate-700"}`}>
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => toggleCategory(category.slug)}
              >
                <span>{category.name}</span>
              </div>
              {selected && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setForm(prev => ({ ...prev, primaryCategoryId: category.slug }));
                    }}
                    className={`hover:text-amber-400 transition-colors ${isPrimary ? "text-amber-400" : "text-slate-600"}`}
                  >
                    <Star size={12} fill={isPrimary ? "currentColor" : "none"} />
                  </button>
                  <Check size={12} />
                </div>
              )}
            </div>
            {renderCategoryTree(category.slug, level + 1)}
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-3 rounded-xl bg-slate-900 border border-emerald-500/50 px-4 py-3 text-sm font-bold text-emerald-400 shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in slide-in-from-right-8 duration-300">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
            <Check size={14} />
          </div>
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/real-estate" className="rounded-lg border border-slate-700 bg-slate-900/50 p-2 text-slate-300 hover:border-slate-500">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">{isEditing ? "Edit Property" : "Add Property"}</h1>
            <p className="text-[10px] text-slate-400">
              Business Context: {selectedBtKey || "General"}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !canMutate}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-60"
        >
          <Save size={14} />
          {saving ? "Saving..." : "Save Property"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Building2 size={18} className="text-cyan-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Property Details</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Property Title</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Modern 3-Bedroom Villa with Pool"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Property ID / SKU</label>
                <input
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value.toUpperCase() })}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500"
                  placeholder="PROP-001"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Location / Address</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="e.g. Beverly Hills, CA"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Slug</label>
                <input
                  value={propertySlug}
                  onChange={(e) => setPropertySlug(slugify(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                  placeholder="property-slug"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={5}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Full description of the property..."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={18} className="text-amber-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Pricing & Status</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Price ($)</label>
                <input
                  type="number"
                  value={form.pricing.price}
                  onChange={(e) => setForm({ ...form, pricing: { ...form.pricing, price: e.target.value } })}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="active">Active Listing</option>
                  <option value="draft">Draft</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <ImagePlus size={18} className="text-purple-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Media Gallery</h2>
            </div>
            <div className="flex gap-2 mb-4">
              <input
                value={galleryUrlDraft}
                onChange={(e) => setGalleryUrlDraft(e.target.value)}
                placeholder="Paste image URL"
                className="flex-1 rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
              />
              <button
                onClick={() => { addGalleryItem(galleryUrlDraft); setGalleryUrlDraft(""); }}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 border border-slate-700"
              >
                Add Image
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.gallery.map((item) => (
                <div key={item.id} className="relative group rounded-lg overflow-hidden border border-slate-800 bg-black">
                  <img src={item.url} className="h-24 w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <button
                    onClick={() => setForm({ ...form, gallery: form.gallery.filter(g => g.id !== item.id) })}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded text-rose-500 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                  {form.primaryImageId === item.id && (
                    <div className="absolute bottom-1 left-1 bg-cyan-500 text-black px-1 rounded text-[8px] font-bold">PRIMARY</div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm hover:border-slate-700/50 transition-colors">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-emerald-400" />
                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Property Attributes</h2>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value=""
                  onChange={(e) => toggleAttributeSet(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white"
                >
                  <option value="">Add Attribute Set</option>
                  {availableAttributeSets.map((set: any) => (
                    <option key={set._id} value={set.key || set._id}>{set.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedAttributeSets.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedAttributeSets.map((set: any) => (
                  <div
                    key={set._id || set.key}
                    className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-300"
                  >
                    <span>{set.name}</span>
                    <button
                      onClick={() => toggleAttributeSet(set.key || set._id)}
                      className="text-cyan-500 hover:text-cyan-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-8">
              {selectedAttributeSets.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
                  Select an attribute set to load property options.
                </div>
              ) : (
                selectedAttributeSets.map((set) => {
                  const setOptions = form.options.filter(
                    (opt) => opt.attributeSetId === (set.key || set._id),
                  );
                  if (setOptions.length === 0) return null;

                  return (
                    <div key={set._id || set.key} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-slate-800" />
                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                          {set.name}
                        </span>
                        <div className="h-px flex-1 bg-slate-800" />
                      </div>
                      <div className="space-y-4">
                        {setOptions.map((option) => {
                          const optionIndex = form.options.findIndex(
                            (o) =>
                              o.key === option.key &&
                              o.attributeSetId === option.attributeSetId,
                          );
                          return (
                            <div
                              key={`${option.key}-${option.attributeSetId}`}
                              className="p-4 rounded-lg border border-slate-800 bg-black/20"
                            >
                              <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-white uppercase tracking-widest">
                                    {option.label}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-mono">
                                    {option.key}
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {option.values.map((val) => {
                                  const active = option.selectedValues.includes(val);
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => toggleOptionValue(optionIndex, val)}
                                      className={`px-3 py-1.5 rounded-md text-[10px] border transition-all ${
                                        active
                                          ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
                                          : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600"
                                      }`}
                                    >
                                      {val}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  value={option.draftValue}
                                  onChange={(e) => {
                                    const next = [...form.options];
                                    next[optionIndex].draftValue = e.target.value;
                                    setForm({ ...form, options: next });
                                  }}
                                  placeholder="Add custom value..."
                                  className="flex-1 bg-black/40 border border-slate-800 rounded-md text-[10px] text-white focus:outline-none focus:border-cyan-500/50 px-3 py-2"
                                  onKeyDown={(e) =>
                                    e.key === "Enter" && addCustomOptionValue(optionIndex)
                                  }
                                />
                                <button
                                  onClick={() => addCustomOptionValue(optionIndex)}
                                  className="px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm hover:border-slate-700/50 transition-colors">
            <div className="flex items-center gap-2 mb-6">
              <Key size={18} className="text-pink-400" />
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Property Type</h2>
            </div>
            <div className="space-y-1">
              {renderCategoryTree()}
            </div>
            <Link href="/real-estate/categories" className="mt-4 inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300">
               <Plus size={10} /> Manage Types
            </Link>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
             <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Business Context</h2>
             <div className="space-y-4">
                <p className="text-[10px] text-slate-500 italic">Select the business context to filter available attribute sets.</p>
                <select
                  value={selectedBtKey}
                  onChange={(e) => setSelectedBtKey(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">General / Shared</option>
                  {form.businessType.map((bt: any) => {
                    const btKey = typeof bt === "object" ? bt.key : bt;
                    const btName = typeof bt === "object" ? bt.name : bt;
                    return (
                      <option key={btKey} value={btKey}>
                        {btName}
                      </option>
                    );
                  })}
                </select>
             </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Quick Summary</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Categories</span>
                <span className="font-mono text-cyan-400">{form.categoryIds.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Attribute Sets</span>
                <span className="font-mono text-cyan-400">{form.attributeSetIds.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Gallery Items</span>
                <span className="font-mono text-cyan-400">{form.gallery.length}</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
