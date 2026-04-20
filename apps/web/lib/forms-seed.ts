import type { Db } from 'mongodb';
import {
    DEFAULT_FORM_USAGE_POLICY,
    initialFormAnalyticsSnapshot,
} from '@/lib/forms-lifecycle';

type SeedContext = {
    businessType?: string;
    isTravel?: boolean;
};

type SeedField = {
    id: string;
    label: string;
    name: string;
    type: string;
    required: boolean;
    options?: string[];
};

type SeedStep = {
    id: string;
    title: string;
    fields: SeedField[];
};

function makeId(prefix: string) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now()}`;
}

function slugify(input: string) {
    return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildContactForm(title: string) {
    const now = new Date();
    return {
        title,
        slug: slugify(title),
        type: 'simple',
        status: 'published',
        templateKey: 'glass',
        description: 'Primary inbound contact form.',
        usagePolicy: { ...DEFAULT_FORM_USAGE_POLICY },
        surfaceBindings: ['website', 'landing'],
        analytics: initialFormAnalyticsSnapshot(),
        fields: [
            { id: makeId('field'), label: 'Full Name', name: 'full_name', type: 'text', required: true },
            { id: makeId('field'), label: 'Email', name: 'email', type: 'email', required: true },
            { id: makeId('field'), label: 'Phone', name: 'phone', type: 'phone', required: false },
            { id: makeId('field'), label: 'Message', name: 'message', type: 'textarea', required: true },
        ],
        steps: [],
        createdAt: now,
        updatedAt: now,
    };
}

function buildSubscriptionForm(title: string) {
    const now = new Date();
    return {
        title,
        slug: slugify(title),
        type: 'subscription',
        status: 'published',
        templateKey: 'minimal',
        description: 'Email-first subscription capture.',
        usagePolicy: {
            ...DEFAULT_FORM_USAGE_POLICY,
            dedupeByEmail: true,
            dedupeWindowHours: 24,
        },
        surfaceBindings: ['website', 'landing', 'checkout'],
        analytics: initialFormAnalyticsSnapshot(),
        fields: [
            { id: makeId('field'), label: 'Email', name: 'email', type: 'email', required: true },
            { id: makeId('field'), label: 'Full Name', name: 'full_name', type: 'text', required: false },
            { id: makeId('field'), label: 'Consent', name: 'consent', type: 'checkbox', required: true, options: ['I agree to receive updates.'] },
        ],
        steps: [],
        createdAt: now,
        updatedAt: now,
    };
}

function buildMultiStepForm(title: string, isTravel: boolean) {
    const now = new Date();
    const steps: SeedStep[] = isTravel
        ? [
            {
                id: makeId('step'),
                title: 'Trip Basics',
                fields: [
                    { id: makeId('field'), label: 'Destination', name: 'destination', type: 'text', required: true },
                    { id: makeId('field'), label: 'Travel Dates', name: 'travel_dates', type: 'date', required: true },
                    { id: makeId('field'), label: 'Travelers', name: 'travelers', type: 'number', required: true },
                ],
            },
            {
                id: makeId('step'),
                title: 'Preferences',
                fields: [
                    { id: makeId('field'), label: 'Budget', name: 'budget', type: 'number', required: true },
                    {
                        id: makeId('field'),
                        label: 'Travel Style',
                        name: 'travel_style',
                        type: 'select',
                        required: false,
                        options: ['Luxury', 'Premium', 'Standard', 'Budget'],
                    },
                    {
                        id: makeId('field'),
                        label: 'Room Type',
                        name: 'room_type',
                        type: 'select',
                        required: false,
                        options: ['Single', 'Double', 'Suite'],
                    },
                ],
            },
            {
                id: makeId('step'),
                title: 'Contact Details',
                fields: [
                    { id: makeId('field'), label: 'Full Name', name: 'full_name', type: 'text', required: true },
                    { id: makeId('field'), label: 'Email', name: 'email', type: 'email', required: true },
                    { id: makeId('field'), label: 'Phone', name: 'phone', type: 'phone', required: false },
                ],
            },
        ]
        : [
            {
                id: makeId('step'),
                title: 'Business Profile',
                fields: [
                    { id: makeId('field'), label: 'Business Name', name: 'business_name', type: 'text', required: true },
                    { id: makeId('field'), label: 'Company Size', name: 'company_size', type: 'select', required: false, options: ['1-10', '11-50', '51-200', '200+'] },
                    { id: makeId('field'), label: 'Industry', name: 'industry', type: 'text', required: true },
                ],
            },
            {
                id: makeId('step'),
                title: 'Member Details',
                fields: [
                    { id: makeId('field'), label: 'Full Name', name: 'full_name', type: 'text', required: true },
                    { id: makeId('field'), label: 'Email', name: 'email', type: 'email', required: true },
                    { id: makeId('field'), label: 'Phone', name: 'phone', type: 'phone', required: false },
                ],
            },
            {
                id: makeId('step'),
                title: 'Preferences',
                fields: [
                    { id: makeId('field'), label: 'Interested Products', name: 'interests', type: 'textarea', required: false },
                    { id: makeId('field'), label: 'Monthly Budget', name: 'monthly_budget', type: 'number', required: false },
                ],
            },
        ];

    return {
        title,
        slug: slugify(title),
        type: 'multi_step',
        status: 'draft',
        templateKey: 'split',
        description: 'Multi-step registration form.',
        usagePolicy: {
            ...DEFAULT_FORM_USAGE_POLICY,
            collectAttribution: true,
        },
        surfaceBindings: ['website', 'landing', 'manual'],
        analytics: initialFormAnalyticsSnapshot(),
        fields: [],
        steps,
        createdAt: now,
        updatedAt: now,
    };
}

export async function seedFormSamples(tenantDb: Db, context: SeedContext) {
    const existing = await tenantDb.collection('forms').countDocuments();
    if (existing > 0) return;

    const isTravel = Boolean(context.isTravel);
    const contact = buildContactForm('Contact Form');
    const subscription = buildSubscriptionForm('Subscription Form');
    const multiStep = buildMultiStepForm(isTravel ? 'Travel Registration Form' : 'Member Registration Form', isTravel);

    await tenantDb.collection('forms').insertMany([contact, subscription, multiStep]);
}
