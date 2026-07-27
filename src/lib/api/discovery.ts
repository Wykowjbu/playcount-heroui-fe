import { apiFetch, apiFetchPaged, buildQuery } from "@/lib/api/client";
import type {
  VenueResponseDto,
  MatchResponseDto,
  SportDto,
  CourtDto,
  VenueAvailabilityResponseDto,
  RatingStatsDto,
  ReviewResponseDto,
} from "@/lib/types/api";
import type { DiscoveryVenue, DiscoveryMatch, VenueSearchResult } from "@/lib/types/discovery";
import { isVenueOpenNow } from "@/lib/utils/format";

/* ------------------------------------------------------------------ */
/* VENUES                                                              */
/* ------------------------------------------------------------------ */
export interface VenueSearchParams {
  keyword?: string;
  sportId?: number;
  isOpenNow?: boolean;
  pageIndex?: number;
  pageSize?: number;
}

export async function searchVenues(
  params: VenueSearchParams = {},
): Promise<VenueSearchResult> {
  const qs = buildQuery({
    Keyword: params.keyword,
    SportId: params.sportId,
    IsOpenNow: params.isOpenNow,
    PageIndex: params.pageIndex ?? 1,
    PageSize: params.pageSize ?? 12,
  });

  const body = await apiFetchPaged<VenueResponseDto[]>(`/Venues${qs}`, { skipAuth: true });

  return {
    items: (body.data ?? []).map(mapVenueToDiscovery),
    totalCount: body.totalCount,
    totalPages: body.totalPages,
    pageIndex: body.pageIndex,
    pageSize: body.pageSize,
  };
}

export async function getVenueById(id: number): Promise<VenueResponseDto> {
  const res = await apiFetch<VenueResponseDto>(`/Venues/${id}`, { skipAuth: true });
  return res.data!;
}

export async function getVenueOpeningHours(venueId: number) {
  const res = await apiFetch<{ dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[]>(
    `/Venues/${venueId}/opening-hours`,
    { skipAuth: true },
  );
  return res.data ?? [];
}

export async function getVenueCourts(venueId: number) {
  const res = await apiFetch<CourtDto[]>(
    `/venues/${venueId}/courts`,
    { skipAuth: true },
  );
  return res.data ?? [];
}

export async function getVenueAvailability(venueId: number, date: string) {
  const res = await apiFetch<VenueAvailabilityResponseDto>(
    `/venues/${venueId}/availability${buildQuery({ date })}`,
    { skipAuth: true },
  );
  return res.data!;
}

export async function getVenueReviews(venueId: number, page = 1, pageSize = 10) {
  const res = await apiFetchPaged<ReviewResponseDto[]>(
    `/venues/${venueId}/reviews?page=${page}&pageSize=${pageSize}`,
    { skipAuth: true },
  );
  return res.data ?? [];
}

export async function getVenueRatingStats(venueId: number) {
  const res = await apiFetch<RatingStatsDto>(
    `/venues/${venueId}/rating-stats`,
    { skipAuth: true },
  );
  return res.data;
}

function mapVenueToDiscovery(v: VenueResponseDto): DiscoveryVenue {
  const cover = v.images?.find((i) => i.isCover) ?? v.images?.[0];
  const parts = (v.address ?? "").split(",").map((s) => s.trim());
  const district = parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? "";
  const city = parts.length >= 1 ? parts[parts.length - 1] : "";

  return {
    id: String(v.id),
    name: v.name,
    sportName: "",
    sportId: 0,
    district,
    city,
    rating: 0,
    minPricePerHour: 0,
    imageUrl: cover?.imageUrl,
    isOpenNow: isVenueOpenNow(v.openTime, v.closeTime, v.openingHours),
    address: v.address ?? "",
    latitude: v.latitude ?? undefined,
    longitude: v.longitude ?? undefined,
    openTime: v.openTime ?? undefined,
    closeTime: v.closeTime ?? undefined,
    amenities: (v.amenities ?? []).map((a) => a.name),
  };
}

/* ------------------------------------------------------------------ */
/* MATCHES                                                             */
/* ------------------------------------------------------------------ */
export async function searchMatches(params: {
  sportId?: number;
  status?: string;
  pageIndex?: number;
  pageSize?: number;
} = {}): Promise<DiscoveryMatch[]> {
  const qs = buildQuery({
    SportId: params.sportId,
    Status: params.status,
    PageIndex: params.pageIndex ?? 1,
    PageSize: params.pageSize ?? 6,
  });

  const body = await apiFetchPaged<MatchResponseDto[]>(`/Matches${qs}`);
  const items = body.data ?? [];
  return items.map(mapMatchToDiscovery);
}

export async function getRecommendedMatches(limit = 6): Promise<DiscoveryMatch[]> {
  const res = await apiFetch<MatchResponseDto[]>(`/Matches/recommended?limit=${limit}`);
  return (res.data ?? []).map(mapMatchToDiscovery);
}

function mapMatchToDiscovery(m: MatchResponseDto): DiscoveryMatch {
  const levelMap: Record<string, string> = {
    "0": "Mới chơi",
    "1": "Trung bình",
    "2": "Nâng cao",
  };
  return {
    id: String(m.id),
    title: m.description ?? `${m.sportName} - ${m.venueName ?? "Chưa rõ"}`,
    sportName: m.sportName,
    sportId: m.sportId,
    startAt: m.startAt,
    venueName: m.venueName ?? m.locationDescription ?? "",
    neededPlayers: m.availableSlots,
    currentPlayers: m.participantCount,
    skillLevel: levelMap[String(m.requiredSkillLevelMin)] ?? String(m.requiredSkillLevelMin),
    status: m.status,
  };
}

/* ------------------------------------------------------------------ */
/* SPORTS (public)                                                     */
/* ------------------------------------------------------------------ */
export async function getAllSports(): Promise<SportDto[]> {
  const res = await apiFetch<SportDto[]>("/Sports?isActive=true", { skipAuth: true });
  return res.data ?? [];
}

/* ------------------------------------------------------------------ */
/* AMENITIES (public)                                                  */
/* ------------------------------------------------------------------ */
export async function getAllAmenities() {
  const res = await apiFetch<{ id: number; name: string; description: string | null }[]>(
    "/Amenities",
    { skipAuth: true },
  );
  return res.data ?? [];
}

/* ------------------------------------------------------------------ */
/* FAVORITES                                                           */
/* ------------------------------------------------------------------ */
export async function getMyFavorites() {
  interface FavoriteVenueItem {
    userProfileId: number;
    venueId: number;
    venue: VenueResponseDto;
  }
  const res = await apiFetch<FavoriteVenueItem[]>("/Venues/favorites/my");
  const venues = (res.data ?? []).map((item) => item.venue).filter(Boolean);
  return venues.map(mapVenueToDiscovery);
}

export async function addFavorite(venueId: number) {
  await apiFetch(`/Venues/${venueId}/favorites`, { method: "POST" });
}

export async function removeFavorite(venueId: number) {
  await apiFetch(`/Venues/${venueId}/favorites`, { method: "DELETE" });
}
