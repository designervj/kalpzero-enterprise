"use client";
import React, { useState, useMemo } from "react";
import { 
    HotelBookingDto, 
    HotelRoomTypeDto, 
    HotelRoomItemDto, 
    HotelMealPlanDto, 
    HotelGuestDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Field, 
    Inp, 
    Sel, 
    Ic, 
    BOOKING_SOURCES 
} from "./HotelUI";
import { BookingDatePicker } from "./BookingDatePicker";
import { CoGuestSection, BookingRoomPicker } from "./BookingSubComponents";
import { calculateBookingTotals } from "./booking-utils";

interface BookingModalProps {
    booking: HotelBookingDto;
    roomTypes: HotelRoomTypeDto[];
    physicalRooms: HotelRoomItemDto[];
    mealPlans: HotelMealPlanDto[];
    customers: HotelGuestDto[];
    allBookings: HotelBookingDto[];
    onSave: (b: HotelBookingDto) => void;
    onClose: () => void;
}

const ALL_STATUSES: HotelBookingDto["status"][] = ["confirmed", "checked-in", "checked-out", "cancelled", "no-show", "pending"];

export function BookingModal({ 
    booking: init, 
    roomTypes, 
    physicalRooms, 
    mealPlans, 
    customers, 
    allBookings, 
    onSave, 
    onClose 
}: BookingModalProps) {
    const [b, setB] = useState<HotelBookingDto>(() => ({
        ...init,
        coGuests: init.coGuests ?? [],
        earlyCheckIn: init.earlyCheckIn ?? false,
        lateCheckOut: init.lateCheckOut ?? false,
    } as HotelBookingDto));
    
    const [tab, setTab] = useState<"main" | "guests" | "special">("main");
    const [showPicker, setShowPicker] = useState<"in" | "out" | null>(null);

    const s = (field: keyof HotelBookingDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setB(p => {
            const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
            const updated = { ...p, [field]: val } as HotelBookingDto;
            
            const totals = calculateBookingTotals(updated, roomTypes, mealPlans);
            return { ...updated, ...totals };
        });
    };

    const handleDateSelect = (date: string) => {
        setB(p => {
            let updated = { ...p };
            if (showPicker === "in") {
                updated.checkIn = date;
                if (updated.checkOut <= date) {
                    const dt = new Date(date + "T00:00:00");
                    dt.setDate(dt.getDate() + 1);
                    updated.checkOut = dt.toISOString().slice(0, 10);
                }
            } else if (showPicker === "out") {
                updated.checkOut = date;
            }
            
            const totals = calculateBookingTotals(updated, roomTypes, mealPlans);
            return { ...updated, ...totals };
        });
        setShowPicker(null);
    };

    const roomNums = useMemo(() => 
        physicalRooms.filter(r => r.roomTypeId === b.roomTypeId)
             .sort((x, y) => x.roomNumber.localeCompare(y.roomNumber, undefined, { numeric: true })), 
    [physicalRooms, b.roomTypeId]);

    const fmtPick = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";

    return (
        <div className="modal-overlay hotel-pms" onClick={onClose}>
            {showPicker && (
                <BookingDatePicker
                    mode={showPicker}
                    checkIn={b.checkIn}
                    checkOut={b.checkOut}
                    onSelect={handleDateSelect}
                    onClose={() => setShowPicker(null)}
                />
            )}
            <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{init.guestName ? "Edit Booking" : "New Booking"} — {b.bookingRef}</span>
                    <button className="modal-close" onClick={onClose}><Ic.X /></button>
                </div>
                
                <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #f0f0f0", padding: "0 24px" }}>
                    {(["main", "guests", "special"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            style={{ 
                                padding: "10px 18px", 
                                background: "none", 
                                border: "none", 
                                borderBottom: `2px solid ${tab === t ? "#2563eb" : "transparent"}`, 
                                cursor: "pointer", 
                                fontSize: 13, 
                                fontWeight: tab === t ? 700 : 500, 
                                color: tab === t ? "#2563eb" : "#6b7280" 
                            }}>
                            {t === "main" ? "📋 Booking" : t === "guests" ? `👥 Guests (${1 + (b.coGuests?.length ?? 0)})` : "⚙️ Special"}
                        </button>
                    ))}
                </div>

                <div className="modal-body">
                    {tab === "main" && (<>
                        <div className="grid-2 mb-12">
                            <Field label="Primary Guest Name *"><Inp value={b.guestName} onChange={s("guestName")} placeholder="Full name" autoFocus /></Field>
                            <Field label="Booking Ref"><Inp value={b.bookingRef} onChange={s("bookingRef")} /></Field>
                        </div>
                        <div className="grid-3 mb-12">
                            <Field label="Email"><Inp value={b.guestEmail} onChange={s("guestEmail")} type="email" /></Field>
                            <Field label="Phone"><Inp value={b.guestPhone} onChange={s("guestPhone")} /></Field>
                            <Field label="Source"><Sel value={b.bookingSource} onChange={s("bookingSource")} opts={BOOKING_SOURCES} /></Field>
                        </div>
                        <div className="grid-3 mb-12">
                            <Field label="Room Type"><Sel value={b.roomTypeId} onChange={s("roomTypeId")} opts={roomTypes.map(r => ({ v: r.id, l: r.roomName }))} /></Field>
                            <Field label="Check-in">
                                <button onClick={() => setShowPicker("in")}
                                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${showPicker === "in" ? "#3b82f6" : "#d1d5db"}`, background: showPicker === "in" ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                                    <span style={{ fontSize: 15 }}>📅</span>
                                    <div>{b.checkIn ? <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{fmtPick(b.checkIn)}</span> : <span style={{ fontSize: 13, color: "#9ca3af" }}>Select date</span>}</div>
                                </button>
                            </Field>
                            <Field label="Check-out">
                                <button onClick={() => setShowPicker("out")}
                                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 8, border: `1.5px solid ${showPicker === "out" ? "#3b82f6" : "#d1d5db"}`, background: showPicker === "out" ? "#eff6ff" : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                                    <span style={{ fontSize: 15 }}>🛫</span>
                                    <div>
                                        {b.checkOut ? <div>
                                            <span style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{fmtPick(b.checkOut)}</span>
                                            {b.checkIn && b.checkOut && <span style={{ fontSize: 11, color: "#2563eb", marginLeft: 8, fontWeight: 600 }}>🌙 {b.nights}N</span>}
                                        </div> : <span style={{ fontSize: 13, color: "#9ca3af" }}>Select date</span>}
                                    </div>
                                </button>
                            </Field>
                        </div>
                        <Field label="Room Assignment" style={{ marginBottom: 12 }}>
                            {roomNums.length > 0
                                ? <BookingRoomPicker roomNumbers={roomNums} roomTypeId={b.roomTypeId} checkIn={b.checkIn} checkOut={b.checkOut} selected={b.roomNumber} bookings={allBookings} bookingId={b.id} onChange={rn => setB(p => ({ ...p, roomNumber: rn }))} />
                                : <div style={{ fontSize: 13, color: "#9ca3af", padding: "8px 0" }}>No room numbers configured.</div>
                            }
                        </Field>
                        <div className="grid-4 mb-12">
                            <Field label="Adults"><Inp type="number" value={String(b.adults)} onChange={s("adults" as keyof HotelBookingDto)} /></Field>
                            <Field label="Children"><Inp type="number" value={String(b.children)} onChange={s("children" as keyof HotelBookingDto)} /></Field>
                            <Field label="Meal Plan"><Sel value={b.mealPlanId} onChange={s("mealPlanId")} opts={mealPlans.map(mp => ({ v: mp.id, l: `${mp.code} – ${mp.name}` }))} /></Field>
                            <Field label="Status"><Sel value={b.status} onChange={s("status")} opts={ALL_STATUSES} /></Field>
                        </div>
                        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 28, fontSize: 13, flexWrap: "wrap" }}>
                                <span>🌙 <b>{b.nights}</b> nights</span>
                                <span>🏨 Room: <b>${b.totalRoomCost.toLocaleString()}</b></span>
                                <span>🍽️ Meals: <b>${b.totalMealCost.toLocaleString()}</b></span>
                                <span style={{ fontSize: 15, fontWeight: 800, color: "#16a34a", marginLeft: "auto" }}>Total: ${b.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </>)}

                    {tab === "guests" && (
                        <div>
                            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 14px", marginBottom: 14 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>Primary Guest: {b.guestName || "(Not set)"}</div>
                                <div style={{ fontSize: 12.5, color: "#6b7280" }}>
                                    {b.adults} Adult(s) + {b.children} Child(ren) · Total: {1 + (b.coGuests?.length ?? 0)} guests registered
                                </div>
                            </div>
                            <CoGuestSection coGuests={b.coGuests ?? []} onChange={cg => setB(p => ({ ...p, coGuests: cg }))} />
                        </div>
                    )}

                    {tab === "special" && (
                        <div>
                            <Field label="Special Requests" style={{ marginBottom: 16 }}>
                                <textarea className="textarea" value={b.specialRequests} onChange={e => setB(p => ({ ...p, specialRequests: e.target.value }))} placeholder="Honeymoon setup, quiet room, etc." style={{ minHeight: 90 }} />
                            </Field>
                            <div className="grid-2 mb-12">
                                <div>
                                    <label className="field-label">Early Check-in</label>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                                        <input type="checkbox" checked={b.earlyCheckIn} onChange={e => setB(p => ({ ...p, earlyCheckIn: e.target.checked }))} />
                                        <span style={{ fontSize: 13 }}>Request early check-in</span>
                                    </div>
                                    {b.earlyCheckIn && <Inp type="time" value={b.earlyCheckInTime} onChange={s("earlyCheckInTime")} style={{ marginTop: 8 }} />}
                                </div>
                                <div>
                                    <label className="field-label">Late Check-out</label>
                                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                                        <input type="checkbox" checked={b.lateCheckOut} onChange={e => setB(p => ({ ...p, lateCheckOut: e.target.checked }))} />
                                        <span style={{ fontSize: 13 }}>Request late check-out</span>
                                    </div>
                                    {b.lateCheckOut && <Inp type="time" value={b.lateCheckOutTime} onChange={s("lateCheckOutTime")} style={{ marginTop: 8 }} />}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                    <Btn onClick={() => onSave(b)} disabled={!b.guestName.trim()}>Save Booking</Btn>
                </div>
            </div>
        </div>
    );
}
