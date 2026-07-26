"use client";

import Link from "next/link";
import { Card, Chip } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import MapPin from "@gravity-ui/icons/MapPin";
import Clock from "@gravity-ui/icons/Clock";
import Check from "@gravity-ui/icons/Check";
import type { DiscoveryVenue } from "@/lib/types/discovery";

function formatTime(t?: string): string {
  if (!t) return "";
  // Handle "HH:MM:SS" or "HH:MM" or TimeSpan "HH:MM:SS"
  const parts = t.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return t;
}

export function VenueCard({ venue }: { venue: DiscoveryVenue }) {
  const timeDisplay =
    venue.openTime && venue.closeTime
      ? `${formatTime(venue.openTime)}–${formatTime(venue.closeTime)}`
      : null;

  return (
    <Card className="interactive-card h-full overflow-hidden rounded-2xl">
      <Card.Content className="p-0 flex flex-col h-full">
        {/* Cover image */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-accent/20 via-warning/10 to-surface-secondary">
          {venue.imageUrl ? (
            <img
              src={venue.imageUrl}
              alt={venue.name}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-10 h-10 text-accent/35" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-4 rounded-2xl border border-white/40" />
          <div className="pointer-events-none absolute bottom-4 left-1/2 top-4 w-px bg-white/30" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent" />
          {/* Status badge */}
          <div className="absolute right-3 top-3">
            <Chip
              size="sm"
              variant="primary"
              className={
                venue.isOpenNow
                  ? "bg-success/95 text-white shadow-sm"
                  : "bg-black/55 text-white backdrop-blur"
              }
            >
              {venue.isOpenNow ? "Đang mở" : "Đã đóng"}
            </Chip>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-1 text-base font-semibold text-foreground">
            {venue.name}
          </h3>

          {/* Address */}
          <div className="flex items-start gap-1.5 text-sm leading-5 text-muted">
            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span className="line-clamp-2">{venue.address || `${venue.district}, ${venue.city}`}</span>
          </div>

          {/* Time */}
          {timeDisplay && (
            <div className="flex items-center gap-1.5 text-sm text-muted">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{timeDisplay}</span>
            </div>
          )}

          {/* Amenities */}
          {venue.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {venue.amenities.slice(0, 3).map((a) => (
                <Chip key={a} size="sm" variant="soft" className="text-xs">
                  <Check className="w-3 h-3 mr-0.5" />
                  {a}
                </Chip>
              ))}
              {venue.amenities.length > 3 && (
                <Chip size="sm" variant="soft" className="text-xs">
                  +{venue.amenities.length - 3}
                </Chip>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-3">
            <Link href={`/venues/${venue.id}`} className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-11 flex-1" })}>
              Xem sân
            </Link>
            <Link href={`/venues/${venue.id}`} className={buttonVariants({ variant: "primary", size: "sm", className: "min-h-11 flex-1" })}>
              Đặt sân
            </Link>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
