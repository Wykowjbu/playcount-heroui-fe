import type { ReviewImageDto } from "@/lib/types/api";

export const orderReviewImages = (images: ReviewImageDto[]) =>
  [...images].sort((a, b) => a.displayOrder - b.displayOrder);
