"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  Button,
  Spinner,
  Chip,
} from "@heroui/react";

import Plus from "@gravity-ui/icons/Plus";
import Eye from "@gravity-ui/icons/Eye";
import Pencil from "@gravity-ui/icons/Pencil";
import House from "@gravity-ui/icons/House";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { getMyVenues } from "@/lib/api/owner";
import type { VenueResponseDto } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

export default function OwnerVenuesPage() {
  return (
    <OwnerGuard>
      <OwnerShell activeItem="venues">
        <VenuesContent />
      </OwnerShell>
    </OwnerGuard>
  );
}

function VenuesContent() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyVenues()
      .then(setVenues)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Lỗi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (error) {
    return <div className="flex h-64 items-center justify-center"><p className="text-[var(--danger)]">{error}</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cơ sở của tôi</h1>
          <p className="text-sm text-[var(--muted)] mt-1">{venues.length} cơ sở</p>
        </div>
        <Link href="/owner/venues/new">
          <Button variant="primary">
            <Plus className="w-4 h-4 mr-1.5" />
            Tạo cơ sở mới
          </Button>
        </Link>
      </div>

      {venues.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <House className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">Chưa có cơ sở nào</p>
              <p className="text-sm text-[var(--muted)] mt-1">Tạo cơ sở đầu tiên để bắt đầu quản lý sân bãi</p>
            </div>
            <Link href="/owner/venues/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-1.5" />
                Tạo cơ sở mới
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {venues.map((v) => {
            const cfg = getStatusConfig("venue", v.status);
            const cover = v.images?.find((i) => i.isCover) ?? v.images?.[0];
            return (
              <Card key={v.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm overflow-hidden">
                {cover && (
                  <div className="h-40 overflow-hidden">
                    <img src={cover.imageUrl} alt={v.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{v.name}</h3>
                      <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{v.address}</p>
                    </div>
                    <Chip size="sm" color={cfg.color} variant="soft" className="shrink-0">{cfg.label}</Chip>
                  </div>
                  <div className="text-xs text-[var(--muted)]">{v.courts?.length ?? 0} sân · Tạo {formatDate(v.createdAt)}</div>
                  <div className="flex gap-2 pt-1">
                    <Link href={`/owner/venues/${v.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-1" />
                        Chi tiết
                      </Button>
                    </Link>
                    <Link href={`/owner/venues/${v.id}/edit`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        <Pencil className="w-4 h-4 mr-1" />
                        Sửa
                      </Button>
                    </Link>
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
