import Link from 'next/link';
import { Suspense } from 'react';
import { RenderHtml } from '@/components/RenderHtml';
import { CategoryFilters } from '@/components/public/CategoryFilters';
import { CategoryPagination } from '@/components/public/CategoryPagination';
import type { CategoryLayoutProps } from './types';

export function CategoryLayoutMasonry(props: CategoryLayoutProps) {
    const {
        category, tenantKey, tenantHint, preview,
        filterConfig, products, blogs, portfolioItems,
        total, currentPage, totalPages, pageSize, availableAttributes
    } = props;

    const isProduct = category.type === 'product';
    const isBlog = category.type === 'blog';
    const isPortfolio = category.type === 'portfolio';

    return (
        <main className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 md:px-8">
            {/* Minimal Header for Masonry layout (focuses on visuals) */}
            <header className="mb-10 flex flex-col items-center text-center">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">{category.page?.title || category.name}</h1>
                {category.description && (
                    <p className="max-w-xl text-sm text-slate-400">{category.description}</p>
                )}
            </header>

            {/* ── PRODUCT CATEGORY ── */}
            {isProduct && (
                <div className="flex flex-col gap-6">
                    <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-4">
                        <div className="flex gap-4 items-center">
                            <Suspense fallback={null}>
                                {/* Compact filters rendering */}
                                <CategoryFilters
                                    filterConfig={filterConfig}
                                    availableAttributes={availableAttributes}
                                />
                            </Suspense>
                        </div>
                        <p className="text-xs text-slate-500 font-mono self-end pb-2">
                            {total} ITEMS
                        </p>
                    </div>

                    {/* Masonry CSS implementation using Columns */}
                    {products.length === 0 ? (
                        <div className="py-20 text-center text-slate-500">No products found.</div>
                    ) : (
                        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                            {products.map((product, idx) => (
                                <Link
                                    key={product._id}
                                    href={`/product/${encodeURIComponent(tenantHint || tenantKey)}--${product.slug}`}
                                    className="group block break-inside-avoid"
                                >
                                    <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 transition-all duration-300">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none" />

                                        <div className="w-full flex items-center justify-center p-6 bg-black">
                                            {product.primaryImage ? (
                                                <img
                                                    src={product.primaryImage}
                                                    alt={product.name || 'Product'}
                                                    // In a real masonry we'd vary heights. Here we let object-contain dictate natural ratio within a min-h
                                                    className="w-full object-contain min-h-[200px] hover:scale-105 transition-transform duration-700"
                                                />
                                            ) : (
                                                <div className="h-48 w-full flex items-center justify-center text-slate-800">No image</div>
                                            )}
                                        </div>

                                        <div className="absolute bottom-0 left-0 w-full p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-20">
                                            <h3 className="text-sm font-bold text-white truncate">{product.name}</h3>
                                            <p className="text-xs font-semibold text-cyan-400 mt-1">
                                                {typeof product.price === 'number' ? `₹${product.price.toFixed(2)}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    <div className="mt-12">
                        <Suspense fallback={null}>
                            <CategoryPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={total}
                                pageSize={pageSize}
                            />
                        </Suspense>
                    </div>
                </div>
            )}

            {/* ── PORTFOLIO CATEGORY ── */}
            {isPortfolio && portfolioItems.length > 0 && (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                    {portfolioItems.map((item) => (
                        <div key={item._id} className="break-inside-avoid relative group rounded-2xl overflow-hidden border border-slate-800 bg-black">
                            {item.thumbnailUrl && (
                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black to-transparent">
                                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
