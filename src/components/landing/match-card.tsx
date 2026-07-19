"use client";

import { Card, Chip, Button, Link } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import MapPin from "@gravity-ui/icons/MapPin";
import Calendar from "@gravity-ui/icons/Calendar";
import Clock from "@gravity-ui/icons/Clock";
import Persons from "@gravity-ui/icons/Persons";
import PersonPlus from "@gravity-ui/icons/PersonPlus";
import type { DiscoveryMatch } from "@/lib/types/discovery";

function formatMatchDate(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    const date = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" });
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    return { date, time };
  } catch {
    return { date: iso, time: "" };
  }
}

export function MatchCard({ match }: { match: DiscoveryMatch }) {
  const { date, time } = formatMatchDate(match.startAt);
  const spotsLeft = match.neededPlayers;
  const isFull = spotsLeft <= 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <Card.Content className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip variant="secondary" size="sm" className="text-xs">{match.sportName}</Chip>
              <Chip variant="secondary" size="sm" className="text-xs" color={isFull ? "default" : "success"}>
                {isFull ? "Đầy" : `Còn ${spotsLeft} chỗ`}
              </Chip>
            </div>
            <h3 className="font-semibold mt-2 text-sm md:text-base truncate">{match.title}</h3>
          </div>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted">
          {match.venueName && (
            <p className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" /> {match.venueName}
            </p>
          )}
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 shrink-0" /> {date}
          </p>
          <p className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" /> {time}
          </p>
          <p className="flex items-center gap-1.5">
            <Persons className="w-3 h-3 shrink-0" /> {match.currentPlayers} người · {match.skillLevel}
          </p>
        </div>

        <div className="mt-4">
          {isFull ? (
            <Button variant="outline" size="sm" className="min-h-11 w-full" isDisabled>
              <PersonPlus className="w-4 h-4 mr-1" />
              Đã đầy
            </Button>
          ) : (
            <Link href={`/matches/${match.id}`} className={buttonVariants({ variant: "primary", size: "sm", className: "min-h-11 w-full" })}>
              <PersonPlus className="w-4 h-4 mr-1" />
              Tham gia
            </Link>
          )}
        </div>
      </Card.Content>
    </Card>
  );
}
