"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Button,
  Avatar,
  Dropdown,
  Drawer,
  cn,
} from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import ArrowRightFromSquare from "@gravity-ui/icons/ArrowRightFromSquare";
import ArrowRightToSquare from "@gravity-ui/icons/ArrowRightToSquare";
import Bars from "@gravity-ui/icons/Bars";
import ChevronDown from "@gravity-ui/icons/ChevronDown";
import CircleQuestion from "@gravity-ui/icons/CircleQuestion";
import Gear from "@gravity-ui/icons/Gear";
import Person from "@gravity-ui/icons/Person";
import Shield from "@gravity-ui/icons/Shield";
import Star from "@gravity-ui/icons/Star";
import { useAuth } from "@/lib/auth-context";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */
type HeaderAuthState = "guest" | "player" | "owner" | "admin";

/* ------------------------------------------------------------------ */
/* CONFIG                                                              */
/* ------------------------------------------------------------------ */
type NavItem = { href: string; label: string };

const GUEST_NAV: NavItem[] = [
  { href: "/#courts", label: "Sân bãi" },
  { href: "/#matches", label: "Kèo đấu" },
];

const PLAYER_NAV: NavItem[] = [
  { href: "/venues", label: "Sân bãi" },
  { href: "/matches", label: "Kèo đấu" },
  { href: "/player/bookings", label: "Lịch đặt" },
  { href: "/player/favorites", label: "Yêu thích" },
];

