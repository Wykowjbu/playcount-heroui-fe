"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Card } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import CircleExclamation from "@gravity-ui/icons/CircleExclamation";
import { getPaymentBookingId } from "@/lib/utils/flow-navigation";

export function PaymentCancelPage() {
  return (
    <AuthGuard>
      <PaymentCancelContent />
    </AuthGuard>
  );
}

function PaymentCancelContent() {
  const searchParams = useSearchParams();
  const bookingId = getPaymentBookingId(searchParams);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 pt-12 sm:px-6 lg:px-8">
        <Card>
          <Card.Content className="p-8 text-center space-y-6">
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[var(--warning)]/10">
              <CircleExclamation className="size-8 text-[var(--warning)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              Thanh toán đã bị hủy
            </h1>
            <p className="text-[var(--muted)]">
              Bạn đã hủy quá trình thanh toán. Đặt sân vẫn được giữ nếu chưa hết hạn.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              {bookingId && (
                <Link href={`/bookings/${bookingId}`}>
                  <Button variant="primary" className="w-full">
                    Quay lại đặt sân
                  </Button>
                </Link>
              )}
              <Link href="/player/bookings">
                <Button variant="ghost" className="w-full">
                  Về danh sách đặt sân
                </Button>
              </Link>
              <Link href="/venues">
                <Button variant="ghost" className="w-full">
                  Tìm sân khác
                </Button>
              </Link>
            </div>
          </Card.Content>
        </Card>
      </main>
    </div>
  );
}
