export type ProductTemplateKey =
  | "product-split"
  | "product-centered"
  | "product-showcase"
  | "product-minimal";

export type CategoryTemplateKey =
  | "category-sidebar"
  | "category-topbar"
  | "category-masonry";

type CategoryType = "product" | "portfolio" | "blog";

export const PRODUCT_TEMPLATE_OPTIONS: Array<{
  key: ProductTemplateKey;
  label: string;
  description: string;
}> = [
  {
    key: "product-split",
    label: "Split Classic",
    description: "Two-column product detail with sticky gallery and buy panel.",
  },
  {
    key: "product-centered",
    label: "Centered Focus",
    description: "Centered storytelling layout for premium highlights.",
  },
  {
    key: "product-showcase",
    label: "Showcase Grid",
    description: "Visual-first layout with merchandising highlights.",
  },
  {
    key: "product-minimal",
    label: "Minimal Clean",
    description:
      "A clean, typography-focused layout with distraction-free checkout.",
  },
];

export const CATEGORY_TEMPLATE_OPTIONS: Array<{
  key: CategoryTemplateKey;
  label: string;
  description: string;
}> = [
  {
    key: "category-sidebar",
    label: "Sidebar Filters",
    description: "Left filter rail with responsive product grid.",
  },
  {
    key: "category-topbar",
    label: "Topbar Filters",
    description: "Compact top controls with wide listing area.",
  },
  {
    key: "category-masonry",
    label: "Masonry Explorer",
    description: "Visual masonry cards for content-rich collections.",
  },
];

const PRODUCT_TEMPLATE_SET = new Set<string>(
  PRODUCT_TEMPLATE_OPTIONS.map((item) => item.key),
);
const CATEGORY_TEMPLATE_SET = new Set<string>(
  CATEGORY_TEMPLATE_OPTIONS.map((item) => item.key),
);

const PRODUCT_TEMPLATE_ALIASES: Record<string, ProductTemplateKey> = {
  product_page_default: "product-split",
  "product-page-default": "product-split",
  product_default: "product-split",
};

const CATEGORY_TEMPLATE_ALIASES: Record<string, CategoryTemplateKey> = {
  category_page_default: "category-sidebar",
  "category-page-default": "category-sidebar",
  "product-category-default": "category-sidebar",
  "portfolio-category-default": "category-masonry",
  "blog-category-default": "category-topbar",
};

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeProductTemplateKey(
  value: unknown,
  fallback: ProductTemplateKey = "product-split",
): ProductTemplateKey {
  const normalized = normalizeString(value);
  if (PRODUCT_TEMPLATE_SET.has(normalized))
    return normalized as ProductTemplateKey;
  return PRODUCT_TEMPLATE_ALIASES[normalized] || fallback;
}

export function defaultCategoryTemplateForType(
  type: CategoryType,
): CategoryTemplateKey {
  if (type === "portfolio") return "category-masonry";
  if (type === "blog") return "category-topbar";
  return "category-sidebar";
}

export function normalizeCategoryTemplateKey(
  value: unknown,
  fallback: CategoryTemplateKey = "category-sidebar",
): CategoryTemplateKey {
  const normalized = normalizeString(value);
  if (CATEGORY_TEMPLATE_SET.has(normalized))
    return normalized as CategoryTemplateKey;
  return CATEGORY_TEMPLATE_ALIASES[normalized] || fallback;
}

export function getProductTemplateLabel(value: unknown): string {
  const key = normalizeProductTemplateKey(value);
  return (
    PRODUCT_TEMPLATE_OPTIONS.find((item) => item.key === key)?.label ||
    "Split Classic"
  );
}

export function getCategoryTemplateLabel(
  value: unknown,
  type: CategoryType = "product",
): string {
  const key = normalizeCategoryTemplateKey(
    value,
    defaultCategoryTemplateForType(type),
  );
  return (
    CATEGORY_TEMPLATE_OPTIONS.find((item) => item.key === key)?.label ||
    "Sidebar Filters"
  );
}
