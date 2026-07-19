# Owner Dashboard Layout Design

## Goal

Correct the visual alignment and density of `/owner` without changing its data flow, routes, or available actions. This focused design follows the Overview section of `2026-07-18-owner-ui-audit-design.md`.

## Layout

- Keep the page title and description left-aligned and the create-venue action at the upper right.
- Keep four compact metric cards in a responsive 1/2/4-column grid. Their icon, label, value, and detail stay left-aligned without fixed or inflated height.
- Keep the lower desktop grid at 8/4 columns and stack it on narrow screens.
- Place each lower-card title at the upper left and its “Xem tất cả” action at the upper right.
- Let list content start immediately below the card header. Center only the pending-bookings empty state within the remaining content area; venue rows remain top-aligned.

## Constraints

- Reuse the current API calls, state, owner helpers, semantic theme variables, and responsive shell.
- Use installed HeroUI v3 components for cards, controls, feedback, avatars, chips, loading, and empty-state surfaces.
- Use only `@gravity-ui/icons` for icons.
- Add no package, abstraction, fake data, or unrelated refactor.

## Verification

- Run the focused owner Playwright test and lint the changed files.
- Preview `/owner` at desktop and 390px width.
- Confirm card headers are not centered, metric cards are compact, content does not overflow horizontally, and existing links/actions still work.
