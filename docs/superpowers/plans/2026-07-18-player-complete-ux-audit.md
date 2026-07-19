# Player Complete UX Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every non-auth Player screen functionally complete against the backend report, usable on desktop and mobile, visually consistent with the existing HeroUI design language, and verifiable through tests and fresh screenshots.

**Architecture:** Keep the current Next.js App Router structure and API client boundary. Add only small pure helpers where contract-sensitive behavior needs unit tests (notification routing, local date-time serialization, distance ordering, availability duration choices, list-response normalization). Reuse one Mapbox loader and presentation model across venue discovery and match creation, while keeping page-specific layouts separate. All interactive product controls remain HeroUI v3 and all product icons remain Gravity UI icons.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, HeroUI v3, Gravity UI icons, Mapbox GL JS loaded from the existing public token/style environment variables, Node built-in test runner, Playwright.

**Reference documents:**

- Design spec: `docs/superpowers/specs/2026-07-18-player-complete-ux-audit-design.md`
- Backend contract: `D:/Users/huynpde180519/fpt/SUMMER_26/PRN232/playcount_source/prn232-su26-ai-audit-project-prn232_se18d05_group-01/docs/FE_API_INTEGRATION_REPORT.md`
- Screenshot evidence: `C:/Users/hantu/.codex/visualizations/2026/07/18/019f750f-bd91-7851-b5e9-e6c26a591d04/audit`

## Implementation constraints

- Do not redesign login, registration, session handling, role guards, or token storage.
- Do not touch Owner/Admin behavior, install a new package, or edit `src/app/theme.css`.
- Preserve unrelated dirty-worktree changes, especially Owner files and existing untracked tests.
- Before changing Next.js code, read `node_modules/next/dist/docs/01-app/01-getting-started/04-linking-and-navigating.md`, `05-server-and-client-components.md`, and the relevant testing guide.
- Before changing HeroUI components, load and follow the local `heroui-react` skill; before reshaping visual hierarchy, load `frontend-design` and `ui-ux-pro-max`.
- Use the backend report as the contract authority where current TypeScript types disagree.
- Do not perform real bookings, match joins/invitations, payments, cancellations, or review mutations during visual QA. Use Playwright route fixtures for mutating-flow coverage.

---

### Task 1: Lock contract-sensitive pure behavior with tests

**Files:**

- Modify: `src/lib/utils/flow-navigation.ts`
- Modify: `src/lib/utils/flow-navigation.test.ts`
- Create: `src/lib/utils/player-flow.ts`
- Create: `src/lib/utils/player-flow.test.ts`
- Modify: `src/lib/types/api.ts`

- [ ] **Step 1: Add failing notification route-table tests**

Extend `flow-navigation.test.ts` to assert the complete Player mapping:

```ts
assert.equal(getNotificationHref("player", "Booking", 42), "/bookings/42");
assert.equal(getNotificationHref("player", "Match", 7), "/matches/7");
assert.equal(getNotificationHref("player", "Venue", 3), "/venues/3");
assert.equal(getNotificationHref("player", "Payment", 42), "/player/bookings");
assert.equal(getNotificationHref("player", "Review", 42), null);
assert.equal(getNotificationHref("player", "System", 42), null);
```

- [ ] **Step 2: Add failing tests for date-time, distance, duration, and booking-list behavior**

Create `player-flow.test.ts` covering:

```ts
toLocalIsoWithOffset("2026-07-19", "08:00", 420)
// => "2026-07-19T08:00:00+07:00"

getBookableDurations(slots, 4)
// contiguous Available slots only; honors canStartBooking on the first slot

sortVenuesByDistance(venues, { latitude: 16.0544, longitude: 108.2022 })
// coordinate-bearing venues ordered nearest-first; missing-coordinate items remain stable at the end

appendBookingPage(existing, incoming, 10)
// de-duplicates by id and returns hasMore = incoming.length === 10
```

- [ ] **Step 3: Run the unit tests and confirm failure**

Run: `node --test src/lib/utils/flow-navigation.test.ts src/lib/utils/player-flow.test.ts`

