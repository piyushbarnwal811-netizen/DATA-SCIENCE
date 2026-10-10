import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ccr_user") || "null");
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("ccr_token")));

  const acceptSession = useCallback((data) => {
    localStorage.setItem("ccr_token", data.token);
    localStorage.setItem("ccr_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await api.post("/auth/login", credentials);
    return acceptSession(data);
  }, [acceptSession]);

  const register = useCallback(async (details) => {
    const { data } = await api.post("/auth/register", details);
    return acceptSession(data);
  }, [acceptSession]);

  const logout = useCallback(() => {
    localStorage.removeItem("ccr_token");
    localStorage.removeItem("ccr_user");
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("ccr_token");
    if (!token) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    api.get("/auth/me")
      .then(({ data }) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem("ccr_user", JSON.stringify(data.user));
      })
      .catch(() => {
        if (active) logout();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [logout]);

  useEffect(() => {
    const clearSession = () => setUser(null);
    window.addEventListener("ccr:unauthorized", clearSession);
    return () => window.removeEventListener("ccr:unauthorized", clearSession);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}