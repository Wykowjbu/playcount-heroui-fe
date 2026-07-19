import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const quickLogin = source.slice(
  source.indexOf("function QuickLoginForm"),
  source.indexOf("function QuickRegisterForm"),
);

test("successful modal login relies on auth navigation only", () => {
  assert.match(source, /<QuickLoginForm \/>/);
  assert.doesNotMatch(quickLogin, /onSuccess/);
});
