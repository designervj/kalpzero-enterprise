"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, Plus } from "lucide-react";

type SmartColorPickerProps = {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  variant?: "dark" | "light";
  globalSeed?: string[];
  showMeta?: boolean;
};

const GLOBAL_STORAGE_KEY = "kalpzero_color_picker_globals";
const RECENT_STORAGE_KEY = "kalpzero_color_picker_recent";
const DEFAULT_GLOBALS = [
  "#2563eb",
  "#f97316",
  "#0f172a",
  "#06b6d4",
  "#7c3aed",
  "#16a34a",
  "#111827",
  "#ffffff",
];

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeHexColor(input: string): string {
  const value = input.trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(value)) return "";
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHexColor(hex) || "#000000";
  const raw = normalized.slice(1);
  const intValue = Number.parseInt(raw, 16);
  return [(intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let hue = 0;
  if (delta !== 0) {
    if (max === rn) hue = ((gn - bn) / delta) % 6;
    else if (max === gn) hue = (bn - rn) / delta + 2;
    else hue = (rn - gn) / delta + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  const sat = max === 0 ? 0 : delta / max;
  return [hue, sat, max];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

function readArrayStorage(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallback;
    return parsed
      .map((item) => normalizeHexColor(String(item)))
      .filter(Boolean);
  } catch {
    return fallback;
  }
}

function writeArrayStorage(key: string, values: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(values));
  } catch {
    // no-op
  }
}

