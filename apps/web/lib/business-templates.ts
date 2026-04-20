/**
 * KalpTree Business Template Registry
 * 
 * Maps 9 Industries → 50+ Business Types, each with:
 * - enabledModules: Which dashboard modules are activated
 * - attributePool: Business-specific attribute keys for products/services
 * - featureFlags: Capabilities like booking engine, inventory, invoicing
 * - icon: Emoji icon for the business type
 */

export interface BusinessTemplate {
    industry: string;
    industryIcon: string;
    businessType: string;
    description: string;
    enabledModules: string[];
    attributePool: string[];
    featureFlags: Record<string, boolean>;
    icon: string;
}

export interface IndustryGroup {
    industry: string;
    icon: string;
    businessTypes: Omit<BusinessTemplate, 'industry' | 'industryIcon'>[];
}

export const INDUSTRIES: IndustryGroup[] = [
    {
        industry: 'Real Estate & Property',
        icon: '🏢',
        businessTypes: [
            {
                businessType: 'Property Listing & Brokerage',
                description: 'Property category, Buy/Rent/Lease, Residential & Commercial listings, Pricing & location',
                enabledModules: ['website', 'products', 'bookings', 'marketing', 'media', 'blog', 'invoicing'],
                attributePool: ['property_category', 'listing_type', 'property_type', 'price_range', 'location', 'area_sqft', 'bedrooms', 'bathrooms', 'furnishing'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: true },
                icon: '🏠',
            },
            {
                businessType: 'Coworking & Shared Space',
                description: 'Desks, Private cabins, Dedicated seats, Managed offices, Meeting rooms',
                enabledModules: ['website', 'products', 'bookings', 'invoicing', 'media'],
                attributePool: ['space_type', 'capacity', 'amenities', 'pricing_model', 'availability', 'location', 'duration'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '💼',
            },
            {
                businessType: 'Property Development Project',
                description: 'New launch projects, Under-construction properties, Unit types, Possession timeline',
                enabledModules: ['website', 'products', 'media', 'blog', 'marketing'],
                attributePool: ['project_phase', 'unit_type', 'possession_date', 'developer', 'rera_number', 'price_range', 'location'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: false, hasMarketing: true },
                icon: '🏗️',
            },
            {
                businessType: 'Real Estate Investment Product',
                description: 'Fractional ownership, Rental yield assets, Commercial investments, ROI projections',
                enabledModules: ['website', 'products', 'invoicing', 'blog', 'marketing'],
                attributePool: ['investment_type', 'roi_projection', 'min_investment', 'asset_class', 'tenure', 'risk_level'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: true },
                icon: '📈',
            },
        ],
    },
    {
        industry: 'Hospitality & Tourism',
        icon: '🏨',
        businessTypes: [
            {
                businessType: 'Hotel Room Booking',
                description: 'Room type, Nightly tariff, Amenities, Occupancy capacity, Check-in/Check-out',
                enabledModules: ['website', 'products', 'ecommerce', 'bookings', 'marketing', 'media', 'invoicing', 'hotel_management'],
                attributePool: ['room_type', 'nightly_tariff', 'amenities', 'occupancy', 'check_in', 'check_out', 'meal_plan', 'star_rating'],
                featureFlags: { hasBookingEngine: true, hasInventory: true, hasInvoicing: true, hasMarketing: true },
                icon: '🛏️',
            },
            {
                businessType: 'Restaurant / Dining',
                description: 'Cuisine type, Menu items, Table booking, Dining slots, Price range',
                enabledModules: ['website', 'products', 'bookings', 'ecommerce', 'marketing', 'media'],
                attributePool: ['cuisine_type', 'menu_category', 'price_range', 'dining_mode', 'seating_capacity', 'timing_slots'],
                featureFlags: { hasBookingEngine: true, hasInventory: true, hasInvoicing: false, hasMarketing: true },
                icon: '🍽️',
            },
            {
                businessType: 'Event & Banquet Booking',
                description: 'Venue type, Seating capacity, Event type, Catering & decor options',
                enabledModules: ['website', 'products', 'bookings', 'marketing', 'media', 'invoicing'],
                attributePool: ['venue_type', 'seating_capacity', 'event_type', 'catering_options', 'decor_packages', 'duration'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: true },
                icon: '🎪',
            },
            {
                businessType: 'Travel & Tour Package',
                description: 'Destination, Duration, Itinerary, Inclusions/Exclusions, Group size',
                enabledModules: ['website', 'products', 'ecommerce', 'bookings', 'marketing', 'media', 'blog', 'tour_management'],
                attributePool: ['destination', 'duration', 'itinerary', 'inclusions', 'exclusions', 'group_size', 'travel_mode'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: true },
                icon: '✈️',
            },
            {
                businessType: 'Adventure & Activity Experience',
                description: 'Activity type, Skill level, Duration, Safety equipment, Age limits',
                enabledModules: ['website', 'products', 'bookings', 'marketing', 'media'],
                attributePool: ['activity_type', 'skill_level', 'duration', 'safety_equipment', 'age_limit', 'group_size'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: false, hasMarketing: true },
                icon: '🧗',
            },
            {
                businessType: 'Vacation Rental / Homestay',
                description: 'Property type, Guest capacity, Stay duration, Amenities, Host rules',
                enabledModules: ['website', 'products', 'bookings', 'media', 'invoicing'],
                attributePool: ['property_type', 'guest_capacity', 'stay_duration', 'amenities', 'host_rules', 'location'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🏡',
            },
        ],
    },
    {
        industry: 'Healthcare & Medical Services',
        icon: '🏥',
        businessTypes: [
            {
                businessType: 'Doctor Consultation Service',
                description: 'Medical specialization, Consultation mode, Appointment slots, Fee',
                enabledModules: ['website', 'bookings', 'invoicing', 'media'],
                attributePool: ['specialization', 'consultation_mode', 'appointment_slots', 'fee', 'qualification', 'experience_years'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '👨‍⚕️',
            },
            {
                businessType: 'Diagnostic Test Package',
                description: 'Test category, Included tests, Sample type, Report turnaround time',
                enabledModules: ['website', 'products', 'ecommerce', 'bookings', 'invoicing'],
                attributePool: ['test_category', 'included_tests', 'sample_type', 'turnaround_time', 'preparation', 'price'],
                featureFlags: { hasBookingEngine: true, hasInventory: true, hasInvoicing: true, hasMarketing: false },
                icon: '🔬',
            },
            {
                businessType: 'Hospital Admission & Treatment Package',
                description: 'Treatment type, Room category, Length of stay, Procedures included',
                enabledModules: ['website', 'products', 'bookings', 'invoicing', 'media'],
                attributePool: ['treatment_type', 'room_category', 'length_of_stay', 'procedures', 'insurance_coverage'],
                featureFlags: { hasBookingEngine: true, hasInventory: true, hasInvoicing: true, hasMarketing: false },
                icon: '🏥',
            },
            {
                businessType: 'Pharmacy / Medicine Product',
                description: 'Medicine category, Prescription requirement, Dosage info, Pack size',
                enabledModules: ['website', 'products', 'ecommerce', 'invoicing'],
                attributePool: ['medicine_category', 'prescription_required', 'dosage', 'pack_size', 'manufacturer', 'expiry'],
                featureFlags: { hasBookingEngine: false, hasInventory: true, hasInvoicing: true, hasMarketing: false },
                icon: '💊',
            },
        ],
    },
    {
        industry: 'Furniture & Home Furnishings',
        icon: '🛋️',
        businessTypes: [
            {
                businessType: 'Ready-Made Furniture Sales',
                description: 'Furniture type, Material, Dimensions, Finish options, Price range',
                enabledModules: ['website', 'products', 'ecommerce', 'marketing', 'media', 'invoicing'],
                attributePool: ['furniture_type', 'material', 'dimensions', 'finish', 'price_range', 'weight', 'color'],
                featureFlags: { hasBookingEngine: false, hasInventory: true, hasInvoicing: true, hasMarketing: true },
                icon: '🪑',
            },
            {
                businessType: 'Custom Furniture Manufacturing',
                description: 'Furniture design, Material selection, Custom dimensions, Lead time',
                enabledModules: ['website', 'products', 'invoicing', 'media', 'portfolio'],
                attributePool: ['design_type', 'material_selection', 'custom_dimensions', 'lead_time', 'finish_options'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🔨',
            },
            {
                businessType: 'Modular Furniture Solutions',
                description: 'Module type, Configuration options, Space size, Installation scope',
                enabledModules: ['website', 'products', 'ecommerce', 'bookings', 'invoicing', 'media'],
                attributePool: ['module_type', 'configuration', 'space_size', 'installation_scope', 'warranty'],
                featureFlags: { hasBookingEngine: true, hasInventory: true, hasInvoicing: true, hasMarketing: false },
                icon: '📦',
            },
        ],
    },
    {
        industry: 'Apparel & Clothing',
        icon: '👗',
        businessTypes: [
            {
                businessType: 'Ready-Made Apparel Sales',
                description: 'Clothing category, Size range, Fabric type, Color variants',
                enabledModules: ['website', 'products', 'ecommerce', 'marketing', 'media', 'invoicing', 'blog'],
                attributePool: ['clothing_category', 'size_range', 'fabric_type', 'color_variants', 'gender', 'season'],
                featureFlags: { hasBookingEngine: false, hasInventory: true, hasInvoicing: true, hasMarketing: true },
                icon: '👕',
            },
            {
                businessType: 'Custom Apparel Manufacturing',
                description: 'Garment type, Fabric choice, Custom sizing, Production quantity',
                enabledModules: ['website', 'products', 'invoicing', 'media', 'portfolio'],
                attributePool: ['garment_type', 'fabric_choice', 'custom_sizing', 'production_qty', 'lead_time'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🧵',
            },
            {
                businessType: 'Fashion Retail & D2C',
                description: 'Product category, Seasonal collection, Pricing tier, Delivery options',
                enabledModules: ['website', 'products', 'ecommerce', 'marketing', 'media', 'blog', 'invoicing'],
                attributePool: ['product_category', 'collection', 'pricing_tier', 'delivery_options', 'return_policy'],
                featureFlags: { hasBookingEngine: false, hasInventory: true, hasInvoicing: true, hasMarketing: true },
                icon: '🛍️',
            },
            {
                businessType: 'Uniform & Corporate Apparel',
                description: 'Uniform type, Branding customization, Fabric quality, Order volume',
                enabledModules: ['website', 'products', 'ecommerce', 'invoicing'],
                attributePool: ['uniform_type', 'branding_options', 'fabric_quality', 'order_volume', 'size_chart'],
                featureFlags: { hasBookingEngine: false, hasInventory: true, hasInvoicing: true, hasMarketing: false },
                icon: '👔',
            },
        ],
    },
    {
        industry: 'Beauty, Wellness & Fitness',
        icon: '💆',
        businessTypes: [
            {
                businessType: 'Salon & Spa Services',
                description: 'Service type, Duration, Therapist level, Service pricing',
                enabledModules: ['website', 'products', 'bookings', 'ecommerce', 'marketing', 'media', 'invoicing'],
                attributePool: ['service_type', 'duration', 'therapist_level', 'pricing', 'packages', 'add_ons'],
                featureFlags: { hasBookingEngine: true, hasInventory: true, hasInvoicing: true, hasMarketing: true },
                icon: '💅',
            },
            {
                businessType: 'Gym & Fitness Center',
                description: 'Membership plan, Training access, Facility amenities, Timings',
                enabledModules: ['website', 'products', 'bookings', 'marketing', 'media', 'invoicing'],
                attributePool: ['membership_plan', 'training_access', 'amenities', 'timings', 'trainer_access'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: true },
                icon: '🏋️',
            },
            {
                businessType: 'Personal Training & Coaching',
                description: 'Fitness goal, Session mode, Trainer experience, Program duration',
                enabledModules: ['website', 'bookings', 'invoicing', 'media', 'blog'],
                attributePool: ['fitness_goal', 'session_mode', 'trainer_experience', 'program_duration', 'certification'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🧘',
            },
            {
                businessType: 'Beauty & Skincare Retail',
                description: 'Product type, Skin concern, Brand category, Usage instructions',
                enabledModules: ['website', 'products', 'ecommerce', 'marketing', 'media', 'blog', 'invoicing'],
                attributePool: ['product_type', 'skin_concern', 'brand_category', 'usage_instructions', 'ingredients'],
                featureFlags: { hasBookingEngine: false, hasInventory: true, hasInvoicing: true, hasMarketing: true },
                icon: '🧴',
            },
        ],
    },
    {
        industry: 'Technology & IT Services',
        icon: '💻',
        businessTypes: [
            {
                businessType: 'Software Development Agency',
                description: 'Technology stack, Project type, Engagement model, Delivery timeline',
                enabledModules: ['website', 'portfolio', 'blog', 'invoicing', 'media'],
                attributePool: ['tech_stack', 'project_type', 'engagement_model', 'delivery_timeline', 'team_size'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '⚙️',
            },
            {
                businessType: 'IT Consulting & Managed Services',
                description: 'Service scope, Infrastructure size, Support model, SLA terms',
                enabledModules: ['website', 'portfolio', 'blog', 'invoicing', 'bookings'],
                attributePool: ['service_scope', 'infrastructure_size', 'support_model', 'sla_terms', 'response_time'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🖥️',
            },
            {
                businessType: 'SaaS Product Company',
                description: 'Software category, Subscription plan, User limits, Feature set',
                enabledModules: ['website', 'products', 'ecommerce', 'blog', 'marketing', 'media', 'invoicing'],
                attributePool: ['software_category', 'subscription_plan', 'user_limits', 'feature_set', 'integrations'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: true },
                icon: '☁️',
            },
            {
                businessType: 'AI & Data Solutions Provider',
                description: 'Solution type, Data volume, Industry use case, Deployment model',
                enabledModules: ['website', 'portfolio', 'blog', 'invoicing', 'media'],
                attributePool: ['solution_type', 'data_volume', 'use_case', 'deployment_model', 'compliance'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🤖',
            },
        ],
    },
    {
        industry: 'Architecture & Interior Design',
        icon: '📐',
        businessTypes: [
            {
                businessType: 'Architectural Design & Planning',
                description: 'Project type, Site area, Design stages, Regulatory compliance',
                enabledModules: ['website', 'portfolio', 'blog', 'invoicing', 'media'],
                attributePool: ['project_type', 'site_area', 'design_stage', 'regulatory_compliance', 'budget_range'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🏛️',
            },
            {
                businessType: 'Interior Design & Space Planning',
                description: 'Space type, Design style, Area size, Material palette',
                enabledModules: ['website', 'portfolio', 'blog', 'invoicing', 'media', 'products'],
                attributePool: ['space_type', 'design_style', 'area_size', 'material_palette', 'budget_range'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🎨',
            },
            {
                businessType: 'Turnkey Design & Build Services',
                description: 'End-to-end scope, Budget range, Execution timeline, Vendor management',
                enabledModules: ['website', 'portfolio', 'invoicing', 'media', 'blog'],
                attributePool: ['scope', 'budget_range', 'execution_timeline', 'vendor_management', 'warranty'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🔑',
            },
        ],
    },
    {
        industry: 'Construction & Infrastructure',
        icon: '🏗️',
        businessTypes: [
            {
                businessType: 'Residential Construction',
                description: 'Building type, Built-up area, Construction phase, Material specs',
                enabledModules: ['website', 'portfolio', 'blog', 'invoicing', 'media'],
                attributePool: ['building_type', 'built_up_area', 'construction_phase', 'material_specs', 'possession_date'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🏠',
            },
            {
                businessType: 'Commercial Construction',
                description: 'Project category, Floor area, Compliance standards, Timeline',
                enabledModules: ['website', 'portfolio', 'invoicing', 'media', 'blog'],
                attributePool: ['project_category', 'floor_area', 'compliance', 'timeline', 'contractor_info'],
                featureFlags: { hasBookingEngine: false, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🏢',
            },
            {
                businessType: 'MEP & Engineering Services',
                description: 'Service category, System design, Installation scope, Maintenance support',
                enabledModules: ['website', 'portfolio', 'invoicing', 'bookings'],
                attributePool: ['service_category', 'system_design', 'installation_scope', 'maintenance_support'],
                featureFlags: { hasBookingEngine: true, hasInventory: false, hasInvoicing: true, hasMarketing: false },
                icon: '🔧',
            },
        ],
    },
];

/**
 * Lookup helpers
 */
export function getTemplateByIndustryAndType(industry: string, businessType: string): BusinessTemplate | null {
    const group = INDUSTRIES.find(g => g.industry === industry);
    if (!group) return null;
    const bt = group.businessTypes.find(b => b.businessType === businessType);
    if (!bt) return null;
    return { ...bt, industry: group.industry, industryIcon: group.icon };
}

export function getIndustryOptions(): string[] {
    return INDUSTRIES.map(g => g.industry);
}

export function getBusinessTypesForIndustry(industry: string): BusinessTemplate[] {
    const group = INDUSTRIES.find(g => g.industry === industry);
    if (!group) return [];
    return group.businessTypes.map(bt => ({ ...bt, industry: group.industry, industryIcon: group.icon }));
}

export function getAllModules(): string[] {
    return ['website', 'branding', 'products', 'ecommerce', 'bookings', 'marketing', 'blog', 'media', 'portfolio', 'invoicing'];
}
