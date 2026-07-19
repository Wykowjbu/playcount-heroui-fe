import { expect, test, type Page } from "@playwright/test";

const notification = {
  id: 100, type: "Booking", title: "Có đơn đặt sân mới", content: "Đơn #42 đang chờ bạn xác nhận.",
  referenceType: "Booking", referenceId: 42, isRead: false, createdAt: "2026-07-18T09:00:00+07:00",
};
const booking = {
  id: 42, courtId: 1, courtName: "Sân cầu lông 1", venueId: 1, venueName: "An Phú Sports Center",
  userProfileId: 2, playerName: "Nguyễn Văn A", startAt: "2026-07-20T09:00:00+07:00",
  endAt: "2026-07-20T10:00:00+07:00", totalPrice: 200000, platformFee: 20000,
  ownerEarnings: 180000, status: "Pending", note: null, createdAt: "2026-07-18T09:00:00+07:00", updatedAt: null,
};
const venue = {
  id: 1, courtOwnerProfileId: 1, name: "An Phú Sports Center", description: null, address: "Đà Nẵng",
  latitude: null, longitude: null, phone: null, openTime: "06:00:00", closeTime: "22:00:00",
  status: "Active", createdAt: "2026-01-01T00:00:00+07:00", updatedAt: null,
  images: [], amenities: [], openingHours: [],
};
const ok = (data: unknown) => ({ success: true, message: "", data, errors: [] });

async function mockOwnerNotificationApis(page: Page, { readFails = false } = {}) {
  let readRequests = 0;
  let remainingReadFailures = readFails ? 1 : 0;
  await page.route(/\/api\/Notifications\?.*$/, (route) => route.fulfill({ json: ok([notification]) }));
  await page.route(/\/api\/Notifications\/unread-count$/, (route) => route.fulfill({ json: ok({ count: 1 }) }));
  await page.route(/\/api\/Notifications\/100\/read$/, (route) => {
    readRequests += 1;
    if (remainingReadFailures > 0) {
      remainingReadFailures -= 1;
      return route.fulfill({ status: 500, json: { success: false, message: "Read failed", data: null, errors: [] } });
    }
    return route.fulfill({ json: ok({ ...notification, isRead: true }) });
  });
  await page.route(/\/api\/Notifications\/read-all$/, (route) => route.fulfill({ json: ok({ updatedCount: 1 }) }));
  await page.route(/\/api\/Venues\/my$/, (route) => route.fulfill({ json: ok([venue]) }));
  await page.route(/\/api\/venues\/1\/bookings(?:\?.*)?$/, (route) => route.fulfill({ json: ok([]) }));
  await page.route(/\/api\/Bookings\/42$/, (route) => route.fulfill({ json: ok(booking) }));
  await page.route(/\/api\/Payments\/bookings\/42$/, (route) => route.fulfill({ json: ok([]) }));
  return () => readRequests;
}

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.title.includes("notification")) {
    await page.addInitScript(() => {
      localStorage.setItem("pc_auth", JSON.stringify({
        id: 1,
        email: "owner@example.com",
        role: "owner",
        fullName: "Nguyễn Đức Thành",
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
      }));
    });
    return;
  }

  await page.goto("/login");
  await page.getByRole("textbox", { name: "Email*" }).fill("owner01@gmail.com");
  await page.getByRole("textbox", { name: "Mật khẩu" }).fill("admin123456");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await page.waitForURL((url) => url.pathname !== "/login");
});

test("owner notification opens referenced booking drawer", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await mockOwnerNotificationApis(page);

  await page.goto("/owner/bookings");
  await page.getByRole("button", { name: "Thông báo" }).click();
  await expect(page.getByText("Có đơn đặt sân mới", { exact: true })).toBeVisible();
  await expect(page.locator("time")).toHaveAttribute("datetime", notification.createdAt);
  await page.screenshot({ path: "test-results/owner-notification-panel.png", fullPage: true });
  await page.getByRole("menuitem", { name: /Có đơn đặt sân mới/ }).click();

  await expect(page).toHaveURL(/\/owner\/bookings\?bookingId=42$/);
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  const drawerBox = await page.getByRole("dialog", { name: "Chi tiết đơn #42" }).boundingBox();
  expect(drawerBox?.width).toBeGreaterThan(600);
  await page.screenshot({ path: "test-results/owner-notification-drawer.png", fullPage: true });

  await page.goto("/owner/bookings?status=Pending&bookingId=42");
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  await page.locator('[data-slot="drawer-close-trigger"]').click();
  await expect(page).toHaveURL(/\/owner\/bookings\?status=Pending$/);
});