const OWNER_NAV: NavItem[] = [
  { href: "/owner/venues", label: "Quản lý sân" },
  { href: "/owner/bookings", label: "Đơn đặt" },
  { href: "/owner/reviews", label: "Đánh giá" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/court-owners", label: "Chủ sân" },
  { href: "/admin/venues", label: "Quản lý sân" },
  { href: "/admin/amenities", label: "Tiện ích" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/" || href === "/admin") return pathname === href;
  if (href === "/matches" && pathname === "/player/matches") return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getNavItems(auth: HeaderAuthState): NavItem[] {
  if (auth === "player") return PLAYER_NAV;
  if (auth === "owner") return OWNER_NAV;
  if (auth === "admin") return ADMIN_NAV;
  return GUEST_NAV;
}

type DropdownItem = {
  key: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  className?: string;
};

function getDropdownItems(auth: HeaderAuthState): DropdownItem[] {
  if (auth === "guest") {
    return [
      { key: "login", label: "Đăng nhập", icon: ArrowRightFromSquare, href: "/login" },
      { key: "help", label: "Trợ giúp", icon: CircleQuestion, href: "/help" },
    ];
  }
  const items: DropdownItem[] = [];
  if (auth === "player") {
    items.push({ key: "profile", label: "Hồ sơ", icon: Person, href: "/player/profile" });
  } else if (auth === "owner") {
    items.push({ key: "profile", label: "Hồ sơ", icon: Person, href: "/owner/profile" });
  }
  if (auth === "owner") {
    items.push({ key: "venues", label: "Quản lý sân", icon: Star, href: "/owner/venues" });
  }
  if (auth === "player") {
    items.push({ key: "bookings", label: "Lịch đặt", icon: Star, href: "/player/bookings" });
    items.push({ key: "favorites", label: "Yêu thích", icon: Star, href: "/player/favorites" });
  }
  if (auth === "admin") {
    items.push({ key: "amenities", label: "Tiện ích", icon: Shield, href: "/admin/amenities" });
    items.push({ key: "sports", label: "Môn thể thao", icon: Shield, href: "/admin/sports" });
  }
  if (auth !== "admin") {
    items.push({ key: "settings", label: "Cài đặt", icon: Gear, href: auth === "owner" ? "/owner/profile" : "/player/settings" });
  }
  items.push(
    { key: "logout", label: "Đăng xuất", icon: ArrowRightToSquare, className: "text-danger" },
  );
  return items;
}

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */
export function SiteHeader() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const auth: HeaderAuthState = user?.role ?? "guest";
  const navItems = getNavItems(auth);
  const dropdownItems = getDropdownItems(auth);
  const isLoggedIn = auth !== "guest";

  const displayName = user?.fullName ?? user?.email ?? "User";
  const initials = displayName
    .split(" ")
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <>
      <header
        className="sticky top-3 z-50 flex justify-center px-3 pointer-events-none sm:top-4 sm:px-4"
      >
        <nav
          className={cn(
            "pointer-events-auto w-full max-w-5xl flex items-center justify-between gap-3",
            "glass-panel rounded-2xl px-3 py-1.5 sm:px-4",
          )}
        >
          {/* ---- Logo ---- */}
          <Link
            href="/"
            className="flex min-h-10 min-w-10 items-center gap-2 shrink-0 group"
          >
            <span className="brand-mark transition-all duration-200 group-hover:shadow-[0_6px_20px_rgba(29,110,245,0.35)]">
              <span className="brand-mark__monogram">PC</span>
            </span>
            <span className="hidden text-[1.0625rem] font-extrabold tracking-tight text-foreground min-[480px]:block">
              PlayCourt
            </span>
          </Link>

          {/* ---- Desktop Nav (≥ 768px) ---- */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={cn(
                  "flex min-h-9 items-center px-3 rounded-xl text-[0.8125rem] font-medium transition-all duration-150",
                  isActive(pathname, item.href)
                    ? "bg-accent/10 text-accent font-semibold"
                    : "text-muted hover:bg-slate-100 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* ---- Right Section ---- */}
          <div className="flex items-center gap-2">
            {/* Logged-in: notification + avatar (desktop) */}
            {isLoggedIn && (
              <>
                <NotificationDropdown />

                {/* Avatar Dropdown (desktop) */}
                <Dropdown>
                  <Button
                    aria-label="Tài khoản"
                    variant="ghost"
                    className={cn(
                      "hidden md:flex items-center gap-1.5 rounded-full px-1",
                      "bg-surface-secondary/80 hover:ring-2 hover:ring-accent/25 transition-all",
                    )}
                  >
                    <Avatar size="sm">
                      {user?.avatar ? (
                        <Avatar.Image src={user?.avatar} alt={displayName} />
                      ) : null}
                      <Avatar.Fallback>{initials}</Avatar.Fallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-muted" />
                  </Button>
                  <Dropdown.Popover placement="bottom end">
                    <Dropdown.Menu>
                      {dropdownItems.map((item) => (
                        <Dropdown.Item
                          key={item.key}
                          id={item.key}
                          textValue={item.label}
                          href={item.href || undefined}
                          onAction={item.key === "logout" ? logout : undefined}
                          className={item.className}
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </div>
                        </Dropdown.Item>
                      ))}
                    </Dropdown.Menu>
                  </Dropdown.Popover>
                </Dropdown>
              </>
            )}

            {/* Guest: CTA desktop */}
            {!isLoggedIn && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>Đăng nhập</Link>
                <Link href="/register/owner" className={buttonVariants({ variant: "primary", size: "sm" })}>Đăng ký</Link>
              </div>
            )}

            {/* Mobile: hamburger */}
            <Button
              isIconOnly
              variant="ghost"
              aria-label="Menu"
              className="md:hidden text-muted"
              onPress={() => setDrawerOpen(true)}
            >
              <Bars className="w-5 h-5" />
            </Button>
          </div>
        </nav>
      </header>

      {/* ---- Mobile Drawer ---- */}
      <Drawer isOpen={drawerOpen} onOpenChange={setDrawerOpen}>
        <Drawer.Backdrop />
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header className="flex items-center justify-between pr-10">
              <Drawer.Heading className="flex items-center gap-2">
                <span className="brand-mark h-8 w-8 rounded-xl">
                  <span className="brand-mark__monogram text-[0.62rem]">PC</span>
                </span>
                PlayCourt
              </Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="px-0">
              {/* User info */}
              {isLoggedIn && (
                <div className="px-5 py-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar size="sm">
                      {user?.avatar ? (
                        <Avatar.Image src={user?.avatar} alt={displayName} />
                      ) : null}
                      <Avatar.Fallback>{initials}</Avatar.Fallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted">{user?.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Nav links */}
              <div className="flex flex-col gap-1 px-3 py-3">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    onClick={() => setDrawerOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                      isActive(pathname, item.href)
                        ? "bg-surface-secondary text-foreground"
                        : "text-muted hover:text-foreground hover:bg-surface-secondary/50",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </Drawer.Body>
            <Drawer.Footer>
              {dropdownItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.key === "logout" ? "#" : (item.href || "#")}
                  onClick={() => {
                    if (item.key === "logout") {
                      logout();
                    }
                    setDrawerOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors",
                    item.key === "logout"
                      ? "text-danger hover:bg-danger/10"
                      : "text-muted hover:text-foreground hover:bg-surface-secondary/50",
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              ))}
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer>
    </>
  );
}