Expected: FAIL because the new helpers and new route cases are not implemented.

- [ ] **Step 4: Implement the minimal helpers and correct DTOs**

In `player-flow.ts`, implement only:

```ts
export function toLocalIsoWithOffset(date: string, time: string, offsetMinutes: number): string;
export function getBookableDurations(slots: VenueAvailabilitySlotDto[], startIndex: number): number[];
export function sortVenuesByDistance<T extends { latitude?: number | null; longitude?: number | null }>(items: T[], origin: Coordinates): T[];
export function appendBookingPage(existing: BookingResponseDto[], incoming: BookingResponseDto[], pageSize: number): { items: BookingResponseDto[]; hasMore: boolean };
```

Correct `api.ts` to match the report:

```ts
export interface MatchCandidateDto {
  profileId: number;
  fullName: string;
  avatarUrl: string | null;
  city: string | null;
  skillLevel: string | null;
  matchScore: number;
}

export interface CreateMatchInvitationDto {
  inviteeProfileId: number;
  message?: string;
}
```

Update `getNotificationHref` with an explicit role/reference table; do not route informational Review/System notifications.

- [ ] **Step 5: Re-run unit tests**

Run: `node --test src/lib/utils/flow-navigation.test.ts src/lib/utils/player-flow.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/utils/flow-navigation.ts src/lib/utils/flow-navigation.test.ts src/lib/utils/player-flow.ts src/lib/utils/player-flow.test.ts src/lib/types/api.ts
git commit -m "fix: align player flow contracts"
```

---

### Task 2: Correct Player navigation and route hierarchy

**Files:**

- Modify: `src/components/layout/player-bottom-nav.tsx`
- Modify: `src/components/layout/site-header.tsx`
- Modify: `src/components/profile/ProfileSummaryCard.tsx`
- Modify: `tests/player-ux.spec.ts`

- [ ] **Step 1: Add failing Playwright assertions for every persistent Player link**

Add mocked-auth navigation coverage that verifies:

- logo -> `/`
- desktop Player items -> `/venues`, `/matches`, `/player/bookings`, `/player/favorites`
- mobile items -> `/venues`, `/matches`, `/player/bookings`, `/player/profile`
- profile quick links -> `/player/bookings`, `/player/matches`, `/player/favorites`
- a child route such as `/venues/4` keeps “Sân bãi” active

- [ ] **Step 2: Run the focused browser test and confirm failure**

Run: `npx playwright test tests/player-ux.spec.ts --grep "player navigation"`

Expected: FAIL on the current `/`, `/bookings`, and `/favorites` mobile/profile targets.

- [ ] **Step 3: Fix route targets and active-state semantics**

Use HeroUI `Button`/navigation components without nesting one interactive control inside another. Keep the desktop header information architecture. Make mobile labels and active states exact, and avoid treating `/` as the venue-list destination.

- [ ] **Step 4: Re-run focused browser test**

Run: `npx playwright test tests/player-ux.spec.ts --grep "player navigation"`

