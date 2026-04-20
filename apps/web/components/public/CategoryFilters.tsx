'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

type FilterConfig = {
    showPriceFilter?: boolean;
    showSort?: boolean;
    showAttributeFilters?: string[];
};

interface CategoryFiltersProps {
    filterConfig: FilterConfig;
    /** Flat list of { name, values } for attribute filters gathered from the current product set */
    availableAttributes?: { name: string; values: string[] }[];
    maxPrice?: number;
}

export function CategoryFilters({
    filterConfig,
    availableAttributes = [],
    maxPrice = 10000,
}: CategoryFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const setParam = useCallback((key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        params.delete('page'); // reset page on filter change
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, [router, pathname, searchParams]);

    const toggleAttrParam = useCallback((name: string, val: string) => {
        const key = `attr[${name}]`;
        const existing = searchParams.get(key) || '';
        const values = existing ? existing.split(',') : [];
        const idx = values.indexOf(val);
        if (idx >= 0) values.splice(idx, 1);
        else values.push(val);
        setParam(key, values.join(','));
    }, [searchParams, setParam]);

    const currentSort = searchParams.get('sort') || 'newest';
    const currentMinPrice = searchParams.get('minPrice') || '';
    const currentMaxPrice = searchParams.get('maxPrice') || '';

    const { showPriceFilter, showSort, showAttributeFilters = [] } = filterConfig;
    const visibleAttributes = availableAttributes.filter((a) => showAttributeFilters.includes(a.name));

    if (!showPriceFilter && !showSort && visibleAttributes.length === 0) return null;

    return (
        <aside className="w-full lg:w-56 shrink-0">
            <div className="sticky top-4 space-y-5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Filters</p>

                {/* Sort */}
                {showSort && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400">Sort By</p>
                        <select
                            value={currentSort}
                            onChange={(e) => setParam('sort', e.target.value)}
                            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
                        >
                            <option value="newest">Newest</option>
                            <option value="price_asc">Price: Low → High</option>
                            <option value="price_desc">Price: High → Low</option>
                            <option value="name_asc">Name: A → Z</option>
                        </select>
                    </div>
                )}

                {/* Price Range */}
                {showPriceFilter && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-400">Price Range</p>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                min={0}
                                max={maxPrice}
                                value={currentMinPrice}
                                onChange={(e) => setParam('minPrice', e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                            />
                            <input
                                type="number"
                                placeholder="Max"
                                min={0}
                                max={maxPrice}
                                value={currentMaxPrice}
                                onChange={(e) => setParam('maxPrice', e.target.value)}
                                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Attribute filters */}
                {visibleAttributes.map((attr) => {
                    const key = `attr[${attr.name}]`;
                    const selected = (searchParams.get(key) || '').split(',').filter(Boolean);
                    return (
                        <div key={attr.name} className="space-y-2">
                            <p className="text-xs font-semibold text-slate-400">{attr.name}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {attr.values.map((val) => {
                                    const isOn = selected.includes(val);
                                    return (
                                        <button
                                            key={val}
                                            type="button"
                                            onClick={() => toggleAttrParam(attr.name, val)}
                                            className={`rounded-md border px-2 py-1 text-xs transition-all ${isOn
                                                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                                                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                                }`}
                                        >
                                            {val}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}

                {/* Clear all */}
                {(currentSort !== 'newest' || currentMinPrice || currentMaxPrice) && (
                    <button
                        type="button"
                        onClick={() => router.replace(pathname, { scroll: false })}
                        className="w-full rounded-lg border border-slate-700 py-1.5 text-xs text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-colors"
                    >
                        Clear all filters
                    </button>
                )}
            </div>
        </aside>
    );
}
