'use client';

import { useState } from 'react';

type GalleryItem = {
    id: string;
    url: string;
    alt?: string;
    order?: number;
};

interface ProductGalleryProps {
    gallery: GalleryItem[];
    images?: string[];
    primaryImageId?: string;
    productName: string;
}

export function ProductGallery({ gallery, images = [], primaryImageId, productName }: ProductGalleryProps) {
    const allImages: { id: string; url: string; alt: string }[] = gallery.length > 0
        ? gallery.map((g) => ({ id: g.id, url: g.url, alt: g.alt || productName }))
        : images.map((url, i) => ({ id: `img-${i}`, url, alt: productName }));

    const initialIndex = primaryImageId
        ? Math.max(0, allImages.findIndex((img) => img.id === primaryImageId))
        : 0;

    const [activeIndex, setActiveIndex] = useState(initialIndex);

    if (allImages.length === 0) {
        return (
            <div className="flex h-96 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40">
                <span className="text-slate-600 text-sm">No images available</span>
            </div>
        );
    }

    const active = allImages[activeIndex];

    return (
        <div className="flex flex-col gap-3">
            {/* Main Image */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 group">
                <img
                    src={active.url}
                    alt={active.alt}
                    className="h-[420px] w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                />
            </div>

            {/* Thumbnail Strip */}
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {allImages.map((img, idx) => (
                        <button
                            key={img.id}
                            type="button"
                            onClick={() => setActiveIndex(idx)}
                            className={`flex-shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 transition-all duration-150 ${idx === activeIndex
                                    ? 'border-cyan-500 ring-2 ring-cyan-500/30'
                                    : 'border-slate-700 hover:border-slate-500'
                                }`}
                            aria-label={`View image ${idx + 1}`}
                        >
                            <img
                                src={img.url}
                                alt={img.alt}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
