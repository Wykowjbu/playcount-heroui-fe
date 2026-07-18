# PlayCourt Admin UI Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inaccurate, oversized admin UI with compact HeroUI v3 operational screens that match the backend contracts.

**Architecture:** Keep the existing client-side admin routes, auth guard, and API client. Correct shared DTO/time behavior first, then reshape each route with direct HeroUI compound components and existing API functions. Use one Playwright spec for cross-screen behavior and one focused Node test for time formatting.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, HeroUI v3, Gravity UI Icons, Playwright.

---

### Task 1: Lock the backend contract and time behavior

**Files:**
- Modify: `src/lib/types/api.ts`
- Modify: `src/lib/utils/format.ts`
- Create: `src/lib/utils/format.test.ts`
- Modify: `src/lib/api/admin.ts`

- [ ] **Step 0: Read the versioned implementation references**

Read `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, and `10-error-handling.md`. Fetch current HeroUI v3 docs for `Table`, `Modal`, `Select`, `Button`, `Alert`, `Avatar`, and `Chip` with `.agents/skills/heroui-react/scripts/get_component_docs.mjs` before editing.

- [ ] **Step 1: Write the failing time-only test**

```ts
import assert from "node:assert/strict";
import test from "node:test";
import { formatTime } from "./format.ts";

