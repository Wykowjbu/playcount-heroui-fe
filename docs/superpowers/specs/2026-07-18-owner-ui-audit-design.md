# PlayCourt Owner UI Audit Design

## Goal

Turn the Owner area into a compact operational workspace that lets court owners scan venues, bookings, reviews, and configuration quickly. Keep the current backend contract and routes. All interactive UI uses HeroUI v3; all icons use `@gravity-ui/icons`.

This design adopts the detailed requirements in `docs/PLAYCOURT_OWNER_UIUX_REDESIGN_CODEX_PROMPT.md`, with the audited decisions below taking precedence where the existing implementation or backend makes a smaller, clearer solution possible.

## Constraints

- Preserve the existing Next.js App Router structure, API client, semantic tokens, and authentication guards.
- Do not add packages, endpoints, fields, fake metrics, or unsupported actions.
- Reuse existing Owner UI helpers and shared status/formatting utilities instead of creating a second design system.
- Use native elements only for document structure and Next.js image/link behavior. Use HeroUI for controls, feedback, forms, overlays, tables, tabs, cards, chips, avatars, and empty/loading states.
- Do not wrap a HeroUI `Table` in a decorative outer `Card`.
- Keep the real notification dropdown. Remove or correct only controls with broken or unsupported behavior.

## Shell and Profile

Keep the current collapsible Owner sidebar and sticky top bar. Localize the sidebar-toggle label and retain the real notification and account controls.

Render `/owner/profile` inside `OwnerGuard` and `OwnerShell` so every Owner screen has one authorization and navigation model. Keep personal and read-only business information. Hide the placeholder security tab only when `role="owner"` because no working Owner password flow exists. Correct Owner quick links to `/owner/venues` and `/owner/bookings`; omit the unsupported revenue link. Shared profile components must preserve the Player profile tabs, routes, and behavior.

## Overview

Keep the four real operational metrics: total venues, total courts, today's bookings, and pending bookings for the selected venue. Render them as compact, left-aligned HeroUI cards without fixed or inflated height. When only one venue exists, explain the pending count using that venue's name rather than referring to a hidden selector.

Below the metrics, show pending bookings and owned venues in a desktop 8/4 layout and stack them on narrow screens. Limit each preview list and provide one clear route to the full page. Avoid duplicate quick-action cards.

## Venues

Use a direct HeroUI table on desktop for venue, status, creation date, and actions. Keep the existing compact mobile representation where needed. Fix the venue action menu to follow the installed HeroUI v3 trigger API so it never renders nested buttons. Destructive actions use a HeroUI `AlertDialog` outside menu-item button nesting.

The venue detail keeps its existing tabs: overview, courts, opening hours, amenities, images, and staff. Court-specific pricing and closure schedules remain on the court detail route because their APIs and current navigation are court-scoped.

- Overview: keep factual venue data and a short completion checklist.
- Courts: direct HeroUI table with explicit actions and correct status labels.
- Opening hours: preserve the seven-day editor, reduce excess height, show all day names, disable time fields for closed days, and surface validation near the fields.
- Amenities: HeroUI checkboxes backed by the system amenity list.
- Images and staff: keep one primary add action; do not repeat it in both the section header and empty state.

Create/edit venue forms and the create-court form remain dedicated routes. Court editing remains in the existing `info` tab of `/owner/venues/{venueId}/courts/{courtId}`; do not add a new route. These surfaces use HeroUI forms and plain-language guidance. Replace backend-oriented copy such as “Backend cung cấp” with user-facing permission explanations.

## Court Pricing and Closure Schedule

Keep the existing court detail tabs, but replace always-expanded creation forms with a single section action that opens a HeroUI modal.

Pricing rules use a direct HeroUI table on desktop and compact cards on small screens. Display localized weekday names instead of raw numeric values, format money as VND, and keep edit/delete actions with confirmation for delete.

Closure schedules use the same pattern: existing records first, one add action, HeroUI modal for creation, and a focused empty state when there are no records. Add a breadcrumb or back action so users retain venue/court context.

## Bookings

Keep venue, status, and supported date filters in a compact HeroUI filter surface. Search remains client-side only for the loaded page. The direct HeroUI table shows customer, court, time, total, status, and one detail action.

The existing HeroUI drawer remains the detail surface. When it opens, fetch `GET /api/Payments/bookings/{bookingId}` and give payment details their own loading, error, and unavailable states. Use Vietnamese operational copy and never imply that every pending booking was paid. Expose only status-valid actions; show “Đánh dấu hoàn thành” only for a confirmed booking whose `endAt` is not later than the current time. Confirmation, rejection, and completion failures must remain visible in the drawer through HeroUI feedback; rejection requires a reason.

## Reviews

Owner reviews remain read-only. Keep the venue selector and present the average, total, and rating distribution in one compact HeroUI summary card. Use an accessible visual distribution rather than five raw text lines. Review items use HeroUI cards and avatars. Empty states stay compact and contextual.

## Feedback, Accessibility, and Responsive Behavior

- Every icon-only control has a Vietnamese accessible name and a usable touch target.
- HeroUI tables define row headers and stable row IDs.
- Loading uses HeroUI skeletons; failures use HeroUI alerts with retry where useful; empty states replace the missing content and present at most one primary action.
- Status is always expressed by text, not color alone.
- Remove the current nested-button hydration error and missing accessible-name warnings caused by Owner pages.
- Preserve keyboard access, visible focus, and responsive tab/table behavior.

## Verification

- Add the smallest focused tests for new weekday mapping or other non-trivial view logic.
- Run targeted tests and TypeScript/ESLint checks for changed Owner files.
- Run the production build and distinguish pre-existing repository failures from regressions.
- Log in as `owner01@gmail.com`, preview every Owner route and tab at desktop and narrow width, and confirm no Owner-caused runtime or accessibility issue remains.
- Recheck the Player profile after changing shared profile components and confirm its tabs, routes, and behavior are unchanged.
