"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Boxes,
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
} from "lucide-react";
import Link from "next/link";
import type { SourceEntityRefDto } from "@/lib/contracts/source";
import { SourceRow } from "@/components/source/SourceRow";
import { useAuth } from "@/components/AuthProvider";
import { canRoleMutateUi } from "@/lib/role-scope";
import {
  PRODUCT_TEMPLATE_OPTIONS,
  normalizeProductTemplateKey,
} from "@/lib/commerce-template-options";

type VariantRow = {
  key: string;
  title: string;
  optionValues: Record<string, string>;
  sku: string;
  price: string;
  stock: string;
  compareAtPrice: string;
  cost: string;
  imageId: string;
};

type ProductOption = {
  key: string;
  label: string;
  values: string[];
  selectedValues: string[];
  useForVariants: boolean;
  draftValue: string;
  attributeSetId?: string;
  attributeSetName?: string;
};

type ProductGalleryItem = {
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

type RelatedProduct = {
  _id: string;
  name?: string;
  sku?: string;
};

function sanitizeKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function composeVariantKey(values: Record<string, string>): string {
  return Object.entries(values)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

function buildCombinationTitle(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" / ");
}

function deepMergeRecord<T extends Record<string, unknown>>(
  base: T,
  patch: Record<string, unknown>,
): T {
  const output: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = output[key];
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      current &&
      typeof current === "object" &&
      !Array.isArray(current)
    ) {
      output[key] = deepMergeRecord(
        current as Record<string, unknown>,
        value as Record<string, unknown>,
      );
      continue;
    }
    output[key] = value;
  }
  return output as T;
}

function toSourceRefs(sourceIds: unknown): SourceEntityRefDto[] {
  if (!Array.isArray(sourceIds)) return [];
  return sourceIds
    .filter((value): value is string => typeof value === "string")
    .map((sourceId) => ({
      sourceId,
      inputType: "text",
      createdAt: new Date().toISOString(),
      label: `SRC-${sourceId.slice(-6)}`,
    }));
}

