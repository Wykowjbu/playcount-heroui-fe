import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email*" }).fill("admin@gmail.com");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill("admin123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
});

test("overview has one title and only connected controls", async ({ page }) => {
  await page.goto("/admin");

  await expect(page.getByRole("heading", { name: "Tổng quan Admin" })).toHaveCount(1);
  await expect(page.getByRole("searchbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thông báo" })).toHaveCount(0);
});

test("approval queues use data grids without undefined values", async ({ page }) => {
  for (const path of ["/admin/venues", "/admin/court-owners"]) {
    await page.goto(path);
    await expect(page.getByRole("grid")).toBeVisible();
    await expect(page.getByText("undefined", { exact: false })).toHaveCount(0);
  }
});

test("reference data uses direct HeroUI tables", async ({ page }) => {
  await page.goto("/admin/sports");
  await expect(page.locator(".card").filter({ has: page.getByRole("grid") })).toHaveCount(0);

  await page.goto("/admin/amenities");
  await expect(page.locator(".card").filter({ has: page.getByRole("grid") })).toHaveCount(0);
  await expect(page.getByRole("columnheader")).toHaveText(["Tên", "Thao tác"]);
});

test("venue detail shows real review data", async ({ page }) => {
  await page.goto("/admin/venues");
  const detailHref = await page.getByRole("link", { name: "Chi tiết" }).first().getAttribute("href");
  expect(detailHref).toBeTruthy();
  await page.goto(detailHref!);

  await expect(page.getByText("Invalid Date", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Hồ sơ chủ sân", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Danh sách sân" })).toBeVisible();
  await expect(page.getByText("Chủ nhật", { exact: true })).toBeVisible();
});
