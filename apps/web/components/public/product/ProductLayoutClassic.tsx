import Link from 'next/link';
import { RenderHtml } from '@/components/RenderHtml';
import { ProductGallery } from '@/components/public/ProductGallery';
import { ProductVariantSelector } from '@/components/public/ProductVariantSelector';
import type { ProductLayoutProps } from './types';

export function ProductLayoutClassic(props: ProductLayoutProps) {
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
        <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
                <Link href={`/business/${encodeURIComponent(tenantSlug)}`}
                    className="hover:text-slate-300 transition-colors">Store</Link>
                <span>/</span>
                <span className="text-slate-300">{product.name}</span>
            </nav>

            {/* Product grid */}
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Left: Gallery */}
                <div className="lg:sticky lg:top-6 lg:self-start">
                    <ProductGallery
                        gallery={gallery}
                        images={images}
                        primaryImageId={product.primaryImageId}
                        productName={product.name || 'Product'}
                    />
                </div>

                {/* Right: Details */}
                <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-400">
                            {product.businessType || 'Product'}
                        </p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                            {product.name}
                        </h1>
                        {product.sku && (
                            <p className="mt-1 font-mono text-xs text-slate-500">SKU: {product.sku}</p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-slate-800" />

                    {/* Variant Selector with pricing */}
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

                    {/* Tax note */}
                    {product.pricing?.chargeTax && (
                        <p className="text-[10px] text-slate-600">Inclusive of all applicable taxes.</p>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-slate-800" />

                    {/* Description */}
                    {product.description && (
                        <section>
                            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                                Description
                            </h2>
                            <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                                <RenderHtml html={product.description} />
                            </div>
                        </section>
                    )}

                    {/* Back to store */}
                    <div className="pt-2">
                        <Link
                            href={`/business/${encodeURIComponent(tenantSlug)}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:border-slate-500 hover:text-slate-200 transition-colors"
                        >
                            ← Back to Store
                        </Link>
                    </div>
                </div>
            </div>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section className="mt-14">
                    <h2 className="mb-6 text-lg font-semibold text-white">You may also like</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        {relatedProducts.map((rel) => (
                            <Link
                                key={rel._id}
                                href={`/product/${encodeURIComponent(tenantSlug)}--${rel.slug}`}
                                className="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 hover:border-cyan-500/40 transition-colors"
                            >
                                <div className="h-36 overflow-hidden bg-slate-900">
                                    {rel.primaryImage ? (
                                        <img
                                            src={rel.primaryImage}
                                            alt={rel.name || 'Related product'}
                                            className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-700 text-xs">No image</div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-medium text-white group-hover:text-cyan-300 transition-colors truncate">{rel.name}</p>
                                    {typeof rel.price === 'number' && (
                                        <p className="mt-1 text-sm font-semibold text-cyan-400">
                                            ₹{rel.price.toFixed(2)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
