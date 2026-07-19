"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, Skeleton, Separator, TextArea, Label, Form } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerGuard } from "@/lib/auth/guards";
import { checkAvailability, createBooking } from "@/lib/api/bookings";
import { createPayOsPayment, getTrustedPayOsCheckoutUrl } from "@/lib/api/payments";
import { getVenueById, getVenueCourts } from "@/lib/api/discovery";
import type { VenueResponseDto, CourtDto } from "@/lib/types/api";
import { formatVnd, formatDate } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Wallet from "@gravity-ui/icons/Wallet";
import { ApiError } from "@/lib/api/client";
import { toLocalIsoWithOffset } from "@/lib/utils/player-flow";

function resolveBookingWindow(
  durationValue: string | null,
  date: string,
  time: string,
  exactStartAt: string | null,
  exactEndAt: string | null,
) {
  const duration = Number(durationValue);
  if (!Number.isInteger(duration) || duration < 60 || duration % 30 !== 0) return null;

  if (exactStartAt || exactEndAt) {
    if (!exactStartAt || !exactEndAt) return null;
    const start = Date.parse(exactStartAt);
    const end = Date.parse(exactEndAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end - start !== duration * 60_000) return null;
    return { startAt: exactStartAt, endAt: exactEndAt, duration };
  }

  try {
    const startAt = toLocalIsoWithOffset(date, time, -new Date().getTimezoneOffset());
    const start = Date.parse(startAt);
    return { startAt, endAt: new Date(start + duration * 60_000).toISOString(), duration };
  } catch {
    return null;
  }
}

