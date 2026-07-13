import { apiFetch } from "@/lib/api/client";
import type {
  UserProfileResponseDto,
  UpdateUserProfileRequestDto,
  PlayerSportResponseDto,
  AddPlayerSportRequestDto,
  UpdatePlayerSportRequestDto,
  SportDto,
} from "@/lib/types/api";

/* ------------------------------------------------------------------ */
/* USER PROFILE                                                        */
/* ------------------------------------------------------------------ */

export async function getMyProfile(): Promise<UserProfileResponseDto> {
  const res = await apiFetch<UserProfileResponseDto>("/Users/me");
  return res.data!;
}

export async function updateMyProfile(
  body: UpdateUserProfileRequestDto,
): Promise<UserProfileResponseDto> {
  const res = await apiFetch<UserProfileResponseDto>("/Users/me", {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

/* ------------------------------------------------------------------ */
/* PLAYER SPORTS                                                       */
/* ------------------------------------------------------------------ */

export async function getMySports(): Promise<PlayerSportResponseDto[]> {
  const res = await apiFetch<PlayerSportResponseDto[]>("/Users/me/sports");
  return res.data ?? [];
}

export async function addMySport(
  body: AddPlayerSportRequestDto,
): Promise<PlayerSportResponseDto> {
  const res = await apiFetch<PlayerSportResponseDto>("/Users/me/sports", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function updateMySport(
  sportId: number,
  body: UpdatePlayerSportRequestDto,
): Promise<PlayerSportResponseDto> {
  const res = await apiFetch<PlayerSportResponseDto>(`/Users/me/sports/${sportId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return res.data!;
}

export async function deleteMySport(sportId: number): Promise<void> {
  await apiFetch<unknown>(`/Users/me/sports/${sportId}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/* SPORTS OPTIONS                                                      */
/* ------------------------------------------------------------------ */

export async function getSportsOptions(): Promise<SportDto[]> {
  const res = await apiFetch<SportDto[]>("/Sports?isActive=true", { skipAuth: true });
  return res.data ?? [];
}

/* ------------------------------------------------------------------ */
/* AVATAR UPLOAD                                                       */
/* ------------------------------------------------------------------ */

/**
 * Upload avatar via Next.js server route (protects R2 credentials).
 * Returns the public URL of the uploaded image.
 */
export async function uploadAvatarImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload/avatar", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || "Upload failed");
  }

  const data = await res.json();
  return data.url;
}
