import { ProductOption, Variant as VariantRow } from "@/hook/slices/commerce/products/ProductType";

export type { ProductOption, VariantRow };

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function sanitizeKey(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildCombinationTitle(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" / ");
}

export function buildVariantCombinations(
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

export function generateSKUWithBaseSKU(baseSKU: string, combo: Record<string, string>): string {
  if (!baseSKU) return "";
  const suffix = Object.values(combo).map(v => v.toUpperCase().slice(0, 3)).join("-");
  return suffix ? `${baseSKU}-${suffix}` : baseSKU;
}
