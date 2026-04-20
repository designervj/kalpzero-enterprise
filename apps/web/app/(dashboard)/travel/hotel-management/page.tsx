"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelBookingDto, 
    HotelRoomItemDto, 
    HotelRoomTypeDto, 
    HotelInfoDto,
    HotelHousekeepingTaskDto,
    HotelMaintenanceItemDto
} from "@/lib/contracts/hotel";
import { 
    Ic, 
    Badge, 
    statusColor, 
    fmtDate 
} from "@/components/travel/hotel/HotelUI";
import Link from "next/link";

export default function HotelDashboard() {
    const [info, setInfo] = useState<HotelInfoDto | null>(null);
    const [bookings, setBookings] = useState<HotelBookingDto[]>([]);
    const [rooms, setRooms] = useState<HotelRoomItemDto[]>([]);
    const [hkTasks, setHkTasks] = useState<HotelHousekeepingTaskDto[]>([]);
    const [maintenance, setMaintenance] = useState<HotelMaintenanceItemDto[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [iRes, bRes, rRes, hRes, mRes] = await Promise.all([
                fetch("/api/travel/hotel/info"),
                fetch("/api/travel/hotel/bookings"),
                fetch("/api/travel/hotel/rooms"),
                fetch("/api/travel/hotel/housekeeping"),
                fetch("/api/travel/hotel/maintenance")
            ]);
            
            const [iData, bData, rData, hData, mData] = await Promise.all([
                iRes.json(), bRes.json(), rRes.json(), hRes.json(), mRes.json()
            ]);

            setInfo(iData.data);
            setBookings(bData.data || []);
            setRooms(rData.data || []);
            setHkTasks(hData || []);
            setMaintenance(mData || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const today = new Date().toISOString().slice(0, 10);

    const stats = useMemo(() => {
        const inHouse = bookings.filter(b => b.status === "checked-in");
        const arrivals = bookings.filter(b => b.checkIn === today && b.status === "confirmed");
        const departures = bookings.filter(b => b.checkOut === today && b.status === "checked-in");
        
        const totalRooms = rooms.length;
        const occupiedCount = inHouse.length;
        const occupancy = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;
        
        const revenue = bookings
            .filter(b => b.checkIn.startsWith(today.slice(0, 7)) && b.status !== 'cancelled')
            .reduce((sum, b) => sum + (b.grandTotal || 0), 0);
            
        const dirtyRooms = hkTasks.filter(t => t.status === "dirty").length;
        const openMaint = maintenance.filter(m => m.status === "open" || m.status === "in-progress").length;

        return { occupancy, inHouse, arrivals, departures, revenue, dirtyRooms, openMaint, totalRooms };
    }, [bookings, rooms, hkTasks, maintenance, today]);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading dashboard...</div>;

    const kpis = [
        { label: "Occupancy", value: `${stats.occupancy}%`, icon: "🏨", sub: `${stats.totalRooms - stats.inHouse.length} rooms left` },
        { label: "Arrivals Today", value: stats.arrivals.length, icon: "🛫", sub: "Check-ins pending" },
        { label: "Departures", value: stats.departures.length, icon: "🧳", sub: "Check-outs today" },
        { label: "Revenue", value: `$${stats.revenue.toLocaleString()}`, icon: "💰", sub: "This month" },
    ];

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">Hotel Overview</div>
                    <div className="page-sub">
                        {info?.name || "Aventara Hotel"} &middot; {info?.city || "Remote"} &middot; {fmtDate(today)}
                    </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <Link href="/travel/hotel-management/bookings">
                        <button className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 10, background: "#2563eb", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}>
                            <Ic.Plus /> New Booking
                        </button>
                    </Link>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid-4 mb-20" style={{ gap: 16 }}>
                {kpis.map(k => (
                    <div key={k.label} className="card" style={{ padding: "20px 24px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.03)", background: "#fff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>{k.label}</span>
                            <span style={{ fontSize: 20 }}>{k.icon}</span>
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, margin: "8px 0", color: "#111827" }}>{k.value}</div>
                        <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 500 }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid-2" style={{ gap: 20, alignItems: "start" }}>
                {/* Daily Operations */}
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div className="card">
                        <div className="card-header" style={{ display: "flex", justifyContent: "space-between" }}>
                            <span className="card-title">🚀 Today's Arrivals</span>
                            <Link href="/travel/hotel-management/bookings" style={{ fontSize: 12, color: "#2563eb" }}>View all</Link>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {stats.arrivals.length === 0 ? (
                                <div style={{ padding: 24, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>No arrivals today</div>
                            ) : stats.arrivals.map(b => (
                                <div key={b.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{b.guestName}</div>
                                        <div style={{ fontSize: 12, color: "#6b7280" }}>{b.roomTypeName} &middot; {b.nights} nights</div>
                                    </div>
                                    <Badge color="blue">Confirmed</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header"><span className="card-title">⚠️ Operational Alerts</span></div>
                        <div className="card-body">
                            {stats.dirtyRooms > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, marginBottom: 12 }}>
                                    <span style={{ fontSize: 20 }}>🧹</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>{stats.dirtyRooms} Rooms Dirty</div>
                                        <div style={{ fontSize: 11, color: "#b45309" }}>Cleaners need to be assigned</div>
                                    </div>
                                    <Link href="/travel/hotel-management/housekeeping">
                                        <button className="btn btn-sm" style={{ background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" }}>View</button>
                                    </Link>
                                </div>
                            )}
                            {stats.openMaint > 0 && (
                                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
                                    <span style={{ fontSize: 20 }}>🔧</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{stats.openMaint} Maintenance Issues</div>
                                        <div style={{ fontSize: 11, color: "#dc2626" }}>Unresolved technical tasks</div>
                                    </div>
                                    <Link href="/travel/hotel-management/maintenance">
                                        <button className="btn btn-sm" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" }}>View</button>
                                    </Link>
                                </div>
                            )}
                            {stats.dirtyRooms === 0 && stats.openMaint === 0 && (
                                <div style={{ textAlign: "center", padding: 12, color: "#16a34a", fontSize: 13, fontWeight: 500 }}>
                                    ✨ Everything is on track!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Mini List */}
                <div className="card" style={{ minHeight: 400 }}>
                    <div className="card-header"><span className="card-title">📋 Recent Activity</span></div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {[...bookings].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 8).map(b => (
                            <div key={b.id} style={{ padding: "14px 16px", borderBottom: "1px solid #f3f4f6" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{b.guestName}</span>
                                    <span style={{ fontWeight: 800, fontSize: 13 }}>${b.grandTotal.toLocaleString()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: 11.5, color: "#6b7280" }}>{b.roomTypeName} &middot; {b.bookingRef}</span>
                                    <Badge color={statusColor[b.status]}>{b.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
