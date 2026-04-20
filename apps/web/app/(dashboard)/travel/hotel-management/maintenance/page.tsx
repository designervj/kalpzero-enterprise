"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import { 
    HotelMaintenanceItemDto, 
    HotelStaffMemberDto,
    HotelMaintenanceCommentDto
} from "@/lib/contracts/hotel";
import { 
    Btn, 
    Badge, 
    Ic, 
    Field,
    Inp,
    Sel
} from "@/components/travel/hotel/HotelUI";

const MAINT_STATUSES = ["open", "in-progress", "resolved", "deferred"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;
const REPORTERS = ["Front Desk", "Housekeeping", "Guest", "Manager", "Engineering"];
const CATEGORIES = ["Electrical", "Plumbing", "HVAC/AC", "Furniture", "Appliance", "IT/Telecom", "Structural", "Safety", "Pest Control", "Other"];

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; emoji: string }> = {
    "open": { color: "#dc2626", bg: "#fef2f2", border: "#fecaca", emoji: "🔴" },
    "in-progress": { color: "#d97706", bg: "#fffbeb", border: "#fde68a", emoji: "🟡" },
    "resolved": { color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0", emoji: "🟢" },
    "deferred": { color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", emoji: "⚪" },
};

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
    "high": { color: "#dc2626", bg: "#fee2e2" },
    "medium": { color: "#d97706", bg: "#fef3c7" },
    "low": { color: "#6b7280", bg: "#f3f4f6" },
};

function hoursAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr + "T00:00:00").getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

const BLANK: Partial<HotelMaintenanceItemDto> = {
    roomNumber: "", issue: "", category: "Electrical", priority: "medium",
    status: "open", reportedBy: "Front Desk", assignedTo: "",
    reportedAt: new Date().toISOString().slice(0, 10), resolvedAt: null, notes: "", comments: [], estimatedCost: 0,
};

function IssueModal({ item, staff, onSave, onClose }: { item: Partial<HotelMaintenanceItemDto>; staff: HotelStaffMemberDto[]; onSave: (i: HotelMaintenanceItemDto) => void; onClose: () => void; }) {
    const [f, setF] = useState<Partial<HotelMaintenanceItemDto>>({ ...item });
    const s = (k: keyof HotelMaintenanceItemDto) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
    const engineeringStaff = staff.filter(s => s.role === "Maintenance" || s.role === "Engineering");
    const assignableStaff = [...engineeringStaff.map(s => `${s.firstName} ${s.lastName}`), "External Contractor"];

    return (
        <div className="modal-overlay hotel-pms" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <span className="modal-title">{f.id ? "Edit Issue" : "Report New Issue"}</span>
                    <button className="modal-close" onClick={onClose}><Ic.X /></button>
                </div>
                <div className="modal-body">
                    <div className="grid-2 mb-12">
                        <Field label="Room Number"><Inp value={f.roomNumber || ""} onChange={s("roomNumber")} placeholder="e.g. 201" /></Field>
                        <Field label="Category"><Sel value={f.category || "Electrical"} onChange={s("category")} opts={CATEGORIES} /></Field>
                    </div>
                    <Field label="Issue Description *" className="mb-12"><Inp value={f.issue || ""} onChange={s("issue")} placeholder="Describe the issue Clearly..." /></Field>
                    <Field label="Notes / Observations" className="mb-12"><textarea className="textarea" value={f.notes || ""} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} placeholder="Additional details..." /></Field>
                    <div className="grid-3 mb-12">
                        <Field label="Priority"><Sel value={f.priority || "medium"} onChange={s("priority")} opts={PRIORITIES} /></Field>
                        <Field label="Status"><Sel value={f.status || "open"} onChange={s("status")} opts={MAINT_STATUSES} /></Field>
                        <Field label="Est. Cost ($)"><Inp type="number" value={String(f.estimatedCost || 0)} onChange={s("estimatedCost")} min={0} /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Reported By"><Sel value={f.reportedBy || "Front Desk"} onChange={s("reportedBy")} opts={REPORTERS} /></Field>
                        <Field label="Assigned To"><Sel value={f.assignedTo || ""} onChange={s("assignedTo")} opts={["", ...assignableStaff]} /></Field>
                    </div>
                    <Field label="Reported Date"><Inp type="date" value={f.reportedAt || ""} onChange={s("reportedAt")} /></Field>
                </div>
                <div className="modal-footer">
                    <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
                    <Btn disabled={!f.issue?.trim()} onClick={() => onSave(f as HotelMaintenanceItemDto)}>Save Issue</Btn>
                </div>
            </div>
        </div>
    );
}

