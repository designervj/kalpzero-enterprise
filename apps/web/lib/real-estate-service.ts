import { Db, ObjectId } from "mongodb";
import { normalizeProductTemplateKey } from "./commerce-template-options";

export type PropertyGalleryItem = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

const PROPERTY_DESCRIPTION_MAX = 2000;

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeGallery(value: unknown): PropertyGalleryItem[] {
  if (!Array.isArray(value)) return [];
  const items: PropertyGalleryItem[] = [];
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
  if (trimmed.length <= PROPERTY_DESCRIPTION_MAX) return trimmed;
  return trimmed.slice(0, PROPERTY_DESCRIPTION_MAX).trimEnd();
}

export async function ensureUniquePropertySlug(
  collection: any,
  requestedSlug: string,
): Promise<string> {
  const base = slugify(requestedSlug) || "property";
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

export type CreatePropertyPayload = {
  name: string;
  sku: string;
  location?: string;
  type?: string;
  price?: number;
  description?: string;
  status?: string;
  categoryIds?: string[];
  primaryCategoryId?: string | null;
  attributeSetId?: string | null;
  attributeSetIds?: string[];
  images?: string[];
  gallery?: any[];
  primaryImageId?: string;
  businessType?: string[];
  pricing?: any;
  options?: any[];
  sourceRefs?: string[];
  templateKey?: string;
  slug?: string;
};

export async function createProperty(db: Db, payload: CreatePropertyPayload) {
  const {
    name,
    sku,
    location,
    type,
    price,
    description,
    status,
    categoryIds,
    primaryCategoryId,
    attributeSetId,
    attributeSetIds,
    images,
    gallery,
    primaryImageId,
    businessType,
    pricing,
    options,
    sourceRefs,
    templateKey,
    slug,
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

  const propertiesCol = db.collection("real_estate");
  const nextSlug = await ensureUniquePropertySlug(
    propertiesCol,
    typeof slug === "string" && slug.trim() ? slug : name,
  );

  const property = {
    type: typeof type === "string" && type.trim() ? type.trim() : "property",
    name,
    slug: nextSlug,
    sku: sku.trim(),
    location: location?.trim() || "",
    price: normalizedPrice,
    description: sanitizeDescription(description),
    status: status || "draft",
    categoryIds: categoryIds || [],
    primaryCategoryId: primaryCategoryId || null,
    attributeSetId: attributeSetId || null,
    attributeSetIds: Array.isArray(attributeSetIds) ? attributeSetIds : [],
    businessType: normalizeStringArray(businessType),
    pricing: pricing || {
      price: normalizedPrice,
      compareAtPrice: 0,
    },
    options: Array.isArray(options) ? options : [],
    sourceRefs: Array.isArray(sourceRefs)
      ? sourceRefs.filter((item: unknown) => typeof item === "string")
      : [],
    templateKey: normalizeProductTemplateKey(templateKey),
    gallery: normalizedGallery,
    primaryImageId: resolvedPrimaryImageId,
    images: resolvedImages,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await propertiesCol.insertOne(property);
  const propertyId = result.insertedId.toString();

  return {
    propertyId,
    slug: nextSlug,
  };
}
