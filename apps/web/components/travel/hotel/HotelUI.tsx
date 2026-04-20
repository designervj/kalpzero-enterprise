"use client";
import React from "react";
import "./HotelPMS.css";

export const clamp = (v: number, mn: number, mx: number) => Math.min(Math.max(Number(v) || 0, mn), mx);
export const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
export const uid = () => `id_${Math.random().toString(36).slice(2, 9)}`;
export const fmt = (n: number) => n.toLocaleString();
export const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
export const today = () => new Date().toISOString().slice(0, 10);

export const BOOKING_SOURCES = ["Direct", "Booking.com", "Expedia", "Agoda", "Walk-in", "Phone", "Corporate"];
export const DIETARY_PREFS = ["Veg", "Non-Veg", "Vegan", "Halal", "Jain", "Gluten-Free"];
export const LOYALTY_TIERS = ["Bronze", "Silver", "Gold", "Platinum"] as const;

export const Ic = {
    Dashboard: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>,
    Bookings: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    CheckIn: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 3h6v18h-6" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>,
    Customers: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
    Rooms: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    Meals: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><line x1="7" y1="2" x2="7" y2="11" /><path d="M18 2h-2a2 2 0 00-2 2v3a2 2 0 002 2h2V2z" /><line x1="18" y1="9" x2="18" y2="22" /></svg>,
    HK: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>,
    Maint: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>,
    Pricing: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
    Avail: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><polyline points="9 16 11 18 15 14" /></svg>,
    Amenity: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
    Hotel: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M3 21V7l9-4 9 4v14" /><path d="M9 21V12h6v9" /></svg>,
    Plus: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    Trash: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" /></svg>,
    Edit: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    Chev: ({ r }: { r: boolean }) => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points={r ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} /></svg>,
    Back: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>,
    Search: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    QR: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="5" height="5" /><rect x="16" y="3" width="5" height="5" /><rect x="3" y="16" width="5" height="5" /><line x1="21" y1="16" x2="21" y2="21" /><line x1="16" y1="21" x2="21" y2="21" /><line x1="16" y1="16" x2="16" y2="16" /><line x1="11" y1="3" x2="11" y2="8" /><line x1="11" y1="16" x2="11" y2="21" /><line x1="3" y1="11" x2="8" y2="11" /><line x1="16" y1="11" x2="21" y2="11" /><line x1="11" y1="11" x2="11" y2="11" /></svg>,
    X: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    Eye: () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
    Star: () => <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
    Crown: () => <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20v2H2zm2-4V8l5 5 3-7 3 7 5-5v8z" /></svg>,
    Alert: () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
    Staff: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /><line x1="22" y1="11" x2="22" y2="17" /></svg>,
    Reports: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="12" y1="14" x2="12" y2="16" /><line x1="16" y1="11" x2="16" y2="16" /><path d="M8 16v-4M12 16v-2M16 16v-5" /></svg>,
    LostFound: () => <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>,
};

type InpProps = { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; className?: string; style?: React.CSSProperties; disabled?: boolean; autoFocus?: boolean; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; min?: string | number; max?: string | number; };
export const Inp = ({ value, onChange, type = "text", placeholder, className = "", style, disabled, autoFocus, onKeyDown, min, max }: InpProps) => (
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`inp ${className}`} style={style} disabled={disabled} autoFocus={autoFocus} onKeyDown={onKeyDown} min={min} max={max} />
);

