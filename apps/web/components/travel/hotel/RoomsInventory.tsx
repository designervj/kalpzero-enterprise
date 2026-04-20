"use client";
import React, { useState, useMemo } from "react";
import { Btn, Badge, Inp, Field, Sel, statusColor } from "./HotelUI";
import type { HotelRoomItemDto, HotelRoomTypeDto, HotelRoomStatus } from "@/lib/contracts/hotel";

const STATUS_CONFIG: Record<HotelRoomStatus, { label: string; color: string; bg: string; dot: string }> = {
    available: { label: "Available", color: "#166534", bg: "#dcfce7", dot: "#16a34a" },
    occupied: { label: "Occupied", color: "#1e40af", bg: "#dbeafe", dot: "#2563eb" },
    cleaning: { label: "Cleaning", color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
    maintenance: { label: "Maintenance", color: "#7c3aed", bg: "#ede9fe", dot: "#7c3aed" },
    "out-of-order": { label: "Out of Order", color: "#991b1b", bg: "#fee2e2", dot: "#dc2626" },
    blocked: { label: "Blocked", color: "#374151", bg: "#f3f4f6", dot: "#9ca3af" },
};

const STATUS_VALUES = Object.keys(STATUS_CONFIG) as HotelRoomStatus[];

function RoomCard({ room, onEdit, onDelete }: { room: HotelRoomItemDto; onEdit: (r: HotelRoomItemDto) => void; onDelete: (id: string) => void }) {
    const sc = STATUS_CONFIG[room.status];
    return (
        <div
            className="room-card-mini"
            style={{
                background: "#fff",
                border: `2px solid ${sc.dot}30`,
                borderRadius: 10,
                padding: "10px 12px",
                position: "relative",
                cursor: "pointer",
                minWidth: 0,
            }}
            onClick={() => onEdit(room)}
        >
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", letterSpacing: -0.5 }}>{room.roomNumber}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: sc.bg, borderRadius: 20, padding: "2px 8px", marginTop: 4, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{sc.label}</span>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{room.roomTypeName}</div>
            {room.features.length > 0 && (
                <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {room.features.join(" · ")}
                </div>
            )}
            <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                <button
                    onClick={() => onDelete(room.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 3, borderRadius: 4, color: "#dc2626", opacity: 0.5 }}
                >✕</button>
            </div>
        </div>
    );
}

export default function RoomsInventory({ inventory, roomTypes, onAdd, onUpdate, onDelete }: {
    inventory: HotelRoomItemDto[];
    roomTypes: HotelRoomTypeDto[];
    onAdd: () => void;
    onUpdate: (r: HotelRoomItemDto) => void;
    onDelete: (id: string) => void;
}) {
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterFloor, setFilterFloor] = useState("all");
    const [search, setSearch] = useState("");

    const floors = useMemo(() => [...new Set(inventory.map(r => r.floor))].sort((a, b) => a - b), [inventory]);
    const statusCounts = useMemo(() => STATUS_VALUES.reduce((acc, s) => ({ ...acc, [s]: inventory.filter(r => r.status === s).length }), {} as Record<string, number>), [inventory]);

    const filtered = useMemo(() => inventory.filter(r => {
        if (filterType !== "all" && r.roomTypeId !== filterType) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterFloor !== "all" && String(r.floor) !== filterFloor) return false;
        if (search && !r.roomNumber.includes(search) && !r.roomTypeName.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    }), [inventory, filterType, filterStatus, filterFloor, search]);

    const byFloor = useMemo(() => {
        const map = new Map<number, HotelRoomItemDto[]>();
        filtered.forEach(r => {
            if (!map.has(r.floor)) map.set(r.floor, []);
            map.get(r.floor)!.push(r);
        });
        return [...map.entries()].sort((a, b) => a[0] - b[0]);
    }, [filtered]);

    return (
        <div className="hotel-pms">
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
                {STATUS_VALUES.map(s => {
                    const sc = STATUS_CONFIG[s];
                    return (
                        <div key={s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
                            style={{ background: filterStatus === s ? sc.bg : "#f3f4f6", border: `1.5px solid ${filterStatus === s ? sc.dot : "#e5e7eb"}`, borderRadius: 10, padding: "8px 14px", cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: filterStatus === s ? sc.color : "#374151" }}>{sc.label}</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: filterStatus === s ? sc.color : "#111827" }}>{statusCounts[s] ?? 0}</span>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search room number..."
                    className="inp" style={{ width: 220 }} />
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="sel" style={{ width: 160 }}>
                    <option value="all">All Types</option>
                    {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.roomName}</option>)}
                </select>
                <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} className="sel" style={{ width: 140 }}>
                    <option value="all">All Floors</option>
                    {floors.map(f => <option key={f} value={String(f)}>Floor {f}</option>)}
                </select>
            </div>

            {byFloor.length === 0 && (
                <div style={{ padding: "60px 20px", textAlign: "center", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12 }}>
                    <div style={{ fontSize: 14, color: "#9ca3af" }}>No rooms found matching your criteria.</div>
                </div>
            )}

            {byFloor.map(([floor, roomsOnFloor]) => (
                <div key={floor} style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#374151" }}>Floor {floor}</div>
                        <div style={{ height: 1, flex: 1, background: "#e5e7eb" }} />
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{roomsOnFloor.length} rooms</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12 }}>
                        {roomsOnFloor.map(room => (
                            <RoomCard key={room.id} room={room} onEdit={onUpdate} onDelete={onDelete} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
