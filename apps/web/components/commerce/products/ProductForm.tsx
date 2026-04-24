"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Save,
  Terminal,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hook/store/hooks";
import { toast } from "sonner";
import { RootState } from "@/hook/store/store";

import {
  setProductFormField,
  resetProductForm,
  setPricingField,
  setCurrentProduct,
} from "@/hook/slices/commerce/products/ProductSlice";


import { GeneralInformation } from "./studio/GeneralInformation";
import { PricingInventory } from "./studio/PricingInventory";
import { VisualMedia } from "./studio/VisualMedia";
import { OptionConfiguration } from "./studio/OptionConfiguration";
import { VariantMatrix } from "./studio/VariantMatrix";
import { PublicationSidebar } from "./studio/PublicationSidebar";
import { Product, Variant } from "@/hook/slices/commerce/products/ProductType";
import { buildCombinationTitle, buildVariantCombinations, generateSKUWithBaseSKU, sanitizeKey } from "@/lib/admin-products/utils";

interface ProductFormProps {
  initialData?: Product | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  // isLoading: boolean;
}

export default function ProductForm({ initialData, onSubmit, onCancel }: ProductFormProps) {
  const dispatch = useAppDispatch();
  const isEditing = Boolean(initialData);

  const { allCategories } = useAppSelector(
    (state: RootState) => state.category,
  );
  const { allAttributes } = useAppSelector(
    (state: RootState) => state.attribute,
  );
  const {
    allProducts,
    currentProduct: form,
    // isLoading: productLoading,
  } = useAppSelector((state: RootState) => state.product);
  
  const allForms: any[] = [];

  // const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [galleryUrlDraft, setGalleryUrlDraft] = useState("");
  const [productSlug, setProductSlug] = useState("");

  const relatedProductCandidates = useMemo(
    () => allProducts.filter((item: any) => item.id !== (initialData?.id || initialData?.id)),
    [allProducts, initialData],
  );

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        if (isEditing && initialData) {
          dispatch(setCurrentProduct(initialData));
          setProductSlug(initialData.slug || "");
        } else {
          dispatch(resetProductForm());
          setProductSlug("");
        }
      } catch (err) {
        console.error("Tactical initialization failed", err);
        toast.error("COMMUNICATIONS FAILURE: Hub initialization terminated.");
      }
    };
    init();
  }, [initialData, isEditing, dispatch]);

  const handleSave = async () => {
    debugger;
    if (!form) return;
    if (!form.name?.trim() || !form.sku?.trim()) {
      return toast.error(
        "Name and sku is required",
      );
    }

    if (productSlug.trim().length < 2) {
      return toast.error("Slug must be at least 2 characters long");
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name?.trim(),
        slug: productSlug.trim(),
        sku: form.sku?.trim(),
        description: form.description,
        brandId: form.brandId,
        vendorId: form.vendorId,
        collectionIds: (form.collectionIds || []).filter(Boolean),
        attributeSetIds: (form.attributeSetIds || []).filter(Boolean),
        categoryIds: (form.categoryIds || []).filter(Boolean),
        seoTitle: form.seoTitle,
        seoDescription: form.seoDescription,
        status: form.status || "active",
        type: form.type || "physical",
        price: Number(form.pricing?.price || 0),
        productAttributes: (form.productAttributes || []).map((attr: any) => ({
          attributeId: attr.attributeId,
          value: attr.value
        })),
        variants: (form.variants || []).map((v: any) => ({
          sku: v.sku,
          title: v.title,
          price: Number(v.price || 0),
          currency: "INR",
          stock: Number(v.stock || 0),
          attributeValues: Object.entries(v.optionValues || {}).map(([key, val]) => ({
            attributeId: key,
            value: val as string
          })),
          compareAtPrice: Number(v.compareAtPrice || 0),
          imageId: v.imageId || ""
        })),
        relatedProductIds: (form.relatedProductIds || []).filter(Boolean),
      };

      await onSubmit(payload);
    } finally {
      setSaving(false);
    }
  };

  const regenerateVariants = () => {
    if (!form) return;
    const combos = buildVariantCombinations(form?.options || []);
    const nextVariants: Variant[] = combos.map((combo, index) => {
      const existing = (form?.variants || []).find((v: any) =>
        Object.entries(combo).every(
          ([key, val]) => v.optionValues[key] === val,
        ),
      );

      return {
        id: existing?.id || `v-${index}-${Date.now()}`,
        title:
          existing?.title ||
          buildCombinationTitle(combo) ||
          `Variant ${index + 1}`,
        optionValues: combo,
        sku: existing?.sku || generateSKUWithBaseSKU(form.sku || "", combo),
        price: Number(existing?.price || form.pricing?.price || 0),
        stock: Number(existing?.stock || 0),
        status: existing?.status || "active",
      };
    });

    dispatch(setProductFormField({ field: "variants", value: nextVariants }));
    toast.info(`MATRIX REBUILT: ${nextVariants.length} UNITS LOCALIZED`);
  };

  const toggleAttributeSet = (id: string) => {
    if (!form || !id) return;
    const attributeSetIds = form.attributeSetIds || [];
    const isRemoving = attributeSetIds.includes(id);
    const nextIds = isRemoving
      ? attributeSetIds.filter((i: string) => i !== id && i)
      : [...attributeSetIds.filter(Boolean), id];

    const nextOptions = isRemoving
      ? (form.options || []).filter((o: any) => o.attributeSetId !== id)
      : [
          ...(form.options || []),
          ...(
            allAttributes.find((s: any) => (s.key || s._id) === id)
              ?.attributes || []
          )
            .filter((a: any) => a.enabled !== false)
            .map((a: any) => ({
              key: sanitizeKey(a.key || a.label || ""),
              label: a.label || a.key || "Option",
              values: a.options || [],
              selectedValues: [],
              useForVariants: false,
              draftValue: "",
              attributeSetId: id,
            })),
        ];

    dispatch(setProductFormField({ field: "attributeSetIds", value: nextIds }));
    dispatch(setProductFormField({ field: "options", value: nextOptions }));
    dispatch(setProductFormField({ field: "variants", value: [] }));
  };

  const toggleCategory = (id: string) => {
    if (!form || !id) return;
    const categoryIds = form.categoryIds || [];
    const exists = categoryIds.includes(id);
    const nextIds = exists
      ? categoryIds.filter((i: string) => i !== id && i)
      : [...categoryIds.filter(Boolean), id];

    dispatch(setProductFormField({ field: "categoryIds", value: nextIds }));

    if (exists && form.primaryCategoryId === id) {
      dispatch(setProductFormField({ field: "primaryCategoryId", value: "" }));
    } else if (!exists && nextIds.length === 1) {
      dispatch(setProductFormField({ field: "primaryCategoryId", value: id }));
    }
  };

  const addOptionValue = (idx: number) => {
    if (!form || !form.options) return;
    const opt = form.options[idx];
    const val = opt.draftValue?.trim();
    if (!val) return;
    const next = [...form.options];
    next[idx] = {
      ...opt,
      values: [...opt.values, val],
      selectedValues: [...opt.selectedValues, val],
      draftValue: "",
    };
    dispatch(setProductFormField({ field: "options", value: next }));
  };

  if (!form) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 border-2 border-white/5 border-t-gold rounded-full animate-spin shadow-lg shadow-gold/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
          Initializing Tactical Hub...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Tactical Header */}
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
              {isEditing ? "Update" : "Add"}{" "}
              <span className="text-gold">Product</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest italic">
            <Terminal size={12} className="text-gold/50" />
            {isEditing
              ? `Modifying Unit ${form.sku}`
              : "Add New Product"}
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
            className="h-12 px-10 bg-olive text-white font-black text-[10px] uppercase tracking-widest hover:bg-olive-lt transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-olive/20"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isEditing ? "Update" : "Add"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Interface */}
        <div className="lg:col-span-8 space-y-8">
          <GeneralInformation
            name={form.name || ""}
            sku={form.sku || ""}
            slug={productSlug}
            description={form.description || ""}
            onFormChange={(field, value) =>
              dispatch(setProductFormField({ field: field as any, value }))
            }
            onSlugChange={setProductSlug}
          />

          <PricingInventory
            pricing={form.pricing || { price: "" }}
            onPricingChange={(field, value) =>
              dispatch(setPricingField({ field: field as any, value }))
            }
          />

          <VisualMedia
            gallery={form.gallery || []}
            primaryImageId={form.primaryImageId || ""}
            galleryUrlDraft={galleryUrlDraft}
            onGalleryChange={(gallery) =>
              dispatch(
                setProductFormField({ field: "gallery", value: gallery }),
              )
            }
            onPrimaryImageChange={(id) =>
              dispatch(
                setProductFormField({ field: "primaryImageId", value: id }),
              )
            }
            onGalleryUrlDraftChange={setGalleryUrlDraft}
            onAddGalleryItem={(item) => {
              dispatch(
                setProductFormField({
                  field: "gallery",
                  value: [...(form.gallery || []), item],
                }),
              );
              if (!form.primaryImageId) {
                dispatch(
                  setProductFormField({
                    field: "primaryImageId",
                    value: item.id,
                  }),
                );
              }
            }}
          />

          <OptionConfiguration
            attributeSetIds={form.attributeSetIds || []}
            options={form.options || []}
            onToggleAttributeSet={toggleAttributeSet}
            onOptionChange={(idx, opt) => {
              const next = [...(form.options || [])];
              next[idx] = opt;
              dispatch(setProductFormField({ field: "options", value: next }));
            }}
            onAddOptionValue={addOptionValue}
            onRegenerateVariants={regenerateVariants}
          />

          <VariantMatrix
            variants={form.variants || []}
            onVariantsChange={(variants) =>
              dispatch(
                setProductFormField({ field: "variants", value: variants }),
              )
            }
          />
        </div>

        {/* Tactical Control Sidebar */}
        <div className="lg:col-span-4">
          <PublicationSidebar
            status={form.status || "active"}
            templateKey={form.templateKey || ""}
            allCategories={allCategories}
            categoryIds={form.categoryIds || []}
            primaryCategoryId={form.primaryCategoryId || ""}
            relatedProductCandidates={relatedProductCandidates}
            relatedProductIds={form.relatedProductIds || []}
            onFormChange={(field, value) =>
              dispatch(setProductFormField({ field: field as any, value }))
            }
            onToggleCategory={toggleCategory}
            onToggleRelatedProduct={(id) => {
              if (!id) return;
              const relatedProductIds = form.relatedProductIds || [];
              const exists = relatedProductIds.includes(id);
              const nextIds = exists
                ? relatedProductIds.filter((rid: string) => rid !== id && rid)
                : [...relatedProductIds.filter(Boolean), id];
              
              dispatch(
                setProductFormField({
                  field: "relatedProductIds",
                  value: nextIds,
                }),
              )
            }}
            allForms={allForms}
            formId={form.formId || ""}
          />
        </div>
      </div>
    </div>
  );
}

