"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelBookingDto, 
    HotelRoomItemDto, 
    HotelMealPlanDto,
    HotelHousekeepingTaskDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Badge, 
    Ic, 
    Field,
    Card,
    PageHeader,
    fmtDate,
    fmt,
    Inp
} from "@/components/travel/hotel/HotelUI";

const TODAY = new Date().toISOString().slice(0, 10);
const barColors = ["#3b82f6", "#8b5cf6", "#16a34a", "#d97706", "#ef4444", "#14b8a6"];

export default function OperationalReportsPage() {
    const [bookings, setBookings] = useState<HotelBookingDto[]>([]);
    const [rooms, setRooms] = useState<HotelRoomItemDto[]>([]);
    const [mealPlans, setMealPlans] = useState<HotelMealPlanDto[]>([]);
    const [hkTasks, setHkTasks] = useState<HotelHousekeepingTaskDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [tab, setTab] = useState<"occupancy" | "arrivals" | "revenue" | "nightaudit">("occupancy");
    const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
    const [dateTo, setDateTo] = useState(TODAY);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [bRes, rRes, mRes, hRes] = await Promise.all([
                fetch("/api/travel/hotel/bookings"),
                fetch("/api/travel/hotel/rooms"),
                fetch("/api/travel/hotel/meal-plans"),
                fetch("/api/travel/hotel/housekeeping")
            ]);
            const [bData, rData, mData, hData] = await Promise.all([
                bRes.json(), rRes.json(), mRes.json(), hRes.json()
            ]);
            setBookings(bData.data || []);
            setRooms(rData.data || []);
            setMealPlans(mData.data || []);
            setHkTasks(hData.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const occupancyData = useMemo(() => {
        const stats: Record<string, { count: number; revenue: number }> = {};
        const filtered = bookings.filter(b => b.status !== "cancelled" && b.checkIn <= dateTo && b.checkOut >= dateFrom);
        
        filtered.forEach(b => {
            if (!stats[b.roomTypeId]) stats[b.roomTypeId] = { count: 0, revenue: 0 };
            stats[b.roomTypeId].count++;
            stats[b.roomTypeId].revenue += b.totalRoomCost || 0;
        });

        return Object.entries(stats).map(([rtId, s]) => {
            const roomType = rooms.find(r => r.roomTypeId === rtId);
            return {
                id: rtId,
                name: roomType?.roomTypeName || "Unknown",
                count: s.count,
                revenue: s.revenue
            };
        });
    }, [bookings, rooms, dateFrom, dateTo]);

    const revData = useMemo(() => {
        const filtered = bookings.filter(b => b.status !== "cancelled" && b.checkIn >= dateFrom && b.checkIn <= dateTo);
        const total = filtered.reduce((s, b) => s + (b.grandTotal || 0), 0);
        const roomTotal = filtered.reduce((s, b) => s + (b.totalRoomCost || 0), 0);
        const mealTotal = filtered.reduce((s, b) => s + (b.totalMealCost || 0), 0);
        return { total, roomTotal, mealTotal, count: filtered.length };
    }, [bookings, dateFrom, dateTo]);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Generating reports...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <PageHeader title="Operational Reports" sub="Analytics, Revenue & Night Audit" />

            <div className="tab-bar" style={{ width: "fit-content", marginBottom: 24 }}>
                <button className={`tab-btn ${tab === "occupancy" ? "active" : ""}`} onClick={() => setTab("occupancy")}>Occupancy</button>
                <button className={`tab-btn ${tab === "arrivals" ? "active" : ""}`} onClick={() => setTab("arrivals")}>Arrivals/Deps</button>
                <button className={`tab-btn ${tab === "revenue" ? "active" : ""}`} onClick={() => setTab("revenue")}>Revenue</button>
                <button className={`tab-btn ${tab === "nightaudit" ? "active" : ""}`} onClick={() => setTab("nightaudit")}>Night Audit</button>
            </div>

            {(tab === "occupancy" || tab === "revenue") && (
                <Card className="mb-20">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <Field label="From"><Inp type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></Field>
                        <Field label="To"><Inp type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} /></Field>
                        <div style={{ marginTop: 18 }}>
                            <Btn variant="secondary" onClick={fetchData}><Ic.Back /> Refresh</Btn>
                        </div>
                    </div>
                </Card>
            )}

            {tab === "occupancy" && (
                <div className="grid-3">
                    {occupancyData.map((d, i) => (
                        <Card key={d.id} title={d.name} subtitle={`${d.count} Bookings`}>
                            <div style={{ fontSize: 28, fontWeight: 800, color: barColors[i % 6] }}>
                                ${fmt(d.revenue)}
                            </div>
                            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Revenue Contribution</div>
                            <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
                                <div style={{ width: "100%", height: "100%", background: barColors[i % 6] }} />
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {tab === "revenue" && (
                <div>
                    <div className="grid-3 mb-20">
                        <Card title="Total Revenue" subtitle={`${revData.count} Bookings`}>
                            <div style={{ fontSize: 32, fontWeight: 800, color: "#16a34a" }}>${fmt(revData.total)}</div>
                        </Card>
                        <Card title="Room Revenue">
                            <div style={{ fontSize: 32, fontWeight: 800, color: "#2563eb" }}>${fmt(revData.roomTotal)}</div>
                        </Card>
                        <Card title="Meal Revenue">
                            <div style={{ fontSize: 32, fontWeight: 800, color: "#7c3aed" }}>${fmt(revData.mealTotal)}</div>
                        </Card>
                    </div>
                </div>
            )}

            {tab === "nightaudit" && (
                <div style={{ maxWidth: 800 }}>
                    <Card title="Night Audit Summary" subtitle={fmtDate(TODAY)}>
                        <div className="grid-2 mb-20">
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 12 }}>OPERATIONS</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Confirmed Arrivals</span>
                                        <Badge color="blue">{bookings.filter(b => b.checkIn === TODAY && b.status === "confirmed").length}</Badge>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Expected Departures</span>
                                        <Badge color="amber">{bookings.filter(b => b.checkOut === TODAY && b.status === "checked-in").length}</Badge>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>In-House Guests</span>
                                        <Badge color="green">{bookings.filter(b => b.status === "checked-in").length}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: "#9ca3af", marginBottom: 12 }}>HOUSEKEEPING</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Clean Rooms</span>
                                        <b style={{ color: "#16a34a" }}>{hkTasks.filter(t => t.status === "clean").length}</b>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Dirty Rooms</span>
                                        <b style={{ color: "#dc2626" }}>{hkTasks.filter(t => t.status === "dirty").length}</b>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span>Maintenance Open</span>
                                        <b style={{ color: "#d97706" }}>{hkTasks.filter(t => t.status === "out-of-order").length}</b>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20 }}>
                            <Btn variant="primary">✓ Run Night Audit Close</Btn>
                        </div>
                    </Card>
                </div>
            )}

            {tab === "arrivals" && (
                <div className="grid-2">
                    <Card title="Today's Arrivals">
                        <table className="data-table">
                            <tbody>
                                {bookings.filter(b => b.checkIn === TODAY).map(b => (
                                    <tr key={b.id}>
                                        <td>{b.guestName}</td>
                                        <td>{b.roomTypeName}</td>
                                        <td><Badge color={b.status === "confirmed" ? "blue" : "green"}>{b.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                    <Card title="Today's Departures">
                        <table className="data-table">
                            <tbody>
                                {bookings.filter(b => b.checkOut === TODAY).map(b => (
                                    <tr key={b.id}>
                                        <td>{b.guestName}</td>
                                        <td>Rm {b.roomNumber || "—"}</td>
                                        <td><Badge color={b.status === "checked-out" ? "gray" : "amber"}>{b.status}</Badge></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </div>
            )}
        </div>
    );
}
