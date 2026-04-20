'use client';

import React from 'react';
import { ResourceScopePanel } from '@/components/resources/ResourceScopePanel';

export default function TenantResourcesPage() {
    return (
        <ResourceScopePanel
            scope="tenant"
            title="Tenant Resource Summary"
            description="DB, media, and AI consumption for your active tenant workspace."
        />
    );
}
