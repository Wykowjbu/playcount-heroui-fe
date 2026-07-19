"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDialog, Button, Card, CardContent, Drawer, Label, ListBox, SearchField, Select, Skeleton, TextArea, TextField, Table } from "@heroui/react";
import Eye from "@gravity-ui/icons/Eye";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerButtonLink, OwnerEmptyState, OwnerPageHeader, OwnerStatusChip } from "@/components/owner/owner-ui";
import { completeBooking, confirmBooking, getMyVenues, getVenueBookings, rejectBooking } from "@/lib/api/owner";
import { getBookingById } from "@/lib/api/bookings";
import { ApiError } from "@/lib/api/client";
import { getBookingPayments } from "@/lib/api/payments";
import type { BookingResponseDto, PaymentDto, VenueResponseDto } from "@/lib/types/api";
import { formatDate, formatDateTime, formatTime, formatVnd } from "@/lib/utils/format";
import { canCompleteBooking } from "@/components/owner/venue-detail-model";
import { getPaymentBookingId } from "@/lib/utils/flow-navigation";

const STATUS_OPTIONS = [["", "Tất cả trạng thái"], ["Pending", "Chờ xử lý"], ["Confirmed", "Đã xác nhận"], ["Completed", "Hoàn thành"], ["CancelledByUser", "Khách hủy"], ["CancelledByOwner", "Chủ sân hủy"], ["Expired", "Hết hạn"]] as const;

export default function OwnerBookingsPage() { return <OwnerGuard><OwnerShell activeItem="bookings"><Suspense fallback={<Skeleton className="h-32 rounded-xl" />}><BookingsContent /></Suspense></OwnerShell></OwnerGuard>; }

