"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button, Card, Chip, Alert, Skeleton, Separator, Avatar, Badge } from "@heroui/react";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import { useAuth } from "@/lib/auth-context";
import {
  getMatchById,
  requestToJoin,
  cancelJoinRequest,
  leaveMatch,
  cancelMatch,
  getJoinRequests,
  respondToJoinRequest,
} from "@/lib/api/matches";
import type { MatchResponseDto, MatchJoinRequestDto, MatchParticipantDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatDate, formatTime, getInitials } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Calendar from "@gravity-ui/icons/Calendar";
import Clock from "@gravity-ui/icons/Clock";
import Person from "@gravity-ui/icons/Person";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleXmark from "@gravity-ui/icons/CircleXmark";

const LEVEL_MAP: Record<number, string> = {
  0: "Mới chơi",
  1: "Trung bình",
  2: "Nâng cao",
};

export function MatchDetailPage({ matchId }: { matchId: number }) {
  return (
    <AuthGuard>
      <MatchDetailContent matchId={matchId} />
    </AuthGuard>
  );
}

function MatchDetailContent({ matchId }: { matchId: number }) {
  const { user } = useAuth();
  const [match, setMatch] = useState<MatchResponseDto | null>(null);
  const [joinRequests, setJoinRequests] = useState<MatchJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await getMatchById(matchId);
      setMatch(m);
      // If host, also fetch join requests
      if (m.isHost) {
        try {
          const reqs = await getJoinRequests(matchId);
          setJoinRequests(reqs);
        } catch {
          // join requests may fail for non-hosts
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không thể tải thông tin kèo đấu");
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAction = async (action: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await action();
      await fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 rounded-lg mb-6" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{error ?? "Không tìm thấy kèo đấu"}</Alert.Title>
            </Alert.Content>
          </Alert>
          <Link href="/matches" className="inline-block mt-4">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="size-4 mr-1" />
              Quay lại
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const m = match;
  const statusCfg = getStatusConfig("match", m.status);
  const joinReqCfg = m.myJoinRequestStatus
    ? getStatusConfig("joinRequest", m.myJoinRequestStatus)
    : null;
  const canJoin = !m.isHost && !m.isParticipant && m.status === "Open" && !m.myJoinRequestStatus;
  const canCancelJoinReq = !m.isHost && m.myJoinRequestStatus === "Pending";
  const canLeave = !m.isHost && m.isParticipant && (m.status === "Open" || m.status === "Full");
  const canCancelMatch = m.isHost && (m.status === "Open" || m.status === "Full");
  const pendingRequests = joinRequests.filter((r) => r.status === "Pending");

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pt-6 pb-24 sm:px-6 lg:px-8">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] mb-6"
        >
          <ChevronLeft className="size-4" />
          Quay lại danh sách
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Chip color={statusCfg.color}>{statusCfg.label}</Chip>
                <Chip variant="soft">{m.sportName}</Chip>
                {joinReqCfg && (
                  <Chip color={joinReqCfg.color} variant="soft">
                    Yêu cầu: {joinReqCfg.label}
                  </Chip>
                )}
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                {m.description || `${m.sportName} tại ${m.venueName ?? "Chưa rõ"}`}
              </h1>
            </div>
          </div>

          {/* Match Info */}
          <Card>
            <Card.Content className="p-5 space-y-4">
              <h2 className="font-semibold text-[var(--foreground)]">Thông tin kèo đấu</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-[var(--muted)]" />
                  <span>{formatDate(m.startAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-[var(--muted)]" />
                  <span>{formatTime(m.startAt)} - {formatTime(m.endAt)}</span>
                </div>
                {(m.venueName || m.locationDescription) && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin className="size-4 text-[var(--muted)] shrink-0" />
                    <span>{m.venueName ?? m.locationDescription}</span>
                    {m.courtName && <span className="text-[var(--muted)]">- {m.courtName}</span>}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Person className="size-4 text-[var(--muted)]" />
                  <span>
                    {m.participantCount}/{m.maxParticipants} người
                    {m.availableSlots > 0 && (
                      <span className="text-[var(--success)]"> · Còn {m.availableSlots} chỗ trống</span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--muted)]">Trình độ:</span>
                  <span>{m.requiredSkillLevelMin ?? "Không giới hạn"} - {m.requiredSkillLevelMax ?? "Không giới hạn"}</span>
                </div>
                {m.costDescription && (
                  <div className="sm:col-span-2">
                    <span className="text-[var(--muted)]">Chi phí: </span>
                    <span>{m.costDescription}</span>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>

          {/* Host */}
          <Card>
            <Card.Content className="p-5">
              <h2 className="font-semibold text-[var(--foreground)] mb-3">Người tổ chức</h2>
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  {m.hostAvatarUrl ? (
                    <Avatar.Image src={m.hostAvatarUrl} alt={m.hostName} />
                  ) : null}
                  <Avatar.Fallback>{getInitials(m.hostName)}</Avatar.Fallback>
                </Avatar>
                <span className="font-medium text-[var(--foreground)]">{m.hostName}</span>
              </div>
            </Card.Content>
          </Card>

          {/* Participants */}
          {m.participants && m.participants.length > 0 && (
            <Card>
              <Card.Content className="p-5">
                <h2 className="font-semibold text-[var(--foreground)] mb-3">
                  Người tham gia ({m.participants.length})
                </h2>
                <div className="space-y-2">
                  {m.participants.map((p: MatchParticipantDto) => (
                    <div key={p.profileId} className="flex items-center gap-3">
                      <Avatar size="sm">
                        {p.avatarUrl ? (
                          <Avatar.Image src={p.avatarUrl} alt={p.fullName} />
                        ) : null}
                        <Avatar.Fallback>{getInitials(p.fullName)}</Avatar.Fallback>
                      </Avatar>
                      <span className="text-sm text-[var(--foreground)]">{p.fullName}</span>
                      {p.isHost && (
                        <Chip size="sm" color="accent" variant="soft">Chủ kèo</Chip>
                      )}
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Join Requests (host only) */}
          {m.isHost && pendingRequests.length > 0 && (
            <Card>
              <Card.Content className="p-5">
                <h2 className="font-semibold text-[var(--foreground)] mb-3">
                  Yêu cầu tham gia ({pendingRequests.length})
                </h2>
                <div className="space-y-3">
                  {pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar size="sm">
                          {req.avatarUrl ? (
                            <Avatar.Image src={req.avatarUrl} alt={req.userName} />
                          ) : null}
                          <Avatar.Fallback>{getInitials(req.userName)}</Avatar.Fallback>
                        </Avatar>
                        <span className="text-sm text-[var(--foreground)]">{req.userName}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          isDisabled={actionLoading}
                          onPress={() => handleAction(() => respondToJoinRequest(matchId, req.id, "Approved"))}
                        >
                          <CircleCheck className="size-3.5 mr-1" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isDisabled={actionLoading}
                          onPress={() => handleAction(() => respondToJoinRequest(matchId, req.id, "Rejected"))}
                        >
                          <CircleXmark className="size-3.5 mr-1" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {canJoin && (
              <Button
                variant="primary"
                isDisabled={actionLoading}
                onPress={() => handleAction(() => requestToJoin(matchId))}
              >
                {actionLoading ? "Đang gửi..." : "Tham gia kèo"}
              </Button>
            )}
            {canCancelJoinReq && (
              <Button
                variant="ghost"
                isDisabled={actionLoading}
                onPress={() => handleAction(() => cancelJoinRequest(matchId))}
              >
                Hủy yêu cầu
              </Button>
            )}
            {canLeave && (
              <Button
                variant="danger"
                isDisabled={actionLoading}
                onPress={() => handleAction(() => leaveMatch(matchId))}
              >
                Rời kèo
              </Button>
            )}
            {canCancelMatch && (
              <Button
                variant="danger"
                isDisabled={actionLoading}
                onPress={() => handleAction(() => cancelMatch(matchId))}
              >
                Hủy kèo
              </Button>
            )}
          </div>

          {/* Error display */}
          {error && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          {/* Meta */}
          <p className="text-xs text-[var(--muted)]">
            Tạo lúc: {formatDate(m.createdAt)}
          </p>
        </div>
      </main>
    </div>
  );
}
