import assert from "node:assert/strict";
import test from "node:test";
import type { ReviewImageDto } from "../types/api";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { orderReviewImages } from "./review-images.ts";

const image = (displayOrder: number): ReviewImageDto => ({
  id: displayOrder,
  reviewId: 1,
  imageUrl: `https://example.test/${displayOrder}.webp`,
  displayOrder,
  createdAt: "2026-07-20T00:00:00Z",
});

test("orderReviewImages sorts a copy and preserves empty input", () => {
  const images = [image(2), image(0), image(1)];

  assert.deepEqual(orderReviewImages(images).map(({ id }) => id), [0, 1, 2]);
  assert.deepEqual(images.map(({ id }) => id), [2, 0, 1]);
  assert.deepEqual(orderReviewImages([]), []);
});
