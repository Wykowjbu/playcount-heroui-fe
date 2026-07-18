"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Chip, Alert, Skeleton, Separator, FieldError, Form, Label, ListBox, Modal, Select, Table, TextArea } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import { getBookingById, cancelBooking, confirmBooking, rejectBooking, completeBooking } from "@/lib/api/bookings";
import { createPayOsPayment, getBookingPayments } from "@/lib/api/payments";
import { createReview, getMyReviews } from "@/lib/api/reviews";
import { useAuth } from "@/lib/auth-context";
import type { BookingResponseDto, PaymentDto, ReviewResponseDto } from "@/lib/types/api";
import { getStatusConfig, isTerminalBookingStatus } from "@/lib/utils/status-labels";
import { formatDate, formatDateTime, formatTime, formatVnd } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Wallet from "@gravity-ui/icons/Wallet";
import Calendar from "@gravity-ui/icons/Calendar";

/** Handle both "HH:mm:ss" and full datetime strings */
function fmtTime(s: string | null | undefined): string {
  if (!s) return "—";
  // If it looks like a time-only string (no "T"), parse directly
  if (/^\d{1,2}:\d{2}/.test(s) && !s.includes("T")) {
    const [h, m] = s.split(":");
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }
  return formatTime(s);
}

export function BookingDetailPage({ bookingId }: { bookingId: number }) {
  return (
    <AuthGuard>
      <BookingDetailContent bookingId={bookingId} />
    </AuthGuard>
  );
}

