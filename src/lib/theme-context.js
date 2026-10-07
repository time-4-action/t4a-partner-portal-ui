"use client";
/**
 * Theme provider — the portal twin of t4a-admin's lib/theme-context.tsx, so
 * both apps share the same three-way light / system / dark behaviour.
 *
 * The inline <head> script (src/lib/theme.js) applies `.dark` before paint;
 * this provider keeps React in sync with the persisted choice, follows the OS
 * live while the choice is "system", and re-applies the class on change.
 */
import { createContext, useCallback, useContext, useEffect, useRef, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const ThemeContext = createContext(null);

// External store: localStorage + the OS media query. Components subscribe via
// useSyncExternalStore so there is no post-hydration setState dance.
const listeners = new Set();
const notify = () => listeners.forEach((l) => l());

function subscribe(listener) {
  listeners.add(listener);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    mq.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
  };
}

// In-memory fallback for when localStorage is blocked (private mode etc.).
let memoryTheme = "system";
function readTheme() {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return memoryTheme;
  }
}

function resolveTheme(theme) {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const readResolved = () => resolveTheme(readTheme());

let transitionTimer;
function applyResolved(resolved, animate) {
  const root = document.documentElement;
  if (animate) {
    // One short colour cross-fade (globals.css `html.theme-transition`).
    root.classList.add("theme-transition");
    window.clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => root.classList.remove("theme-transition"), 350);
  }
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "system");
  const resolved = useSyncExternalStore(subscribe, readResolved, () => "light");
  const mounted = useRef(false);

  // Mirror the resolved theme onto <html>. On first run the bootstrap script
  // already did this, so it is a no-op; later runs (user choice, OS change)
  // animate.
  useEffect(() => {
    applyResolved(resolved, mounted.current);
    mounted.current = true;
  }, [resolved]);

  const setTheme = useCallback((next) => {
    memoryTheme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* localStorage may be blocked — the choice just won't persist */
    }
    notify();
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
