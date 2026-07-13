import { apiFetch, apiFetchPaged, buildQuery, type PagedResponse } from "@/lib/api/client";
import type {
  VenueResponseDto,
  CreateVenueRequestDto,
  UpdateVenueRequestDto,
  CourtDto,
  CreateCourtRequestDto,
  UpdateCourtRequestDto,
  BookingResponseDto,
  BookingQueryDto,
  PricingRuleDto,
  CreatePricingRuleRequestDto,
  UpdatePricingRuleRequestDto,
  CourtScheduleDto,
  CreateCourtScheduleRequestDto,
  VenueStaffResponseDto,
  AddVenueStaffRequestDto,
  ReviewResponseDto,
  OwnerStatsDto,
  OpeningHourDto,
  UpdateOpeningHoursRequestDto,
  UpdateBookingStatusRequestDto,
} from "@/lib/types/api";

/* ------------------------------------------------------------------ */
/* OWNER VENUES                                                        */
/* ------------------------------------------------------------------ */

export async function getMyVenues(): Promise<VenueResponseDto[]> {
  const res = await apiFetch<VenueResponseDto[]>("/Venues/my");
  return res.data ?? [];
}

export async function getMyVenueById(id: number): Promise<VenueResponseDto> {
  const res = await apiFetch<VenueResponseDto>(`/Venues/my/${id}`);
  return res.data!;
}

