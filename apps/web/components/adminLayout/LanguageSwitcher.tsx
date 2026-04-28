"use client";

import React, { useState } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { useTheme } from "@/components/providers/theme-provider";

const LOCALE_META: Record<string, { flag: string; label: string }> = {
  en: { flag: "🇬🇧", label: "EN" },
  hi: { flag: "🇮🇳", label: "HI" },
  hr: { flag: "🇭🇷", label: "HR" },
  "zh-hant": { flag: "🇹🇼", label: "繁中" },
};

export function LanguageSwitcher() {
  const { locale, setLocale, availableLocales } = useTranslation();
  const [open, setOpen] = useState(false);
  const { themeMode } = useTheme();
  const meta = LOCALE_META[locale] || LOCALE_META.en;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border shadow-inner text-xs transition-all ${
          themeMode === 'light'
            ? 'bg-white border-slate-200 text-slate-700 hover:border-slate-400'
            : 'bg-slate-900/50 border-slate-800 text-white hover:border-slate-600'
        }`}
      >
        <Languages size={12} className={themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'} />
        <span className="font-medium">{meta.flag}</span>
        <span className={`font-bold text-[10px] ${themeMode === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
          {meta.label}
        </span>
      </button>
      {open && (
        <div className={`absolute top-full right-0 mt-1 rounded-lg overflow-hidden shadow-xl z-50 min-w-[120px] border transition-all ${
          themeMode === 'light'
            ? 'bg-white border-slate-200'
            : 'bg-slate-900 border-slate-700'
        }`}>
          {availableLocales.map((loc) => {
            const m = LOCALE_META[loc];
            if (!m) return null;
            return (
              <button
                key={loc}
                onClick={() => {
                  setLocale(loc);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  locale === loc
                    ? themeMode === 'light' ? "text-indigo-600 bg-indigo-50" : "text-cyan-400 bg-slate-800/50"
                    : themeMode === 'light' ? "text-slate-600 hover:bg-slate-50" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <span>{m.flag}</span>
                <span className="font-semibold">{m.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
