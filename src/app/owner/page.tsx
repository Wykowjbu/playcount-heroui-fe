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
} from "@heroui/react";

import House from "@gravity-ui/icons/House";
import ListCheck from "@gravity-ui/icons/ListCheck";
import Clock from "@gravity-ui/icons/Clock";
import Wallet from "@gravity-ui/icons/Wallet";
import Plus from "@gravity-ui/icons/Plus";
import BarsAscendingAlignLeft from "@gravity-ui/icons/BarsAscendingAlignLeft";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { getOwnerStats, getMyVenues, getVenueBookings } from "@/lib/api/owner";
import type { OwnerStatsDto, VenueResponseDto, BookingResponseDto } from "@/lib/types/api";
import { formatVnd, formatDate, formatRelativeTime } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { AdminStatCard } from "@/components/admin/admin-stat-card";

export default function OwnerDashboardPage() {
  return (
    <OwnerGuard>
      <OwnerShell activeItem="dashboard">
        <DashboardContent />
      </OwnerShell>
    </OwnerGuard>
  );
}

function DashboardContent() {
  const [stats, setStats] = useState<OwnerStatsDto | null>(null);
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [s, v] = await Promise.all([getOwnerStats(), getMyVenues()]);
        setStats(s);
        setVenues(v);

        if (v.length > 0) {
          try {
            const bookingsRes = await getVenueBookings(v[0].id, { pageSize: 5 });
            setRecentBookings(bookingsRes.data ?? []);
          } catch {
            // Non-fatal
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-[var(--danger)]">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Quản lý sân bãi và đặt chỗ của bạn</p>
        </div>
        <Link href="/owner/venues/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo cơ sở mới
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard title="Tổng cơ sở" value={stats?.totalVenues ?? 0} subtitle={`${stats?.activeVenues ?? 0} đang hoạt động`} icon={House} ctaLabel="Quản lý" ctaHref="/owner/venues" />
        <AdminStatCard title="Đặt chờ xác nhận" value={stats?.pendingBookings ?? 0} subtitle="Cần xử lý" icon={ListCheck} ctaLabel="Xem đặt chỗ" ctaHref="/owner/bookings" />
        <AdminStatCard title="Đặt hôm nay" value={stats?.todayBookings ?? 0} icon={Clock} />
        <AdminStatCard title="Tổng doanh thu" value={formatVnd(stats?.totalRevenue ?? 0)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="flex justify-between items-center p-5 pb-0">
            <CardTitle className="text-base font-semibold">Cơ sở của tôi</CardTitle>
            <Link href="/owner/venues">
              <Button variant="ghost" size="sm">Xem tất cả</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {venues.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-6">
                Chưa có cơ sở nào.{" "}
                <Link href="/owner/venues/new" className="text-[var(--accent)] underline">Tạo mới</Link>
              </p>
            ) : (
              venues.slice(0, 4).map((v) => {
                const cfg = getStatusConfig("venue", v.status);
                return (
                  <Link key={v.id} href={`/owner/venues/${v.id}`} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-secondary)]/50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{v.name}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{v.address}</p>
                    </div>
                    <Chip size="sm" color={cfg.color} variant="soft">{cfg.label}</Chip>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="flex justify-between items-center p-5 pb-0">
            <CardTitle className="text-base font-semibold">Đặt chỗ gần đây</CardTitle>
            <Link href="/owner/bookings">
              <Button variant="ghost" size="sm">Xem tất cả</Button>
            </Link>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {recentBookings.length === 0 ? (
              <p className="text-sm text-[var(--muted)] text-center py-6">Chưa có đặt chỗ nào</p>
            ) : (
              recentBookings.map((b) => {
                const cfg = getStatusConfig("booking", b.status);
                return (
                  <div key={b.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                    <div className="min-w-0 flex items-center gap-3">
                      <Avatar size="md">
                        <Avatar.Fallback>{b.playerName?.charAt(0) ?? "?"}</Avatar.Fallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{b.playerName}</p>
                        <p className="text-xs text-[var(--muted)]">{b.courtName} · {formatDate(b.startAt)}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <Chip size="sm" color={cfg.color} variant="soft">{cfg.label}</Chip>
                      <p className="text-xs text-[var(--muted)] mt-1">{formatRelativeTime(b.createdAt)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { title: "Tạo cơ sở mới", subtitle: "Đăng ký sân bãi", icon: Plus, href: "/owner/venues/new" },
          { title: "Quản lý đặt chỗ", subtitle: "Xác nhận & từ chối", icon: ListCheck, href: "/owner/bookings" },
          { title: "Quản lý cơ sở", subtitle: "Sửa thông tin, sân", icon: BarsAscendingAlignLeft, href: "/owner/venues" },
        ].map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-0 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center">
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-xs text-[var(--muted)]">{action.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
