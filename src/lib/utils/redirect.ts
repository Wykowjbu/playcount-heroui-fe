/* ------------------------------------------------------------------ */
/* REDIRECT HELPERS — shared by auth-context and guards               */
/* ------------------------------------------------------------------ */

export type Role = "admin" | "owner" | "player";

export function normalizeRole(role: string): Role {
  if (["courtowner", "owner"].includes(role.toLowerCase())) return "owner";
  if (role.toLowerCase() === "admin") return "admin";
  return "player";
}

export function getHomeForRole(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "owner") return "/owner";
  return "/";
}

export function safeRedirectTo(redirectTo?: string | null): string {
  if (!redirectTo) return "/";
  if (!redirectTo.startsWith("/")) return "/";
  if (
    redirectTo === "/login" ||
    redirectTo === "/register" ||
    redirectTo.startsWith("/register/") ||
    redirectTo.startsWith("/verify-email") ||
    redirectTo.startsWith("/reset-password")
  ) {
    return "/";
  }
  return redirectTo;
}
