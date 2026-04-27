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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = getThemeMode();
    setThemeModeState(saved);
    document.documentElement.setAttribute("data-theme-mode", saved);

    // Sync with other tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "kalp-theme-mode") {
        const next = (e.newValue as ThemeMode) || "dark";
        setThemeModeState(next);
        document.documentElement.setAttribute("data-theme-mode", next);
      }
    };
    
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    setPersistedThemeMode(mode);
    document.documentElement.setAttribute("data-theme-mode", mode);
  };

  const toggleThemeMode = () => {
    const next = themeMode === "light" ? "dark" : "light";
    setThemeMode(next);
  };

  // Prevent flash by avoiding rendering children until mounted if necessary
  // or just render and let the data-attribute handle it via CSS
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
