import { apiFetch, apiFetchPaged, buildQuery } from "@/lib/api/client";
import type {
  MatchSearchRequestDto,
  MatchResponseDto,
  CreateMatchRequestDto,
  UpdateMatchRequestDto,
  MatchJoinRequestDto,
  RespondJoinRequestDto,
  MatchInvitationDto,
  CreateMatchInvitationDto,
  RespondMatchInvitationDto,
} from "@/lib/types/api";

/* ------------------------------------------------------------------ */
/* MATCHES                                                             */
/* ------------------------------------------------------------------ */

export async function searchMatches(
  params: MatchSearchRequestDto = {},
): Promise<{ items: MatchResponseDto[]; totalCount: number; totalPages: number }> {
  const qs = buildQuery({
    SportId: params.sportId,
    SkillLevel: params.skillLevel,
    Location: params.location,
    StartFrom: params.startFrom,
    StartTo: params.startTo,
    IncludeFull: params.includeFull,
    PageIndex: params.pageIndex ?? 1,
    PageSize: params.pageSize ?? 12,
  });
  const body = await apiFetchPaged<MatchResponseDto[]>(`/Matches${qs}`);
  return {
    items: body.data ?? [],
    totalCount: body.totalCount,
    totalPages: body.totalPages,
  };
}

export async function getMatchById(id: number): Promise<MatchResponseDto> {
  const res = await apiFetch<{ match: MatchResponseDto; participants: MatchResponseDto["participants"] }>(`/Matches/${id}`);
  return { ...res.data!.match, participants: res.data!.participants };
}

export async function createMatch(
  body: CreateMatchRequestDto,
): Promise<MatchResponseDto> {
  const res = await apiFetch<MatchResponseDto>("/Matches", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateMatch(
  id: number,
  body: UpdateMatchRequestDto,
): Promise<MatchResponseDto> {
  const res = await apiFetch<MatchResponseDto>(`/Matches/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function cancelMatch(id: number): Promise<void> {
  await apiFetch(`/Matches/${id}/cancel`, { method: "PATCH" });
}

/* ---- Join Requests ---- */

export async function requestToJoin(id: number): Promise<void> {
  await apiFetch(`/Matches/${id}/join-requests`, { method: "POST" });
}

export async function cancelJoinRequest(id: number): Promise<void> {
  await apiFetch(`/Matches/${id}/join-requests/me`, { method: "DELETE" });
}

export async function getJoinRequests(
  id: number,
): Promise<MatchJoinRequestDto[]> {
  const res = await apiFetch<MatchJoinRequestDto[]>(
    `/Matches/${id}/join-requests`,
  );
  return res.data ?? [];
}

export async function respondToJoinRequest(
  id: number,
  requestId: number,
  status: string,
): Promise<void> {
  const body: RespondJoinRequestDto = { status };
  await apiFetch(`/Matches/${id}/join-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/* ---- Participants ---- */

export async function leaveMatch(id: number): Promise<void> {
  await apiFetch(`/Matches/${id}/participants/me`, { method: "DELETE" });
}

/* ---- Invitations ---- */

export async function invitePlayer(
  id: number,
  inviteeId: number,
): Promise<void> {
  const body: CreateMatchInvitationDto = { inviteeId };
  await apiFetch(`/Matches/${id}/invitations`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMyInvitations(): Promise<MatchInvitationDto[]> {
  const res = await apiFetch<MatchInvitationDto[]>("/Matches/invitations/me");
  return res.data ?? [];
}

export async function respondToInvitation(
  invitationId: number,
  status: string,
): Promise<void> {
  const body: RespondMatchInvitationDto = { status };
  await apiFetch(`/Matches/invitations/${invitationId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
