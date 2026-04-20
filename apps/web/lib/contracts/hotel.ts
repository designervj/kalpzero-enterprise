export type HotelRoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'out-of-order' | 'blocked';
export type HotelBookingStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show' | 'pending';
export type HotelMaintenancePriority = 'low' | 'medium' | 'high';
export type HotelMaintenanceStatus = 'open' | 'in-progress' | 'resolved' | 'deferred';

export interface HotelRoomItemDto {
    _id?: string | number | { toString(): string };
    id: string; // Internal stable ID
    roomNumber: string;
    roomTypeId: string;
    roomTypeName: string;
    floor: number;
    status: HotelRoomStatus;
    isActive: boolean;
    features: string[];
    notes: string;
    lastCleaned: string;
    createdAt: string;
}

export interface HotelRoomTypeDto {
    _id?: string | number | { toString(): string };
    id: string;
    roomName: string;
    slug: string;
    roomCategory: string;
    bedType: string;
    maxOccupancy: number;
    roomSize: number;
    view: string;
    smokingPolicy: string;
    balconyAvailable: boolean;
    roomTheme: string;
    soundproofingLevel: string;
    inRoomWorkspace: boolean;
    entertainmentOptions: string;
    bathroomType: string;
    floorPreference: string;
    basePrice: number;
    extraBedPrice: number;
    refundable: boolean;
    currency: string;
    amenityIds: string[];
    images: string[];
    roomNumbers?: string[];
}

export interface HotelAvailabilityDto {
    _id?: string | number | { toString(): string };
    roomId: string;
    totalRooms: number;
    availableRooms: number;
    minimumStay: number;
    maximumStay: number;
    blackoutDates: string[];
}

export interface HotelSeasonalPriceDto {
    id: string;
    seasonName: string;
    startDate: string;
    endDate: string;
    price: number;
}

export interface HotelPricingDto {
    _id?: string | number | { toString(): string };
    roomId: string;
    currency: string;
    weekendPricingEnabled: boolean;
    weekendPrice: number;
    seasonalPricing: HotelSeasonalPriceDto[];
}

export interface HotelAmenityFacilityDto {
    id: string;
    name: string;
}

export interface HotelAmenityCatDto {
    _id?: string | number | { toString(): string };
    id: string;
    name: string;
    facilities: HotelAmenityFacilityDto[];
}

export interface HotelInfoDto {
    _id?: string | number | { toString(): string };
    name: string;
    shortDescription: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    checkInTime: string;
    checkOutTime: string;
    starRating: number;
    website: string;
    currencyCode: string;
}

export interface HotelCoGuestDto {
    id: string;
    name: string;
    passportNo: string;
    nationality: string;
    dob: string;
    dietaryPref: string;
    phone: string;
}

export interface HotelGuestDto {
    _id?: string | number | { toString(): string };
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    passportNo: string;
    dob: string;
    loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
    vip: boolean;
    preferredRoom: string;
    dietaryPref: string;
    address: string;
    company: string;
    notes: string;
}

export interface HotelBookingDto {
    _id?: string | number | { toString(): string };
    id: string;
    bookingRef: string;
    customerId: string;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    roomTypeId: string;
    roomTypeName: string;
    roomNumber: string | null;
    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    coGuests: HotelCoGuestDto[];
    mealPlanId: string;
    mealPlanCode: string;
    totalRoomCost: number;
    totalMealCost: number;
    grandTotal: number;
    currency: string;
    status: HotelBookingStatus;
    bookingSource: string;
    specialRequests: string;
    earlyCheckIn: boolean;
    lateCheckOut: boolean;
    earlyCheckInTime: string;
    lateCheckOutTime: string;
    checkInActual: string | null;
    checkOutActual: string | null;
    createdAt: string;
}

export interface HotelMealPlanDto {
    _id?: string | number | { toString(): string };
    id: string;
    code: string;
    name: string;
    description: string;
    pricePerPersonPerNight: number;
    active: boolean;
    includedMeals: string[];
}

export interface HotelHousekeepingTaskDto {
    _id?: string | number | { toString(): string };
    id: string;
    roomTypeId: string;
    roomNumber: string;
    status: 'clean' | 'dirty' | 'inspected' | 'dnd' | 'out-of-order';
    priority: 'low' | 'medium' | 'high';
    assignedTo: string;
    lastCleaned: string;
    notes: string;
    updatedAt: string;
}

export interface HotelMaintenanceCommentDto {
    id: string;
    author: string;
    text: string;
    timestamp: string;
    statusChange?: string;
}

export interface HotelMaintenanceItemDto {
    _id?: string | number | { toString(): string };
    id: string;
    roomNumber: string;
    roomTypeId: string;
    issue: string;
    category: string;
    priority: HotelMaintenancePriority;
    status: HotelMaintenanceStatus;
    reportedBy: string;
    assignedTo: string;
    reportedAt: string;
    resolvedAt: string | null;
    notes: string;
    comments: HotelMaintenanceCommentDto[];
    estimatedCost: number;
}

export interface HotelPricingRuleDto {
    _id?: string | number | { toString(): string };
    id: string;
    roomTypeId: string;
    type: 'last_minute' | 'early_bird' | 'long_stay' | 'weekend_surge';
    enabled: boolean;
    label: string;
    threshold: number;
    unit: string;
    discount: number;
}

export type HotelStaffRole = 'Front Desk' | 'Housekeeping' | 'Maintenance' | 'F&B' | 'Security' | 'Management' | 'Concierge' | 'Engineering';
export type HotelStaffShift = 'Morning (6AM–2PM)' | 'Afternoon (2PM–10PM)' | 'Night (10PM–6AM)' | 'General (9AM–6PM)';
export type HotelStaffStatus = 'Active' | 'On Leave' | 'Off Duty' | 'Resigned';

export interface HotelStaffMemberDto {
    _id?: string | number | { toString(): string };
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    role: HotelStaffRole;
    department: string;
    shift?: HotelStaffShift;
    phone: string;
    email: string;
    emergencyContact: string;
    joinDate: string;
    status: HotelStaffStatus;
    notes: string;

    todayAttendance: 'present' | 'absent' | 'late' | 'not-marked';
}
