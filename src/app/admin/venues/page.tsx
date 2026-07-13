"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Key } from "@heroui/react";
import {
  Card,
  CardContent,
  Button,
  Spinner,
  Chip,
  Select,
  Label,
  ListBox,
} from "@heroui/react";

import Eye from "@gravity-ui/icons/Eye";
import House from "@gravity-ui/icons/House";

import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminVenues } from "@/lib/api/admin";
import type { VenueResponseDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const STATUS_OPTIONS = [
  { key: "", label: "Tất cả" },
  { key: "Pending", label: "Chờ duyệt" },
  { key: "Approved", label: "Đã duyệt" },
  { key: "Rejected", label: "Từ chối" },
  { key: "Suspended", label: "Tạm ngưng" },
];

export default function AdminVenuesPage() {
  return (
    <AdminGuard>
      <AdminShell>
        <VenuesContent />
      </AdminShell>
    </AdminGuard>
  );
}

function VenuesContent() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<Key | null>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const statusVal = statusFilter != null && statusFilter !== "" ? String(statusFilter) : undefined;
    setLoading(true);
    setError(null);
    getAdminVenues(statusVal)
      .then((res) => {
        setVenues(res.data ?? []);
        setTotalCount(res.totalCount);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Lỗi"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Phê duyệt cơ sở</h1>
        <p className="text-sm text-[var(--muted)] mt-1">{totalCount} cơ sở</p>
      </div>

      <Select
        placeholder="Tất cả"
        selectedKey={statusFilter}
        onSelectionChange={(key) => setStatusFilter(key)}
        className="w-52"
        aria-label="Lọc theo trạng thái"
      >
        <Label>Trạng thái</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox items={STATUS_OPTIONS}>
            {(item) => (
              <ListBox.Item key={item.key} id={item.key} textValue={item.label}>
                {item.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}
          </ListBox>
        </Select.Popover>
      </Select>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="flex h-48 items-center justify-center"><p className="text-[var(--danger)]">{error}</p></div>
      ) : venues.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <House className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <p className="text-[var(--muted)]">Không có cơ sở nào</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {venues.map((v) => {
            const cfg = getStatusConfig("venue", v.status);
            return (
              <Card key={v.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{v.name}</p>
                      <Chip size="sm" color={cfg.color} variant="soft">{cfg.label}</Chip>
                    </div>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{v.address}</p>
                    <p className="text-xs text-[var(--muted)]">Chủ: {v.ownerName ?? `ID #${v.ownerId}`} · {v.courts?.length ?? 0} sân · Tạo {formatDate(v.createdAt)}</p>
                  </div>
                  <Link href={`/admin/venues/${v.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-1" />
                      Chi tiết
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
