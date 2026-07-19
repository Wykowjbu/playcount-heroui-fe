"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button, Card, Chip, Alert, Skeleton, Avatar, Modal, TextField, Label, TextArea, Link as HeroUILink } from "@heroui/react";
import { buttonVariants } from "@heroui/styles/components/button";
import { SiteHeader } from "@/components/layout/site-header";
import { AuthGuard } from "@/lib/auth/guards";
import {
  getMatchById,
  requestToJoin,
  cancelJoinRequest,
  leaveMatch,
  cancelMatch,
  getJoinRequests,
  respondToJoinRequest,
  getMatchCandidates,
  invitePlayer,
} from "@/lib/api/matches";
import type { MatchResponseDto, MatchJoinRequestDto, MatchParticipantDto, MatchCandidateDto } from "@/lib/types/api";
import { getStatusConfig } from "@/lib/utils/status-labels";
import { formatDate, formatTime, getInitials } from "@/lib/utils/format";
import ChevronLeft from "@gravity-ui/icons/ChevronLeft";
import MapPin from "@gravity-ui/icons/MapPin";
import Calendar from "@gravity-ui/icons/Calendar";
import Clock from "@gravity-ui/icons/Clock";
import Person from "@gravity-ui/icons/Person";
import CircleCheck from "@gravity-ui/icons/CircleCheck";
import CircleXmark from "@gravity-ui/icons/CircleXmark";

export function MatchDetailPage({ matchId }: { matchId: number }) {
  return (
    <AuthGuard>
      <MatchDetailContent matchId={matchId} />
    </AuthGuard>
  );
}

