import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { getNotificationHref, getPaymentBookingId } from "./flow-navigation.ts";
// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { normalizeRole } from "./redirect.ts";

test("notification references route to existing detail screens", () => {
  assert.equal(getNotificationHref("Booking", 42), "/bookings/42");
  assert.equal(getNotificationHref("Match", 7), "/matches/7");
  assert.equal(getNotificationHref("Venue", 3), "/venues/3");
  assert.equal(getNotificationHref(null, null), null);
});

test("backend CourtOwner role maps to owner routes", () => {
  assert.equal(normalizeRole("CourtOwner"), "owner");
  assert.equal(normalizeRole("Admin"), "admin");
  assert.equal(normalizeRole("Player"), "player");
});

test("PayOS callback uses backend-appended bookingId, never orderCode", () => {
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=12&orderCode=999")), 12);
  assert.equal(getPaymentBookingId(new URLSearchParams("orderCode=999")), null);
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=nope")), null);
});
