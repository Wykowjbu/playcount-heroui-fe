import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("auth modal slot clears after role navigation", () => {
  for (const path of ["../page.tsx", "../[...catchAll]/page.tsx"]) {
    const route = new URL(path, import.meta.url);
    assert.equal(existsSync(route), true, `Missing null auth route: ${path}`);
    assert.match(readFileSync(route, "utf8"), /return null/);
  }
});
