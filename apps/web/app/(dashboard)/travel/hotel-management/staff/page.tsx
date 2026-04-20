"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import "@/components/travel/hotel/HotelPMS.css";
import {
    HotelStaffMemberDto
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
    Modal
} from "@/components/travel/hotel/HotelUI";

const ROLES = ["Front Desk", "Housekeeping", "Maintenance", "F&B", "Security", "Management", "Concierge", "Engineering"] as const;
const SHIFTS = ["Morning (6AM–2PM)", "Afternoon (2PM–10PM)", "Night (10PM–6AM)", "General (9AM–6PM)"] as const;
const STATUSES = ["Active", "On Leave", "Off Duty", "Resigned"] as const;
const ATTENDANCE = ["present", "absent", "late", "not-marked"] as const;

const ROLE_COLORS: Record<string, string> = {
    "Front Desk": "blue", "Housekeeping": "green", "Maintenance": "amber",
    "F&B": "purple", "Security": "red", "Management": "indigo", "Concierge": "teal", "Engineering": "blue",
};

const BLANK_STAFF: Partial<HotelStaffMemberDto> = {
    employeeId: "", firstName: "", lastName: "", role: "Front Desk",
    department: "Operations", shift: "Morning (6AM–2PM)", phone: "", email: "",
    emergencyContact: "", joinDate: new Date().toISOString().slice(0, 10), status: "Active", notes: "", todayAttendance: "not-marked",
};

