"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Spinner,
  Chip,
  Modal,
  TextField,
  Input,
  Label,
} from "@heroui/react";

import ArrowLeft from "@gravity-ui/icons/ArrowLeft";
import Check from "@gravity-ui/icons/Check";
import Xmark from "@gravity-ui/icons/Xmark";
import Pause from "@gravity-ui/icons/Pause";

import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminVenueById, updateVenueStatus } from "@/lib/api/admin";
import type { VenueResponseDto } from "@/lib/types/api";
import { formatDate, formatTime, formatVnd } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function AdminVenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminGuard>
      <AdminShell>
        <VenueDetail venueId={Number(id)} />
      </AdminShell>
    </AdminGuard>
  );
}

function VenueDetail({ venueId }: { venueId: number }) {
  const router = useRouter();
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"Rejected" | "Suspended" | null>(null);

  useEffect(() => {
    getAdminVenueById(venueId)
      .then(setVenue)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Lỗi"))
      .finally(() => setLoading(false));
  }, [venueId]);

  async function handleApprove() {
    setActionLoading(true);
    try {
      await updateVenueStatus(venueId, { status: "Approved" });
      router.push("/admin/venues");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectOrSuspend() {
    if (!pendingAction) return;
    setActionLoading(true);
    try {
      await updateVenueStatus(venueId, { status: pendingAction, rejectionReason: rejectReason || undefined });
      router.push("/admin/venues");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(false);
      setModalOpen(false);
    }
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (error || !venue) {
    return <div className="flex h-64 items-center justify-center"><p className="text-[var(--danger)]">{error ?? "Không tìm thấy cơ sở"}</p></div>;
  }

  const venueCfg = getStatusConfig("venue", venue.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/venues">
            <Button variant="ghost" isIconOnly aria-label="Quay lại">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{venue.name}</h1>
              <Chip size="sm" color={venueCfg.color} variant="soft">{venueCfg.label}</Chip>
            </div>
            <p className="text-sm text-[var(--muted)] mt-0.5">{venue.address}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {venue.status === "Pending" && (
            <>
              <Button variant="primary" isDisabled={actionLoading} onPress={handleApprove}>
                <Check className="w-4 h-4 mr-1.5" />
                Duyệt
              </Button>
              <Button variant="ghost" className="text-[var(--danger)]" isDisabled={actionLoading} onPress={() => { setPendingAction("Rejected"); setRejectReason(""); setModalOpen(true); }}>
                <Xmark className="w-4 h-4 mr-1.5" />
                Từ chối
              </Button>
            </>
          )}
          {venue.status === "Approved" && (
            <Button variant="ghost" className="text-[var(--warning)]" isDisabled={actionLoading} onPress={() => { setPendingAction("Suspended"); setRejectReason(""); setModalOpen(true); }}>
              <Pause className="w-4 h-4 mr-1.5" />
              Tạm ngưng
            </Button>
          )}
          {(venue.status === "Rejected" || venue.status === "Suspended") && (
            <Button variant="primary" isDisabled={actionLoading} onPress={handleApprove}>
              <Check className="w-4 h-4 mr-1.5" />
              Duyệt lại
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-base font-semibold">Thông tin cơ sở</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-sm">
            <InfoRow label="Tên" value={venue.name} />
            <InfoRow label="Địa chỉ" value={venue.address} />
            <InfoRow label="Điện thoại" value={venue.phone ?? "—"} />
            <InfoRow label="Mô tả" value={venue.description ?? "—"} />
            <InfoRow label="Chủ sở hữu" value={venue.ownerName ?? `ID #${venue.ownerId}`} />
            <InfoRow label="Ngày tạo" value={formatDate(venue.createdAt)} />
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="p-5 pb-0">
            <CardTitle className="text-base font-semibold">Thống kê</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-sm">
            <InfoRow label="Sân" value={String(venue.courts?.length ?? 0)} />
            <InfoRow label="Tiện ích" value={String(venue.amenities?.length ?? 0)} />
            <InfoRow label="Hình ảnh" value={String(venue.images?.length ?? 0)} />
          </CardContent>
        </Card>
      </div>

      {venue.courts && venue.courts.length > 0 && (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="p-5 pb-0"><CardTitle className="text-base font-semibold">Danh sách sân</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-2">
            {venue.courts.map((c) => {
              const courtCfg = getStatusConfig("court", c.status);
              return (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-[var(--muted)]">{c.sportName} · {c.indoor ? "Trong nhà" : "Ngoài trời"}</p>
                  </div>
                  <Chip size="sm" color={courtCfg.color} variant="soft">{courtCfg.label}</Chip>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {venue.openingHours && venue.openingHours.length > 0 && (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="p-5 pb-0"><CardTitle className="text-base font-semibold">Giờ mở cửa</CardTitle></CardHeader>
          <CardContent className="p-5 space-y-2">
            {venue.openingHours.map((h) => (
              <div key={h.dayOfWeek} className="flex items-center justify-between py-1.5 text-sm">
                <span className="font-medium w-12">{DAY_NAMES[h.dayOfWeek]}</span>
                {h.isClosed ? <span className="text-[var(--muted)]">Đóng cửa</span> : <span>{formatTime(h.openTime)} — {formatTime(h.closeTime)}</span>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {venue.images && venue.images.length > 0 && (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardHeader className="p-5 pb-0"><CardTitle className="text-base font-semibold">Hình ảnh</CardTitle></CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {venue.images.map((img) => (
                <div key={img.id} className="relative rounded-xl overflow-hidden">
                  <img src={img.imageUrl} alt="" className="w-full h-32 object-cover" />
                  {img.isCover && <div className="absolute top-1 left-1"><Chip size="sm" color="accent">Bìa</Chip></div>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Modal isOpen={modalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-md">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>{pendingAction === "Rejected" ? "Từ chối cơ sở" : "Tạm ngưng cơ sở"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <TextField value={rejectReason} onChange={(v) => setRejectReason(String(v))} aria-label="Lý do">
                  <Label>Lý do (tùy chọn)</Label>
                  <Input placeholder="Nhập lý do..." />
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" slot="close" isDisabled={actionLoading}>Hủy</Button>
                <Button variant={pendingAction === "Rejected" ? "danger" : "primary"} isDisabled={actionLoading} onPress={handleRejectOrSuspend}>
                  {actionLoading ? <Spinner size="sm" className="mr-2" /> : null}
                  {pendingAction === "Rejected" ? "Từ chối" : "Tạm ngưng"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--muted)] shrink-0">{label}</span>
      <span className="text-right truncate">{value}</span>
    </div>
  );
}
