import { apiFetch, apiFetchPaged } from "@/lib/api/client";
import type { AddReviewImageRequestDto, CreateReviewRequestDto, ReviewImageDto, ReviewResponseDto } from "@/lib/types/api";

export async function getMyReviews(page = 1, pageSize = 100) {
  const response = await apiFetchPaged<ReviewResponseDto[]>(`/Reviews/my?page=${page}&pageSize=${pageSize}`);
  return response.data ?? [];
}

export async function createReview(body: CreateReviewRequestDto) {
  const response = await apiFetch<ReviewResponseDto>("/Reviews", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return response.data!;
}

export async function addReviewImage(reviewId: number, body: AddReviewImageRequestDto) {
  const response = await apiFetch<ReviewImageDto>(`/Reviews/${reviewId}/images`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return response.data!;
}

export async function deleteReviewImage(reviewId: number, imageId: number) {
  await apiFetch(`/Reviews/${reviewId}/images/${imageId}`, { method: "DELETE" });
}