Expected: PASS at desktop and mobile projects/viewports configured in the suite.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/player-bottom-nav.tsx src/components/layout/site-header.tsx src/components/profile/ProfileSummaryCard.tsx tests/player-ux.spec.ts
git commit -m "fix: correct player navigation routes"
```

---

### Task 3: Make home discovery truthful and useful

**Files:**

- Modify: `src/components/landing/discovery-hero.tsx`
- Modify: `src/components/landing/player-discovery-view.tsx`
- Modify: `src/components/landing/personalization-card.tsx`
- Modify: `src/components/landing/location-consent-card.tsx`
- Modify: `src/components/landing/recommended-venues-section.tsx`
- Modify: `src/lib/api/profile.ts`
- Modify: `tests/player-ux.spec.ts`

- [ ] **Step 1: Add failing tests for supported search and personalization**

Fixture the sports, profile-sports, and venue APIs. Assert that:

- the home search exposes visible labels for keyword and sport but no non-functional date field;
- submit navigates to `/venues` with only backend-supported query parameters;
- saving sports calls the existing profile-sports API and then refreshes the personalized state;
- granting location sorts the bounded result set by distance and copy says results are nearest within the loaded set.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `npx playwright test tests/player-ux.spec.ts --grep "home discovery"`

Expected: FAIL because date is currently inert, sport save is TODO, and location does not reorder results.

- [ ] **Step 3: Implement supported discovery behavior**

Remove the date control from the venue search. Keep keyword and sport controls as HeroUI fields with visible `Label`s. On location consent, request browser coordinates, request page 1 with `pageSize=50`, sort that returned set with `sortVenuesByDistance`, and render at most the nearest six. If geolocation fails, preserve normal recommendations and show a retryable inline message.

Wire personalization to the existing `GET/POST/PUT/DELETE /api/users/me/sports` client calls; show pending, success, and actionable error states.

- [ ] **Step 4: Re-run focused tests**

Run: `npx playwright test tests/player-ux.spec.ts --grep "home discovery"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/landing src/lib/api/profile.ts tests/player-ux.spec.ts
git commit -m "fix: complete player home discovery"
```

---

### Task 4: Add a resilient list/map venue discovery mode

**Files:**

- Create: `src/lib/mapbox.ts`
- Create: `src/components/venue/venue-results-map.tsx`
- Modify: `src/components/match/venue-map-picker.tsx`
- Modify: `src/components/venue/venues-page.tsx`
- Modify: `src/components/venue/venue-card.tsx`
- Modify: `src/components/venue/venue-empty-state.tsx`
- Modify: `tests/player-ux.spec.ts`

- [ ] **Step 1: Add failing list/map accessibility and state tests**

Mock Mapbox at the browser boundary and assert:

- list is the default mode;
- a HeroUI segmented/toggle control switches to map;
- desktop map mode keeps list context beside the map;
- mobile map mode shows a full map, selected venue card, and a persistent “Xem danh sách” action;
- map loading, missing-token, load-error, no-coordinate, and retry states have textual fallbacks;
- venue cards omit unsupported rating/price instead of inventing zero values.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx playwright test tests/player-ux.spec.ts --grep "venue list map"`

Expected: FAIL because no venue-results map mode exists.

- [ ] **Step 3: Extract the Mapbox loader and implement the results map**

Move the single-flight script/stylesheet loader from `venue-map-picker.tsx` into `src/lib/mapbox.ts`. Keep the existing environment variables:

```ts
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
NEXT_PUBLIC_MAPBOX_STYLE_URL
```

The map component must render only venues with coordinates, fit bounds when possible, expose selected-venue details as ordinary HTML, and never make the map the only way to choose a venue.

- [ ] **Step 4: Integrate responsive layouts into the existing venue page**

Do not replace filters or pagination. List remains default and canonical. Use a desktop split layout and the mobile full-map/selected-card layout from the spec. Keep one-tap return to the full list.

- [ ] **Step 5: Re-run focused tests**

Run: `npx playwright test tests/player-ux.spec.ts --grep "venue list map"`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/mapbox.ts src/components/venue/venue-results-map.tsx src/components/match/venue-map-picker.tsx src/components/venue/venues-page.tsx src/components/venue/venue-card.tsx src/components/venue/venue-empty-state.tsx tests/player-ux.spec.ts
git commit -m "feat: add accessible venue map discovery"
```

---

### Task 5: Replace manual venue booking input with backend availability

**Files:**

- Modify: `src/components/venue/venue-detail-client.tsx`
- Modify: `src/components/booking/checkout-page.tsx`
- Modify: `tests/player-flow.spec.ts`

- [ ] **Step 1: Add failing availability-flow tests**

Fixture `GET /api/venues/{id}/availability?date=YYYY-MM-DD` with all 48 half-hour blocks. Assert the order:

1. choose sport;
2. choose court;
3. choose date;
4. choose a slot where `canStartBooking=true`;
5. choose one of the contiguous durations returned by `getBookableDurations`;
6. review the summary and continue to checkout.

Also assert that Booked/Held/Maintenance/Closed slots are disabled with visible status text, and duration can be selected without dragging.

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npx playwright test tests/player-flow.spec.ts --grep "venue availability booking"`