export default function MaintenancePage() {
    const [items, setItems] = useState<HotelMaintenanceItemDto[]>([]);
    const [staff, setStaff] = useState<HotelStaffMemberDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState<Partial<HotelMaintenanceItemDto> | null>(null);
    const [filter, setFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [iRes, sRes] = await Promise.all([
                fetch("/api/travel/hotel/maintenance"),
                fetch("/api/travel/hotel/staff")
            ]);
            const [iData, sData] = await Promise.all([iRes.json(), sRes.json()]);
            setItems(iData || []);
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

    const handleAdd = async (i: HotelMaintenanceItemDto) => {
        const res = await fetch("/api/travel/hotel/maintenance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(i)
        });
        if (res.ok) fetchData();
    };

    const handleUpdate = async (i: HotelMaintenanceItemDto) => {
        const res = await fetch("/api/travel/hotel/maintenance", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(i)
        });
        if (res.ok) {
            setItems(prev => prev.map(pi => pi.id === i.id ? i : pi));
        }
    };

    const counts = useMemo(() => ({
        open: items.filter(i => i.status === "open").length,
        inProg: items.filter(i => i.status === "in-progress").length,
        resolved: items.filter(i => i.status === "resolved").length,
        deferred: items.filter(i => i.status === "deferred").length,
    }), [items]);

    const filtered = filter === "all" ? items : items.filter(i => i.status === filter);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading maintenance...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            {modal && <IssueModal item={modal} staff={staff} onSave={i => { modal.id ? handleUpdate(i) : handleAdd(i); setModal(null); }} onClose={() => setModal(null)} />}
            
            <div className="page-header">
                <div>
                    <div className="page-title">Maintenance</div>
                    <div className="page-sub">{counts.open} open · {counts.inProg} in-progress</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="outline" onClick={() => setViewMode(v => v === "list" ? "kanban" : "list")}>
                        {viewMode === "list" ? "⬛ Kanban" : "☰ List"}
                    </Btn>
                    <Btn onClick={() => setModal({ ...BLANK, id: Math.random().toString(36).slice(2, 9) })}><Ic.Plus /> Report Issue</Btn>
                </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                <Btn variant={filter === "all" ? "primary" : "outline"} size="sm" onClick={() => setFilter("all")}>All ({items.length})</Btn>
                <Btn variant={filter === "open" ? "primary" : "outline"} size="sm" onClick={() => setFilter("open")} style={{ color: STATUS_CONFIG.open.color }}>🔴 Open ({counts.open})</Btn>
                <Btn variant={filter === "in-progress" ? "primary" : "outline"} size="sm" onClick={() => setFilter("in-progress")} style={{ color: STATUS_CONFIG["in-progress"].color }}>🟡 In Progress ({counts.inProg})</Btn>
                <Btn variant={filter === "resolved" ? "primary" : "outline"} size="sm" onClick={() => setFilter("resolved")} style={{ color: STATUS_CONFIG.resolved.color }}>🟢 Resolved ({counts.resolved})</Btn>
            </div>

            {viewMode === "list" && (
                <div>
                    {filtered.map(item => {
                        const sc = STATUS_CONFIG[item.status];
                        const pc = PRIORITY_CONFIG[item.priority];
                        return (
                            <div key={item.id} className="card mb-12" style={{ borderLeft: `4px solid ${sc.color}` }}>
                                <div className="card-body" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700 }}>{item.issue}</span>
                                            <Badge color={item.priority === "high" ? "red" : (item.priority === "medium" ? "amber" : "gray")}>{item.priority.toUpperCase()}</Badge>
                                        </div>
                                        <div style={{ fontSize: 12.5, color: "#6b7280" }}>
                                            Room {item.roomNumber} &middot; {item.category} &middot; Assigned: {item.assignedTo || "Unassigned"} &middot; {hoursAgo(item.reportedAt)}
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <Badge color={item.status === "open" ? "red" : (item.status === "in-progress" ? "amber" : "green")}>{item.status}</Badge>
                                        <Btn size="sm" variant="ghost" onClick={() => setModal(item)}><Ic.Edit /></Btn>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {viewMode === "kanban" && (
                <div className="grid-4" style={{ gap: 14 }}>
                    {MAINT_STATUSES.map(col => {
                        const colItems = items.filter(i => i.status === col);
                        const sc = STATUS_CONFIG[col];
                        return (
                            <div key={col}>
                                <div style={{ background: sc.bg, padding: "8px 12px", borderRadius: 8, marginBottom: 10, display: "flex", justifyContent: "space-between", color: sc.color, fontWeight: 700, fontSize: 13 }}>
                                    <span>{sc.emoji} {col.toUpperCase()}</span>
                                    <span>{colItems.length}</span>
                                </div>
                                {colItems.map(item => (
                                    <div key={item.id} className="card mb-8 clickable" onClick={() => setModal(item)} style={{ padding: 12, borderLeft: `3px solid ${PRIORITY_CONFIG[item.priority].color}` }}>
                                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{item.issue}</div>
                                        <div style={{ fontSize: 11.5, color: "#6b7280" }}>Room {item.roomNumber} &middot; {item.category}</div>
                                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>{hoursAgo(item.reportedAt)}</div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
