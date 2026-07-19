"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Chip, Modal, Spinner, Table } from "@heroui/react";
import ArrowLeft from "@gravity-ui/icons/ArrowLeft";
import Check from "@gravity-ui/icons/Check";
import Pause from "@gravity-ui/icons/Pause";
import Xmark from "@gravity-ui/icons/Xmark";
import { AdminGuard } from "@/lib/auth/guards";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminVenueById, updateVenueStatus } from "@/lib/api/admin";
import { getVenueCourts } from "@/lib/api/discovery";
import type { CourtDto, VenueResponseDto } from "@/lib/types/api";
import { formatDate, formatTime } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

const DAY_NAMES: Record<number, string> = {
  0: "Chủ nhật", 1: "Thứ hai", 2: "Thứ ba", 3: "Thứ tư",
  4: "Thứ năm", 5: "Thứ sáu", 6: "Thứ bảy", 7: "Chủ nhật",
};

export default function AdminVenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AdminGuard><AdminShell><VenueDetail venueId={Number(id)} /></AdminShell></AdminGuard>;
}

function VenueDetail({ venueId }: { venueId: number }) {
  const router = useRouter();
  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState<2 | 3 | null>(null);

  useEffect(() => {
    setLoading(true); setError(null);
    Promise.all([getAdminVenueById(venueId), getVenueCourts(venueId)])
      .then(([venueData, courtData]) => { setVenue(venueData); setCourts(courtData); })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Không thể tải cơ sở"))
      .finally(() => setLoading(false));
  }, [venueId]);

  async function changeStatus(status: 1 | 2 | 3) {
    setPending(true); setError(null);
    try { await updateVenueStatus(venueId, { status }); router.push("/admin/venues"); }
    catch { /* apiFetch shows the toast. */ }
    finally { setPending(false); setAction(null); }
  }

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  if (!venue) return <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error ?? "Không tìm thấy cơ sở"}</Alert.Description></Alert.Content></Alert>;
  const status = getStatusConfig("venue", venue.status);

  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><Link href="/admin/venues"><Button isIconOnly variant="ghost" aria-label="Quay lại"><ArrowLeft className="size-5" /></Button></Link><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-bold">{venue.name}</h1><Chip size="sm" color={status.color} variant="soft">{status.label}</Chip></div><p className="mt-1 text-sm text-[var(--muted)]">{venue.address}</p></div></div><div className="flex gap-2">{venue.status !== "Approved" && <Button onPress={() => changeStatus(1)} isDisabled={pending}><Check className="size-4" />Duyệt</Button>}{venue.status === "Pending" && <Button variant="danger" onPress={() => setAction(2)} isDisabled={pending}><Xmark className="size-4" />Từ chối</Button>}{venue.status === "Approved" && <Button variant="ghost" onPress={() => setAction(3)} isDisabled={pending}><Pause className="size-4" />Tạm ngưng</Button>}</div></div>
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{error}</Alert.Description></Alert.Content></Alert>}

    <div className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Thông tin cơ sở</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Info label="Tên" value={venue.name} /><Info label="Địa chỉ" value={venue.address} /><Info label="Điện thoại" value={venue.phone} /><Info label="Mô tả" value={venue.description} /><Info label="Ngày tạo" value={formatDate(venue.createdAt)} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Hồ sơ chủ sân</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><Info label="Mã hồ sơ" value={`#${venue.courtOwnerProfileId}`} /><Info label="Số sân" value={String(courts.length)} /><Info label="Tiện ích" value={String(venue.amenities?.length ?? 0)} /><Info label="Hình ảnh" value={String(venue.images?.length ?? 0)} /></CardContent></Card>
    </div>

    <section className="space-y-3"><div><h2 className="text-lg font-semibold">Danh sách sân</h2><p className="text-sm text-[var(--muted)]">{courts.length} sân thuộc cơ sở</p></div>{courts.length === 0 ? <p className="py-6 text-sm text-[var(--muted)]">Cơ sở chưa có sân.</p> : <Table aria-label="Danh sách sân"><Table.ScrollContainer><Table.Content><Table.Header><Table.Column isRowHeader>Tên sân</Table.Column><Table.Column>Môn thể thao</Table.Column><Table.Column>Không gian</Table.Column><Table.Column>Trạng thái</Table.Column></Table.Header><Table.Body items={courts}>{(court) => { const courtStatus = getStatusConfig("court", court.status); return <Table.Row id={court.id}><Table.Cell className="font-medium">{court.name}</Table.Cell><Table.Cell>{court.sportName}</Table.Cell><Table.Cell>{court.indoor ? "Trong nhà" : "Ngoài trời"}</Table.Cell><Table.Cell><Chip size="sm" color={courtStatus.color} variant="soft">{courtStatus.label}</Chip></Table.Cell></Table.Row>; }}</Table.Body></Table.Content></Table.ScrollContainer></Table>}</section>

    {venue.openingHours?.length > 0 && <Card><CardHeader><CardTitle>Giờ mở cửa</CardTitle></CardHeader><CardContent className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">{venue.openingHours.map((hour) => <div key={hour.dayOfWeek} className="flex justify-between gap-4 border-b border-[var(--border)] py-2"><span className="font-medium">{DAY_NAMES[hour.dayOfWeek]}</span><span className="text-[var(--muted)]">{hour.isClosed || !hour.openTime || !hour.closeTime ? "Đóng cửa" : `${formatTime(hour.openTime)} – ${formatTime(hour.closeTime)}`}</span></div>)}</CardContent></Card>}

    {venue.images?.length > 0 && <Card><CardHeader><CardTitle>Hình ảnh</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{venue.images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-xl"><img src={image.imageUrl} alt={`Hình ảnh ${venue.name}`} className="h-32 w-full object-cover" />{image.isCover && <Chip className="absolute left-2 top-2" size="sm">Ảnh bìa</Chip>}</div>)}</div></CardContent></Card>}

    <Modal isOpen={action !== null} onOpenChange={(open) => { if (!open) setAction(null); }}><Modal.Backdrop><Modal.Container><Modal.Dialog className="sm:max-w-sm"><Modal.CloseTrigger /><Modal.Header><Modal.Heading>{action === 2 ? "Từ chối cơ sở" : "Tạm ngưng cơ sở"}</Modal.Heading></Modal.Header><Modal.Body><p className="text-sm text-[var(--muted)]">Bạn có chắc muốn {action === 2 ? "từ chối" : "tạm ngưng"} “{venue.name}”?</p></Modal.Body><Modal.Footer><Button variant="ghost" onPress={() => setAction(null)} isDisabled={pending}>Hủy</Button><Button variant={action === 2 ? "danger" : "primary"} onPress={() => action && changeStatus(action)} isDisabled={pending}>{pending && <Spinner size="sm" />}Xác nhận</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>
  </div>;
}

function Info({ label, value }: { label: string; value: string | null }) { return <div className="flex justify-between gap-4"><span className="shrink-0 text-[var(--muted)]">{label}</span><span className="text-right">{value || "—"}</span></div>; }