Expected: FAIL because venue detail currently uses manual time/duration fields.

- [ ] **Step 3: Implement the availability-driven widget**

Fetch availability after court/date selection, render all relevant slots using HeroUI controls, honor `canStartBooking`, and derive valid duration buttons/select options from contiguous `Available` slots. Show skeleton, closed-day, no-slot, error, and retry states. Keep the summary visible before navigation.

Replace the oversized empty gallery with a compact branded fallback. Keep only an “Mở chỉ đường” external map action on detail. Add bottom padding so the mobile sticky action never covers tabs or content.

- [ ] **Step 4: Handle stale-slot conflicts at checkout**

If availability or booking returns HTTP 409, retain venue/court/date context, explain the conflict, and link back to reselect a slot. Keep the 15-minute hold explanation adjacent to the primary action and give the note field a visible label.

- [ ] **Step 5: Re-run focused test**

Run: `npx playwright test tests/player-flow.spec.ts --grep "venue availability booking|checkout conflict"`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/venue/venue-detail-client.tsx src/components/booking/checkout-page.tsx tests/player-flow.spec.ts
git commit -m "fix: drive booking from venue availability"
```

---

### Task 6: Complete match browse, creation, and Mapbox selection

**Files:**

- Modify: `src/components/match/matches-browse-page.tsx`
- Modify: `src/components/match/player-matches-page.tsx`
- Modify: `src/components/match/create-match-page.tsx`
- Modify: `src/components/match/venue-map-picker.tsx`
- Modify: `tests/venue-picker.spec.ts`
- Modify: `tests/player-flow.spec.ts`

- [ ] **Step 1: Add failing match discovery/create tests**

Assert that browse filters map exactly to `sportId`, `skillLevel`, `location`, `startFrom`, `startTo`, and `includeFull`; “Kèo của tôi” has a clear empty-state CTA; and both standalone and dialog creation use the same form behavior.

For creation, assert:

- visible labels for every field, including description;
- participant count stays within the backend-supported minimum/maximum and cannot be below the host already participating;
- a match without `courtId` requires a non-empty `locationDescription`;
- min skill cannot exceed max skill;
- end must be after start and both must be future times;
- submitted timestamps include `+07:00` in the current Saigon context rather than a timezone-less string;
- Mapbox shows a loader before markers and an error/retry plus textual venue fallback when unavailable;
- a 90/120-minute selection is possible with non-drag HeroUI controls.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npx playwright test tests/venue-picker.spec.ts tests/player-flow.spec.ts --grep "match browse|create match|venue picker"`

Expected: FAIL on timezone, labels, loader/fallback, and non-drag duration.

- [ ] **Step 3: Implement form and map corrections**

Use `toLocalIsoWithOffset` for `startAt` and `endAt`. Use the shared `loadMapbox` helper; center/focus from available venue bounds or user location rather than a fixed Da Nang-only assumption. Keep venue/court/slot selection usable as HTML cards and controls if the map cannot load.

Do not duplicate creation logic: keep `CreateMatchContent` as the shared form body for page and dialog.

- [ ] **Step 4: Re-run focused tests**

Run: `npx playwright test tests/venue-picker.spec.ts tests/player-flow.spec.ts --grep "match browse|create match|venue picker"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/match src/lib/mapbox.ts tests/venue-picker.spec.ts tests/player-flow.spec.ts
git commit -m "fix: complete match discovery and creation"
```

---

### Task 7: Add match candidates and correct invitations

**Files:**

- Modify: `src/lib/api/matches.ts`
- Modify: `src/components/match/match-detail-page.tsx`
- Modify: `tests/player-flow.spec.ts`

- [ ] **Step 1: Add failing API/UI assertions**

For a hosted match, fixture `GET /api/matches/{id}/candidates?limit=20` and assert candidate cards show name, city, skill, match score, and invite action. Intercept invitation POST and require:

