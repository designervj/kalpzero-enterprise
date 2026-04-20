"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelBookingDto, 
    HotelRoomTypeDto, 
    HotelRoomItemDto, 
    HotelMealPlanDto, 
    HotelGuestDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Ic, 
    Badge, 
    Confirm, 
    statusColor, 
    fmtDate 
} from "@/components/travel/hotel/HotelUI";
import { BookingModal } from "@/components/travel/hotel/BookingModal";
import { buildBlankBooking } from "@/components/travel/hotel/booking-utils";

export default function BookingsPage() {
    const [bookings, setBookings] = useState<HotelBookingDto[]>([]);
    const [roomTypes, setRoomTypes] = useState<HotelRoomTypeDto[]>([]);
    const [rooms, setRooms] = useState<HotelRoomItemDto[]>([]);
    const [mealPlans, setMealPlans] = useState<HotelMealPlanDto[]>([]);
    const [customers, setCustomers] = useState<HotelGuestDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [view, setView] = useState<"calendar" | "list">("calendar");
    const [modal, setModal] = useState<HotelBookingDto | null>(null);
    const [delId, setDelId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortField, setSortField] = useState<keyof HotelBookingDto>("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const [startDateStr, setStartDateStr] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        return d.toISOString().slice(0, 10);
    });
    const daysToShow = 30;
    const colW = 50;
    const todStr = new Date().toISOString().slice(0, 10);

    const scrollRef = useRef<HTMLDivElement>(null);
    const headerSyncRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [bRes, rtRes, rRes, mpRes, cRes] = await Promise.all([
                fetch("/api/travel/hotel/bookings"),
                fetch("/api/travel/hotel/room-types"),
                fetch("/api/travel/hotel/rooms"),
                fetch("/api/travel/hotel/meal-plans"),
                fetch("/api/travel/hotel/customers")
            ]);
            
            const [bData, rtData, rData, mpData, cData] = await Promise.all([
                bRes.json(), rtRes.json(), rRes.json(), mpRes.json(), cRes.json()
            ]);

            setBookings(bData.data || []);
            setRoomTypes(rtData.data || []);
            setRooms(rData.data || []);
            setMealPlans(mpData.data || []);
            setCustomers(cData.data || []);
        } catch (error) {
            console.error("Failed to fetch hotel data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const onScrollSync = () => {
        if (headerSyncRef.current && scrollRef.current) {
            headerSyncRef.current.scrollLeft = scrollRef.current.scrollLeft;
        }
    };

    const handleAdd = async (b: HotelBookingDto) => {
        const res = await fetch("/api/travel/hotel/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(b)
        });
        if (res.ok) fetchData();
    };

    const handleUpdate = async (b: HotelBookingDto) => {
        const res = await fetch("/api/travel/hotel/bookings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(b)
        });
        if (res.ok) fetchData();
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/travel/hotel/bookings?id=${id}`, {
            method: "DELETE"
        });
        if (res.ok) fetchData();
    };

    const timelineDates = useMemo(() => {
        const arr = [];
        const d = new Date(startDateStr);
        for (let i = 0; i < daysToShow; i++) {
            arr.push({ 
                date: d.toISOString().slice(0, 10), 
                dayStr: d.toLocaleDateString("en-US", { weekday: "short" }), 
                tDay: d.getDate() 
            });
            d.setDate(d.getDate() + 1);
        }
        return arr;
    }, [startDateStr]);

    const roomsByType = useMemo(() => {
        const map = new Map<string, HotelRoomItemDto[]>();
        roomTypes.forEach(rt => map.set(rt.id, []));
        rooms.forEach(r => {
            if (!map.has(r.roomTypeId)) map.set(r.roomTypeId, []);
            map.get(r.roomTypeId)!.push(r);
        });
        for (const arr of map.values()) {
            arr.sort((a, b) => a.floor - b.floor || a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
        }
        return map;
    }, [roomTypes, rooms]);

    const unassignedBookings = useMemo(() => 
        bookings.filter(b => !b.roomNumber && b.status !== "cancelled" && b.status !== "no-show"), 
    [bookings]);

    const filteredBookings = useMemo(() => bookings.filter(b => {
        const q = search.toLowerCase();
        const matchSearch = !q || b.guestName.toLowerCase().includes(q) || b.bookingRef.toLowerCase().includes(q) || (b.roomNumber ?? "").includes(q);
        return matchSearch && (filterStatus === "all" || b.status === filterStatus);
    }).sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        
        let cmp = String(valA).localeCompare(String(valB));
        return sortOrder === "asc" ? cmp : -cmp;
    }), [bookings, search, filterStatus, sortField, sortOrder]);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading bookings...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            {modal && <BookingModal 
                booking={modal} 
                roomTypes={roomTypes} 
                physicalRooms={rooms} 
                mealPlans={mealPlans} 
                customers={customers} 
                allBookings={bookings}
                onSave={b => { modal._id ? handleUpdate(b) : handleAdd(b); setModal(null); }}
                onClose={() => setModal(null)} 
            />}
            
            {delId && <Confirm msg="Delete this booking permanently?" onOk={() => { handleDelete(delId); setDelId(null); }} onCancel={() => setDelId(null)} />}

            <div className="page-header">
                <div>
                    <div className="page-title">Bookings</div>
                    <div className="page-sub">{bookings.length} total · {bookings.filter(b => b.status === "checked-in").length} in-house</div>
                </div>
                <Btn onClick={() => setModal(buildBlankBooking(roomTypes, mealPlans))}><Ic.Plus /> New Booking</Btn>
            </div>

            <div className="tab-bar" style={{ maxWidth: 240, marginBottom: 16 }}>
                <button className={`tab-btn ${view === "calendar" ? "active" : ""}`} onClick={() => setView("calendar")}>📅 Calendar</button>
                <button className={`tab-btn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>📋 List</button>
            </div>

            {view === "calendar" && (
                <div className="card">
                    <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <Btn variant="outline" size="sm" onClick={() => {
                                const d = new Date(startDateStr);
                                d.setDate(d.getDate() - 7);
                                setStartDateStr(d.toISOString().slice(0, 10));
                            }}>« 7d</Btn>
                            <input type="date" value={startDateStr} onChange={e => setStartDateStr(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
                            <Btn variant="outline" size="sm" onClick={() => {
                                const d = new Date(startDateStr);
                                d.setDate(d.getDate() + 7);
                                setStartDateStr(d.toISOString().slice(0, 10));
                            }}>7d »</Btn>
                            <Btn variant="outline" size="sm" onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() - 3);
                                setStartDateStr(d.toISOString().slice(0, 10));
                            }}>Today</Btn>
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", background: "#f3f4f6" }}>
                        <div style={{ width: 140, flexShrink: 0, height: 50, display: "flex", alignItems: "center", padding: "0 12px", background: "#f9fafb", fontWeight: 700, fontSize: 13, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}>Room</div>
                        <div ref={headerSyncRef} style={{ display: "flex", height: 50, background: "#f9fafb", overflow: "hidden", flexGrow: 1 }}>
                            {timelineDates.map(d => (
                                <div key={d.date} style={{ width: colW, flexShrink: 0, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: d.date === todStr ? "#eff6ff" : "transparent" }}>
                                    <div style={{ fontSize: 10, color: d.date === todStr ? "#2563eb" : "#9ca3af" }}>{d.dayStr}</div>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: d.date === todStr ? "#2563eb" : "#374151" }}>{d.tDay}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div ref={scrollRef} onScroll={onScrollSync} style={{ display: "flex", overflow: "auto", maxHeight: "60vh", background: "#fff" }}>
                        <div style={{ width: 140, flexShrink: 0, position: "sticky", left: 0, background: "#fff", zIndex: 10, borderRight: "1px solid #e5e7eb" }}>
                            {roomTypes.map(rt => {
                                const typeRooms = roomsByType.get(rt.id) ?? [];
                                if (typeRooms.length === 0) return null;
                                return (
                                    <React.Fragment key={rt.id}>
                                        <div style={{ background: "#f9fafb", padding: "6px 12px", fontSize: 10, fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", borderBottom: "1px solid #e5e7eb" }}>{rt.roomName}</div>
                                        {typeRooms.map(r => (
                                            <div key={r.id} style={{ height: 50, padding: "0 12px", display: "flex", alignItems: "center", borderBottom: "1px solid #e5e7eb", fontSize: 13, fontWeight: 600 }}>Rm {r.roomNumber}</div>
                                        ))}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                        <div style={{ position: "relative", flexGrow: 1 }}>
                            <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, display: "flex", pointerEvents: "none" }}>
                                {timelineDates.map(d => (
                                    <div key={d.date} style={{ width: colW, flexShrink: 0, borderRight: "1px dashed #f0f0f0" }} />
                                ))}
                            </div>
                            {roomTypes.map(rt => {
                                const typeRooms = roomsByType.get(rt.id) ?? [];
                                if (typeRooms.length === 0) return null;
                                return (
                                    <React.Fragment key={rt.id}>
                                        <div style={{ height: 23, borderBottom: "1px solid #e5e7eb" }} />
                                        {typeRooms.map(r => {
                                            const roomBks = bookings.filter(b => b.roomNumber === r.roomNumber && b.roomTypeId === r.roomTypeId && b.status !== "cancelled");
                                            return (
                                                <div key={r.id} style={{ height: 50, borderBottom: "1px solid #e5e7eb", position: "relative" }}>
                                                    {roomBks.map(b => {
                                                        const inTime = new Date(b.checkIn).getTime();
                                                        const outTime = new Date(b.checkOut).getTime();
                                                        const startTime = new Date(startDateStr).getTime();
                                                        const duration = (outTime - inTime) / 86400000;
                                                        const startOffset = (inTime - startTime) / 86400000;
                                                        
                                                        const left = startOffset * colW + colW/2;
                                                        const width = duration * colW;

                                                        if (left + width < 0 || left > daysToShow * colW) return null;

                                                        const color = b.status === 'checked-in' ? '#16a34a' : b.status === 'confirmed' ? '#2563eb' : '#d97706';
                                                        const bg = b.status === 'checked-in' ? '#dcfce7' : b.status === 'confirmed' ? '#eff6ff' : '#fef3c7';

                                                        return (
                                                            <div key={b.id} onClick={() => setModal(b)} style={{
                                                                position: "absolute", left, width, top: 6, height: 38, borderRadius: 6,
                                                                background: bg, border: `2px solid ${color}`, color,
                                                                display: "flex", alignItems: "center", padding: "0 8px", fontSize: 11, fontWeight: 700,
                                                                cursor: "pointer", zIndex: 5, overflow: "hidden"
                                                            }}>
                                                                {b.guestName}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {view === "list" && (
                <div className="card">
                    <div className="card-header" style={{ gap: 10, flexWrap: "wrap" }}>
                        <input className="inp" style={{ flex: 1, minWidth: 220 }} placeholder="Search name, ref..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div style={{ overflowX: "auto" }}>
                        <table className="data-table">
                            <thead>
                                <tr><th>Ref</th><th>Guest</th><th>Room</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr>
                            </thead>
                            <tbody>
                                {filteredBookings.map(b => (
                                    <tr key={b.id}>
                                        <td style={{ fontWeight: 600, color: "#2563eb" }}>{b.bookingRef}</td>
                                        <td>{b.guestName}</td>
                                        <td>{b.roomNumber ? `Rm ${b.roomNumber}` : "Unassigned"} ({b.roomTypeName})</td>
                                        <td style={{ fontSize: 12 }}>{fmtDate(b.checkIn)} - {fmtDate(b.checkOut)}</td>
                                        <td style={{ fontWeight: 600 }}>${b.grandTotal.toLocaleString()}</td>
                                        <td><Badge color={statusColor[b.status]}>{b.status}</Badge></td>
                                        <td>
                                            <div style={{ display: "flex", gap: 4 }}>
                                                <Btn size="sm" variant="ghost" onClick={() => setModal(b)}><Ic.Edit /></Btn>
                                                <Btn size="sm" variant="ghost" style={{ color: "#dc2626" }} onClick={() => setDelId(b.id)}><Ic.Trash /></Btn>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
