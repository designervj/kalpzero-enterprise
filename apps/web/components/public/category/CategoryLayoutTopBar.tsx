import Link from 'next/link';
import { Suspense } from 'react';
import { RenderHtml } from '@/components/RenderHtml';
import { CategoryFilters } from '@/components/public/CategoryFilters';
import { CategoryPagination } from '@/components/public/CategoryPagination';
import type { CategoryLayoutProps } from './types';

export function CategoryLayoutTopBar(props: CategoryLayoutProps) {
    const {
        category, tenantKey, tenantHint, preview,
        filterConfig, products, blogs, portfolioItems,
        total, currentPage, totalPages, pageSize, availableAttributes
    } = props;

    const isProduct = category.type === 'product';
    const isBlog = category.type === 'blog';
    const isPortfolio = category.type === 'portfolio';

    return (
        <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 md:px-10">
            {/* Category Header (Centered for TopBar layout) */}
            <header className="mb-12 flex flex-col items-center text-center">
                <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-400 font-semibold mb-3">{category.type || 'category'}</p>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">{category.page?.title || category.name}</h1>
                {category.description && (
                    <p className="max-w-2xl text-base text-slate-400 leading-relaxed">{category.description}</p>
                )}
            </header>

            {category.page?.bannerImage && (
                <div className="mb-12 w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
                    <img
                        src={category.page.bannerImage}
                        alt={category.page?.title || category.name || 'Category banner'}
                        className="h-64 md:h-[400px] w-full object-cover opacity-90"
                    />
                </div>
            )}

            {category.page?.content && (
                <section className="mb-12 mx-auto max-w-4xl text-center prose prose-invert prose-slate">
                    <RenderHtml html={category.page.content} />
                </section>
            )}

            {/* ── PRODUCT CATEGORY ── */}
            {isProduct && (
                <div className="flex flex-col gap-8">
                    {/* Top Bar Filters container */}
                    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
                        <Suspense fallback={null}>
                            {/* Forcing vertical component to act more horizontally using flex overrides in CSS if needed, 
                                but wrapping it securely in a full width block */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <CategoryFilters
                                    filterConfig={filterConfig}
                                    availableAttributes={availableAttributes}
                                />
                            </div>
                        </Suspense>
                    </div>

                    <div className="flex items-center justify-between py-4 border-t border-slate-800/50">
                        <p className="text-sm font-medium text-slate-400">
                            Showing <span className="text-white">{total}</span> product{total === 1 ? '' : 's'}
                        </p>
                        {currentPage > 1 && (
                            <p className="text-sm text-slate-500">Page {currentPage} of {totalPages}</p>
                        )}
                    </div>

                    {/* Product Grid (Wider because no sidebar) */}
                    {products.length === 0 ? (
                        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 text-slate-500">
                            No products found matching your criteria.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {products.map((product) => (
                                <Link
                                    key={product._id}
                                    href={`/product/${encodeURIComponent(tenantHint || tenantKey)}--${product.slug}`}
                                    className="group flex flex-col"
                                >
                                    <div className="h-56 w-full overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 mb-4 group-hover:border-cyan-500/50 transition-colors">
                                        {product.primaryImage ? (
                                            <img
                                                src={product.primaryImage}
                                                alt={product.name || 'Product'}
                                                className="h-full w-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-slate-800 text-xs font-mono">NO IMAGE</div>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1 truncate">
                                        {product.name || 'Untitled Product'}
                                    </h3>
                                    <p className="text-sm text-slate-400">
                                        {typeof product.price === 'number' ? `₹${product.price.toFixed(2)}` : '-'}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}

                    <Suspense fallback={null}>
                        <CategoryPagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={total}
                            pageSize={pageSize}
                        />
                    </Suspense>
                </div>
            )}

            {/* ── BLOG CATEGORY ── */}
            {isBlog && blogs.length > 0 && (
                <section>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {blogs.map((post) => (
                            <article key={post._id} className="group">
                                <div className="overflow-hidden rounded-2xl mb-4 border border-slate-800 aspect-video">
                                    {post.coverImage ? (
                                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-900" />
                                    )}
                                </div>
                                <h3 className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors mb-2">{post.title}</h3>
                                {post.excerpt && <p className="text-slate-400 line-clamp-2 mb-3">{post.excerpt}</p>}
                                {post.publishedAt && (
                                    <span className="text-xs text-slate-500 block">
                                        {new Date(post.publishedAt).toLocaleDateString()}
                                    </span>
                                )}
                            </article>
                        ))}
                    </div>
                </section>
            )}

            {/* ── PORTFOLIO CATEGORY ── */}
            {isPortfolio && portfolioItems.length > 0 && (
                <section>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {portfolioItems.map((item) => (
                            <Link key={item._id} href="#" className="group block">
                                <div className="relative overflow-hidden rounded-3xl aspect-[4/3] bg-slate-900 border border-slate-800 group-hover:border-purple-500/50 transition-colors">
                                    {item.thumbnailUrl && (
                                        <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                        <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{item.title}</h3>
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            {(item.tags || []).slice(0, 3).map(tag => (
                                                <span key={tag} className="text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2 py-1 rounded text-white backdrop-blur-md">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}
