export type TravelPackageStatus = 'draft' | 'published' | 'archived';

export interface MoneyValueDto {
    currency: string;
    amount: number;
}

export interface TravelAvailabilityDto {
    availableMonths: string[];
    fixedDepartureDates: string[];
    blackoutDates: string[];
}

export interface MealInclusionsDto {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
}

export interface TravelHotelStayDto {
    id: string;
    hotelRef: string | null;
    customRoomType?: string;
    checkInTime: string;
    checkOutTime: string;
    customNotes?: string;
    customImages?: string[];
    mealInclusions: MealInclusionsDto;
    hotelData?: TravelHotelCatalogDto | null;
}

export interface TravelActivityRefDto {
    id: string;
    activityRef: string | null;
    time: string;
    coverTitle?: string;
    customTitle?: string;
    customDescription?: string;
    customImages?: string[];
    guideIncluded: boolean;
    ticketIncluded: boolean;
    activityData?: TravelActivityCatalogDto | null;
}

export interface TravelTransferRefDto {
    id: string;
    transferType?: string;
    pickupTime: string;
    dropTime?: string;
    from: string;
    to: string;
    vehicleType: string;
    notes?: string;
}

export interface TravelItineraryDayDto {
    id: string;
    dayNumber: number;
    title: string;
    city: string;
    dayType: string;
    mealsIncluded: string[];
    notes: string;
    description: string;
    hotelStays: TravelHotelStayDto[];
    activities: TravelActivityRefDto[];
    transfers: TravelTransferRefDto[];
}

export interface TravelFaqDto {
    id: string;
    question: string;
    answer: string;
}

export interface TravelGuidelineDto {
    id: string;
    point: string;
}

export interface TravelAdditionalInfoDto {
    aboutDestination: string;
    quickInfo: {
        destinationsCovered: string;
        duration: string;
        startPoint: string;
        endPoint: string;
    };
    experiencesCovered: string[];
    notToMiss: string[];
}

export interface TravelPackageDto {
    _id?: string | number | { toString(): string };
    slug: string;
    title: string;
    destination: string;
    tripDuration: string;
    travelStyle: string;
    tourType: string;
    exclusivityLevel: string;
    price: MoneyValueDto;
    shortDescription: string;
    longDescription: string;
    availability: TravelAvailabilityDto;
    inclusions: string[];
    exclusions: string[];
    knowBeforeYouGo: TravelGuidelineDto[];
    additionalInfo: TravelAdditionalInfoDto;
    faqs: TravelFaqDto[];
    itinerary: TravelItineraryDayDto[];
    sourceRefs?: string[];
    status: TravelPackageStatus;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    publishedAt?: string | Date | null;
}

export interface TravelPackageListItemDto {
    _id: string;
    slug: string;
    title: string;
    destination: string;
    tripDuration: string;
    price: MoneyValueDto;
    status: TravelPackageStatus;
    dayCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface TravelHotelCatalogDto {
    _id?: string | number | { toString(): string };
    hotelName: string;
    city: string;
    starRating: number;
    description: string;
    roomTypes: string[];
    amenities: string[];
    images: string[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface TravelActivityCatalogDto {
    _id?: string | number | { toString(): string };
    title: string;
    description: string;
    activityType: string;
    defaultDuration: string;
    location: string;
    tags: string[];
    images: string[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface TravelTransferCatalogDto {
    _id?: string | number | { toString(): string };
    title: string;
    from: string;
    to: string;
    vehicleType: string;
    defaultDuration: string;
    notes: string;
    images: string[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface TravelPassportDto {
    passportNumber: string;
    issuingCountry: string;
    nationality: string;
    dateOfBirth: string;
    expiryDate: string;
    gender: string;
    rawText?: string;
    ocrConfidence?: number;
}

export interface TravelCustomerDocumentRefDto {
    fileName: string;
    mimeType: string;
    size: number;
    uploadedAt: string | Date;
}

export interface TravelCustomerDto {
    _id?: string | number | { toString(): string };
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    countryCode: string;
    city: string;
    tags: string[];
    notes: string;
    passport: TravelPassportDto;
    documents: TravelCustomerDocumentRefDto[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface TravelCustomerListItemDto {
    _id: string;
    fullName: string;
    email: string;
    phone: string;
    nationality: string;
    passportNumber: string;
    invoiceCount: number;
    invoiceTotal: number;
    bookingCount: number;
    updatedAt: string;
}

export interface PassportOcrResultDto {
    fullName?: string;
    nationality?: string;
    passport: TravelPassportDto;
}

export function createTravelSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
