"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Spinner,
  Chip,
  Avatar,
  Select,
  Label,
  ListBox,
} from "@heroui/react";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { getMyVenues, getVenueBookings, confirmBooking, rejectBooking, completeBooking } from "@/lib/api/owner";
import type { VenueResponseDto, BookingResponseDto } from "@/lib/types/api";
import { formatVnd, formatDate, formatDateTime, formatTime } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

export default function OwnerBookingsPage() {
  return (
    <OwnerGuard>
      <OwnerShell activeItem="bookings">
        <BookingsContent />
      </OwnerShell>
    </OwnerGuard>
  );
}

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Tất cả" },
  { value: "Pending", label: "Chờ xác nhận" },
  { value: "Confirmed", label: "Đã xác nhận" },
  { value: "Completed", label: "Hoàn thành" },
  { value: "CancelledByUser", label: "Người chơi đã hủy" },
  { value: "CancelledByOwner", label: "Chủ sân đã hủy" },
];

function BookingsContent() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<number | null>(null);
  const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Load venues
  useEffect(() => {
    getMyVenues()
      .then((v) => {
        setVenues(v);
        if (v.length > 0) setSelectedVenue(v[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load bookings when venue changes
  useEffect(() => {
    if (!selectedVenue) return;
    setBookingsLoading(true);
    getVenueBookings(selectedVenue, { status: statusFilter || undefined, pageSize: 50 })
      .then((res) => setBookings(res.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setBookingsLoading(false));
  }, [selectedVenue, statusFilter]);

  async function handleAction(id: number, action: "confirm" | "reject" | "complete") {
    setActionLoading(id);
    try {
      if (action === "confirm") await confirmBooking(id);
      else if (action === "reject") await rejectBooking(id);
      else await completeBooking(id);
      // Reload
      if (selectedVenue) {
        const res = await getVenueBookings(selectedVenue, { status: statusFilter || undefined, pageSize: 50 });
        setBookings(res.data ?? []);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-center">
        <div>
          <p className="text-[var(--muted)]">Bạn chưa có cơ sở nào</p>
          <Link href="/owner/venues/new" className="text-[var(--accent)] underline text-sm mt-2 block">
            Tạo cơ sở mới
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Quản lý đặt chỗ</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Xác nhận và quản lý đặt chỗ</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select
          selectedKey={selectedVenue != null ? String(selectedVenue) : ""}
          onSelectionChange={(key) => setSelectedVenue(key ? Number(key) : null)}
          className="w-60"
          aria-label="Chọn cơ sở"
        >
          <Label>Cơ sở</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {venues.map((v) => (
                <ListBox.Item key={String(v.id)} id={String(v.id)} textValue={v.name}>
                  {v.name}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        <Select
          selectedKey={statusFilter || ""}
          onSelectionChange={(key) => setStatusFilter(key ? String(key) : "")}
          className="w-48"
          aria-label="Lọc theo trạng thái"
        >
          <Label>Trạng thái</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                  {opt.label}
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
      </div>

      {/* Bookings */}
      {bookingsLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Spinner />
        </div>
      ) : bookings.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-8 text-center text-[var(--muted)]">
            Không có đặt chỗ nào
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const cfg = getStatusConfig("booking", b.status);
            const isActionable = b.status === "Pending";
            const canComplete = b.status === "Confirmed";

            return (
              <Card
                key={b.id}
                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
              >
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Avatar size="md">
                        <Avatar.Fallback>{b.playerName?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() || "?"}</Avatar.Fallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{b.playerName}</p>
                          <Chip size="sm" color={cfg.color} variant="soft">
                            {cfg.label}
                          </Chip>
                        </div>
                        <p className="text-sm text-[var(--muted)] mt-1">
                          {b.courtName} · {b.venueName}
                        </p>
                        <p className="text-sm text-[var(--muted)]">
                          {formatDate(b.startAt)} · {formatTime(b.startAt)} - {formatTime(b.endAt)}
                        </p>
                        {b.note && (
                          <p className="text-xs text-[var(--muted)] mt-1 italic">
                            Ghi chú: {b.note}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-1">
                          {formatVnd(b.totalPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {isActionable && (
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            isDisabled={actionLoading === b.id}
                            onPress={() => handleAction(b.id, "confirm")}
                          >
                            {actionLoading === b.id ? <Spinner size="sm" /> : "Xác nhận"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-[var(--danger)]"
                            isDisabled={actionLoading === b.id}
                            onPress={() => handleAction(b.id, "reject")}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                      {canComplete && (
                        <Button
                          size="sm"
                          variant="primary"
                          isDisabled={actionLoading === b.id}
                          onPress={() => handleAction(b.id, "complete")}
                        >
                          {actionLoading === b.id ? <Spinner size="sm" /> : "Hoàn thành"}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
