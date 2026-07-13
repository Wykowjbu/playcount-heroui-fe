# Player UX/UI refresh

## Goal

Complete player-facing auth, discovery, venue listing, and venue detail flows using HeroUI v3 compound components and Gravity Icons only. Preserve every token in `theme.css`.

## Scope

### Auth

- Keep form visible while client state initializes; use HeroUI skeleton/error feedback if unavailable.
- Use 48px HeroUI fields and primary buttons, password visibility toggle, inline validation, loading labels, and return-to URL after sign-in.
- OTP supports numeric entry, paste, `autocomplete="one-time-code"`, resend countdown, loading, success, and error states.

### Discovery

- Make search location, sport, and date explicit; date respects Vietnamese locale and blocks past dates.
- Keep compact, keyboard-accessible quick filters and clear loading/empty cards.

### Venue listing

- Desktop has one sidebar filter system only. Mobile/tablet uses one HeroUI Drawer filter system only.
- Add applied filters, result count, sort, responsive cards, empty state, and URL-backed query state.

### Venue detail

- Preserve gallery + desktop sticky booking card + mobile booking Drawer.
- Hide internal approval status; show opening state. Render no-review copy rather than 0.0 ratings.
- Ensure booking CTA explains incomplete selection.

## Constraints

- HeroUI v3 only for UI controls; composition follows current v3 APIs.
- `@gravity-ui/icons` only for icons.
- Never change values in `theme.css`; use its CSS variables only.
- No new dependencies, redesign system, or backend/API contract changes.
- Preserve unrelated working-tree edits. `venue-detail-client.tsx` is an existing user edit; edit only with explicit user approval.

## Implementation shape

- Reuse existing app routes and current components. No new shared design-system abstraction.
- Keep interactive behavior in existing client components; server route boundaries remain unchanged.
- Add small focused tests only for non-trivial filter/query or auth redirect logic; run lint/build and relevant Playwright coverage.

## Acceptance checks

- Auth submits with valid input, gives clear failure/loading/success feedback, and keeps return URL.
- Venue filters are never duplicated at a breakpoint and results update with visible applied state.
- Detail page never exposes internal approval; booking form has clear disabled guidance.
- All changed controls are HeroUI; icons are Gravity; `theme.css` stays byte-for-byte unchanged.