test("owner notification keyboard navigation retries a failed read receipt before routing", async ({ page }) => {
  const readRequests = await mockOwnerNotificationApis(page, { readFails: true });
  await page.goto("/owner/bookings");
  await page.getByRole("button", { name: "Thông báo" }).click();
  const item = page.getByRole("menuitem", { name: /Có đơn đặt sân mới/ });
  await item.focus();
  await item.press("Enter");
  await expect(page).toHaveURL(/\/owner\/bookings$/);
  await expect(page.getByRole("status")).toHaveText("Không thể đánh dấu thông báo đã đọc.");
  await item.focus();
  await item.press("Enter");
  await expect(page).toHaveURL(/\/owner\/bookings\?bookingId=42$/);
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  expect(readRequests()).toBe(2);
});

test("owner notification direct booking handles errors and browser history", async ({ page }) => {
  await mockOwnerNotificationApis(page);
  await page.route(/\/api\/Bookings\/404$/, (route) => route.fulfill({
    status: 404, json: { success: false, message: "Booking not found.", data: null, errors: [] },
  }));

  await page.goto("/owner/bookings?bookingId=bad");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/owner/bookings?bookingId=404");
  await expect(page.getByText("Đơn đặt sân không tồn tại hoặc đã bị xóa.", { exact: true })).toBeVisible();
  await page.goto("/owner/bookings?bookingId=42");
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  await page.goBack();
  await expect(page.getByText("Đơn đặt sân không tồn tại hoặc đã bị xóa.", { exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
});

test("owner notification drawer stays within a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockOwnerNotificationApis(page);
  await page.goto("/owner/bookings?bookingId=42");
  const drawer = page.getByRole("dialog", { name: "Chi tiết đơn #42" });
  await expect(drawer).toBeVisible();
  expect((await drawer.boundingBox())?.width).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("owner notification panel announces list and mark-all errors", async ({ page }) => {
  await mockOwnerNotificationApis(page);
  await page.unroute(/\/api\/Notifications\?.*$/);
  await page.route(/\/api\/Notifications\?.*$/, (route) => route.fulfill({
    status: 500, json: { success: false, message: "List failed", data: null, errors: [] },
  }));
  await page.goto("/owner/bookings");
  await page.getByRole("button", { name: "Thông báo" }).click();
  await expect(page.getByRole("status")).toHaveText("Không thể tải thông báo.");

  await page.unroute(/\/api\/Notifications\?.*$/);
  await page.route(/\/api\/Notifications\?.*$/, (route) => route.fulfill({ json: ok([notification]) }));
  await page.unroute(/\/api\/Notifications\/read-all$/);
  let readAllRequests = 0;
  await page.route(/\/api\/Notifications\/read-all$/, (route) => {
    readAllRequests += 1;
    return route.fulfill(readAllRequests === 1
      ? { status: 500, json: { success: false, message: "Read all failed", data: null, errors: [] } }
      : { json: ok({ updatedCount: 1 }) });
  });
  await page.reload();
  await page.getByRole("button", { name: "Thông báo" }).click();
  const readAll = page.getByRole("menuitem", { name: "Đánh dấu tất cả đã đọc" });
  await readAll.click();
  await page.waitForTimeout(500);
  await expect(page.getByRole("status")).toHaveText("Không thể đánh dấu tất cả đã đọc.");
  await expect(readAll).toBeVisible();
  await readAll.focus();
  await readAll.press("Enter");
  await expect.poll(() => readAllRequests).toBe(2);
  await page.getByRole("button", { name: "Thông báo" }).click();
  await expect(page.getByRole("menuitem", { name: "Đánh dấu tất cả đã đọc" })).toHaveCount(0);
});

test("owner notification ignores a stale direct-booking response", async ({ page }) => {
  await mockOwnerNotificationApis(page);
  let markRequestStarted!: () => void;
  let releaseStaleRequest!: () => void;
  const requestStarted = new Promise<void>((resolve) => { markRequestStarted = resolve; });
  const staleRequestReleased = new Promise<void>((resolve) => { releaseStaleRequest = resolve; });
  await page.route(/\/api\/Bookings\/41$/, async (route) => {
    markRequestStarted();
    await staleRequestReleased;
    await route.fulfill({ json: ok({ ...booking, id: 41 }) });
  });
  await page.goto("/owner/bookings?bookingId=41");
  await requestStarted;
  await page.getByRole("button", { name: "Thông báo" }).click();
  await page.getByRole("menuitem", { name: /Có đơn đặt sân mới/ }).click();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  const staleResponse = page.waitForResponse(/\/api\/Bookings\/41$/);
  releaseStaleRequest();
  await staleResponse;
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #42" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Chi tiết đơn #41" })).toHaveCount(0);
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
