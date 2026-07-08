"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiError } from "./api";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
type Role = "admin" | "owner" | "player";

interface User {
  id: number;
  email: string;
  role: Role;
  fullName: string;
  avatar?: string;
  accessToken: string;
  refreshToken: string;
}

export type AuthUser = User;

interface LoginPayload {
  identifier: string;
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role?: "Owner" | "Player";
  businessName?: string;
}

/* ------------------------------------------------------------------ */
/* API RESPONSE TYPES                                                  */
/* ------------------------------------------------------------------ */
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
interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "pc_auth";

function loadStored(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* PROVIDER                                                            */
/* ------------------------------------------------------------------ */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(loadStored());
    setIsLoading(false);
  }, []);

  const persist = useCallback((u: User) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  /* ---- LOGIN ---- */
  const login = useCallback(
    async ({ identifier, password }: LoginPayload) => {
      const res = await apiFetch<LoginResponseData>("/Auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });

      const d = res.data!;
      const u: User = {
        id: d.user.id,
        email: d.user.email,
        role: d.user.role.toLowerCase() as Role,
        fullName: d.user.fullName,
        accessToken: d.accessToken,
        refreshToken: d.refreshToken,
      };
      persist(u);
      router.push(getHomeForRole(u.role));
    },
    [persist, router],
  );

  /* ---- REGISTER ---- */
  const register = useCallback(
    async (payload: RegisterPayload) => {
      await apiFetch<RegisterResponseData>("/Auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push("/verify-email");
    },
    [router],
  );

  /* ---- LOGOUT ---- */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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

export function getHomeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "owner") return "/owner";
  return "/player";
}
