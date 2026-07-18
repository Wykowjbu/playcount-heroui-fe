"use client";
import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

const EASE = "cubic-bezier(0.2,0.8,0.2,1)";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div
      className="grid h-screen overflow-hidden bg-[var(--background)] transition-[grid-template-columns] duration-[220ms] motion-reduce:transition-none"
      style={{
        gridTemplateColumns: sidebarCollapsed ? "72px minmax(0, 1fr)" : "240px minmax(0, 1fr)",
        transitionTimingFunction: EASE,
      }}
    >
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} />

      {/* Main content area */}
      <div className="flex min-h-0 flex-col min-w-0">
        {/* Topbar */}
        <AdminTopbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto px-6 py-5 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