```json
{
  "inviteeProfileId": 20,
  "message": "Mời bạn tham gia kèo này"
}
```

Assert destructive host actions and join-request decisions use HeroUI confirmation modals and surface backend errors.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx playwright test tests/player-flow.spec.ts --grep "match candidates"`

Expected: FAIL because candidates are absent and invitation currently sends `inviteeId`.

- [ ] **Step 3: Implement API methods and host panel**

Add:

```ts
getMatchCandidates(matchId: number, limit = 20): Promise<MatchCandidateDto[]>
invitePlayer(matchId: number, body: CreateMatchInvitationDto): Promise<void>
```

Only fetch/render candidates for the host. Disable the invited candidate while pending, show success feedback, and keep retryable error state. Preserve current participant and join-request panels.

- [ ] **Step 4: Re-run focused test**

Run: `npx playwright test tests/player-flow.spec.ts --grep "match candidates"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api/matches.ts src/components/match/match-detail-page.tsx tests/player-flow.spec.ts
git commit -m "feat: complete match host invitations"
```

---

### Task 8: Fix booking history and complete review images

**Files:**

- Modify: `src/lib/api/bookings.ts`
- Modify: `src/lib/api/reviews.ts`
- Reuse: `src/lib/api/upload.ts`
- Modify: `src/components/booking/player-bookings-page.tsx`
- Modify: `src/components/booking/booking-detail-page.tsx`
- Modify: `src/components/booking/checkout-page.tsx`
- Modify: `tests/player-flow.spec.ts`

- [ ] **Step 1: Add failing booking-list tests**

Fixture `/api/bookings/me?page=1&pageSize=10` as `ApiResponse<List<BookingResponseDto>>`, not `PagedResponse`. Assert “Xem thêm” appears only when a full page is returned, page 2 appends without duplicate IDs, and a short page ends loading.

- [ ] **Step 2: Add failing review-image tests**

Assert the completed-booking review modal:

- accepts validated local image files and shows removable local previews before submit;
- uploads accepted files through `uploadFile(file, "reviews")` and obtains public URLs;
- creates the review first;
- calls `POST /api/reviews/{reviewId}/images` with the uploaded public URLs;
- reloads `GET /api/reviews/my` and renders the persisted `images` collection;
- deletes through `DELETE /api/reviews/{reviewId}/images/{imageId}` only after HeroUI confirmation;
- shows partial failure without hiding already-persisted images.

- [ ] **Step 3: Add failing booking-detail lifecycle tests**

Fixture Pending, Confirmed, Completed, Cancelled, and Expired bookings. Assert:

- Pending derives the 15-minute hold deadline from `createdAt`, renders the remaining time as accessible text, and disables payment when the deadline has passed;
- an Expired booking never offers payment retry and instead offers a clear path back to venue availability to create a new booking;
- cancelling uses a HeroUI confirmation modal with an optional reason field and posts that reason to `PATCH /api/bookings/{id}/cancel`;
- pay and cancel errors remain visible beside their actions and can be retried;
- successful payment initiation leaves the app only after a valid checkout URL is returned.

- [ ] **Step 4: Run focused tests and confirm failure**

Run: `npx playwright test tests/player-flow.spec.ts --grep "booking history|booking detail lifecycle|review images"`

Expected: FAIL because booking list expects pagination metadata, detail actions omit lifecycle/error behavior, and review image endpoints are not wired.

- [ ] **Step 5: Correct API clients**

Use `apiFetch<BookingResponseDto[]>` for `/Bookings/me` and return the list. Add:

```ts
addReviewImage(reviewId: number, body: AddReviewImageRequestDto): Promise<ReviewImageDto>
deleteReviewImage(reviewId: number, imageId: number): Promise<void>
```

- [ ] **Step 6: Implement load-more, booking lifecycle, and persisted review gallery**

Use `appendBookingPage`; keep each status tab’s page/items/hasMore state coherent. Derive the hold deadline as `new Date(createdAt).getTime() + 15 * 60_000`, update its textual countdown without treating the client timer as contract authority, and refresh the booking when the displayed deadline elapses. Never retry payment for Expired status. Send the optional cancellation reason through the existing cancel API and keep pay/cancel errors local to their action panel.

In review UI, reuse `validateImageFile` and `uploadFile` from `src/lib/api/upload.ts`, distinguish local `File` previews from persisted `ReviewImageDto`s, revoke object URLs on removal/unmount, and prevent duplicate submission while uploads are pending. All fields need visible labels, and all action failures need inline or toast feedback.

- [ ] **Step 7: Re-run focused tests**

Run: `npx playwright test tests/player-flow.spec.ts --grep "booking history|booking detail lifecycle|review images"`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/api/bookings.ts src/lib/api/reviews.ts src/components/booking/player-bookings-page.tsx src/components/booking/booking-detail-page.tsx src/components/booking/checkout-page.tsx tests/player-flow.spec.ts
git commit -m "fix: complete booking history and reviews"
```

