import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { buildVenueUpdateRequest } from "./venue-update.ts";

test("venue update keeps non-form data and never sends the admin-only status", () => {
  const request = buildVenueUpdateRequest(
    {
      latitude: 10.7769,
      longitude: 106.7009,
      openTime: "06:00:00",
      closeTime: "22:00:00",
      status: "Suspended",
    },
    {
      name: "  PlayCourt Quận 1  ",
      address: "  123 Nguyễn Huệ  ",
      description: "   ",
      phone: "  0901234567  ",
    },
  );

  assert.deepEqual(request, {
    name: "PlayCourt Quận 1",
    address: "123 Nguyễn Huệ",
    description: undefined,
    phone: "0901234567",
    latitude: 10.7769,
    longitude: 106.7009,
    openTime: "06:00:00",
    closeTime: "22:00:00",
  });
  assert.equal("status" in request, false);
});
