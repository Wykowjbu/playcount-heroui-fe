"use client";

import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, Chip, Modal, Skeleton, Tabs } from "@heroui/react";
import Bell from "@gravity-ui/icons/Bell";
import Calendar from "@gravity-ui/icons/Calendar";
import Persons from "@gravity-ui/icons/Persons";
import Star from "@gravity-ui/icons/Star";
import MapPin from "@gravity-ui/icons/MapPin";
import Gear from "@gravity-ui/icons/Gear";
import TrashBin from "@gravity-ui/icons/TrashBin";
import Check from "@gravity-ui/icons/Check";
import { AuthGuard } from "@/lib/auth/guards";
import {
  deleteNotification,
  getMyNotificationsPage,
  markAllAsRead,
  markAsRead,
} from "@/lib/api/notifications";
import type { NotificationDto } from "@/lib/types/api";
import { getNotificationHref } from "@/lib/utils/flow-navigation";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatRelativeTime } from "@/lib/utils/format";
import { SiteHeader } from "@/components/layout/site-header";

const TYPE_ICONS: Record<string, React.ElementType> = {
  Booking: Calendar,
  Payment: Check,
  Match: Persons,
  Review: Star,
  Venue: MapPin,
  System: Gear,
};

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}

function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [readingIds, setReadingIds] = useState<Set<number>>(() => new Set());
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const mountedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const loadInFlightRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const readingIdsRef = useRef(new Set<number>());
  const markingAllRef = useRef(false);
  const deletingRef = useRef(false);

  const invalidateCurrentLoad = () => {
    loadGenerationRef.current += 1;
    loadInFlightRef.current = false;
  };

  const fetchNotifications = useCallback(async (requestedPage = 1, append = false) => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    const generation = ++loadGenerationRef.current;
    if (!hasLoadedRef.current) setLoading(true);
    if (append) setLoadingMore(true);
    setLoadError(null);

    try {
      const page = await getMyNotificationsPage({ pageIndex: requestedPage, pageSize: 50 });
      if (!mountedRef.current || generation !== loadGenerationRef.current) return;
      setNotifications((current) => {
        if (!append) return page.items;
        const byId = new Map(current.map((item) => [item.id, item]));
        page.items.forEach((item) => byId.set(item.id, item));
        return Array.from(byId.values());
      });
      setPageIndex(page.pageIndex);
      setTotalPages(page.totalPages);
      hasLoadedRef.current = true;
      setHasLoaded(true);
    } catch {
      if (!mountedRef.current || generation !== loadGenerationRef.current) return;
      setLoadError("Không thể tải thông báo");
    } finally {
      if (generation === loadGenerationRef.current) {
        loadInFlightRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchNotifications();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchNotifications();
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
  }, [fetchNotifications]);

  const handleNotification = async (notification: NotificationDto) => {
    if (readingIdsRef.current.has(notification.id)) return;
    const href = getNotificationHref("player", notification.referenceType, notification.referenceId);
    let readSucceeded = notification.isRead;

    if (!notification.isRead) {
      readingIdsRef.current.add(notification.id);
      setReadingIds(new Set(readingIdsRef.current));
      try {
        await markAsRead(notification.id);
        readSucceeded = true;
        invalidateCurrentLoad();
        if (mountedRef.current) {
          setNotifications((items) => items.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ));
        }
      } catch {
        // apiFetch displays the backend message in a toast.
      } finally {
        readingIdsRef.current.delete(notification.id);
        if (mountedRef.current) setReadingIds(new Set(readingIdsRef.current));
      }
    }

    if (readSucceeded && href) router.push(href);
  };

  const handleMarkAllAsRead = async () => {
    if (markingAllRef.current) return;
    markingAllRef.current = true;
    setMarkingAll(true);
    try {
      await markAllAsRead();
      invalidateCurrentLoad();
      if (mountedRef.current) setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      markingAllRef.current = false;
      if (mountedRef.current) setMarkingAll(false);
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId == null || deletingRef.current) return;
    const notificationId = confirmDeleteId;
    deletingRef.current = true;
    setDeletingId(notificationId);
    try {
      await deleteNotification(notificationId);
      invalidateCurrentLoad();
      if (mountedRef.current) setNotifications((items) => items.filter((item) => item.id !== notificationId));
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      deletingRef.current = false;
      if (mountedRef.current) {
        setDeletingId(null);
        setConfirmDeleteId(null);
      }
    }
  };

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const renderList = (tab: "all" | "unread") => {
    const items = tab === "unread" ? notifications.filter((item) => !item.isRead) : notifications;
    if (!hasLoaded) return loading ? <NotificationsSkeleton /> : null;
    if (items.length === 0) return <NotificationsEmpty activeTab={tab} />;

    return (
      <div className="flex min-w-0 flex-col gap-2">
        {items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            isReading={readingIds.has(notification.id)}
            isDeleting={deletingId === notification.id}
            onAction={() => void handleNotification(notification)}
            onDelete={() => setConfirmDeleteId(notification.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[720px] min-w-0 overflow-x-hidden px-4 py-8">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
            {unreadCount > 0 && <p className="mt-1 text-sm text-muted">{unreadCount} thông báo chưa đọc</p>}
          </div>
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" isDisabled={markingAll} onPress={() => void handleMarkAllAsRead()}>
              <Check className="mr-1 size-4" />
              {markingAll ? "Đang xử lý..." : "Đọc tất cả"}
            </Button>
          )}
        </div>

        {loadError && (
          <Alert status="danger" className="mb-4">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{loadError}</Alert.Description>
              <Button className="mt-2 min-h-11" variant="secondary" onPress={() => void fetchNotifications()} aria-label="Thử tải lại thông báo">
                Thử lại
              </Button>
            </Alert.Content>
          </Alert>
        )}

        <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as "all" | "unread")} className="min-w-0">
          <Tabs.ListContainer className="mb-6 max-w-full overflow-x-auto">
            <Tabs.List aria-label="Thông báo">
              <Tabs.Tab id="all">Tất cả ({notifications.length})<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="unread">Chưa đọc ({unreadCount})<Tabs.Indicator /></Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="all">{renderList("all")}</Tabs.Panel>
          <Tabs.Panel id="unread">{renderList("unread")}</Tabs.Panel>
        </Tabs>
        {hasLoaded && pageIndex < totalPages && (
          <Button
            className="mt-6 min-h-11 w-full"
            variant="secondary"
            isPending={loadingMore}
            isDisabled={loadingMore}
            onPress={() => void fetchNotifications(pageIndex + 1, true)}
          >
            {loadingMore ? "Đang tải thêm..." : "Tải thêm thông báo"}
          </Button>
        )}
      </main>

      <Modal isOpen={confirmDeleteId != null} onOpenChange={(open) => { if (!open && !deletingRef.current) setConfirmDeleteId(null); }}>
        <Modal.Backdrop>
          <Modal.Container size="sm" placement="center">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header><Modal.Heading>Xóa thông báo</Modal.Heading></Modal.Header>
              <Modal.Body><p className="text-sm text-muted">Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.</p></Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" isDisabled={deletingId != null} onPress={() => setConfirmDeleteId(null)}>Hủy</Button>
                <Button variant="danger" isDisabled={deletingId != null} onPress={() => void handleDelete()}>
                  {deletingId != null ? "Đang xóa..." : "Xóa"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function NotificationItem({
  notification,
  isReading,
  isDeleting,
  onAction,
  onDelete,
}: {
  notification: NotificationDto;
  isReading: boolean;
  isDeleting: boolean;
  onAction: () => void;
  onDelete: () => void;
}) {
  const config = getStatusConfig("notification", notification.type);
  const Icon = TYPE_ICONS[notification.type] ?? Bell;
  const href = getNotificationHref("player", notification.referenceType, notification.referenceId);
  const actionLabel = href ? "Mở" : "Đánh dấu đã đọc";

  return (
    <Card className={notification.isRead ? "opacity-70" : undefined}>
      <Card.Content className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] items-start gap-1 p-1 sm:gap-2">
        <Button
          aria-label={`${actionLabel} thông báo: ${notification.title}`}
          className="h-auto min-h-11 min-w-0 justify-start whitespace-normal p-3 text-left"
          variant="ghost"
          isDisabled={isReading}
          onPress={onAction}
        >
          <span className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-secondary)]">
              {createElement(Icon, { className: "size-5 text-foreground" })}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">{notification.title}</span>
                {!notification.isRead && <span className="size-2 shrink-0 rounded-full bg-accent" />}
              </span>
              {notification.content && <span className="mt-0.5 block line-clamp-2 break-words text-sm text-muted">{notification.content}</span>}
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <Chip size="sm" color={config.color} variant="soft" className="text-xs">{config.label}</Chip>
                <time dateTime={notification.createdAt} className="text-xs text-muted">{formatRelativeTime(notification.createdAt)}</time>
              </span>
            </span>
          </span>
        </Button>
        <Button
          isIconOnly
          aria-label={`Xóa thông báo: ${notification.title}`}
          variant="ghost"
          className="min-h-11 min-w-11 shrink-0 text-muted"
          isDisabled={isDeleting}
          onPress={onDelete}
        >
          <TrashBin className="size-4" />
        </Button>
      </Card.Content>
    </Card>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <Card.Content className="flex items-start gap-3 p-4">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-5 w-24 rounded" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

function NotificationsEmpty({ activeTab }: { activeTab: "all" | "unread" }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
      <Bell className="mb-6 size-16 text-muted/30" />
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {activeTab === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo nào"}
      </h3>
      <p className="max-w-md text-sm text-muted">
        {activeTab === "unread" ? "Tất cả thông báo đã được đọc" : "Bạn sẽ nhận thông báo khi có hoạt động mới"}
      </p>
    </div>
  );
}
