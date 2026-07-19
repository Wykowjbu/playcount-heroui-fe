"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Description, Dropdown, Header, Label, Spinner } from "@heroui/react";
import Bell from "@gravity-ui/icons/Bell";
import Check from "@gravity-ui/icons/Check";
import ArrowRight from "@gravity-ui/icons/ArrowRight";
import {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from "@/lib/api/notifications";
import type { NotificationDto } from "@/lib/types/api";
import { getNotificationHref } from "@/lib/utils/flow-navigation";
import { formatRelativeTime } from "@/lib/utils/format";
import { useAuth } from "@/lib/auth-context";

export function NotificationDropdown() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [readingIds, setReadingIds] = useState<Set<number>>(() => new Set());
  const [readingAll, setReadingAll] = useState(false);
  const mountedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const loadInFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const readingIdsRef = useRef(new Set<number>());
  const readingAllRef = useRef(false);

  const invalidateCurrentLoad = () => {
    loadGenerationRef.current += 1;
    loadInFlightRef.current = false;
  };

  const load = useCallback(async () => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    const generation = ++loadGenerationRef.current;
    if (!hasLoadedRef.current) setLoading(true);
    setError("");

    try {
      const [items, count] = await Promise.all([
        getMyNotifications({ pageIndex: 1, pageSize: 8 }),
        getUnreadCount(),
      ]);
      if (!mountedRef.current || generation !== loadGenerationRef.current) return;
      setNotifications(items);
      setUnreadCount(count);
      hasLoadedRef.current = true;
      setHasLoaded(true);
    } catch {
      if (mountedRef.current && generation === loadGenerationRef.current) setError("Không thể tải thông báo.");
    } finally {
      if (generation === loadGenerationRef.current) {
        loadInFlightRef.current = false;
        if (mountedRef.current) setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      mountedRef.current = false;
      loadGenerationRef.current += 1;
      loadInFlightRef.current = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [load]);

  const openNotification = async (notification: NotificationDto) => {
    if (readingIdsRef.current.has(notification.id)) return;
    const href = getNotificationHref(user?.role ?? null, notification.referenceType, notification.referenceId);
    let readSucceeded = notification.isRead;

    if (!notification.isRead) {
      readingIdsRef.current.add(notification.id);
      setReadingIds(new Set(readingIdsRef.current));
      setError("");
      try {
        await markAsRead(notification.id);
        readSucceeded = true;
        invalidateCurrentLoad();
        if (mountedRef.current) {
          setUnreadCount((count) => Math.max(0, count - 1));
          setNotifications((items) => items.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ));
        }
      } catch {
        if (mountedRef.current) {
          setError("Không thể đánh dấu thông báo đã đọc.");
          setIsOpen(true);
        }
      } finally {
        readingIdsRef.current.delete(notification.id);
        if (mountedRef.current) setReadingIds(new Set(readingIdsRef.current));
      }
    }

    if (readSucceeded && href) {
      setIsOpen(false);
      router.push(href);
    }
  };

  const readAll = async () => {
    if (readingAllRef.current) return;
    readingAllRef.current = true;
    setReadingAll(true);
    setError("");
    try {
      await markAllAsRead();
      invalidateCurrentLoad();
      if (mountedRef.current) {
        setUnreadCount(0);
        setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      }
    } catch {
      if (mountedRef.current) {
        setError("Không thể đánh dấu tất cả đã đọc.");
        setIsOpen(true);
      }
    } finally {
      readingAllRef.current = false;
      if (mountedRef.current) setReadingAll(false);
    }
  };

  return (
    <Dropdown isOpen={isOpen} onOpenChange={setIsOpen}>
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
      <Dropdown.Popover placement="bottom end" className="w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)]">
        <Dropdown.Menu aria-label="Thông báo">
          <Dropdown.Section>
            <Header className="flex items-center justify-between px-2 py-1">
              <span className="font-semibold">Thông báo</span>
              {unreadCount > 0 && <span className="text-xs font-normal text-muted">{unreadCount} chưa đọc</span>}
            </Header>
          </Dropdown.Section>
          {error && (
            <Dropdown.Item id="error" textValue={error} isDisabled>
              <Description role="status">{error}</Description>
            </Dropdown.Item>
          )}
          {error && (
            <Dropdown.Item id="retry" textValue="Thử tải lại thông báo" onAction={() => void load()}>
              <Label>Thử lại</Label>
            </Dropdown.Item>
          )}
          {!hasLoaded ? loading ? (
            <Dropdown.Item id="loading" textValue="Đang tải" isDisabled>
              <Spinner size="sm" />
              <Label>Đang tải thông báo...</Label>
            </Dropdown.Item>
          ) : null : notifications.length === 0 ? (
            <Dropdown.Item id="empty" textValue="Không có thông báo" isDisabled>
              <Label>Chưa có thông báo</Label>
            </Dropdown.Item>
          ) : (
            notifications.map((notification) => (
              <Dropdown.Item
                id={`notification-${notification.id}`}
                key={notification.id}
                textValue={notification.title}
                isDisabled={readingIds.has(notification.id)}
                onAction={() => void openNotification(notification)}
                className={!notification.isRead ? "bg-accent/5" : undefined}
              >
                <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.isRead ? "bg-transparent" : "bg-accent"}`} />
                <div className="min-w-0">
                  <Label>{notification.title}</Label>
                  {notification.content && <Description className="line-clamp-2 break-words">{notification.content}</Description>}
                  <time dateTime={notification.createdAt} className="mt-1 block text-xs text-muted">
                    {formatRelativeTime(notification.createdAt)}
                  </time>
                </div>
              </Dropdown.Item>
            ))
          )}
          {unreadCount > 0 && (
            <Dropdown.Item
              id="read-all"
              textValue="Đánh dấu tất cả đã đọc"
              isDisabled={readingAll}
              onAction={() => void readAll()}
            >
              <Check className="size-4" />
              <Label>{readingAll ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}</Label>
            </Dropdown.Item>
          )}
          <Dropdown.Item
            id="view-all"
            textValue="Xem tất cả thông báo"
            onAction={() => {
              setIsOpen(false);
              router.push("/player/notifications");
            }}
          >
            <ArrowRight className="size-4" />
            <Label>Xem tất cả thông báo</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
