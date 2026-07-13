"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Chip, Tabs, Alert, Skeleton } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerBottomNav } from "@/components/layout/player-bottom-nav";
import { PlayerGuard } from "@/lib/auth/guards";
import { getMyBookings, cancelBooking } from "@/lib/api/bookings";
import { createPayOsPayment } from "@/lib/api/payments";
import type { BookingResponseDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatDate, formatTime, formatVnd } from "@/lib/utils/format";
import Calendar from "@gravity-ui/icons/Calendar";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import Clock from "@gravity-ui/icons/Clock";
import MapPin from "@gravity-ui/icons/MapPin";
import Wallet from "@gravity-ui/icons/Wallet";

/** Handle both "HH:mm:ss" and full datetime strings */
function fmtTime(s: string | null | undefined): string {
  if (!s) return "—";
  if (/^\d{1,2}:\d{2}/.test(s) && !s.includes("T")) {
    const [h, m] = s.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }
  return formatTime(s);
}

type TabKey = "all" | "upcoming" | "pending" | "completed" | "cancelled";

const TAB_STATUS_MAP: Record<TabKey, string | undefined> = {
  all: undefined,
  upcoming: "Confirmed",
  pending: "Pending",
  completed: "Completed",
  cancelled: undefined,
};

const TAB_LABELS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "upcoming", label: "Sắp tới" },
  { key: "pending", label: "Chờ xử lý" },
  { key: "completed", label: "Hoàn thành" },
  { key: "cancelled", label: "Đã hủy" },
];

export function PlayerBookingsPage() {
  return (
    <PlayerGuard>
      <PlayerBookingsContent />
    </PlayerGuard>
  );
}

function PlayerBookingsContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchBookings = useCallback(async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      const status = TAB_STATUS_MAP[tab];
      const result = await getMyBookings({ status, page: 1, pageSize: 50 });
      setBookings(tab === "cancelled"
        ? result.items.filter((booking) => booking.status === "CancelledByUser" || booking.status === "CancelledByOwner")
        : result.items);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách đặt sân");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab, fetchBookings]);

  const handleCancel = async (id: number) => {
    setActionLoading(id);
    try {
      await cancelBooking(id);
      fetchBookings(activeTab);
    } catch {
      // error handled by refetch
    } finally {
      setActionLoading(null);
    }
  };

  const handlePay = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      const res = await createPayOsPayment(bookingId);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch {
      // silent
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">
          Lịch đặt sân
        </h1>

        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(k) => setActiveTab(k as TabKey)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Booking tabs">
              {TAB_LABELS.map((t) => (
                <Tabs.Tab key={t.key} id={t.key}>
                  {t.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>

          {TAB_LABELS.map((t) => (
            <Tabs.Panel key={t.key} id={t.key} className="pt-6">
              {error && (
                <Alert status="danger" className="mb-4">
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Title>{error}</Alert.Title>
                  </Alert.Content>
                  <Button variant="danger" size="sm" onPress={() => fetchBookings(t.key)}>
                    Thử lại
                  </Button>
                </Alert>
              )}

              {loading && <BookingListSkeleton />}

              {!loading && !error && bookings.length === 0 && (
                <EmptyState tab={t.key} />
              )}

              {!loading && !error && bookings.length > 0 && (
                <div className="space-y-3">
                  {bookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onCancel={handleCancel}
                      onPay={handlePay}
                      actionLoading={actionLoading === b.id}
                    />
                  ))}
                </div>
              )}
            </Tabs.Panel>
          ))}
        </Tabs>
      </main>
      <PlayerBottomNav />
    </div>
  );
}

/* ---- Booking Card ---- */
function BookingCard({
  booking: b,
  onCancel,
  onPay,
  actionLoading,
}: {
  booking: BookingResponseDto;
  onCancel: (id: number) => void;
  onPay: (bookingId: number) => void;
  actionLoading: boolean;
}) {
  const statusCfg = getStatusConfig("booking", b.status);
  const canCancel = b.status === "Pending" || b.status === "Confirmed";
  const canPay = b.status === "Pending";

  return (
    <Card>
      <Card.Content className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[var(--foreground)] truncate">
                {b.venueName}
              </h3>
              <Chip color={statusCfg.color} size="sm">{statusCfg.label}</Chip>
            </div>
            <p className="text-sm text-[var(--muted)]">
              <MapPin className="inline size-3.5 mr-1" />
              {b.courtName}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              <span>
                <Calendar className="inline size-3.5 mr-1" />
                {formatDate(b.startAt)}
              </span>
              <span>
                <Clock className="inline size-3.5 mr-1" />
                {fmtTime(b.startAt)} - {fmtTime(b.endAt)}
              </span>
              <span>
                <Wallet className="inline size-3.5 mr-1" />
                {formatVnd(b.totalPrice)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 shrink-0">
            <Link href={`/bookings/${b.id}`}>
              <Button variant="ghost" size="sm">Chi tiết</Button>
            </Link>
            {canPay && (
              <Button
                variant="primary"
                size="sm"
                isDisabled={actionLoading}
                onPress={() => onPay(b.id)}
              >
                {actionLoading ? "Đang xử lý..." : "Thanh toán"}
              </Button>
            )}
            {canCancel && (
              <Button
                variant="danger"
                size="sm"
                isDisabled={actionLoading}
                onPress={() => onCancel(b.id)}
              >
                {actionLoading ? "Đang hủy..." : "Hủy"}
              </Button>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

/* ---- Skeleton ---- */
function BookingListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <Card.Content className="p-5">
            <div className="space-y-3">
              <Skeleton className="h-5 w-2/5 rounded-lg" />
              <Skeleton className="h-4 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-lg" />
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

/* ---- Empty State ---- */
function EmptyState({ tab }: { tab: TabKey }) {
  const messages: Record<TabKey, string> = {
    all: "Bạn chưa có lịch đặt sân nào.",
    upcoming: "Không có lịch đặt sắp tới.",
    pending: "Không có lịch đặt đang chờ xử lý.",
    completed: "Chưa có lịch đặt hoàn thành.",
    cancelled: "Chưa có lịch đặt bị hủy.",
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <CircleCheck className="size-12 text-[var(--muted)] mb-4" />
      <p className="text-[var(--muted)]">{messages[tab]}</p>
      <Link href="/venues" className="mt-4">
        <Button variant="primary" size="sm">Tìm sân ngay</Button>
      </Link>
    </div>
  );
}
