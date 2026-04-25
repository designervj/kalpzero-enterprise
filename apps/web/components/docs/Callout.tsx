import type { ReactNode } from "react";

type CalloutTone = "brand" | "note" | "success";

const toneClasses: Record<CalloutTone, string> = {
  brand: "border-blue-200 bg-blue-50 text-slate-700",
  note: "border-slate-200 bg-slate-50 text-slate-700",
  success: "border-emerald-200 bg-emerald-50 text-slate-700"
};

const toneLabelClasses: Record<CalloutTone, string> = {
  brand: "text-blue-700",
  note: "text-slate-700",
  success: "text-emerald-700"
};

type CalloutProps = {
  title: string;
  tone?: CalloutTone;
  children: ReactNode;
};

export function Callout({ title, tone = "note", children }: CalloutProps) {
  return (
    <div className={`my-8 rounded-3xl border px-5 py-4 ${toneClasses[tone]}`}>
      <div className={`text-[11px] font-black uppercase tracking-[0.28em] ${toneLabelClasses[tone]}`}>
        {title}
      </div>
      <div className="mt-3 text-[15px] leading-7">{children}</div>
    </div>
  );
}
