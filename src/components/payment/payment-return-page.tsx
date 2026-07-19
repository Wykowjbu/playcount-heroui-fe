"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, Spinner } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import { syncPayOsPayment } from "@/lib/api/payments";
import type { PaymentDto } from "@/lib/types/api";
import { getPaymentBookingId } from "@/lib/utils/flow-navigation";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";

const paymentSyncs = new Map<number, Promise<PaymentDto>>();

function getPaymentSync(bookingId: number): Promise<PaymentDto> {
  const existing = paymentSyncs.get(bookingId);
  if (existing) return existing;

  const promise = syncPayOsPayment(bookingId);
  paymentSyncs.set(bookingId, promise);
  const cleanup = () => {
    if (paymentSyncs.get(bookingId) === promise) paymentSyncs.delete(bookingId);
  };
  void promise.then(cleanup, cleanup);
  return promise;
}

export function PaymentReturnPage() {
  return (
    <AuthGuard>
      <PaymentReturnContent />
    </AuthGuard>
  );
}

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const bookingIdFromQuery = getPaymentBookingId(searchParams);

  type Result = "success" | "failed" | null;
  const [view, setView] = useState<{ bookingId: number | null; result: Result; error: string | null }>({
    bookingId: null,
    result: null,
    error: null,
  });
  const generationRef = useRef(0);

  const invalid = bookingIdFromQuery === null;
  const currentView = view.bookingId === bookingIdFromQuery ? view : null;
  const syncing = !invalid && currentView?.result == null;
  const result = invalid ? "invalid" : currentView?.result ?? null;
  const errorMsg = invalid
    ? "Liên kết thanh toán thiếu mã đặt sân hợp lệ. Hãy mở lịch đặt của bạn để tiếp tục."
    : currentView?.error ?? null;

  useEffect(() => {
    const generation = ++generationRef.current;
    let disposed = false;
    if (!bookingIdFromQuery) return;

    setView({ bookingId: bookingIdFromQuery, result: null, error: null });
    const promise = getPaymentSync(bookingIdFromQuery);

    promise
      .then((payment) => {
        if (disposed || generation !== generationRef.current) return;
        const status = payment.status.toLowerCase();
        if (status === "success") {
          setView({ bookingId: bookingIdFromQuery, result: "success", error: null });
        } else {
          setView({
            bookingId: bookingIdFromQuery,
            result: "failed",
            error: "Thanh toán chưa được xác nhận, có thể do giao dịch bị hủy hoặc đã hết hạn. Hãy mở chi tiết đặt sân để kiểm tra và thử lại.",
          });
        }
      })
      .catch((err: unknown) => {
        if (disposed || generation !== generationRef.current) return;
        setView({
          bookingId: bookingIdFromQuery,
          result: "failed",
          error: err instanceof Error ? err.message : "Không thể xác nhận thanh toán.",
        });
      });

    return () => {
      disposed = true;
    };
  }, [bookingIdFromQuery]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 pt-12 sm:px-6 lg:px-8">
        <Card>
          <Card.Content className="p-8 text-center space-y-6">
            {syncing && (
              <>
                <Spinner size="lg" />
                <p className="text-[var(--muted)]">Đang xác nhận thanh toán...</p>
              </>
            )}

            {!syncing && result === "success" && (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--success)]/10">
                  <CircleCheck className="size-8 text-[var(--success)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  Thanh toán thành công!
                </h1>
                <p className="text-[var(--muted)]">
                  Đặt sân của bạn đã được xác nhận. Cảm ơn bạn đã sử dụng PlayCourt.
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  <RecoveryLink href={`/bookings/${bookingIdFromQuery}`}>Xem chi tiết đặt sân</RecoveryLink>
                  <RecoveryLink href="/player/bookings" secondary>Tất cả lịch đặt</RecoveryLink>
                </div>
              </>
            )}

            {!syncing && (result === "failed" || result === "invalid") && (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--danger)]/10">
                  <CircleExclamation className="size-8 text-[var(--danger)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  {result === "invalid" ? "Không thể xác định đặt sân" : "Thanh toán chưa thành công"}
                </h1>
                <p className="text-[var(--muted)]">
                  {errorMsg ?? "Đã xảy ra lỗi trong quá trình thanh toán."}
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  {bookingIdFromQuery && <RecoveryLink href={`/bookings/${bookingIdFromQuery}`}>Xem chi tiết đặt sân</RecoveryLink>}
                  <RecoveryLink href="/player/bookings" secondary>Về danh sách đặt sân</RecoveryLink>
                </div>
              </>
            )}
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}

function RecoveryLink({ href, secondary = false, children }: { href: string; secondary?: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold ${secondary ? "bg-[var(--surface-secondary)] text-foreground" : "bg-[var(--accent)] text-[var(--accent-foreground)]"}`}
    >
      {children}
    </Link>
  );
}
