import type { Db, ObjectId } from "mongodb";
import {
  isEducationContextActive,
  isTravelContextActive,
} from "@/lib/business-context";
import { findBusinessTemplateFromCatalog } from "@/lib/business-template-catalog";

type AttributeFieldType =
  | "select"
  | "multiselect"
  | "text"
  | "number"
  | "boolean";

export interface AttributeFieldPreset {
  key: string;
  label: string;
  type?: AttributeFieldType;
  options?: string[];
  hint?: string;
}

export interface AttributeSetPreset {
  key: string;
  name: string;
  appliesTo: "product";
  contexts: string[];
  attributes: AttributeFieldPreset[];
  businessType?: string;
}

type TenantAttributePresetInput = {
  industry?: string;
  businessType?: string | string[] | any | any[];
  businessContexts?: string[];
};

const LEGACY_SYSTEM_SET_KEYS = new Set<string>([
  "apparel-sizing",
  "electronics-spec",
  "stay-room-plan",
  "tour-package-options",
  "program-delivery",
  "general-product-attributes",
]);

function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function buildGenericFallbackSet(contexts: string[]): AttributeSetPreset {
  return {
    key: "general-product-attributes",
    name: "Core Attributes",
    appliesTo: "product",
    contexts,
    attributes: [
      { key: "title", label: "Title", type: "text" },
      { key: "category", label: "Category", type: "text" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: ["Active", "Draft", "Archived"],
      },
    ],
  };
}

function buildTravelFallbackSet(contexts: string[]): AttributeSetPreset {
  return {
    key: "travel-package-core",
    name: "Package Attributes",
    appliesTo: "product",
    contexts,
    attributes: [
      { key: "destination", label: "Destination", type: "text" },
      { key: "trip-duration", label: "Trip Duration", type: "text" },
      {
        key: "travel-style",
        label: "Travel Style",
        type: "select",
        options: ["Budget", "Standard", "Premium", "Luxury"],
      },
      {
        key: "transport",
        label: "Transport",
        type: "multiselect",
        options: ["Flight", "Train", "Bus", "Private Cab"],
      },
    ],
  };
}

function buildEducationFallbackSet(contexts: string[]): AttributeSetPreset {
  return {
    key: "education-program-core",
    name: "Program Attributes",
    appliesTo: "product",
    contexts,
    attributes: [
      {
        key: "program-level",
        label: "Program Level",
        type: "select",
        options: ["Beginner", "Intermediate", "Advanced"],
      },
      {
        key: "delivery-mode",
        label: "Delivery Mode",
        type: "select",
        options: ["Offline", "Online", "Hybrid"],
      },
      { key: "duration", label: "Duration", type: "text" },
      {
        key: "schedule-band",
        label: "Schedule",
        type: "select",
        options: ["Morning", "Afternoon", "Evening", "Weekend"],
      },
    ],
  };
}

function uniqueByKey(sets: AttributeSetPreset[]): AttributeSetPreset[] {
  const map = new Map<string, AttributeSetPreset>();
  for (const item of sets) {
    const normalizedKey = normalizeToken(item.key);
    if (!normalizedKey || map.has(normalizedKey)) continue;
    map.set(normalizedKey, item);
  }
  return Array.from(map.values());
}

function buildCatalogPreset(
  input: TenantAttributePresetInput,
): AttributeSetPreset[] {
  const resolved = findBusinessTemplateFromCatalog({
    industry: typeof input.industry === "string" ? input.industry : "",
    businessType:
      typeof input.businessType === "string" ? input.businessType : "",
  });
  if (!resolved) return [];

  const contexts = normalizeStringArray(input.businessContexts);
  const fallbackContexts =
    contexts.length > 0
      ? contexts
      : normalizeStringArray(resolved.businessContexts);

  return resolved.attributeSetPresets.map((preset) => ({
    key: preset.key,
    name: preset.name || "Core Attributes",
    appliesTo: "product",
    contexts: fallbackContexts,
    attributes: preset.attributes.map((attribute) => ({
      key: attribute.key,
      label: attribute.label,
      type: attribute.type,
      options: Array.isArray(attribute.options) ? attribute.options : [],
      hint: attribute.hint,
    })),
    businessType: resolved.businessType,
  }));
}