---

### Task 9: Repair notifications and keep unread state fresh

**Files:**

- Modify: `src/app/player/notifications/page.tsx`
- Modify: `src/components/layout/notification-dropdown.tsx`
- Modify: `tests/player-ux.spec.ts`

- [ ] **Step 1: Add failing notification tests**

Assert on mobile and desktop:

- notification rows contain no nested interactive elements;
- delete is a separate HeroUI icon button with an accessible name and at least the WCAG target size;
- Booking/Match/Venue/Payment use the route table;
- Review/System are informational and do not pretend to navigate;
- unread polling occurs every 60 seconds while visible and refreshes immediately on `visibilitychange` back to visible;
- mark-read/delete failures restore coherent UI and display a retry path.

- [ ] **Step 2: Run focused test and confirm failure**

Run: `npx playwright test tests/player-ux.spec.ts --grep "notifications"`

Expected: FAIL on current nested-button mobile layout, routing, and absent polling.

- [ ] **Step 3: Rebuild the row interaction boundary**

Use a non-interactive layout container. If the notification has a route, make only its content area a single link/pressable target; keep the delete button as a sibling. Use the shared route helper in both page and dropdown. Add an abort/cleanup-safe 60-second timer and visibility listener; do not poll while the document is hidden.

- [ ] **Step 4: Re-run focused test**

Run: `npx playwright test tests/player-ux.spec.ts --grep "notifications"`

Expected: PASS at mobile and desktop sizes.

- [ ] **Step 5: Commit**

```bash
git add src/app/player/notifications/page.tsx src/components/layout/notification-dropdown.tsx tests/player-ux.spec.ts
git commit -m "fix: repair player notifications"
```

---

### Task 10: Finish profile, favorites, and payment recovery states

**Files:**

- Modify: `src/components/profile/ProfilePageShell.tsx`
- Modify: `src/components/profile/PlayerSportsPanel.tsx`
- Modify: `src/app/player/favorites/page.tsx`
- Modify: `src/components/payment/payment-return-page.tsx`
- Modify: `src/components/payment/payment-cancel-page.tsx`
- Modify: `tests/player-ux.spec.ts`

- [ ] **Step 1: Add failing profile/payment UX tests**

Assert:

- deleting a favorite sport uses a HeroUI confirmation modal, never native `window.confirm`;
- the security tab has a real “Đổi mật khẩu” CTA to `/player/settings`, without changing that screen or auth logic;
- favorite removal has pending/error feedback and retains the card on failure;
- invalid/cancelled payment states explain what happened, link to the booking list/detail when known, and any countdown has an accessible textual value and cancel/return action.

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `npx playwright test tests/player-ux.spec.ts --grep "profile|favorites|payment recovery"`

Expected: FAIL on native confirmation, placeholder security content, and incomplete recovery actions.

- [ ] **Step 3: Implement minimal recovery-focused UI**

Reuse existing cards, modals, status labels, and Gravity icons. Do not create or alter the existing password form/API; route the CTA to `/player/settings`. Keep server errors visible and actions retryable.

