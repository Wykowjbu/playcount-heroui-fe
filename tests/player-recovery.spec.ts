import { expect, test, type Locator, type Page } from "@playwright/test";

const ok = (data: unknown) => ({ success: true, message: "ok", data, errors: [] });
const fail = (message: string) => ({ success: false, message, data: null, errors: [] });

const profile = {
  userId: 4, profileId: 4, email: "player@example.test", phone: null, role: "Player", status: "Active",
  isEmailVerified: true, fullName: "Nguyễn Văn A", avatarUrl: null, dateOfBirth: null, gender: null,
  address: null, city: null, country: null, courtOwnerProfile: null,
};
const playerSport = {
  id: 9, sportId: 2, sportCode: "BADMINTON", sportName: "Cầu lông", skillLevel: "Intermediate",
  createdAt: "2026-07-01T00:00:00Z",
};
const venue = {
  id: 1, courtOwnerProfileId: 1, name: "Sân An Phú", description: null, address: "120 Hải Phòng, Đà Nẵng",
  latitude: null, longitude: null, phone: null, openTime: "06:00:00", closeTime: "22:00:00",
  status: "Active", createdAt: "2026-01-01T00:00:00Z", updatedAt: null, images: [], amenities: [], openingHours: [],
};

async function authenticate(page: Page) {
  await page.addInitScript(() => localStorage.setItem("pc_auth", JSON.stringify({
    id: 4, email: "player@example.test", role: "player", fullName: "Nguyễn Văn A",
    accessToken: "test", refreshToken: "test",
  })));
}

