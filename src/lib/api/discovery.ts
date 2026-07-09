import { apiFetch, authHeader, API_BASE } from "@/lib/api";
import type { DiscoveryVenue, DiscoveryMatch, VenueSearchResult } from "@/lib/types/discovery";

/* ------------------------------------------------------------------ */
/* BACKEND DTOs (subset used by discovery)                             */
/* ------------------------------------------------------------------ */
interface VenueResponseDto {
  id: number;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  openTime: string | null;
  closeTime: string | null;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  images: { id: number; imageUrl: string; isCover: boolean }[];
  amenities: { id: number; name: string }[];
  openingHours: { dayOfWeek: number; openTime: string | null; closeTime: string | null; isClosed: boolean }[];
}

/** PagedResponse shape from BE */
interface PagedResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: string[];
  totalCount: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

interface MatchResponseDto {
  id: number;
  hostProfileId: number;
  hostName: string;
  hostAvatarUrl: string | null;
  sportId: number;
  sportCode: string;
  sportName: string;
  courtId: number | null;
  courtName: string | null;
  venueName: string | null;
  locationDescription: string | null;
  startAt: string;
  endAt: string;
  requiredSkillLevelMin: number;
  requiredSkillLevelMax: number;
  maxParticipants: number;
  participantCount: number;
  availableSlots: number;
  costDescription: string | null;
  description: string | null;
  status: string;
  isHost: boolean;
  isParticipant: boolean;
  myJoinRequestStatus: string | null;
  createdAt: string;
}

interface SportDto {
  id: number;
  code: string;
  name: string;
  description: string | null;
  playerCount: number | null;
  isActive: boolean;
  createdAt: string;
}

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
  const query = new URLSearchParams();
  if (params.keyword) query.set("Keyword", params.keyword);
  if (params.sportId) query.set("SportId", String(params.sportId));
  if (params.isOpenNow != null) query.set("IsOpenNow", String(params.isOpenNow));
  query.set("PageIndex", String(params.pageIndex ?? 1));
  query.set("PageSize", String(params.pageSize ?? 12));

  const qs = query.toString();
  const res = await fetch(`${API_BASE}/venues?${qs}`);
  const body: PagedResponse<VenueResponseDto[]> = await res.json().catch(() => ({
    success: false,
    message: "Network error",
    data: null,
    errors: ["Network error"],
    totalCount: 0,
    totalPages: 0,
    pageIndex: 1,
    pageSize: 12,
  }));

  if (!body.success) {
    throw new Error(body.message || "Failed to load venues");
  }

  return {
    items: (body.data ?? []).map(mapVenueToDiscovery),
    totalCount: body.totalCount,
    totalPages: body.totalPages,
    pageIndex: body.pageIndex,
    pageSize: body.pageSize,
  };
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
    isOpenNow: isVenueOpenNow(v.openTime, v.closeTime),
    address: v.address ?? "",
    openTime: v.openTime ?? undefined,
    closeTime: v.closeTime ?? undefined,
    amenities: (v.amenities ?? []).map((a) => a.name),
  };
}

function isVenueOpenNow(openTime: string | null, closeTime: string | null): boolean {
  if (!openTime || !closeTime) return false;
  try {
    const now = new Date();
    const [oh, om] = openTime.split(":").map(Number);
    const [ch, cm] = closeTime.split(":").map(Number);
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= oh * 60 + om && mins <= ch * 60 + cm;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* MATCHES                                                             */
/* ------------------------------------------------------------------ */
interface MatchSearchParams {
  sportId?: number;
  location?: string;
  pageIndex?: number;
  pageSize?: number;
}

export async function searchMatches(
  token: string,
  params: MatchSearchParams = {},
): Promise<DiscoveryMatch[]> {
  const query = new URLSearchParams();
  if (params.sportId) query.set("SportId", String(params.sportId));
  if (params.location) query.set("Location", params.location);
  query.set("PageIndex", String(params.pageIndex ?? 1));
  query.set("PageSize", String(params.pageSize ?? 6));

  const qs = query.toString();
  const res = await apiFetch<{ items: MatchResponseDto[] }>(
    `/matches?${qs}`,
    { headers: authHeader(token) },
  );
  // PagedResponse may have items array or be the array itself
  const items = Array.isArray(res.data) ? res.data : (res.data as unknown as { items?: MatchResponseDto[] })?.items ?? [];
  return items.map(mapMatchToDiscovery);
}

export async function getRecommendedMatches(
  token: string,
  limit = 6,
): Promise<DiscoveryMatch[]> {
  const res = await apiFetch<MatchResponseDto[]>(
    `/matches/recommended?limit=${limit}`,
    { headers: authHeader(token) },
  );
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
    skillLevel:
      levelMap[String(m.requiredSkillLevelMin)] ??
      String(m.requiredSkillLevelMin),
    status: m.status,
  };
}

/* ------------------------------------------------------------------ */
/* SPORTS (public)                                                     */
/* ------------------------------------------------------------------ */
export async function getAllSports(): Promise<SportDto[]> {
  const res = await apiFetch<SportDto[]>("/sports?isActive=true");
  return res.data ?? [];
}
