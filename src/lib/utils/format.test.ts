import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { formatTime } from "./format.ts";

test("formatTime supports API time-only values", () => {
  assert.equal(formatTime("06:00:00"), "06:00");
  assert.equal(formatTime("22:30"), "22:30");
});