test("formatTime supports API time-only values", () => {
  assert.equal(formatTime("06:00:00"), "06:00");
  assert.equal(formatTime("22:30"), "22:30");
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test --experimental-strip-types src/lib/utils/format.test.ts`

Expected: FAIL because `formatTime("06:00:00")` returns `Invalid Date`.

- [ ] **Step 3: Implement the minimum shared fix**

Detect `HH:mm`/`HH:mm:ss` with `/^(\d{2}):(\d{2})/` and return the captured hour/minute; keep the existing localized datetime path for ISO values.

Change the contracts to the backend source:

- `VenueResponseDto.courtOwnerProfileId`; remove `ownerId`, `ownerName`, and embedded `courts`.
- Add `CourtOwnerListItemDto` with `phone` and list-only fields.
- Correct `CourtOwnerDetailDto` to use `phone`, profile/business fields, and no `venueCount` or `verificationDocuments`.
- Reduce `AmenityDto` to `id` and `name`.
- Return `CourtOwnerListItemDto[]` from `getCourtOwners`.
- Change owner mutations to `{ verificationStatus: 1 | 2, rejectionReason? }` and venue mutations to `{ status: 0 | 1 | 2 | 3 }`, matching the C# request DTOs.

- [ ] **Step 4: Run the focused test and type check**

Run: `node --test --experimental-strip-types src/lib/utils/format.test.ts`

Expected: PASS.

Run: `npx tsc --noEmit`

Expected: existing admin DTO consumers fail, identifying every screen that must be corrected in later tasks.

- [ ] **Step 5: Commit the contract fix**

```powershell
git add src/lib/types/api.ts src/lib/utils/format.ts src/lib/utils/format.test.ts src/lib/api/admin.ts
git commit -m "fix: align admin contracts with backend"
```

### Task 2: Add one admin UI regression journey

**Files:**
- Create: `tests/admin-ui.spec.ts`

- [ ] **Step 1: Write the failing Playwright journey**

Precondition: the user-provided frontend and backend processes are running and the documented development admin account exists. Confirm `http://localhost:3000/login` responds before the test. Do not add a Playwright `webServer` that would compete with the user's process.

The spec logs in with the documented development admin account, then asserts in tests named `overview`, `approval queues`, `reference data`, and `venue detail`:

- `/admin` has one page heading, no fake global search, and no hard-coded notification count.
- `/admin/venues` and `/admin/court-owners` expose HeroUI data grids and never render `undefined`.
- `/admin/sports` and `/admin/amenities` tables have no Card ancestor.
- Amenities has only `Tên` and `Thao tác` columns.
- The first venue detail link never renders `Invalid Date`, shows `Hồ sơ chủ sân`, and shows the court list; do not assume a fixed venue ID.

Use role-based locators and `getByRole("grid")`; avoid implementation-class assertions except the explicit no-Card-wrapper requirement.

- [ ] **Step 2: Run and confirm RED**

Run: `npx playwright test tests/admin-ui.spec.ts --project=chromium`

Expected: FAIL on the current duplicated/fake shell, missing data grids, Card wrappers, and invalid venue detail data.

- [ ] **Step 3: Commit the regression spec**

```powershell
git add tests/admin-ui.spec.ts
git commit -m "test: cover admin operations UI"
```

### Task 3: Simplify the admin shell and overview

**Files:**
- Modify: `src/components/admin/admin-shell.tsx`
- Modify: `src/components/admin/admin-sidebar.tsx`
- Modify: `src/components/admin/admin-topbar.tsx`
- Modify: `src/components/admin/admin-overview.tsx`
- Modify: `src/components/admin/admin-stat-card.tsx`
- Delete if unused: `src/components/admin/admin-priority-table.tsx`

- [ ] **Step 1: Remove unsupported shell controls**

Keep HeroUI `Button` and `Avatar` in the top bar. Remove the fake `SearchField`, `Badge`, and static notification count. Replace the duplicated route title with a stable `Quản trị hệ thống` label.

- [ ] **Step 2: Make navigation compact and responsive**

Keep the existing Gravity UI icon set and HeroUI logout `Button`. Reduce excessive sidebar/content dimensions and preserve keyboard focus and `aria-current`.

- [ ] **Step 3: Consolidate overview information**

Render two primary pending queue links and three compact secondary metrics. Reuse `AdminStatCard`; remove duplicate quick actions and the orphan metric row.

- [ ] **Step 4: Run targeted Playwright assertions**

Run: `npx playwright test tests/admin-ui.spec.ts --project=chromium -g "overview"`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/admin
git commit -m "refactor: simplify admin dashboard shell"
```

### Task 4: Convert approval queues to HeroUI tables

**Files:**
- Modify: `src/app/admin/venues/page.tsx`
- Modify: `src/app/admin/court-owners/page.tsx`

- [ ] **Step 1: Build the venue table**

Use `Table > Table.ScrollContainer > Table.Content`. Columns: Cơ sở (`isRowHeader`), Trạng thái, Ngày tạo, Thao tác. Put the address below the venue name. Keep the existing HeroUI `Select` status filter and use `renderEmptyState`.

- [ ] **Step 2: Build the owner table and detail modal**

Use list DTO fields only in the table. A HeroUI `Button` opens a controlled HeroUI `Modal`, fetches `getCourtOwnerById`, and displays available personal/business fields. Approval sends `{ verificationStatus: 1 }`; rejection sends `{ verificationStatus: 2, rejectionReason }` and requires a non-empty HeroUI `TextField`.

Render request and mutation failures with HeroUI `Alert` inside the page/modal instead of `window.alert`.

- [ ] **Step 3: Run the approval-queue regression assertions**

Run: `npx playwright test tests/admin-ui.spec.ts --project=chromium -g "approval queues"`

Expected: PASS with no `undefined` text.

- [ ] **Step 4: Commit**

```powershell
git add src/app/admin/venues/page.tsx src/app/admin/court-owners/page.tsx
git commit -m "refactor: use tables for admin approval queues"
```

### Task 5: Flatten sports and amenities tables

**Files:**
- Modify: `src/app/admin/sports/page.tsx`
- Modify: `src/app/admin/amenities/page.tsx`

- [ ] **Step 1: Remove outer Cards**

Render HeroUI `Table` directly with `Table.ScrollContainer`, stable row IDs, and an `isRowHeader` column. Keep HeroUI loading, empty, form, and confirmation surfaces.

- [ ] **Step 2: Correct table contents**

Sports columns: Mã (`isRowHeader`), Tên, Mô tả, Trạng thái, Thao tác. Amenities columns: Tên (`isRowHeader`) and Thao tác only. Use Gravity UI icons in every icon button.

- [ ] **Step 3: Correct modal state**

Use controlled HeroUI modal close behavior so Cancel, close trigger, and successful mutation all update React state. Keep validation at the form boundary. Replace sports and amenities mutation `window.alert` calls with visible HeroUI `Alert` content in the relevant page or modal.

- [ ] **Step 4: Run the reference-data assertions**

Run: `npx playwright test tests/admin-ui.spec.ts --project=chromium -g "reference data"`

Expected: PASS and no Next DevTools `isRowHeader` recoverable error.

- [ ] **Step 5: Commit**

```powershell
git add src/app/admin/sports/page.tsx src/app/admin/amenities/page.tsx
git commit -m "refactor: flatten admin reference tables"
```

### Task 6: Correct the venue review detail

**Files:**
- Modify: `src/app/admin/venues/[id]/page.tsx`

- [ ] **Step 1: Load real court data**

Fetch `getAdminVenueById` and the existing `getVenueCourts` together. Store courts separately instead of relying on a nonexistent embedded field.

- [ ] **Step 2: Render only supported venue data**

Replace `ownerName/ownerId` with `courtOwnerProfileId`. Show real courts, amenities, images through HeroUI surfaces, and opening hours through the corrected `formatTime`. Use `Avatar.Image` or existing HeroUI image-capable components where images are displayed; keep Gravity UI icons for actions.

- [ ] **Step 3: Match the venue status contract**

Venue approval/rejection/suspension sends numeric enum values. Because `UpdateVenueStatusRequestDto` has no reason property, use a HeroUI confirmation modal without a reason field. Render mutation failure with HeroUI `Alert`.

- [ ] **Step 4: Run detail assertions**

Run: `npx playwright test tests/admin-ui.spec.ts --project=chromium -g "venue detail"`

Expected: PASS with no `Invalid Date`, fake owner ID, or fake zero-court statistic.

- [ ] **Step 5: Commit**

```powershell
git add -- 'src/app/admin/venues/[id]/page.tsx'
git commit -m "fix: show real admin venue review data"
```

### Task 7: Full verification and visual QA

**Files:**
- Modify only if verification finds an in-scope regression.

- [ ] **Step 1: Run all focused checks**

Run:

```powershell
node --test --experimental-strip-types src/lib/utils/format.test.ts
npx playwright test tests/admin-ui.spec.ts --project=chromium
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Preview every screen**

Use the logged-in browser to inspect `/admin`, `/admin/venues`, `/admin/court-owners`, `/admin/sports`, `/admin/amenities`, and the first available venue detail route. Confirm tables are direct HeroUI surfaces, text is legible without awkward wrapping, and no Next DevTools issue badge remains.

- [ ] **Step 3: Review scope**

Run: `git diff --stat HEAD~6..HEAD` and `git status --short`.

Confirm only admin, shared contract/format, test, and plan/spec files changed; preserve all unrelated user worktree changes.
