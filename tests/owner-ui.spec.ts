import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email*" }).fill("owner01@gmail.com");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill("admin123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
});

test("owner shell, dashboard, and profile stay consistent", async ({ page }) => {
  await page.goto("/owner");
  await expect(page.getByRole("heading", { name: "Tổng quan" })).toHaveCount(1);
  await expect(page.getByText("Đơn chờ tại", { exact: false })).toBeVisible();
  await expect(page.locator("a button")).toHaveCount(0);

  await page.goto("/owner/profile");
  await expect(page.getByRole("heading", { name: "Hồ sơ" })).toHaveCount(1);
  await expect(page.getByRole("tab", { name: "Kinh doanh" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Bảo mật" })).toHaveCount(0);
  await expect(page.locator('a[href="/owner/venues"]')).not.toHaveCount(0);
  await expect(page.locator('a[href="/analytics"]')).toHaveCount(0);
});

test("venue and court management use direct record-first surfaces", async ({ page }) => {
  const runtimeErrors: string[] = [];
  const runtimeWarnings: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") runtimeErrors.push(message.text()); });
  page.on("console", (message) => { if (message.type() === "warning") runtimeWarnings.push(message.text()); });

  await page.goto("/owner/venues");
  await expect(page.getByRole("grid")).toBeVisible();
  await expect(page.locator("button button")).toHaveCount(0);
  await expect(page.locator("a button")).toHaveCount(0);
  await page.getByRole("button", { name: /^Thao tác với / }).first().click();
  await page.getByRole("menuitem", { name: "Xem chi tiết" }).click();
  await page.waitForURL(/\/owner\/venues\/\d+$/);
  const venueHref = new URL(page.url()).pathname;

  await page.goto(`${venueHref}?tab=hours`);
  await expect(page.getByText("Chủ nhật", { exact: true })).toBeVisible();
  await page.goto(`${venueHref}?tab=images`);
  await expect(page.getByRole("button", { name: "Thêm hình ảnh" })).toHaveCount(1);
  await page.goto(`${venueHref}?tab=staff`);
  await expect(page.getByRole("button", { name: "Thêm nhân viên" })).toHaveCount(1);

  await page.goto(`${venueHref}?tab=courts`);
  await page.getByRole("button", { name: /^Thao tác với / }).first().click();
  await page.getByRole("menuitem", { name: "Quản lý bảng giá" }).click();
  await page.waitForURL(/tab=pricing/);
  const pricingHref = page.url();
  await expect(page.getByRole("button", { name: "Thêm bảng giá" })).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Giá mỗi giờ" })).toHaveCount(0);
  await page.goto(pricingHref.replace("tab=pricing", "tab=schedule"));
  await expect(page.getByRole("button", { name: "Thêm lịch đóng" })).toHaveCount(1);
  await expect(page.getByRole("textbox", { name: "Đóng từ" })).toHaveCount(0);

  expect(runtimeErrors.filter((message) => message.includes("cannot be a descendant") || message.includes("nested <button>"))).toEqual([]);
  expect(runtimeWarnings.filter((message) => message.includes("PressResponder was rendered without a pressable child"))).toEqual([]);
});

test("bookings and reviews expose compact operational content", async ({ page }) => {
  await page.goto("/owner/bookings");
  await expect(page.getByRole("heading", { name: "Đơn đặt sân" })).toBeVisible();
  await expect(page.getByLabel("Cơ sở")).toBeVisible();

  await page.goto("/owner/reviews");
  await expect(page.getByRole("heading", { name: "Đánh giá" })).toBeVisible();
  await expect(page.getByLabel("Phân bố điểm đánh giá")).toBeVisible();
});

test("owner screens remain usable at narrow width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const path of ["/owner", "/owner/venues", "/owner/bookings", "/owner/reviews", "/owner/profile"]) {
    await page.goto(path);
    await expect(page.getByRole("button", { name: "Mở menu điều hướng" })).toBeVisible();
    await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  }
});
