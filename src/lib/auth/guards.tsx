"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Spinner } from "@heroui/react";
import { useAuth } from "@/lib/auth-context";
import { type Role, getHomeForRole } from "@/lib/utils/redirect";

/* ------------------------------------------------------------------ */
/* ROLE GUARD — protects routes by role                                */
/* ------------------------------------------------------------------ */

interface RoleGuardProps {
  /** Allowed roles. If empty, any authenticated user can access. */
  allowedRoles?: Role[];
  /** Where to redirect if not authenticated */
  loginRedirect?: string;
  children: ReactNode;
}

export function RoleGuard({
  allowedRoles,
  loginRedirect = "/login",
  children,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → redirect to login
    if (!user) {
      router.replace(`${loginRedirect}?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    // Logged in but wrong role → redirect to their home
    if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
      router.replace(getHomeForRole(user.role));
      return;
    }
  }, [user, isLoading, allowedRoles, router, pathname, loginRedirect]);

  // Show loading while checking
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not authenticated
  if (!user) return null;

  // Wrong role
  if (allowedRoles?.length && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}

/* ---- Convenience wrappers ---- */
export function AdminGuard({ children }: { children: ReactNode }) {
  return <RoleGuard allowedRoles={["admin"]}>{children}</RoleGuard>;
}

export function OwnerGuard({ children }: { children: ReactNode }) {
  return <RoleGuard allowedRoles={["owner"]}>{children}</RoleGuard>;
}

export function PlayerGuard({ children }: { children: ReactNode }) {
  return <RoleGuard allowedRoles={["player"]}>{children}</RoleGuard>;
}

export function AuthGuard({ children }: { children: ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}

/* Re-export for convenience */
export { getHomeForRole, safeRedirectTo } from "@/lib/utils/redirect";
