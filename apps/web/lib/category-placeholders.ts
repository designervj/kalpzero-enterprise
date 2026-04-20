export interface CategoryPlaceholderData {
  name: string;
  description: string;
  productCount: string;
  subcatsHtml: string;
  categoriesHtml: string;
  /** Replaces materialsHtml — renders all variant option filter blocks */
  variantFiltersHtml: string;
  productGridHtml: string;
}

export function resolveCategoryPlaceholders(
  template: string,
  data: CategoryPlaceholderData,
): string {
  let result = template;

  result = result.replace(
    /\{\{\s*category\.name\s*\}\}/g,
    data.name || "Category",
  );
  result = result.replace(
    /\{\{\s*category\.description\s*\}\}/g,
    data.description || "",
  );
  result = result.replace(
    /\{\{\s*productCount\s*\}\}/g,
    data.productCount || "0",
  );
  result = result.replace(/\{\{\s*subcatsHtml\s*\}\}/g, data.subcatsHtml || "");
  result = result.replace(
    /\{\{\s*categoriesHtml\s*\}\}/g,
    data.categoriesHtml || "",
  );
  // Support both old materialsHtml and new variantFiltersHtml
  result = result.replace(
    /\{\{\s*materialsHtml\s*\}\}/g,
    data.variantFiltersHtml || "",
  );
  result = result.replace(
    /\{\{\s*variantFiltersHtml\s*\}\}/g,
    data.variantFiltersHtml || "",
  );
  result = result.replace(
    /\{\{\s*productGridHtml\s*\}\}/g,
    data.productGridHtml || "",
  );

  return result;
}
