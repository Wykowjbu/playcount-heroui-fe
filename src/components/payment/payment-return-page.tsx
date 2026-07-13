"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card, Alert, Spinner } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import { syncPayOsPayment } from "@/lib/api/payments";
import { getPaymentBookingId } from "@/lib/utils/flow-navigation";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";

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

  const [syncing, setSyncing] = useState(true);
  const [result, setResult] = useState<"success" | "failed" | null>(null);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const sync = async () => {
      if (!bookingIdFromQuery) {
        setResult("failed");
        setErrorMsg("Không tìm thông tin đơn hàng.");
        setSyncing(false);
        return;
      }
      setBookingId(bookingIdFromQuery);

      // Otherwise sync with backend
      try {
        const payment = await syncPayOsPayment(bookingIdFromQuery);
        if (payment.status === "Success") {
          setResult("success");
        } else {
          setResult("failed");
          setErrorMsg("Thanh toán chưa được xác nhận. Vui lòng kiểm tra lại sau.");
        }
      } catch (err: unknown) {
        setResult("failed");
        setErrorMsg(err instanceof Error ? err.message : "Không thể xác nhận thanh toán.");
      } finally {
        setSyncing(false);
      }
    };

    sync();
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
                  {bookingId && (
                    <Link href={`/bookings/${bookingId}`}>
                      <Button variant="primary" className="w-full">
                        Xem chi tiết đặt sân
                      </Button>
                    </Link>
                  )}
                  <Link href="/player/bookings">
                    <Button variant="ghost" className="w-full">
                      Tất cả lịch đặt
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {!syncing && result === "failed" && (
              <>
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--danger)]/10">
                  <CircleExclamation className="size-8 text-[var(--danger)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--foreground)]">
                  Thanh toán chưa thành công
                </h1>
                <p className="text-[var(--muted)]">
                  {errorMsg ?? "Đã xảy ra lỗi trong quá trình thanh toán."}
                </p>
                <div className="flex flex-col gap-3 pt-2">
                  {bookingId && (
                    <Link href={`/bookings/${bookingId}`}>
                      <Button variant="primary" className="w-full">
                        Thử thanh toán lại
                      </Button>
                    </Link>
                  )}
                  <Link href="/player/bookings">
                    <Button variant="ghost" className="w-full">
                      Về danh sách đặt sân
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
