"use client";

import React, { useState } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash,
  Star,
  LayoutGrid,
} from "lucide-react";
import { GalleryItem } from "@/hook/slices/commerce/products/ProductType";
import { MediaLibraryModal } from "../media/MediaLibraryModal";


interface VisualMediaProps {
  gallery: GalleryItem[];
  primaryImageId: string;
  galleryUrlDraft: string;
  onGalleryChange: (gallery: GalleryItem[]) => void;
  onPrimaryImageChange: (id: string) => void;
  onGalleryUrlDraftChange: (url: string) => void;
  onAddGalleryItem: (item: GalleryItem) => void;
}

export const VisualMedia: React.FC<VisualMediaProps> = ({
  gallery,
  primaryImageId,
  galleryUrlDraft,
  onGalleryChange,
  onPrimaryImageChange,
  onGalleryUrlDraftChange,
  onAddGalleryItem,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const removeImage = (id: string) => {
    const next = gallery.filter((item) => item.id !== id);
    onGalleryChange(next);
    if (primaryImageId === id) {
      onPrimaryImageChange(next.length > 0 ? next[0].id : "");
    }
  };

  const handleSelectFromLibrary = (media: { url: string; alt: string }) => {
    const newItem: GalleryItem = {
      id: `lib-${Date.now()}`,
      url: media.url,
      alt: media.alt || "",
      order: gallery.length,
    };
    onAddGalleryItem(newItem);
    setIsModalOpen(false);
  };

  return (
    <>
      <MediaLibraryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelectFromLibrary}
      />
      <div className="bg-charcoal border border-white/5 rounded-sm p-6 space-y-6 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 border-l-2 border-gold pl-4">
            <LayoutGrid size={18} className="text-gold" />
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">
              Visual Assets
            </h3>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-olive text-white text-[10px] font-black uppercase tracking-widest rounded-sm hover:bg-olive-lt transition-all flex items-center gap-2"
          >
            <Plus size={14} /> Extract from Lab
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {gallery.map((item) => (
            <div
              key={item.id}
              className={`relative aspect-square group bg-ink border transition-all duration-300 rounded-sm overflow-hidden ${
                primaryImageId === item.id
                  ? "border-gold shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                  : "border-white/5 hover:border-gold/30"
              }`}
            >
              <img
                src={item.url}
                alt={item.alt}
                className="h-full w-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all"
              />

              {/* Controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => onPrimaryImageChange(item.id)}
                  className={`p-2 rounded-sm transition-all ${primaryImageId === item.id ? "bg-gold text-ink" : "bg-white/10 text-white hover:bg-gold hover:text-ink"}`}
                  title="Set as Primary"
                >
                  <Star
                    size={14}
                    fill={primaryImageId === item.id ? "currentColor" : "none"}
                  />
                </button>
                <button
                  onClick={() => removeImage(item.id)}
                  className="p-2 bg-white/10 text-white hover:bg-red-500 hover:text-white rounded-sm transition-all"
                  title="Purge Asset"
                >
                  <Trash size={14} />
                </button>
              </div>

              {primaryImageId === item.id && (
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-gold text-ink text-[8px] font-black uppercase tracking-widest rounded-none shadow-lg">
                  IDENTIFIED PRIMARY
                </div>
              )}
            </div>
          ))}

          {/* Empty State / Add Placeholder */}
          {gallery.length === 0 && (
            <div
              onClick={() => setIsModalOpen(true)}
              className="aspect-square border-2 border-dashed border-white/5 bg-ink/40 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-ink/60 hover:border-gold/20 transition-all group"
            >
              <ImageIcon
                size={32}
                className="text-white/10 group-hover:text-gold/40 transition-colors"
              />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover:text-gold/40">
                Initialize Gallery
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
