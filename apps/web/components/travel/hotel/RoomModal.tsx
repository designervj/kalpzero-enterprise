"use client";
import React, { useState } from "react";
import { Modal, Field, Inp, Btn, Sel } from "./HotelUI";
import type { HotelRoomItemDto, HotelRoomTypeDto } from "@/lib/contracts/hotel";

const ALL_FEATURES = ["Corner Room", "Connecting Door", "Accessible", "City View Premium", "Extra Quiet", "Garden View", "Ground Floor", "Butler Service", "Private Terrace", "Panoramic View", "Extra King Bed"];

export default function RoomModal({ room, roomTypes, onSave, onClose }: {
    room: Partial<HotelRoomItemDto> | null;
    roomTypes: HotelRoomTypeDto[];
    onSave: (r: HotelRoomItemDto) => void;
    onClose: () => void;
}) {
    const isNew = !room?.id;
    const [f, setF] = useState<Partial<HotelRoomItemDto>>(room ?? {
        roomNumber: "", roomTypeId: roomTypes[0]?.id ?? "", roomTypeName: roomTypes[0]?.roomName ?? "",
        floor: 1, status: "available", isActive: true, features: [], notes: "", lastCleaned: new Date().toISOString().slice(0, 10),
    });

    const set = (k: keyof HotelRoomItemDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setF(p => ({ ...p, [k]: e.target.value }));

    const toggleFeature = (feat: string) => setF(p => {
        const cur = p.features ?? [];
        return { ...p, features: cur.includes(feat) ? cur.filter(x => x !== feat) : [...cur, feat] };
    });

    const handleRoomType = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const rt = roomTypes.find(r => r.id === e.target.value);
        setF(p => ({ ...p, roomTypeId: e.target.value, roomTypeName: rt?.roomName ?? "" }));
    };

    const save = () => {
        if (!f.roomNumber?.trim()) return;
        const doc: HotelRoomItemDto = {
            id: f.id || `room_${f.roomNumber}`,
            roomNumber: f.roomNumber!.trim(),
            roomTypeId: f.roomTypeId || roomTypes[0]?.id || "",
            roomTypeName: f.roomTypeName || roomTypes.find(r => r.id === f.roomTypeId)?.roomName || "",
            floor: Number(f.floor) || 1,
            status: f.status || "available",
            isActive: f.isActive ?? true,
            features: f.features ?? [],
            notes: f.notes ?? "",
            lastCleaned: f.lastCleaned || new Date().toISOString().slice(0, 10),
            createdAt: f.createdAt || new Date().toISOString(),
        };
        onSave(doc);
    };

    return (
        <Modal title={isNew ? "Add Room" : `Edit Room ${f.roomNumber}`} onClose={onClose}
            footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={save}>{isNew ? "Add Room" : "Save Changes"}</Btn></>}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Room Number *">
                    <Inp value={f.roomNumber ?? ""} onChange={set("roomNumber")} placeholder="e.g. 101" disabled={!isNew} />
                </Field>
                <Field label="Floor">
                    <Inp type="number" value={String(f.floor ?? 1)} onChange={set("floor")} />
                </Field>
                <Field label="Room Type *">
                    <Sel value={f.roomTypeId ?? ""} onChange={handleRoomType}
                        opts={roomTypes.map(rt => ({ v: rt.id, l: rt.roomName }))} />
                </Field>
                <Field label="Status">
                    <Sel value={f.status ?? "available"} onChange={set("status")}
                        opts={["available", "occupied", "cleaning", "maintenance", "out-of-order", "blocked"]} />
                </Field>
            </div>
            <div style={{ marginTop: 14 }}>
                <Field label="Last Cleaned">
                    <Inp type="date" value={f.lastCleaned ?? ""} onChange={set("lastCleaned")} />
                </Field>
            </div>
            <div style={{ marginTop: 14, marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", marginBottom: 8 }}>Special Features</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {ALL_FEATURES.map(feat => {
                        const on = (f.features ?? []).includes(feat);
                        return (
                            <button key={feat} onClick={() => toggleFeature(feat)}
                                style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: on ? "1px solid #2563eb" : "1px solid #e5e7eb", background: on ? "#eff6ff" : "#f9fafb", color: on ? "#1d4ed8" : "#6b7280", transition: "all .12s" }}>
                                {on ? "✓ " : ""}{feat}
                            </button>
                        );
                    })}
                </div>
            </div>
            <Field label="Notes" style={{ marginTop: 14 }}>
                <textarea className="textarea" value={f.notes ?? ""} onChange={set("notes")} rows={2} placeholder="Notes..." />
            </Field>
        </Modal>
    );
}
