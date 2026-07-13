"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, Skeleton, Separator, TextArea, Label, Form, FieldError } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerGuard } from "@/lib/auth/guards";
import { checkAvailability, createBooking } from "@/lib/api/bookings";
import { createPayOsPayment } from "@/lib/api/payments";
import { getVenueById, getVenueCourts } from "@/lib/api/discovery";
import type { VenueResponseDto, CourtDto } from "@/lib/types/api";
import { formatVnd, formatDate } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Wallet from "@gravity-ui/icons/Wallet";

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
  const duration = Number(searchParams.get("duration")) || 60;

  const [venue, setVenue] = useState<VenueResponseDto | null>(null);
  const [courts, setCourts] = useState<CourtDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  useEffect(() => {
    if (!venueId || !courtId || !date || !time) {
      setError("Thiếu thông tin đặt sân. Vui lòng quay lại và chọn lại.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [v, c] = await Promise.all([
          getVenueById(venueId),
          getVenueCourts(venueId),
        ]);
        setVenue(v);
        setCourts(c);
        const start = new Date(`${date}T${time}:00`);
        const end = new Date(start.getTime() + duration * 60_000);
        const availability = await checkAvailability(courtId, start.toISOString(), end.toISOString());
        if (!availability.isAvailable) throw new Error(availability.reason ?? "Khung giờ này không còn trống.");
        setEstimatedPrice(availability.estimatedPrice);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Không thể tải thông tin sân");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [venueId, courtId, date, time]);

  const court = useMemo(() => courts.find((c) => c.id === courtId), [courts, courtId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const start = new Date(`${date}T${time}:00`);
      const end = new Date(start.getTime() + duration * 60_000);
      const availability = await checkAvailability(courtId, start.toISOString(), end.toISOString());
      if (!availability.isAvailable) {
        throw new Error(availability.reason ?? "Khung giờ này không còn trống.");
      }
      setEstimatedPrice(availability.estimatedPrice);

      const booking = await createBooking({
        courtId,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        note: notes || undefined,
      });

      // Initiate PayOS payment
      const payRes = await createPayOsPayment(booking.id);
      if (payRes.checkoutUrl) {
        window.location.assign(payRes.checkoutUrl);
      } else {
        router.push(`/bookings/${booking.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đặt sân thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
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
              <TextArea
                className="w-full"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú cho chủ sân (tuỳ chọn)"
                rows={3}
              >
                <Label>Ghi chú</Label>
              </TextArea>
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
            <Button
              className="w-full"
              size="lg"
              variant="primary"
              isDisabled={submitting || !!error}
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
