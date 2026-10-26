"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  settings?: Record<string, any>;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserSettings: (settings: Record<string, any>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const PROTECTED_PREFIXES = ["/history", "/glossary", "/settings"];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const syncSettingsToLocal = (settings?: Record<string, any>) => {
    if (settings && Object.keys(settings).length > 0 && typeof window !== "undefined") {
      try {
        const existingRaw = localStorage.getItem("barbar_user_settings");
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        localStorage.setItem(
          "barbar_user_settings",
          JSON.stringify({ ...existing, ...settings })
        );
      } catch {
        // ignore storage errors
      }
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data.authenticated && data.user) {
        setUser(data.user);
        syncSettingsToLocal(data.user.settings);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Սխալ էլ․ փոստ կամ գաղտնաբառ։",
        };
      }
      setUser(data.user);
      syncSettingsToLocal(data.user?.settings);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Մուտք գործելու ժամանակ տեղի ունեցավ սխալ։",
      };
    }
  };

  const register = async (fullName: string, email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || "Գրանցման ժամանակ տեղի ունեցավ սխալ։",
        };
      }
      setUser(data.user);
      syncSettingsToLocal(data.user?.settings);
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || "Գրանցման ժամանակ տեղի ունեցավ սխալ։",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      const isOnProtected = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );
      if (isOnProtected) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      } else {
        router.refresh();
      }
    }
  };

  const updateUserSettings = async (settings: Record<string, any>) => {
    syncSettingsToLocal(settings);
    if (!user) return;
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch {
      // ignore network error
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateUserSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