- [ ] **Step 4: Re-run focused tests**

Run: `npx playwright test tests/player-ux.spec.ts --grep "profile|favorites|payment recovery"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/profile src/app/player/favorites/page.tsx src/components/payment tests/player-ux.spec.ts
git commit -m "fix: complete player recovery states"
```

---

### Task 11: Full regression, accessibility pass, and screenshot audit

**Files:**

- Modify as needed: Player files changed in Tasks 1-10 only
- Create: `docs/superpowers/reports/2026-07-18-player-complete-ux-audit.md`
- Create screenshots under: `C:/Users/hantu/.codex/visualizations/2026/07/18/019f750f-bd91-7851-b5e9-e6c26a591d04/player-final`

- [ ] **Step 1: Run all unit tests**

Run: `node --test src/**/*.test.ts`

Expected: PASS with zero failures.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit 0. Fix only errors introduced or encountered in the Player scope; report unrelated pre-existing errors separately.

- [ ] **Step 3: Run Player Playwright suites**

Run: `npx playwright test tests/player-ux.spec.ts tests/player-flow.spec.ts tests/venue-picker.spec.ts`

Expected: PASS. Mutating endpoints must remain mocked.

- [ ] **Step 4: Run a production build**

Run: `npm run build`

Expected: exit 0 with no TypeScript or Next.js build errors.

- [ ] **Step 5: Preview every Player-accessible screen at desktop and mobile widths**

Use the local preview with the supplied Player account. Capture at minimum:

- `/`
- `/venues` list and map modes
- `/venues/{id}` including availability and empty/error states
- `/matches`, `/player/matches`, `/matches/create`, `/matches/{id}`
- `/player/bookings`, `/bookings/{id}`, `/bookings/checkout`
- `/player/favorites`, `/player/notifications`, `/player/profile`, `/player/settings`
- `/payments/return`, `/payments/cancel`
- create-match dialog and Mapbox fallback/loading states

Check 360px mobile and a desktop width. Verify no horizontal overflow, sticky overlap, nested controls, inaccessible unlabeled inputs, invented data, or dead-end error states.

- [ ] **Step 6: Write the final audit report**

For every screen, record:

- before finding and screenshot filename;
- UX principle/source applied;
- backend endpoint/state covered;
- code change;
- test/screenshot verification;
- any backend limitation still preventing a truthful UI.

Use these research sources near the claims they support:

- Nielsen Norman Group, Ten Usability Heuristics: `https://www.nngroup.com/articles/ten-usability-heuristics/`
- Baymard, Product Listing Information: `https://baymard.com/blog/product-listing-information`
- Baymard, Travel UX Best Practices: `https://baymard.com/blog/travel-site-ux-best-practices`
- W3C WAI, Form Labels: `https://www.w3.org/WAI/tutorials/forms/labels/`
- WCAG 2.2 Target Size: `https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum`
- WCAG 2.2 Dragging Movements: `https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html`

- [ ] **Step 7: Review the final diff for scope and user changes**

Run: `git status --short` and `git diff --check`

Confirm Owner/Admin/user-auth code and pre-existing unrelated changes were not staged or overwritten.

- [ ] **Step 8: Commit the verified audit artifacts**

```bash
git add docs/superpowers/reports/2026-07-18-player-complete-ux-audit.md
git commit -m "docs: report completed player UX audit"
```

## Completion criteria

- Every Player-accessible non-auth route has a verified desktop and mobile state.
- All UI-visible backend capabilities in the report are present: availability selection, booking history, review images, candidate invitations, notifications, profile sports, discovery, and payment recovery.
- No Player route points at the wrong hierarchy.
- Mapbox works where spatial comparison helps, while every task has a textual/non-map path.
- All product controls are HeroUI v3; icons are Gravity UI; no nested interactive controls remain.
- Unit tests, focused Playwright suites, lint, and build pass, or unrelated pre-existing failures are explicitly evidenced.
- No real external mutation was performed during screenshot QA.
