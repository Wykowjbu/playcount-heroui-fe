"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Spinner,
  Chip,
  Avatar,
} from "@heroui/react";

import Star from "@gravity-ui/icons/Star";

import { OwnerGuard } from "@/lib/auth/guards";
import { OwnerShell } from "@/components/owner/owner-shell";
import { getMyVenues } from "@/lib/api/owner";
import { getVenueReviews } from "@/lib/api/discovery";
import type { VenueResponseDto, ReviewResponseDto } from "@/lib/types/api";
import { formatRelativeTime } from "@/lib/utils/format";
import { getStatusConfig } from "@/lib/utils/status-labels";

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
  const [reviews, setReviews] = useState<ReviewResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const v = await getMyVenues();
        setVenues(v);
        const allReviews: ReviewResponseDto[] = [];
        for (const venue of v.slice(0, 5)) {
          try {
            const data = await getVenueReviews(venue.id, 1, 20);
            allReviews.push(...data);
          } catch { /* Skip */ }
        }
        setReviews(allReviews);
      } catch { /* Error handled by empty state */ } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Đánh giá</h1>
        <p className="text-sm text-[var(--muted)] mt-1">Đánh giá từ khách hàng cho {venues.length} cơ sở</p>
      </div>

      {reviews.length === 0 ? (
        <Card className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <CardContent className="p-12 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--surface-secondary)] flex items-center justify-center">
              <Star className="w-8 h-8 text-[var(--muted)]" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold">Chưa có đánh giá</p>
              <p className="text-sm text-[var(--muted)] mt-1">Đánh giá sẽ hiển thị khi khách hàng đánh giá cơ sở của bạn</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const cfg = getStatusConfig("review", r.status);
            return (
              <Card key={r.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <Avatar size="md">
                      <Avatar.Fallback>{r.playerName?.charAt(0) ?? "?"}</Avatar.Fallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{r.playerName}</p>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? "text-[var(--warning)] fill-[var(--warning)]" : "text-[var(--muted)]"}`} />
                          ))}
                        </div>
                        <Chip size="sm" color={cfg.color} variant="soft">{cfg.label}</Chip>
                      </div>
                      {r.reviewText && <p className="text-sm mt-2">{r.reviewText}</p>}
                      <p className="text-xs text-[var(--muted)] mt-2">{formatRelativeTime(r.createdAt)} · Sân #{r.venueId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
