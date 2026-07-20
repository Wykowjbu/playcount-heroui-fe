# Review Images Design

## Goal

Show every image attached to a venue review in the public venue detail page.

## Scope

- Update `ReviewsTab` in `src/components/venue/venue-detail-client.tsx`.
- Render a review's `images` only when the array is non-empty.
- Sort images by `displayOrder` before rendering.
- Place the images below `reviewText` in a responsive two-column grid that becomes three columns on larger screens.
- Reuse the existing `next/image` review-image pattern from `booking-detail-page.tsx`: square thumbnails, `object-cover`, rounded corners, and a border.
- Use descriptive alternative text containing the reviewer's name.

## Data Flow

`GET /api/Venues/{id}/reviews` already returns `ReviewResponseDto[]`. Each review contains `images: ReviewImageDto[]`, so no API or type changes are required.

## Empty and Error Behavior

- Reviews without images keep their current layout.
- A broken remote image uses the browser/Next.js image failure behavior; no custom retry or fallback is added.

## Verification

- Add one focused test that proves review images are ordered by `displayOrder` and rendered only when present.
- Run the focused test and lint the changed files.
- Open a venue with review images and verify the thumbnails render without console errors.

## Excluded

- Lightbox, carousel, upload, deletion, pagination, and API changes.
