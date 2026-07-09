import { apiFetch, authHeader, type ApiResponse } from "@/lib/api";
import type {
  UserProfileResponseDto,
  UpdateUserProfileRequestDto,
  PlayerSportResponseDto,
  AddPlayerSportRequestDto,
  UpdatePlayerSportRequestDto,
  SportOption,
} from "@/lib/types/profile";

/**
 * Fetch current user's profile.
 * GET /api/Users/me
 */
export async function getMyProfile(token: string): Promise<UserProfileResponseDto> {
  const res = await apiFetch<UserProfileResponseDto>("/Users/me", {
    headers: authHeader(token),
  });
  return res.data!;
}

/**
 * Update current user's profile.
 * PUT /api/Users/me
 */
export async function updateMyProfile(
  token: string,
  body: UpdateUserProfileRequestDto,
): Promise<UserProfileResponseDto> {
  const res = await apiFetch<UserProfileResponseDto>("/Users/me", {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(body),
  });
  return res.data!;
}

/**
 * Fetch current player's sports.
 * GET /api/Users/me/sports
 */
export async function getMySports(token: string): Promise<PlayerSportResponseDto[]> {
  const res = await apiFetch<PlayerSportResponseDto[]>("/Users/me/sports", {
    headers: authHeader(token),
  });
  return res.data ?? [];
}

/**
 * Add a sport to player's profile.
 * POST /api/Users/me/sports
 */
export async function addMySport(
  token: string,
  body: AddPlayerSportRequestDto,
): Promise<PlayerSportResponseDto> {
  const res = await apiFetch<PlayerSportResponseDto>("/Users/me/sports", {
    method: "POST",
    headers: authHeader(token),
    body: JSON.stringify(body),
  });
  return res.data!;
}

/**
 * Update a player's sport skill level.
 * PUT /api/Users/me/sports/{sportId}
 */
export async function updateMySport(
  token: string,
  sportId: number,
  body: UpdatePlayerSportRequestDto,
): Promise<PlayerSportResponseDto> {
  const res = await apiFetch<PlayerSportResponseDto>(`/Users/me/sports/${sportId}`, {
    method: "PUT",
    headers: authHeader(token),
    body: JSON.stringify(body),
  });
  return res.data!;
}

/**
 * Delete a player's sport.
 * DELETE /api/Users/me/sports/{sportId}
 */
export async function deleteMySport(token: string, sportId: number): Promise<void> {
  await apiFetch<unknown>(`/Users/me/sports/${sportId}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
}

/**
 * Fetch list of all available sports (for Select dropdown).
 * GET /api/Sports
 * ponytail: if BE doesn't have this endpoint yet, callers should handle the error
 * and fall back to an empty list.
 */
export async function getSportsOptions(token: string): Promise<SportOption[]> {
  const res = await apiFetch<SportOption[]>("/Sports", {
    headers: authHeader(token),
  });
  return res.data ?? [];
}

/**
 * Upload avatar image.
 * TODO: Wire to signed Cloudflare R2 upload endpoint when available.
 * Currently returns the object URL for preview; real upload integration pending.
 */
export async function uploadAvatarImage(file: File): Promise<string> {
  // TODO: Implement signed upload to Cloudflare R2.
  // For now, return a local object URL for preview.
  // The caller should upload to R2 via a server-side endpoint,
  // then pass the resulting URL to updateMyProfile({ avatarUrl }).
  return URL.createObjectURL(file);
}
