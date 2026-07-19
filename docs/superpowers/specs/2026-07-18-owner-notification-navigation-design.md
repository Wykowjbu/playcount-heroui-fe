# Owner notification navigation design

## Goal

Clicking an Owner notification must mark it read and take the Owner to the related record without leaving the Owner workspace. A Booking notification opens the existing booking drawer for the referenced booking.

## Decision

Use role-aware notification URLs. Routing reads `referenceType`, never the broader notification `type`, and only accepts a positive integer reference:

- Owner + `Booking` + valid `referenceId` -> `/owner/bookings?bookingId={referenceId}`.
- Owner + `Venue` + valid `referenceId` -> `/owner/venues/{referenceId}`.
- Player routes keep their current detail destinations.
- Admin, guest, and unknown roles do not inherit Player destinations.
- Unknown or incomplete references remain non-navigating; the notification can still be marked read.

The notification action uses Next navigation `push`. The Owner bookings page reads and validates `bookingId` inside the production-safe `Suspense` boundary required by Next.js 16, requests the record independently of the venue-filtered list through `getBookingById`, and opens its existing HeroUI v3 `Drawer`. Closing uses `replace`, removes only `bookingId`, and preserves other query parameters. Refresh and browser Back/Forward re-read the URL: a valid changed ID loads/switches the drawer, and a removed/invalid ID clears it. The effect ignores stale responses when the URL changes during a request.

## UX layout

The notification popover remains a compact chronological preview, not a second detail screen. Each item shows unread state, title, two-line content, and a semantic `<time dateTime>` value. The HeroUI v3 menu uses its section/header anatomy and a clear “mark all read” action. Keyboard activation follows the same route, and closing/navigation returns focus through the library's accessible popover behavior. Booking details stay in the existing Owner drawer, where the Owner already has the relevant status, customer, venue/court, time, payment, and workflow actions.

This follows the common notification-center pattern: messages are concise and the single action takes users to the related flow where they can resolve it. No modal is added because the notification is not blocking or critical.

## Data and errors

The FE fields already match the BE notification DTO: `type`, `referenceType`, `referenceId`, `isRead`, and `createdAt`. Polling remains at 60 seconds, within the BE report's recommended 30–60 second interval.

Mark-read is attempted in `try/catch`; navigation runs afterward even on failure so a transient notification API error does not block the Owner's task, and local unread state changes only after success. Initial-load and mark-all failures render concise accessible feedback without crashing or falsely updating local state.

Malformed `bookingId` values are ignored and removed on close. A booking `404`/`403` produces a concise page alert and no empty drawer; retrying a changed valid URL clears that error. Stale requests cannot replace a newer selected booking.

## Implementation scope

- Extend the existing notification href helper with role-aware Owner routes.
- Pass the signed-in role from the shared notification dropdown.
- Let the Owner bookings page open its existing drawer from `bookingId`.
- Improve the shared dropdown hierarchy using only installed HeroUI v3 and Gravity Icons.
- Add focused tests for route mapping and the Owner notification-to-drawer flow.

No new page, state store, notification abstraction, or dependency is introduced.

## Alternatives rejected

1. Keep `/bookings/{id}` for Owner: smallest code change, but it leaves the Owner shell and currently links back to `/player/bookings`.
2. Build `/owner/bookings/{id}`: clean URL, but duplicates the complete booking drawer and its workflow logic.
3. Selected: query-driven existing drawer. It preserves context and reuses the already working Owner surface with the smallest root-cause change.

## Verification

- Unit test role-aware URL mapping, invalid references, and Player regression cases.
- Browser test a mocked unread Owner Booking notification: mouse and keyboard activation, failed/successful read, assert `/owner/bookings?bookingId=...`, drawer heading, and read request.
- Test malformed, missing, and unauthorized bookings plus close, Back/Forward, refresh, and query-parameter preservation.
- Run focused tests, lint, production build, and capture full-screen desktop screenshots before and after.
