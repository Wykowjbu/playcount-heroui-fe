"use client";

import { useEffect, useState } from "react";
import { Alert, Avatar, Card, Label, ListBox, Select, Skeleton } from "@heroui/react";
import Star from "@gravity-ui/icons/Star";
import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { OwnerEmptyState, OwnerPageHeader } from "@/components/owner/owner-ui";
import { getMyVenues } from "@/lib/api/owner";
import { getVenueRatingStats, getVenueReviews } from "@/lib/api/discovery";
import type { RatingStatsDto, ReviewResponseDto, VenueResponseDto } from "@/lib/types/api";
import { formatRelativeTime, getInitials } from "@/lib/utils/format";

export default function OwnerReviewsPage() {
  return (
    <OwnerGuard>
      <OwnerShell activeItem="reviews">
        <ReviewsContent />
      </OwnerShell>
    </OwnerGuard>
  );
}

function ReviewsContent() {
  const [venues, setVenues] = useState<VenueResponseDto[]>([]);
  const [venueId, setVenueId] = useState<number | null>(null);
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [stats, setStats] = useState<RatingStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyVenues()
      .then((data) => {
        setVenues(data);
        setVenueId(data[0]?.id ?? null);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể tải cơ sở."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!venueId) return;
    setLoading(true);
    Promise.all([
      getVenueReviews(venueId, 1, 100).catch(() => []),
      getVenueRatingStats(venueId).catch(() => null),
    ])
      .then(([items, summary]) => {
        setReviews(items);
        setStats(summary ?? null);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Không thể tải đánh giá."))
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading && venues.length === 0) return <Skeleton className="h-64 rounded-xl" />;

  return (
    <div className="mx-auto max-w-[1000px] space-y-6">
      <OwnerPageHeader title="Đánh giá" description="Theo dõi phản hồi của khách hàng theo từng cơ sở" />
      {error && (
        <Alert status="danger">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert>
      )}
      {venues.length === 0 ? (
        <OwnerEmptyState
          title="Chưa có cơ sở để xem đánh giá"
          description="Đánh giá sẽ xuất hiện sau khi khách hàng đặt và đánh giá sân của bạn."
          icon={Star}
        />
      ) : (
        <>
          <Select
            selectedKey={String(venueId)}
            onSelectionChange={(key) => setVenueId(Number(key))}
            className="max-w-md"
          >
            <Label>Cơ sở</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {venues.map((venue) => (
                  <ListBox.Item id={String(venue.id)} key={venue.id} textValue={venue.name}>
                    {venue.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <RatingSummary stats={stats} reviews={reviews} />

          {loading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : reviews.length === 0 ? (
            <OwnerEmptyState
              title="Chưa có đánh giá"
              description="Đánh giá sẽ hiển thị tại đây khi khách hàng gửi phản hồi."
              icon={Star}
            />
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card className="h-auto min-h-0 border border-[var(--border)] bg-[var(--surface)]" key={review.id}>
                  <Card.Content className="flex gap-3 p-5">
                    <Avatar size="sm">
                      <Avatar.Fallback>{getInitials(review.playerName)}</Avatar.Fallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{review.playerName}</p>
                        <span
                          className="flex items-center gap-1 text-sm text-[var(--warning)]"
                          aria-label={`${review.rating} trên 5 sao`}
                        >
                          <Star className="size-4" />
                          {review.rating}/5
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {review.courtName} · {formatRelativeTime(review.createdAt)}
                      </p>
                      {review.reviewText && <p className="mt-3 text-sm">{review.reviewText}</p>}
                    </div>
                  </Card.Content>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RatingSummary({ stats, reviews }: { stats: RatingStatsDto | null; reviews: ReviewResponseDto[] }) {
  const dist = (stats?.ratingDistribution ?? {}) as Record<string | number, number>;

  // Fallback rating distribution calculation from loaded reviews
  const computedDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let computedTotal = 0;
  let computedSum = 0;
  for (const r of reviews) {
    const star = Math.round(r.rating);
    if (star >= 1 && star <= 5) {
      computedDist[star] = (computedDist[star] ?? 0) + 1;
      computedSum += r.rating;
      computedTotal++;
    }
  }

  const totalReviews = stats?.totalReviews || computedTotal;
  const avgRating = stats?.averageRating ?? (computedTotal > 0 ? computedSum / computedTotal : 0);

  return (
    <Card className="h-auto min-h-0 border border-[var(--border)] bg-[var(--surface)]">
      <Card.Content className="grid gap-5 p-5 sm:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex items-center gap-4 sm:block">
          <div>
            <p className="text-xs text-[var(--muted)]">Điểm trung bình</p>
            <p className="mt-1 text-3xl font-semibold">
              {avgRating.toFixed(1)}
              <span className="text-base font-normal text-muted">/5</span>
            </p>
          </div>
          <div className="sm:mt-4">
            <p className="text-xs text-[var(--muted)]">Tổng đánh giá</p>
            <p className="mt-1 text-xl font-semibold">{totalReviews}</p>
          </div>
        </div>

        <div className="space-y-2" aria-label="Phân bố điểm đánh giá">
          {[5, 4, 3, 2, 1].map((rating) => {
            let count = dist[rating] ?? dist[String(rating)];
            if (count === undefined || (count === 0 && computedTotal > 0)) {
              count = computedDist[rating] ?? 0;
            }
            const width = totalReviews ? `${Math.round(((count ?? 0) / totalReviews) * 100)}%` : "0%";
            return (
              <div className="grid grid-cols-[44px_1fr_24px] items-center gap-2 text-xs" key={rating}>
                <span>{rating} sao</span>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                  <div className="h-full rounded-full bg-[var(--warning)]" style={{ width }} />
                </div>
                <span className="text-right text-muted">{count ?? 0}</span>
              </div>
            );
          })}
        </div>
      </Card.Content>
    </Card>
  );
}
