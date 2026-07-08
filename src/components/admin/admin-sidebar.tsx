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

export function AdminSidebar({ collapsed, activeItem = "overview" }: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "h-screen sticky top-0 shrink-0 border-r border-[var(--border)] bg-[var(--background)] transition-[width] duration-200 px-3 py-4",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Header */}
      <div className={cn("flex flex-col", collapsed ? "items-center" : "items-start")}>
        <Avatar size="sm">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar>
        {!collapsed && (
          <div className="mt-2">
            <p className="text-sm font-semibold">Admin</p>
            <p className="text-xs text-[var(--muted)]">Quản trị viên</p>
          </div>
        )}
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full relative",
                collapsed && "justify-center",
                isActive && "bg-[var(--surface-secondary)] font-semibold",
                !isActive && "hover:bg-[var(--surface-secondary)]/50"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.count !== undefined && (
                    <Chip size="sm" variant="soft">
                      {item.count}
                    </Chip>
                  )}
                </>
              )}
              {collapsed && item.count !== undefined && (
                <Badge
                  size="sm"
                  color="accent"
                  className="absolute top-1 right-1 min-w-0 h-4 px-1 text-[10px]"
                >
                  {item.count}
                </Badge>
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
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors w-full",
                collapsed && "justify-center",
                isActive && "bg-[var(--surface-secondary)] font-semibold",
                !isActive && "hover:bg-[var(--surface-secondary)]/50",
                item.className
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
