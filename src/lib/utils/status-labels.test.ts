import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { isTerminalBookingStatus } from "./status-labels.ts";

test("expired and cancelled bookings are terminal", () => {
  assert.equal(isTerminalBookingStatus("Expired"), true);
  assert.equal(isTerminalBookingStatus("CancelledByUser"), true);
  assert.equal(isTerminalBookingStatus("CancelledByOwner"), true);
  assert.equal(isTerminalBookingStatus("Pending"), false);
  assert.equal(isTerminalBookingStatus("Confirmed"), false);
});
