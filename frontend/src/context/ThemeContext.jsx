import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ThemeContext = createContext(null);

// Routes rendered by PublicLayout (see App.jsx) - Home, Login, Register,
// Privacy, Terms. These must always render in the app's default light
// theme, independent of any signed-in user's saved preference.
const PUBLIC_PATHS = new Set(["/", "/home", "/login", "/register", "/privacy", "/terms"]);

function shouldApplyDark(theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return theme === "dark" || (theme === "system" && prefersDark);
}

export function ThemeProvider({ children }) {
  const { user, status } = useAuth();
  const location = useLocation();

  // `theme` is the signed-in user's saved/staged preference - it is what
  // the Settings page reads and writes. It is intentionally NOT cleared on
  // logout, so the same preference is restored the next time they sign
  // back in (per spec: don't erase the saved preference on logout).
  const [theme, setTheme] = useState(() => localStorage.getItem("bb-theme") || "light");

  useEffect(() => {
    if (user?.preferences?.theme) setTheme(user.preferences.theme);
  }, [user]);

  useEffect(() => {
    localStorage.setItem("bb-theme", theme);
  }, [theme]);

  const isPublicRoute = PUBLIC_PATHS.has(location.pathname);

  // The theme actually painted on <html> is derived from BOTH the route and
  // confirmed auth status, not from `theme` alone:
  //  - Public routes (Home/Login/Register/Privacy/Terms) are always light,
  //    even for a signed-in visitor with a saved dark preference.
  //  - Protected routes only ever go dark once `status` is confirmed
  //    "authenticated" - while status is "loading" (e.g. right after a
  //    refresh, before we know if the session is valid) they stay light.
  // Deriving this from route + status - rather than flipping a class only
  // on the logout button - is what actually prevents the "old dark class
  // leaks onto the public pages" race described in the brief: it can't
  // leak, because the class is recomputed from where you ARE, every time.
  const effectiveTheme = !isPublicRoute && status === "authenticated" ? theme : "light";
  const isDark = shouldApplyDark(effectiveTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const value = useMemo(() => ({ theme, setTheme, isDark }), [theme, isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
