"use client";
import React, { useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");
const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const TODAY = toStr(new Date());
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function addMonths(base: Date, n: number) { return new Date(base.getFullYear(), base.getMonth() + n, 1); }
function fmtShort(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface CalProps {
    year: number; month: number;
    checkIn: string; checkOut: string; hoverDate: string;
    mode: "in" | "out";
    onDayClick: (d: string) => void;
    onDayHover: (d: string) => void;
}

function MonthCalendar({ year, month, checkIn, checkOut, hoverDate, mode, onDayClick, onDayHover }: CalProps) {
    const total = daysInMonth(year, month);
    const offset = firstDay(year, month);
    const cells: (number | null)[] = [
        ...Array(offset).fill(null),
        ...Array.from({ length: total }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const rangeEnd = (mode === "out" && hoverDate > checkIn) ? hoverDate : checkOut;

    return (
        <div style={{ flex: 1 }}>
            <div style={{ textAlign: "center", fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>
                {MONTHS[month]} {year}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                {DAYS.map(d => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "#9ca3af", paddingBottom: 8, letterSpacing: 0.3 }}>{d}</div>
                ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", rowGap: 1 }}>
                {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const d = `${year}-${pad(month + 1)}-${pad(day)}`;
                    const isPast = d < TODAY;
                    const isToday = d === TODAY;
                    const isCheckIn = d === checkIn;
                    const isCheckOut = d === checkOut;
                    const isRangeEnd = d === rangeEnd && rangeEnd !== checkIn;
                    const inRange = checkIn && rangeEnd && d > checkIn && d < rangeEnd;
                    const isWeekend = new Date(d).getDay() === 0 || new Date(d).getDay() === 6;
                    const isDisabled = isPast || (mode === "out" && checkIn && d <= checkIn);

                    let circleStyle: React.CSSProperties = {};
                    if (isCheckIn || isRangeEnd || isCheckOut) {
                        circleStyle = { background: "#2563eb", color: "#fff", fontWeight: 700, borderRadius: "50%" };
                    } else if (isToday) {
                        circleStyle = { fontWeight: 700, color: "#2563eb" };
                    }

                    return (
                        <div key={idx} style={{ position: "relative", textAlign: "center" }}
                            onMouseEnter={() => !isDisabled && onDayHover(d)}
                            onMouseLeave={() => onDayHover("")}
                            onClick={() => !isDisabled && onDayClick(d)}>
                            {(inRange || (isCheckIn && rangeEnd > checkIn) || (isRangeEnd && !isCheckIn)) && (
                                <div style={{
                                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                                    left: (inRange || (isRangeEnd && !isCheckIn)) ? 0 : "50%",
                                    right: (inRange || isCheckIn) ? 0 : "50%",
                                    height: 34, background: "#dbeafe", zIndex: 0,
                                }} />
                            )}
                            <div style={{
                                position: "relative", zIndex: 1,
                                width: 34, height: 34, margin: "0 auto",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "50%",
                                ...circleStyle,
                                cursor: isDisabled ? "default" : "pointer",
                                opacity: isDisabled ? 0.3 : 1,
                                fontSize: 13,
                                color: circleStyle.color ?? (isWeekend && !isDisabled ? "#dc2626" : "#374151"),
                                transition: "background .1s",
                            }}>
                                {day}
                            </div>
                            {isToday && !isCheckIn && !isCheckOut && !isRangeEnd && (
                                <div style={{ position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)", width: 4, height: 4, borderRadius: "50%", background: "#2563eb" }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export interface BookingDatePickerProps {
    mode: "in" | "out";
    checkIn: string;
    checkOut: string;
    onSelect: (date: string) => void;
    onClose: () => void;
}

export function BookingDatePicker({ mode, checkIn, checkOut, onSelect, onClose }: BookingDatePickerProps) {
    const startDate = mode === "out" && checkIn ? new Date(checkIn + "T00:00:00") : new Date();
    const [leftMonth, setLeftMonth] = useState(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
    const [hoverDate, setHoverDate] = useState("");
    const rightMonth = addMonths(leftMonth, 1);

    const canGoPrev = (() => {
        const prev = addMonths(leftMonth, -1);
        return toStr(prev).slice(0, 7) >= TODAY.slice(0, 7);
    })();

    const title = mode === "in" ? "Select Check-in Date" : "Select Check-out Date";
    const subtitle = mode === "out" && checkIn
        ? `Check-in: ${fmtShort(checkIn)} — pick your departure date`
        : "Choose the date you arrive";

    return (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={e => e.stopPropagation()} style={{
                background: "#fff", borderRadius: 14, padding: "22px 26px 18px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.18)", maxWidth: 680, width: "100%",
                fontFamily: "Inter, -apple-system, sans-serif",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>
                            {mode === "in" ? "📅" : "🛫"} {title}
                        </div>
                        <div style={{ fontSize: 12.5, color: "#6b7280", marginTop: 3 }}>{subtitle}</div>
                    </div>
                    <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, color: "#9ca3af", lineHeight: 1, padding: 4 }}>✕</button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => canGoPrev && setLeftMonth(p => addMonths(p, -1))}
                        disabled={!canGoPrev}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: canGoPrev ? "pointer" : "not-allowed", opacity: canGoPrev ? 1 : 0.3, flexShrink: 0, fontSize: 14 }}>
                        ◀
                    </button>
                    <div style={{ display: "flex", gap: 28, flex: 1 }}>
                        <MonthCalendar
                            year={leftMonth.getFullYear()} month={leftMonth.getMonth()}
                            checkIn={checkIn} checkOut={checkOut}
                            hoverDate={hoverDate} mode={mode}
                            onDayClick={onSelect} onDayHover={setHoverDate}
                        />
                        <div style={{ width: 1, background: "#f0f0f0", alignSelf: "stretch" }} />
                        <MonthCalendar
                            year={rightMonth.getFullYear()} month={rightMonth.getMonth()}
                            checkIn={checkIn} checkOut={checkOut}
                            hoverDate={hoverDate} mode={mode}
                            onDayClick={onSelect} onDayHover={setHoverDate}
                        />
                    </div>
                    <button onClick={() => setLeftMonth(p => addMonths(p, 1))}
                        style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", flexShrink: 0, fontSize: 14 }}>
                        ▶
                    </button>
                </div>

                <div style={{ display: "flex", gap: 18, marginTop: 16, paddingTop: 14, borderTop: "1px solid #f3f4f6", fontSize: 11.5, color: "#9ca3af", flexWrap: "wrap" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 12, height: 12, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} /> Selected
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 22, height: 12, borderRadius: 2, background: "#dbeafe", display: "inline-block" }} /> Range
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#2563eb", display: "inline-block" }} /> Today
                    </span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14, gap: 10 }}>
                    <button onClick={onClose} style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 13, color: "#374151" }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BookingDatePicker;
