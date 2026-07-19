# Player Complete UX Audit Design

## Goal

Make every Player-facing screen complete, consistent, and usable against the backend contract in `FE_API_INTEGRATION_REPORT.md`, while preserving the current PlayCourt visual language. All interactive controls use HeroUI v3, all product icons use Gravity Icons, and Mapbox remains the existing map renderer.

## Evidence and design basis

The design follows a real preview audit at 1440×1000 and 390×844. Audit captures cover home, venue discovery and detail, match discovery and management, booking and payment, favorites, notifications, profile, settings, and Mapbox selection states.

The governing backend contract is the untracked sibling-repository file at `D:/Users/huynpde180519/fpt/SUMMER_26/PRN232/playcount_source/prn232-su26-ai-audit-project-prn232_se18d05_group-01/docs/FE_API_INTEGRATION_REPORT.md`, audited with SHA-256 `8481F2C7AD07D1394FB44527798AEF44B2E0C82147F5A86510AAD3B2AA50F5F4`. The sibling repository was at commit `e3591a0ede5581e20fcd71f117077b84c6764032`; the report itself was untracked, so its content hash, not that commit, pins the reviewed contract.

Decisions are grounded in:

- Nielsen Norman Group usability heuristics: visible system status, consistency, error prevention, recognition over recall, and actionable error recovery.
- Baymard findings for scannable result cards, prominent booking search, useful filtering, and list/map discovery.
- WCAG 2.2 guidance for labeled inputs, visible focus, target size, focus not obscured, and a click/tap alternative to dragging.

## Scope

### Included

- Player navigation and route consistency.
- Player home personalization, truthful location behavior, and discovery search.
- Venue results with list/map switching and location-aware presentation.
- Venue detail availability selection using backend 30-minute slots and `canStartBooking`.
- Booking checkout, history, detail, cancel, payment-return, and payment-cancel presentation.
- Match browse, create, detail, hosted/joined/invited management, candidate discovery, and invitations.
- Favorites, notifications, profile, sports preferences, and security navigation UI.
- Review creation with optional image upload/removal supported by the backend.
- Desktop and mobile responsive behavior and accessibility.

### Excluded

- Authentication, token/session, registration, password-reset, and authorization-guard redesign.
- Owner and Admin screens.
- Backend contract or database changes.
- A new design system, map provider, icon library, or UI dependency.
- Changes to values in `theme.css`.

The existing change-password endpoint and screen remain functional, but this work only fixes how Player UI links to that screen.

## Product structure and navigation

Keep the existing floating `SiteHeader` on desktop and `PlayerBottomNav` on mobile.

- Desktop primary destinations remain Sân bãi, Kèo đấu, Lịch đặt, and Yêu thích.
- The account menu gains a correct route to Kèo của tôi in addition to profile, bookings, favorites, and settings.
- Mobile destinations are Sân bãi (`/venues`), Kèo đấu (`/matches`), Lịch đặt (`/player/bookings`), and Tôi (`/player/profile`). The home logo remains the route to `/`.
- Active state matches nested routes.
- Every page that renders the mobile bottom bar reserves bottom safe-area space so content and keyboard focus are not obscured.
- Profile shortcuts use `/player/bookings`, `/player/matches`, and `/player/favorites`.

## Screen designs

### 1. Player home

- Retain the blue discovery hero and venue-first hierarchy.
- Show visible labels for location and sport. Remove the date control because the backend cannot search availability across venues by date; date selection begins after choosing a venue.
- Sport chips select a real sport ID and submit the same query as the sport field.
- Saving personalization calls the existing Player sports API rather than changing local state only.
- Location consent affects a bounded discovery set: fetch only page 1 with `pageSize=50`, calculate client-side distance for venues in that response, sort that response, and display its nearest six. Copy says “Gợi ý gần vị trí của bạn” rather than claiming these are the globally nearest venues. No additional pages are fetched. Without coordinates, label the section as popular rather than nearby.
- Loading, empty, and failed recommendation states remain distinct.

### 2. Venue discovery

