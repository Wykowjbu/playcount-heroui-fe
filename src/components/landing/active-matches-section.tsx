"use client";

import { Button, Link } from "@heroui/react";
import { ChevronRight } from "@gravity-ui/icons";
import { MatchCard } from "./match-card";
import type { DiscoveryMatch } from "@/lib/types/discovery";

interface Props {
  matches: DiscoveryMatch[];
  isLoading?: boolean;
}

export function ActiveMatchesSection({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <section className="py-12 md:py-16" style={{ background: "var(--surface-secondary)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">Kèo đấu đang tuyển</h2>
              <p className="text-muted text-sm mt-1">Đang tải...</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="h-48 rounded-xl" style={{ background: "var(--surface)" }} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (matches.length === 0) return null;

  return (
    <section className="py-12 md:py-16" style={{ background: "var(--surface-secondary)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center justify-between mb-6 gap-3 flex-col sm:flex-row">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Kèo đấu đang tuyển</h2>
            <p className="text-muted text-sm mt-1">Các kèo phù hợp với môn bạn chơi</p>
          </div>
          <Link href="/matches">
            <Button variant="outline" size="sm">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
