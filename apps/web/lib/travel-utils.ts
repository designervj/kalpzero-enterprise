import { createTravelSlug, type MealInclusionsDto, type TravelActivityRefDto, type TravelAdditionalInfoDto, type TravelAvailabilityDto, type TravelFaqDto, type TravelGuidelineDto, type TravelHotelStayDto, type TravelItineraryDayDto, type TravelPackageDto, type TravelTransferRefDto } from '@/lib/contracts/travel';

function normalizeString(value: unknown, fallback = ''): string {
    if (typeof value !== 'string') return fallback;
    return value.trim();
}

function normalizeStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean);
}

function normalizeNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return fallback;
}

function generateClientId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeMealInclusions(value: unknown): MealInclusionsDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        breakfast: Boolean(raw.breakfast),
        lunch: Boolean(raw.lunch),
        dinner: Boolean(raw.dinner),
    };
}

function normalizeHotelStay(value: unknown): TravelHotelStayDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        id: normalizeString(raw.id, generateClientId('hotel')),
        hotelRef: normalizeString(raw.hotelRef) || null,
        customRoomType: normalizeString(raw.customRoomType),
        checkInTime: normalizeString(raw.checkInTime, '14:00'),
        checkOutTime: normalizeString(raw.checkOutTime, '11:00'),
        customNotes: normalizeString(raw.customNotes),
        customImages: normalizeStringArray(raw.customImages),
        mealInclusions: normalizeMealInclusions(raw.mealInclusions),
    };
}

function normalizeActivity(value: unknown): TravelActivityRefDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        id: normalizeString(raw.id, generateClientId('activity')),
        activityRef: normalizeString(raw.activityRef) || null,
        time: normalizeString(raw.time, '09:00'),
        coverTitle: normalizeString(raw.coverTitle),
        customTitle: normalizeString(raw.customTitle),
        customDescription: normalizeString(raw.customDescription),
        customImages: normalizeStringArray(raw.customImages),
        guideIncluded: Boolean(raw.guideIncluded),
        ticketIncluded: Boolean(raw.ticketIncluded),
    };
}

function normalizeTransfer(value: unknown): TravelTransferRefDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        id: normalizeString(raw.id, generateClientId('transfer')),
        transferType: normalizeString(raw.transferType, 'Private'),
        pickupTime: normalizeString(raw.pickupTime, '08:00'),
        dropTime: normalizeString(raw.dropTime),
        from: normalizeString(raw.from),
        to: normalizeString(raw.to),
        vehicleType: normalizeString(raw.vehicleType, 'Sedan'),
        notes: normalizeString(raw.notes),
    };
}

function normalizeItineraryDay(value: unknown, index: number): TravelItineraryDayDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const meals = normalizeStringArray(raw.mealsIncluded);

    return {
        id: normalizeString(raw.id, generateClientId('day')),
        dayNumber: normalizeNumber(raw.dayNumber, index + 1),
        title: normalizeString(raw.title, `Day ${index + 1}`),
        city: normalizeString(raw.city),
        dayType: normalizeString(raw.dayType, 'sightseeing'),
        mealsIncluded: meals,
        notes: normalizeString(raw.notes),
        description: normalizeString(raw.description),
        hotelStays: Array.isArray(raw.hotelStays) ? raw.hotelStays.map(normalizeHotelStay) : [],
        activities: Array.isArray(raw.activities) ? raw.activities.map(normalizeActivity) : [],
        transfers: Array.isArray(raw.transfers) ? raw.transfers.map(normalizeTransfer) : [],
    };
}

function normalizeFaq(value: unknown): TravelFaqDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        id: normalizeString(raw.id, generateClientId('faq')),
        question: normalizeString(raw.question),
        answer: normalizeString(raw.answer),
    };
}

function normalizeGuideline(value: unknown): TravelGuidelineDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        id: normalizeString(raw.id, generateClientId('guide')),
        point: normalizeString(raw.point),
    };
}

