import { apiFetch, apiFetchPaged, buildQuery, type PagedResponse } from "@/lib/api/client";
import type {
  VenueResponseDto,
  UpdateVenueStatusRequestDto,
  CourtOwnerDetailDto,
  UpdateCourtOwnerVerificationStatusRequestDto,
  SportDto,
  CreateSportRequestDto,
  UpdateSportRequestDto,
  AmenityDto,
  CreateAmenityRequestDto,
  ReviewResponseDto,
} from "@/lib/types/api";

/* ------------------------------------------------------------------ */
/* ADMIN — VENUES                                                      */
/* ------------------------------------------------------------------ */

export async function getAdminVenues(status?: string): Promise<PagedResponse<VenueResponseDto[]>> {
  const qs = buildQuery({ status });
  return apiFetchPaged<VenueResponseDto[]>(`/Venues/admin${qs}`);
}

export async function getAdminVenueById(id: number): Promise<VenueResponseDto> {
  const res = await apiFetch<VenueResponseDto>(`/Venues/admin/${id}`);
  return res.data!;
}

export async function updateVenueStatus(id: number, body: UpdateVenueStatusRequestDto): Promise<void> {
  await apiFetch<unknown>(`/Venues/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ */
/* ADMIN — COURT OWNERS                                                */
/* ------------------------------------------------------------------ */

export async function getCourtOwners(status?: string): Promise<CourtOwnerDetailDto[]> {
  const qs = buildQuery({ status });
  const res = await apiFetch<CourtOwnerDetailDto[]>(`/court-owners${qs}`);
  return res.data ?? [];
}

export async function getCourtOwnerById(id: number): Promise<CourtOwnerDetailDto> {
  const res = await apiFetch<CourtOwnerDetailDto>(`/court-owners/${id}`);
  return res.data!;
}

export async function updateOwnerVerification(
  id: number,
  body: UpdateCourtOwnerVerificationStatusRequestDto,
): Promise<void> {
  await apiFetch<unknown>(`/court-owners/${id}/verification-status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/* ------------------------------------------------------------------ */
/* ADMIN — SPORTS                                                      */
/* ------------------------------------------------------------------ */

export async function getAllSportsAdmin(isActive?: boolean): Promise<SportDto[]> {
  const qs = buildQuery({ isActive });
  const res = await apiFetch<SportDto[]>(`/Sports${qs}`);
  return res.data ?? [];
}

export async function createSport(body: CreateSportRequestDto): Promise<SportDto> {
  const res = await apiFetch<SportDto>("/Sports", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateSport(id: number, body: UpdateSportRequestDto): Promise<SportDto> {
  const res = await apiFetch<SportDto>(`/Sports/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function toggleSportActive(id: number): Promise<void> {
  await apiFetch<unknown>(`/Sports/${id}/toggle-active`, { method: "PATCH" });
}

/* ------------------------------------------------------------------ */
/* ADMIN — AMENITIES                                                   */
/* ------------------------------------------------------------------ */

export async function getAllAmenitiesAdmin(): Promise<AmenityDto[]> {
  const res = await apiFetch<AmenityDto[]>("/Amenities");
  return res.data ?? [];
}

export async function createAmenity(body: CreateAmenityRequestDto): Promise<AmenityDto> {
  const res = await apiFetch<AmenityDto>("/Amenities", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateAmenity(id: number, body: CreateAmenityRequestDto): Promise<AmenityDto> {
  const res = await apiFetch<AmenityDto>(`/Amenities/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deleteAmenity(id: number): Promise<void> {
  await apiFetch<unknown>(`/Amenities/${id}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* ADMIN — REVIEWS                                                     */
/* ------------------------------------------------------------------ */

export async function moderateReview(id: number, status: string): Promise<void> {
  await apiFetch<unknown>(`/admin/reviews/${id}/moderate?status=${encodeURIComponent(status)}`, {
    method: "PUT",
  });
}
