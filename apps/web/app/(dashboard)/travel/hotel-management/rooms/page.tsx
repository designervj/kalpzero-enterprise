"use client";
import React, { useState, useEffect, useCallback } from "react";
import { PageHeader, Btn, Confirm } from "@/components/travel/hotel/HotelUI";
import RoomsInventory from "@/components/travel/hotel/RoomsInventory";
import RoomModal from "@/components/travel/hotel/RoomModal";
import type { HotelRoomItemDto, HotelRoomTypeDto } from "@/lib/contracts/hotel";

export default function RoomsPage() {
    const [inventory, setInventory] = useState<HotelRoomItemDto[]>([]);
    const [roomTypes, setRoomTypes] = useState<HotelRoomTypeDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Partial<HotelRoomItemDto> | null | false>(false);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [invRes, typeRes] = await Promise.all([
                fetch("/api/travel/hotel/rooms"),
                fetch("/api/travel/hotel/room-types")
            ]);
            const [invData, typeData] = await Promise.all([invRes.json(), typeRes.json()]);
            setInventory(Array.isArray(invData) ? invData : []);
            setRoomTypes(Array.isArray(typeData) ? typeData : []);
        } catch (err) {
            console.error("Failed to fetch rooms data:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (room: HotelRoomItemDto) => {
        const isUpdate = inventory.some(r => r.id === room.id);
        const method = isUpdate ? "PUT" : "POST";
        try {
            const res = await fetch("/api/travel/hotel/rooms", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(room)
            });
            if (res.ok) {
                setModal(false);
                fetchData();
            }
        } catch (err) {
            console.error("Failed to save room:", err);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            const res = await fetch(`/api/travel/hotel/rooms?id=${confirmDelete}`, { method: "DELETE" });
            if (res.ok) {
                setConfirmDelete(null);
                fetchData();
            }
        } catch (err) {
            console.error("Failed to delete room:", err);
        }
    };

    if (loading && inventory.length === 0) {
        return <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading Rooms Inventory...</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Room Inventory"
                sub={`${inventory.length} rooms configured in the property`}
                actions={<Btn onClick={() => setModal({})}>+ Add Room</Btn>}
            />

            <RoomsInventory
                inventory={inventory}
                roomTypes={roomTypes}
                onAdd={() => setModal({})}
                onUpdate={(r) => setModal(r)}
                onDelete={(id) => setConfirmDelete(id)}
            />

            {modal !== false && (
                <RoomModal
                    room={modal}
                    roomTypes={roomTypes}
                    onSave={handleSave}
                    onClose={() => setModal(false)}
                />
            )}

            {confirmDelete && (
                <Confirm
                    title="Delete Room"
                    msg="Are you sure you want to remove this room from the inventory? This action cannot be undone."
                    onOk={handleDelete}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}
