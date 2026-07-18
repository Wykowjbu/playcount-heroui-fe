"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Button, Separator, cn } from "@heroui/react";
import type { ReactNode } from "react";
import House from "@gravity-ui/icons/House";
import MapPin from "@gravity-ui/icons/MapPin";
import Calendar from "@gravity-ui/icons/Calendar";
import Star from "@gravity-ui/icons/Star";
import Gear from "@gravity-ui/icons/Gear";
import ArrowRightFromSquare from "@gravity-ui/icons/ArrowRightFromSquare";
import ArrowRightToSquare from "@gravity-ui/icons/ArrowRightToSquare";
import { useAuth } from "@/lib/auth-context";

const EASE = "cubic-bezier(0.2,0.8,0.2,1)";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Tổng quan", icon: House, href: "/owner" },
  { id: "venues", label: "Cơ sở của tôi", icon: MapPin, href: "/owner/venues" },
  { id: "bookings", label: "Đơn đặt sân", icon: Calendar, href: "/owner/bookings" },
  { id: "reviews", label: "Đánh giá", icon: Star, href: "/owner/reviews" },
];

const FOOTER_ITEMS: NavItem[] = [
  { id: "profile", label: "Hồ sơ", icon: Gear, href: "/owner/profile" },
  { id: "home", label: "Về trang chính", icon: ArrowRightFromSquare, href: "/" },
];

interface SidebarProps {
  collapsed: boolean;
  activeItem?: string;
  mobile?: boolean;
}

function SidebarLabel({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "min-w-0 flex-1 truncate whitespace-nowrap text-left",
        "transition-[max-width,opacity,transform] duration-[180ms] motion-reduce:transition-none",
        collapsed
          ? "max-w-0 -translate-x-1.5 opacity-0 pointer-events-none"
          : "max-w-[180px] translate-x-0 opacity-100",
      )}
      style={{ transitionTimingFunction: EASE }}
    >
      {children}
    </span>
  );
}

export function OwnerSidebar({ collapsed, activeItem, mobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  function isActiveItem(item: NavItem): boolean {
    if (item.href === "/owner") return pathname === "/owner";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return (
    <aside className={cn("h-full overflow-hidden bg-[var(--background)]", !mobile && "hidden border-r border-[var(--border)] lg:block")}>
      <div className="px-3 py-4">
        {/* Header */}
        <div
          className={cn(
            "flex items-center transition-[gap] duration-[180ms] motion-reduce:transition-none",
            collapsed ? "justify-center gap-0" : "gap-3",
          )}
          style={{ transitionTimingFunction: EASE }}
        >
          <Avatar size="sm">
            <Avatar.Fallback>
              {user?.fullName?.charAt(0)?.toUpperCase() ?? "O"}
            </Avatar.Fallback>
          </Avatar>
          <div
            className={cn(
              "min-w-0 overflow-hidden transition-[max-width,opacity,transform] duration-[180ms] motion-reduce:transition-none",
              collapsed
                ? "max-w-0 -translate-x-1.5 opacity-0"
                : "max-w-[180px] translate-x-0 opacity-100",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <p className="text-sm font-semibold whitespace-nowrap truncate">
              {user?.fullName ?? "Owner"}
            </p>
            <p className="text-xs text-[var(--muted)] whitespace-nowrap">Chủ sân</p>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Owner navigation" className="flex flex-col gap-1 mt-4">
          {NAV_ITEMS.map((item) => {
            const active = isActiveItem(item) || activeItem === item.id;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                  "transition-[background-color,color,padding,gap] duration-[180ms] motion-reduce:transition-none",
                  collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                  active && "bg-[var(--surface-secondary)] font-semibold",
                  !active && "hover:bg-[var(--surface-secondary)]/50",
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

        <Separator className="my-3" />

        {/* Footer */}
        <nav aria-label="Footer navigation" className="flex flex-col gap-1">
          {FOOTER_ITEMS.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                "transition-[background-color,color] duration-[180ms] motion-reduce:transition-none",
                collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                "hover:bg-[var(--surface-secondary)]/50",
              )}
              style={{ transitionTimingFunction: EASE }}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
            </Link>
          ))}
          <Button
            variant="ghost"
            onPress={logout}
            className={cn(
              "flex min-h-11 w-full items-center rounded-xl text-sm text-[var(--danger)]",
              "transition-[background-color,color] duration-[180ms] motion-reduce:transition-none",
              collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
              "hover:bg-[var(--danger)]/10",
            )}
            style={{ transitionTimingFunction: EASE }}
          >
            <ArrowRightToSquare className="w-5 h-5 shrink-0" />
            <SidebarLabel collapsed={collapsed}>Đăng xuất</SidebarLabel>
          </Button>
        </nav>
      </div>
    </aside>
  );
}
