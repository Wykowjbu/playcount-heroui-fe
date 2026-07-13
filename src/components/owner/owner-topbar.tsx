"use client";

import { Button, Badge, Avatar } from "@heroui/react";
import Bars from "@gravity-ui/icons/Bars";
import Bell from "@gravity-ui/icons/Bell";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface TopbarProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}

export function OwnerTopbar({ onToggleSidebar }: TopbarProps) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--background)] px-6 py-3">
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="ghost"
          aria-label="Toggle sidebar"
          onPress={onToggleSidebar}
        >
          <Bars className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-semibold hidden sm:block">Quản lý sân</h1>
      </div>

      <div className="flex items-center gap-2">
        <Badge.Anchor>
          <Link href="/player/notifications">
            <Button isIconOnly variant="ghost" aria-label="Thông báo">
              <Bell className="w-5 h-5" />
            </Button>
          </Link>
        </Badge.Anchor>

        <Avatar size="sm">
          <Avatar.Fallback>
            {user?.fullName?.charAt(0)?.toUpperCase() ?? "O"}
          </Avatar.Fallback>
        </Avatar>
      </div>
    </header>
  );
}
