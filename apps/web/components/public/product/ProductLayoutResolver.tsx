import { ProductLayoutClassic } from './ProductLayoutClassic';
import { ProductLayoutCentered } from './ProductLayoutCentered';
import { ProductLayoutShowcase } from './ProductLayoutShowcase';
import type { ProductLayoutProps } from './types';
import { normalizeProductTemplateKey } from '@/lib/commerce-template-options';

const LAYOUT_MAP: Record<string, React.FC<ProductLayoutProps>> = {
    'product-split': ProductLayoutClassic,
    'product-centered': ProductLayoutCentered,
    'product-showcase': ProductLayoutShowcase,
};

export function ProductLayoutResolver(props: ProductLayoutProps) {
    const templateKey = normalizeProductTemplateKey(props.product.templateKey);
    const LayoutComponent = LAYOUT_MAP[templateKey] || ProductLayoutClassic;

    return <LayoutComponent {...props} />;
}
