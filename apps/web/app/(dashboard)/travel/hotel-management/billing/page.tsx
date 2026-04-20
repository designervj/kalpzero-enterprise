"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelMealPlanDto, 
    HotelBookingDto,
    HotelPricingRuleDto 
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
    Modal,
    Toggle
} from "@/components/travel/hotel/HotelUI";

const PLAN_COLORS: Record<string, { bg: string; color: string; border: string }> = {
    EP: { bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
    CP: { bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
    MAP: { bg: "#faf5ff", color: "#6b21a8", border: "#c4b5fd" },
    AP: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
};

const PLAN_EMOJI: Record<string, string> = { EP: "🌙", CP: "☀️", MAP: "🌅", AP: "🍽️" };
const INCLUDED_OPTIONS = ["Breakfast", "Lunch", "Dinner", "Afternoon Tea", "Mini Bar", "Welcome Drink", "Room Service", "Snacks", "All Non-Alcoholic", "All Alcoholic"];

const BLANK_PLAN: Partial<HotelMealPlanDto> = {
    code: "", name: "", description: "", pricePerPersonPerNight: 0, active: true, includedMeals: []
};

export default function BillingPricingPage() {
    const [mealPlans, setMealPlans] = useState<HotelMealPlanDto[]>([]);
    const [bookings, setBookings] = useState<HotelBookingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Partial<HotelMealPlanDto> | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [mRes, bRes] = await Promise.all([
                fetch("/api/travel/hotel/meal-plans"),
                fetch("/api/travel/hotel/bookings")
            ]);
            const [mData, bData] = await Promise.all([mRes.json(), bRes.json()]);
            setMealPlans(mData.data || []);
            setBookings(bData.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSavePlan = async (mp: HotelMealPlanDto) => {
        const isNew = !mealPlans.find(p => p.id === mp.id);
        const res = await fetch("/api/travel/hotel/meal-plans", {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(mp)
        });
        if (res.ok) {
            fetchData();
            setModal(null);
        }
    };

    const handleDeletePlan = async (id: string) => {
        if (!confirm("Are you sure you want to delete this meal plan?")) return;
        const res = await fetch(`/api/travel/hotel/meal-plans?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
    };

    const mealPlanStats = useMemo(() => {
        const stats: Record<string, { bookings: number; guests: number }> = {};
        mealPlans.forEach(mp => { stats[mp.id] = { bookings: 0, guests: 0 }; });
        bookings.filter(b => b.status !== "cancelled").forEach(b => {
            if (stats[b.mealPlanId]) {
                stats[b.mealPlanId].bookings++;
                stats[b.mealPlanId].guests += (b.adults || 0) + (b.children || 0);
            }
        });
        return stats;
    }, [mealPlans, bookings]);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading billing & pricing...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <PageHeader 
                title="Billing & Pricing" 
                sub="Manage meal plans and revenue configurations"
                actions={<Btn onClick={() => setModal({ ...BLANK_PLAN, id: Math.random().toString(36).slice(2, 9) })}><Ic.Plus /> Add Meal Plan</Btn>}
            />

            <div className="grid-2 mt-20" style={{ gap: 16 }}>
                {mealPlans.map(mp => {
                    const c = PLAN_COLORS[mp.code] || { bg: "#f9fafb", color: "#374151", border: "#e5e7eb" };
                    const emoji = PLAN_EMOJI[mp.code] || "🍴";
                    const stats = mealPlanStats[mp.id] || { bookings: 0, guests: 0 };
                    return (
                        <Card key={mp.id} title={`${emoji} ${mp.name}`} subtitle={mp.code} 
                            headerAction={
                                <div style={{ display: "flex", gap: 4 }}>
                                    <Btn size="sm" variant="ghost" onClick={() => setModal(mp)}><Ic.Edit /></Btn>
                                    <Btn size="sm" variant="ghost" style={{ color: "#dc2626" }} onClick={() => handleDeletePlan(mp.id)}><Ic.Trash /></Btn>
                                </div>
                            }>
                            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>{mp.description}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                                {mp.includedMeals?.map(m => (
                                    <Badge key={m} color="indigo">{m}</Badge>
                                ))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                                <div>
                                    <div style={{ fontSize: 18, fontWeight: 800 }}>${mp.pricePerPersonPerNight}</div>
                                    <div style={{ fontSize: 11, color: "#9ca3af" }}>per person/night</div>
                                </div>
                                <div style={{ textAlign: "right", fontSize: 12, color: "#6b7280" }}>
                                    <div><b>{stats.bookings}</b> bookings</div>
                                    <div><b>{stats.guests}</b> guests</div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {modal && (
                <Modal title={modal.id ? "Edit Meal Plan" : "New Meal Plan"} onClose={() => setModal(null)}
                    footer={<><Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={() => handleSavePlan(modal as HotelMealPlanDto)}>Save Plan</Btn></>}>
                    <div className="grid-2 mb-12">
                        <Field label="Code"><Inp value={modal.code || ""} onChange={e => setModal({ ...modal, code: e.target.value.toUpperCase() })} placeholder="e.g. EP" /></Field>
                        <Field label="Name"><Inp value={modal.name || ""} onChange={e => setModal({ ...modal, name: e.target.value })} placeholder="e.g. European Plan" /></Field>
                    </div>
                    <Field label="Description" style={{ marginBottom: 12 }}>
                        <textarea className="textarea" value={modal.description || ""} onChange={e => setModal({ ...modal, description: e.target.value })} placeholder="What's included in this plan?" />
                    </Field>
                    <div className="grid-2 mb-12">
                        <Field label="Price ($)"><Inp type="number" value={String(modal.pricePerPersonPerNight || 0)} onChange={e => setModal({ ...modal, pricePerPersonPerNight: Number(e.target.value) })} /></Field>
                        <Field label="Status">
                            <Toggle checked={modal.active !== false} onChange={v => setModal({ ...modal, active: v })} label={modal.active !== false ? "Active" : "Inactive"} />
                        </Field>
                    </div>
                    <Field label="Included Meals">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                            {INCLUDED_OPTIONS.map(meal => {
                                const on = modal.includedMeals?.includes(meal);
                                return (
                                    <button key={meal} 
                                        onClick={() => {
                                            const current = modal.includedMeals || [];
                                            const next = on ? current.filter(m => m !== meal) : [...current, meal];
                                            setModal({ ...modal, includedMeals: next });
                                        }}
                                        style={{ padding: "4px 12px", borderRadius: 20, border: "1px solid", borderColor: on ? "#2563eb" : "#d1d5db", background: on ? "#eff6ff" : "#fff", color: on ? "#2563eb" : "#6b7280", fontSize: 12, cursor: "pointer", fontWeight: on ? 700 : 500 }}>
                                        {meal}
                                    </button>
                                );
                            })}
                        </div>
                    </Field>
                </Modal>
            )}
        </div>
    );
}
