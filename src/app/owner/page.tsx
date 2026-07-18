"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Avatar, Button, Card, CardContent, CardHeader, CardTitle, Label, ListBox, Select, Skeleton } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import Calendar from "@gravity-ui/icons/Calendar";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import House from "@gravity-ui/icons/House";
import Plus from "@gravity-ui/icons/Plus";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerButtonLink, OwnerEmptyState, OwnerMetricCard, OwnerPageHeader, OwnerStatusChip, OwnerTextLink } from "@/components/owner/owner-ui";
import { getMyVenues, getOwnerStats, getVenueBookings } from "@/lib/api/owner";
import type { BookingResponseDto, OwnerStatsDto, VenueResponseDto } from "@/lib/types/api";
import { formatDate, formatTime, formatVnd, getInitials } from "@/lib/utils/format";

export default function OwnerDashboardPage() {
  return <OwnerGuard><OwnerShell activeItem="dashboard"><DashboardContent /></OwnerShell></OwnerGuard>;
}

function DashboardContent() {
  const [stats, setStats] = useState<OwnerStatsDto | null>(null);
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [pendingBookings, setPendingBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedVenue = venues.find((venue) => venue.id === selectedVenueId);

  async function loadOverview() {
    setLoading(true); setError(null);
    try {
      const [ownerStats, ownerVenues] = await Promise.all([getOwnerStats(), getMyVenues()]);
      setStats(ownerStats); setVenues(ownerVenues); setSelectedVenueId((current) => current ?? ownerVenues[0]?.id ?? null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải dữ liệu tổng quan."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadOverview(); }, []);
  useEffect(() => {
    if (!selectedVenueId) { setPendingBookings([]); return; }
    setBookingLoading(true);
    getVenueBookings(selectedVenueId, { status: "Pending", pageSize: 5 })
      .then((result) => setPendingBookings(result.data ?? []))
      .catch(() => setPendingBookings([]))
      .finally(() => setBookingLoading(false));
  }, [selectedVenueId]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Không tải được tổng quan</Alert.Title><Alert.Description>{error}</Alert.Description><Button size="sm" variant="tertiary" onPress={() => void loadOverview()}>Thử lại</Button></Alert.Content></Alert>;

  return <div className="mx-auto max-w-[1440px] space-y-6">
    <OwnerPageHeader title="Tổng quan" description="Theo dõi cơ sở, sân và đơn đặt sân của bạn" action={<OwnerButtonLink href="/owner/venues/new"><Plus className="mr-1.5 size-4" />Tạo cơ sở</OwnerButtonLink>} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <OwnerMetricCard label="Tổng cơ sở" value={stats?.totalVenues ?? 0} detail="Các cơ sở bạn quản lý" icon={MapPin} href="/owner/venues" />
      <OwnerMetricCard label="Tổng sân" value={stats?.totalCourts ?? 0} detail="Sân thuộc các cơ sở" icon={House} href="/owner/venues" />
      <OwnerMetricCard label="Đơn hôm nay" value={stats?.todayBookings ?? 0} detail="Lịch đặt trong hôm nay" icon={Calendar} href="/owner/bookings" />
      <OwnerMetricCard label="Cần xử lý" value={pendingBookings.length} detail={selectedVenue ? `Đơn chờ tại ${selectedVenue.name}` : "Đơn đang chờ xử lý"} icon={CircleCheck} href="/owner/bookings" />
    </div>
    {venues.length > 1 && <Select selectedKey={selectedVenueId ? String(selectedVenueId) : ""} onSelectionChange={(key) => setSelectedVenueId(Number(key))} className="max-w-sm"><Label>Cơ sở đang xem</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{venues.map((venue) => <ListBox.Item id={String(venue.id)} key={venue.id} textValue={venue.name}>{venue.name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select>}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <Card className="border border-[var(--border)] bg-[var(--surface)] lg:col-span-8"><CardHeader className="flex items-center justify-between p-5 pb-2"><div><CardTitle>Đơn cần xử lý</CardTitle><p className="mt-1 text-xs text-[var(--muted)]">{pendingBookings.length} đơn chờ xử lý</p></div><OwnerTextLink href="/owner/bookings">Xem tất cả</OwnerTextLink></CardHeader><CardContent className="p-5 pt-2">{bookingLoading ? <div className="space-y-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}</div> : pendingBookings.length === 0 ? <p className="py-8 text-sm text-[var(--muted)]">Không có đơn cần xử lý</p> : <div>{pendingBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)}</div>}</CardContent></Card>
      <Card className="border border-[var(--border)] bg-[var(--surface)] lg:col-span-4"><CardHeader className="flex items-center justify-between p-5 pb-2"><CardTitle>Cơ sở của tôi</CardTitle><OwnerTextLink href="/owner/venues">Xem tất cả</OwnerTextLink></CardHeader><CardContent className="p-5 pt-2">{venues.length === 0 ? <OwnerEmptyState title="Bạn chưa có cơ sở nào" description="Tạo cơ sở đầu tiên để thêm sân và nhận đặt chỗ." icon={MapPin} action={<OwnerButtonLink href="/owner/venues/new" size="sm">Tạo cơ sở</OwnerButtonLink>} /> : venues.slice(0, 4).map((venue) => <VenueRow key={venue.id} venue={venue} />)}</CardContent></Card>
    </div>
  </div>;
}

function BookingRow({ booking }: { booking: BookingResponseDto }) {
  return <div className="flex flex-wrap items-center gap-3 border-b border-[var(--separator)] py-3 last:border-0"><Avatar size="sm"><Avatar.Fallback>{getInitials(booking.playerName)}</Avatar.Fallback></Avatar><div className="min-w-40 flex-1"><p className="text-sm font-medium">{booking.playerName}</p><p className="text-xs text-[var(--muted)]">{booking.courtName} · {booking.venueName}</p></div><p className="text-xs text-[var(--muted)]">{formatDate(booking.startAt)} · {formatTime(booking.startAt)}–{formatTime(booking.endAt)}</p><p className="text-sm font-medium">{formatVnd(booking.totalPrice)}</p><OwnerStatusChip kind="booking" status={booking.status} /><OwnerButtonLink href="/owner/bookings" size="sm" variant="tertiary">Xem</OwnerButtonLink></div>;
}

function VenueRow({ venue }: { venue: VenueResponseDto }) {
  const cover = venue.images.find((image) => image.isCover) ?? venue.images[0];
  return <Link href={`/owner/venues/${venue.id}`} className="flex items-center gap-3 border-b border-[var(--separator)] py-3 last:border-0 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"><Avatar className="size-12 shrink-0 rounded-xl">{cover && <Avatar.Image src={cover.imageUrl} alt={`Ảnh ${venue.name}`} />}<Avatar.Fallback className="rounded-xl"><MapPin className="size-5 text-[var(--muted)]" /></Avatar.Fallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{venue.name}</p><p className="truncate text-xs text-[var(--muted)]">{venue.address}</p></div><OwnerStatusChip kind="venue" status={venue.status} /></Link>;
}

function DashboardSkeleton() { return <div className="space-y-6"><Skeleton className="h-16 w-80 rounded-xl" /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}</div><Skeleton className="h-72 rounded-xl" /></div>; }
