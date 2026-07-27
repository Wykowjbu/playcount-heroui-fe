import { notFound } from "next/navigation";
import { VenueDetailClient } from "@/components/venue/venue-detail-client";
import type {
  VenueResponseDto,
  CourtDto,
  OpeningHourDto,
  ReviewResponseDto,
  RatingStatsDto,
} from "@/lib/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  totalCount?: number;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}/api${path}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  const body: ApiResponse<T> = await res.json();
  if (!body.success) throw new Error(body.message);
  return body.data;
}

/** Compute RatingStatsDto from an array of reviews (client-side fallback) */
function computeRatingStats(reviews: ReviewResponseDto[]): RatingStatsDto {
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) {
      distribution[star] = (distribution[star] ?? 0) + 1;
      total += r.rating;
    }
  }
  return {
    averageRating: reviews.length > 0 ? total / reviews.length : 0,
    totalReviews: reviews.length,
    ratingDistribution: distribution,
  };
}

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const venueId = Number(id);
  if (isNaN(venueId)) notFound();

  let venue: VenueResponseDto;
  let courts: CourtDto[];
  let openingHours: OpeningHourDto[];
  let reviewsData: ReviewResponseDto[];

  try {
    [venue, courts, openingHours, reviewsData] = await Promise.all([
      fetchApi<VenueResponseDto>(`/Venues/${venueId}`),
      fetchApi<CourtDto[]>(`/venues/${venueId}/courts`),
      fetchApi<OpeningHourDto[]>(`/Venues/${venueId}/opening-hours`),
      // Fetch up to 200 reviews so distribution is accurate
      fetchApi<ReviewResponseDto[]>(`/venues/${venueId}/reviews?page=1&pageSize=200`).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  if (!venue) notFound();

  // Compute rating stats from reviews (backend has no /rating-stats endpoint)
  const ratingStats: RatingStatsDto = computeRatingStats(reviewsData ?? []);

  return (
    <VenueDetailClient
      venueId={venueId}
      venue={venue}
      courts={courts}
      openingHours={openingHours}
      ratings={ratingStats}
      reviews={reviewsData ?? []}
    />
  );
}