export function buildAttributeSetPresetsForTenant(
  input: TenantAttributePresetInput,
): AttributeSetPreset[] {
  const contexts = normalizeStringArray(input.businessContexts);
  const presets: AttributeSetPreset[] = [];

  const types = Array.isArray(input.businessType)
    ? input.businessType
    : input.businessType
      ? [input.businessType]
      : [];

  for (const type of types) {
    const typeStr = typeof type === "string" ? type : type?.name || type?.key;
    if (!typeStr) continue;

    const catalogPresets = buildCatalogPreset({
      ...input,
      businessType: typeStr,
    });
    if (catalogPresets.length > 0) {
      presets.push(...catalogPresets);
    }
  }

  if (presets.length === 0) {
    if (isTravelContextActive(contexts)) {
      presets.push(buildTravelFallbackSet(contexts));
    } else if (isEducationContextActive(contexts)) {
      presets.push(buildEducationFallbackSet(contexts));
    } else {
      presets.push(buildGenericFallbackSet(contexts));
    }
  }

  return uniqueByKey(presets);
}

function normalizeExistingSetKey(set: {
  key?: unknown;
  name?: unknown;
}): string {
  if (typeof set.key === "string" && set.key.trim())
    return normalizeToken(set.key);
  if (typeof set.name === "string" && set.name.trim())
    return normalizeToken(set.name);
  return "";
}

export async function ensureTenantAttributeSets(
  db: Db,
  input: TenantAttributePresetInput,
): Promise<{
  insertedCount: number;
  removedCount: number;
  totalPresets: number;
  seededSetKeys: string[];
  seededSetNames: string[];
}> {
  const presets = buildAttributeSetPresetsForTenant(input);
  if (presets.length === 0)
    return {
      insertedCount: 0,
      removedCount: 0,
      totalPresets: 0,
      seededSetKeys: [],
      seededSetNames: [],
    };

  const isFallbackOnly =
    presets.length === 1 &&
    (presets[0].key === "general-product-attributes" ||
      presets[0].key === "travel-package-core" ||
      presets[0].key === "education-program-core");

  const collection = db.collection("attribute_sets");

  const existing = (await collection
    .find(
      {},
      { projection: { _id: 1, key: 1, name: 1, isSystem: 1, source: 1 } },
    )
    .toArray()) as Array<{
    _id: ObjectId;
    key?: string;
    name?: string;
    isSystem?: boolean;
    source?: string;
  }>;

  const desiredKeys = new Set(
    presets.map((preset) => normalizeToken(preset.key)),
  );
  const existingKeySet = new Set(
    existing.map(normalizeExistingSetKey).filter(Boolean),
  );
  const now = new Date();

  const staleIds = existing
    .filter((record) => {
      const key = normalizeExistingSetKey(record);
      if (!key || desiredKeys.has(key)) return false;
      if (record.isSystem !== true) return false;
      if (record.source === "business-template-catalog") return true;
      return LEGACY_SYSTEM_SET_KEYS.has(key);
    })
    .map((record) => record._id);

  if (staleIds.length > 0 && !isFallbackOnly) {
    await collection.deleteMany({ _id: { $in: staleIds } });
  } else if (staleIds.length > 0 && isFallbackOnly) {
    console.log(
      `[ensureTenantAttributeSets] Skipping deletion of ${staleIds.length} sets because catalog lookup resulted in fallback only.`,
    );
  }


  const docs = presets
    .filter((preset) => !existingKeySet.has(normalizeToken(preset.key)))
    .map((preset) => ({
      key: preset.key,
      name: preset.name,
      appliesTo: preset.appliesTo,
      contexts: preset.contexts,
      attributes: preset.attributes.map((attribute) => ({
        key: attribute.key,
        label: attribute.label,
        type: attribute.type || "select",
        options: Array.isArray(attribute.options) ? attribute.options : [],
        hint: attribute.hint || "",
      })),
      businessType: preset.businessType || "",
      businessTypeKey: preset.businessType || "",
      isSystem: true,
      source: "business-template-catalog",
      createdAt: now,
      updatedAt: now,
    }));

  if (docs.length > 0) {
    await collection.insertMany(docs);
  }

  return {
    insertedCount: docs.length,
    removedCount: staleIds.length,
    totalPresets: presets.length,
    seededSetKeys: presets.map((preset) => preset.key),
    seededSetNames: presets.map((preset) => preset.name),
  };
}
