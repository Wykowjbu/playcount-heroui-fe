"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@heroui/react";
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
              {bookingId ? "Thanh toán đã bị hủy" : "Không thể xác định đặt sân"}
            </h1>
            <p className="text-[var(--muted)]">
              {bookingId
                ? "Giao dịch chưa hoàn tất. Đặt sân chỉ được giữ nếu thời gian thanh toán chưa hết hạn."
                : "Liên kết hủy thanh toán thiếu mã đặt sân hợp lệ. Hãy mở danh sách đặt sân để kiểm tra trạng thái."}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              {bookingId && (
                <RecoveryLink href={`/bookings/${bookingId}`}>Xem chi tiết đặt sân</RecoveryLink>
              )}
              <RecoveryLink href="/player/bookings" secondary>Về danh sách đặt sân</RecoveryLink>
              <RecoveryLink href="/venues" secondary>Tìm sân khác</RecoveryLink>
            </div>
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
