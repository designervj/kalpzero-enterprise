'use client';

import { CatalogCrudPage } from '@/components/travel/CatalogCrudPage';

export default function TravelHotelsCatalogPage() {
    return (
        <CatalogCrudPage
            title="Hotels"
            subtitle="Master hotel catalog used by itinerary day linking."
            endpoint="/api/travel/catalog/hotels"
            fields={[
                { key: 'hotelName', label: 'Hotel Name', type: 'text', required: true },
                { key: 'city', label: 'City', type: 'text', required: true },
                { key: 'starRating', label: 'Star Rating', type: 'number' },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'roomTypes', label: 'Room Types', type: 'array', placeholder: 'Deluxe, Suite, Premium' },
                { key: 'amenities', label: 'Amenities', type: 'array', placeholder: 'Breakfast, Spa, Pool' },
                { key: 'images', label: 'Images', type: 'array', placeholder: 'Image URLs' },
            ]}
        />
    );
}
