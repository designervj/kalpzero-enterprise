"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelGuestDto, 
    HotelBookingDto, 
    HotelMealPlanDto 
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Badge, 
    Field, 
    Inp, 
    Sel, 
    Ic, 
    fmtDate, 
    DIETARY_PREFS, 
    LOYALTY_TIERS 
} from "@/components/travel/hotel/HotelUI";

const BLANK_CUSTOMER: Partial<HotelGuestDto> = {
    firstName: "", lastName: "", email: "", phone: "", nationality: "",
    passportNo: "", dob: "", loyaltyTier: "Bronze", vip: false,
    preferredRoom: "", dietaryPref: "Non-Veg", address: "", company: "", notes: "",
};

function CustomerModal({ cust: init, onSave, onClose }: { cust: Partial<HotelGuestDto>; onSave: (c: HotelGuestDto) => void; onClose: () => void; }) {
    const [c, setC] = useState<Partial<HotelGuestDto>>({ ...init });
    const s = (f: keyof HotelGuestDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
        setC(p => ({ ...p, [f]: e.target.value }));

    return (
        <div className="modal-overlay hotel-pms" onClick={onClose}>
            <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{init._id ? "Edit Guest" : "New Guest"}</span>
                    <button className="modal-close" onClick={onClose}><Ic.X /></button>
                </div>
                <div className="modal-body">
                    <div className="grid-3 mb-12">
                        <Field label="First Name *"><Inp value={c.firstName || ""} onChange={s("firstName")} /></Field>
                        <Field label="Last Name *"><Inp value={c.lastName || ""} onChange={s("lastName")} /></Field>
                        <Field label="Email"><Inp value={c.email || ""} onChange={s("email")} type="email" /></Field>
                    </div>
                    <div className="grid-3 mb-12">
                        <Field label="Phone"><Inp value={c.phone || ""} onChange={s("phone")} /></Field>
                        <Field label="Nationality"><Inp value={c.nationality || ""} onChange={s("nationality")} /></Field>
                        <Field label="Date of Birth"><Inp value={c.dob || ""} onChange={s("dob")} type="date" /></Field>
                    </div>
                    <div className="grid-3 mb-12">
                        <Field label="Passport / ID No"><Inp value={c.passportNo || ""} onChange={s("passportNo")} /></Field>
                        <Field label="Company / Corp Account"><Inp value={c.company || ""} onChange={s("company")} /></Field>
                        <Field label="Address"><Inp value={c.address || ""} onChange={s("address")} /></Field>
                    </div>
                    <div className="grid-3 mb-12">
                        <Field label="Loyalty Tier">
                            <Sel value={c.loyaltyTier || "Bronze"} onChange={e => setC(p => ({ ...p, loyaltyTier: e.target.value as HotelGuestDto["loyaltyTier"] }))} opts={[...LOYALTY_TIERS]} />
                        </Field>
                        <Field label="Dietary Preference">
                            <Sel value={c.dietaryPref || "Non-Veg"} onChange={s("dietaryPref")} opts={DIETARY_PREFS} />
                        </Field>
                        <Field label="Preferred Room Type"><Inp value={c.preferredRoom || ""} onChange={s("preferredRoom")} placeholder="e.g. Royal Suite" /></Field>
                    </div>
                    <Field label="Notes / Preferences" style={{ marginBottom: 12 }}>
                        <textarea className="textarea" value={c.notes || ""} onChange={e => setC(p => ({ ...p, notes: e.target.value }))} placeholder="Special notes..." />
                    </Field>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <input type="checkbox" id="vip-chk" checked={c.vip || false} onChange={e => setC(p => ({ ...p, vip: e.target.checked }))} />
                        <label htmlFor="vip-chk" style={{ fontWeight: 600, fontSize: 13.5, color: "#7c3aed" }}>👑 Mark as VIP Guest</label>
                    </div>
                </div>
                <div className="modal-footer">
                    <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                    <Btn onClick={() => onSave(c as HotelGuestDto)} disabled={!c.firstName?.trim() || !c.lastName?.trim()}>Save Guest</Btn>
                </div>
            </div>
        </div>
    );
}

const TIER_BG: Record<string, { bg: string; text: string; border: string }> = {
    Bronze: { bg: "#fdf4e7", text: "#92400e", border: "#fde68a" },
    Silver: { bg: "#f3f4f6", text: "#4b5563", border: "#d1d5db" },
    Gold: { bg: "#fefce8", text: "#854d0e", border: "#fde047" },
    Platinum: { bg: "#f0fdf4", text: "#065f46", border: "#6ee7b7" },
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState<HotelGuestDto[]>([]);
    const [bookings, setBookings] = useState<HotelBookingDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tierFilter, setTierFilter] = useState("all");
    const [modal, setModal] = useState<Partial<HotelGuestDto> | null>(null);
    const [selected, setSelected] = useState<HotelGuestDto | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [cRes, bRes] = await Promise.all([
                fetch("/api/travel/hotel/customers"),
                fetch("/api/travel/hotel/bookings")
            ]);
            const [cData, bData] = await Promise.all([cRes.json(), bRes.json()]);
            setCustomers(cData.data || []);
            setBookings(bData.data || []);
        } catch (error) {
            console.error("Failed to fetch customer data", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAdd = async (c: HotelGuestDto) => {
        const res = await fetch("/api/travel/hotel/customers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c)
        });
        if (res.ok) fetchData();
    };

    const handleUpdate = async (c: HotelGuestDto) => {
        const res = await fetch("/api/travel/hotel/customers", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(c)
        });
        if (res.ok) fetchData();
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        return customers.filter(c => {
            const match = !q || `${c.firstName} ${c.lastName} ${c.email} ${c.phone} ${c.nationality} ${c.passportNo}`.toLowerCase().includes(q);
            const tier = tierFilter === "all" || c.loyaltyTier === tierFilter;
            return match && tier;
        });
    }, [customers, search, tierFilter]);

    const guestBookings = useMemo(() => {
        if (!selected) return [];
        return bookings.filter(b => b.customerId === selected.id).sort((a, b) => b.checkIn.localeCompare(a.checkIn));
    }, [selected, bookings]);

    const guestStats = useMemo(() => {
        const total = guestBookings.length;
        const spend = guestBookings.reduce((s, b) => s + b.grandTotal, 0);
        const nights = guestBookings.reduce((s, b) => s + b.nights, 0);
        const last = guestBookings[0]?.checkIn ?? null;
        return { total, spend, nights, last };
    }, [guestBookings]);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading guests...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            {modal && <CustomerModal cust={modal} onSave={c => { modal._id ? handleUpdate(c) : handleAdd(c); setModal(null); }} onClose={() => setModal(null)} />}
            
            <div className="page-header">
                <div>
                    <div className="page-title">Guests &amp; Customers</div>
                    <div className="page-sub">{customers.length} registered guests</div>
                </div>
                <Btn onClick={() => setModal({ ...BLANK_CUSTOMER })}><Ic.Plus /> Add Guest</Btn>
            </div>

            <div style={{ display: "flex", gap: 20, alignItems: "start" }}>
                <div className="card" style={{ flex: 1, minWidth: 0 }}>
                    <div className="card-header" style={{ gap: 10, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                            <Inp value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, passport, phone..." />
                        </div>
                        <select className="sel" style={{ width: 140 }} value={tierFilter} onChange={e => setTierFilter(e.target.value)}>
                            <option value="all">All Tiers</option>
                            {LOYALTY_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr><th>Guest</th><th>Contact</th><th>Nationality</th><th>Loyalty</th><th>Diet</th><th>Bookings</th><th></th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(c => {
                                const bCount = bookings.filter(b => b.customerId === c.id).length;
                                const tierStyle = TIER_BG[c.loyaltyTier];
                                return (
                                    <tr key={c.id} className="clickable" onClick={() => setSelected(s => s?.id === c.id ? null : c)}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>
                                                {c.vip && <span style={{ fontSize: 12, color: "#7c3aed", marginRight: 4 }}>👑</span>}
                                                {c.firstName} {c.lastName}
                                            </div>
                                            <div style={{ fontSize: 11.5, color: "#9ca3af" }}>{c.passportNo} &middot; DOB: {c.dob || "—"}</div>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: 13 }}>{c.phone}</div>
                                            <div style={{ fontSize: 11.5, color: "#6b7280" }}>{c.email}</div>
                                        </td>
                                        <td style={{ fontSize: 13 }}>{c.nationality}</td>
                                        <td>
                                            <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 8px", borderRadius: 12, background: tierStyle.bg, color: tierStyle.text, border: `1px solid ${tierStyle.border}` }}>
                                                {c.loyaltyTier}
                                            </span>
                                        </td>
                                        <td style={{ fontSize: 12 }}>{c.dietaryPref}</td>
                                        <td style={{ fontWeight: 600 }}>{bCount}</td>
                                        <td onClick={e => e.stopPropagation()}>
                                            <Btn size="sm" variant="ghost" onClick={() => setModal(c)}><Ic.Edit /></Btn>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {selected && (
                    <div style={{ width: 340, flexShrink: 0 }}>
                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Guest Profile</span>
                                <button className="modal-close" onClick={() => setSelected(null)}><Ic.X /></button>
                            </div>
                            <div className="card-body">
                                <div style={{ textAlign: "center", marginBottom: 16 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700, color: "#2563eb", margin: "0 auto 10px" }}>
                                        {selected.firstName[0]}{selected.lastName[0]}
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                                        {selected.vip && "👑 "}{selected.firstName} {selected.lastName}
                                    </div>
                                    <div style={{ marginTop: 6 }}>
                                        <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 12, background: TIER_BG[selected.loyaltyTier].bg, color: TIER_BG[selected.loyaltyTier].text, border: `1px solid ${TIER_BG[selected.loyaltyTier].border}` }}>
                                            ✦ {selected.loyaltyTier} Member
                                        </span>
                                    </div>
                                </div>

                                <div style={{ fontSize: 12.5, lineHeight: 2.2, color: "#374151", marginBottom: 16 }}>
                                    <div>📞 {selected.phone}</div>
                                    <div>✉️ {selected.email}</div>
                                    <div>🌍 {selected.nationality}</div>
                                    <div>🪪 {selected.passportNo}</div>
                                    <div>🎂 {selected.dob || "—"}</div>
                                    <div>🍽️ {selected.dietaryPref}</div>
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                                    {[
                                        { label: "Total Stays", value: guestStats.total },
                                        { label: "Total Spend", value: `$${guestStats.spend.toLocaleString()}` },
                                    ].map(s => (
                                        <div key={s.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 12px" }}>
                                            <div style={{ fontSize: 10.5, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{s.value}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Booking History</div>
                                <div style={{ maxHeight: 240, overflowY: "auto" }}>
                                    {guestBookings.map(b => (
                                        <div key={b.id} style={{ padding: "9px 0", borderBottom: "1px solid #f5f5f5", fontSize: 12.5 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                                <span style={{ fontWeight: 600, color: "#2563eb" }}>{b.bookingRef}</span>
                                                <Badge color={b.status === "checked-out" ? "green" : "blue"}>{b.status}</Badge>
                                            </div>
                                            <div style={{ color: "#6b7280", marginTop: 2 }}>{fmtDate(b.checkIn)} &middot; {b.nights}N</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
