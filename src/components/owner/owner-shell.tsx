"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
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
      className="grid min-h-screen grid-cols-1 bg-[var(--background)] transition-[grid-template-columns] duration-[220ms] motion-reduce:transition-none lg:h-screen lg:overflow-hidden lg:[grid-template-columns:var(--owner-sidebar-width)_minmax(0,1fr)]"
      style={{
        "--owner-sidebar-width": sidebarCollapsed ? "80px" : "248px",
        transitionTimingFunction: EASE,
      } as CSSProperties}
    >
      <OwnerSidebar collapsed={sidebarCollapsed} activeItem={activeItem} />
      <div className="flex min-h-0 flex-col min-w-0">
        <OwnerTopbar activeItem={activeItem} onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />
        <main className="flex-1 overflow-auto px-4 py-6 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
