"use client";

import { Card, CardContent, Button, cn } from "@heroui/react";
import Link from "next/link";

export function AdminStatCard({
  title,
  value,
  subtitle,
  ctaLabel,
  ctaHref,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon: React.ElementType;
}) {
  return (
    <Card
      className={cn(
        "interactive-card h-auto min-h-0 rounded-2xl"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">{title}</p>
            <p className="mt-0.5 text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>
            )}
            {ctaLabel && ctaHref && (
              <Link href={ctaHref}>
                <Button variant="ghost" size="sm" className="mt-1 px-0">
                  {ctaLabel}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
