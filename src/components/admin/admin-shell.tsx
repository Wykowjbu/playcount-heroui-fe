"use client";
import { useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <AdminSidebar collapsed={sidebarCollapsed} activeItem="overview" />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <AdminTopbar onToggleSidebar={toggleSidebar} sidebarCollapsed={sidebarCollapsed} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-auto px-6 py-6 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
