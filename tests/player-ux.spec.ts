import { expect, test } from "@playwright/test";

test("register tab states account-creation task and keeps usable controls", async ({ page }) => {
  await page.goto("/login");

  await page.getByRole("tab", { name: "Đăng ký" }).click();

  await expect(page.getByRole("heading", { name: "Tạo tài khoản PlayCourt" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Mật khẩu*", exact: true })).toHaveAttribute("type", "password");
  await expect(page.getByRole("button", { name: "Hiện mật khẩu" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng ký" })).toBeVisible();
});

test("desktop venue page exposes one filter system", async ({ page }) => {
  await page.goto("/venues");

  await expect(page.getByText("Môn thể thao", { exact: true })).toHaveCount(1);
});

test("venue breadcrumb returns to venue results, not a city anchor", async ({ page }) => {
  await page.goto("/venues/1");

  await expect(page.getByRole("link", { name: "Hồ Chí Minh" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Danh sách sân" })).toHaveAttribute("href", "/venues");
});

test("creating a match opens an in-place dialog", async ({ page }) => {
  await page.goto("/matches");

  await page.getByRole("button", { name: "Tạo kèo mới" }).first().click();

  const dialog = page.getByRole("dialog", { name: "Tạo kèo mới" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Nhập thông tin để tìm người chơi phù hợp.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Hủy" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Tạo kèo đấu" })).toBeVisible();
});
