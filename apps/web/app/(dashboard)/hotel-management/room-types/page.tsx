import { CatalogCrudPage } from '@/components/travel/CatalogCrudPage';

export default function HotelRoomTypesPage() {
    return (
        <CatalogCrudPage
            title="Room Types"
            subtitle="Define reusable room categories and their default occupancy, rate, and amenity payloads."
            endpoint="/api/hotel/room-types"
            fields={[
                { key: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Deluxe King' },
                { key: 'bedType', label: 'Bed Type', type: 'text', placeholder: 'King Bed' },
                { key: 'baseRate', label: 'Base Rate', type: 'number', placeholder: '7999' },
                { key: 'maxOccupancy', label: 'Max Occupancy', type: 'number', placeholder: '3' },
                { key: 'amenities', label: 'Amenities', type: 'array', placeholder: 'WiFi, Breakfast, Workspace' },
                { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Premium room category for direct bookings.' },
            ]}
        />
    );
}
