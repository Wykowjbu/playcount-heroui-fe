import { Avatar, Badge, Chip, Separator, cn } from "@heroui/react";

import House from "@gravity-ui/icons/House";
import ListCheck from "@gravity-ui/icons/ListCheck";
import PersonGear from "@gravity-ui/icons/PersonGear";
import Star from "@gravity-ui/icons/Star";
import Tags from "@gravity-ui/icons/Tags";
import Wrench from "@gravity-ui/icons/Wrench";
import Bell from "@gravity-ui/icons/Bell";
import Gear from "@gravity-ui/icons/Gear";
import ArrowRightToSquare from "@gravity-ui/icons/ArrowRightToSquare";
import ArrowRightFromSquare from "@gravity-ui/icons/ArrowRightFromSquare";

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

function SidebarCount({ collapsed, count }: { collapsed: boolean; count: number }) {
  return (
    <>
      {/* Expanded: Chip */}
      <span
        className={cn(
          "overflow-hidden transition-[max-width,opacity,transform] duration-[160ms] motion-reduce:transition-none",
          collapsed
            ? "max-w-0 scale-95 opacity-0"
            : "max-w-12 scale-100 opacity-100"
        )}
        style={{ transitionTimingFunction: EASE }}
      >
        <Chip size="sm" variant="soft">{count}</Chip>
      </span>
      {/* Collapsed: Badge dot */}
      <span
        className={cn(
          "absolute top-1 right-1 transition-opacity duration-150 motion-reduce:transition-none",
          collapsed ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <Badge size="sm" color="accent" className="min-w-0 h-4 px-1 text-[10px]">
          {count}
        </Badge>
      </span>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* DATA                                                                */
/* ------------------------------------------------------------------ */

interface AdminSidebarProps {
  collapsed: boolean;
  activeItem?: string;
}

const NAV_ITEMS = [
  { id: "overview", label: "Tổng quan", icon: House },
  { id: "venues", label: "Phê duyệt cơ sở", icon: ListCheck, count: 12 },
  { id: "owners", label: "Xác minh chủ sân", icon: PersonGear, count: 5 },
  { id: "reviews", label: "Kiểm duyệt đánh giá", icon: Star, count: 3 },
  { id: "sports", label: "Môn thể thao", icon: Tags },
  { id: "amenities", label: "Tiện ích", icon: Wrench },
  { id: "notifications", label: "Thông báo", icon: Bell, count: 3 },
];

const FOOTER_ITEMS = [
  { id: "account", label: "Tài khoản", icon: Gear },
  { id: "home", label: "Về trang chính", icon: ArrowRightFromSquare, href: "/" },
  { id: "logout", label: "Đăng xuất", icon: ArrowRightToSquare, className: "text-[var(--danger)]" },
];

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export function AdminSidebar({ collapsed, activeItem = "overview" }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "h-full sticky top-0 overflow-hidden",
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
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "relative flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                  "transition-[background-color,color,padding,gap] duration-[180ms] motion-reduce:transition-none",
                  collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                  isActive && "bg-[var(--surface-secondary)] font-semibold",
                  !isActive && "hover:bg-[var(--surface-secondary)]/50"
                )}
                style={{ transitionTimingFunction: EASE }}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
                {item.count !== undefined && (
                  <SidebarCount collapsed={collapsed} count={item.count} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <Separator className="my-3" />
        <nav aria-label="Footer navigation" className="flex flex-col gap-1">
          {FOOTER_ITEMS.map((item) => {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "relative flex min-h-11 w-full items-center rounded-xl text-sm no-underline",
                  "transition-[background-color,color,padding,gap] duration-[180ms] motion-reduce:transition-none",
                  collapsed ? "justify-center gap-0 px-2" : "justify-start gap-3 px-3",
                  isActive && "bg-[var(--surface-secondary)] font-semibold",
                  !isActive && "hover:bg-[var(--surface-secondary)]/50",
                  item.className
                )}
                style={{ transitionTimingFunction: EASE }}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <SidebarLabel collapsed={collapsed}>{item.label}</SidebarLabel>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
