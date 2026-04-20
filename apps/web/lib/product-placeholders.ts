export interface ProductPlaceholderData {
  name: string;
  description: string;
  price: string;
  compareAtPrice: string;
  discount: string;
  primaryImage: string;
  gallery: string[];
  slug?: string;
  id?: string;
  options?: string;
  specifications?: string;
  specsSection?: string;
  galleryThumbs?: string;
}

export function resolveProductPlaceholders(
  template: string,
  data: ProductPlaceholderData,
): string {
  let result = template;

  // Basic properties
  result = result.replace(
    /\{\{\s*product\.name\s*\}\}/g,
    data.name || "Product",
  );
  result = result.replace(
    /\{\{\s*product\.title\s*\}\}/g,
    data.name || "Product",
  );
  result = result.replace(
    /\{\{\s*product\.description\s*\}\}/g,
    data.description || "",
  );
  result = result.replace(/\{\{\s*product\.price\s*\}\}/g, data.price || "");
  result = result.replace(
    /\{\{\s*product\.compareAtPrice\s*\}\}/g,
    data.compareAtPrice || "",
  );
  result = result.replace(
    /\{\{\s*product\.discount\s*\}\}/g,
    data.discount || "",
  );

  // Images
  result = result.replace(
    /\{\{\s*product\.image\s*\}\}/g,
    data.primaryImage || "",
  );

  // Support for {{product.image0}} up to {{product.image5}}
  for (let i = 0; i < 6; i++) {
    const imgUrl = data.gallery[i] || data.primaryImage || "";
    const regex = new RegExp(`\\{\\{\\s*product\\.image${i}\\s*\\}\\}`, "g");
    result = result.replace(regex, imgUrl);
  }

  // Identifiers
  if (data.slug) {
    result = result.replace(/\{\{\s*product\.slug\s*\}\}/g, data.slug);
  }
  if (data.id) {
    result = result.replace(/\{\{\s*product\.id\s*\}\}/g, data.id);
  }
  if (data.options !== undefined) {
    result = result.replace(/\{\{\s*product\.options\s*\}\}/g, data.options);
  }
  if (data.specifications !== undefined) {
    result = result.replace(
      /\{\{\s*product\.specifications\s*\}\}/g,
      data.specifications,
    );
  }
  // pdp.specsSection — full-width specs section rendered conditionally
  if (data.specsSection !== undefined) {
    result = result.replace(
      /\{\{\s*pdp\.specsSection\s*\}\}/g,
      data.specsSection,
    );
  }
  if (data.galleryThumbs !== undefined) {
    result = result.replace(
      /\{\{\s*product\.galleryThumbs\s*\}\}/g,
      data.galleryThumbs,
    );
  }

  return result;
}
