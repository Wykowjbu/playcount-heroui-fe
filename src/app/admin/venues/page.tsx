"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Key } from "@heroui/react";
import { Alert, Button, Chip, EmptyState, Label, ListBox, Select, Spinner, Table } from "@heroui/react";
import Eye from "@gravity-ui/icons/Eye";
import House from "@gravity-ui/icons/House";
import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminVenues } from "@/lib/api/admin";
import type { VenueResponseDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const STATUS_OPTIONS = [
  { key: "", label: "Tất cả" }, { key: "Pending", label: "Chờ duyệt" },
  { key: "Approved", label: "Đã duyệt" }, { key: "Rejected", label: "Từ chối" },
  { key: "Suspended", label: "Tạm ngưng" },
];

export default function AdminVenuesPage() {
  return <AdminGuard><AdminShell><VenuesContent /></AdminShell></AdminGuard>;
}

function VenuesContent() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [statusFilter, setStatusFilter] = useState<Key | null>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const status = statusFilter ? String(statusFilter) : undefined;
    setLoading(true); setError(null);
    getAdminVenues(status).then((res) => {
      const data = res.data ?? [];
      setVenues(data); setTotalCount(res.totalCount ?? data.length);
    }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Không thể tải danh sách"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-2xl font-bold">Phê duyệt cơ sở</h1><p className="mt-1 text-sm text-[var(--muted)]">{totalCount} cơ sở</p></div>
      <Select selectedKey={statusFilter} onSelectionChange={setStatusFilter} className="w-52" aria-label="Lọc theo trạng thái">
        <Label>Trạng thái</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
        <Select.Popover><ListBox items={STATUS_OPTIONS}>{(item) => <ListBox.Item id={item.key} textValue={item.label}>{item.label}<ListBox.ItemIndicator /></ListBox.Item>}</ListBox></Select.Popover>
      </Select>
    </div>
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}
    {loading ? <div className="flex h-48 items-center justify-center"><Spinner size="lg" /></div> : venues.length === 0 ?
      <EmptyState className="py-12 text-center"><House className="mx-auto mb-3 size-8 text-[var(--muted)]" /><p className="font-medium">Không có cơ sở</p><p className="mt-1 text-sm text-[var(--muted)]">Không có dữ liệu phù hợp với bộ lọc hiện tại.</p></EmptyState> :
      <Table aria-label="Danh sách cơ sở">
        <Table.ScrollContainer><Table.Content>
          <Table.Header><Table.Column isRowHeader>Cơ sở</Table.Column><Table.Column>Chủ sân</Table.Column><Table.Column>Trạng thái</Table.Column><Table.Column>Ngày tạo</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header>
          <Table.Body items={venues}>{(venue) => {
            const status = getStatusConfig("venue", venue.status);
            return <Table.Row id={venue.id}>
              <Table.Cell><div className="max-w-md"><p className="font-medium">{venue.name}</p><p className="truncate text-xs text-[var(--muted)]">{venue.address}</p></div></Table.Cell>
              <Table.Cell>Hồ sơ #{venue.courtOwnerProfileId}</Table.Cell>
              <Table.Cell><Chip size="sm" color={status.color} variant="soft">{status.label}</Chip></Table.Cell>
              <Table.Cell>{formatDate(venue.createdAt)}</Table.Cell>
              <Table.Cell><Link href={`/admin/venues/${venue.id}`}><Button size="sm" variant="ghost"><Eye className="size-4" />Chi tiết</Button></Link></Table.Cell>
            </Table.Row>;
          }}</Table.Body>
        </Table.Content></Table.ScrollContainer>
      </Table>}
  </div>;
}
