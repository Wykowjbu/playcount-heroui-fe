import { venueDetail, courts, ratingStats, reviews } from "@/mocks/venue-detail";
import { VenueDetailClient } from "@/components/venue/venue-detail-client";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <VenueDetailClient
      venueId={id}
      venue={venueDetail}
      courts={courts}
      ratings={ratingStats}
      reviews={reviews}
    />
  );
}