export function CheckoutPage() {
  return (
    <PlayerGuard>
      <CheckoutContent />
    </PlayerGuard>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const venueId = Number(searchParams.get("venue")) || 0;
  const courtId = Number(searchParams.get("court")) || 0;
  const date = searchParams.get("date") ?? "";
  const time = searchParams.get("time") ?? "";
  const bookingWindow = useMemo(() => resolveBookingWindow(
    searchParams.get("duration"),
    date,
    time,
    searchParams.get("startAt"),
    searchParams.get("endAt"),
  ), [searchParams, date, time]);
  const duration = bookingWindow?.duration ?? Number(searchParams.get("duration"));
  const invalidParams = !venueId || !courtId || !date || !time || !bookingWindow;

  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [notes, setNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    if (invalidParams) {
      setError("Thông tin đặt sân không hợp lệ");
      setConflict(false);
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setError(null);
      setConflict(false);
      setLoading(true);
      try {
        const [v, c] = await Promise.all([
          getVenueById(venueId),
          getVenueCourts(venueId),
        ]);
        setVenue(v);
        setCourts(c);
        const availability = await checkAvailability(courtId, bookingWindow.startAt, bookingWindow.endAt);
        if (!availability.isAvailable) {
          setConflict(true);
          throw new ApiError(409, availability.reason ?? "Khung giờ này không còn trống.");
        }
        setEstimatedPrice(availability.estimatedPrice);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 409) setConflict(true);
        setError(err instanceof Error ? err.message : "Không thể tải thông tin sân");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [venueId, courtId, date, time, bookingWindow, invalidParams, loadKey]);

  const court = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId]);

  const handleSubmit = async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setError(null);
    setConflict(false);
    if (!bookingWindow) {
      setError("Thông tin đặt sân không hợp lệ");
      setSubmitting(false);
      submitLock.current = false;
      return;
    }
    let createdBookingId: number | null = null;
    try {
      const availability = await checkAvailability(courtId, bookingWindow.startAt, bookingWindow.endAt);
      if (!availability.isAvailable) {
        throw new ApiError(409, availability.reason ?? "Khung giờ này không còn trống.");
      }
      setEstimatedPrice(availability.estimatedPrice);

      const booking = await createBooking({
        courtId,
        startAt: bookingWindow.startAt,
        endAt: bookingWindow.endAt,
        note: notes || undefined,
      });
      createdBookingId = booking.id;

      // Initiate PayOS payment
      const payRes = await createPayOsPayment(booking.id);
      const checkoutUrl = getTrustedPayOsCheckoutUrl(payRes.checkoutUrl);
      if (checkoutUrl) {
        window.location.assign(checkoutUrl);
      } else {
        router.push(`/bookings/${booking.id}`);
      }
    } catch (err: unknown) {
      if (createdBookingId !== null) {
        router.push(`/bookings/${createdBookingId}`);
        return;
      }
      const lostSlot = err instanceof ApiError && err.status === 409;
      if (lostSlot) setConflict(true);
      setError(lostSlot
        ? "Khung giờ này không còn trống vì vừa được người khác đặt. Ghi chú của bạn vẫn được giữ lại."
        : err instanceof Error ? err.message : "Đặt sân thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 pt-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 rounded-lg mb-6" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        <Link
          href={`/venues/${venueId}`}
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ChevronLeft className="size-4" />
          Quay lại
        </Link>

        <h1 className="mb-6 text-2xl font-bold text-[var(--foreground)]">
          Xác nhận đặt sân
        </h1>

        {error && (
          <Alert status="danger" className="mb-6">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error}</Alert.Title>
              <Alert.Description className="mt-2 flex flex-wrap gap-2">
                {conflict ? (
                  <Link
                    className="inline-flex min-h-11 items-center font-semibold underline"
                    href={`/venues/${venueId}?court=${courtId}&date=${encodeURIComponent(date)}`}
                  >
                    Chọn khung giờ khác
                  </Link>
                ) : invalidParams ? (
                  <Link
                    className="inline-flex min-h-11 items-center font-semibold underline"
                    href={`/venues/${venueId}?court=${courtId}&date=${encodeURIComponent(date)}`}
                  >
                    Chọn lại khung giờ
                  </Link>
                ) : (
                  <Button className="min-h-11" variant="secondary" onPress={() => setLoadKey((key) => key + 1)}>Thử lại</Button>
                )}
              </Alert.Description>
            </Alert.Content>
          </Alert>
        )}

        {venue && court && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <Card>
              <Card.Content className="p-5 space-y-4">
                <h2 className="font-semibold text-[var(--foreground)]">Thông tin đặt sân</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="size-4 text-[var(--muted)] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[var(--foreground)]">{venue.name}</p>
                      <p className="text-[var(--muted)]">{court.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-[var(--muted)]" />
                    <span>{formatDate(date)} · {time} · {duration} phút</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Notes */}
            <Form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="flex w-full flex-col gap-2">
                <Label htmlFor="booking-note">Ghi chú</Label>
                <TextArea
                  aria-label="Ghi chú"
                  className="w-full"
                  id="booking-note"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú cho chủ sân (tuỳ chọn)"
                  rows={3}
                />
              </div>
            </Form>

            {/* Price Breakdown */}
            <Card>
              <Card.Content className="p-5 space-y-3">
                <h2 className="font-semibold text-[var(--foreground)]">Chi tiết giá</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">
                      Giá dự kiến ({duration} phút)
                    </span>
                    <span className="font-medium">{formatVnd(estimatedPrice)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Tổng cộng</span>
                    <span className="text-[var(--accent)]">{formatVnd(estimatedPrice)}</span>
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* Submit */}
            <p className="rounded-xl bg-[var(--surface-secondary)] p-3 text-sm text-[var(--muted)]">
              Sau khi xác nhận, khung giờ được giữ chỗ trong 15 phút để bạn hoàn tất thanh toán.
            </p>
            <Button
              className="w-full"
              size="lg"
              variant="primary"
              isDisabled={submitting || conflict}
              onPress={handleSubmit}
            >
              <Wallet className="size-4 mr-2" />
              {submitting ? "Đang chuyển đến PayOS..." : `Xác nhận & Thanh toán ${formatVnd(estimatedPrice)}`}
            </Button>

            <p className="text-xs text-center text-[var(--muted)]">
              Bằng việc đặt sân, bạn đồng ý với điều khoản sử dụng của PlayCourt.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
