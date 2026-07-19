import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's built-in TypeScript runner requires explicit extensions.
import { getTrustedPayOsCheckoutUrl } from "./payments.ts";

test("PayOS checkout URLs allow only exact HTTPS provider hosts", () => {
  assert.equal(getTrustedPayOsCheckoutUrl("https://img.payos.vn/checkout/abc"), "https://img.payos.vn/checkout/abc");
  assert.equal(getTrustedPayOsCheckoutUrl("https://pay.payos.vn/web/abc?return=1"), "https://pay.payos.vn/web/abc?return=1");

  for (const value of [
    "http://img.payos.vn/checkout/abc",
    "https://user:pass@img.payos.vn/checkout/abc",
    "https://img.payos.vn.evil.test/checkout/abc",
    "https://evil.img.payos.vn/checkout/abc",
    "https://payos.vn/checkout/abc",
    "https://example.com/checkout/abc",
    "https://img.payos.vn:444/checkout/abc",
    "not a URL",
    "",
  ]) assert.equal(getTrustedPayOsCheckoutUrl(value), null, value);
});
