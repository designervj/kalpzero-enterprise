"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelBookingDto, 
    HotelRoomItemDto, 
    HotelMealPlanDto,
    HotelGuestDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Badge, 
    Ic, 
    Field,
    Inp,
    Sel,
    Card,
    PageHeader,
    statusColor,
    fmtDate
} from "@/components/travel/hotel/HotelUI";

export default function CheckInWizardPage() {
    const [bookings, setBookings] = useState<HotelBookingDto[]>([]);
    const [rooms, setRooms] = useState<HotelRoomItemDto[]>([]);
    const [mealPlans, setMealPlans] = useState<HotelMealPlanDto[]>([]);
    const [guests, setGuests] = useState<HotelGuestDto[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<HotelBookingDto | null>(null);
    const [roomNum, setRoomNum] = useState("");
    const [mealPlanId, setMealPlanId] = useState("");
    const [step, setStep] = useState(1);
    const [done, setDone] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [bRes, rRes, mRes, gRes] = await Promise.all([
                fetch("/api/travel/hotel/bookings"),
                fetch("/api/travel/hotel/rooms"),
                fetch("/api/travel/hotel/meal-plans"),
                fetch("/api/travel/hotel/customers")
            ]);
            const [bData, rData, mData, gData] = await Promise.all([
                bRes.json(), rRes.json(), mRes.json(), gRes.json()
            ]);
            setBookings(bData.data || []);
            setRooms(rData.data || []);
            setMealPlans(mData.data || []);
            setGuests(gData.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return bookings.filter(b =>
            b.status === "confirmed" &&
            (b.guestName.toLowerCase().includes(q) || b.bookingRef.toLowerCase().includes(q))
        ).slice(0, 8);
    }, [query, bookings]);

    const availableRooms = useMemo(() => {
        if (!selected) return [];
        const occupied = bookings
            .filter(b => b.status === "checked-in" && b.roomNumber)
            .map(b => b.roomNumber);
        return rooms
            .filter(r => r.roomTypeId === selected.roomTypeId && !occupied.includes(r.roomNumber))
            .map(r => r.roomNumber);
    }, [selected, rooms, bookings]);

    const guestProfile = useMemo(() => 
        selected ? guests.find(g => g.id === selected.customerId) : null
    , [selected, guests]);

    const selectBooking = (b: HotelBookingDto) => {
        setSelected(b);
        setMealPlanId(b.mealPlanId || "");
        setRoomNum("");
        setStep(2);
        setQuery("");
    };

    const handleConfirm = async () => {
        if (!selected || !roomNum) return;
        
        const res = await fetch("/api/travel/hotel/bookings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...selected,
                status: "checked-in",
                roomNumber: roomNum,
                mealPlanId: mealPlanId
            })
        });

        if (res.ok) {
            setDone(true);
        }
    };

    const reset = () => {
        setSelected(null);
        setStep(1);
        setDone(false);
        setRoomNum("");
    };

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading check-in wizard...</div>;

    if (done && selected) {
        return (
            <div className="hotel-pms" style={{ padding: "24px 32px" }}>
                <div style={{ maxWidth: 540, margin: "60px auto", textAlign: "center" }}>
                    <Card>
                        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
                        <h2 style={{ fontSize: 24, fontWeight: 800, color: "#16a34a", marginBottom: 8 }}>Checked In!</h2>
                        <p style={{ color: "#6b7280", marginBottom: 24 }}><b>{selected.guestName}</b> is now assigned to Room <b>{roomNum}</b></p>
                        
                        <div style={{ background: "#f9fafb", padding: 20, borderRadius: 12, marginBottom: 24 }}>
                            <div className="qr-box" style={{ margin: "0 auto 12px", border: "2px solid #000", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                🔑
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>Digital Key Generated</div>
                        </div>

                        <Btn onClick={reset} variant="primary">Check-in Another Guest</Btn>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <PageHeader title="Quick Check-in" sub="Streamlined guest arrival process" />

            <div style={{ maxWidth: 800 }}>
                {/* Step 1 */}
                <Card className={`mb-16 ${step === 1 ? "active-step" : ""}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: step === 1 ? 16 : 0 }}>
                        <div className={`step-badge ${step > 1 ? "done" : "active"}`}>{step > 1 ? "✓" : "1"}</div>
                        <div style={{ fontWeight: 700 }}>Search Booking</div>
                        {step > 1 && selected && <div style={{ marginLeft: "auto", fontSize: 12, color: "#16a34a" }}>Selected: {selected.bookingRef}</div>}
                    </div>
                    {step === 1 && (
                        <div style={{ marginTop: 12 }}>
                            <Inp value={query} onChange={e => setQuery(e.target.value)} placeholder="Enter guest name or booking reference..." autoFocus />
                            <div style={{ marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
                                {results.map(b => (
                                    <div key={b.id} onClick={() => selectBooking(b)} 
                                        style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{b.guestName}</div>
                                            <div style={{ fontSize: 12, color: "#6b7280" }}>{b.bookingRef} &middot; {b.roomTypeName} &middot; {fmtDate(b.checkIn)}</div>
                                        </div>
                                        <Badge color="blue">Confirmed</Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Step 2 */}
                {step >= 2 && selected && (
                    <Card className={`mb-16 ${step === 2 ? "active-step" : ""}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: step === 2 ? 16 : 0 }}>
                            <div className={`step-badge ${step > 2 ? "done" : "active"}`}>{step > 2 ? "✓" : "2"}</div>
                            <div style={{ fontWeight: 700 }}>Verify Details</div>
                        </div>
                        {step === 2 && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 16 }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>BOOKING INFO</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                        <div>Ref: <b>{selected.bookingRef}</b></div>
                                        <div>Stay: <b>{selected.nights} Nights</b></div>
                                        <div>Meal: <b>{selected.mealPlanCode}</b></div>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 8 }}>GUEST INFO</div>
                                    <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                                        <div>Name: <b>{selected.guestName}</b></div>
                                        <div>Phone: <b>{selected.guestPhone}</b></div>
                                        <div>Email: <b>{selected.guestEmail}</b></div>
                                    </div>
                                </div>
                                <div style={{ gridColumn: "span 2", marginTop: 12 }}>
                                    <Btn onClick={() => setStep(3)}>Confirm & Continue →</Btn>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Step 3 */}
                {step >= 3 && selected && (
                    <Card className={`active-step`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                            <div className={`step-badge active`}>3</div>
                            <div style={{ fontWeight: 700 }}>Assign Room</div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                            <Field label="Choose Available Room">
                                {availableRooms.length === 0 ? (
                                    <div style={{ color: "#dc2626", fontSize: 12 }}>No rooms available for this type.</div>
                                ) : (
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                        {availableRooms.map(r => (
                                            <button key={r} onClick={() => setRoomNum(r)}
                                                style={{ padding: "8px 16px", borderRadius: 8, border: "2px solid", borderColor: roomNum === r ? "#2563eb" : "#e5e7eb", background: roomNum === r ? "#eff6ff" : "#fff", color: roomNum === r ? "#2563eb" : "#374151", fontWeight: 700, cursor: "pointer" }}>
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Field>
                            <Field label="Override Meal Plan (Optional)">
                                <Sel 
                                    value={mealPlanId} 
                                    onChange={e => setMealPlanId(e.target.value)}
                                    opts={mealPlans.map(mp => ({ v: mp.id, l: `${mp.code} - ${mp.name}` }))} 
                                />
                            </Field>
                        </div>
                        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                            <Btn variant="success" onClick={handleConfirm} disabled={!roomNum}>Complete Check-in</Btn>
                            <Btn variant="secondary" onClick={() => setStep(2)}>Back</Btn>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
