"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "./api/client";
import { type Role, getHomeForRole, normalizeRole, safeRedirectTo } from "./utils/redirect";

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  fullName: string;
  avatar?: string;
  accessToken: string;
  refreshToken: string;
}

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: "CourtOwner" | "Player";
  businessName?: string;
}

/* ---- API response shapes ---- */
interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refreshTokenExpiresAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    role: string;
    status: string;
    isEmailVerified: boolean;
  };
}

interface RegisterResponseData {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  businessName: string | null;
}

/* ------------------------------------------------------------------ */
/* CONTEXT VALUE                                                       */
/* ------------------------------------------------------------------ */
export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  loginWithRedirect: (payload: LoginPayload, redirectTo?: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "pc_auth";

function loadStored(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as AuthUser;
    return { ...stored, role: normalizeRole(stored.role) };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* PROVIDER                                                            */
/* ------------------------------------------------------------------ */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = loadStored();
    setUser(stored);
    setIsLoading(false);
  }, []);

  const persist = useCallback((u: AuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  /* ---- LOGIN ---- */
  const login = useCallback(
    async ({ identifier, password }: LoginPayload) => {
      const res = await apiFetch<LoginResponseData>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
        skipAuth: true,
      });

      const d = res.data!;
      const u: AuthUser = {
        id: d.user.id,
        email: d.user.email,
        role: normalizeRole(d.user.role),
        fullName: d.user.fullName,
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
      };
      persist(u);

      const dest = getHomeForRole(u.role);
      router.push(dest);
    },
    [persist, router],
  );

  /* ---- LOGIN WITH REDIRECT ---- */
  const loginWithRedirect = useCallback(
    async ({ identifier, password }: LoginPayload, redirectTo?: string) => {
      const res = await apiFetch<LoginResponseData>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
        skipAuth: true,
      });

      const d = res.data!;
      const u: AuthUser = {
        id: d.user.id,
        email: d.user.email,
        role: normalizeRole(d.user.role),
        fullName: d.user.fullName,
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
      };
      persist(u);

      if (u.role === "admin") {
        router.push("/admin");
        return;
      }
      if (u.role === "owner") {
        router.push("/owner");
        return;
      }
      // Player: safe redirect or stay
      const safe = safeRedirectTo(redirectTo);
      router.push(safe);
    },
    [persist, router],
  );

  /* ---- REGISTER ---- */
  const register = useCallback(
    async (payload: RegisterPayload) => {
      await apiFetch<RegisterResponseData>("/Auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
        skipAuth: true,
      });
      router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
    },
    [router],
  );

  /* ---- LOGOUT ---- */
  const logout = useCallback(() => {
    // Fire-and-forget server logout
    const stored = loadStored();
    if (stored?.refreshToken) {
      apiFetch("/Auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: stored.refreshToken }),
        skipAuth: true,
      }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    window.location.replace("/");
  }, []);

  /* ---- REFRESH USER (re-fetch /Users/me) ---- */
  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{
        id: number;
        fullName: string;
        email: string;
        role: string;
        avatarUrl?: string;
      }>("/Users/me");
      if (res.data) {
        const stored = loadStored();
        if (!stored) return;
        const updated: AuthUser = {
          ...stored,
          id: res.data.id,
          email: res.data.email,
          fullName: res.data.fullName,
          role: normalizeRole(res.data.role),
          avatar: res.data.avatarUrl,
        };
        persist(updated);
      }
    } catch {
      // Token might be expired; client handles 401 redirect
    }
  }, [persist]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, loginWithRedirect, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* HOOKS                                                               */
/* ------------------------------------------------------------------ */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

/* Re-export for convenience */
export { type Role, getHomeForRole, normalizeRole, safeRedirectTo } from "./utils/redirect";
