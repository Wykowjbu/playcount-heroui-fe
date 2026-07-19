"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button, Card, Chip, Tabs, Alert, Skeleton } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import { SiteHeader } from "@/components/layout/site-header";
import { PlayerBottomNav } from "@/components/layout/player-bottom-nav";
import { PlayerGuard } from "@/lib/auth/guards";
import { searchMatches, getMyInvitations, respondToInvitation } from "@/lib/api/matches";
import type { MatchResponseDto, MatchInvitationDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatDate, formatTime } from "@/lib/utils/format";
import Calendar from "@gravity-ui/icons/Calendar";
import MapPin from "@gravity-ui/icons/MapPin";
import Person from "@gravity-ui/icons/Person";
import Plus from "@gravity-ui/icons/Plus";
import Envelope from "@gravity-ui/icons/Envelope";

export function PlayerMatchesPage() {
  return (
    <PlayerGuard>
      <PlayerMatchesContent />
    </PlayerGuard>
  );
}

type TabKey = "hosted" | "joined" | "invitations";

function PlayerMatchesContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("hosted");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Kèo đấu của tôi</h1>
          <Link href="/matches/create" className={buttonVariants({ variant: "primary", size: "sm", className: "min-h-11" })}>
            <Plus className="size-4 mr-1" />
            Tạo kèo
          </Link>
        </div>

        <Tabs
          className="w-full"
          selectedKey={activeTab}
          onSelectionChange={(k) => setActiveTab(k as TabKey)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="My matches tabs">
              <Tabs.Tab id="hosted">
                Đã tổ chức
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="joined">
                Đã tham gia
                <Tabs.Indicator />
              </Tabs.Tab>
              <Tabs.Tab id="invitations">
                Lời mời
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>

          <Tabs.Panel id="hosted" className="pt-6">
            <HostedMatchesTab />
          </Tabs.Panel>
          <Tabs.Panel id="joined" className="pt-6">
            <JoinedMatchesTab />
          </Tabs.Panel>
          <Tabs.Panel id="invitations" className="pt-6">
            <InvitationsTab />
          </Tabs.Panel>
        </Tabs>
      </main>
      <PlayerBottomNav />
    </div>
  );
}

/* ---- Hosted Matches Tab ---- */
function HostedMatchesTab() {
  const [matches, setMatches] = useState<MatchResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHosted = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // We filter by "my hosted" via a search - the BE may support isHost filter
      // For now we search all and filter client-side if needed
      const result = await searchMatches({ pageIndex: 1, pageSize: 50 });
      setMatches(result.items.filter((m) => m.isHost));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHosted();
  }, [fetchHosted]);

  if (loading) return <MatchListSkeleton />;
  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content><Alert.Title>{error}</Alert.Title></Alert.Content>
        <Button variant="danger" size="sm" onPress={fetchHosted}>Thử lại</Button>
      </Alert>
    );
  }
  if (matches.length === 0) {
    return (
      <EmptyMatchesState
        message="Bạn chưa tổ chức kèo đấu nào."
        ctaHref="/matches/create"
        ctaLabel="Tạo kèo mới"
      />
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchListItem key={m.id} match={m} />
      ))}
    </div>
  );
}

/* ---- Joined Matches Tab ---- */
function JoinedMatchesTab() {
  const [matches, setMatches] = useState<MatchResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJoined = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await searchMatches({ pageIndex: 1, pageSize: 50 });
      setMatches(result.items.filter((m) => m.isParticipant && !m.isHost));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJoined();
  }, [fetchJoined]);

  if (loading) return <MatchListSkeleton />;
  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content><Alert.Title>{error}</Alert.Title></Alert.Content>
        <Button variant="danger" size="sm" onPress={fetchJoined}>Thử lại</Button>
      </Alert>
    );
  }
  if (matches.length === 0) {
    return (
      <EmptyMatchesState
        message="Bạn chưa tham gia kèo đấu nào."
        ctaHref="/matches"
        ctaLabel="Tìm kèo đấu"
      />
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <MatchListItem key={m.id} match={m} />
      ))}
    </div>
  );
}