function BookingsContent() {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams(); const queryBookingId = getPaymentBookingId(searchParams);
  const [venues, setVenues] = useState<VenueResponseDto[]>([]); const [venueId, setVenueId] = useState<number | null>(null); const [bookings, setBookings] = useState<BookingResponseDto[]>([]);
  const [status, setStatus] = useState(""); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const [bookingLoading, setBookingLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [directError, setDirectError] = useState(""); const [selected, setSelected] = useState<BookingResponseDto | null>(null);
  async function loadVenues() { setLoading(true); setError(null); try { const ownerVenues = await getMyVenues(); setVenues(ownerVenues); setVenueId((current) => current ?? ownerVenues[0]?.id ?? null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải cơ sở."); } finally { setLoading(false); } }
  async function loadBookings() { if (!venueId) return; setBookingLoading(true); try { const result = await getVenueBookings(venueId, { status: status || undefined, pageSize: 50 }); setBookings(result.data ?? []); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đơn đặt sân."); } finally { setBookingLoading(false); } }
  useEffect(() => { void loadVenues(); }, []); useEffect(() => { if (!venueId) return; setBookingLoading(true); getVenueBookings(venueId, { status: status || undefined, pageSize: 50 }).then((result) => setBookings(result.data ?? [])).catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể tải đơn đặt sân.")).finally(() => setBookingLoading(false)); }, [venueId, status]);
  useEffect(() => {
    let active = true;
    setSelected(null); setDirectError("");
    if (!queryBookingId) return () => { active = false; };
    getBookingById(queryBookingId).then((booking) => { if (active) setSelected(booking); }).catch((cause) => { if (active) setDirectError(cause instanceof ApiError && cause.status === 404 ? "Đơn đặt sân không tồn tại hoặc đã bị xóa." : cause instanceof ApiError && cause.status === 403 ? "Bạn không có quyền xem đơn đặt sân này." : cause instanceof Error ? cause.message : "Không thể mở đơn đặt sân."); });
    return () => { active = false; };
  }, [queryBookingId]);
  const visibleBookings = useMemo(() => { const term = search.trim().toLocaleLowerCase("vi"); return term ? bookings.filter((booking) => `${booking.playerName} ${booking.courtName}`.toLocaleLowerCase("vi").includes(term)) : bookings; }, [bookings, search]);
  const reset = () => { setStatus(""); setSearch(""); };
  const closeDrawer = () => {
    setSelected(null);
    if (!searchParams.has("bookingId")) return;
    const params = new URLSearchParams(searchParams.toString()); params.delete("bookingId");
    const query = params.toString(); router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
  };
  const directFeedback = directError && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Không mở được đơn đặt sân</Alert.Title><Alert.Description>{directError}</Alert.Description></Alert.Content></Alert>;
  if (loading) return <><div className="space-y-6"><Skeleton className="h-16 w-80 rounded-xl" /><Skeleton className="h-24 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>{directFeedback}<BookingDrawer booking={selected} onClose={closeDrawer} onChanged={loadBookings} /></>;
  if (venues.length === 0) return <><div className="space-y-6"><OwnerPageHeader title="Đơn đặt sân" description="Theo dõi và xử lý đơn theo từng cơ sở" /><OwnerEmptyState title="Bạn chưa có cơ sở nào" description="Tạo cơ sở để bắt đầu nhận và xử lý đơn đặt sân." action={<OwnerButtonLink href="/owner/venues/new">Tạo cơ sở</OwnerButtonLink>} /></div>{directFeedback}<BookingDrawer booking={selected} onClose={closeDrawer} onChanged={loadBookings} /></>;
  return <div className="mx-auto max-w-[1440px] space-y-6"><OwnerPageHeader title="Đơn đặt sân" description="Theo dõi và xử lý đơn theo từng cơ sở" />
    {directFeedback}
    {error && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Title>Không tải được dữ liệu</Alert.Title><Alert.Description>{error}</Alert.Description><Button size="sm" variant="tertiary" onPress={() => void loadBookings()}>Thử lại</Button></Alert.Content></Alert>}
    <Card className="border border-[var(--border)] bg-[var(--surface)]"><CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_220px_minmax(0,1fr)_auto]"><Select selectedKey={venueId ? String(venueId) : ""} onSelectionChange={(key) => setVenueId(Number(key))}><Label>Cơ sở</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{venues.map((venue) => <ListBox.Item id={String(venue.id)} key={venue.id} textValue={venue.name}>{venue.name}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select><Select selectedKey={status} onSelectionChange={(key) => setStatus(String(key))}><Label>Trạng thái</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{STATUS_OPTIONS.map(([value, label]) => <ListBox.Item id={value} key={value} textValue={label}>{label}<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover></Select><SearchField value={search} onChange={setSearch}><Label>Tìm khách hoặc sân</Label><SearchField.Group><SearchField.Input placeholder="Nhập từ khóa" /><SearchField.ClearButton /></SearchField.Group></SearchField>{(status || search) && <Button className="self-end" variant="tertiary" onPress={reset}>Xóa bộ lọc</Button>}</CardContent></Card>
    {bookingLoading ? <div className="space-y-3">{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-16 rounded-xl" key={index} />)}</div> : visibleBookings.length === 0 ? <OwnerEmptyState title="Không có đơn đặt sân" description="Thử thay đổi bộ lọc hoặc chọn một cơ sở khác." /> : <><div className="hidden md:block"><BookingTable bookings={visibleBookings} onView={setSelected} /></div><div className="grid gap-3 md:hidden">{visibleBookings.map((booking) => <BookingCard booking={booking} key={booking.id} onView={setSelected} />)}</div></>}
    <BookingDrawer booking={selected} onClose={closeDrawer} onChanged={loadBookings} />
  </div>;
}

function BookingTable({ bookings, onView }: { bookings: BookingResponseDto[]; onView: (booking: BookingResponseDto) => void }) { return <Table><Table.ScrollContainer><Table.Content aria-label="Danh sách đơn đặt sân"><Table.Header><Table.Column isRowHeader>Khách hàng</Table.Column><Table.Column>Sân</Table.Column><Table.Column>Thời gian</Table.Column><Table.Column>Tổng tiền</Table.Column><Table.Column>Trạng thái</Table.Column><Table.Column>Thao tác</Table.Column></Table.Header><Table.Body>{bookings.map((booking) => <Table.Row id={booking.id} key={booking.id}><Table.Cell>{booking.playerName}</Table.Cell><Table.Cell><p>{booking.courtName}</p><p className="text-xs text-[var(--muted)]">{booking.venueName}</p></Table.Cell><Table.Cell>{formatDate(booking.startAt)}<br /><span className="text-xs text-[var(--muted)]">{formatTime(booking.startAt)}–{formatTime(booking.endAt)}</span></Table.Cell><Table.Cell>{formatVnd(booking.totalPrice)}</Table.Cell><Table.Cell><OwnerStatusChip kind="booking" status={booking.status} /></Table.Cell><Table.Cell><Button size="sm" variant="tertiary" onPress={() => onView(booking)}><Eye className="mr-1 size-4" />Xem</Button></Table.Cell></Table.Row>)}</Table.Body></Table.Content></Table.ScrollContainer></Table>; }

function BookingCard({ booking, onView }: { booking: BookingResponseDto; onView: (booking: BookingResponseDto) => void }) { return <Card className="border border-[var(--border)] bg-[var(--surface)]"><CardContent className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><p className="font-semibold">{booking.playerName}</p><OwnerStatusChip kind="booking" status={booking.status} /></div><p className="text-sm">{booking.courtName} · {booking.venueName}</p><p className="text-sm text-[var(--muted)]">{formatDate(booking.startAt)} · {formatTime(booking.startAt)}–{formatTime(booking.endAt)}</p><div className="flex items-center justify-between"><p className="font-medium">{formatVnd(booking.totalPrice)}</p><Button size="sm" variant="tertiary" onPress={() => onView(booking)}>Xem chi tiết</Button></div></CardContent></Card>; }

function BookingDrawer({ booking, onClose, onChanged }: { booking: BookingResponseDto | null; onClose: () => void; onChanged: () => Promise<void> }) {
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("");
  const [actionError, setActionError] = useState("");
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    if (!booking) return;
    let active = true;
    setReason(""); setActionError(""); setPayments([]); setPaymentError(""); setPaymentLoading(true);
    getBookingPayments(booking.id).then((items) => { if (active) setPayments(items); }).catch((cause) => { if (active) setPaymentError(cause instanceof Error ? cause.message : "Không thể tải thanh toán"); }).finally(() => { if (active) setPaymentLoading(false); });
    return () => { active = false; };
  }, [booking]);

  if (!booking) return null;
  const bookingId = booking.id;

  async function action(kind: "confirm" | "reject" | "complete") {
    setPending(true); setActionError("");
    try {
      if (kind === "confirm") await confirmBooking(bookingId);
      if (kind === "reject") await rejectBooking(bookingId, reason.trim());
      if (kind === "complete") await completeBooking(bookingId);
      await onChanged(); onClose();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Không thể cập nhật đơn đặt sân");
    } finally { setPending(false); }
  }

  return <Drawer isOpen onOpenChange={(open) => { if (!open) onClose(); }}><Drawer.Backdrop><Drawer.Content placement="right"><Drawer.Dialog className="w-full sm:w-[42rem] sm:max-w-[calc(100vw-2rem)]"><Drawer.Header><Drawer.Heading>Chi tiết đơn #{booking.id}</Drawer.Heading><Drawer.CloseTrigger /></Drawer.Header><Drawer.Body className="space-y-5">
    {actionError && <Alert status="danger"><Alert.Indicator /><Alert.Content><Alert.Description>{actionError}</Alert.Description></Alert.Content></Alert>}
    <div className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2"><Detail label="Khách hàng" value={booking.playerName} /><Detail label="Cơ sở" value={booking.venueName} /><Detail label="Sân" value={booking.courtName} /><Detail label="Trạng thái" value={<OwnerStatusChip kind="booking" status={booking.status} />} /><Detail label="Bắt đầu" value={formatDateTime(booking.startAt)} /><Detail label="Kết thúc" value={formatDateTime(booking.endAt)} /><Detail label="Tổng tiền" value={formatVnd(booking.totalPrice)} /><Detail label="Phí nền tảng" value={formatVnd(booking.platformFee)} /><Detail label="Thu nhập chủ sân" value={formatVnd(booking.ownerEarnings)} /><Detail label="Tạo lúc" value={formatDateTime(booking.createdAt)} /></div>
    {booking.note && <Detail label="Ghi chú" value={booking.note} />}
    <section aria-labelledby="payment-heading" className="space-y-3"><h3 id="payment-heading" className="font-semibold">Thanh toán</h3>{paymentLoading ? <Skeleton className="h-16 rounded-xl" /> : paymentError ? <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Description>{paymentError}</Alert.Description></Alert.Content></Alert> : payments.length === 0 ? <p className="text-sm text-muted">Chưa có giao dịch thanh toán.</p> : payments.map((payment) => <Card key={payment.id} className="h-auto min-h-0"><CardContent className="grid grid-cols-2 gap-3 p-4 text-sm"><Detail label="Trạng thái" value={payment.status} /><Detail label="Số tiền" value={formatVnd(payment.amount)} /><Detail label="Nhà cung cấp" value={payment.provider} /><Detail label="Mã giao dịch" value={payment.transactionCode || "—"} /></CardContent></Card>)}</section>
    {booking.status === "Pending" && <TextField isRequired value={reason} onChange={setReason}><Label>Lý do từ chối</Label><TextArea maxLength={500} /><p className="mt-1 text-xs text-muted">Bắt buộc khi từ chối, tối đa 500 ký tự.</p></TextField>}
  </Drawer.Body><Drawer.Footer>{booking.status === "Pending" && <><AlertDialog><Button variant="tertiary" isDisabled={pending || !reason.trim()}>Từ chối</Button><AlertDialog.Backdrop><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Heading>Từ chối đơn đặt sân?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>Lý do từ chối sẽ được lưu cùng đơn đặt sân.</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary">Hủy</Button><Button slot="close" variant="danger" onPress={() => void action("reject")} isPending={pending}>Từ chối</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog><AlertDialog><Button variant="primary" isDisabled={pending}>Xác nhận thủ công</Button><AlertDialog.Backdrop><AlertDialog.Container size="sm"><AlertDialog.Dialog><AlertDialog.Header><AlertDialog.Heading>Xác nhận thủ công?</AlertDialog.Heading></AlertDialog.Header><AlertDialog.Body>Thanh toán thành công có thể tự xác nhận đơn. Chỉ tiếp tục sau khi bạn đã kiểm tra giao dịch.</AlertDialog.Body><AlertDialog.Footer><Button slot="close" variant="tertiary">Hủy</Button><Button slot="close" variant="primary" onPress={() => void action("confirm")} isPending={pending}>Xác nhận</Button></AlertDialog.Footer></AlertDialog.Dialog></AlertDialog.Container></AlertDialog.Backdrop></AlertDialog></>}{canCompleteBooking(booking.status, booking.endAt) && <Button variant="primary" onPress={() => void action("complete")} isPending={pending}>Đánh dấu hoàn thành</Button>}</Drawer.Footer></Drawer.Dialog></Drawer.Content></Drawer.Backdrop></Drawer>;
}
function Detail({ label, value }: { label: string; value: ReactNode }) { return <div><p className="text-xs text-[var(--muted)]">{label}</p><div className="mt-1 font-medium">{value}</div></div>; }
