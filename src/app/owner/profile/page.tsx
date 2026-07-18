"use client";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { ProfilePageShell } from "@/components/profile/ProfilePageShell";

export default function OwnerProfilePage() {
  return (
    <OwnerGuard>
      <OwnerShell activeItem="profile">
        <div className="mx-auto max-w-[1180px]">
          <h1 className="mb-6 text-2xl font-bold tracking-tight sm:text-[28px]">Hồ sơ</h1>
        <ProfilePageShell role="owner" />
        </div>
      </OwnerShell>
    </OwnerGuard>
  );
}