async function expectTouchTarget(locator: Locator) {
  await expect.poll(async () => (await locator.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44);
  await expect.poll(async () => (await locator.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
}

test("profile recovery: sport deletion confirms, retries failure, and mobile security stays usable", async ({ page }) => {
  await authenticate(page);
  let sportPresent = true;
  let deleteRequests = 0;
  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Users/me") return route.fulfill({ json: ok(profile) });
    if (url.pathname === "/api/Users/me/sports" && request.method() === "GET") return route.fulfill({ json: ok(sportPresent ? [playerSport] : []) });
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([{ id: 2, code: "BADMINTON", name: "Cầu lông" }]) });
    if (url.pathname === "/api/Users/me/sports/2" && request.method() === "DELETE") {
      deleteRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (deleteRequests === 1) return route.fulfill({ status: 500, json: fail("Delete failed") });
      sportPresent = false;
      return route.fulfill({ json: ok(null) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/player/profile");
  await page.getByRole("tab", { name: "Môn thể thao" }).click();
  await page.getByRole("button", { name: "Xóa Cầu lông" }).click();
  const dialog = page.getByRole("dialog", { name: "Xóa môn thể thao" });
  await expect(dialog.getByText("Cầu lông", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Xóa", exact: true }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(dialog.getByText("Không thể xóa môn thể thao")).toBeVisible();
  expect(deleteRequests).toBe(1);
  await expect(page.getByRole("tabpanel").getByText("Cầu lông", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Thử xóa lại" }).click();
  await expect.poll(() => deleteRequests).toBe(2);
  await expect(page.getByRole("tabpanel").getByText("Cầu lông", { exact: true })).toHaveCount(0);

  await page.getByRole("tab", { name: "Bảo mật" }).click();
  await expect(page.getByRole("link", { name: "Đi đến cài đặt bảo mật" })).toHaveAttribute("href", "/player/settings");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("favorites recovery: removal is sibling, guarded, retryable, and mobile safe", async ({ page }) => {
  await authenticate(page);
  let removeRequests = 0;
  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Venues/favorites/my") return route.fulfill({ json: ok([venue]) });
    if (url.pathname === "/api/Venues/1/favorites" && request.method() === "DELETE") {
      removeRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return route.fulfill(removeRequests === 1 ? { status: 500, json: fail("Remove failed") } : { json: ok(null) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/player/favorites");
  const remove = page.getByRole("button", { name: "Xóa Sân An Phú khỏi yêu thích" });
  await expectTouchTarget(remove);
  await expect(page.locator("a button")).toHaveCount(0);
  await remove.evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  const pendingRemove = page.getByRole("button", { name: "Đang xóa Sân An Phú khỏi yêu thích" });
  await expect(pendingRemove).toBeVisible();
  await expectTouchTarget(pendingRemove);
  await expect(page.getByText("Không thể xóa khỏi yêu thích")).toBeVisible();
  expect(removeRequests).toBe(1);
  await expect(page.getByText("Sân An Phú", { exact: true })).toBeVisible();
  await remove.click();
  await expect.poll(() => removeRequests).toBe(2);
  await expect(page.getByText("Sân An Phú", { exact: true })).toHaveCount(0);
  const explore = page.getByRole("button", { name: "Khám phá sân bãi" });
  await expect(explore).toBeVisible();
  await expect(page.locator("a button")).toHaveCount(0);
  await explore.click();
  await expect(page).toHaveURL(/\/venues$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("favorites recovery: initial load failure is retryable without showing a false empty state", async ({ page }) => {
  await authenticate(page);
  let getRequests = 0;
  await page.route("http://localhost:5187/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Venues/favorites/my") {
      getRequests += 1;
      return route.fulfill(getRequests === 1
        ? { status: 500, json: fail("Load failed") }
        : { json: ok([venue]) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/player/favorites");
  await expect(page.getByText("Không thể tải danh sách yêu thích")).toBeVisible();
  await expect(page.getByText("Bạn chưa lưu sân nào")).toHaveCount(0);
  await page.getByRole("button", { name: "Thử tải lại sân yêu thích" }).click();
  await expect(page.getByText("Sân An Phú", { exact: true })).toBeVisible();
  expect(getRequests).toBe(2);
});

test("favorites recovery: a stale refresh cannot restore a venue deleted while it was loading", async ({ page }) => {
  await authenticate(page);
  let getRequests = 0;
  let refreshFulfilled = false;
  let releaseRefresh!: () => void;
  const refreshResponse = new Promise<void>((resolve) => { releaseRefresh = resolve; });
  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Venues/favorites/my") {
      getRequests += 1;
      const requestNumber = getRequests;
      if (requestNumber === 2) await refreshResponse;
      await route.fulfill({ json: ok([venue]) });
      if (requestNumber === 2) refreshFulfilled = true;
      return;
    }
    if (url.pathname === "/api/Venues/1/favorites" && request.method() === "DELETE") {
      return route.fulfill({ json: ok(null) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/player/favorites");
  await expect(page.getByText("Sân An Phú", { exact: true })).toBeVisible();
  expect(getRequests).toBe(1);
  await page.getByRole("button", { name: "Làm mới" }).click();
  await expect.poll(() => getRequests).toBe(2);
  await page.getByRole("button", { name: "Xóa Sân An Phú khỏi yêu thích" }).click();
  await expect(page.getByText("Sân An Phú", { exact: true })).toHaveCount(0);
  releaseRefresh();
  await expect.poll(() => refreshFulfilled).toBe(true);
  await expect(page.getByText("Sân An Phú", { exact: true })).toHaveCount(0);
});

test("payment recovery: return page rejects invalid IDs and explains failed payments", async ({ page }) => {
  await authenticate(page);
  let syncRequests = 0;
  await page.route("http://localhost:5187/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Payments/bookings/17/sync-payos") {
      syncRequests += 1;
      return route.fulfill({ json: ok({ id: 1, bookingId: 17, amount: 100000, provider: "PayOS", status: "Failed", transactionCode: null, type: "Booking", currency: "VND", note: null, createdAt: "2026-07-19T00:00:00Z", paidAt: null, updatedAt: null }) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/payments/return?bookingId=bad&orderCode=17");
  await expect(page.getByRole("heading", { name: "Không thể xác định đặt sân" })).toBeVisible();
  await expect(page.getByRole("link", { name: /danh sách đặt sân/i })).toHaveAttribute("href", "/player/bookings");
  await expect(page.getByText("Thanh toán thành công!", { exact: true })).toHaveCount(0);
  expect(syncRequests).toBe(0);

  await page.goto("/payments/return?bookingId=17");
  await expect(page.getByRole("heading", { name: "Thanh toán chưa thành công" })).toBeVisible();
  await expect(page.getByRole("link", { name: /chi tiết đặt sân/i })).toHaveAttribute("href", "/bookings/17");
  await expect(page.getByText("Thanh toán thành công!", { exact: true })).toHaveCount(0);
  expect(syncRequests).toBe(1);
});

test("payment recovery: query changes sync once and stale responses cannot overwrite the latest result", async ({ page }) => {
  await authenticate(page);
  const syncRequests = new Map<number, number>();
  let releaseFirst!: () => void;
  const firstResponse = new Promise<void>((resolve) => { releaseFirst = resolve; });
  await page.route("http://localhost:5187/api/**", async (route) => {
    const url = new URL(route.request().url());
    const match = url.pathname.match(/^\/api\/Payments\/bookings\/(\d+)\/sync-payos$/);
    if (match) {
      const bookingId = Number(match[1]);
      const count = (syncRequests.get(bookingId) ?? 0) + 1;
      syncRequests.set(bookingId, count);
      if (bookingId === 17 && count === 1) await firstResponse;
      const status = bookingId === 18 ? "Success" : "Failed";
      return route.fulfill({ json: ok({ id: bookingId, bookingId, amount: 100000, provider: "PayOS", status, transactionCode: null, type: "Booking", currency: "VND", note: null, createdAt: "2026-07-19T00:00:00Z", paidAt: null, updatedAt: null }) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/payments/return?bookingId=17");
  await expect.poll(() => syncRequests.get(17) ?? 0).toBe(1);
  await page.evaluate(() => history.pushState(null, "", "/payments/return?bookingId=18"));
  await expect(page.getByRole("heading", { name: "Thanh toán thành công!" })).toBeVisible();
  expect(syncRequests.get(18)).toBe(1);

  await page.evaluate(() => history.pushState(null, "", "/payments/return?bookingId=17"));
  await expect(page.getByText("Đang xác nhận thanh toán...")).toBeVisible();
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  expect(syncRequests.get(17)).toBe(1);
  releaseFirst();
  await expect(page.getByRole("heading", { name: "Thanh toán chưa thành công" })).toBeVisible();

  await page.evaluate(() => history.pushState(null, "", "/payments/return?bookingId=bad"));
  await expect(page.getByRole("heading", { name: "Không thể xác định đặt sân" })).toBeVisible();
  await expect(page.getByText("Thanh toán thành công!", { exact: true })).toHaveCount(0);
  expect(syncRequests.get(17)).toBe(1);
  expect(syncRequests.get(18)).toBe(1);

  await page.evaluate(() => history.pushState(null, "", "/payments/return?bookingId=17"));
  await expect.poll(() => syncRequests.get(17) ?? 0).toBe(2);
  await expect(page.getByRole("heading", { name: "Thanh toán chưa thành công" })).toBeVisible();
});

test("payment recovery: cancel page distinguishes missing context and links valid booking recovery", async ({ page }) => {
  await authenticate(page);
  await page.route("http://localhost:5187/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/payments/cancel?orderCode=999");
  await expect(page.getByRole("heading", { name: "Không thể xác định đặt sân" })).toBeVisible();
  await expect(page.getByRole("link", { name: /danh sách đặt sân/i })).toHaveAttribute("href", "/player/bookings");
  await expect(page.getByRole("link", { name: /chi tiết đặt sân/i })).toHaveCount(0);

  await page.goto("/payments/cancel?bookingId=17");
  await expect(page.getByRole("heading", { name: "Thanh toán đã bị hủy" })).toBeVisible();
  await expect(page.getByRole("link", { name: /chi tiết đặt sân/i })).toHaveAttribute("href", "/bookings/17");
});
