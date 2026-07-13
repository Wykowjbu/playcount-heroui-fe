"use client";

import { createElement, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Chip, Skeleton, Alert, Modal, Tabs } from "@heroui/react";
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
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/api/notifications";
import type { NotificationDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatRelativeTime } from "@/lib/utils/format";
import { SiteHeader } from "@/components/layout/site-header";

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}

/* ------------------------------------------------------------------ */
/* ICON MAP                                                            */
/* ------------------------------------------------------------------ */
const TYPE_ICONS: Record<string, React.ElementType> = {
  Booking: Calendar,
  Payment: Check,
  Match: Persons,
  Review: Star,
  Venue: MapPin,
  System: Gear,
};

function getIcon(type: string) {
  return TYPE_ICONS[type] ?? Bell;
}

/* ------------------------------------------------------------------ */
/* CONTENT                                                             */
/* ------------------------------------------------------------------ */
function NotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyNotifications({ pageSize: 50 });
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (n: NotificationDto) => {
    if (!n.isRead) {
      try {
        await markAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === n.id ? { ...item, isRead: true } : item,
          ),
        );
      } catch {
        // silent
      }
    }
    // Navigate to reference
    if (n.referenceType === "Booking" && n.referenceId) {
      router.push(`/player/bookings`);
    } else if (n.referenceType === "Match" && n.referenceId) {
      router.push(`/matches/${n.referenceId}`);
    } else if (n.referenceType === "Venue" && n.referenceId) {
      router.push(`/venues/${n.referenceId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true })),
      );
    } catch {
      setError("Không thể đánh dấu tất cả đã đọc");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async () => {
    if (confirmDeleteId == null) return;
    try {
      setDeletingId(confirmDeleteId);
      await deleteNotification(confirmDeleteId);
      setNotifications((prev) => prev.filter((n) => n.id !== confirmDeleteId));
    } catch {
      setError("Không thể xóa thông báo");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const filtered =
    activeTab === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-[720px] px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Thông báo</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted mt-1">
                {unreadCount} thông báo chưa đọc
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              isDisabled={markingAll}
              onPress={handleMarkAllAsRead}
            >
              <Check className="w-4 h-4 mr-1" />
              Đọc tất cả
            </Button>
          )}
        </div>

        {error && (
          <Alert status="danger" className="mb-6">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as "all" | "unread")}
          className="mb-6"
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Thông báo">
              <Tabs.Tab id="all">Tất cả ({notifications.length})<Tabs.Indicator /></Tabs.Tab>
              <Tabs.Tab id="unread">Chưa đọc ({unreadCount})<Tabs.Indicator /></Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
          <Tabs.Panel id="all">
            {loading ? (
              <NotificationsSkeleton />
            ) : filtered.length === 0 ? (
              <NotificationsEmpty activeTab="all" />
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={() => handleMarkAsRead(n)}
                    onDelete={() => setConfirmDeleteId(n.id)}
                    isDeleting={deletingId === n.id}
                  />
                ))}
              </div>
            )}
          </Tabs.Panel>
          <Tabs.Panel id="unread">
            {loading ? (
              <NotificationsSkeleton />
            ) : filtered.length === 0 ? (
              <NotificationsEmpty activeTab="unread" />
            ) : (
              <div className="flex flex-col gap-2">
                {filtered.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onClick={() => handleMarkAsRead(n)}
                    onDelete={() => setConfirmDeleteId(n.id)}
                    isDeleting={deletingId === n.id}
                  />
                ))}
              </div>
            )}
          </Tabs.Panel>
        </Tabs>
      </main>

      {/* Delete confirmation modal */}
      <Modal isOpen={confirmDeleteId != null} onOpenChange={(open) => { if (!open) setConfirmDeleteId(null); }}>
        <Modal.Backdrop>
          <Modal.Container size="sm" placement="center">
            <Modal.Dialog>
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Xóa thông báo</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-muted">
                  Bạn có chắc muốn xóa thông báo này? Hành động này không thể hoàn tác.
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setConfirmDeleteId(null)}>
                  Hủy
                </Button>
                <Button
                  variant="danger"
                  isDisabled={deletingId != null}
                  onPress={handleDelete}
                >
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

/* ------------------------------------------------------------------ */
/* NOTIFICATION ITEM                                                   */
/* ------------------------------------------------------------------ */
function NotificationItem({
  notification: n,
  onClick,
  onDelete,
  isDeleting,
}: {
  notification: NotificationDto;
  onClick: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const config = getStatusConfig("notification", n.type);

  return (
    <Button
      variant="ghost"
      onPress={onClick}
      className={`w-full text-left transition-colors cursor-pointer rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm ${n.isRead ? "opacity-70" : ""}`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "var(--surface-secondary)" }}
          >
            {createElement(getIcon(n.type), { className: "w-5 h-5 text-foreground" })}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-semibold text-foreground truncate">
                    {n.title}
                  </h4>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  )}
                </div>
                <p className="text-sm text-muted mt-0.5 line-clamp-2">
                  {n.content}
                </p>
              </div>
              <Button
                isIconOnly
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted"
                onPress={(e) => {
                  onDelete();
                }}
                isDisabled={isDeleting}
              >
                <TrashBin className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Chip size="sm" color={config.color} variant="soft" className="text-xs">
                {config.label}
              </Chip>
              <span className="text-xs text-muted">
                {formatRelativeTime(n.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* SKELETON                                                            */
/* ------------------------------------------------------------------ */
function NotificationsSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/5 rounded" />
                <Skeleton className="h-3 w-full rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded" />
                  <Skeleton className="h-5 w-20 rounded" />
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EMPTY STATE                                                         */
/* ------------------------------------------------------------------ */
function NotificationsEmpty({
  activeTab,
}: {
  activeTab: "all" | "unread";
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <Bell className="w-16 h-16 text-muted/30 mb-6" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {activeTab === "unread"
          ? "Không có thông báo chưa đọc"
          : "Không có thông báo nào"}
      </h3>
      <p className="text-sm text-muted max-w-md">
        {activeTab === "unread"
          ? "Tất cả thông báo đã được đọc"
          : "Bạn sẽ nhận thông báo khi có hoạt động mới"}
      </p>
    </div>
  );
}