export async function createVenue(body: CreateVenueRequestDto): Promise<VenueResponseDto> {
  const res = await apiFetch<VenueResponseDto>("/Venues", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateVenue(id: number, body: UpdateVenueRequestDto): Promise<VenueResponseDto> {
  const res = await apiFetch<VenueResponseDto>(`/Venues/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deleteVenue(id: number): Promise<void> {
  await apiFetch<unknown>(`/Venues/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* VENUE IMAGES                                                        */
/* ------------------------------------------------------------------ */

export async function addVenueImage(venueId: number, imageUrl: string): Promise<void> {
  await apiFetch<unknown>(`/Venues/${venueId}/images`, {
    method: "POST",
    body: JSON.stringify({ imageUrl }),
  });
}

export async function deleteVenueImage(venueId: number, imageId: number): Promise<void> {
  await apiFetch<unknown>(`/Venues/${venueId}/images/${imageId}`, { method: "DELETE" });
}

export async function setCoverImage(venueId: number, imageId: number): Promise<void> {
  await apiFetch<unknown>(`/Venues/${venueId}/images/${imageId}/set-cover`, { method: "PATCH" });
}

/* ------------------------------------------------------------------ */
/* VENUE AMENITIES                                                     */
/* ------------------------------------------------------------------ */

export async function addVenueAmenity(venueId: number, amenityId: number): Promise<void> {
  await apiFetch<unknown>(`/Venues/${venueId}/amenities/${amenityId}`, { method: "POST" });
}

export async function removeVenueAmenity(venueId: number, amenityId: number): Promise<void> {
  await apiFetch<unknown>(`/Venues/${venueId}/amenities/${amenityId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* OPENING HOURS                                                       */
/* ------------------------------------------------------------------ */

export async function updateOpeningHours(venueId: number, hours: OpeningHourDto[]): Promise<void> {
  await apiFetch<unknown>(`/Venues/${venueId}/opening-hours`, {
    method: "PUT",
    body: JSON.stringify({ openingHours: hours } as UpdateOpeningHoursRequestDto),
  });
}

/* ------------------------------------------------------------------ */
/* OWNER STATS                                                         */
/* ------------------------------------------------------------------ */

export async function getOwnerStats(): Promise<OwnerStatsDto> {
  const res = await apiFetch<OwnerStatsDto>("/Venues/stats");
  return res.data!;
}

/* ------------------------------------------------------------------ */
/* COURTS                                                              */
/* ------------------------------------------------------------------ */

export async function getCourts(venueId: number): Promise<CourtDto[]> {
  const res = await apiFetch<CourtDto[]>(`/venues/${venueId}/courts`);
  return res.data ?? [];
}

export async function getCourt(courtId: number): Promise<CourtDto> {
  const res = await apiFetch<CourtDto>(`/courts/${courtId}`);
  return res.data!;
}

export async function createCourt(venueId: number, body: CreateCourtRequestDto): Promise<CourtDto> {
  const res = await apiFetch<CourtDto>(`/venues/${venueId}/courts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateCourt(courtId: number, body: UpdateCourtRequestDto): Promise<CourtDto> {
  const res = await apiFetch<CourtDto>(`/courts/${courtId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deleteCourt(courtId: number): Promise<void> {
  await apiFetch<unknown>(`/courts/${courtId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* PRICING RULES                                                       */
/* ------------------------------------------------------------------ */

export async function getPricingRules(courtId: number): Promise<PricingRuleDto[]> {
  const res = await apiFetch<PricingRuleDto[]>(`/courts/${courtId}/pricing-rules`);
  return res.data ?? [];
}

export async function createPricingRule(courtId: number, body: CreatePricingRuleRequestDto): Promise<PricingRuleDto> {
  const res = await apiFetch<PricingRuleDto>(`/courts/${courtId}/pricing-rules`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updatePricingRule(id: number, body: UpdatePricingRuleRequestDto): Promise<PricingRuleDto> {
  const res = await apiFetch<PricingRuleDto>(`/pricing-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deletePricingRule(id: number): Promise<void> {
  await apiFetch<unknown>(`/pricing-rules/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* COURT SCHEDULES                                                     */
/* ------------------------------------------------------------------ */

export async function getCourtSchedules(courtId: number): Promise<CourtScheduleDto[]> {
  const res = await apiFetch<CourtScheduleDto[]>(`/courts/${courtId}/schedules`);
  return res.data ?? [];
}

export async function createCourtSchedule(courtId: number, body: CreateCourtScheduleRequestDto): Promise<CourtScheduleDto> {
  const res = await apiFetch<CourtScheduleDto>(`/courts/${courtId}/schedules`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deleteCourtSchedule(id: number): Promise<void> {
  await apiFetch<unknown>(`/court-schedules/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* BOOKINGS (owner)                                                    */
/* ------------------------------------------------------------------ */

export async function getVenueBookings(
  venueId: number,
  query: BookingQueryDto = {},
): Promise<PagedResponse<BookingResponseDto[]>> {
  const qs = buildQuery({
    Status: query.status,
    From: query.from,
    To: query.to,
    Page: query.page ?? 1,
    PageSize: query.pageSize ?? 20,
  });
  return apiFetchPaged<BookingResponseDto[]>(`/venues/${venueId}/bookings${qs}`);
}

export async function confirmBooking(id: number): Promise<void> {
  await apiFetch<unknown>(`/Bookings/${id}/confirm`, {
    method: "PATCH",
    body: JSON.stringify({} as UpdateBookingStatusRequestDto),
  });
}

export async function rejectBooking(id: number, reason?: string): Promise<void> {
  await apiFetch<unknown>(`/Bookings/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason } as UpdateBookingStatusRequestDto),
  });
}

export async function completeBooking(id: number): Promise<void> {
  await apiFetch<unknown>(`/Bookings/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({} as UpdateBookingStatusRequestDto),
  });
}

/* ------------------------------------------------------------------ */
/* VENUE STAFF                                                         */
/* ------------------------------------------------------------------ */

export async function getVenueStaff(venueId: number): Promise<VenueStaffResponseDto[]> {
  const res = await apiFetch<VenueStaffResponseDto[]>(`/venues/${venueId}/staff`);
  return res.data ?? [];
}

export async function addStaff(venueId: number, body: AddVenueStaffRequestDto): Promise<VenueStaffResponseDto> {
  const res = await apiFetch<VenueStaffResponseDto>(`/venues/${venueId}/staff`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function removeStaff(venueId: number, staffId: number): Promise<void> {
  await apiFetch<unknown>(`/venues/${venueId}/staff/${staffId}`, { method: "DELETE" });
}
