'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface CategoryPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
}

export function CategoryPagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
}: CategoryPaginationProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const goTo = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(page));
        router.replace(`${pathname}?${params.toString()}`, { scroll: true });
    }, [router, pathname, searchParams]);

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Build page number array with ellipsis logic
    const pages: (number | '...')[] = [];
    const delta = 2;
    const range: number[] = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
        range.push(i);
    }
    if (range[0] > 1) {
        pages.push(1);
        if (range[0] > 2) pages.push('...');
    }
    range.forEach((p) => pages.push(p));
    if (range[range.length - 1] < totalPages) {
        if (range[range.length - 1] < totalPages - 1) pages.push('...');
        pages.push(totalPages);
    }

    return (
        <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-xs text-slate-500">
                Showing {startItem}–{endItem} of {totalItems} results
            </p>
            <div className="flex items-center gap-1.5">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => goTo(currentPage - 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    ← Prev
                </button>

                {pages.map((p, idx) =>
                    p === '...'
                        ? <span key={`ellipsis-${idx}`} className="px-2 text-slate-600">…</span>
                        : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => goTo(p as number)}
                                className={`min-w-[32px] rounded-lg border px-2 py-1.5 text-xs transition-colors ${p === currentPage
                                        ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
                                        : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
                                    }`}
                            >
                                {p}
                            </button>
                        )
                )}

                <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => goTo(currentPage + 1)}
                    className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition-colors hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next →
                </button>
            </div>
        </div>
    );
}
