import {
  Button,
  Badge,
  Avatar,
  SearchField,
  SearchFieldInput,
  SearchFieldSearchIcon,
  SearchFieldClearButton,
} from "@heroui/react";
import Bars from "@gravity-ui/icons/Bars";
import Bell from "@gravity-ui/icons/Bell";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function AdminTopbar({ onToggleSidebar, sidebarCollapsed }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-20 flex items-center justify-between px-6 gap-4 bg-[var(--background)] border-b border-[var(--border)]">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="ghost"
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          onPress={onToggleSidebar}
        >
          <Bars className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-lg font-bold">Tổng quan Admin</h1>
          <p className="text-xs text-[var(--muted)]">Theo dõi hàng chờ xử lý trong hệ thống</p>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <SearchField className="hidden sm:flex w-64">
          <SearchFieldSearchIcon />
          <SearchFieldInput placeholder="Search cơ sở, chủ sân..." />
          <SearchFieldClearButton />
        </SearchField>

        <Badge.Anchor>
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Thông báo"
            className="text-[var(--muted)]"
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Badge
            color="danger"
            size="sm"
            className="min-w-[18px] h-[18px] text-[10px] px-1"
          >
            8
          </Badge>
        </Badge.Anchor>

        <Avatar size="sm">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar>
      </div>
    </header>
  );
}
