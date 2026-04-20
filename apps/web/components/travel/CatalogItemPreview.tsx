'use client';

import React from 'react';
import { ShoppingCart, MapPin, Star, Image as ImageIcon, Briefcase, Info } from 'lucide-react';
import type { TravelHotelCatalogDto, TravelActivityCatalogDto } from '@/lib/contracts/travel';

interface CatalogItemPreviewProps {
    type: 'hotel' | 'activity';
    data: TravelHotelCatalogDto | TravelActivityCatalogDto | null;
}

export function CatalogItemPreview({ type, data }: CatalogItemPreviewProps) {
    if (!data) return null;

    const isHotel = type === 'hotel';
    const hotel = data as TravelHotelCatalogDto;
    const activity = data as TravelActivityCatalogDto;

    const title = isHotel ? hotel.hotelName : activity.title;
    const subtitle = isHotel ? hotel.city : activity.location;
    const image = (isHotel ? hotel.images?.[0] : activity.images?.[0]);

    return (
        <div className="flex gap-3 p-2 bg-slate-800/30 border border-slate-700/50 rounded-lg group hover:border-slate-600 transition-colors">
            {image ? (
                <img src={image} alt={title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
            ) : (
                <div className="w-12 h-12 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={16} className="text-slate-500" />
                </div>
            )}
            <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-200 truncate">{title}</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} /> {subtitle}
                </div>
                {isHotel && hotel.starRating && (
                    <div className="flex gap-0.5 mt-1">
                        {Array.from({ length: Number(hotel.starRating) || 0 }).map((_, i) => (
                            <Star key={i} size={8} className="fill-amber-400 text-amber-400" />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
