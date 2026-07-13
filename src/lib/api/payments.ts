import { apiFetch } from "@/lib/api/client";
import type { PaymentDto } from "@/lib/types/api";

/* ------------------------------------------------------------------ */
/* PAYMENTS                                                            */
/* ------------------------------------------------------------------ */

export interface CreatePayOsResponse {
  paymentId: number;
  bookingId: number;
  checkoutUrl: string;
  orderCode: number;
  amount: number;
  currency: string;
  paymentLinkId: string | null;
  status: string;
  createdAt: string;
}

export async function createPayOsPayment(
  bookingId: number,
): Promise<CreatePayOsResponse> {
  const res = await apiFetch<CreatePayOsResponse>(
    `/Payments/bookings/${bookingId}/payos`,
    { method: "POST" },
  );
  return res.data!;
}

export async function syncPayOsPayment(
  bookingId: number,
): Promise<PaymentDto> {
  const res = await apiFetch<PaymentDto>(
    `/Payments/bookings/${bookingId}/sync-payos`,
    { method: "POST" },
  );
  return res.data!;
}

export async function getBookingPayments(
  bookingId: number,
): Promise<PaymentDto[]> {
  const res = await apiFetch<PaymentDto[]>(
    `/Payments/bookings/${bookingId}`,
  );
  return res.data ?? [];
}
