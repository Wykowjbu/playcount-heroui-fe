"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button, Separator, cn } from "@heroui/react";

import House from "@gravity-ui/icons/House";
import ListCheck from "@gravity-ui/icons/ListCheck";
import PersonGear from "@gravity-ui/icons/PersonGear";
import Tags from "@gravity-ui/icons/Tags";
import Wrench from "@gravity-ui/icons/Wrench";
import ArrowRightToSquare from "@gravity-ui/icons/ArrowRightToSquare";
import ArrowRightFromSquare from "@gravity-ui/icons/ArrowRightFromSquare";

import { useAuth } from "@/lib/auth-context";

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

const EASE = "cubic-bezier(0.2,0.8,0.2,1)";

function SidebarLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "min-w-0 flex-1 truncate whitespace-nowrap text-left",
        "transition-[max-width,opacity,transform] duration-[180ms] motion-reduce:transition-none",
        collapsed
          ? "max-w-0 -translate-x-1.5 opacity-0 pointer-events-none"
          : "max-w-[180px] translate-x-0 opacity-100"
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Tổng quan", icon: House, href: "/admin" },
  { id: "venues", label: "Phê duyệt cơ sở", icon: ListCheck, href: "/admin/venues" },
  { id: "owners", label: "Xác minh chủ sân", icon: PersonGear, href: "/admin/court-owners" },
  { id: "sports", label: "Môn thể thao", icon: Tags, href: "/admin/sports" },
  { id: "amenities", label: "Tiện ích", icon: Wrench, href: "/admin/amenities" },
];

const FOOTER_ITEMS = [
  { id: "home", label: "Về trang chính", icon: ArrowRightFromSquare, href: "/" },
  { id: "logout", label: "Đăng xuất", icon: ArrowRightToSquare, className: "text-[var(--danger)]" },
];

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

interface AdminSidebarProps {
  collapsed: boolean;
}

export function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  function isActive(item: NavItem): boolean {
    if (item.id === "overview") return pathname === "/admin";
    return pathname.startsWith(item.href);
  }

  return (
    <aside
      className={cn(
        "h-full overflow-hidden",
        "border-r border-[var(--border)] bg-[var(--background)]"
      )}
    >
      <div className="px-3 py-4">
        {/* Header */}
        <div className={cn(
          "flex items-center transition-[gap] duration-[180ms] motion-reduce:transition-none",
          collapsed ? "justify-center gap-0" : "gap-3"
        )}
        style={{ transitionTimingFunction: EASE }}
        >
          <Avatar size="sm">
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-[180ms] motion-reduce:transition-none",
              collapsed
                ? "max-w-0 -translate-x-1.5 opacity-0"
                : "max-w-[180px] translate-x-0 opacity-100"
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <p className="text-sm font-semibold whitespace-nowrap">Admin</p>
            <p className="text-xs text-[var(--muted)] whitespace-nowrap">Quản trị viên</p>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Admin navigation" className="flex flex-col gap-1 mt-4">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "relative flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                  "transition-[background-color,color,padding,gap] duration-[180ms] motion-reduce:transition-none",
                  collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                  active && "bg-[var(--surface-secondary)] font-semibold",
                  !active && "hover:bg-[var(--surface-secondary)]/50"
                )}
                style={{ transitionTimingFunction: EASE }}
                aria-current={active ? "page" : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <Separator className="my-3" />
        <nav aria-label="Footer navigation" className="flex flex-col gap-1">
          {FOOTER_ITEMS.map((item) => {
            if (item.id === "logout") {
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onPress={() => logout()}
                  className={cn(
                    "relative flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                    "transition-[background-color,color,padding,gap] duration-[180ms] motion-reduce:transition-none",
                    collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                    "hover:bg-[var(--surface-secondary)]/50",
                    item.className
                  )}
                  style={{ transitionTimingFunction: EASE }}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
                </Button>
              );
            }
            return (
              <Link
                key={item.id}
                href={item.href!}
                className={cn(
                  "relative flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                  "transition-[background-color,color,padding,gap] duration-[180ms] motion-reduce:transition-none",
                  collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                  "hover:bg-[var(--surface-secondary)]/50"
                )}
                style={{ transitionTimingFunction: EASE }}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
