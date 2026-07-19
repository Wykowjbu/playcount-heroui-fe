"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, Card, Chip, Alert, Skeleton, Separator, FieldError, Form, Label, Link as HeroUILink, ListBox, Modal, Select, Table, TextArea, toast } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import { getBookingById, cancelBooking, confirmBooking, rejectBooking, completeBooking } from "@/lib/api/bookings";
import { createPayOsPayment, getBookingPayments, getTrustedPayOsCheckoutUrl } from "@/lib/api/payments";
import { addReviewImage, createReview, deleteReviewImage, getMyReviews } from "@/lib/api/reviews";
import { uploadFile, validateImageFile } from "@/lib/api/upload";
import { useAuth } from "@/lib/auth-context";
import type { BookingResponseDto, PaymentDto, ReviewImageDto, ReviewResponseDto } from "@/lib/types/api";
import { getStatusConfig, isTerminalBookingStatus } from "@/lib/utils/status-labels";
import { formatDate, formatDateTime, formatTime, formatVnd } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Calendar from "@gravity-ui/icons/Calendar";
import TrashBin from "@gravity-ui/icons/TrashBin";

type LocalReviewImage = { file: File; preview: string; displayOrder: number; uploadedUrl?: string; error?: string };

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
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [localImages, setLocalImages] = useState<LocalReviewImage[]>([]);
  const localImagesRef = useRef(localImages);
  const [reviewNotice, setReviewNotice] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ReviewImageDto | null>(null);
  const actionLock = useRef(false);
  const statusRefreshLock = useRef(false);
  const mounted = useRef(true);
  const bookingIdRef = useRef(bookingId);
  const fetchGenerationRef = useRef(0);
  const [statusRefreshError, setStatusRefreshError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const fetchData = useCallback(async (showLoading = true) => {
    const requestedId = bookingId;
    const generation = ++fetchGenerationRef.current;
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const [b, p, reviews] = await Promise.all([
        getBookingById(bookingId),
        getBookingPayments(bookingId).catch(() => []),
        user?.role === "player" ? getMyReviews().catch(() => []) : Promise.resolve([]),
      ]);
      if (!mounted.current || bookingIdRef.current !== requestedId || generation !== fetchGenerationRef.current) return;
      setBooking(b);
      setPayments(p);
      setReview(reviews.find((item) => item.bookingId === requestedId) ?? null);
    } catch (err: unknown) {
      if (mounted.current && bookingIdRef.current === requestedId && generation === fetchGenerationRef.current) {
        setError(err instanceof Error ? err.message : "Không thể tải thông tin đặt sân");
      }
    } finally {
      if (mounted.current && bookingIdRef.current === requestedId && generation === fetchGenerationRef.current) setLoading(false);
    }
  }, [bookingId, user]);

  useEffect(() => {
    bookingIdRef.current = bookingId;
    fetchGenerationRef.current += 1;
    actionLock.current = false;
    statusRefreshLock.current = false;
    setBooking(null);
    setPayments([]);
    setLoading(true);
    setError(null);
    setActionLoading(false);
    setReview(null);
    setReviewOpen(false);
    setCancelOpen(false);
    setCancelReason("");
    localImagesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview));
    setLocalImages([]);
    setReviewNotice(null);
    setDeleteTarget(null);
    setStatusRefreshError(null);
    setNow(Date.now());
  }, [bookingId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      fetchGenerationRef.current += 1;
    };
  }, []);

  useEffect(() => {
    localImagesRef.current = localImages;
  }, [localImages]);

  useEffect(() => () => {
    localImagesRef.current.forEach(({ preview }) => URL.revokeObjectURL(preview));
  }, []);

  const holdDeadline = booking?.status === "Pending" ? Date.parse(booking.createdAt) + 15 * 60_000 : null;
  const deadlineElapsed = holdDeadline !== null && now >= holdDeadline;
  const refreshBookingStatus = useCallback(async () => {
    if (statusRefreshLock.current || document.visibilityState !== "visible") return;
    statusRefreshLock.current = true;
    const requestedId = bookingId;
    try {
      const latest = await getBookingById(requestedId);
      if (mounted.current && bookingIdRef.current === requestedId) {
        setBooking(latest);
        setStatusRefreshError(null);
      }
    } catch (err) {
      if (mounted.current && bookingIdRef.current === requestedId) {
        setStatusRefreshError(err instanceof Error ? err.message : "Không thể cập nhật trạng thái đặt sân");
      }
    } finally {
      statusRefreshLock.current = false;
    }
  }, [bookingId]);

  useEffect(() => {
    if (!holdDeadline) return;
    if (deadlineElapsed) {
      const poll = () => { if (document.visibilityState === "visible") void refreshBookingStatus(); };
      poll();
      const timer = window.setInterval(poll, 5_000);
      document.addEventListener("visibilitychange", poll);
      return () => {
        window.clearInterval(timer);
        document.removeEventListener("visibilitychange", poll);
      };
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const refresh = window.setTimeout(() => {
      setNow(Date.now());
    }, Math.max(0, holdDeadline - Date.now()));
    return () => { window.clearInterval(timer); window.clearTimeout(refresh); };
  }, [deadlineElapsed, holdDeadline, refreshBookingStatus]);

  const handleAction = async (action: () => Promise<void>) => {
    if (actionLock.current) return;
    actionLock.current = true;
    setActionLoading(true);
    const requestedId = bookingId;
    try {
      await action();
      if (mounted.current && bookingIdRef.current === requestedId) await fetchData(false);
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      actionLock.current = false;
      if (mounted.current && bookingIdRef.current === requestedId) setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (actionLock.current || (holdDeadline !== null && Date.now() >= holdDeadline)) return;
    actionLock.current = true;
    setActionLoading(true);
    try {
      const res = await createPayOsPayment(bookingId);
      const checkoutUrl = getTrustedPayOsCheckoutUrl(res.checkoutUrl);
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error("Liên kết thanh toán không hợp lệ");
      }
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : "Không thể tạo liên kết thanh toán");
    } finally {
      actionLock.current = false;
      setActionLoading(false);
    }
  };

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actionLock.current) return;
    actionLock.current = true;
    const data = new FormData(event.currentTarget);
    setActionLoading(true);
    try {
      const uploaded = await Promise.all(localImages.map(async (image) => {
        if (image.uploadedUrl) return image;
        try {
          const result = await uploadFile(image.file, "reviews");
          return { ...image, uploadedUrl: result.url, error: undefined };
        } catch (err) {
          return { ...image, error: err instanceof Error ? err.message : "Tải ảnh thất bại" };
        }
      }));
      setLocalImages(uploaded);
      const failedUploads = uploaded.filter(({ uploadedUrl }) => !uploadedUrl);
      if (failedUploads.length) throw new Error(`Chưa tải được: ${failedUploads.map(({ file }) => file.name).join(", ")}`);
      const savedReview = review ?? await createReview({
          bookingId,
          rating: Number(data.get("rating")),
          reviewText: String(data.get("reviewText") ?? "") || undefined,
        });
      setReview(savedReview);
      const persistedImages = [...(savedReview.images ?? [])];
      const attached = new Set(persistedImages.map(({ imageUrl }) => imageUrl));
      const failedAdds: LocalReviewImage[] = [];
      for (const image of uploaded) {
        if (attached.has(image.uploadedUrl!)) continue;
        try {
          persistedImages.push(await addReviewImage(savedReview.id, { imageUrl: image.uploadedUrl!, displayOrder: image.displayOrder }));
        } catch (err) {
          failedAdds.push({ ...image, error: err instanceof Error ? err.message : "Không thể lưu ảnh" });
        }
      }
      setReview({ ...savedReview, images: persistedImages });
      uploaded.filter((image) => !failedAdds.some(({ preview }) => preview === image.preview)).forEach(({ preview }) => URL.revokeObjectURL(preview));
      setLocalImages(failedAdds);
      try {
        const reviews = await getMyReviews();
        setReview(reviews.find((item) => item.bookingId === bookingId) ?? { ...savedReview, images: persistedImages });
      } catch {
        if (!failedAdds.length) setReviewNotice("Đánh giá đã được lưu nhưng chưa thể làm mới dữ liệu");
      }
      if (failedAdds.length) throw new Error(`Chưa lưu được: ${failedAdds.map(({ file }) => file.name).join(", ")}`);
      setLocalImages([]);
      setReviewOpen(false);
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : "Không thể gửi đánh giá");
    } finally {
      actionLock.current = false;
      setActionLoading(false);
    }
  }

  const addLocalImages = (files: FileList | null) => {
    if (!files) return;
    const accepted: LocalReviewImage[] = [];
    const errors: string[] = [];
    const capacity = Math.max(0, 5 - (review?.images.length ?? 0) - localImages.length);
    let displayOrder = Math.max(-1, ...(review?.images.map((image) => image.displayOrder) ?? []), ...localImages.map((image) => image.displayOrder)) + 1;
    Array.from(files).forEach((file) => {
      const validation = validateImageFile(file);
      if (validation) errors.push(`${file.name}: ${validation}`);
      else if (accepted.length >= capacity) errors.push("Mỗi đánh giá tối đa 5 ảnh");
      else accepted.push({ file, preview: URL.createObjectURL(file), displayOrder: displayOrder++ });
    });
    setLocalImages((images) => [...images, ...accepted]);
    if (errors.length) toast.danger(errors.join("; "));
  };

  const removeLocalImage = (preview: string) => {
    URL.revokeObjectURL(preview);
    setLocalImages((images) => images.filter((image) => image.preview !== preview));
  };

  const confirmDeleteImage = async () => {
    if (!deleteTarget || !review || actionLock.current) return;
    const target = deleteTarget;
    await handleAction(async () => {
      await deleteReviewImage(review.id, target.id);
      setReview({ ...review, images: review.images.filter(({ id }) => id !== target.id) });
      setDeleteTarget(null);
    });
  };

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
          <HeroUILink href="/player/bookings" className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-4 min-h-11" })}>
            <ChevronLeft className="size-4 mr-1" />
            Quay lại
          </HeroUILink>
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
  const holdRemaining = Math.max(0, (holdDeadline ?? 0) - now);
  const holdElapsed = deadlineElapsed;
  const canPay = isPlayer && b.status === "Pending" && !hasSuccessfulPayment;
  const countdown = `${String(Math.floor(holdRemaining / 60_000)).padStart(2, "0")}:${String(Math.floor((holdRemaining % 60_000) / 1000)).padStart(2, "0")}`;

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

          {b.status === "Pending" && <Alert status={holdElapsed ? "warning" : "accent"}>
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{holdElapsed ? "Thời gian giữ chỗ đã hết" : "Đang giữ chỗ để thanh toán"}</Alert.Title>
              <Alert.Description>Thời gian còn lại: {countdown}</Alert.Description>
              <span className="sr-only" role="status">{holdElapsed ? "Thời gian giữ chỗ đã hết" : "Đang giữ chỗ để thanh toán"}</span>
            </Alert.Content>
          </Alert>}

          {statusRefreshError && <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content><Alert.Title>Chưa thể cập nhật trạng thái đặt sân</Alert.Title><Alert.Description>{statusRefreshError}</Alert.Description></Alert.Content>
            <Button variant="secondary" size="sm" onPress={refreshBookingStatus}>Thử tải lại trạng thái</Button>
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
              {reviewNotice && <Alert status="warning"><Alert.Indicator /><Alert.Content><Alert.Title>{reviewNotice}</Alert.Title></Alert.Content></Alert>}
              {review && <Card><Card.Header><Card.Title>Đánh giá của bạn</Card.Title></Card.Header><Card.Content className="space-y-4 px-5 pb-5 text-sm"><p>{review.rating}/5{review.reviewText ? ` · ${review.reviewText}` : ""}</p>{review.images?.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{review.images.map((image) => <div key={image.id} className="relative overflow-hidden rounded-xl border border-[var(--border)]"><Image unoptimized width={240} height={240} className="aspect-square w-full object-cover" src={image.imageUrl} alt={`Ảnh đánh giá sân ${b.venueName}`} /><Button aria-label="Xóa ảnh đánh giá" className="absolute right-1 top-1 min-h-11 min-w-11" isIconOnly variant="danger" onPress={() => setDeleteTarget(image)}><TrashBin className="size-4" /></Button></div>)}</div>}</Card.Content></Card>}
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
                <Button className="min-h-11 w-full" variant="primary" isDisabled={holdElapsed} isPending={actionLoading} onPress={handlePay}>
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
                  className="min-h-11 w-full"
                  variant="danger"
                  isPending={actionLoading}
                  onPress={() => setCancelOpen(true)}
                >
                  Hủy đặt sân
                </Button>
              )}
              {isPlayer && b.status === "Completed" && !review && <Button className="w-full" variant="primary" onPress={() => { setReviewNotice(null); setReviewOpen(true); }}>Đánh giá sân</Button>}
              </Card.Footer>}
              <Card.Footer className="px-5 pb-5 pt-0"><HeroUILink href={`/venues/${b.venueId}`} className={buttonVariants({ variant: "secondary", className: "min-h-11 w-full" })}>{b.status === "Expired" ? "Chọn khung giờ mới" : "Xem trang sân"}</HeroUILink></Card.Footer>
            </Card>
          </div>
        </div>
      </main>
      <Modal.Backdrop isOpen={reviewOpen} onOpenChange={(open) => { if (!actionLoading) setReviewOpen(open); }}>
        <Modal.Container size="sm" scroll="inside"><Modal.Dialog aria-label="Đánh giá sân">
          {!actionLoading && <Modal.CloseTrigger />}
          <Modal.Header><Modal.Heading>Đánh giá sân</Modal.Heading></Modal.Header>
          <Modal.Body><Form id="review-form" className="space-y-4" onSubmit={submitReview}>
            <Select isRequired name="rating" placeholder="Chọn số sao"><Label>Số sao</Label><Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger><Select.Popover><ListBox>{[5,4,3,2,1].map((rating) => <ListBox.Item id={rating} key={rating} textValue={`${rating} sao`}>{rating} sao<ListBox.ItemIndicator /></ListBox.Item>)}</ListBox></Select.Popover><FieldError /></Select>
            <div className="space-y-2"><Label htmlFor="review-text">Nội dung</Label><TextArea id="review-text" name="reviewText" rows={4} fullWidth placeholder="Chia sẻ trải nghiệm của bạn" /></div>
            <div className="space-y-2"><Label htmlFor="review-images">Ảnh đánh giá</Label><input id="review-images" className="block min-h-11 w-full rounded-xl border border-[var(--border)] p-2" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => { addLocalImages(event.target.files); event.target.value = ""; }} /></div>
            {localImages.length > 0 && <div className="grid grid-cols-2 gap-3">{localImages.map((image) => <div key={image.preview} className="relative"><Image unoptimized width={240} height={240} className="aspect-square w-full rounded-xl object-cover" src={image.preview} alt={`Ảnh xem trước ${image.file.name}`} /><Button aria-label={`Bỏ ảnh ${image.file.name}`} className="absolute right-1 top-1 min-h-11 min-w-11" isIconOnly variant="danger" onPress={() => removeLocalImage(image.preview)}><TrashBin className="size-4" /></Button>{image.error && <p className="mt-1 text-xs text-danger">{image.error}</p>}</div>)}</div>}
          </Form></Modal.Body>
          <Modal.Footer><Button className="min-h-11" variant="tertiary" isDisabled={actionLoading} onPress={() => setReviewOpen(false)}>Hủy</Button><Button className="min-h-11" form="review-form" type="submit" isPending={actionLoading}>Gửi đánh giá</Button></Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={cancelOpen} onOpenChange={(open) => { if (!actionLoading) setCancelOpen(open); }}>
        <Modal.Container size="sm"><Modal.Dialog aria-label="Xác nhận hủy đặt sân">
          {!actionLoading && <Modal.CloseTrigger />}
          <Modal.Header><Modal.Heading>Xác nhận hủy đặt sân</Modal.Heading></Modal.Header>
          <Modal.Body><div className="space-y-2"><Label htmlFor="cancel-reason">Lý do hủy (không bắt buộc)</Label><TextArea id="cancel-reason" fullWidth value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></div></Modal.Body>
          <Modal.Footer><Button className="min-h-11" variant="tertiary" isDisabled={actionLoading} onPress={() => setCancelOpen(false)}>Quay lại</Button><Button className="min-h-11" variant="danger" isPending={actionLoading} onPress={() => handleAction(async () => { await cancelBooking(b.id, cancelReason.trim() || undefined); setCancelOpen(false); })}>Xác nhận hủy</Button></Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop isOpen={!!deleteTarget} onOpenChange={(open) => { if (!open && !actionLoading) setDeleteTarget(null); }}>
        <Modal.Container size="sm"><Modal.Dialog aria-label="Xác nhận xóa ảnh đánh giá">
          {!actionLoading && <Modal.CloseTrigger />}
          <Modal.Header><Modal.Heading>Xóa ảnh đánh giá?</Modal.Heading></Modal.Header>
          <Modal.Body>Ảnh sẽ bị xóa khỏi đánh giá của bạn.</Modal.Body>
          <Modal.Footer><Button className="min-h-11" variant="tertiary" isDisabled={actionLoading} onPress={() => setDeleteTarget(null)}>Giữ ảnh</Button><Button className="min-h-11" variant="danger" isPending={actionLoading} onPress={confirmDeleteImage}>Xóa ảnh</Button></Modal.Footer>
        </Modal.Dialog></Modal.Container>
      </Modal.Backdrop>
    </div>
  );
}
