"use client";

import { useState, type ReactNode } from "react";
import { OwnerSidebar } from "./owner-sidebar";
import { OwnerTopbar } from "./owner-topbar";

const EASE = "cubic-bezier(0.2,0.8,0.2,1)";

interface OwnerShellProps {
  children: ReactNode;
  activeItem?: string;
}

export function OwnerShell({ children, activeItem = "dashboard" }: OwnerShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div
      className="grid h-screen overflow-hidden bg-[var(--background)] transition-[grid-template-columns] duration-[220ms] motion-reduce:transition-none"
      style={{
        gridTemplateColumns: sidebarCollapsed ? "72px minmax(0, 1fr)" : "260px minmax(0, 1fr)",
        transitionTimingFunction: EASE,
      }}
    >
      <OwnerSidebar collapsed={sidebarCollapsed} activeItem={activeItem} />
      <div className="flex min-h-0 flex-col min-w-0">
        <OwnerTopbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto px-6 py-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
