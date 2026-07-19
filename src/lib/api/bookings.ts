import { apiFetch, apiFetchPaged, buildQuery } from "@/lib/api/client";
import type {
  CreateBookingRequestDto,
  BookingResponseDto,
  BookingQueryDto,
  BookingAvailabilityResponseDto,
} from "@/lib/types/api";

/* ------------------------------------------------------------------ */
/* BOOKINGS                                                            */
/* ------------------------------------------------------------------ */

export async function createBooking(
  body: CreateBookingRequestDto,
): Promise<BookingResponseDto> {
  const res = await apiFetch<BookingResponseDto>("/Bookings", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function getBookingById(id: number): Promise<BookingResponseDto> {
  const res = await apiFetch<BookingResponseDto>(`/Bookings/${id}`);
  return res.data!;
}

export async function getMyBookings(
  query: BookingQueryDto = {},
): Promise<BookingResponseDto[]> {
  const qs = buildQuery({
    status: query.status,
    from: query.from,
    to: query.to,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 10,
  });
  const body = await apiFetch<BookingResponseDto[]>(`/Bookings/me${qs}`);
  return body.data ?? [];
}

export async function getVenueBookings(
  venueId: number,
  query: BookingQueryDto = {},
): Promise<{ items: BookingResponseDto[]; totalCount: number; totalPages: number }> {
  const qs = buildQuery({
    Status: query.status,
    From: query.from,
    To: query.to,
    Page: query.page ?? 1,
    PageSize: query.pageSize ?? 10,
  });
  const body = await apiFetchPaged<BookingResponseDto[]>(
    `/venues/${venueId}/bookings${qs}`,
  );
  return {
    items: body.data ?? [],
    totalCount: body.totalCount,
    totalPages: body.totalPages,
  };
}

export async function checkAvailability(
  courtId: number,
  startAt: string,
  endAt: string,
): Promise<BookingAvailabilityResponseDto> {
  const qs = buildQuery({ StartAt: startAt, EndAt: endAt });
  const res = await apiFetch<BookingAvailabilityResponseDto>(
    `/courts/${courtId}/availability${qs}`,
    { skipAuth: true },
  );
  return res.data!;
}

export async function cancelBooking(
  id: number,
  reason?: string,
): Promise<void> {
  await apiFetch(`/Bookings/${id}/cancel`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function confirmBooking(id: number): Promise<void> {
  await apiFetch(`/Bookings/${id}/confirm`, { method: "PATCH" });
}

export async function rejectBooking(id: number): Promise<void> {
  await apiFetch(`/Bookings/${id}/reject`, { method: "PATCH" });
}

export async function completeBooking(id: number): Promise<void> {
  await apiFetch(`/Bookings/${id}/complete`, { method: "PATCH" });
}
