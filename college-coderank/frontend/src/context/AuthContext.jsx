"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session safely in browser
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("ccr_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore JSON parse or storage errors
    }
  }, []);

  const acceptSession = useCallback((data) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ccr_token", data.token);
      localStorage.setItem("ccr_user", JSON.stringify(data.user));
    }
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const { data } = await api.post("/auth/login", credentials);
      if (data.status === "FORCE_PASSWORD_CHANGE" || data.must_change_password) {
        if (typeof window !== "undefined") {
          localStorage.setItem("ccr_token", data.token);
          localStorage.setItem("ccr_user", JSON.stringify(data.user));
        }
        setUser(data.user);
        return { ...data.user, status: "FORCE_PASSWORD_CHANGE", must_change_password: true };
      }
      return acceptSession(data);
    } catch (error) {
      if (error.response?.status === 404) {
        const { data } = await api.post("/login", credentials);
        return acceptSession(data);
      }
      throw error;
    }
  }, [acceptSession]);

  const forceChangePassword = useCallback(async ({ currentPassword, newPassword, confirmPassword }) => {
    const { data } = await api.post("/auth/force-change-password", {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
    return acceptSession(data);
  }, [acceptSession]);

  const register = useCallback(async (details) => {
    try {
      const { data } = await api.post("/auth/register", details);
      return acceptSession(data);
    } catch (error) {
      if (error.response?.status === 404) {
        try {
          const { data } = await api.post("/students/register", details);
          return acceptSession(data);
        } catch (innerError) {
          if (innerError.response?.status === 404) {
            const { data } = await api.post("/students", details);
            return acceptSession(data);
          }
          throw innerError;
        }
      }
      throw error;
    }
  }, [acceptSession]);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("ccr_token");
      localStorage.removeItem("ccr_user");
    }
    setUser(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
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
    if (typeof window === "undefined") return;
    const clearSession = () => setUser(null);
    window.addEventListener("ccr:unauthorized", clearSession);
    return () => window.removeEventListener("ccr:unauthorized", clearSession);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, forceChangePassword }),
    [user, loading, login, register, logout, forceChangePassword]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}