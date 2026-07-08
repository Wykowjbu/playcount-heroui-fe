const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5187/api";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: string[] = [],
  ) {
    super(message);
  }
}

/* ------------------------------------------------------------------ */
/* FETCH WRAPPER                                                       */
/* ------------------------------------------------------------------ */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(url, { ...options, headers });
  const body: ApiResponse<T> = await res.json().catch(() => ({
    success: false,
    message: res.statusText,
    data: null,
    errors: [res.statusText],
  }));

  if (!body.success) {
    throw new ApiError(
      res.status,
      body.message || "Request failed",
      body.errors,
    );
  }

  return body;
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
