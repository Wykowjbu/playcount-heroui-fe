"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Check from "@gravity-ui/icons/Check";
import Star from "@gravity-ui/icons/Star";
import StarFill from "@gravity-ui/icons/StarFill";
import type { DiscoveryVenue } from "@/lib/types/discovery";
import { addFavorite, removeFavorite } from "@/lib/api/discovery";

function formatTime(t?: string): string {
  if (!t) return "";
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return t;
}

export function VenueCard({ venue }: { venue: DiscoveryVenue }) {
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loadingFav) return;
    setLoadingFav(true);
    try {
      if (isFav) {
        await removeFavorite(Number(venue.id));
        setIsFav(false);
      } else {
        await addFavorite(Number(venue.id));
        setIsFav(true);
      }
    } catch {
      setIsFav(!isFav);
    } finally {
      setLoadingFav(false);
    }
  };

  const timeDisplay =
    venue.openTime && venue.closeTime
      ? `${formatTime(venue.openTime)}–${formatTime(venue.closeTime)}`
      : null;

  return (
    <Card className="interactive-card h-full overflow-hidden rounded-2xl group">
      <Card.Content className="p-0 flex flex-col h-full">
        {/* ── Cover image ─────────────────────────────────── */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
          {venue.imageUrl ? (
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-8 h-8 text-slate-300" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

          {/* ── Favorite button — small & harmonious ──────── */}
          <button
            type="button"
            onClick={toggleFavorite}
            title={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            aria-label={isFav ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
            className={[
              "absolute left-2.5 top-2.5 z-10",
              "flex h-7 w-7 items-center justify-center rounded-full",
              "transition-all duration-150 active:scale-90 cursor-pointer",
              isFav
                ? "bg-amber-400/95 shadow-sm"
                : "bg-black/30 hover:bg-black/45 backdrop-blur-sm",
            ].join(" ")}
          >
            {isFav ? (
              <StarFill className="h-3.5 w-3.5 text-white" />
            ) : (
              <Star className="h-3.5 w-3.5 text-white" />
            )}
          </button>

          {/* ── Status badge ──────────────────────────────── */}
          <div className="absolute right-2.5 top-2.5">
            <span
              className={[
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                venue.isOpenNow
                  ? "bg-emerald-500/90 text-white backdrop-blur-sm"
                  : "bg-black/45 text-white backdrop-blur-sm",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block w-1.5 h-1.5 rounded-full",
                  venue.isOpenNow ? "bg-white" : "bg-slate-400",
                ].join(" ")}
              />
              {venue.isOpenNow ? "Đang mở" : "Đã đóng"}
            </span>
          </div>
        </div>

        {/* ── Content ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 text-[0.9375rem] font-semibold text-foreground leading-snug">
            {venue.name}
          </h3>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-[0.8125rem] leading-5 text-muted">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent" />
            <span className="line-clamp-2">
              {venue.address || `${venue.district}, ${venue.city}`}
            </span>
          </div>

          {/* Time */}
          {timeDisplay && (
            <div className="flex items-center gap-1.5 text-[0.8125rem] text-muted">
              <Clock className="w-3.5 h-3.5 shrink-0 text-muted" />
              <span>{timeDisplay}</span>
            </div>
          )}

          {/* Amenities */}
          {venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {venue.amenities.slice(0, 3).map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600"
                >
                  <Check className="w-2.5 h-2.5 text-accent" />
                  {a}
                </span>
              ))}
              {venue.amenities.length > 3 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500">
                  +{venue.amenities.length - 3}
                </span>
              )}
            </div>
          )}

          {/* ── Actions ─────────────────────────────────── */}
          <div className="flex gap-2 mt-auto pt-3">
            <Link
              href={`/venues/${venue.id}`}
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "min-h-9 flex-1 text-[0.8125rem] font-medium",
              })}
            >
              Xem sân
            </Link>
            <Link
              href={`/venues/${venue.id}`}
              className={buttonVariants({
                variant: "primary",
                size: "sm",
                className: "min-h-9 flex-1 text-[0.8125rem] font-medium",
              })}
            >
              Đặt sân
            </Link>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
