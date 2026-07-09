/** Venue card data for discovery/home */
export interface DiscoveryVenue {
  id: string;
  name: string;
  sportName: string;
  sportId: number;
  district: string;
  city: string;
  distanceKm?: number;
  rating: number;
  minPricePerHour: number;
  imageUrl?: string;
  isOpenNow: boolean;
  address: string;
  openTime?: string;
  closeTime?: string;
  amenities: string[];
}

/** Paged venue search result */
export interface VenueSearchResult {
  items: DiscoveryVenue[];
  totalCount: number;
  totalPages: number;
  pageIndex: number;
  pageSize: number;
}

/** Match card data for discovery/home */
export interface DiscoveryMatch {
  id: string;
  title: string;
  sportName: string;
  sportId: number;
  startAt: string;
  venueName: string;
  neededPlayers: number;
  currentPlayers: number;
  skillLevel: string;
  status: string;
}

/** Location state for personalization */
export interface LocationState {
  city?: string;
  lat?: number;
  lng?: number;
  source: "profile" | "geolocation" | "manual" | null;
}

/** Recommendation state based on user profile completeness */
export type RecommendationState = "A" | "B" | "C" | "D";

/**
 * A: has sports + has location → personalized
 * B: has sports, no location → prompt location
 * C: no sports, has location → prompt sports
 * D: no sports, no location → prompt both
 */
export function getRecommendationState(
  hasSports: boolean,
  hasLocation: boolean,
): RecommendationState {
  if (hasSports && hasLocation) return "A";
  if (hasSports && !hasLocation) return "B";
  if (!hasSports && hasLocation) return "C";
  return "D";
}