- Keep URL-backed keyword, sport, open-now, and page filters.
- Add a HeroUI segmented list/map view control. List remains the default because it is more scannable and accessible; map is an optional spatial view.
- Desktop map view uses a split result list and map. Mobile map view uses a full map with a selected-venue card that remains above the bottom navigation. A persistent HeroUI “Xem danh sách” control switches back to the complete textual list; the list/map segmented control remains reachable at the top. The map does not attempt to display the full textual list simultaneously.
- Selecting a card highlights and centers its marker; selecting a marker reveals the corresponding card. A textual result list always remains available.
- Map loading uses a Skeleton and map errors use a HeroUI Alert with retry. The map initially centers on current coordinates when available, otherwise the coordinates of the returned venues, then the current Da Nang fallback.
- Cards show only supported data: image or compact fallback, name, address, opening state, hours, amenities, distance when known, and sport information when present. Rating or price is never invented as `0` when the list API does not provide it.

### 3. Venue detail and slot selection

- Replace the oversized empty gallery with a compact HeroUI fallback when no image exists.
- Add one “Mở chỉ đường” action using the venue coordinates. Do not add a second embedded map to venue detail because venue discovery already supplies the spatial view.
- The booking flow is ordered: sport → court → date → available start slot → duration → summary.
- After court and date selection, call `GET /venues/{id}/availability` and render the returned 30-minute slots. A start slot is enabled only when `status` is `Available` and `canStartBooking` is true.
- Selecting a start slot defaults to 60 minutes. A HeroUI duration selector exposes every contiguous available duration; drag selection may remain as an accelerator but is never required.
- The summary shows start, end, duration, and estimated price before checkout.
- Mobile uses one sticky booking action that opens or focuses the booking panel and never covers tabs or content.
- A conflict response (`409`) explains that another player took the slot and offers a direct reload of availability.

### 4. Match browse and Player match management

- Browse filters expose sport, skill, time window, and include-full where supported by `GET /matches`.
- Empty results distinguish no matches in the system from filters producing no matches. Filtered empty states include Clear filters.
- Add a visible Kèo của tôi action leading to `/player/matches`.
- Hosted, joined, and invitation tabs keep their current route and states.

### 5. Create match and Mapbox venue picker

- The page and in-place dialog continue to reuse `CreateMatchPage`; they must present the same fields and validation.
- Every field has a visible label, including description.
- Validate end after start, minimum skill not above maximum skill, participant count, and required location before submit.
- Convert local date/time values into a full ISO 8601 instant with timezone information before calling the API.
- The venue picker keeps the current Mapbox integration and API-backed availability panel.
- Add a visible loading state until style tiles and markers are ready, a retryable failure state, and a textual venue option for users who cannot use the map.
- Slot duration is adjustable with HeroUI controls; dragging across slots remains optional.

### 6. Match detail

- Preserve host, participant, join-request, cancel-request, leave, and host approval actions.
- Localize known API failures and present a recovery action instead of raw English backend text.
- Host view calls `GET /matches/{id}/candidates`, shows candidate name, city, skill, and match score, and sends an invitation with optional message.
- Invitation request uses `inviteeProfileId`, not `inviteeId`.
- Cancel match and leave match require a HeroUI confirmation dialog. Request-to-join actions show pending feedback and errors rather than failing silently.

### 7. Booking checkout, history, and detail

- Checkout keeps the existing summary and price hierarchy. The optional note receives a visible label.
- Explain that the newly created booking is held for 15 minutes while payment is pending.
- Booking history uses the backend's actual `ApiResponse<List>` behavior. Load the first page and expose Xem thêm while a full page is returned instead of relying on unavailable total-page metadata.
- Cancel uses a HeroUI confirmation dialog with an optional reason. Pay and cancel failures appear in context.
- Booking detail keeps its current information hierarchy. Pending payment shows the hold deadline when it can be derived from `createdAt`, retry payment, and cancel actions. Expired bookings do not offer retry payment.
- Completed bookings allow one review. The review modal supports pending local images that can be removed before submission. On submit, upload through the existing frontend upload route, create the review, then call the review-image endpoint for each uploaded URL. After creation, booking detail uses `GET /reviews/my` to show that review and its persisted image gallery; each persisted image has a labeled HeroUI delete action that calls `DELETE /reviews/{id}/images/{imageId}` and updates the gallery only after success.

### 8. Payment result screens

