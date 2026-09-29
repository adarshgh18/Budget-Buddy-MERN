import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authService from "../services/authService";
import { getErrorMessage } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authService.getMe();
        if (!cancelled) {
          setUser(res.data.data.user);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (payload) => {
    setError("");
    const res = await authService.login(payload);
    setUser(res.data.data.user);
    setStatus("authenticated");
    return res.data.data.user;
  };

  const register = async (payload) => {
    setError("");
    const res = await authService.register(payload);
    setUser(res.data.data.user);
    setStatus("authenticated");
    return res.data.data.user;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
    }
  };

  const refreshUser = async () => {
    const res = await authService.getMe();
    setUser(res.data.data.user);
    return res.data.data.user;
  };

  const value = useMemo(
    () => ({
      user,
      status,
      error,
      setError,
      isAuthenticated: status === "authenticated",
      loading: status === "loading",
      login,
      register,
      logout,
      refreshUser,
      getErrorMessage,
    }),
    [user, status, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
