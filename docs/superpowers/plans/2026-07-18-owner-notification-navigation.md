# Owner Notification Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Owner Booking notifications open the referenced booking in the existing Owner drawer while improving the compact notification panel's hierarchy and feedback.

**Architecture:** Keep navigation in the existing `flow-navigation` helper, parameterized by the normalized signed-in role. The shared dropdown marks read without blocking navigation, while `/owner/bookings` derives its selected drawer record from a validated `bookingId` query parameter inside a Next.js 16 `Suspense` boundary.

**Tech Stack:** Next.js 16.2 App Router, React 19, TypeScript, HeroUI v3, Gravity Icons, Node test runner, Playwright.

---

## File map

- Modify `src/lib/utils/flow-navigation.ts`: validated, role-aware notification URLs; reuse the existing positive-integer `getPaymentBookingId` parser.
- Modify `src/lib/utils/flow-navigation.test.ts`: focused unit coverage for Owner/Player/unknown roles and query parsing.
- Modify `src/lib/utils/redirect.ts`: reject an unrecognized backend role instead of granting Player behavior.
- Modify `src/components/layout/notification-dropdown.tsx`: pass role, add panel hierarchy/time/error states, and decouple navigation from mark-read failure.
- Modify `src/app/owner/bookings/page.tsx`: synchronize the existing drawer with `bookingId` and URL history.
- Modify `tests/owner-ui.spec.ts`: mocked end-to-end Owner notification click and drawer assertion.

### Task 1: Role-aware notification URL contract

- [ ] **Step 1: Add failing unit cases**

Add assertions showing:

```ts
assert.equal(getNotificationHref("owner", "Booking", 42), "/owner/bookings?bookingId=42");
assert.equal(getNotificationHref("owner", "Venue", 3), "/owner/venues/3");
assert.equal(getNotificationHref("player", "Booking", 42), "/bookings/42");
assert.equal(getNotificationHref("player", "Match", 7), "/matches/7");
assert.equal(getNotificationHref("player", "Venue", 3), "/venues/3");
assert.equal(getNotificationHref("admin", "Booking", 42), null);
assert.equal(getNotificationHref("unknown", "Booking", 42), null);
assert.equal(getNotificationHref(null, "Booking", 42), null);
assert.equal(getNotificationHref("owner", null, 42), null);
assert.equal(getNotificationHref("owner", "Booking", 0), null);
assert.equal(getNotificationHref("owner", "Booking", -1), null);
assert.throws(() => normalizeRole("MysteryRole"));
assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=42")), 42);
assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=nope")), null);
```

- [ ] **Step 2: Verify RED**

Run: `node --test --experimental-strip-types src/lib/utils/flow-navigation.test.ts`

Expected: FAIL because the helper signature/parser does not support the new contract.

- [ ] **Step 3: Implement the minimum mapping**

Accept `string | null`, whitelist the exact normalized values `owner` and `player`, and return `null` for `admin`, guest/null, or any other string. Keep the existing `Role` union unchanged; make `normalizeRole` map only explicit Player values to `player` and throw for an unexpected backend value. Stored-auth loading already catches parse/normalization failures and becomes guest-safe; login surfaces the invalid server response instead of exposing Player UI. Continue using the existing positive-integer parser; do not add a route registry or parser.

- [ ] **Step 4: Verify GREEN**

Run the same Node test command. Expected: all tests pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add -- src/lib/utils/flow-navigation.ts src/lib/utils/flow-navigation.test.ts src/lib/utils/redirect.ts
git commit -m "feat: route owner notifications to owner records"
```

### Task 2: Notification panel behavior and hierarchy

- [ ] **Step 1: Add the failing Playwright setup**

For tests whose title contains `notification`, branch in the existing `beforeEach`: call `page.addInitScript` before navigation to seed `pc_auth` with an Owner-shaped fixture and dummy tokens, skip the real login, and register all API routes before the first `page.goto`. Other Owner tests retain the real login hook. Fulfill exact envelopes for:

- `GET **/api/Notifications?*` -> `{success:true,message:"",data:[notification],errors:[]}`.
- `GET **/api/Notifications/unread-count` -> `{success:true,message:"",data:{count:1},errors:[]}`.
- `PATCH **/api/Notifications/100/read` -> the updated notification envelope.
- `PATCH **/api/Notifications/read-all` -> `{success:true,message:"",data:{updatedCount:1},errors:[]}`.

Assert the menu exposes its heading, notification title/content, and `<time dateTime="2026-07-18T09:00:00+07:00">`. Activate it once with Enter and once with pointer in separate checks. Add a failed-read variant returning 500 and assert navigation still occurs while the local unread indicator is not falsely decremented. Add list-error and mark-all-error variants and assert visible `role="status"` feedback.

- [ ] **Step 2: Verify RED**

Precondition: confirm `http://localhost:3000` responds; otherwise start `npm run dev` in a separate terminal. The focused notification tests do not require the API server because auth and every page dependency are mocked before navigation. Run: `npx playwright test tests/owner-ui.spec.ts -g "notification" --project=chromium`

