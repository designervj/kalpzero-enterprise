"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getThemeMode, setThemeMode as setPersistedThemeMode } from "@/lib/theme-runtime";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  toggleThemeMode: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ 
  children, 
  storageKey = "kalp-theme-mode" 
}: { 
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getThemeMode(storageKey);
    setThemeModeState(saved);
    document.documentElement.setAttribute("data-theme-mode", saved);

    // Sync with other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === storageKey) {
        const next = (e.newValue as ThemeMode) || "dark";
        setThemeModeState(next);
        document.documentElement.setAttribute("data-theme-mode", next);
      }
    };
    
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [storageKey]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setPersistedThemeMode(mode, storageKey);
    document.documentElement.setAttribute("data-theme-mode", mode);
  };

  const toggleThemeMode = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
  };

  // When unmounting, we don't necessarily want to reset the attribute 
  // because another provider might be mounting immediately.
  // But if we are a nested provider, we might want to let the parent take over.
  // For now, we'll just set it on mount/update.

  return (
    <ThemeContext.Provider value={{ themeMode, toggleThemeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
