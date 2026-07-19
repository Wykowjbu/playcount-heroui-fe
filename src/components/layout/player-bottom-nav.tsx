"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@heroui/react";
import { MapPin, Persons, Calendar, Person } from "@gravity-ui/icons";

const NAV_ITEMS = [
  { href: "/venues", label: "Sân bãi", icon: MapPin },
  { href: "/matches", label: "Kèo đấu", icon: Persons },
  { href: "/player/bookings", label: "Lịch đặt", icon: Calendar },
  { href: "/player/profile", label: "Tôi", icon: Person },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/matches" && pathname === "/player/matches") return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlayerBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border"
      style={{ background: "var(--surface)" }}
      aria-label="Điều hướng nhanh"
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-[56px]",
                active
                  ? "text-accent"
                  : "text-muted hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
