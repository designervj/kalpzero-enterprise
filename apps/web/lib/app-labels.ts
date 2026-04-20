const APP_LABELS: Record<string, string> = {
    website: 'Website',
    branding: 'Branding',
    products: 'Products',
    ecommerce: 'Commerce',
    bookings: 'Bookings',
    marketing: 'Marketing',
    blog: 'Blog',
    portfolio: 'Portfolio',
    media: 'Media',
    invoicing: 'Invoicing',
    source: 'Source',
    kalpbodh: 'KalpAI',
    hotel_management: 'Hotel Management',
    tour_management: 'Tour Management',
};

function toTitleCase(value: string): string {
    return value
        .replace(/[_-]+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getAppLabel(key: string): string {
    const normalized = key.trim().toLowerCase();
    return APP_LABELS[normalized] || toTitleCase(normalized);
}

export function getEntityLabel(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'plugin' || normalized === 'add-on') return 'Add-on';
    return toTitleCase(normalized);
}
