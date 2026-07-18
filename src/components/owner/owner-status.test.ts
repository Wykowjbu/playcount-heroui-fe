import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { getOwnerStatusConfig } from "./owner-status.ts";

test("owner status labels follow the backend enums", () => {
  assert.deepEqual(getOwnerStatusConfig("venue", "Approved"), { label: "Đã hoạt động", color: "success" });
  assert.deepEqual(getOwnerStatusConfig("court", "Available"), { label: "Sẵn sàng", color: "success" });
  assert.deepEqual(getOwnerStatusConfig("booking", "Pending"), { label: "Chờ xử lý", color: "warning" });
});
