import { Avatar, Button } from "@heroui/react";
import Bars from "@gravity-ui/icons/Bars";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function AdminTopbar({ onToggleSidebar, sidebarCollapsed }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)] px-6">
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="ghost"
          aria-label={sidebarCollapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
          onPress={onToggleSidebar}
        >
          <Bars className="w-5 h-5" />
        </Button>
        <p className="text-sm font-semibold">Quản trị hệ thống</p>
      </div>
      <Avatar size="sm"><Avatar.Fallback>AD</Avatar.Fallback></Avatar>
    </header>
  );
}
