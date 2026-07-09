"use client";

import { Card, Skeleton } from "@heroui/react";

function CardSkeleton() {
  return (
    <Card>
      <Card.Content className="p-0">
        <Skeleton className="h-40 w-full" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 flex-1 rounded" />
            <Skeleton className="h-8 flex-1 rounded" />
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

export function VenueLoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
