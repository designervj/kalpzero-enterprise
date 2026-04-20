"use client";
import { 
    HotelBookingDto, 
    HotelRoomTypeDto, 
    HotelMealPlanDto 
} from "@/lib/contracts/hotel";

export function buildBlankBooking(rooms: HotelRoomTypeDto[], mealPlans: HotelMealPlanDto[]): HotelBookingDto {
    const tod = new Date().toISOString().slice(0, 10);
    const tom = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    return {
        id: Math.random().toString(36).slice(2, 9),
        bookingRef: "BK" + Math.floor(100000 + Math.random() * 900000),
        customerId: "",
        guestName: "",
        guestEmail: "",
        guestPhone: "",
        roomTypeId: rooms[0]?.id ?? "",
        roomTypeName: rooms[0]?.roomName ?? "",
        roomNumber: null,
        checkIn: tod,
        checkOut: tom,
        nights: 1,
        adults: 1,
        children: 0,
        coGuests: [],
        mealPlanId: mealPlans.find(m => m.active !== false)?.id ?? mealPlans[0]?.id ?? "",
        mealPlanCode: mealPlans.find(m => m.active !== false)?.code ?? "EP",
        totalRoomCost: 0,
        totalMealCost: 0,
        grandTotal: 0,
        currency: "USD",
        status: "confirmed",
        bookingSource: "Direct",
        specialRequests: "",
        earlyCheckIn: false,
        lateCheckOut: false,
        earlyCheckInTime: "",
        lateCheckOutTime: "",
        checkInActual: null,
        checkOutActual: null,
        createdAt: tod,
    };
}

export function calculateBookingTotals(
    booking: HotelBookingDto, 
    roomTypes: HotelRoomTypeDto[], 
    mealPlans: HotelMealPlanDto[]
): Partial<HotelBookingDto> {
    const rt = roomTypes.find(r => r.id === booking.roomTypeId);
    const mp = mealPlans.find(m => m.id === booking.mealPlanId);
    
    const nights = Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000));
    const totalRoomCost = (rt?.basePrice ?? 0) * nights;
    const pax = Number(booking.adults) + Number(booking.children);
    const totalMealCost = (mp?.pricePerPersonPerNight ?? 0) * pax * nights;
    const grandTotal = totalRoomCost + totalMealCost;
    
    return {
        nights,
        totalRoomCost,
        totalMealCost,
        grandTotal,
        roomTypeName: rt?.roomName ?? booking.roomTypeName,
        mealPlanCode: mp?.code ?? booking.mealPlanCode
    };
}
