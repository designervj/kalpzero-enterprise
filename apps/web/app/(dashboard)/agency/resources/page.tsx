'use client';

import React from 'react';
import { ResourceScopePanel } from '@/components/resources/ResourceScopePanel';

export default function AgencyResourcesPage() {
    return (
        <ResourceScopePanel
            scope="agency"
            title="Agency Resource Center"
            description="Usage and alert rollups across tenants under your agency scope."
        />
    );
}
