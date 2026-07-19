"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@heroui/react";
import { OwnerSidebar } from "./owner-sidebar";
import { OwnerTopbar } from "./owner-topbar";
import { getMyCourtOwnerProfile } from "@/lib/api/owner";

const EASE = "cubic-bezier(0.2,0.8,0.2,1)";

interface OwnerShellProps {
  children: ReactNode;
  activeItem?: string;
}

export function OwnerShell({ children, activeItem = "dashboard" }: OwnerShellProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ownerStatus, setOwnerStatus] = useState<string | null>(null);
  const [statusLoaded, setStatusLoaded] = useState(false);
  const operationalPage = ["venues", "bookings", "reviews"].includes(activeItem);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  useEffect(() => {
    getMyCourtOwnerProfile()
      .then((profile) => setOwnerStatus(profile.verificationStatus))
      .catch(() => setOwnerStatus(null))
      .finally(() => setStatusLoaded(true));
  }, []);

  useEffect(() => {
    if (statusLoaded && operationalPage && ownerStatus !== "Approved") router.replace("/owner");
  }, [ownerStatus, operationalPage, router, statusLoaded]);

  return (
    <div
      className="grid min-h-screen grid-cols-1 bg-[var(--background)] transition-[grid-template-columns] duration-[220ms] motion-reduce:transition-none lg:h-screen lg:overflow-hidden lg:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
      style={{
        "--owner-sidebar-width": sidebarCollapsed ? "80px" : "248px",
        transitionTimingFunction: EASE,
      } as CSSProperties}
    >
      <OwnerSidebar collapsed={sidebarCollapsed} activeItem={activeItem} ownerStatus={ownerStatus} />
      <div className="flex min-h-0 flex-col min-w-0">
        <OwnerTopbar activeItem={activeItem} ownerStatus={ownerStatus} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto px-4 py-6 pb-8 sm:px-6 lg:px-8">
          {operationalPage && (!statusLoaded || ownerStatus !== "Approved")
            ? <div className="flex min-h-64 items-center justify-center"><Spinner aria-label="Đang kiểm tra trạng thái hồ sơ" /></div>
            : children}
        </main>
      </div>
    </div>
  );
}
