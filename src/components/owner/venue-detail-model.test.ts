import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { canCompleteBooking, formatWeekday, getCourtTab, getVenueTab, normalizeOpeningHours, validateOpeningHours } from "./venue-detail-model.ts";

test("venue tab falls back to overview for an unknown query value", () => {
  assert.equal(getVenueTab("courts"), "courts");
  assert.equal(getVenueTab("unknown"), "overview");
  assert.equal(getVenueTab(null), "overview");
});

test("court management deep links only accept known tabs", () => {
  assert.equal(getCourtTab("pricing"), "pricing");
  assert.equal(getCourtTab("schedule"), "schedule");
  assert.equal(getCourtTab("unknown"), "info");
});

test("opening hours are always ordered Monday through Sunday", () => {
  const hours = normalizeOpeningHours([
    { dayOfWeek: 0, openTime: "08:00:00", closeTime: "20:00:00", isClosed: false },
    { dayOfWeek: 1, openTime: "06:00:00", closeTime: "22:00:00", isClosed: false },
  ]);

  assert.deepEqual(hours.map((hour) => hour.dayOfWeek), [1, 2, 3, 4, 5, 6, 0]);
  assert.equal(hours[6].openTime, "08:00:00");
  assert.equal(hours[1].isClosed, true);
});

test("opening hours reject an end time that is not after the start time", () => {
  assert.equal(validateOpeningHours([
    { dayOfWeek: 1, openTime: "22:00:00", closeTime: "06:00:00", isClosed: false },
  ]), "Giờ đóng cửa phải sau giờ mở cửa.");

  assert.equal(validateOpeningHours([
    { dayOfWeek: 1, openTime: null, closeTime: null, isClosed: true },
  ]), null);
});

test("weekday labels map backend day numbers to Vietnamese names", () => {
  assert.equal(formatWeekday(1), "Thứ 2");
  assert.equal(formatWeekday(6), "Thứ 7");
  assert.equal(formatWeekday(0), "Chủ nhật");
  assert.equal(formatWeekday(7), "Chủ nhật");
});

test("only ended confirmed bookings can be completed", () => {
  const now = new Date("2026-07-18T10:00:00Z");
  assert.equal(canCompleteBooking("Confirmed", "2026-07-18T09:59:00Z", now), true);
  assert.equal(canCompleteBooking("Confirmed", "2026-07-18T10:01:00Z", now), false);
  assert.equal(canCompleteBooking("Pending", "2026-07-18T09:59:00Z", now), false);
});
