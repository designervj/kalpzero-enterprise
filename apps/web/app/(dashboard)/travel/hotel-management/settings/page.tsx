"use client";
import React, { useState, useEffect, useCallback } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelInfoDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Ic, 
    Field,
    Inp,
    Card,
    PageHeader,
    Confirm
} from "@/components/travel/hotel/HotelUI";

export default function HotelSettingsPage() {
    const [info, setInfo] = useState<Partial<HotelInfoDto>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/travel/hotel/info");
            const data = await res.json();
            setInfo(data || {});
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/travel/hotel/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(info)
            });
            if (res.ok) {
                alert("Settings saved successfully!");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleRunSeed = async () => {
        setShowConfirm(false);
        try {
            const res = await fetch("/api/travel/hotel/seed", { method: "POST" });
            if (res.ok) {
                alert("Demo data generated successfully!");
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading settings...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <PageHeader title="Hotel Settings" sub="Configure your property profile and system data" />

            <div style={{ maxWidth: 800 }}>
                <Card title="Hotel Information" className="mb-20">
                    <div className="grid-2 mb-12">
                        <Field label="Property Name"><Inp value={info.name || ""} onChange={e => setInfo({ ...info, name: e.target.value })} /></Field>
                        <Field label="Contact Phone"><Inp value={info?.phone || ""} onChange={e => setInfo({ ...info, phone: e.target.value })} /></Field>
                    </div>
                    <div className="mb-12">
                        <Field label="Property Address"><Inp value={info.address || ""} onChange={e => setInfo({ ...info, address: e.target.value })} /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Primary Email"><Inp value={info.email || ""} onChange={e => setInfo({ ...info, email: e.target.value })} /></Field>
                        <Field label="Website"><Inp value={info.website || ""} onChange={e => setInfo({ ...info, website: e.target.value })} /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Currency Code"><Inp value={info.currencyCode || "USD"} onChange={e => setInfo({ ...info, currencyCode: e.target.value.toUpperCase() })} /></Field>
                        <Field label="Check-in Time"><Inp value={info.checkInTime || "14:00"} onChange={e => setInfo({ ...info, checkInTime: e.target.value })} /></Field>
                    </div>
                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 20 }}>
                        <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Btn>
                    </div>
                </Card>

                <Card title="Data Management">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>Sample Demo Data</div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>This will populate the system with sample rooms, bookings, and guests for testing.</div>
                        </div>
                        <Btn variant="outline" onClick={() => setShowConfirm(true)}>Generate Seed Data</Btn>
                    </div>
                </Card>
            </div>

            {showConfirm && (
                <Confirm 
                    title="Generate Demo Data?" 
                    msg="This will add sample records to your database. Existing data will not be deleted, but it may create duplicates if run multiple times." 
                    onOk={handleRunSeed} 
                    onCancel={() => setShowConfirm(false)} 
                />
            )}
        </div>
    );
}
