import { CatalogCrudPage } from '@/components/travel/CatalogCrudPage';

export default function HotelAmenitiesPage() {
    return (
        <CatalogCrudPage
            title="Amenities"
            subtitle="Maintain amenity records that can be reused across room types, website sections, and booking filters."
            endpoint="/api/hotel/amenities"
            fields={[
                { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Airport Pickup' },
                { key: 'category', label: 'Category', type: 'text', placeholder: 'Transport' },
                { key: 'icon', label: 'Icon', type: 'text', placeholder: 'Car' },
                { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Optional airport transfer for direct guests.' },
            ]}
        />
    );
}
