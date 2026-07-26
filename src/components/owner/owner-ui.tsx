import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Card, Chip, Link as HeroUILink } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import { getOwnerStatusConfig, type OwnerStatusKind } from "./owner-status";

export function OwnerPageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex flex-wrap items-start justify-between gap-4"><div className="max-w-2xl"><h1 className="text-2xl font-bold tracking-tight sm:text-[28px]">{title}</h1><p className="mt-1.5 text-sm leading-6 text-[var(--muted)]">{description}</p></div>{action}</div>;
}

export function OwnerEmptyState({ title, description, action, icon: Icon }: { title: string; description: string; action?: ReactNode; icon?: ComponentType<{ className?: string }> }) {
  return <Card className="interactive-card h-auto min-h-0 items-stretch gap-0 rounded-2xl p-0"><Card.Content className="min-h-0 items-start gap-3 p-5 sm:p-6">{Icon && <div className="rounded-2xl bg-accent/10 p-3 text-accent"><Icon className="size-6" /></div>}<div><p className="font-semibold">{title}</p><p className="mt-1 max-w-md text-sm leading-6 text-[var(--muted)]">{description}</p></div>{action}</Card.Content></Card>;
}

export function OwnerStatusChip({ kind, status }: { kind: OwnerStatusKind; status: string | null | undefined }) {
  const config = getOwnerStatusConfig(kind, status);
  return <Chip size="sm" color={config.color} variant="soft">{config.label}</Chip>;
}

export function OwnerMetricCard({ label, value, detail, icon: Icon, href }: { label: string; value: string | number; detail: string; icon: ComponentType<{ className?: string }>; href?: string }) {
  const body = <Card className="interactive-card h-auto min-h-0 items-stretch gap-0 rounded-2xl p-0"><Card.Content className="min-h-0 flex-row items-start gap-3 p-4"><div className="shrink-0 rounded-2xl bg-accent/10 p-2.5 text-accent"><Icon className="size-5" /></div><div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--muted)]">{label}</p><p className="mt-1 text-3xl font-semibold leading-none">{value}</p><p className="mt-2 text-xs text-[var(--muted)]">{detail}</p></div></Card.Content></Card>;
  return href ? <Link href={href} className="block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{body}</Link> : body;
}

export function OwnerTextLink({ href, children }: { href: string; children: ReactNode }) {
  return <OwnerButtonLink href={href} size="sm" variant="tertiary">{children}</OwnerButtonLink>;
}

export function OwnerButtonLink({ href, children, variant = "primary", size = "md", isIconOnly = false, className, label }: { href: string; children: ReactNode; variant?: "danger" | "danger-soft" | "ghost" | "outline" | "primary" | "secondary" | "tertiary"; size?: "sm" | "md" | "lg"; isIconOnly?: boolean; className?: string; label?: string }) {
  return <HeroUILink href={href} aria-label={label} className={buttonVariants({ variant, size, isIconOnly, className })}>{children}</HeroUILink>;
}