function BookingDetailContent({ bookingId }: { bookingId: number }) {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingResponseDto | null>(null);
  const [payments, setPayments] = useState<PaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [review, setReview] = useState<ReviewResponseDto | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, p, reviews] = await Promise.all([
        getBookingById(bookingId),
        getBookingPayments(bookingId).catch(() => []),
        user?.role === "player" ? getMyReviews().catch(() => []) : Promise.resolve([]),
      ]);
      setBooking(b);
      setPayments(p);
      setReview(reviews.find((item) => item.bookingId === bookingId) ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin đặt sân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await action();
      await fetchData();
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    setActionLoading(true);
    try {
      const res = await createPayOsPayment(bookingId);
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setActionLoading(true);
    try {
      const created = await createReview({
        bookingId,
        rating: Number(data.get("rating")),
        reviewText: String(data.get("reviewText") ?? "") || undefined,
      });
      setReview(created);
      setReviewOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi đánh giá");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 rounded-lg mb-6" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error ?? "Không tìm thấy đặt sân"}</Alert.Title>
            </Alert.Content>
          </Alert>
          <Link href="/player/bookings" className="inline-block mt-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="size-4 mr-1" />
              Quay lại
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const b = booking;
  const statusCfg = getStatusConfig("booking", b.status);
  const isOwner = user?.role === "owner";
  const isPlayer = user?.role === "player";
  const canCancel = b.status === "Pending" || b.status === "Confirmed";
  const canConfirm = isOwner && b.status === "Pending";
  const canReject = isOwner && b.status === "Pending";
  const canComplete = isOwner && b.status === "Confirmed";
  const hasSuccessfulPayment = payments.some((payment) => payment.status === "Success");
  const canPay = isPlayer && b.status === "Pending" && !hasSuccessfulPayment;

  const latestPayment = payments.at(0);
  const isTerminal = isTerminalBookingStatus(b.status);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/player/bookings" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6">
          <ChevronLeft className="size-4" />
          Quay lại danh sách
        </Link>

        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[var(--foreground)]">Chi tiết đặt sân #{b.id}</h1>
            <Chip color={statusCfg.color}>{statusCfg.label}</Chip>
          </div>

          {isTerminal && <Alert status={b.status === "Expired" ? "warning" : "default"}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{b.status === "Expired" ? "Đặt sân đã hết hạn" : statusCfg.label}</Alert.Title>
              <Alert.Description>Yêu cầu đặt sân này không còn hiệu lực.</Alert.Description>
            </Alert.Content>
          </Alert>}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-6">
              <Card>
                <Card.Header><Card.Title>Thông tin đặt sân</Card.Title></Card.Header>
                <Card.Content className="space-y-5 px-5 pb-5">
                  <div className="flex items-start gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-[var(--muted)]" /><div><p className="font-medium">{b.venueName}</p><p className="text-sm text-[var(--muted)]">{b.courtName}</p></div></div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-[var(--muted)]">Ngày thi đấu</p><p className="mt-1 font-medium"><Calendar className="mr-1 inline size-4" />{formatDate(b.startAt)}</p></div><div><p className="text-[var(--muted)]">Thời gian</p><p className="mt-1 font-medium"><Clock className="mr-1 inline size-4" />{fmtTime(b.startAt)} – {fmtTime(b.endAt)}</p></div></div>
                </Card.Content>
              </Card>

              {payments.length > 0 && <Card>
                <Card.Header><Card.Title>Lịch sử thanh toán</Card.Title></Card.Header>
                <Card.Content className="px-0 pb-0">
                  <Table aria-label="Lịch sử thanh toán"><Table.Content><Table.Header><Table.Column isRowHeader>Thời gian</Table.Column><Table.Column>Phương thức</Table.Column><Table.Column>Số tiền</Table.Column><Table.Column>Trạng thái</Table.Column></Table.Header><Table.Body items={payments}>{(p) => <Table.Row><Table.Cell>{formatDateTime(p.paidAt ?? p.createdAt)}</Table.Cell><Table.Cell>{p.provider}</Table.Cell><Table.Cell>{formatVnd(p.amount)}</Table.Cell><Table.Cell><Chip color={getStatusConfig("payment", p.status).color} size="sm">{getStatusConfig("payment", p.status).label}</Chip></Table.Cell></Table.Row>}</Table.Body></Table.Content></Table>
                </Card.Content>
              </Card>}

              {b.note && <Card><Card.Header><Card.Title>Ghi chú</Card.Title></Card.Header><Card.Content className="px-5 pb-5 text-sm text-[var(--muted)]">{b.note}</Card.Content></Card>}
              {review && <Card><Card.Header><Card.Title>Đánh giá của bạn</Card.Title></Card.Header><Card.Content className="px-5 pb-5 text-sm">{review.rating}/5{review.reviewText ? ` · ${review.reviewText}` : ""}</Card.Content></Card>}
              <p className="text-xs text-[var(--muted)]">Tạo lúc: {formatDateTime(b.createdAt)}{b.updatedAt && ` · Cập nhật: ${formatDateTime(b.updatedAt)}`}</p>
            </div>

            <Card className="h-fit lg:sticky lg:top-24">
              <Card.Header className="flex items-center justify-between"><Card.Title>Tóm tắt</Card.Title><Chip color={statusCfg.color} size="sm">{statusCfg.label}</Chip></Card.Header>
              <Card.Content className="space-y-3 px-5 pb-5 text-sm">
                <div className="flex justify-between"><span className="text-[var(--muted)]">Tiền sân</span><span>{formatVnd(b.totalPrice - b.platformFee)}</span></div>
                <div className="flex justify-between"><span className="text-[var(--muted)]">Phí nền tảng</span><span>{formatVnd(b.platformFee)}</span></div>
                <Separator />
                <div className="flex justify-between text-base font-semibold"><span>Tổng cộng</span><span>{formatVnd(b.totalPrice)}</span></div>
                {latestPayment && <div className="flex justify-between pt-2"><span className="text-[var(--muted)]">Thanh toán</span><Chip color={getStatusConfig("payment", latestPayment.status).color} size="sm">{getStatusConfig("payment", latestPayment.status).label}</Chip></div>}
              </Card.Content>
              {(canPay || canCancel || canConfirm || canReject || canComplete || (isPlayer && b.status === "Completed" && !review)) && <Card.Footer className="flex flex-col gap-2 px-5 pb-5">
              {canPay && (
                <Button className="w-full" variant="primary" isPending={actionLoading} onPress={handlePay}>
                  {actionLoading ? "Đang xử lý..." : "Thanh toán ngay"}
                </Button>
              )}
              {canConfirm && (
                <Button
                  className="w-full"
                  variant="primary"
                  isPending={actionLoading}
                  onPress={() => handleAction(() => confirmBooking(b.id))}
                >
                  Xác nhận
                </Button>
              )}
              {canComplete && (
                <Button
                  className="w-full"
                  variant="primary"
                  isPending={actionLoading}
                  onPress={() => handleAction(() => completeBooking(b.id))}
                >
                  Hoàn thành
                </Button>
              )}
              {canReject && (
                <Button
                  className="w-full"
                  variant="danger"
                  isPending={actionLoading}
                  onPress={() => handleAction(() => rejectBooking(b.id))}
                >
                  Từ chối
                </Button>
              )}
              {canCancel && (
                <Button
                  className="w-full"
                  variant="danger"
                  isPending={actionLoading}
                  onPress={() => handleAction(() => cancelBooking(b.id))}
                >
                  Hủy đặt sân
                </Button>
              )}
              {isPlayer && b.status === "Completed" && !review && <Button className="w-full" variant="primary" onPress={() => setReviewOpen(true)}>Đánh giá sân</Button>}
              </Card.Footer>}
              <Card.Footer className="px-5 pb-5 pt-0"><Link href={`/venues/${b.venueId}`}><Button variant="secondary" className="w-full">Xem trang sân</Button></Link></Card.Footer>
            </Card>
          </div>
        </div>
      </main>
      <Modal isOpen={reviewOpen} onOpenChange={setReviewOpen}><Modal.Backdrop><Modal.Container size="sm"><Modal.Dialog><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Đánh giá sân</Modal.Heading></Modal.Header><Modal.Body><Form id="review-form" className="space-y-4" onSubmit={submitReview}><Select isRequired name="rating" placeholder="Chọn số sao"><Label>Số sao</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{[5,4,3,2,1].map((rating) => <ListBox.Item id={rating} key={rating} textValue={`${rating} sao`}>{rating} sao<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover><FieldError /></Select><TextArea name="reviewText" rows={4} placeholder="Chia sẻ trải nghiệm của bạn"><Label>Nội dung</Label></TextArea></Form></Modal.Body><Modal.Footer><Button variant="ghost" onPress={() => setReviewOpen(false)}>Hủy</Button><Button form="review-form" type="submit" isPending={actionLoading}>Gửi đánh giá</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>
    </div>
  );
}