type NumInpProps = { value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min?: number; max?: number; };
export const NumInp = ({ value, onChange, min = 0, max = 999999 }: NumInpProps) => {
    const change = (delta: number) => onChange({ target: { value: String(clamp(value + delta, min, max)) } } as React.ChangeEvent<HTMLInputElement>);
    return (
        <div className="num-wrap">
            <input type="number" value={value} onChange={onChange} min={min} max={max}
                style={{ width: "100%", padding: "9px 32px 9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13.5, fontFamily: "inherit", outline: "none", background: "#fff" }}
            />
            <div className="num-arrows">
                <button className="num-arrow" onClick={() => change(1)}>▲</button>
                <button className="num-arrow" onClick={() => change(-1)}>▼</button>
            </div>
        </div>
    );
};

type SelProps = { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; opts: readonly (string | { v: string; l: string })[]; className?: string; style?: React.CSSProperties; };
export const Sel = ({ value, onChange, opts, className = "", style }: SelProps) => (
    <select value={value} onChange={onChange} className={`sel ${className}`} style={style}>
        {opts.map(o => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
);

export const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string; }) => (
    <div className="toggle-wrap">
        <button onClick={() => onChange(!checked)} className={`toggle-track ${checked ? "on" : "off"}`}>
            <span className="toggle-thumb" />
        </button>
        {label && <span style={{ fontSize: 13.5, color: "#374151" }}>{label}</span>}
    </div>
);

export const Btn = ({ children, onClick, variant = "primary", size = "md", disabled = false, style = {} }: { children: React.ReactNode; onClick?: () => void; variant?: string; size?: string; disabled?: boolean; style?: React.CSSProperties; }) => (
    <button onClick={onClick} disabled={disabled} style={style} className={`btn btn-${size} btn-${variant}`}>{children}</button>
);

export const Badge = ({ children, color = "gray" }: { children: React.ReactNode; color?: string; }) => (
    <span className={`badge badge-${color}`}>{children}</span>
);

export const FieldLabel = ({ children }: { children: React.ReactNode }) => <label className="field-label">{children}</label>;
export const Field = ({ label, children, style = {}, className = "" }: { label?: string; children: React.ReactNode; style?: React.CSSProperties; className?: string; }) => (
    <div style={style} className={className}>{label && <FieldLabel>{label}</FieldLabel>}{children}</div>
);

export const Card = ({ children, title, subtitle, headerAction, footer, className = "", style = {} }: { children: React.ReactNode, title?: string, subtitle?: string, headerAction?: React.ReactNode, footer?: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
    <div className={`card ${className}`} style={style}>
        {(title || headerAction) && (
            <div className="card-header">
                <div>
                    {title && <div className="card-title">{title}</div>}
                    {subtitle && <div className="card-subtitle">{subtitle}</div>}
                </div>
                {headerAction}
            </div>
        )}
        <div className="card-body">{children}</div>
        {footer && <div className="card-footer">{footer}</div>}
    </div>
);

export const PageHeader = ({ title, sub, actions }: { title: string, sub?: string, actions?: React.ReactNode }) => (
    <div className="page-header">
        <div>
            <h1 className="page-title">{title}</h1>
            {sub && <p className="page-sub">{sub}</p>}
        </div>
        {actions && <div style={{ display: "flex", gap: 10 }}>{actions}</div>}
    </div>
);

export const Modal = ({ children, title, onClose, footer, size = "md" }: { children: React.ReactNode, title: string, onClose: () => void, footer?: React.ReactNode, size?: "sm" | "md" | "lg" }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className={`modal-box modal-box-${size}`} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <div className="modal-title">{title}</div>
                <button className="modal-close" onClick={onClose}>✕</button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
        </div>
    </div>
);

export const statusColor: Record<string, string> = {
    confirmed: "blue", "checked-in": "green", "checked-out": "gray", cancelled: "red", "no-show": "amber", pending: "purple",
};

export const PRIORITY_COLOR: Record<string, string> = { low: "gray", medium: "amber", high: "red" };
export const MAINT_STATUS_COLOR: Record<string, string> = { open: "red", "in-progress": "amber", resolved: "green", deferred: "gray" };

export const Confirm = ({ title, msg, onOk, onCancel }: { title?: string; msg: string; onOk: () => void; onCancel: () => void; }) => (
    <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-box modal-box-sm" onClick={e => e.stopPropagation()} style={{ padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{title || "Confirm"}</div>
            <div style={{ fontSize: 13.5, color: "#6b7280", lineHeight: 1.6, marginBottom: 22 }}>{msg}</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
                <Btn variant="danger" onClick={onOk}>Confirm</Btn>
            </div>
        </div>
    </div>
);