function parseGallery(value: unknown): ProductGalleryItem[] {
  if (!Array.isArray(value)) return [];
  const items: ProductGalleryItem[] = value
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
    .filter((item): item is ProductGalleryItem => Boolean(item));

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

function buildVariantCombinations(
  options: ProductOption[],
): Record<string, string>[] {
  const axes = options
    .filter(
      (option) => option.useForVariants && option.selectedValues.length > 0,
    )
    .map((option) => ({ key: option.key, values: option.selectedValues }));

  if (axes.length === 0) return [];

  const recurse = (
    index: number,
    acc: Record<string, string>,
  ): Record<string, string>[] => {
    if (index >= axes.length) return [acc];
    const axis = axes[index];
    const results: Record<string, string>[] = [];
    for (const value of axis.values) {
      results.push(...recurse(index + 1, { ...acc, [axis.key]: value }));
    }
    return results;
  };

  return recurse(0, {});
}

function inferOptionValuesFromVariants(
  variants: any[],
  defaultAttributeSetId?: string,
): ProductOption[] {
  const map = new Map<string, ProductOption>();
  for (const variant of variants) {
    const optionValues =
      variant.optionValues && typeof variant.optionValues === "object"
        ? (variant.optionValues as Record<string, string>)
        : {};
    for (const [key, value] of Object.entries(optionValues)) {
      const current = map.get(key);
      if (current) {
        if (!current.selectedValues.includes(value))
          current.selectedValues.push(value);
      } else {
        map.set(key, {
          key,
          label: key,
          values: [value],
          selectedValues: [value],
          useForVariants: true,
          draftValue: "",
          attributeSetId: defaultAttributeSetId,
        });
      }
    }
  }
  return Array.from(map.values());
}

function readTenantKeyFromCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )kalp_active_tenant=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function ProductStudioPage() {
  const { currentProfile, isScopedRoleView } = useAuth();
  const canMutate = canRoleMutateUi(currentProfile);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const typeParam = searchParams.get("type") || "physical";
  const isEditing = Boolean(editId);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [attributeSets, setAttributeSets] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<RelatedProduct[]>([]);
  const [mediaItems, setMediaItems] = useState<
    Array<{ _id: string; filename?: string; url?: string }>
  >([]);
  const [sourceEnabled, setSourceEnabled] = useState(false);
  const [sourceRefs, setSourceRefs] = useState<SourceEntityRefDto[]>([]);
  const [toast, setToast] = useState("");
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [galleryAltDraft, setGalleryAltDraft] = useState("");
  const [mediaSelection, setMediaSelection] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryParentId, setNewCategoryParentId] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [selectedBtKey, setSelectedBtKey] = useState<string>("");
  const [activeAttributeSetId, setActiveAttributeSetId] = useState("");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    status: "active",
    type: typeParam,
    businessType: [] as string[],
    categoryIds: [] as string[],
    attributeSetIds: [] as string[],
    pricing: {
      price: "",
      compareAtPrice: "",
      costPerItem: "",
      chargeTax: true,
      trackQuantity: true,
    },
    options: [] as ProductOption[],
    variants: [] as VariantRow[],
    gallery: [] as ProductGalleryItem[],
    primaryImageId: "",
    primaryCategoryId: "",
    relatedProductIds: [] as string[],
    templateKey: "product-split",
  });

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
  const relatedProductCandidates = useMemo(
    () => allProducts.filter((item) => item._id !== editId),
    [allProducts, editId],
  );

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [categoryRes, attrRes, tenantRes, productsRes, mediaRes] =
        await Promise.all([
          fetch("/api/ecommerce/categories?type=product"),
          fetch("/api/ecommerce/attributes"),
          fetch("/api/settings/tenant"),
          fetch("/api/ecommerce/products"),
          fetch("/api/media?type=image"),
        ]);

      const [categoryData, attrData, tenantData, productsData, mediaData] =
        await Promise.all([
          categoryRes.json(),
          attrRes.json(),
          tenantRes.json(),
          productsRes.json(),
          mediaRes.json(),
        ]);

      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setAttributeSets(Array.isArray(attrData) ? attrData : []);
      setAllProducts(Array.isArray(productsData) ? productsData : []);
      setMediaItems(Array.isArray(mediaData) ? mediaData : []);
      const businessType =
        typeof tenantData?.businessType === "string"
          ? [tenantData.businessType]
          : Array.isArray(tenantData?.businessType)
            ? tenantData.businessType
            : typeof tenantData?.businessType === "object" &&
                tenantData?.businessType !== null
              ? [tenantData.businessType]
              : [];
      const enabledModules = Array.isArray(tenantData?.enabledModules)
        ? tenantData.enabledModules
        : [];
      const featureFlags =
        tenantData?.featureFlags && typeof tenantData.featureFlags === "object"
          ? (tenantData.featureFlags as Record<string, unknown>)
          : {};

      const btypes = Array.isArray(businessType) ? businessType : [];
      if (btypes.length > 0) {
        const firstBtKey =
          typeof btypes[0] === "object" ? btypes[0].key : btypes[0];
        setSelectedBtKey(firstBtKey || "");
      }

      const isSourceEnabled =
        enabledModules.includes("source") &&
        featureFlags.sourceModuleEnabled !== false &&
        featureFlags.sourcePilotProducts !== false;
      setSourceEnabled(isSourceEnabled);

      if (isEditing && editId) {
        const productRes = await fetch(`/api/ecommerce/products/${editId}`);
        const productData = await productRes.json();

        const matchedAttributeSetIds = (Array.isArray(attrData) ? attrData : [])
          .filter(
            (set: any) =>
              (Array.isArray(productData?.attributeSetIds) &&
                productData.attributeSetIds.includes(set._id || set.key)) ||
              set?._id === productData?.attributeSetId ||
              set?.key === productData?.attributeSetId ||
              set?.name === productData?.attributeSetId,
          )
          .map((set: any) => set.key || set._id || "");

        const productOptions: ProductOption[] =
          Array.isArray(productData?.options) && productData.options.length > 0
            ? productData.options.map((option: any) => ({
                key: option.key || sanitizeKey(option.label || ""),
                label: option.label || option.key || "",
                values: Array.isArray(option.values) ? option.values : [],
                selectedValues: Array.isArray(option.selectedValues)
                  ? option.selectedValues
                  : Array.isArray(option.values)
                    ? option.values
                    : [],
                useForVariants: option.useForVariants !== false,
                draftValue: "",
                attributeSetId: option.attributeSetId,
                attributeSetName: option.attributeSetName,
              }))
            : inferOptionValuesFromVariants(
                Array.isArray(productData?.variants)
                  ? productData.variants
                  : [],
                matchedAttributeSetIds[0],
              );

        if (matchedAttributeSetIds.length > 0) {
          setActiveAttributeSetId(matchedAttributeSetIds[0]);
        }

        const variants: VariantRow[] = Array.isArray(productData?.variants)
          ? productData.variants.map((variant: any, index: number) => ({
              key:
                composeVariantKey(variant.optionValues || {}) ||
                `variant-${index + 1}`,
              title:
                variant.title ||
                buildCombinationTitle(variant.optionValues || {}) ||
                `Variant ${index + 1}`,
              optionValues: variant.optionValues || {},
              sku: variant.sku || "",
              price: String(variant.price ?? productData?.price ?? ""),
              stock: String(variant.stock ?? ""),
              compareAtPrice: String(variant.compareAtPrice ?? ""),
              cost: String(variant.cost ?? ""),
              imageId:
                typeof variant.imageId === "string" ? variant.imageId : "",
            }))
          : [];

        const gallery = parseGallery(
          Array.isArray(productData?.gallery)
            ? productData.gallery
            : productData?.images,
        );
        const primaryImageId =
          typeof productData?.primaryImageId === "string" &&
          productData.primaryImageId
            ? productData.primaryImageId
            : gallery[0]?.id || "";

        setForm({
          name: productData?.name || "",
          sku: productData?.sku || "",
          description: productData?.description || "",
          status: productData?.status || "active",
          type: productData?.type || typeParam,
          businessType: Array.isArray(productData?.businessType)
            ? productData.businessType.map((bt: any) =>
                typeof bt === "object" && bt?.name ? bt.name : String(bt),
              )
            : typeof productData?.businessType === "string" &&
                productData.businessType
              ? [productData.businessType]
              : businessType,
          categoryIds: Array.isArray(productData?.categoryIds)
            ? productData.categoryIds
            : [],
          attributeSetIds: matchedAttributeSetIds,
          pricing: {
            price: String(
              productData?.pricing?.price ?? productData?.price ?? "",
            ),
            compareAtPrice: String(productData?.pricing?.compareAtPrice ?? ""),
            costPerItem: String(productData?.pricing?.costPerItem ?? ""),
            chargeTax: productData?.pricing?.chargeTax !== false,
            trackQuantity: productData?.pricing?.trackQuantity !== false,
          },
          options: productOptions,
          variants,
          gallery,
          primaryImageId,
          primaryCategoryId:
            typeof productData?.primaryCategoryId === "string"
              ? productData.primaryCategoryId
              : "",
          relatedProductIds: Array.isArray(productData?.relatedProductIds)
            ? productData.relatedProductIds
            : [],
          templateKey: normalizeProductTemplateKey(productData?.templateKey),
        });
        setProductSlug(
          typeof productData?.slug === "string" ? productData.slug : "",
        );
        setSourceRefs(toSourceRefs(productData?.sourceRefs));
      } else {
        setForm((prev) => ({
          ...prev,
          businessType: Array.isArray(businessType)
            ? businessType
            : businessType
              ? [businessType]
              : [],
          gallery: [],
          primaryImageId: "",
          relatedProductIds: [],
          templateKey: normalizeProductTemplateKey(prev.templateKey),
        }));
        setProductSlug("");
        setSourceRefs([]);
      }

      setLoading(false);
    };

    load().catch(() => {
      setLoading(false);
    });
  }, [editId, isEditing]);

  const regenerateVariants = () => {
    const basePrice = form.pricing.price || "0";
    const combos = buildVariantCombinations(form.options);
    const currentMap = new Map(form.variants.map((item) => [item.key, item]));

    const nextVariants: VariantRow[] = combos.map((combo, index) => {
      const key = composeVariantKey(combo) || `variant-${index + 1}`;
      const existing = currentMap.get(key);
      return {
        key,
        title: buildCombinationTitle(combo) || `Variant ${index + 1}`,
        optionValues: combo,
        sku:
          existing?.sku || `${(form.sku || "SKU").toUpperCase()}-${index + 1}`,
        price: existing?.price || basePrice,
        stock: existing?.stock || "0",
        compareAtPrice: existing?.compareAtPrice || "",
        cost: existing?.cost || "",
        imageId: existing?.imageId || "",
      };
    });

    setForm((prev) => ({ ...prev, variants: nextVariants }));
    showToast(
      `Generated ${nextVariants.length} variant${nextVariants.length === 1 ? "" : "s"}.`,
    );
  };

  const toggleAttributeSet = (attributeSetId: string) => {
    if (!attributeSetId) return;

    setForm((prev) => {
      const isRemoving = prev.attributeSetIds.includes(attributeSetId);
      const nextIds = isRemoving
        ? prev.attributeSetIds.filter((id) => id !== attributeSetId)
        : [...prev.attributeSetIds, attributeSetId];

      if (isRemoving) {
        // Remove options associated with this set
        return {
          ...prev,
          attributeSetIds: nextIds,
          options: prev.options.filter(
            (opt) => opt.attributeSetId !== attributeSetId,
          ),
          variants: [],
        };
      }

      const found = attributeSets.find(
        (set: any) =>
          set._id === attributeSetId ||
          set.key === attributeSetId ||
          set.name === attributeSetId,
      );

      if (!found) return { ...prev, attributeSetIds: nextIds };

      const setOptions: ProductOption[] = (
        Array.isArray(found.attributes) ? found.attributes : []
      )
        .filter((attr: any) => attr.enabled !== false)
        .map((attr: any) => ({
          key: sanitizeKey(attr.key || attr.label || ""),
          label: attr.label || attr.key || "Option",
          values: Array.isArray(attr.options) ? attr.options : [],
          selectedValues: [],
          useForVariants: false,
          draftValue: "",
          attributeSetId: found.key || found._id,
          attributeSetName: found.name,
        }));

      return {
        ...prev,
        attributeSetIds: nextIds,
        options: [...prev.options, ...setOptions],
        variants: [],
      };
    });
  };

  const updateOption = (index: number, patch: Partial<ProductOption>) => {
    setForm((prev) => {
      const options = [...prev.options];
      options[index] = { ...options[index], ...patch };
      return { ...prev, options };
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
      const nextValues = option.values.includes(draftValue)
        ? option.values
        : [...option.values, draftValue];
      const nextSelected = option.selectedValues.includes(draftValue)
        ? option.selectedValues
        : [...option.selectedValues, draftValue];

      options[index] = {
        ...option,
        values: nextValues,
        selectedValues: nextSelected,
        draftValue: "",
      };

      return { ...prev, options };
    });
  };

  const updateVariant = (
    variantKey: string,
    field: keyof VariantRow,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((item) =>
        item.key === variantKey ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const removeVariant = (variantKey: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((item) => item.key !== variantKey),
    }));
  };

  const toggleCategory = (categoryId: string) => {
    setForm((prev) => {
      const exists = prev.categoryIds.includes(categoryId);
      const nextIds = exists
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId];

      // If primary category is removed, reset it
      let nextPrimary = prev.primaryCategoryId;
      if (exists && prev.primaryCategoryId === categoryId) {
        nextPrimary = "";
      }
      // If it's the first category added, make it primary
      if (!exists && nextIds.length === 1) {
        nextPrimary = categoryId;
      }

      return {
        ...prev,
        categoryIds: nextIds,
        primaryCategoryId: nextPrimary,
      };
    });
  };

  const setPrimaryCategory = (categoryId: string) => {
    setForm((prev) => ({ ...prev, primaryCategoryId: categoryId }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCategory(true);
    try {
      const res = await fetch("/api/ecommerce/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: "product",
          parentId: newCategoryParentId || null,
        }),
      });
      if (res.ok) {
        const refreshed = await fetch(
          "/api/ecommerce/categories?type=product",
        ).then((r) => r.json());
        setCategories(Array.isArray(refreshed) ? refreshed : []);
        setNewCategoryName("");
        setNewCategoryParentId("");
        setShowAddCategoryModal(false);
        showToast("Category created.");
      } else {
        const data = await res.json();
        showToast(data.error || "Failed to create category.");
      }
    } catch {
      showToast("Error creating category.");
    } finally {
      setCreatingCategory(false);
    }
  };

  const addGalleryItem = (url: string, alt = "") => {
    const normalizedUrl = url.trim();
    if (!normalizedUrl) return;
    setForm((prev) => {
      const id = `gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const nextGallery = [
        ...prev.gallery,
        {
          id,
          url: normalizedUrl,
          alt,
          order: prev.gallery.length,
        },
      ];
      return {
        ...prev,
        gallery: nextGallery,
        primaryImageId: prev.primaryImageId || id,
      };
    });
  };

  const addGalleryFromUrlDraft = () => {
    if (!galleryUrlDraft.trim()) return;
    addGalleryItem(galleryUrlDraft, galleryAltDraft);
    setGalleryUrlDraft("");
    setGalleryAltDraft("");
  };

  const addGalleryFromMedia = () => {
    if (!mediaSelection) return;
    const selected = mediaItems.find((item) => item._id === mediaSelection);
    if (!selected?.url) return;
    addGalleryItem(selected.url, selected.filename || "");
    setMediaSelection("");
  };

  const handleGalleryFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const maxSize = 2 * 1024 * 1024;
    const rows = Array.from(files);
    for (const file of rows) {
      if (!file.type.startsWith("image/")) {
        showToast(`Skipped ${file.name}: not an image.`);
        continue;
      }
      if (file.size > maxSize) {
        showToast(`Skipped ${file.name}: file exceeds 2MB inline limit.`);
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        addGalleryItem(dataUrl, file.name);
      } catch {
        showToast(`Failed to load ${file.name}`);
      }
    }
  };

  const moveGalleryItem = (id: string, direction: "up" | "down") => {
    setForm((prev) => {
      const list = [...prev.gallery].sort((a, b) => a.order - b.order);
      const index = list.findIndex((item) => item.id === id);
      if (index < 0) return prev;
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= list.length) return prev;
      const next = [...list];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return {
        ...prev,
        gallery: next.map((item, itemIndex) => ({ ...item, order: itemIndex })),
      };
    });
  };

  const setPrimaryImage = (id: string) => {
    setForm((prev) => ({ ...prev, primaryImageId: id }));
  };

  const removeGalleryItem = (id: string) => {
    setForm((prev) => {
      const nextGallery = prev.gallery
        .filter((item) => item.id !== id)
        .map((item, index) => ({ ...item, order: index }));
      const nextPrimary =
        prev.primaryImageId === id
          ? nextGallery[0]?.id || ""
          : prev.primaryImageId;
      return {
        ...prev,
        gallery: nextGallery,
        primaryImageId: nextPrimary,
        variants: prev.variants.map((variant) =>
          variant.imageId === id ? { ...variant, imageId: "" } : variant,
        ),
      };
    });
  };

  const setVariantImage = (variantKey: string, imageId: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((variant) =>
        variant.key === variantKey ? { ...variant, imageId } : variant,
      ),
    }));
  };

  const toggleRelatedProduct = (productId: string) => {
    setForm((prev) => ({
      ...prev,
      relatedProductIds: prev.relatedProductIds.includes(productId)
        ? prev.relatedProductIds.filter((id) => id !== productId)
        : [...prev.relatedProductIds, productId],
    }));
  };

  const applySourcePatchToForm = (patch: Record<string, unknown>) => {
    setForm((prev) => {
      const merged = deepMergeRecord(
        prev as unknown as Record<string, unknown>,
        patch,
      ) as Record<string, unknown>;
      const pricing =
        merged.pricing && typeof merged.pricing === "object"
          ? (merged.pricing as Record<string, unknown>)
          : {};

      const options = Array.isArray(merged.options)
        ? (merged.options as ProductOption[])
        : prev.options;
      const variants = Array.isArray(merged.variants)
        ? (merged.variants as VariantRow[])
        : prev.variants;
      const gallery = Array.isArray(merged.gallery)
        ? parseGallery(merged.gallery)
        : prev.gallery;

      return {
        ...prev,
        ...(typeof merged.name === "string" ? { name: merged.name } : {}),
        ...(typeof merged.sku === "string" ? { sku: merged.sku } : {}),
        ...(typeof merged.description === "string"
          ? { description: merged.description }
          : {}),
        ...(typeof merged.status === "string" ? { status: merged.status } : {}),
        ...(merged.businessType !== undefined
          ? {
              businessType: Array.isArray(merged.businessType)
                ? merged.businessType
                : typeof merged.businessType === "string"
                  ? merged.businessType
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [],
            }
          : {}),
        pricing: {
          ...prev.pricing,
          ...(pricing.price !== undefined
            ? { price: String(pricing.price ?? "") }
            : {}),
          ...(pricing.compareAtPrice !== undefined
            ? { compareAtPrice: String(pricing.compareAtPrice ?? "") }
            : {}),
          ...(pricing.costPerItem !== undefined
            ? { costPerItem: String(pricing.costPerItem ?? "") }
            : {}),
        },
        options,
        variants,
        gallery,
      };
    });
  };

  const handleSave = async () => {
    if (!canMutate) return;
    if (!form.name.trim() || !form.sku.trim()) {
      showToast("Name and SKU are required.");
      return;
    }

    setSaving(true);
    const gallery = [...form.gallery]
      .sort((a, b) => a.order - b.order)
      .map((item, index) => ({
        id: item.id,
        url: item.url,
        alt: item.alt,
        order: index,
      }));

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      type: form.type,
      description: form.description,
      status: form.status,
      businessType: form.businessType,
      categoryIds: form.categoryIds,
      primaryCategoryId: form.primaryCategoryId || null,
      attributeSetIds: form.attributeSetIds,
      attributeSetId: activeAttributeSetId,
      slug: productSlug.trim(),
      pricing: {
        price: Number(form.pricing.price || 0),
        compareAtPrice: Number(form.pricing.compareAtPrice || 0),
        costPerItem: Number(form.pricing.costPerItem || 0),
        chargeTax: form.pricing.chargeTax,
        trackQuantity: form.pricing.trackQuantity,
      },
      price: Number(form.pricing.price || 0),
      options: form.options.map((option) => ({
        key: option.key,
        label: option.label,
        values: option.selectedValues,
        useForVariants: option.useForVariants,
        attributeSetId: option.attributeSetId,
        attributeSetName: option.attributeSetName,
      })),
      gallery,
      primaryImageId: form.primaryImageId || gallery[0]?.id || "",
      relatedProductIds: form.relatedProductIds,
      templateKey: normalizeProductTemplateKey(form.templateKey),
      sourceRefs: sourceRefs.map((item) => item.sourceId),
      variants: form.variants.map((variant) => ({
        title: variant.title,
        optionValues: variant.optionValues,
        sku: variant.sku.trim(),
        price: Number(variant.price || form.pricing.price || 0),
        stock: Number(variant.stock || 0),
        compareAtPrice: Number(variant.compareAtPrice || 0),
        cost: Number(variant.cost || 0),
        imageId: variant.imageId || "",
        status: "active",
      })),
    };

    const endpoint =
      isEditing && editId
        ? `/api/ecommerce/products/${editId}`
        : "/api/ecommerce/products";
    const method = isEditing ? "PUT" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      showToast(data?.error || "Failed to save product.");
      return;
    }

    const entityId = editId || data?.productId || "";
    if (entityId && sourceRefs.length > 0) {
      await Promise.all(
        sourceRefs.map((ref) =>
          fetch(`/api/sources/${ref.sourceId}/link-entity`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              entityType: "product",
              entityId,
              targetType: "product",
              fieldsApplied: [],
            }),
          }).catch(() => null),
        ),
      );
    }

    showToast(isEditing ? "Product updated." : "Product created.");
    router.push("/ecommerce");
  };

  const openTemplatePreview = (templateOverride?: string) => {
    const tenantKey = readTenantKeyFromCookie();
    if (!tenantKey) {
      showToast("Active tenant key not found.");
      return;
    }
    if (!productSlug.trim()) {
      showToast("Save the product first to generate a preview URL.");
      return;
    }
    const encodedSlug = encodeURIComponent(
      `${tenantKey}--${productSlug.trim()}`,
    );
    const selectedTemplate = normalizeProductTemplateKey(
      templateOverride || form.templateKey,
    );
    const url = `/product/${encodedSlug}?tenant=${encodeURIComponent(tenantKey)}&preview=1&previewTemplate=${encodeURIComponent(selectedTemplate)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    return categories
      .filter(
        (c) =>
          c.parentId === parentId ||
          (parentId === null && (!c.parentId || c.parentId === "null")),
      )
      .map((category) => {
        const selected = form.categoryIds.includes(category.slug);
        const isPrimary = form.primaryCategoryId === category.slug;
        return (
          <div
            key={category._id}
            className="space-y-1"
            style={{ marginLeft: level > 0 ? `${level * 12}px` : "0" }}
          >
            <div className="flex items-center gap-2 group">
              <div
                className={`flex-1 flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all ${selected ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" : "border-slate-700 bg-black/30 text-slate-300 hover:border-slate-600"}`}
              >
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => toggleCategory(category.slug)}
                >
                  <div className="font-semibold">{category.name}</div>
                  <div className="font-mono text-[10px] opacity-80">
                    /{category.slug}
                  </div>
                </div>
                {selected && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrimaryCategory(category.slug);
                      }}
                      className={`p-1 rounded hover:bg-white/10 ${isPrimary ? "text-amber-400" : "text-slate-500"}`}
                      title={isPrimary ? "Primary Category" : "Set as Primary"}
                    >
                      <Star
                        size={12}
                        fill={isPrimary ? "currentColor" : "none"}
                      />
                    </button>
                    <Check size={12} className="text-cyan-400" />
                  </div>
                )}
              </div>
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {!canMutate && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {isScopedRoleView
            ? "Scoped role view is read-only. Switch role to edit product data."
            : "This role is read-only for product mutations."}
        </div>
      )}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-black shadow-xl">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/ecommerce"
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-2 text-slate-300 hover:border-slate-500"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">
              {isEditing ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-xs text-slate-400">
              Business Type: {form.businessType.join(", ") || "Not set"}
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !canMutate}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-60"
        >
          <Save size={14} />
          {saving ? "Saving..." : isEditing ? "Update Product" : "Save Product"}
        </button>
      </div>

      <fieldset
        disabled={!canMutate}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <SourceRow
              targetType="product"
              enabled={sourceEnabled && canMutate}
              refs={sourceRefs}
              currentValues={form as unknown as Record<string, unknown>}
              onRefsChange={(refs) => {
                setSourceRefs(refs);
              }}
              onApplyPatch={applySourcePatchToForm}
              title="Source"
              description="Paste a link/text/JSON (or file metadata) and apply suggested product fields selectively."
            />
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              General
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Title
                </label>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Product name"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  SKU
                </label>
                <input
                  value={form.sku}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      sku: e.target.value.toUpperCase(),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="SKU-001"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Product Slug (URL Identity)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-mono">
                    /product/
                  </span>
                  <input
                    value={productSlug}
                    onChange={(e) => setProductSlug(slugify(e.target.value))}
                    className="flex-1 rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm font-mono text-cyan-400 focus:outline-none focus:border-cyan-500/50"
                    placeholder="product-url-slug"
                  />
                  <button
                    type="button"
                    onClick={() => setProductSlug(slugify(form.name))}
                    className="p-2 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-400"
                    title="Generate from Name"
                  >
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Business Context / Type
                </label>
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
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Product Template
                </label>
                <select
                  value={form.templateKey}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      templateKey: normalizeProductTemplateKey(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none appearance-none cursor-pointer"
                >
                  {PRODUCT_TEMPLATE_OPTIONS.map((template) => (
                    <option key={template.key} value={template.key}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openTemplatePreview()}
                    disabled={!productSlug.trim()}
                    className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    title={
                      productSlug.trim()
                        ? "Preview selected template on public route"
                        : "Save product first to generate preview URL"
                    }
                  >
                    <Eye size={12} />
                    Preview
                  </button>
                  <span className="text-[10px] text-slate-500">
                    {productSlug.trim() ? `/${productSlug}` : "No slug yet"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={5}
                className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                placeholder="Describe the product..."
              />
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Pricing
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  value={form.pricing.price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, price: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Compare At
                </label>
                <input
                  type="number"
                  value={form.pricing.compareAtPrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: {
                        ...prev.pricing,
                        compareAtPrice: e.target.value,
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Cost
                </label>
                <input
                  type="number"
                  value={form.pricing.costPerItem}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      pricing: { ...prev.pricing, costPerItem: e.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Flags
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.pricing.trackQuantity}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          trackQuantity: e.target.checked,
                        },
                      }))
                    }
                  />
                  Track quantity
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={form.pricing.chargeTax}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          chargeTax: e.target.checked,
                        },
                      }))
                    }
                  />
                  Charge tax
                </label>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Gallery
              </h2>
              <span className="text-xs text-slate-400">
                {form.gallery.length} item{form.gallery.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                value={galleryUrlDraft}
                onChange={(e) => setGalleryUrlDraft(e.target.value)}
                placeholder="Image URL"
                className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white md:col-span-2"
              />
              <button
                onClick={addGalleryFromUrlDraft}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-300"
              >
                <Link2 size={12} /> Add URL
              </button>
              <input
                value={galleryAltDraft}
                onChange={(e) => setGalleryAltDraft(e.target.value)}
                placeholder="Alt text (optional)"
                className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white md:col-span-3"
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <select
                value={mediaSelection}
                onChange={(e) => setMediaSelection(e.target.value)}
                className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white md:col-span-2"
              >
                <option value="">Select from Media Library</option>
                {mediaItems.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.filename || item.url || item._id}
                  </option>
                ))}
              </select>
              <button
                onClick={addGalleryFromMedia}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300"
              >
                Add Media
              </button>
              <label className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300 md:col-span-3">
                <ImagePlus size={12} />
                Upload image file(s)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleGalleryFiles(event.target.files).catch(() => null);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <p className="text-[11px] text-slate-500 md:col-span-3">
                Upload stores images as inline data URLs for now. Use Media
                Library URLs for production assets.
              </p>
            </div>

            {form.gallery.length === 0 ? (
              <div className="mt-3 rounded-lg border border-slate-800 bg-black/20 px-4 py-4 text-xs text-slate-500">
                Add one or more images. Set one as primary and optionally map
                images to variants.
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {form.gallery
                  .sort((a, b) => a.order - b.order)
                  .map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 items-center gap-3 rounded-lg border border-slate-800 bg-black/20 p-3 md:grid-cols-12"
                    >
                      <div className="md:col-span-2">
                        <img
                          src={item.url}
                          alt={item.alt || `Gallery ${index + 1}`}
                          className="h-16 w-full rounded-md border border-slate-700 object-cover"
                        />
                      </div>
                      <div className="md:col-span-6">
                        <p className="truncate text-xs text-slate-300">
                          {item.url}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {item.alt || "No alt text"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 md:col-span-2">
                        <button
                          onClick={() => moveGalleryItem(item.id, "up")}
                          className="rounded-md border border-slate-700 p-1 text-slate-300 hover:border-cyan-500/30"
                        >
                          <ChevronUp size={12} />
                        </button>
                        <button
                          onClick={() => moveGalleryItem(item.id, "down")}
                          className="rounded-md border border-slate-700 p-1 text-slate-300 hover:border-cyan-500/30"
                        >
                          <ChevronDown size={12} />
                        </button>
                        <label className="inline-flex items-center gap-1 text-[11px] text-slate-300">
                          <input
                            type="radio"
                            checked={form.primaryImageId === item.id}
                            onChange={() => setPrimaryImage(item.id)}
                          />
                          Primary
                        </label>
                      </div>
                      <div className="md:col-span-2 md:text-right">
                        <button
                          onClick={() => removeGalleryItem(item.id)}
                          className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Product Options
              </h2>
              <div className="flex items-center gap-2">
                <Link
                  href="/ecommerce/attributes"
                  className="rounded-lg border border-slate-700 bg-black/30 px-3 py-2 text-[11px] text-slate-300 hover:border-slate-500"
                >
                  Manage Sets
                </Link>
                <select
                  value=""
                  onChange={(e) => toggleAttributeSet(e.target.value)}
                  className="rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white"
                >
                  <option value="">Add Attribute Set</option>
                  {attributeSets
                    .filter((set: any) => {
                      const alreadyAdded = form.attributeSetIds.includes(
                        set.key || set._id,
                      );
                      if (alreadyAdded) return false;
                      const setBtKey = set.businessTypeKey || "";
                      if (selectedBtKey) {
                        // Only show sets that EXACTLY match the selected business context
                        return setBtKey === selectedBtKey;
                      }
                      // For general/shared context, only show sets with no business type association
                      return !setBtKey;
                    })
                    .map((set: any) => (
                      <option key={set._id} value={set.key || set._id}>
                        {set.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={regenerateVariants}
                  className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-400"
                >
                  <Sparkles size={12} /> Regenerate
                </button>
              </div>
            </div>

            {selectedAttributeSets.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedAttributeSets.map((set: any) => (
                  <div
                    key={set._id}
                    className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[10px] font-bold text-cyan-300"
                  >
                    <span>{set.name}</span>
                    <button
                      onClick={() => toggleAttributeSet(set.key || set._id)}
                      className="hover:text-white"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {form.options.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-black/20 px-4 py-6 text-sm text-slate-500">
                Select an attribute set to load product options.
              </div>
            ) : (
              <div className="space-y-8">
                {selectedAttributeSets.map((set) => {
                  const setOptions = form.options.filter(
                    (opt) => opt.attributeSetId === (set.key || set._id),
                  );
                  if (setOptions.length === 0) return null;

                  return (
                    <div key={set._id} className="space-y-4">
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
                              className="rounded-lg border border-slate-800 bg-black/20 p-4"
                            >
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">
                                    {option.label}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {option.key}
                                  </div>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={option.useForVariants}
                                    onChange={(e) =>
                                      updateOption(optionIndex, {
                                        useForVariants: e.target.checked,
                                      })
                                    }
                                  />
                                  Use for variants
                                </label>
                              </div>

                              <div className="flex flex-wrap gap-2 mb-3">
                                {option.values.map((value) => {
                                  const active =
                                    option.selectedValues.includes(value);
                                  return (
                                    <button
                                      key={value}
                                      onClick={() =>
                                        toggleOptionValue(optionIndex, value)
                                      }
                                      className={`rounded-md border px-2 py-1 text-xs transition-all ${active ? "border-cyan-500/40 bg-cyan-500/20 text-cyan-300" : "border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-600"}`}
                                    >
                                      {value}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  value={option.draftValue}
                                  onChange={(e) =>
                                    updateOption(optionIndex, {
                                      draftValue: e.target.value,
                                    })
                                  }
                                  placeholder="Add custom value"
                                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-xs text-white"
                                />
                                <button
                                  onClick={() =>
                                    addCustomOptionValue(optionIndex)
                                  }
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-400"
                                >
                                  <Plus size={12} /> Add
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {/* Fallback for orphaned options */}
                {form.options.filter(
                  (opt) =>
                    !opt.attributeSetId ||
                    !form.attributeSetIds.includes(opt.attributeSetId),
                ).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-slate-800" />
                      <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                        Custom/Legacy Options
                      </span>
                      <div className="h-px flex-1 bg-slate-800" />
                    </div>
                    <div className="space-y-4">
                      {form.options
                        .filter(
                          (opt) =>
                            !opt.attributeSetId ||
                            !form.attributeSetIds.includes(opt.attributeSetId),
                        )
                        .map((option) => {
                          const optionIndex = form.options.findIndex(
                            (o) =>
                              o.key === option.key &&
                              o.attributeSetId === option.attributeSetId,
                          );
                          return (
                            <div
                              key={`${option.key}-orphaned`}
                              className="rounded-lg border border-slate-800 bg-black/20 p-4 opacity-80"
                            >
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <div>
                                  <div className="text-sm font-semibold text-white">
                                    {option.label}
                                  </div>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={option.useForVariants}
                                    onChange={(e) =>
                                      updateOption(optionIndex, {
                                        useForVariants: e.target.checked,
                                      })
                                    }
                                  />
                                  Use for variants
                                </label>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {option.selectedValues.map((value) => (
                                  <span
                                    key={value}
                                    className="rounded-md border border-cyan-500/40 bg-cyan-500/20 px-2 py-1 text-xs text-cyan-300"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 italic">
                                This option is not linked to any active
                                attribute set. Associate it with one to fully
                                manage it.
                              </p>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Configure Variants
              </h2>
              <span className="text-xs text-slate-400">
                {form.variants.length} variants
              </span>
            </div>

            {form.variants.length === 0 ? (
              <div className="rounded-lg border border-slate-800 bg-black/20 px-4 py-6 text-sm text-slate-500">
                Generate variants from selected product options.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        Variant
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        Price
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        Stock
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        Compare
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        Cost
                      </th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-widest text-slate-500">
                        Image
                      </th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-widest text-slate-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.variants.map((variant) => (
                      <tr
                        key={variant.key}
                        className="border-b border-slate-800/60"
                      >
                        <td className="px-3 py-3">
                          <div className="text-xs text-white">
                            {variant.title}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={variant.sku}
                            onChange={(e) =>
                              updateVariant(
                                variant.key,
                                "sku",
                                e.target.value.toUpperCase(),
                              )
                            }
                            className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs font-mono text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) =>
                              updateVariant(
                                variant.key,
                                "price",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) =>
                              updateVariant(
                                variant.key,
                                "stock",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={variant.compareAtPrice}
                            onChange={(e) =>
                              updateVariant(
                                variant.key,
                                "compareAtPrice",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            type="number"
                            value={variant.cost}
                            onChange={(e) =>
                              updateVariant(variant.key, "cost", e.target.value)
                            }
                            className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={variant.imageId}
                            onChange={(e) =>
                              setVariantImage(variant.key, e.target.value)
                            }
                            className="w-full rounded-md border border-slate-700 bg-black/40 px-2 py-1 text-xs text-white"
                          >
                            <option value="">No image</option>
                            {form.gallery.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.alt || item.url.slice(0, 40)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => removeVariant(variant.key)}
                            className="rounded-md p-1 text-rose-400 hover:bg-rose-500/10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Organize
              </h2>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(true)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-black/30 px-2 py-1 text-[10px] font-bold text-slate-300 hover:border-slate-500"
              >
                <FolderPlus size={12} /> Add New
              </button>
            </div>
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {renderCategoryTree(null)}
              {categories.length === 0 && (
                <div className="text-[11px] text-slate-500 py-4 text-center">
                  No categories found.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
              Quick Summary
            </h2>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Options</span>
                <span>{form.options.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Variants</span>
                <span>{form.variants.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Categories</span>
                <span>{form.categoryIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Gallery</span>
                <span>{form.gallery.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Related Products</span>
                <span>{form.relatedProductIds.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Source Refs</span>
                <span>{sourceRefs.length}</span>
              </div>
            </div>
            <button
              onClick={regenerateVariants}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-400"
            >
              <Boxes size={12} /> Regenerate Variant Matrix
            </button>
          </section>

          <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-white mb-3">
              Related Products
            </h2>
            {relatedProductCandidates.length === 0 ? (
              <p className="text-xs text-slate-500">
                No other products available in this tenant.
              </p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {relatedProductCandidates.map((product) => {
                  const selected = form.relatedProductIds.includes(product._id);
                  return (
                    <button
                      key={product._id}
                      onClick={() => toggleRelatedProduct(product._id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-xs transition-all ${selected ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300" : "border-slate-700 bg-black/30 text-slate-300 hover:border-slate-600"}`}
                    >
                      <div className="font-semibold">
                        {product.name || "Untitled product"}
                      </div>
                      <div className="font-mono text-[10px] opacity-80">
                        {product.sku || product._id}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </fieldset>

      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-white mb-4">
              Add New Category
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Name
                </label>
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">
                  Parent Category (Optional)
                </label>
                <select
                  value={newCategoryParentId}
                  onChange={(e) => setNewCategoryParentId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none"
                >
                  <option value="">None (Top Level)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={creatingCategory || !newCategoryName.trim()}
                  onClick={handleAddCategory}
                  className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-black hover:bg-cyan-400 disabled:opacity-50"
                >
                  {creatingCategory ? "Creating..." : "Create Category"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
