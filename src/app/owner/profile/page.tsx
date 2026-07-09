"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/layout/site-header";
import { ProfilePageShell } from "@/components/profile/ProfilePageShell";

export default function OwnerProfilePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (user.role === "player") {
      router.replace("/player/profile");
      return;
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--background)" }}>
        <SiteHeader />
        <main className="mx-auto max-w-[1180px] px-4 py-8">
          <ProfilePageShellSkeleton />
        </main>
      </div>
    );
  }

  if (!user || user.role !== "owner") return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <ProfilePageShell role="owner" />
      </main>
    </div>
  );
}

function ProfilePageShellSkeleton() {
  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="w-full lg:w-[320px] shrink-0">
        <div
          className="rounded-2xl border border-border p-6 space-y-4"
          style={{ background: "var(--surface)" }}
        >
          <div className="mx-auto w-[72px] h-[72px] rounded-full" style={{ background: "var(--surface-secondary)" }} />
          <div className="h-4 w-3/5 mx-auto rounded-lg" style={{ background: "var(--surface-secondary)" }} />
          <div className="h-3 w-2/5 mx-auto rounded-lg" style={{ background: "var(--surface-secondary)" }} />
          <div className="space-y-2 pt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-3 w-full rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 lg:max-w-[760px]">
        <div
          className="rounded-2xl border border-border p-5 sm:p-6 lg:p-7 space-y-4"
          style={{ background: "var(--surface)" }}
        >
          <div className="flex gap-2 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            ))}
          </div>
          <div className="max-w-[640px] space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-11 w-full rounded-lg" style={{ background: "var(--surface-secondary)" }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
