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

const PAYOS_CHECKOUT_HOSTS = new Set(["img.payos.vn", "pay.payos.vn"]);

export function getTrustedPayOsCheckoutUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && PAYOS_CHECKOUT_HOSTS.has(url.hostname)
      && !url.username
      && !url.password
      && !url.port
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export async function createPayOsPayment(
  bookingId: number,
): Promise<CreatePayOsResponse> {
  const { apiFetch } = await import("@/lib/api/client");
  const res = await apiFetch<CreatePayOsResponse>(
    `/Payments/bookings/${bookingId}/payos`,
    { method: "POST" },
  );
  return res.data!;
}

export async function syncPayOsPayment(
  bookingId: number,
): Promise<PaymentDto> {
  const { apiFetch } = await import("@/lib/api/client");
  const res = await apiFetch<PaymentDto>(
    `/Payments/bookings/${bookingId}/sync-payos`,
    { method: "POST" },
  );
  return res.data!;
}

export async function getBookingPayments(
  bookingId: number,
): Promise<PaymentDto[]> {
  const { apiFetch } = await import("@/lib/api/client");
  const res = await apiFetch<PaymentDto[]>(
    `/Payments/bookings/${bookingId}`,
  );
  return res.data ?? [];
}
