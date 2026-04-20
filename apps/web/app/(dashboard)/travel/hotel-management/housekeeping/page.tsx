"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelHousekeepingTaskDto, 
    HotelStaffMemberDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Badge, 
    Sel, 
    Ic 
} from "@/components/travel/hotel/HotelUI";

const HK_STATUSES = ["clean", "dirty", "inspected", "dnd", "out-of-order"] as const;
type HKStatus = (typeof HK_STATUSES)[number];

const STATUS_META: Record<HKStatus, { label: string; emoji: string; color: string }> = {
    clean: { label: "Clean", emoji: "✅", color: "#16a34a" },
    dirty: { label: "Dirty", emoji: "🧹", color: "#d97706" },
    inspected: { label: "Inspected", emoji: "🔵", color: "#2563eb" },
    dnd: { label: "Do Not Disturb", emoji: "🚫", color: "#7c3aed" },
    "out-of-order": { label: "Out of Order", emoji: "🔴", color: "#dc2626" },
};

export default function HousekeepingPage() {
    const [tasks, setTasks] = useState<HotelHousekeepingTaskDto[]>([]);
    const [staff, setStaff] = useState<HotelStaffMemberDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterRoom, setFilterRoom] = useState("");
    const [editing, setEditing] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [tRes, sRes] = await Promise.all([
                fetch("/api/travel/hotel/housekeeping"),
                fetch("/api/travel/hotel/staff")
            ]);
            const [tData, sData] = await Promise.all([tRes.json(), sRes.json()]);
            setTasks(tData || []);
            setStaff(sData || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async (t: HotelHousekeepingTaskDto) => {
        const res = await fetch("/api/travel/hotel/housekeeping", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(t)
        });
        if (res.ok) {
            setTasks(prev => prev.map(pt => pt.id === t.id ? t : pt));
        }
    };

    const counts = useMemo(() => {
        const c = HK_STATUSES.reduce((acc, s) => {
            acc[s] = tasks.filter(t => t.status === s).length;
            return acc;
        }, {} as Record<string, number>);
        return c;
    }, [tasks]);

    const filtered = tasks.filter(t => {
        const matchStatus = filterStatus === "all" || t.status === filterStatus;
        const matchRoom = !filterRoom || t.roomNumber.includes(filterRoom);
        return matchStatus && matchRoom;
    });

    const hhStaff = staff.filter(s => s.role === "Housekeeping" || s.role === "Management");

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading housekeeping...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <div className="page-header">
                <div>
                    <div className="page-title">Housekeeping</div>
                    <div className="page-sub">{tasks.length} rooms &middot; {counts.dirty ?? 0} need cleaning</div>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
                <button onClick={() => setFilterStatus("all")}
                    style={{ padding: "7px 14px", borderRadius: 8, border: `2px solid ${filterStatus === "all" ? "#2563eb" : "#e5e7eb"}`, background: filterStatus === "all" ? "#eff6ff" : "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", color: filterStatus === "all" ? "#2563eb" : "#374151" }}>
                    All ({tasks.length})
                </button>
                {HK_STATUSES.map(s => {
                    const meta = STATUS_META[s];
                    const active = filterStatus === s;
                    return (
                        <button key={s} onClick={() => setFilterStatus(active ? "all" : s)}
                            style={{ padding: "7px 14px", borderRadius: 8, border: `2px solid ${active ? meta.color : "#e5e7eb"}`, background: active ? "#f9fafb" : "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer", color: meta.color }}>
                            {meta.emoji} {meta.label} ({counts[s] ?? 0})
                        </button>
                    );
                })}
                <input className="inp" placeholder="Filter room..." value={filterRoom} onChange={e => setFilterRoom(e.target.value)} style={{ maxWidth: 130 }} />
            </div>

            <div className="hk-grid">
                {filtered.map(task => {
                    const meta = STATUS_META[task.status as HKStatus] || STATUS_META.clean;
                    const isEditing = editing === task.id;
                    return (
                        <div key={task.id} className={`hk-card ${task.status}`} onClick={() => setEditing(isEditing ? null : task.id)}>
                            <div className="hk-room-num" style={{ color: meta.color }}>{task.roomNumber}</div>
                            <div className="hk-status-label" style={{ color: meta.color }}>{meta.emoji} {meta.label}</div>
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>{task.assignedTo || "Unassigned"}</div>
                            {task.priority === "high" && <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700, marginTop: 2 }}>⚡ HIGH PRIORITY</div>}

                            {isEditing && (
                                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }} onClick={e => e.stopPropagation()}>
                                    <select className="sel" value={task.status} onChange={e => handleUpdate({ ...task, status: e.target.value as HKStatus })} style={{ fontSize: 12 }}>
                                        {HK_STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
                                    </select>
                                    <select className="sel" value={task.assignedTo || ""} onChange={e => handleUpdate({ ...task, assignedTo: e.target.value })} style={{ fontSize: 12 }}>
                                        <option value="">Assign Staff</option>
                                        {hhStaff.map(s => <option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.firstName} {s.lastName}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="card mt-20">
                <div className="card-header"><span className="card-title">👤 Staff Workload</span></div>
                <div className="card-body">
                    {hhStaff.map(s => {
                        const name = `${s.firstName} ${s.lastName}`;
                        const assigned = tasks.filter(t => t.assignedTo === name);
                        const dirty = assigned.filter(t => t.status === "dirty").length;
                        return (
                            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", flexShrink: 0 }}>{s.firstName[0]}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: 13 }}>{name}</div>
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>{assigned.length} rooms assigned &middot; {dirty} pending</div>
                                </div>
                                {dirty > 0 ? <Badge color="amber">{dirty} pending</Badge> : (assigned.length > 0 ? <Badge color="green">All clear</Badge> : null)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