function normalizeAvailability(value: unknown): TravelAvailabilityDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    return {
        availableMonths: normalizeStringArray(raw.availableMonths),
        fixedDepartureDates: normalizeStringArray(raw.fixedDepartureDates),
        blackoutDates: normalizeStringArray(raw.blackoutDates),
    };
}

function normalizeAdditionalInfo(value: unknown): TravelAdditionalInfoDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const quickInfoRaw = raw.quickInfo && typeof raw.quickInfo === 'object'
        ? raw.quickInfo as Record<string, unknown>
        : {};

    return {
        aboutDestination: normalizeString(raw.aboutDestination),
        quickInfo: {
            destinationsCovered: normalizeString(quickInfoRaw.destinationsCovered),
            duration: normalizeString(quickInfoRaw.duration),
            startPoint: normalizeString(quickInfoRaw.startPoint),
            endPoint: normalizeString(quickInfoRaw.endPoint),
        },
        experiencesCovered: normalizeStringArray(raw.experiencesCovered),
        notToMiss: normalizeStringArray(raw.notToMiss),
    };
}

export function normalizeTravelPackageInput(value: unknown): TravelPackageDto {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const title = normalizeString(raw.title);
    const itineraryRaw = Array.isArray(raw.itinerary) ? raw.itinerary : [];

    return {
        slug: normalizeString(raw.slug, createTravelSlug(title || 'travel-package')),
        title,
        destination: normalizeString(raw.destination),
        tripDuration: normalizeString(raw.tripDuration),
        travelStyle: normalizeString(raw.travelStyle),
        tourType: normalizeString(raw.tourType),
        exclusivityLevel: normalizeString(raw.exclusivityLevel),
        price: {
            currency: normalizeString(raw.price && typeof raw.price === 'object' ? (raw.price as Record<string, unknown>).currency : '', 'INR'),
            amount: normalizeNumber(raw.price && typeof raw.price === 'object' ? (raw.price as Record<string, unknown>).amount : 0),
        },
        shortDescription: normalizeString(raw.shortDescription),
        longDescription: normalizeString(raw.longDescription),
        availability: normalizeAvailability(raw.availability),
        inclusions: normalizeStringArray(raw.inclusions),
        exclusions: normalizeStringArray(raw.exclusions),
        knowBeforeYouGo: Array.isArray(raw.knowBeforeYouGo) ? raw.knowBeforeYouGo.map(normalizeGuideline) : [],
        additionalInfo: normalizeAdditionalInfo(raw.additionalInfo),
        faqs: Array.isArray(raw.faqs) ? raw.faqs.map(normalizeFaq) : [],
        itinerary: itineraryRaw.map((day, index) => normalizeItineraryDay(day, index)),
        sourceRefs: normalizeStringArray(raw.sourceRefs),
        status: raw.status === 'published' || raw.status === 'archived' ? raw.status : 'draft',
    };
}

export async function resolveTenantKeyFromRequest(req: Request, allowQueryTenant = false): Promise<string> {
    if (allowQueryTenant) {
        const { searchParams } = new URL(req.url);
        const queryTenant = normalizeString(searchParams.get('tenant'));
        if (queryTenant) return queryTenant;
    }

    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.get('kalp_active_tenant')?.value || 'demo';
}

export function sanitizeCatalogPayload<T extends Record<string, unknown>>(value: unknown, defaults: T): T {
    const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
    const result: Record<string, unknown> = { ...defaults };

    for (const key of Object.keys(defaults)) {
        const defaultValue = defaults[key];
        const incoming = raw[key];

        if (typeof defaultValue === 'string') {
            result[key] = normalizeString(incoming, defaultValue);
            continue;
        }
        if (typeof defaultValue === 'number') {
            result[key] = normalizeNumber(incoming, defaultValue);
            continue;
        }
        if (Array.isArray(defaultValue)) {
            result[key] = normalizeStringArray(incoming);
            continue;
        }
        result[key] = incoming ?? defaultValue;
    }

    return result as T;
}
