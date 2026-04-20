'use client';

import { CatalogCrudPage } from '@/components/travel/CatalogCrudPage';

export default function TravelTransfersCatalogPage() {
    return (
        <CatalogCrudPage
            title="Transfers"
            subtitle="Transfer templates for airport, intercity, and day-tour movements."
            endpoint="/api/travel/catalog/transfers"
            fields={[
                { key: 'title', label: 'Transfer Title', type: 'text', required: true },
                { key: 'from', label: 'From', type: 'text', required: true },
                { key: 'to', label: 'To', type: 'text', required: true },
                { key: 'vehicleType', label: 'Vehicle Type', type: 'text' },
                { key: 'defaultDuration', label: 'Default Duration', type: 'text' },
                { key: 'notes', label: 'Notes', type: 'textarea' },
                { key: 'images', label: 'Images', type: 'array', placeholder: 'Image URLs' },
            ]}
        />
    );
}
