import Link from 'next/link';
import { Suspense } from 'react';
import { RenderHtml } from '@/components/RenderHtml';
import { CategoryFilters } from '@/components/public/CategoryFilters';
import { CategoryPagination } from '@/components/public/CategoryPagination';
import type { CategoryLayoutProps } from './types';

export function CategoryLayoutSidebar(props: CategoryLayoutProps) {
    const {
        category, tenantKey, tenantHint, preview,
        filterConfig, products, blogs, portfolioItems,
        total, currentPage, totalPages, pageSize, availableAttributes
    } = props;

    const isProduct = category.type === 'product';
    const isBlog = category.type === 'blog';
    const isPortfolio = category.type === 'portfolio';

    return (
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            {/* Category Header */}
            <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300">{category.type || 'category'}</p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{category.page?.title || category.name}</h1>
                <p className="mt-2 text-sm text-slate-300">{category.description || ''}</p>
                {category.page?.bannerImage && (
                    <img
                        src={category.page.bannerImage}
                        alt={category.page?.title || category.name || 'Category banner'}
                        className="mt-5 h-48 w-full rounded-xl border border-slate-800 object-cover"
                    />
                )}
            </header>

            {/* Rich content block */}
            {category.page?.content && (
                <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/30 p-6">
                    <RenderHtml html={category.page.content} />
                </section>
            )}

            {/* ── PRODUCT CATEGORY ── */}
            {isProduct && (
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Filters sidebar (client island) */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                        <Suspense fallback={null}>
                            <CategoryFilters
                                filterConfig={filterConfig}
                                availableAttributes={availableAttributes}
                            />
                        </Suspense>
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 min-w-0">
                        <div className="mb-4 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                {total} product{total === 1 ? '' : 's'}
                                {currentPage > 1 ? ` · page ${currentPage} of ${totalPages}` : ''}
                            </p>
                        </div>

                        {products.length === 0 ? (
                            <div className="flex h-40 items-center justify-center rounded-xl border border-slate-800 text-sm text-slate-600">
                                No products match your filters.
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {products.map((product) => (
                                    <Link
                                        key={product._id}
                                        href={`/product/${encodeURIComponent(tenantHint || tenantKey)}--${product.slug}`}
                                        className="group overflow-hidden rounded-xl border border-slate-800 bg-black/20 hover:border-cyan-500/40 transition-colors flex flex-col h-full"
                                    >
                                        <div className="h-44 w-full overflow-hidden bg-slate-900/60 shrink-0">
                                            {product.primaryImage ? (
                                                <img
                                                    src={product.primaryImage}
                                                    alt={product.name || 'Product'}
                                                    className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-200"
                                                />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-slate-700 text-xs">No image</div>
                                            )}
                                        </div>
                                        <div className="p-3 flex flex-col flex-1">
                                            <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-tight">
                                                {product.name || 'Untitled Product'}
                                            </h3>
                                            <p className="mt-1 font-mono text-[10px] text-slate-600 line-clamp-1">{product.sku || ''}</p>
                                            <div className="mt-auto pt-2">
                                                <p className="text-sm font-semibold text-cyan-400">
                                                    {typeof product.price === 'number' ? `₹${product.price.toFixed(2)}` : '-'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Pagination */}
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

            {/* ── BLOG CATEGORY ── */}
            {isBlog && blogs.length > 0 && (
                <section>
                    <h2 className="mb-4 text-xl font-semibold text-white">Articles</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {blogs.map((post) => (
                            <article key={post._id} className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-black/20 hover:border-cyan-500/40 transition-colors">
                                {post.coverImage && (
                                    <img src={post.coverImage} alt={post.title || 'Post cover'} className="h-48 w-full object-cover" />
                                )}
                                <div className="flex flex-1 flex-col p-5">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors leading-tight">{post.title || 'Untitled Post'}</h3>
                                    {post.excerpt && <p className="mt-3 text-sm text-slate-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>}
                                    <div className="mt-auto flex items-center justify-between pt-5">
                                        {post.publishedAt && (
                                            <span className="text-[11px] text-slate-500 font-mono tracking-wider">
                                                {new Date(post.publishedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        )}
                                        <div className="flex gap-1.5 flex-wrap">
                                            {(post.tags || []).slice(0, 2).map((tag) => (
                                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/90 tracking-wide uppercase">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* ── PORTFOLIO CATEGORY ── */}
            {isPortfolio && portfolioItems.length > 0 && (
                <section>
                    <h2 className="mb-4 text-xl font-semibold text-white">Portfolio</h2>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {portfolioItems.map((item) => (
                            <article key={item._id} className="group overflow-hidden rounded-2xl border border-slate-800 bg-black/20 hover:border-purple-500/40 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
                                {item.thumbnailUrl && (
                                    <div className="overflow-hidden h-56 w-full">
                                        <img src={item.thumbnailUrl} alt={item.title || 'Portfolio item'} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}
                                <div className="p-5">
                                    <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">{item.title || 'Untitled'}</h3>
                                    {item.description && <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>}
                                    <div className="mt-4 flex gap-1.5 flex-wrap">
                                        {(item.tags || []).slice(0, 3).map((tag) => (
                                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 tracking-wide uppercase">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* Back link */}
            <div className="mt-12 flex justify-center">
                <Link
                    href={`/business/${encodeURIComponent(tenantHint || tenantKey)}`}
                    className="inline-flex rounded-full border border-slate-700 px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-slate-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all"
                >
                    Return to Store
                </Link>
            </div>
        </main>
    );
}
