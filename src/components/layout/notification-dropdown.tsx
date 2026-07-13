"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Description, Dropdown, Label, Spinner } from "@heroui/react";
import Bell from "@gravity-ui/icons/Bell";
import Check from "@gravity-ui/icons/Check";
import {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/api/notifications";
import type { NotificationDto } from "@/lib/types/api";
import { getNotificationHref } from "@/lib/utils/flow-navigation";

export function NotificationDropdown() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [items, count] = await Promise.all([
        getMyNotifications({ pageIndex: 1, pageSize: 8 }),
        getUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(load, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  async function openNotification(notification: NotificationDto) {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setNotifications((items) => items.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ));
    }

    const href = getNotificationHref(notification.referenceType, notification.referenceId);
    if (href) router.push(href);
  }

  async function readAll() {
    await markAllAsRead();
    setUnreadCount(0);
    setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
  }

  return (
    <Dropdown>
      <Badge.Anchor>
        <Button isIconOnly aria-label="Thông báo" variant="ghost" className="text-muted">
          <Bell className="size-5" />
        </Button>
        {unreadCount > 0 && (
          <Badge color="danger" size="sm" className="h-[18px] min-w-[18px] px-1 text-[10px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Badge.Anchor>
      <Dropdown.Popover placement="bottom end" className="w-[min(24rem,calc(100vw-2rem))]">
        <Dropdown.Menu aria-label="Thông báo">
          {loading ? (
            <Dropdown.Item id="loading" textValue="Đang tải" isDisabled>
              <Spinner size="sm" />
              <Label>Đang tải thông báo...</Label>
            </Dropdown.Item>
          ) : notifications.length === 0 ? (
            <Dropdown.Item id="empty" textValue="Không có thông báo" isDisabled>
              <Label>Chưa có thông báo</Label>
            </Dropdown.Item>
          ) : (
            notifications.map((notification) => (
              <Dropdown.Item
                id={`notification-${notification.id}`}
                key={notification.id}
                textValue={notification.title}
                onAction={() => void openNotification(notification)}
                className={!notification.isRead ? "bg-accent/5" : undefined}
              >
                <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-accent"}`} />
                <div className="min-w-0">
                  <Label>{notification.title}</Label>
                  {notification.content && <Description className="line-clamp-2">{notification.content}</Description>}
                </div>
              </Dropdown.Item>
            ))
          )}
          {unreadCount > 0 && (
            <Dropdown.Item id="read-all" textValue="Đánh dấu tất cả đã đọc" onAction={() => void readAll()}>
              <Check className="size-4" />
              <Label>Đánh dấu tất cả đã đọc</Label>
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
