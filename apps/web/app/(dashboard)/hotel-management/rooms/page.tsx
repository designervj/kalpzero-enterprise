import { CatalogCrudPage } from '@/components/travel/CatalogCrudPage';

export default function HotelRoomsPage() {
    return (
        <CatalogCrudPage
            title="Rooms"
            subtitle="Manage room inventory, occupancy capacity, floor placement, and readiness state."
            endpoint="/api/hotel/rooms"
            fields={[
                { key: 'roomNumber', label: 'Room Number', type: 'text', required: true, placeholder: '101' },
                { key: 'roomType', label: 'Room Type', type: 'text', required: true, placeholder: 'Deluxe King' },
                { key: 'floor', label: 'Floor', type: 'number', placeholder: '1' },
                { key: 'maxOccupancy', label: 'Max Occupancy', type: 'number', placeholder: '2' },
                { key: 'nightlyRate', label: 'Nightly Rate', type: 'number', placeholder: '6999' },
                { key: 'status', label: 'Status', type: 'text', placeholder: 'available' },
                { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Balcony-facing premium room.' },
            ]}
        />
    );
}
