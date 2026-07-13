"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button, Card, Chip, Alert, Skeleton, Separator, FieldError, Form, Label, ListBox, Modal, Select, TextArea } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import { getBookingById, cancelBooking, confirmBooking, rejectBooking, completeBooking } from "@/lib/api/bookings";
import { createPayOsPayment, getBookingPayments } from "@/lib/api/payments";
import { createReview, getMyReviews } from "@/lib/api/reviews";
import { useAuth } from "@/lib/auth-context";
import type { BookingResponseDto, PaymentDto, ReviewResponseDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatDate, formatDateTime, formatTime, formatVnd } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Wallet from "@gravity-ui/icons/Wallet";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
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

  // Status timeline steps
  const steps = [
    { label: "Đặt sân", status: "Pending", done: true },
    { label: "Xác nhận", status: "Confirmed", done: b.status === "Confirmed" || b.status === "Completed" },
    { label: "Hoàn thành", status: "Completed", done: b.status === "Completed" },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/player/bookings" className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6">
          <ChevronLeft className="size-4" />
          Quay lại danh sách
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">
              Đặt sân #{b.id}
            </h1>
            <Chip color={statusCfg.color}>{statusCfg.label}</Chip>
          </div>

          {/* Status Timeline */}
          {b.status !== "CancelledByUser" && b.status !== "CancelledByOwner" && (
            <Card>
              <Card.Content className="p-5">
                <div className="flex items-center justify-between">
                  {steps.map((s, i) => (
                    <div key={s.status} className="flex items-center flex-1">
                      <div className="flex flex-col items-center">
                        <div
                          className={`size-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            s.done
                              ? "bg-[var(--success)] text-white"
                              : "bg-[var(--surface-secondary)] text-[var(--muted)]"
                          }`}
                        >
                          {s.done ? <CircleCheck className="size-4" /> : i + 1}
                        </div>
                        <span className="mt-1 text-xs text-[var(--muted)]">{s.label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${s.done ? "bg-[var(--success)]" : "bg-[var(--surface-secondary)]"}`} />
                      )}
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Venue & Court Info */}
          <Card>
            <Card.Content className="p-5 space-y-4">
              <h2 className="font-semibold text-[var(--foreground)]">Thông tin sân</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 text-[var(--muted)] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-[var(--foreground)]">{b.venueName}</p>
                    <p className="text-[var(--muted)]">{b.courtName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[var(--muted)]" />
                  <span>{formatDate(b.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[var(--muted)]" />
                  <span>{fmtTime(b.startAt)} - {fmtTime(b.endAt)}</span>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Payment Info */}
          <Card>
            <Card.Content className="p-5 space-y-4">
              <h2 className="font-semibold text-[var(--foreground)]">Chi tiết thanh toán</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Tiền sân</span>
                  <span className="font-medium">{formatVnd(b.totalPrice - b.platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">Phí nền tảng</span>
                  <span className="font-medium">{formatVnd(b.platformFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-[var(--accent)]">{formatVnd(b.totalPrice)}</span>
                </div>
              </div>

              {payments.length > 0 && (
                <>
                  <Separator />
                  <h3 className="font-medium text-[var(--foreground)]">Lịch sử thanh toán</h3>
                  {payments.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span className="text-[var(--muted)]">
                        {p.provider} - {formatDateTime(p.createdAt)}
                      </span>
                      <Chip color={getStatusConfig("payment", p.status).color} size="sm">
                        {getStatusConfig("payment", p.status).label}
                      </Chip>
                    </div>
                  ))}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Notes */}
          {b.note && (
            <Card>
              <Card.Content className="p-5">
                <h2 className="font-semibold text-[var(--foreground)] mb-2">Ghi chú</h2>
                <p className="text-sm text-[var(--muted)]">{b.note}</p>
              </Card.Content>
            </Card>
          )}

          {/* Actions */}
          {(canPay || canCancel || canConfirm || canReject || canComplete || (isPlayer && b.status === "Completed" && !review)) && (
            <div className="flex flex-wrap gap-3">
              {canPay && (
                <Button variant="primary" isDisabled={actionLoading} onPress={handlePay}>
                  {actionLoading ? "Đang xử lý..." : "Thanh toán ngay"}
                </Button>
              )}
              {canConfirm && (
                <Button
                  variant="primary"
                  isDisabled={actionLoading}
                  onPress={() => handleAction(() => confirmBooking(b.id))}
                >
                  Xác nhận
                </Button>
              )}
              {canComplete && (
                <Button
                  variant="primary"
                  isDisabled={actionLoading}
                  onPress={() => handleAction(() => completeBooking(b.id))}
                >
                  Hoàn thành
                </Button>
              )}
              {canReject && (
                <Button
                  variant="danger"
                  isDisabled={actionLoading}
                  onPress={() => handleAction(() => rejectBooking(b.id))}
                >
                  Từ chối
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  isDisabled={actionLoading}
                  onPress={() => handleAction(() => cancelBooking(b.id))}
                >
                  Hủy đặt sân
                </Button>
              )}
              {isPlayer && b.status === "Completed" && !review && <Button variant="primary" onPress={() => setReviewOpen(true)}>Đánh giá sân</Button>}
            </div>
          )}

          {review && <Card><Card.Content className="p-5"><h2 className="font-semibold">Đánh giá của bạn</h2><p className="mt-2 text-sm">{review.rating}/5{review.reviewText ? ` · ${review.reviewText}` : ""}</p></Card.Content></Card>}

          {/* Meta */}
          <p className="text-xs text-[var(--muted)]">
            Tạo lúc: {formatDateTime(b.createdAt)}
            {b.updatedAt && ` · Cập nhật: ${formatDateTime(b.updatedAt)}`}
          </p>
        </div>
      </main>
      <Modal isOpen={reviewOpen} onOpenChange={setReviewOpen}><Modal.Backdrop><Modal.Container size="sm"><Modal.Dialog><Modal.CloseTrigger /><Modal.Header><Modal.Heading>Đánh giá sân</Modal.Heading></Modal.Header><Modal.Body><Form id="review-form" className="space-y-4" onSubmit={submitReview}><Select isRequired name="rating" placeholder="Chọn số sao"><Label>Số sao</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{[5,4,3,2,1].map((rating) => <ListBox.Item id={rating} key={rating} textValue={`${rating} sao`}>{rating} sao<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover><FieldError /></Select><TextArea name="reviewText" rows={4} placeholder="Chia sẻ trải nghiệm của bạn"><Label>Nội dung</Label></TextArea></Form></Modal.Body><Modal.Footer><Button variant="ghost" onPress={() => setReviewOpen(false)}>Hủy</Button><Button form="review-form" type="submit" isPending={actionLoading}>Gửi đánh giá</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>
    </div>
  );
}
