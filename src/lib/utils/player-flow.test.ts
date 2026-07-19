import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { appendBookingPage, getBookableDurations, sortVenuesByDistance, toLocalIsoAtWallTime, toLocalIsoWithOffset } from "./player-flow.ts";

test("local booking timestamps preserve wall time and format the UTC offset", () => {
  assert.equal(toLocalIsoWithOffset("2026-07-19", "08:00", 420), "2026-07-19T08:00:00+07:00");
  assert.equal(toLocalIsoWithOffset("2026-07-19", "08:00", -330), "2026-07-19T08:00:00-05:30");
  assert.equal(toLocalIsoWithOffset("2026-07-19", "08:00", 840), "2026-07-19T08:00:00+14:00");
  assert.throws(() => toLocalIsoWithOffset("2026-02-29", "08:00", 0), RangeError);
  assert.throws(() => toLocalIsoWithOffset("2026-07-19", "24:00", 0), RangeError);
  assert.throws(() => toLocalIsoWithOffset("2026-07-19", "08:00", 841), RangeError);
});

test("bookable durations include only contiguous 30-minute available slots", () => {
  const slots = [
    { startAt: "2026-07-19T08:00:00+07:00", endAt: "2026-07-19T08:30:00+07:00", status: "Available" as const, estimatedPrice: null, canStartBooking: true },
    { startAt: "2026-07-19T08:30:00+07:00", endAt: "2026-07-19T09:00:00+07:00", status: "Available" as const, estimatedPrice: null, canStartBooking: false },
    { startAt: "2026-07-19T09:00:00+07:00", endAt: "2026-07-19T09:30:00+07:00", status: "Available" as const, estimatedPrice: null, canStartBooking: true },
    { startAt: "2026-07-19T09:30:00+07:00", endAt: "2026-07-19T10:00:00+07:00", status: "Booked" as const, estimatedPrice: null, canStartBooking: false },
  ];

  assert.deepEqual(getBookableDurations(slots, 0), [60, 90]);
  assert.deepEqual(getBookableDurations(slots, 1), []);
  assert.deepEqual(getBookableDurations(slots, 3), []);
});

test("bookable durations stop at timestamp gaps and malformed slot lengths", () => {
  const slots = [
    { startAt: "2026-07-19T08:00:00Z", endAt: "2026-07-19T08:30:00Z", status: "Available" as const, estimatedPrice: null, canStartBooking: true },
    { startAt: "2026-07-19T09:00:00Z", endAt: "2026-07-19T09:30:00Z", status: "Available" as const, estimatedPrice: null, canStartBooking: false },
  ];

  assert.deepEqual(getBookableDurations(slots, 0), []);
  assert.deepEqual(getBookableDurations([{ ...slots[0], endAt: "2026-07-19T08:45:00Z" }], 0), []);
});

test("local wall timestamps use the selected date offset and reject DST gaps", () => {
  const originalTimezone = process.env.TZ;
  try {
    process.env.TZ = "America/New_York";
    assert.equal(toLocalIsoAtWallTime("2026-01-15", "08:00"), "2026-01-15T08:00:00-05:00");
    assert.equal(toLocalIsoAtWallTime("2026-07-15", "08:00"), "2026-07-15T08:00:00-04:00");
    assert.throws(() => toLocalIsoAtWallTime("2026-03-08", "02:30"), RangeError);
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});

test("venues with coordinates sort nearest-first without mutating input", () => {
  const items = [
    { id: 1, latitude: null, longitude: null },
    { id: 2, latitude: 10.78, longitude: 106.70 },
    { id: 3, latitude: 10.77, longitude: 106.69 },
    { id: 4, latitude: undefined, longitude: undefined },
  ];
  const before = [...items];

  const sorted = sortVenuesByDistance(items, { latitude: 10.77, longitude: 106.69 });

  assert.deepEqual(sorted.map(({ id }) => id), [3, 2, 1, 4]);
  assert.deepEqual(items, before);
  assert.notEqual(sorted, items);
});

test("malformed coordinates remain unsorted and do not mutate input", () => {
  const items = [
    { id: 1, latitude: Number.NaN, longitude: 106.69 },
    { id: 2, latitude: 10.77, longitude: Number.POSITIVE_INFINITY },
    { id: 3, latitude: -91, longitude: 106.69 },
    { id: 4, latitude: 10.77, longitude: 181 },
    { id: 5, latitude: 10.78, longitude: 106.70 },
  ];
  const before = [...items];

  const sorted = sortVenuesByDistance(items, { latitude: 10.77, longitude: 106.69 });

  assert.deepEqual(sorted.map(({ id }) => id), [5, 1, 2, 3, 4]);
  assert.deepEqual(items, before);
  assert.notEqual(sorted, items);
});

test("invalid origins return a stable copy", () => {
  const items = [
    { id: 1, latitude: -80, longitude: -170 },
    { id: 2, latitude: 80, longitude: 170 },
  ];

  for (const origin of [
    { latitude: Number.NaN, longitude: 106.69 },
    { latitude: Number.NEGATIVE_INFINITY, longitude: 106.69 },
    { latitude: 91, longitude: 106.69 },
    { latitude: 10.77, longitude: -181 },
  ]) {
    const sorted = sortVenuesByDistance(items, origin);
    assert.deepEqual(sorted, items);
    assert.notEqual(sorted, items);
  }
});

test("booking pages de-duplicate ids and derive hasMore from the incoming page", () => {
  const existing = [{ id: 1, status: "Pending" }, { id: 2, status: "Pending" }];
  const fullPage = appendBookingPage(existing, [{ id: 2, status: "Confirmed" }, { id: 3, status: "Pending" }], 2);

  assert.deepEqual(fullPage, {
    items: [{ id: 1, status: "Pending" }, { id: 2, status: "Pending" }, { id: 3, status: "Pending" }],
    hasMore: true,
  });
  assert.deepEqual(appendBookingPage(existing, [{ id: 3, status: "Pending" }], 2), {
    items: [{ id: 1, status: "Pending" }, { id: 2, status: "Pending" }, { id: 3, status: "Pending" }],
    hasMore: false,
  });
});
