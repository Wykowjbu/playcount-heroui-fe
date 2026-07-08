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
        "rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-secondary)]">
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--muted)] font-medium">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>
            )}
            {ctaLabel && ctaHref && (
              <Link href={ctaHref} className="mt-3">
                <Button variant="ghost" size="sm" className="px-0">
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
