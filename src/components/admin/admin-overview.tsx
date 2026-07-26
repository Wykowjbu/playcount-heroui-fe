"use client";

import { useEffect, useState } from "react";
import { Spinner } from "@heroui/react";

import House from "@gravity-ui/icons/House";
import PersonGear from "@gravity-ui/icons/PersonGear";
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
          pendingVenues: venueRes.totalCount ?? venueRes.data?.length ?? 0,
          pendingOwners: owners.length,
          totalSports: sports.length,
          totalAmenities: amenities.length,
          approvedVenues: 0, // Will load separately
        });

        // Load approved count separately
        try {
          const approvedRes = await getAdminVenues("Approved");
          setStats((prev) => prev ? { ...prev, approvedVenues: approvedRes.totalCount ?? approvedRes.data?.length ?? 0 } : prev);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">Tổng quan Admin</h1>
        <p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">
          {totalPending > 0
            ? `Có ${totalPending} mục đang cần xử lý.`
            : "Không có mục nào cần xử lý."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <AdminStatCard title="Cơ sở hoạt động" value={stats?.approvedVenues ?? 0} icon={House} />
        <AdminStatCard title="Môn thể thao" value={stats?.totalSports ?? 0} ctaLabel="Quản lý" ctaHref="/admin/sports" icon={Tags} />
        <AdminStatCard title="Tiện ích" value={stats?.totalAmenities ?? 0} ctaLabel="Quản lý" ctaHref="/admin/amenities" icon={Wrench} />
      </div>
    </div>
  );
}
