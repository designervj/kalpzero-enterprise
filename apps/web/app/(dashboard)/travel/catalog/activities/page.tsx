'use client';

import { CatalogCrudPage } from '@/components/travel/CatalogCrudPage';

export default function TravelActivitiesCatalogPage() {
    return (
        <CatalogCrudPage
            title="Activities"
            subtitle="Master activity catalog linked inside package itinerary days."
            endpoint="/api/travel/catalog/activities"
            fields={[
                { key: 'title', label: 'Activity Title', type: 'text', required: true },
                { key: 'location', label: 'Location', type: 'text', required: true },
                { key: 'activityType', label: 'Type', type: 'text' },
                { key: 'defaultDuration', label: 'Default Duration', type: 'text' },
                { key: 'description', label: 'Description', type: 'textarea' },
                { key: 'tags', label: 'Tags', type: 'array', placeholder: 'culture, sightseeing, water' },
                { key: 'images', label: 'Images', type: 'array', placeholder: 'Image URLs' },
            ]}
        />
    );
}
