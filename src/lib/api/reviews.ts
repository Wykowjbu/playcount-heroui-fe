import { apiFetch, apiFetchPaged } from "@/lib/api/client";
import type { CreateReviewRequestDto, ReviewResponseDto } from "@/lib/types/api";

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