- Preserve the current success, cancellation, and error card pattern.
- Payment cancellation shows the remaining hold time or avoids claiming the booking is still held when that cannot be established.
- Payment return maps known sync failures into Vietnamese and provides the most specific recovery action: booking detail, booking list, or venue discovery.
- No polling or automatic mutation is added beyond the existing PayOS sync flow.

### 9. Favorites

- Keep the existing empty state and venue cards.
- Fix every entry route to `/player/favorites`.
- Removal remains reversible in presentation until the API succeeds; failures restore the card and show an Alert.

### 10. Notifications

- Replace the invalid Button-inside-Button item with a HeroUI Card or list row containing one primary notification action and a separate labeled delete Button.
- Rows wrap and clamp correctly at 390px without horizontal overflow.
- Reference behavior is explicit: Booking opens `/bookings/{referenceId}`, Match opens `/matches/{referenceId}`, Venue opens `/venues/{referenceId}`, and Payment opens `/player/bookings` because the contract does not guarantee that `referenceId` is a booking ID. Review and System notifications are informational rows with no navigation styling. All types can still be marked read and deleted.
- Poll unread count every 60 seconds while the signed-in Player shell is mounted and refresh when the page becomes visible. The full page keeps manual read-all and delete actions.
- Read, delete, and read-all failures are visible instead of silent.

### 11. Profile, sports, and settings navigation

- Keep personal profile editing and avatar upload behavior.
- Keep Player sports add/edit/delete behavior, but replace native `confirm()` with a HeroUI confirmation modal.
- Mobile tabs remain readable using a compact label or horizontal scroll without clipping.
- The security tab contains a clear HeroUI action to `/player/settings`; it does not duplicate or alter authentication logic.

## API correctness changes

- Match invitation request: `{ inviteeProfileId, message? }`.
- Add Player match candidate response type and client call.
- Add review image create/delete request types and client calls.
- Treat Player booking lists as non-paged response data and implement incremental load based on returned item count.
- Ensure created match timestamps include an offset or are converted to ISO UTC.
- Use venue availability `status`, `canStartBooking`, `estimatedPrice`, and venue opening bounds directly.
- Do not send unsupported date, latitude, longitude, sort, or price filters to `GET /venues`.

## Component and visual constraints

- HeroUI v3 components provide all forms, buttons, cards, tabs, chips, alerts, drawers, modals, skeletons, pagination/load-more controls, and segmented controls.
- Gravity Icons provide all application icons.
- Mapbox is limited to rendering the spatial canvas, controls supplied by Mapbox, and accessible marker elements required by Mapbox.
- Existing CSS variables and visual tone remain. No `theme.css` token changes.
- No speculative shared design-system layer. Reuse existing components and extract only map/availability behavior that is used in more than one screen.

## Error handling

- Loading, empty, error, and success are separate states.
- Known backend errors are mapped to plain Vietnamese close to the initiating control.
- Destructive or financially meaningful actions require confirmation and never fail silently.
- Network errors keep the user's current inputs and expose retry.
- No optimistic removal is finalized until the API succeeds.

## Verification

- Add focused unit tests for route tables, booking list normalization/load-more behavior, match invitation payload, timezone conversion, distance ordering, and slot-duration calculation.
- Add Playwright checks for mobile navigation, notification layout, venue list/map switching, non-drag slot selection, profile shortcuts, candidate invitation, and checkout conflict recovery using routed API fixtures.
- Run lint, unit tests, Playwright tests, and production build.
- Log in with the supplied Player account and re-capture every audited desktop and mobile screen after implementation. Payment return is inspected without triggering an unsafe real payment mutation.

## Acceptance criteria

- No Player navigation link resolves to a nonexistent or wrong route.
- No audited 390px screen horizontally overflows or has content obscured by fixed navigation.
- Venue booking uses backend availability blocks and prevents invalid starts before checkout.
- Mapbox loads with visible progress, has a textual fallback, and appears in venue discovery as well as match creation.
- Player match candidates can be invited with the documented payload.
- Review images can be added and removed through documented endpoints.
- Notifications remain readable, reachable, and actionable on mobile, with 60-second unread refresh.
- Unsupported or nonfunctional controls are removed rather than presented as working features.
- All changed controls are HeroUI v3, all product icons are Gravity Icons, and `theme.css` remains unchanged.
- Auth/session behavior and Owner/Admin screens remain untouched.
