"use client";

import { Button, Avatar, Drawer } from "@heroui/react";
import Bars from "@gravity-ui/icons/Bars";
import { useAuth } from "@/lib/auth-context";
import { OwnerSidebar } from "./owner-sidebar";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";

interface TopbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  activeItem?: string;
  ownerStatus?: string | null;
}

export function OwnerTopbar({ activeItem, ownerStatus, onToggleSidebar }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)] px-4 sm:h-16 sm:px-6">
      <div className="flex items-center gap-3">
        <Drawer>
          <Button className="lg:hidden" isIconOnly variant="ghost" aria-label="Mở menu điều hướng"><Bars className="w-5 h-5" /></Button>
          <Drawer.Backdrop>
            <Drawer.Content placement="left" className="w-[280px]">
            <Drawer.Dialog><Drawer.Body className="p-0"><OwnerSidebar mobile collapsed={false} activeItem={activeItem} ownerStatus={ownerStatus} /></Drawer.Body></Drawer.Dialog>
            </Drawer.Content>
          </Drawer.Backdrop>
        </Drawer>
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Thu gọn hoặc mở rộng thanh điều hướng"
          onPress={onToggleSidebar}
          className="hidden lg:inline-flex"
        >
          <Bars className="w-5 h-5" />
        </Button>
        <p className="text-base font-semibold sm:text-lg">Quản lý chủ sân</p>
      </div>

      <div className="flex items-center gap-2">
        <NotificationDropdown />

        <Avatar size="sm">
          {user?.avatar ? <Avatar.Image src={user.avatar} alt={user.fullName} /> : null}
          <Avatar.Fallback>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? "O"}
          </Avatar.Fallback>
        </Avatar>
      </div>
    </header>
  );
}
