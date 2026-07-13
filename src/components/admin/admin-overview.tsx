"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  Button,
  Spinner,
} from "@heroui/react";

import House from "@gravity-ui/icons/House";
import PersonGear from "@gravity-ui/icons/PersonGear";
import Star from "@gravity-ui/icons/Star";
import Tags from "@gravity-ui/icons/Tags";
import Wrench from "@gravity-ui/icons/Wrench";

import { AdminStatCard } from "./admin-stat-card";
import { getAdminVenues, getCourtOwners, getAllSportsAdmin, getAllAmenitiesAdmin } from "@/lib/api/admin";

interface OverviewStats {
  pendingVenues: number;
  pendingOwners: number;
  totalSports: number;
  totalAmenities: number;
  approvedVenues: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [venueRes, owners, sports, amenities] = await Promise.all([
          getAdminVenues("Pending"),
          getCourtOwners("Pending"),
          getAllSportsAdmin(),
          getAllAmenitiesAdmin(),
        ]);

        setStats({
          pendingVenues: venueRes.totalCount,
          pendingOwners: owners.length,
          totalSports: sports.length,
          totalAmenities: amenities.length,
          approvedVenues: 0, // Will load separately
        });

        // Load approved count separately
        try {
          const approvedRes = await getAdminVenues("Approved");
          setStats((prev) => prev ? { ...prev, approvedVenues: approvedRes.totalCount } : prev);
        } catch {
          // Non-fatal
        }
      } catch {
        // Stats will stay null
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

  const totalPending = (stats?.pendingVenues ?? 0) + (stats?.pendingOwners ?? 0);

  return (
    <div className="space-y-6">
      {/* Section 1: Page intro row */}
      <div>
        <h1 className="text-2xl font-bold">Tổng quan Admin</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          {totalPending > 0
            ? `Có ${totalPending} mục đang cần xử lý.`
            : "Không có mục nào cần xử lý."}
        </p>
      </div>

      {/* Section 2: Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Cơ sở chờ duyệt"
          value={stats?.pendingVenues ?? 0}
          ctaLabel="Xem danh sách"
          ctaHref="/admin/venues"
          icon={House}
        />
        <AdminStatCard
          title="Chủ sân chờ duyệt"
          value={stats?.pendingOwners ?? 0}
          ctaLabel="Xem hồ sơ"
          ctaHref="/admin/court-owners"
          icon={PersonGear}
        />
        <AdminStatCard
          title="Môn thể thao"
          value={stats?.totalSports ?? 0}
          ctaLabel="Quản lý"
          ctaHref="/admin/sports"
          icon={Tags}
        />
        <AdminStatCard
          title="Tiện ích"
          value={stats?.totalAmenities ?? 0}
          ctaLabel="Quản lý"
          ctaHref="/admin/amenities"
          icon={Wrench}
        />
      </div>

      {/* Section 3: Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard title="Cơ sở hoạt động" value={stats?.approvedVenues ?? 0} icon={House} />
      </div>

      {/* Section 4: Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Duyệt cơ sở mới",
            subtitle: `${stats?.pendingVenues ?? 0} chờ duyệt`,
            icon: House,
            href: "/admin/venues",
          },
          {
            title: "Xác minh chủ sân",
            subtitle: `${stats?.pendingOwners ?? 0} hồ sơ chờ`,
            icon: PersonGear,
            href: "/admin/court-owners",
          },
          {
            title: "Quản lý môn thể thao",
            subtitle: `${stats?.totalSports ?? 0} môn`,
            icon: Tags,
            href: "/admin/sports",
          },
          {
            title: "Quản lý tiện ích",
            subtitle: `${stats?.totalAmenities ?? 0} tiện ích`,
            icon: Wrench,
            href: "/admin/amenities",
          },
        ].map((action) => (
          <Link key={action.title} href={action.href}>
            <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-0 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center shrink-0">
                  <action.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{action.title}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    {action.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