/* ---- Invitations Tab ---- */
function InvitationsTab() {
  const [invitations, setInvitations] = useState<MatchInvitationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const actionLock = useRef<number | null>(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyInvitations();
      setInvitations(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải lời mời");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleRespond = async (invitationId: number, status: string) => {
    if (actionLock.current !== null) return;
    actionLock.current = invitationId;
    setActionLoading(invitationId);
    try {
      await respondToInvitation(invitationId, status);
      await fetchInvitations();
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      actionLock.current = null;
      setActionLoading(null);
    }
  };

  if (loading) return <MatchListSkeleton />;
  if (error) {
    return (
      <Alert status="danger">
        <Alert.Indicator />
        <Alert.Content><Alert.Title>{error}</Alert.Title></Alert.Content>
        <Button variant="danger" size="sm" onPress={fetchInvitations}>Thử lại</Button>
      </Alert>
    );
  }
  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Envelope className="size-12 text-[var(--muted)] mb-4" />
        <p className="text-[var(--muted)]">Bạn chưa có lời mời nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((inv) => {
        const invCfg = getStatusConfig("invitation", inv.status);
        return (
          <Card key={inv.id}>
            <Card.Content className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/matches/${inv.matchId}`} className="font-semibold text-[var(--foreground)] hover:underline truncate">
                      {inv.sportName}
                    </Link>
                    <Chip color={invCfg.color} size="sm">{invCfg.label}</Chip>
                  </div>
                  <p className="text-sm text-[var(--muted)]">
                    <Person className="inline size-3.5 mr-1" />
                    Mời bởi: {inv.inviterName}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    <Calendar className="inline size-3.5 mr-1" />
                    {formatDate(inv.matchStartAt)} · {formatTime(inv.matchStartAt)}
                  </p>
                  {inv.message && <p className="mt-1 text-sm text-[var(--foreground)]">{inv.message}</p>}
                </div>
                {inv.status === "Pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="primary"
                      className="min-h-11"
                      aria-label={actionLoading === inv.id ? `Đang phản hồi lời mời ${inv.sportName}` : `Chấp nhận lời mời ${inv.sportName}`}
                      isDisabled={actionLoading !== null}
                      onPress={() => handleRespond(inv.id, "Accepted")}
                    >
                      {actionLoading === inv.id ? "Đang xử lý..." : "Chấp nhận"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="min-h-11"
                      aria-label={`Từ chối lời mời ${inv.sportName}`}
                      isDisabled={actionLoading !== null}
                      onPress={() => handleRespond(inv.id, "Declined")}
                    >
                      Từ chối
                    </Button>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        );
      })}
    </div>
  );
}

/* ---- Shared: Match List Item ---- */
function MatchListItem({ match: m }: { match: MatchResponseDto }) {
  const statusCfg = getStatusConfig("match", m.status);
  return (
    <Link href={`/matches/${m.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <Card.Content className="p-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-[var(--foreground)] line-clamp-1">
                {m.description || `${m.sportName} - ${m.venueName ?? "Chưa rõ"}`}
              </h3>
              <Chip color={statusCfg.color} size="sm">{statusCfg.label}</Chip>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
              <span>
                <Calendar className="inline size-3.5 mr-1" />
                {formatDate(m.startAt)} · {formatTime(m.startAt)}
              </span>
              {(m.venueName || m.locationDescription) && (
                <span>
                  <MapPin className="inline size-3.5 mr-1" />
                  {m.venueName ?? m.locationDescription}
                </span>
              )}
              <span>
                <Person className="inline size-3.5 mr-1" />
                {m.participantCount}/{m.maxParticipants}
              </span>
            </div>
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}

/* ---- Shared: Skeleton ---- */
function MatchListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <Card.Content className="p-5 space-y-3">
            <Skeleton className="h-5 w-3/5 rounded-lg" />
            <Skeleton className="h-4 w-2/5 rounded-lg" />
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}

/* ---- Shared: Empty State ---- */
function EmptyMatchesState({
  message,
  ctaHref,
  ctaLabel,
}: {
  message: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Person className="size-12 text-[var(--muted)] mb-4" />
      <p className="text-[var(--muted)] mb-4">{message}</p>
      <Link href={ctaHref} className={buttonVariants({ variant: "primary", size: "sm", className: "min-h-11" })}>{ctaLabel}</Link>
    </div>
  );
}
