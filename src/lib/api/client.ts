"use client";

import { toast } from "@heroui/react";

/* ------------------------------------------------------------------ */
/* API CLIENT — centralized fetch with auth, refresh, error handling   */
/* ------------------------------------------------------------------ */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

const API_PREFIX = "/api";

/* ---- Response shapes from BE ---- */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export interface PagedResponse<T = unknown> extends ApiResponse<T> {
  totalCount: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

/* ---- Error ---- */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ---- Token storage ---- */
const AUTH_KEY = "pc_auth";

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  [key: string]: unknown;
}

function getStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  return getStoredAuth()?.accessToken ?? null;
}

function updateTokens(accessToken: string, refreshToken: string) {
  const stored = getStoredAuth();
  if (!stored) return;
  stored.accessToken = accessToken;
  stored.refreshToken = refreshToken;
  localStorage.setItem(AUTH_KEY, JSON.stringify(stored));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

/* ---- Refresh token ---- */
let refreshPromise: Promise<boolean> | null = null;

async function tryRefreshToken(): Promise<boolean> {
  const stored = getStoredAuth();
  if (!stored?.refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}${API_PREFIX}/Auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: stored.refreshToken }),
    });
    const body = await res.json().catch(() => null);
    if (res.ok && body?.success && body?.data) {
      updateTokens(body.data.accessToken, body.data.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/* ---- Normalize error message from BE response ---- */
export function normalizeErrorMessage(body: ApiResponse): string {
  if (body.errors?.length) return body.errors.join("; ");
  if (body.message) return body.message;
  return "Đã xảy ra lỗi không xác định";
}

/* ---- Core fetch ---- */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; notify?: boolean } = {},
): Promise<ApiResponse<T>> {
  const request = executeApiFetch<T>(path, options);
  const method = (options.method ?? "GET").toUpperCase();

  if (options.notify !== false && method !== "GET" && method !== "HEAD" && typeof window !== "undefined") {
    const deleting = method === "DELETE";
    toast.promise(request, {
      loading: deleting ? "Đang xóa…" : "Đang lưu thay đổi…",
      success: (response) => response.message || (deleting ? "Đã xóa" : "Đã lưu thay đổi"),
      error: (error) => error.message || "Không thể hoàn tất thao tác",
    });
  }

  return request;
}

async function executeApiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; notify?: boolean },
): Promise<ApiResponse<T>> {
  const { skipAuth, ...fetchOpts } = options;
  delete fetchOpts.notify;
  const url = `${API_PREFIX}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOpts.headers as Record<string, string>),
  };

  // Auto-attach auth token
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let res = await fetch(`${API_BASE}${url}`, { ...fetchOpts, headers });

  // Handle 401 — try refresh once
  if (res.status === 401 && !skipAuth) {
    if (!refreshPromise) {
      refreshPromise = tryRefreshToken();
    }
    const refreshed = await refreshPromise;
    refreshPromise = null;

    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        res = await fetch(`${API_BASE}${url}`, { ...fetchOpts, headers });
      }
    } else {
      clearAuth();
      // Redirect to login if on client
      if (typeof window !== "undefined") {
        const current = window.location.pathname;
        if (!current.startsWith("/login") && !current.startsWith("/register")) {
          window.location.href = `/login?redirectTo=${encodeURIComponent(current)}`;
        }
      }
      throw new ApiError(401, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }
  }

  const body: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    message: res.statusText,
    data: null,
    errors: [res.statusText],
  }));

  if (!body.success) {
    throw new ApiError(res.status, normalizeErrorMessage(body), body.errors);
  }

  return body;
}

/* ---- Paged fetch ---- */
export async function apiFetchPaged<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<PagedResponse<T>> {
  const url = `${API_PREFIX}${path}`;
  const { skipAuth, ...fetchOpts } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(fetchOpts.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${url}`, { ...fetchOpts, headers });
  const body: PagedResponse<T> = await res.json().catch(() => ({
    success: false,
    message: res.statusText,
    data: null,
    errors: [res.statusText],
    totalCount: 0,
    totalPages: 0,
    pageIndex: 1,
    pageSize: 10,
  }));

  if (!body.success) {
    throw new ApiError(res.status, normalizeErrorMessage(body), body.errors);
  }

  return body;
}

/* ---- Helpers ---- */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val != null && val !== "") {
      qs.set(key, String(val));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}
