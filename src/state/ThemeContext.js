import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { loadTheme, saveTheme } from "../services/storage";

// ─── Light palette ─────────────────────────────────────────────────────────────
export const LIGHT = {
  bg:           "#fbfbf7",
  bgCard:       "#ffffff",
  bgInput:      "#f5f3ee",
  bgHero:       "#fbfbf7",
  text:         "#1b1b1b",
  textSub:      "#7a7a7a",
  textMuted:    "#9a9a9a",
  border:       "#e1ded7",
  borderLight:  "#ebe9e1",
  green:        "#2b7a3d",
  greenSoft:    "#eaf5ec",
  greenMid:     "#c3e6ca",
  greenLabel:   "#2b7a3d",
  danger:       "#c0392b",
  dangerSoft:   "#fdecea",
  dangerBorder: "#f5c6c6",
  warn:         "#f4a261",
  warnSoft:     "#fff5eb",
  blue:         "#3a86ff",
  blueSoft:     "#eef3ff",
  tabBg:        "#ffffff",
  tabBorder:    "#ebe9e1",
  tabActive:    "#2b7a3d",
  tabInactive:  "#5c5c5c",
  statusBar:    "dark",
};

// ─── Dark palette ──────────────────────────────────────────────────────────────
export const DARK = {
  bg:           "#0e1712",
  bgCard:       "#1a2620",
  bgInput:      "#142018",
  bgHero:       "#0e1712",
  text:         "#e8ede9",
  textSub:      "#7a9480",
  textMuted:    "#567060",
  border:       "#2a3d2e",
  borderLight:  "#1e2d21",
  green:        "#4ade80",
  greenSoft:    "#162e1e",
  greenMid:     "#1f3d28",
  greenLabel:   "#4ade80",
  danger:       "#f87171",
  dangerSoft:   "#2d1212",
  dangerBorder: "#5a2020",
  warn:         "#fbbf24",
  warnSoft:     "#2d2000",
  blue:         "#60a5fa",
  blueSoft:     "#0d1e35",
  tabBg:        "#1a2620",
  tabBorder:    "#1e2d21",
  tabActive:    "#4ade80",
  tabInactive:  "#567060",
  statusBar:    "light",
};

// ─── Context ───────────────────────────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // "light" | "dark" | "system"
  const [mode, setMode] = useState("system");
  const systemScheme    = useColorScheme(); // "light" | "dark" | null

  useEffect(() => {
    loadTheme().then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setMode(saved);
      }
    });
  }, []);

  const isDark =
    mode === "dark" ||
    (mode === "system" && systemScheme === "dark");

  const theme = isDark ? DARK : LIGHT;

  const setThemeMode = (newMode) => {
    setMode(newMode);
    saveTheme(newMode);
  };

  const toggleTheme = () => {
    setThemeMode(isDark ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, mode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};