export default function StaffManagementPage() {
    const [staff, setStaff] = useState<HotelStaffMemberDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRole, setSelectedRole] = useState("all");
    const [search, setSearch] = useState("");
    const [modal, setModal] = useState<Partial<HotelStaffMemberDto> | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/travel/hotel/staff");
            const data = await res.json();
            setStaff(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async (s: HotelStaffMemberDto) => {
        const isNew = !staff.find(sm => sm.id === s.id);
        const res = await fetch("/api/travel/hotel/staff", {
            method: isNew ? "POST" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(s)
        });
        if (res.ok) {
            fetchData();
            setModal(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this staff member?")) return;
        const res = await fetch(`/api/travel/hotel/staff?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchData();
    };

    const updateAttendance = async (s: HotelStaffMemberDto, attendance: string) => {
        const res = await fetch("/api/travel/hotel/staff", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...s, todayAttendance: attendance })
        });
        if (res.ok) {
            setStaff(prev => prev.map(item => item.id === s.id ? { ...item, todayAttendance: attendance as any } : item));
        }
    };

    const filtered = useMemo(() => {
        return staff.filter(s => {
            const matchRole = selectedRole === "all" || s.role === selectedRole;
            const matchSearch = !search || `${s.firstName} ${s.lastName} ${s.employeeId}`.toLowerCase().includes(search.toLowerCase());
            return matchRole && matchSearch;
        });
    }, [staff, selectedRole, search]);

    const stats = useMemo(() => ({
        total: staff.filter(s => s.status === "Active").length,
        present: staff.filter(s => s.todayAttendance === "present").length,
        absent: staff.filter(s => s.todayAttendance === "absent").length,
        onLeave: staff.filter(s => s.status === "On Leave").length,
    }), [staff]);

    if (loading) return <div className="hotel-pms" style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading staff...</div>;

    return (
        <div className="hotel-pms" style={{ padding: "24px 32px" }}>
            <PageHeader
                title="Staff Management"
                sub="Manage your hotel team and attendance"
                actions={<Btn onClick={() => setModal({ ...BLANK_STAFF, id: Math.random().toString(36).slice(2, 9) })}><Ic.Plus /> Add Staff</Btn>}
            />

            <div className="grid-4 mb-20" style={{ gap: 12 }}>
                {[
                    { label: "Active Team", value: stats.total, color: "#111827" },
                    { label: "Present Today", value: stats.present, color: "#16a34a" },
                    { label: "On Leave", value: stats.onLeave, color: "#d97706" },
                    { label: "Absent", value: stats.absent, color: "#dc2626" },
                ].map(k => (
                    <Card key={k.label} style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</div>
                        <div style={{ fontSize: 24, fontWeight: 800, color: k.color, marginTop: 4 }}>{k.value}</div>
                    </Card>
                ))}
            </div>

            <Card>
                <div className="card-header" style={{ gap: 12 }}>
                    <Inp value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..." style={{ flex: 1 }} />
                    <Sel value={selectedRole} onChange={e => setSelectedRole(e.target.value)} opts={["all", ...ROLES]} className="w-160" />
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    <table className="data-table">
                        <thead>
                            <tr><th>Employee</th><th>Role</th><th>Shift</th><th>Attendance</th><th>Status</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#2563eb", fontSize: 12 }}>
                                                {s.firstName[0]}{s.lastName[0]}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</div>
                                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.employeeId}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><Badge color={ROLE_COLORS[s.role] || "gray"}>{s.role}</Badge></td>
                                    <td style={{ fontSize: 12 }}>{s.shift}</td>
                                    <td>
                                        <Sel
                                            value={s.todayAttendance || "not-marked"}
                                            onChange={e => updateAttendance(s, e.target.value)}
                                            opts={ATTENDANCE.map(a => ({ v: a, l: a.toUpperCase() }))}
                                            style={{ fontSize: 11, padding: "4px 8px", width: 110 }}
                                        />
                                    </td>
                                    <td><Badge color={s.status === "Active" ? "green" : (s.status === "On Leave" ? "amber" : "gray")}>{s.status}</Badge></td>
                                    <td>
                                        <div style={{ display: "flex", gap: 4 }}>
                                            <Btn size="sm" variant="ghost" onClick={() => setModal(s)}><Ic.Edit /></Btn>
                                            <Btn size="sm" variant="ghost" style={{ color: "#dc2626" }} onClick={() => handleDelete(s.id)}><Ic.Trash /></Btn>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {modal && (
                <Modal title={modal.firstName ? "Edit Staff" : "Add Staff"} onClose={() => setModal(null)} size="lg"
                    footer={<><Btn variant="secondary" onClick={() => setModal(null)}>Cancel</Btn><Btn onClick={() => handleSave(modal as HotelStaffMemberDto)}>Save Staff</Btn></>}>
                    <div className="grid-2 mb-12">
                        <Field label="First Name"><Inp value={modal.firstName || ""} onChange={e => setModal({ ...modal, firstName: e.target.value })} /></Field>
                        <Field label="Last Name"><Inp value={modal.lastName || ""} onChange={e => setModal({ ...modal, lastName: e.target.value })} /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Employee ID"><Inp value={modal.employeeId || ""} onChange={e => setModal({ ...modal, employeeId: e.target.value })} placeholder="EMP-001" /></Field>
                        <Field label="Role"><Sel value={modal.role || "Front Desk"} onChange={e => setModal({ ...modal, role: e.target.value as any })} opts={ROLES} /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Shift"><Sel value={modal.shift || "Morning (6AM–2PM)"} onChange={e => setModal({ ...modal, shift: e.target.value as any })} opts={SHIFTS} /></Field>
                        <Field label="Department"><Inp value={modal.department || "Operations"} onChange={e => setModal({ ...modal, department: e.target.value })} /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Phone"><Inp value={modal.phone || ""} onChange={e => setModal({ ...modal, phone: e.target.value })} /></Field>
                        <Field label="Email"><Inp value={modal.email || ""} onChange={e => setModal({ ...modal, email: e.target.value })} type="email" /></Field>
                    </div>
                    <div className="grid-2 mb-12">
                        <Field label="Join Date"><Inp type="date" value={modal.joinDate || ""} onChange={e => setModal({ ...modal, joinDate: e.target.value })} /></Field>
                        <Field label="Status"><Sel value={modal.status || "Active"} onChange={e => setModal({ ...modal, status: e.target.value as any })} opts={STATUSES} /></Field>
                    </div>
                </Modal>
            )}
        </div>
    );
}
