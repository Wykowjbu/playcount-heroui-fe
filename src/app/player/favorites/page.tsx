"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Chip, Skeleton, Alert, Spinner } from "@heroui/react";
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
  const router = useRouter();
  const [venues, setVenues] = useState<DiscoveryVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(() => new Set());
  const removingIdsRef = useRef(new Set<string>());
  const mountedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const loadInFlightRef = useRef<Promise<void> | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (loadInFlightRef.current) return loadInFlightRef.current;

    const generation = ++loadGenerationRef.current;
    if (!hasLoadedRef.current) setLoading(true);
    const request = (async () => {
      setError(null);
      try {
        const data = await getMyFavorites();
        if (!mountedRef.current || generation !== loadGenerationRef.current) return;
        setVenues(data);
        hasLoadedRef.current = true;
        setHasLoaded(true);
      } catch {
        if (mountedRef.current && generation === loadGenerationRef.current) {
          setError("Không thể tải danh sách yêu thích");
        }
      } finally {
        if (generation === loadGenerationRef.current) {
          loadInFlightRef.current = null;
          if (mountedRef.current) setLoading(false);
        }
      }
    })();
    loadInFlightRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void fetchFavorites();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFavorites]);

  const handleRemove = async (venueId: string) => {
    if (removingIdsRef.current.has(venueId)) return;
    removingIdsRef.current.add(venueId);
    setRemovingIds(new Set(removingIdsRef.current));
    setError(null);
    try {
      await removeFavorite(Number(venueId));
      loadGenerationRef.current += 1;
      loadInFlightRef.current = null;
      setVenues((prev) => prev.filter((v) => v.id !== venueId));
    } catch {
      setError("Không thể xóa khỏi yêu thích");
    } finally {
      removingIdsRef.current.delete(venueId);
      setRemovingIds(new Set(removingIdsRef.current));
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1180px] min-w-0 overflow-x-hidden px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sân yêu thích</h1>
            <p className="text-sm text-muted mt-1">
              Danh sách sân thể thao bạn đã lưu
            </p>
          </div>
          {hasLoaded && (
            <Button variant="secondary" className="min-h-11 shrink-0" onPress={() => void fetchFavorites()}>
              Làm mới
            </Button>
          )}
        </div>

        {error && (
          <Alert status="danger" className="mb-6">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Description>{error}</Alert.Description>
              {!loading && !hasLoaded && (
                <Button size="sm" variant="secondary" className="mt-3" onPress={() => void fetchFavorites()}>
                  Thử tải lại sân yêu thích
                </Button>
              )}
            </Alert.Content>
          </Alert>
        )}

        {loading && !hasLoaded ? (
          <FavoritesSkeleton />
        ) : !hasLoaded ? null : venues.length === 0 ? (
          <FavoritesEmpty onExplore={() => router.push("/venues")} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <FavoriteVenueCard
                key={venue.id}
                venue={venue}
                onRemove={handleRemove}
                isRemoving={removingIds.has(venue.id)}
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
    <Card className="h-full min-w-0 overflow-hidden">
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

          <div className="mt-auto flex min-w-0 gap-2 pt-3">
            <Link
              href={`/venues/${venue.id}`}
              className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl bg-[var(--surface-secondary)] px-3 text-sm font-semibold text-foreground"
            >
              Xem sân
            </Link>
            <Button
              isIconOnly
              aria-label={isRemoving ? `Đang xóa ${venue.name} khỏi yêu thích` : `Xóa ${venue.name} khỏi yêu thích`}
              variant="secondary"
              className="min-h-11 min-w-11 shrink-0"
              isDisabled={isRemoving}
              onPress={() => onRemove(venue.id)}
            >
              {isRemoving ? <Spinner size="sm" /> : <TrashBin className="w-3.5 h-3.5" />}
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
function FavoritesEmpty({ onExplore }: { onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <Star className="w-16 h-16 text-muted/30 mb-6" />
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Bạn chưa lưu sân nào
      </h3>
      <p className="text-sm text-muted max-w-md mb-6">
        Khám phá và lưu lại những sân thể thao yêu thích của bạn
      </p>
      <Button variant="primary" onPress={onExplore}>
        <MapPin className="w-4 h-4 mr-1" />
        Khám phá sân bãi
      </Button>
    </div>
  );
}
