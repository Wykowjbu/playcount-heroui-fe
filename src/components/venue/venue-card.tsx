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
          {/* Status badge */}
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

          {/* Address */}
          <div className="flex items-start gap-1.5 text-sm text-muted">
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
