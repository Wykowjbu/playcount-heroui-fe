"use client";

import { Card, Chip, Button, Link, Separator } from "@heroui/react";
import MapPin from "@gravity-ui/icons/MapPin";
import Star from "@gravity-ui/icons/Star";
import type { DiscoveryVenue } from "@/lib/types/discovery";

function formatPrice(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

export function VenueCard({ venue }: { venue: DiscoveryVenue }) {
  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <Card.Content className="p-0">
        {/* Gradient placeholder based on sport */}
        <div className="relative h-40 bg-gradient-to-br from-accent/20 to-accent/5 rounded-t-xl flex items-center justify-center">
          {venue.imageUrl ? (
            <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover rounded-t-xl" />
          ) : (
            <span className="text-accent/40 text-4xl font-bold">{venue.sportName.charAt(0)}</span>
          )}
          <Chip variant="primary" color="accent" size="sm" className="absolute top-2 left-2 bg-white/90 text-foreground">
            {venue.sportName}
          </Chip>
          {!venue.isOpenNow && (
            <div className="absolute inset-0 bg-black/40 rounded-t-xl flex items-center justify-center">
              <Chip variant="primary" color="danger" size="sm">Đóng cửa</Chip>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-base group-hover:text-accent transition-colors line-clamp-1">{venue.name}</h3>
          <p className="text-xs text-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            {venue.distanceKm != null ? `${venue.distanceKm} km · ` : ""}{venue.district}
          </p>

          <div className="mt-2 flex items-center gap-2">
            {venue.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-amber-500">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-medium">{venue.rating}</span>
              </span>
            )}
            {venue.minPricePerHour > 0 && (
              <span className="text-xs text-muted">
                từ {formatPrice(venue.minPricePerHour)}/giờ
              </span>
            )}
          </div>

          <Separator className="my-3" />

          <div className="flex items-center gap-2">
            <Link href={`/venues/${venue.id}`} className="flex-1">
              <Button variant="ghost" size="sm" className="w-full">
                Xem sân
              </Button>
            </Link>
            <Link href={`/venues/${venue.id}?book=1`} className="flex-1">
              <Button variant="primary" size="sm" className="w-full" isDisabled={!venue.isOpenNow}>
                Đặt sân
              </Button>
            </Link>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
