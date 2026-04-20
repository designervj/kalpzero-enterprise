"use client";
import React from "react";
import { 
    HotelBookingDto, 
    HotelCoGuestDto, 
    HotelRoomItemDto, 
    HotelRoomTypeDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Field, 
    Inp, 
    Sel, 
    Ic, 
    DIETARY_PREFS 
} from "./HotelUI";

export function CoGuestSection({ 
    coGuests, 
    onChange 
}: { 
    coGuests: HotelCoGuestDto[]; 
    onChange: (g: HotelCoGuestDto[]) => void 
}) {
    const add = () => onChange([...coGuests, { 
        id: Math.random().toString(36).slice(2, 9), 
        name: "", 
        passportNo: "", 
        nationality: "", 
        dob: "", 
        dietaryPref: "Non-Veg", 
        phone: "" 
    }]);
    
    const remove = (id: string) => onChange(coGuests.filter(g => g.id !== id));
    const upd = (id: string, f: keyof HotelCoGuestDto, v: string) => 
        onChange(coGuests.map(g => g.id === id ? { ...g, [f]: v } : g));

    return (
        <div className="hotel-pms" style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#f9fafb", borderBottom: coGuests.length ? "1px solid #e5e7eb" : "none" }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>👥 Additional Guests ({coGuests.length})</span>
                <Btn size="sm" variant="outline" onClick={add}><Ic.Plus /> Add Guest</Btn>
            </div>
            {coGuests.map((g, i) => (
                <div key={g.id} style={{ padding: "12px 14px", borderBottom: i < coGuests.length - 1 ? "1px solid #f3f4f6" : "none", background: "#fff" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: 12.5, color: "#6b7280" }}>Guest {i + 2}</span>
                        <button onClick={() => remove(g.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
                    </div>
                    <div className="grid-3" style={{ gap: 8 }}>
                        <Field label="Full Name"><Inp value={g.name} onChange={e => upd(g.id, "name", e.target.value)} placeholder="Guest name" /></Field>
                        <Field label="Passport/ID"><Inp value={g.passportNo} onChange={e => upd(g.id, "passportNo", e.target.value)} placeholder="ID number" /></Field>
                        <Field label="Nationality"><Inp value={g.nationality} onChange={e => upd(g.id, "nationality", e.target.value)} placeholder="Country" /></Field>
                    </div>
                    <div className="grid-3" style={{ gap: 8, marginTop: 8 }}>
                        <Field label="Date of Birth"><Inp type="date" value={g.dob} onChange={e => upd(g.id, "dob", e.target.value)} /></Field>
                        <Field label="Phone"><Inp value={g.phone} onChange={e => upd(g.id, "phone", e.target.value)} placeholder="+1 234 567" /></Field>
                        <Field label="Dietary Pref"><Sel value={g.dietaryPref} onChange={e => upd(g.id, "dietaryPref", e.target.value)} opts={DIETARY_PREFS} /></Field>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function BookingRoomPicker({ 
    roomNumbers, 
    roomTypeId, 
    checkIn, 
    checkOut, 
    selected, 
    bookings, 
    bookingId, 
    onChange 
}: {
    roomNumbers: HotelRoomItemDto[]; 
    roomTypeId: string; 
    checkIn: string; 
    checkOut: string;
    selected: string | null; 
    bookings: HotelBookingDto[]; 
    bookingId: string; 
    onChange: (r: string | null) => void;
}) {
    const isConflict = (n: string) => {
        return bookings.some(b => 
            b.id !== bookingId &&
            b.roomNumber === n &&
            b.roomTypeId === roomTypeId &&
            b.status !== 'cancelled' && b.status !== 'checked-out' && b.status !== 'no-show' &&
            b.checkIn < checkOut && b.checkOut > checkIn
        );
    };

    const visibleRooms = roomNumbers.filter(r => {
        const conflict = isConflict(r.roomNumber);
        const isUnavailableStatus = r.status === 'maintenance' || r.status === 'out-of-order';
        return (!conflict && !isUnavailableStatus) || selected === r.roomNumber;
    });

    const hasConflictVisible = visibleRooms.some(r => isConflict(r.roomNumber));

    return (
        <div className="hotel-pms">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
                <button onClick={() => onChange(null)}
                    style={{ padding: "6px 12px", borderRadius: 7, border: `2px solid ${selected === null ? "#9ca3af" : "#e5e7eb"}`, background: selected === null ? "#f3f4f6" : "#fff", fontSize: 12.5, cursor: "pointer", color: "#6b7280", fontWeight: selected === null ? 700 : 400 }}>
                    Unassigned
                </button>
                {visibleRooms.length === 0 && (
                    <div style={{ padding: "6px 12px", fontSize: 12.5, color: "#9ca3af", fontStyle: "italic", display: "flex", alignItems: "center" }}>No available rooms</div>
                )}
                {visibleRooms.map(r => {
                    const n = r.roomNumber;
                    const conflict = isConflict(n);
                    const isSelected = selected === n;
                    return (
                        <button key={n} onClick={() => !conflict && onChange(n)} disabled={conflict}
                            title={conflict ? "Already booked for these dates" : `Assign Room ${n}`}
                            style={{
                                padding: "6px 14px", borderRadius: 7, fontWeight: 700, fontSize: 14, cursor: conflict ? "not-allowed" : "pointer",
                                border: `2px solid ${isSelected ? (conflict ? "#fecaca" : "#2563eb") : "#d1d5db"}`,
                                background: isSelected ? (conflict ? "#fef2f2" : "#eff6ff") : "#fff",
                                color: isSelected ? (conflict ? "#dc2626" : "#2563eb") : "#374151",
                                opacity: conflict ? 0.7 : 1,
                                position: "relative",
                            }}>
                            {n}
                            {conflict && <span style={{ fontSize: 9, position: "absolute", top: -4, right: -4, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</span>}
                        </button>
                    );
                })}
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#eff6ff", border: "1px solid #2563eb", borderRadius: 2, marginRight: 4 }} />Selected</span>
                {hasConflictVisible && <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2, marginRight: 4 }} />Occupied</span>}
                <span><span style={{ display: "inline-block", width: 8, height: 8, background: "#fff", border: "1px solid #d1d5db", borderRadius: 2, marginRight: 4 }} />Available</span>
            </div>
        </div>
    );
}
