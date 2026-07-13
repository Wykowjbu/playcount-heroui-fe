"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Chip, Skeleton, Alert } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Check from "@gravity-ui/icons/Check";
import Star from "@gravity-ui/icons/Star";
import TrashBin from "@gravity-ui/icons/TrashBin";
import { PlayerGuard } from "@/lib/auth/guards";
import { getMyFavorites, removeFavorite } from "@/lib/api/discovery";
import type { DiscoveryVenue } from "@/lib/types/discovery";
import { SiteHeader } from "@/components/layout/site-header";

/* ------------------------------------------------------------------ */
/* PAGE                                                                */
/* ------------------------------------------------------------------ */
export default function FavoritesPage() {
  return (
    <PlayerGuard>
      <FavoritesContent />
    </PlayerGuard>
  );
}

function FavoritesContent() {
  const [venues, setVenues] = useState<DiscoveryVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyFavorites();
      setVenues(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (venueId: string) => {
    try {
      setRemovingId(venueId);
      await removeFavorite(Number(venueId));
      setVenues((prev) => prev.filter((v) => v.id !== venueId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa khỏi yêu thích");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="mx-auto max-w-[1180px] px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Sân yêu thích</h1>
          <p className="text-sm text-muted mt-1">
            Danh sách sân thể thao bạn đã lưu
          </p>
        </div>

        {error && (
          <Alert color="danger" className="mb-6">
            {error}
          </Alert>
        )}

        {loading ? (
          <FavoritesSkeleton />
        ) : venues.length === 0 ? (
          <FavoritesEmpty />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <FavoriteVenueCard
                key={venue.id}
                venue={venue}
                onRemove={handleRemove}
                isRemoving={removingId === venue.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* FAVORITE VENUE CARD                                                 */
/* ------------------------------------------------------------------ */
function formatTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : t;
}

function FavoriteVenueCard({
  venue,
  onRemove,
  isRemoving,
}: {
  venue: DiscoveryVenue;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  const timeDisplay =
    venue.openTime && venue.closeTime
      ? `${formatTime(venue.openTime)}–${formatTime(venue.closeTime)}`
      : null;

  return (
    <Card className="overflow-hidden h-full">
      <Card.Content className="p-0 flex flex-col h-full">
        {/* Cover image */}
        <div className="relative h-40 bg-gradient-to-br from-accent/20 via-accent/10 to-surface-secondary overflow-hidden">
          {venue.imageUrl ? (
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-accent/30" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Chip
              size="sm"
              variant="primary"
              className={
                venue.isOpenNow
                  ? "bg-success/90 text-white"
                  : "bg-foreground/60 text-white"
              }
            >
              {venue.isOpenNow ? "Đang mở" : "Đã đóng"}
            </Chip>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          <h3 className="font-semibold text-foreground line-clamp-1">
            {venue.name}
          </h3>

          <div className="flex items-start gap-1.5 text-sm text-muted">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">
              {venue.address || `${venue.district}, ${venue.city}`}
            </span>
          </div>

          {timeDisplay && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{timeDisplay}</span>
            </div>
          )}

          {venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {venue.amenities.slice(0, 3).map((a) => (
                <Chip key={a} size="sm" variant="primary" className="text-xs">
                  <Check className="w-3 h-3 mr-0.5" />
                  {a}
                </Chip>
              ))}
              {venue.amenities.length > 3 && (
                <Chip size="sm" variant="primary" className="text-xs">
                  +{venue.amenities.length - 3}
                </Chip>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-auto pt-3">
            <Link href={`/venues/${venue.id}`} className="flex-1">
              <Button variant="secondary" size="sm" className="w-full">
                Xem sân
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              isDisabled={isRemoving}
              onPress={() => onRemove(venue.id)}
            >
              <TrashBin className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* SKELETON                                                            */
/* ------------------------------------------------------------------ */
function FavoritesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <Card.Content className="p-0">
            <Skeleton className="h-40 w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 flex-1 rounded" />
                <Skeleton className="h-8 w-10 rounded" />
              </div>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* EMPTY STATE                                                         */
/* ------------------------------------------------------------------ */
function FavoritesEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <Star className="w-16 h-16 text-muted/30 mb-6" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Bạn chưa lưu sân nào
      </h3>
      <p className="text-sm text-muted max-w-md mb-6">
        Khám phá và lưu lại những sân thể thao yêu thích của bạn
      </p>
      <Link href="/venues">
        <Button variant="primary">
          <MapPin className="w-4 h-4 mr-1" />
          Khám phá sân bãi
        </Button>
      </Link>
    </div>
  );
}
