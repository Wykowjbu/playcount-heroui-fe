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
      className="fixed bottom-3 left-3 right-3 z-50 rounded-2xl border border-border bg-surface/95 shadow-lg backdrop-blur-xl md:hidden"
      aria-label="Điều hướng nhanh"
    >
      <div className="flex h-14 items-center justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-[10px] font-medium transition-colors",
                active
                  ? "bg-accent/10 text-accent"
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
