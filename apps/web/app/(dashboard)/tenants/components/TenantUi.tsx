"use client";

import type React from "react";

type LocalButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
};

const BASE_INPUT_CLASSNAME =
  "flex w-full rounded-lg border border-slate-700/80 bg-black/40 px-3 py-2 " +
  "text-sm text-white focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-cyan-500/40";

export function Button({
  variant = "default",
  size = "md",
  className = "",
  type = "button",
  ...props
}: LocalButtonProps) {
  const variantClass =
    variant === "secondary"
      ? "border border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-700/70"
      : variant === "outline"
        ? "border border-slate-700 text-slate-200 hover:bg-slate-800/60"
        : variant === "ghost"
          ? "text-slate-200 hover:bg-slate-800/60"
          : variant === "destructive"
            ? "bg-rose-500 text-white hover:bg-rose-400"
            : "bg-cyan-500 text-black hover:bg-cyan-400";
  const sizeClass =
    size === "sm"
      ? "h-8 px-3 text-xs"
      : size === "lg"
        ? "h-11 px-5 text-base"
        : "h-10 px-4 text-sm";

  return (
    <button
      type={type}
      className={
        "inline-flex items-center justify-center rounded-lg font-semibold " +
        "transition-colors focus-visible:outline-none " +
        "focus-visible:ring-2 focus-visible:ring-cyan-500/40 " +
        `disabled:pointer-events-none disabled:opacity-50 ${variantClass} ` +
        `${sizeClass} ${className}`
      }
      {...props}
    />
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${BASE_INPUT_CLASSNAME} h-10 placeholder:text-slate-500 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`${BASE_INPUT_CLASSNAME} h-10 ${className}`}
      {...props}
    />
  );
}

export function Label({
  className = "",
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`text-xs font-semibold uppercase tracking-widest text-slate-500 ${className}`}
      {...props}
    />
  );
}

export function Badge({
  className = "",
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "outline" | "secondary" | "destructive";
}) {
  const variantClass =
    variant === "outline"
      ? "border-slate-700 bg-transparent text-slate-500"
      : variant === "destructive"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
        : variant === "secondary"
          ? "border-slate-700 bg-slate-800/70 text-slate-200"
          : "border-cyan-500/30 bg-cyan-500/10 text-cyan-400";

  return (
    <span
      className={
        "inline-flex items-center rounded-md border px-2.5 py-1 text-[9px] " +
        `font-black uppercase tracking-[0.2em] ${variantClass} ${className}`
      }
      {...props}
    />
  );
}

export function Table({
  className = "",
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-auto">
      <table
        className={`w-full caption-bottom text-sm ${className}`}
        {...props}
      />
    </div>
  );
}

export function TableHeader(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return <thead className="border-b border-slate-800/80" {...props} />;
}

export function TableBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return <tbody className="[&_tr:last-child]:border-0" {...props} />;
}

export function TableRow({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={
        "border-b border-slate-800/60 transition-colors hover:bg-slate-900/40 " +
        className
      }
      {...props}
    />
  );
}

export function TableHead({
  className = "",
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={
        "h-12 px-4 text-left align-middle text-xs font-semibold uppercase " +
        `tracking-widest text-slate-500 ${className}`
      }
      {...props}
    />
  );
}

export function TableCell({
  className = "",
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`p-4 align-middle text-slate-300 ${className}`} {...props} />
  );
}

export function ScopedReadOnlyNotice({
  visible,
  message,
}: {
  visible: boolean;
  message: string;
}) {
  if (!visible) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-300">
      {message}
    </div>
  );
}
