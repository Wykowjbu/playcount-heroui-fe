"use client";

import { Button, Link, Skeleton, Card } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import { ChevronRight, Magnifier } from "@gravity-ui/icons";
import { VenueCard } from "./venue-card";
import type { DiscoveryVenue } from "@/lib/types/discovery";

interface Props {
  venues: DiscoveryVenue[];
  subtitle: string;
  isLoading?: boolean;
  onChangeLocation?: () => void;
}

function VenueCardSkeleton() {
  return (
    <Card>
      <Card.Content className="p-0">
        <Skeleton className="h-40 rounded-t-xl w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
          <Skeleton className="h-8 w-full rounded mt-2" />
        </div>
      </Card.Content>
    </Card>
  );
}

export function RecommendedVenuesSection({ venues, subtitle, isLoading, onChangeLocation }: Props) {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-col sm:flex-row">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Gợi ý cho bạn</h2>
            <p className="text-muted text-sm mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {onChangeLocation && (
              <Button variant="ghost" size="sm" onPress={onChangeLocation}>
                Đổi vị trí
              </Button>
            )}
            <Link href="/venues" className={buttonVariants({ variant: "outline", size: "sm", className: "min-h-11" })}>
              Xem hết <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => (
              <VenueCardSkeleton key={i} />
            ))}
          </div>
        ) : venues.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <Magnifier className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">Chưa có gợi ý</p>
            <p className="text-sm mt-1">Hãy chọn môn thể thao để nhận gợi ý phù hợp</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((v) => (
              <VenueCard key={v.id} venue={v} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