Expected: FAIL because the Owner route and panel metadata are absent.

- [ ] **Step 3: Implement the minimum dropdown change**

Use `useAuth()` and call `getNotificationHref(user?.role ?? null, notification.referenceType, notification.referenceId)`. Wrap `markAsRead` in `try/catch`, update unread state only on success, then navigate regardless. Use HeroUI v3 `Dropdown.Section` + `Header`, existing `Label`/`Description`, semantic `<time dateTime={createdAt}>` with the existing date formatter, and Gravity `Bell`/`Check`; display concise `role="status"` feedback for list/mark-all failures. Mark-all changes local state only after API success.

- [ ] **Step 4: Verify GREEN**

With the same server precondition, run the focused Playwright test and the flow-navigation unit test.

- [ ] **Step 5: Commit**

Run:

```powershell
git add -- src/components/layout/notification-dropdown.tsx tests/owner-ui.spec.ts
git commit -m "feat: improve notification panel behavior"
```

### Task 3: Query-driven existing Owner booking drawer

- [ ] **Step 1: Extend the failing browser test**

Before navigating from the notification, fulfill exact envelopes: Booking/Payment/Venue endpoints use `{success:true,message:"",data:<fixture>,errors:[]}`; venue-bookings uses the same wrapper with `data:[]`. After activation, assert URL `/owner/bookings?bookingId=42` and drawer heading `Chi tiết đơn #42`; close from `/owner/bookings?status=Pending&bookingId=42` and assert `status=Pending` remains while only `bookingId` is removed.

Add one direct-navigation test covering malformed/missing/403/404 IDs, refresh, and Back/Forward. Add a delayed `Booking/41` response followed by navigation to `bookingId=42`; assert the late 41 response cannot replace drawer 42.

- [ ] **Step 2: Verify RED**

Precondition: confirm `http://localhost:3000` responds; otherwise start `npm run dev` separately. Run the focused Playwright command. Expected: route changes but no drawer opens.

- [ ] **Step 3: Implement URL synchronization**

Render `<Suspense fallback={<Skeleton className="h-32 rounded-xl" />}><BookingsContent /></Suspense>` directly around the component that calls `useSearchParams`; `Skeleton` is already imported in the same file. Inside it, parse with `getPaymentBookingId` and load `getBookingById` independently of the venue list. On every missing, invalid, changed, or failed ID, clear the previous `selected` and direct-load error before resolving the new state; guard the effect with an `active` boolean so stale responses cannot win. Render direct-booking error and `BookingDrawer` outside venue-loading/zero-venue branches. On close, copy `searchParams`, delete only `bookingId`, and call `router.replace(pathname + optionalQuery, { scroll: false })`. A 403/404/load failure shows a HeroUI `Alert` and never opens an empty drawer.

- [ ] **Step 4: Verify GREEN**

With the same server precondition, run the focused browser test, then all owner UI tests.

- [ ] **Step 5: Commit**

Run:

```powershell
git add -- src/app/owner/bookings/page.tsx tests/owner-ui.spec.ts
git commit -m "feat: open owner booking drawer from notifications"
```

### Task 4: Verification and visual QA

- [ ] **Step 1: Run focused unit tests**

`node --test --experimental-strip-types src/lib/utils/flow-navigation.test.ts`

- [ ] **Step 2: Run lint**

`npm run lint`

- [ ] **Step 3: Run production build**

`npm run build`

Expected: no missing `Suspense` boundary or type/build error.

- [ ] **Step 4: Run Owner E2E**

`npx playwright test tests/owner-ui.spec.ts --project=chromium`

Precondition: `http://localhost:3000` is running. If not, start it in a separate terminal with `npm run dev`; the current Playwright config supplies `baseURL` but intentionally has no `webServer` process.

- [ ] **Step 5: Capture full-screen QA**

Maximize Edge, capture the Owner dashboard and open notification panel, activate the mocked/available Booking notification, and capture the Owner booking drawer. Confirm keyboard focus, no horizontal overflow, and correct Owner shell.

- [ ] **Step 6: Final commit only if verification required fixes**

Do not reformat or stage unrelated dirty files.
