import Link from 'next/link';
import { RenderHtml } from '@/components/RenderHtml';
import { ProductGallery } from '@/components/public/ProductGallery';
import { ProductVariantSelector } from '@/components/public/ProductVariantSelector';
import type { ProductLayoutProps } from './types';

export function ProductLayoutCentered(props: ProductLayoutProps) {
    const {
        product,
        variants,
        gallery,
        images,
        options,
        relatedProducts,
        basePrice,
        compareAtPrice,
        tenantKey,
        tenantSlug,
        cartEnabled,
        checkoutEnabled,
    } = props;
    const primaryImageForCart = gallery.find((item) => item.id === product.primaryImageId)?.url || gallery[0]?.url || images[0] || '';

    return (
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 text-center">
            {/* Breadcrumb */}
            <nav className="mb-8 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Link href={`/business/${encodeURIComponent(tenantSlug)}`}
                    className="hover:text-slate-300 transition-colors">Store</Link>
                <span>/</span>
                <span className="text-slate-300">{product.name}</span>
            </nav>

            {/* Gallery Centered Top */}
            <div className="mb-10 w-full max-w-3xl mx-auto">
                <ProductGallery
                    gallery={gallery}
                    images={images}
                    primaryImageId={product.primaryImageId}
                    productName={product.name || 'Product'}
                />
            </div>

            {/* Title & Price Centered */}
            <div className="flex flex-col items-center gap-6 mb-12">
                <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
                        {product.businessType || 'Product'}
                    </p>
                    <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                        {product.name}
                    </h1>
                    {product.sku && (
                        <p className="mt-2 font-mono text-xs text-slate-500">SKU: {product.sku}</p>
                    )}
                </div>

                {/* Variant box (Centered alignment usually requires custom flex) */}
                <div className="w-full max-w-md bg-slate-900/40 p-6 rounded-2xl border border-slate-800 text-left">
                    <ProductVariantSelector
                        options={options}
                        variants={variants}
                        basePrice={basePrice}
                        compareAtPrice={compareAtPrice}
                        currency="INR"
                        productContext={{
                            tenantKey,
                            tenantSlug,
                            productSlug: product.slug || '',
                            productName: product.name || 'Product',
                            productImage: primaryImageForCart,
                            productSku: product.sku,
                        }}
                        cartEnabled={cartEnabled}
                        checkoutEnabled={checkoutEnabled}
                    />
                </div>
            </div>

            <div className="h-px bg-slate-800/60 w-full max-w-lg mx-auto mb-12" />

            {/* Description Centered block */}
            {product.description && (
                <section className="mx-auto max-w-2xl text-left">
                    <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
                        Product Details
                    </h2>
                    <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                        <RenderHtml html={product.description} />
                    </div>
                </section>
            )}

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="mt-24 border-t border-slate-800 pt-16">
                    <h2 className="mb-8 text-2xl font-semibold text-white">More from this collection</h2>
                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                        {relatedProducts.map((rel) => (
                            <Link
                                key={rel._id}
                                href={`/product/${encodeURIComponent(tenantSlug)}--${rel.slug}`}
                                className="group flex flex-col items-center text-center"
                            >
                                <div className="h-44 w-full overflow-hidden rounded-2xl bg-slate-900 mb-4 border border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                                    {rel.primaryImage ? (
                                        <img
                                            src={rel.primaryImage}
                                            alt={rel.name || 'Related product'}
                                            className="h-full w-full object-cover p-2 group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-700 text-xs">No image</div>
                                    )}
                                </div>
                                <h3 className="text-sm font-medium text-white group-hover:text-cyan-400 transition-colors">{rel.name}</h3>
                                {typeof rel.price === 'number' && (
                                    <p className="mt-1 text-sm font-bold text-slate-300">₹{rel.price.toFixed(2)}</p>
                                )}
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
