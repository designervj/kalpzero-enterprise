import { CategoryLayoutSidebar } from "./CategoryLayoutSidebar";
import { CategoryLayoutTopBar } from "./CategoryLayoutTopBar";
import { CategoryLayoutMasonry } from "./CategoryLayoutMasonry";
import { CategoryLayoutResponsive } from "./CategoryLayoutResponsive";
import type { CategoryLayoutProps } from "./types";
import {
  defaultCategoryTemplateForType,
  normalizeCategoryTemplateKey,
} from "@/lib/commerce-template-options";

const LAYOUT_MAP: Record<string, React.FC<CategoryLayoutProps>> = {
  // 'category-sidebar': CategoryLayoutSidebar,
  // 'category-topbar': CategoryLayoutTopBar,
  // 'category-masonry': CategoryLayoutMasonry,
  "category-sidebar": CategoryLayoutResponsive,
  "category-topbar": CategoryLayoutResponsive,
  "category-masonry": CategoryLayoutResponsive,
};

export function CategoryLayoutResolver(props: CategoryLayoutProps) {
  const normalizedType =
    props.category.type === "portfolio" || props.category.type === "blog"
      ? props.category.type
      : "product";
  const templateKey = normalizeCategoryTemplateKey(
    props.category.page?.templateKey || props.category.templateKey,
    defaultCategoryTemplateForType(normalizedType),
  );

  console.log("====>>>", props);
  const LayoutComponent = LAYOUT_MAP[templateKey] || CategoryLayoutSidebar;

  return <LayoutComponent {...props} />;
}
