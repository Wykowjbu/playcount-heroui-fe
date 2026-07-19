import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { getNotificationHref, getPaymentBookingId } from "./flow-navigation.ts";
// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { normalizeRole } from "./redirect.ts";

test("notification references route to role-appropriate detail screens", () => {
  assert.equal(getNotificationHref("owner", "Booking", 42), "/owner/bookings?bookingId=42");
  assert.equal(getNotificationHref("owner", "Venue", 3), "/owner/venues/3");
  assert.equal(getNotificationHref("player", "Booking", 42), "/bookings/42");
  assert.equal(getNotificationHref("player", "Match", 7), "/matches/7");
  assert.equal(getNotificationHref("player", "Venue", 3), "/venues/3");
  assert.equal(getNotificationHref("player", "Payment", 42), "/player/bookings");
  assert.equal(getNotificationHref("player", "Review", 42), null);
  assert.equal(getNotificationHref("player", "System", 42), null);
  assert.equal(getNotificationHref("admin", "Booking", 42), null);
  assert.equal(getNotificationHref("unknown", "Booking", 42), null);
  assert.equal(getNotificationHref(null, "Booking", 42), null);
  assert.equal(getNotificationHref("owner", null, 42), null);
  assert.equal(getNotificationHref("owner", "Booking", 0), null);
  assert.equal(getNotificationHref("owner", "Booking", -1), null);
});

test("backend CourtOwner role maps to owner routes", () => {
  assert.equal(normalizeRole("CourtOwner"), "owner");
  assert.equal(normalizeRole("Admin"), "admin");
  assert.equal(normalizeRole("Player"), "player");
  assert.throws(() => normalizeRole("MysteryRole"));
});

test("PayOS callback uses backend-appended bookingId, never orderCode", () => {
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=12&orderCode=999")), 12);
  assert.equal(getPaymentBookingId(new URLSearchParams("orderCode=999")), null);
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=nope")), null);
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=1e2")), null);
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=0x2a")), null);
  assert.equal(getPaymentBookingId(new URLSearchParams("bookingId=%2042%20")), null);
});
