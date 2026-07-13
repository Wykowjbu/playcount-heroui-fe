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
  let ratingStats: RatingStatsDto | null;
  let reviewsData: ReviewResponseDto[];

  try {
    [venue, courts, openingHours, ratingStats, reviewsData] = await Promise.all([
      fetchApi<VenueResponseDto>(`/Venues/${venueId}`),
      fetchApi<CourtDto[]>(`/venues/${venueId}/courts`),
      fetchApi<OpeningHourDto[]>(`/Venues/${venueId}/opening-hours`),
      fetchApi<RatingStatsDto>(`/venues/${venueId}/rating-stats`).catch(() => null),
      fetchApi<ReviewResponseDto[]>(`/venues/${venueId}/reviews?page=1&pageSize=20`).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  if (!venue) notFound();

  return (
    <VenueDetailClient
      venueId={venueId}
      venue={venue}
      courts={courts}
      openingHours={openingHours}
      ratings={ratingStats ?? { averageRating: 0, totalReviews: 0, ratingDistribution: {} }}
      reviews={reviewsData}
    />
  );
}