export function SmartColorPicker({
  value,
  onChange,
  className = "",
  variant = "dark",
  globalSeed = [],
  showMeta = true,
}: SmartColorPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const gradientRef = useRef<HTMLDivElement | null>(null);
  const [globalColors, setGlobalColors] = useState<string[]>(DEFAULT_GLOBALS);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const normalizedValue = normalizeHexColor(value) || "#000000";
  const [r, g, b] = hexToRgb(normalizedValue);
  const [hue, setHue] = useState(() => rgbToHsv(r, g, b)[0]);
  const [sat, setSat] = useState(() => rgbToHsv(r, g, b)[1]);
  const [val, setVal] = useState(() => rgbToHsv(r, g, b)[2]);
  const [hexInput, setHexInput] = useState(normalizedValue);

  useEffect(() => {
    const [nr, ng, nb] = hexToRgb(normalizedValue);
    const [nh, ns, nv] = rgbToHsv(nr, ng, nb);
    setHue(nh);
    setSat(ns);
    setVal(nv);
    setHexInput(normalizedValue);
  }, [normalizedValue]);

  const seedKey = globalSeed.join(",");

  useEffect(() => {
    const persistedGlobals = readArrayStorage(
      GLOBAL_STORAGE_KEY,
      DEFAULT_GLOBALS,
    );
    const merged = Array.from(
      new Set([
        ...globalSeed.map(normalizeHexColor).filter(Boolean),
        ...persistedGlobals,
      ]),
    ).slice(0, 24);
    setGlobalColors(merged.length > 0 ? merged : DEFAULT_GLOBALS);
    setRecentColors(readArrayStorage(RECENT_STORAGE_KEY, []));
  }, [seedKey]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current && !rootRef.current.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const updateFromHsv = (nextHue: number, nextSat: number, nextVal: number) => {
    const [nr, ng, nb] = hsvToRgb(nextHue, nextSat, nextVal);
    const nextHex = rgbToHex(nr, ng, nb);
    setHue(nextHue);
    setSat(nextSat);
    setVal(nextVal);
    setHexInput(nextHex);
    onChange(nextHex);
  };

  const updateRecent = (nextHex: string) => {
    const safe = normalizeHexColor(nextHex);
    if (!safe) return;
    const next = [
      safe,
      ...recentColors.filter((entry) => entry !== safe),
    ].slice(0, 24);
    setRecentColors(next);
    writeArrayStorage(RECENT_STORAGE_KEY, next);
  };

  const onGradientPointer = (clientX: number, clientY: number) => {
    if (!gradientRef.current) return;
    const rect = gradientRef.current.getBoundingClientRect();
    const nextSat = clamp((clientX - rect.left) / rect.width, 0, 1);
    const nextVal = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
    updateFromHsv(hue, nextSat, nextVal);
  };

  const [previewR, previewG, previewB] = useMemo(
    () => hexToRgb(normalizedValue),
    [normalizedValue],
  );
  const textClass = variant === "dark" ? "text-slate-300" : "text-slate-700";
  const panelClass =
    variant === "dark"
      ? "border-slate-700 bg-slate-950 text-slate-200"
      : "border-slate-200 bg-white text-slate-800";
  const inputClass =
    variant === "dark"
      ? "border-slate-700 bg-black/50 text-white focus:border-cyan-500/40"
      : "border-slate-300 bg-white text-slate-900 focus:border-violet-400";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all hover:border-white/20 hover:bg-white/5 ${panelClass}`}
      >
        <span
          className="h-6 w-6 rounded-lg border border-white/10 shadow-inner"
          style={{ backgroundColor: normalizedValue }}
        />
        {/* <span className="text-xs font-black tracking-widest uppercase opacity-70">{normalizedValue}</span> */}
      </button>

      {open && (
        <div
          className={`absolute left-0 top-[calc(100%+12px)] z-[9999] w-[340px] rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-3xl p-5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-200 ${variant === "dark" ? "text-slate-200" : "text-slate-800"}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
              Color Studio
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(normalizedValue);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1200);
              }}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10`}
            >
              {copied ? (
                <Check size={12} className="text-emerald-400" />
              ) : (
                <Copy size={12} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div
            ref={gradientRef}
            className="relative h-40 w-full cursor-crosshair rounded-2xl shadow-2xl border border-white/5"
            style={{
              backgroundColor: `hsl(${Math.round(hue)}, 100%, 50%)`,
              backgroundImage:
                "linear-gradient(to right, #fff, rgba(255,255,255,0)), linear-gradient(to top, #000, rgba(0,0,0,0))",
            }}
            onMouseDown={(event) =>
              onGradientPointer(event.clientX, event.clientY)
            }
            onMouseMove={(event) => {
              if ((event.buttons & 1) === 1)
                onGradientPointer(event.clientX, event.clientY);
            }}
          >
            <div
              className="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white shadow-2xl"
              style={{
                left: `calc(${sat * 100}% - 8px)`,
                top: `calc(${(1 - val) * 100}% - 8px)`,
                boxShadow:
                  "0 0 0 4px rgba(0,0,0,0.2), 0 0 20px rgba(255,255,255,0.5)",
              }}
            />
          </div>

          <div className="mt-5 px-1">
            <input
              type="range"
              min={0}
              max={360}
              value={Math.round(hue)}
              onChange={(event) =>
                updateFromHsv(Number(event.target.value), sat, val)
              }
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background:
                  "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
              }}
            />
          </div>

          <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <input
                value={hexInput}
                onChange={(event) => {
                  const next = event.target.value;
                  setHexInput(next);
                  const normalized = normalizeHexColor(next);
                  if (normalized) {
                    onChange(normalized);
                    updateRecent(normalized);
                  }
                }}
                className={`w-full rounded-xl border border-white/5 bg-black/40 px-4 py-2.5 text-xs font-mono outline-none focus:border-cyan-500/50 transition-all`}
              />
            </div>
            <button
              type="button"
              onClick={() => updateRecent(normalizedValue)}
              className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all`}
              title="Pin to recent"
            >
              <Plus size={14} />
              Recent
            </button>
          </div>

          {showMeta && (
            <div className="mt-4 flex justify-between items-center px-1">
              <p
                className={`text-[10px] font-black uppercase tracking-widest opacity-30`}
              >
                RGB Channels
              </p>
              <p className={`text-[10px] font-mono opacity-50`}>
                {previewR} • {previewG} • {previewB}
              </p>
            </div>
          )}

          <div className="mt-5 space-y-4 pt-4 border-t border-white/5">
            <div>
              <p
                className={`mb-2 text-[9px] font-black uppercase tracking-[0.15em] opacity-40`}
              >
                Global Palette
              </p>
              <div className="flex flex-wrap gap-2">
                {globalColors.map((color) => (
                  <button
                    key={`global-${color}`}
                    type="button"
                    onClick={() => {
                      onChange(color);
                      updateRecent(color);
                    }}
                    className="h-6 w-6 rounded-lg border border-white/10 shadow-lg transition-transform hover:scale-110 active:scale-95"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div>
              <p
                className={`mb-2 text-[9px] font-black uppercase tracking-[0.15em] opacity-40 text-rose-400/60`}
              >
                History
              </p>
              <div className="flex flex-wrap gap-2">
                {recentColors.length === 0 && (
                  <span className={`text-[10px] opacity-20 italic`}>
                    Session history empty
                  </span>
                )}
                {recentColors.map((color) => (
                  <button
                    key={`recent-${color}`}
                    type="button"
                    onClick={() => onChange(color)}
                    className="h-6 w-6 rounded-lg border border-white/10 shadow-lg transition-transform hover:scale-110 active:scale-95"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                const nextGlobal = Array.from(
                  new Set([normalizedValue, ...globalColors]),
                ).slice(0, 24);
                setGlobalColors(nextGlobal);
                writeArrayStorage(GLOBAL_STORAGE_KEY, nextGlobal);
                updateRecent(normalizedValue);
              }}
              className={`w-full rounded-2xl border border-cyan-500/20 bg-cyan-500/5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 hover:bg-cyan-500/10 transition-all shadow-[0_0_20px_rgba(6,182,212,0.1)]`}
            >
              Save to Global
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
