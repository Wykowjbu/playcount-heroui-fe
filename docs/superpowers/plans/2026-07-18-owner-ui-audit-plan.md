# PlayCourt Owner UI Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make every Owner route compact, consistent, accessible, and operationally correct using HeroUI v3 and Gravity UI Icons.

**Architecture:** Keep the current Owner routes, guards, API functions, and shared UI helpers. Fix shared view logic once, then reshape existing screens without adding dependencies or speculative endpoints. Court pricing and closure schedules remain court-scoped.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, HeroUI v3.2, Gravity UI Icons, Playwright, Node test runner.

---

### Task 1: Lock Owner behavior with focused checks

**Files:**
- Create: `tests/owner-ui.spec.ts`
- Create or modify: `src/components/owner/owner-view-model.test.ts`
- Create or modify: `src/components/owner/owner-view-model.ts`

- [ ] Read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, and the relevant navigation/error-handling guides before editing. Fetch exact HeroUI v3 docs for every component used.
- [ ] Add one small Node test for localized weekday labels and the `Confirmed && endAt <= now` completion rule. Run it RED before adding the minimum pure helpers.
- [ ] Add a Playwright Owner journey using the supplied development account. Cover `/owner`, `/owner/venues`, venue detail tabs, a court detail's three tabs, `/owner/bookings`, `/owner/reviews`, and `/owner/profile`. Assert one Owner shell, direct data grids, correct quick links, localized weekdays, and no nested-button hydration error.
- [ ] Run the focused checks and record the expected current failures. Do not add a Playwright `webServer`; reuse the running frontend/backend.

### Task 2: Compact the shared Owner shell, dashboard, and profile

**Files:**
- Modify: `src/components/owner/owner-ui.tsx`
- Modify: `src/components/owner/owner-topbar.tsx`
- Modify: `src/app/owner/page.tsx`
- Modify: `src/app/owner/profile/page.tsx`
- Modify: `src/components/profile/ProfilePageShell.tsx`
- Modify: `src/components/profile/ProfileSummaryCard.tsx`

- [ ] Make `OwnerMetricCard` explicitly auto-height and compact. Keep a small contextual `OwnerEmptyState`; do not introduce another wrapper abstraction.
- [ ] Localize the sidebar toggle accessible name. Preserve the real notification dropdown.
- [ ] Keep four real metrics and the existing pending-booking/venue previews. When there is one venue, name it in pending-copy instead of referring to a hidden selector. Remove excess vertical space only.
- [ ] Replace the profile's public header with `OwnerGuard` and `OwnerShell`. Owner gets personal/business tabs only; Player keeps its current tabs and behavior.
- [ ] Correct Owner quick links to `/owner/venues` and `/owner/bookings`; remove the unsupported revenue link.
- [ ] Run the dashboard/profile Playwright checks and manually verify Player profile regression.

### Task 3: Fix venue list actions and form copy

**Files:**
- Modify: `src/app/owner/venues/page.tsx`
- Modify: `src/app/owner/venues/new/page.tsx` only if verification finds layout/accessibility issues
- Modify: `src/app/owner/venues/[id]/edit/page.tsx`

- [ ] Replace the incorrect `Dropdown.Trigger > Button` composition with the installed HeroUI v3 direct-button trigger pattern.
- [ ] Move delete confirmation outside nested menu/button composition. Keep one HeroUI `AlertDialog`, visible failure feedback, and stable table row headers/IDs.
- [ ] Keep the direct HeroUI table and existing fields. Do not add unsupported court counts or extra wrappers.
- [ ] Replace backend jargon in the edit form with plain permission guidance. Preserve create/update API behavior.
- [ ] Run venue-list/form assertions and confirm the browser no longer reports nested buttons.

### Task 4: Tighten every venue-detail tab

**Files:**
- Modify: `src/app/owner/venues/[id]/page.tsx`
- Modify existing helpers only when reused by multiple tab sections

- [ ] Keep the existing overview and completion checklist, but remove unnecessary fixed/min heights and duplicate actions.
- [ ] Keep the direct courts table and correct HeroUI v3 Dropdown usage for court actions.
- [ ] Make all seven opening-hour labels explicit, disable time fields for closed days, validate closing time after opening time, and keep errors adjacent to the affected fields.
- [ ] Keep HeroUI amenities checkboxes and save-by-diff behavior.
- [ ] For images and staff, render the add action once: header when data exists, empty-state action when empty. Keep HeroUI modal/dropdown/dialog behavior and Gravity icons.
- [ ] Run venue-detail tab checks at desktop and narrow width.

### Task 5: Convert court pricing and closures into record-first workflows

**Files:**
- Modify: `src/app/owner/venues/[id]/courts/[courtId]/page.tsx`
- Modify: `src/components/owner/owner-view-model.ts`
- Modify: `src/components/owner/owner-view-model.test.ts`

- [ ] Add a breadcrumb/back action to the venue and court context.
- [ ] Keep the info tab form and current update API.
- [ ] Replace the always-open pricing form with one “Thêm bảng giá” HeroUI modal. Render existing rules in a direct HeroUI table on desktop and compact cards on narrow screens; show localized weekday, time range, VND price, and effective dates.
- [ ] Add HeroUI edit/delete actions only for supported pricing endpoints; delete uses `AlertDialog`.
- [ ] Replace the always-open closure form with one “Thêm lịch đóng sân” HeroUI modal and a record-first table/empty state.
- [ ] Run the focused helper test and court-detail Playwright checks.

### Task 6: Correct booking and review operational surfaces

**Files:**
- Modify: `src/app/owner/bookings/page.tsx`
- Modify: `src/app/owner/reviews/page.tsx`

- [ ] Keep booking filters compact and supported by the current API. Keep search client-side for loaded results.
- [ ] When the booking drawer opens, fetch payment details with separate loading, unavailable, and error states. Use Vietnamese copy and show only valid actions.
- [ ] Use the shared completion rule. Keep reject reason validation and show all mutation failures inside the drawer with HeroUI `Alert`.
- [ ] Compact the review summary and render an accessible five-row rating distribution. Keep reviews read-only and the empty state short.
- [ ] Run booking/review checks without mutating real data except where a deterministic development fixture explicitly permits it.

### Task 7: Full verification and visual QA

**Files:**
- Modify only if an in-scope regression is found.

- [ ] Run focused Node tests.
- [ ] Run `npx playwright test tests/owner-ui.spec.ts --project=chromium`.
- [ ] Run ESLint on changed Owner/profile/test files, then `npx tsc --noEmit` and `npm run build`.
- [ ] Separate pre-existing repository failures from new failures; fix every regression caused by this work.
- [ ] Preview every Owner route and tab at desktop and narrow viewport using `owner01@gmail.com`. Confirm HeroUI tables are not decoratively card-wrapped, actions use Gravity icons, empty states have one CTA, and the Next DevTools Owner issue badge is clear.
- [ ] Review `git diff` and `git status`; preserve unrelated dirty-worktree changes and do not stage or commit them.
