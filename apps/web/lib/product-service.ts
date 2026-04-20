import { Db, ObjectId } from "mongodb";
import { normalizeProductTemplateKey } from "./commerce-template-options";

export type GalleryItem = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

const PRODUCT_DESCRIPTION_MAX = 2000;

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeGallery(value: unknown): GalleryItem[] {
  if (!Array.isArray(value)) return [];
  const items: GalleryItem[] = [];
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (typeof item === "string") {
      const url = item.trim();
      if (!url) continue;
      items.push({
        id: `gallery-${index + 1}-${Date.now()}`,
        url,
        alt: "",
        order: index,
      });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (!url) continue;
    const id =
      typeof row.id === "string" && row.id.trim()
        ? row.id.trim()
        : `gallery-${index + 1}-${Date.now()}`;
    items.push({
      id,
      url,
      alt: typeof row.alt === "string" ? row.alt : "",
      order: typeof row.order === "number" ? row.order : index,
    });
  }
  return items
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index }));
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function sanitizeDescription(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= PRODUCT_DESCRIPTION_MAX) return trimmed;
  return trimmed.slice(0, PRODUCT_DESCRIPTION_MAX).trimEnd();
}

export async function ensureUniqueProductSlug(
  collection: any,
  requestedSlug: string,
): Promise<string> {
  const base = slugify(requestedSlug) || "product";
  let candidate = base;
  let suffix = 2;

  while (
    await collection.findOne({ slug: candidate }, { projection: { _id: 1 } })
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export type CreateProductPayload = {
  name: string;
  sku: string;
  type?: string;
  price?: number;
  description?: string;
  status?: string;
  categoryIds?: string[];
  attributeSetId?: string | null;
  attributeSetIds?: string[];
  images?: string[];
  gallery?: any[];
  primaryImageId?: string;
  variants?: any[];
  businessType?: string[];
  pricing?: any;
  options?: any[];
  sourceRefs?: string[];
  relatedProductIds?: string[];
  templateKey?: string;
  slug?: string;
  primaryCategoryId?: string | null;
};

export async function createProduct(db: Db, payload: CreateProductPayload) {
  const {
    name,
    sku,
    type,
    price,
    description,
    status,
    categoryIds,
    attributeSetId,
    attributeSetIds,
    images,
    gallery,
    primaryImageId,
    variants,
    businessType,
    pricing,
    options,
    sourceRefs,
    relatedProductIds,
    templateKey,
    slug,
    primaryCategoryId,
  } = payload;

  if (!name || !sku) {
    throw new Error("Name and SKU are required.");
  }

  const normalizedPrice =
    Number(pricing?.price !== undefined ? pricing.price : price) || 0;

  const normalizedGallery = normalizeGallery(gallery);
  const resolvedImages =
    normalizedGallery.length > 0
      ? normalizedGallery.map((item) => item.url)
      : Array.isArray(images)
        ? images
        : [];
  const resolvedPrimaryImageId =
    typeof primaryImageId === "string" && primaryImageId.trim()
      ? primaryImageId.trim()
      : normalizedGallery[0]?.id || "";

  const productsCol = db.collection("products");
  const nextSlug = await ensureUniqueProductSlug(
    productsCol,
    typeof slug === "string" && slug.trim() ? slug : name,
  );

  const product = {
    type: typeof type === "string" && type.trim() ? type.trim() : "physical",
    name,
    slug: nextSlug,
    sku: sku.trim(),
    price: normalizedPrice,
    description: sanitizeDescription(description),
    status: status || "draft",
    categoryIds: categoryIds || [],
    attributeSetId: attributeSetId || null,
    attributeSetIds: Array.isArray(attributeSetIds) ? attributeSetIds : [],
    businessType: normalizeStringArray(businessType),
    pricing: pricing || {
      price: normalizedPrice,
      compareAtPrice: 0,
      costPerItem: 0,
      chargeTax: true,
      trackQuantity: true,
    },
    options: Array.isArray(options) ? options : [],
    sourceRefs: Array.isArray(sourceRefs)
      ? sourceRefs.filter((item: unknown) => typeof item === "string")
      : [],
    relatedProductIds: normalizeStringArray(relatedProductIds),
    templateKey: normalizeProductTemplateKey(templateKey),
    gallery: normalizedGallery,
    primaryImageId: resolvedPrimaryImageId,
    primaryCategoryId: primaryCategoryId || null,
    images: resolvedImages,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await productsCol.insertOne(product);
  const productId = result.insertedId.toString();

  // Insert variants if provided
  if (variants && Array.isArray(variants) && variants.length > 0) {
    const variantDocs = variants.map((v: any) => ({
      productId,
      sku:
        v.sku ||
        `${sku}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      title: v.title || "",
      price: Number(v.price ?? normalizedPrice) || normalizedPrice,
      stock: Number(v.stock || 0),
      compareAtPrice: Number(v.compareAtPrice || 0),
      cost: Number(v.cost || 0),
      optionValues: v.optionValues || {},
      imageId: typeof v.imageId === "string" ? v.imageId : "",
      status: v.status || "active",
      createdAt: new Date(),
    }));
    await db.collection("variants").insertMany(variantDocs);
  }

  return {
    productId,
    slug: nextSlug,
  };
}
