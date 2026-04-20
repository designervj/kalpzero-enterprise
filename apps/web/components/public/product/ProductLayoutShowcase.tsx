import Link from 'next/link';
import { RenderHtml } from '@/components/RenderHtml';
import { ProductVariantSelector } from '@/components/public/ProductVariantSelector';
import type { ProductLayoutProps } from './types';

export function ProductLayoutShowcase(props: ProductLayoutProps) {
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

    // Showcase layout utilizes full-width immersive Hero banners instead of a standard gallery box.
    const allImages = gallery.length > 0
        ? gallery.map((g) => ({ id: g.id, url: g.url, alt: g.alt || product.name }))
        : images.map((url, i) => ({ id: `img-${i}`, url, alt: product.name }));

    const heroImage = allImages.find(img => img.id === product.primaryImageId) || allImages[0];
    const secondaryImages = allImages.filter(img => img.id !== heroImage?.id);

    return (
        <div className="w-full">
            {/* Full Width Hero */}
            <div className="relative h-[60vh] md:h-[80vh] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                {heroImage && (
                    <img
                        src={heroImage.url}
                        alt={heroImage.alt || 'Product Hero'}
                        className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm scale-110"
                    />
                )}
                {heroImage && (
                    <img
                        src={heroImage.url}
                        alt={heroImage.alt || 'Product Hero'}
                        className="relative z-10 w-full max-w-5xl h-full pb-20 object-contain drop-shadow-2xl"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />

                {/* Floating Title block overlapping the hero */}
                <div className="absolute bottom-10 left-0 w-full z-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <nav className="mb-4 flex items-center gap-2 text-xs text-white/60">
                            <Link href={`/business/${encodeURIComponent(tenantSlug)}`}
                                className="hover:text-white transition-colors tracking-widest uppercase">Store</Link>
                            <span>—</span>
                            <span className="text-white tracking-widest uppercase">{product.categoryIds?.[0] || 'Collection'}</span>
                        </nav>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white drop-shadow-lg">
                            {product.name}
                        </h1>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-16">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
                    {/* Left Details */}
                    <div className="md:col-span-7 prose prose-invert max-w-none text-lg leading-relaxed text-slate-300">
                        {product.description ? (
                            <RenderHtml html={product.description} />
                        ) : (
                            <p className="italic text-slate-500">No description available for this flagship product.</p>
                        )}

                        {/* Immersive stacked imagery for showcase */}
                        {secondaryImages.length > 0 && (
                            <div className="mt-16 space-y-8">
                                {secondaryImages.map((img) => (
                                    <img
                                        key={img.id}
                                        src={img.url}
                                        alt={img.alt}
                                        className="w-full rounded-3xl border border-slate-800 object-cover"
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Sticky Purchase Panel */}
                    <div className="md:col-span-5 relative">
                        <div className="sticky top-10 bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl">
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
                                    productImage: heroImage?.url || '',
                                    productSku: product.sku,
                                }}
                                cartEnabled={cartEnabled}
                                checkoutEnabled={checkoutEnabled}
                            />
                            {product.sku && (
                                <p className="mt-6 text-center font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                                    Product Code: {product.sku}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Related Products Carousel style row */}
                {relatedProducts.length > 0 && (
                    <section className="mt-32">
                        <div className="flex justify-between items-end mb-10">
                            <h2 className="text-4xl font-black tracking-tight text-white">Complete the Set</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
                            {relatedProducts.map((rel) => (
                                <Link
                                    key={rel._id}
                                    href={`/product/${encodeURIComponent(tenantSlug)}--${rel.slug}`}
                                    className="group shrink-0 w-72 sm:w-80 snap-start"
                                >
                                    <div className="h-96 w-full overflow-hidden rounded-3xl bg-black mb-6">
                                        {rel.primaryImage ? (
                                            <img
                                                src={rel.primaryImage}
                                                alt={rel.name || 'Related product'}
                                                className="h-full w-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-800 bg-slate-900 text-xs">No image</div>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{rel.name}</h3>
                                    {typeof rel.price === 'number' && (
                                        <p className="mt-2 text-lg text-slate-400">₹{rel.price.toFixed(2)}</p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