function MatchDetailContent({ matchId }: { matchId: number }) {
  const [match, setMatch] = useState<MatchResponseDto | null>(null);
  const [joinRequests, setJoinRequests] = useState<MatchJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requestsLoadError, setRequestsLoadError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const actionLock = useRef(false);
  const actionRequest = useRef(0);
  const activeMatchId = useRef(matchId);
  activeMatchId.current = matchId;
  const previousMatchId = useRef(matchId);
  const detailRequest = useRef(0);
  const candidateRequest = useRef(0);
  const [candidates, setCandidates] = useState<MatchCandidateDto[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<number, string>>({});
  const [inviting, setInviting] = useState<Set<number>>(new Set());
  const [invited, setInvited] = useState<Set<number>>(new Set());
  const inviteLocks = useRef(new Set<string>());
  const [confirmation, setConfirmation] = useState<
    | { kind: "cancel" }
    | { kind: "join"; request: MatchJoinRequestDto; status: "Approved" | "Rejected" }
    | null
  >(null);

  const fetchCandidates = useCallback(async (parentRequest?: number) => {
    if (activeMatchId.current !== matchId) return;
    const requestId = ++candidateRequest.current;
    const isCurrent = () =>
      activeMatchId.current === matchId &&
      candidateRequest.current === requestId &&
      (parentRequest === undefined || detailRequest.current === parentRequest);
    setCandidateLoading(true);
    setCandidateError(null);
    try {
      const nextCandidates = await getMatchCandidates(matchId);
      if (isCurrent()) setCandidates(nextCandidates);
    } catch (err: unknown) {
      if (isCurrent()) setCandidateError(err instanceof Error ? err.message : "Không thể tải người chơi phù hợp");
    } finally {
      if (isCurrent()) setCandidateLoading(false);
    }
  }, [matchId]);

  const fetchData = useCallback(async () => {
    if (activeMatchId.current !== matchId) return;
    const requestId = ++detailRequest.current;
    const isCurrent = () => activeMatchId.current === matchId && detailRequest.current === requestId;
    setLoading(true);
    setLoadError(null);
    try {
      const m = await getMatchById(matchId);
      if (!isCurrent()) return;
      setMatch(m);
      if (m.isHost) {
        void fetchCandidates(requestId);
        try {
          const reqs = await getJoinRequests(matchId);
          if (isCurrent()) setJoinRequests(reqs);
        } catch (err: unknown) {
          if (isCurrent()) setRequestsLoadError(err instanceof Error ? err.message : "Không thể tải yêu cầu tham gia");
        }
      } else {
        setJoinRequests([]);
        setCandidates([]);
      }
    } catch (err: unknown) {
      if (isCurrent()) setLoadError(err instanceof Error ? err.message : "Không thể tải thông tin kèo đấu");
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [fetchCandidates, matchId]);

  useEffect(() => {
    if (previousMatchId.current !== matchId) {
      previousMatchId.current = matchId;
      detailRequest.current += 1;
      candidateRequest.current += 1;
      actionRequest.current += 1;
      actionLock.current = false;
      setMatch(null);
      setJoinRequests([]);
      setCandidates([]);
      setMessages({});
      setInviting(new Set());
      setInvited(new Set());
      inviteLocks.current.clear();
      setLoading(true);
      setCandidateLoading(false);
      setActionLoading(false);
      setConfirmation(null);
      setLoadError(null);
      setRequestsLoadError(null);
      setCandidateError(null);
    }
    void fetchData();
  }, [fetchData, matchId]);

  const handleAction = async (action: () => Promise<void>) => {
    if (actionLock.current) return;
    const requestId = ++actionRequest.current;
    const isCurrent = () => activeMatchId.current === matchId && actionRequest.current === requestId;
    actionLock.current = true;
    setActionLoading(true);
    try {
      await action();
      await fetchData();
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      if (isCurrent()) {
        actionLock.current = false;
        setActionLoading(false);
      }
    }
  };

  const handleInvite = async (candidate: MatchCandidateDto) => {
    const lockKey = `${matchId}:${candidate.profileId}`;
    const isCurrent = () => activeMatchId.current === matchId;
    if (inviteLocks.current.has(lockKey) || invited.has(candidate.profileId)) return;
    inviteLocks.current.add(lockKey);
    setInviting((current) => new Set(current).add(candidate.profileId));
    try {
      const message = messages[candidate.profileId]?.trim();
      await invitePlayer(matchId, { inviteeProfileId: candidate.profileId, ...(message ? { message } : {}) });
      if (isCurrent()) setInvited((current) => new Set(current).add(candidate.profileId));
    } catch {
      // apiFetch displays the backend message in a toast.
    } finally {
      inviteLocks.current.delete(lockKey);
      if (isCurrent()) {
        setInviting((current) => {
          const next = new Set(current);
          next.delete(candidate.profileId);
          return next;
        });
      }
    }
  };

  const confirmAction = async () => {
    const pending = confirmation;
    if (!pending || actionLock.current) return;
    const requestId = ++actionRequest.current;
    const isCurrent = () => activeMatchId.current === matchId && actionRequest.current === requestId;
    actionLock.current = true;
    setActionLoading(true);
    try {
      if (pending.kind === "cancel") {
        await cancelMatch(matchId);
      } else {
        await respondToJoinRequest(matchId, pending.request.id, pending.status);
      }
      if (!isCurrent()) return;
      setConfirmation(null);
      await fetchData();
    } catch {
      if (!isCurrent()) return;
    } finally {
      if (isCurrent()) {
        actionLock.current = false;
        setActionLoading(false);
      }
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

  if (loadError || !match) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
          <Alert status="danger">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>{loadError ?? "Không tìm thấy kèo đấu"}</Alert.Title>
            </Alert.Content>
          </Alert>
          <HeroUILink href="/matches" className={buttonVariants({ variant: "ghost", size: "sm", className: "mt-4 min-h-11" })}>
            <ChevronLeft className="size-4 mr-1" />
            Quay lại
          </HeroUILink>
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
                          className="min-h-11"
                          aria-label={`Duyệt ${req.userName}`}
                          isDisabled={actionLoading}
                          onPress={() => setConfirmation({ kind: "join", request: req, status: "Approved" })}
                        >
                          <CircleCheck className="size-3.5 mr-1" />
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="min-h-11"
                          aria-label={`Từ chối ${req.userName}`}
                          isDisabled={actionLoading}
                          onPress={() => setConfirmation({ kind: "join", request: req, status: "Rejected" })}
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

          {/* Match candidates (host only) */}
          {m.isHost && (
            <Card>
              <Card.Content className="p-5 space-y-4">
                <div>
                  <h2 className="font-semibold text-[var(--foreground)]">Gợi ý người chơi</h2>
                  <p className="text-sm text-[var(--muted)]">Mời những người phù hợp với kèo đấu này.</p>
                </div>
                {candidateLoading ? (
                  <div className="space-y-3" aria-label="Đang tải người chơi phù hợp">
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                  </div>
                ) : candidateError ? (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content><Alert.Title>{candidateError}</Alert.Title></Alert.Content>
                    <Button variant="danger" size="sm" className="min-h-11" onPress={() => fetchCandidates()}>
                      Thử tải lại người chơi
                    </Button>
                  </Alert>
                ) : candidates.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">Chưa tìm thấy người chơi phù hợp.</p>
                ) : (
                  <div className="space-y-3">
                    {candidates.map((candidate) => {
                      const isInviting = inviting.has(candidate.profileId);
                      const isInvited = invited.has(candidate.profileId);
                      return (
                        <Card key={candidate.profileId} className="bg-[var(--surface-secondary)]">
                          <Card.Content className="p-4 space-y-3">
                            <div className="flex items-center gap-3">
                              <Avatar size="sm">
                                {candidate.avatarUrl ? <Avatar.Image src={candidate.avatarUrl} alt={candidate.fullName} /> : null}
                                <Avatar.Fallback>{getInitials(candidate.fullName)}</Avatar.Fallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[var(--foreground)]">{candidate.fullName}</p>
                                <div className="flex flex-wrap gap-x-3 text-sm text-[var(--muted)]">
                                  {candidate.city && <span>{candidate.city}</span>}
                                  <span>{candidate.skillLevel ?? "Chưa cập nhật"}</span>
                                  <span>{candidate.matchScore}% phù hợp</span>
                                </div>
                              </div>
                            </div>
                            {isInvited ? (
                              <p role="status" className="text-sm text-[var(--success)]">Đã gửi lời mời cho {candidate.fullName}</p>
                            ) : (
                              <TextField
                                name={`invite-message-${candidate.profileId}`}
                                value={messages[candidate.profileId] ?? ""}
                                onChange={(value) => setMessages((current) => ({ ...current, [candidate.profileId]: value }))}
                                isDisabled={isInviting}
                              >
                                <Label>Lời nhắn cho {candidate.fullName}</Label>
                                <TextArea rows={2} placeholder="Lời nhắn không bắt buộc" />
                              </TextField>
                            )}
                            <Button
                              variant="primary"
                              size="sm"
                              className="min-h-11"
                              aria-label={isInvited ? `Đã mời ${candidate.fullName}` : isInviting ? `Đang gửi lời mời ${candidate.fullName}` : `Mời ${candidate.fullName}`}
                              isDisabled={isInviting || isInvited}
                              onPress={() => handleInvite(candidate)}
                            >
                              {isInvited ? "Đã mời" : isInviting ? "Đang gửi..." : "Gửi lời mời"}
                            </Button>
                          </Card.Content>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
                className="min-h-11"
                isDisabled={actionLoading}
                onPress={() => setConfirmation({ kind: "cancel" })}
              >
                Hủy kèo
              </Button>
            )}
          </div>

          {/* Error display */}
          {requestsLoadError && (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{requestsLoadError}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          {/* Meta */}
          <p className="text-xs text-[var(--muted)]">
            Tạo lúc: {formatDate(m.createdAt)}
          </p>
        </div>
      </main>

      <Modal>
        <Modal.Backdrop
          isOpen={confirmation !== null}
          onOpenChange={(open) => { if (!open && !actionLock.current) setConfirmation(null); }}
          isDismissable={!actionLoading}
        >
          <Modal.Container size="sm" placement="center">
            <Modal.Dialog aria-label={confirmation?.kind === "cancel" ? "Xác nhận hủy kèo" : confirmation?.status === "Approved" ? "Xác nhận duyệt yêu cầu" : "Xác nhận từ chối yêu cầu"}>
              {!actionLoading && <Modal.CloseTrigger />}
              <Modal.Header>
                <Modal.Heading>
                  {confirmation?.kind === "cancel"
                    ? "Xác nhận hủy kèo"
                    : confirmation?.status === "Approved"
                      ? "Xác nhận duyệt yêu cầu"
                      : "Xác nhận từ chối yêu cầu"}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>
                  {confirmation?.kind === "cancel"
                    ? "Kèo đấu sẽ bị hủy và người chơi không thể tiếp tục tham gia."
                    : `${confirmation?.status === "Approved" ? "Duyệt" : "Từ chối"} yêu cầu của ${confirmation?.request.userName}?`}
                </p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="tertiary" className="min-h-11" isDisabled={actionLoading} onPress={() => { if (!actionLock.current) setConfirmation(null); }}>Quay lại</Button>
                <Button
                  variant={confirmation?.kind === "cancel" || confirmation?.status === "Rejected" ? "danger" : "primary"}
                  className="min-h-11"
                  isDisabled={actionLoading}
                  onPress={confirmAction}
                >
                  {actionLoading ? "Đang xử lý" : confirmation?.kind === "cancel" ? "Xác nhận hủy kèo" : confirmation?.status === "Approved" ? "Xác nhận duyệt" : "Xác nhận từ chối"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
