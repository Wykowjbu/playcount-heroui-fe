import { expect, test, type Locator, type Page } from "@playwright/test";

const ok = (data: unknown) => ({ success: true, message: "ok", data, errors: [] });
const fail = (message: string) => ({ success: false, message, data: null, errors: [] });

const notifications = [
  { id: 1, type: "Booking", title: "Lịch đặt số 11", content: "Lịch đặt đang chờ thanh toán.", referenceType: "Booking", referenceId: 11, isRead: false, createdAt: "2026-07-19T08:00:00+07:00" },
  { id: 2, type: "Match", title: "Kèo đấu số 12", content: "Có cập nhật mới cho kèo đấu.", referenceType: "Match", referenceId: 12, isRead: false, createdAt: "2026-07-19T08:01:00+07:00" },
  { id: 3, type: "Venue", title: "Sân số 13", content: "Sân vừa cập nhật lịch hoạt động.", referenceType: "Venue", referenceId: 13, isRead: false, createdAt: "2026-07-19T08:02:00+07:00" },
  { id: 4, type: "Payment", title: "Thanh toán số 14", content: "Thanh toán cần được kiểm tra.", referenceType: "Payment", referenceId: 14, isRead: false, createdAt: "2026-07-19T08:03:00+07:00" },
  { id: 5, type: "Review", title: "Đánh giá mới", content: "Cảm ơn bạn đã gửi đánh giá.", referenceType: "Review", referenceId: 15, isRead: false, createdAt: "2026-07-19T08:04:00+07:00" },
  { id: 6, type: "System", title: "Thông báo hệ thống", content: "Hệ thống đã được cập nhật.", referenceType: "System", referenceId: 16, isRead: false, createdAt: "2026-07-19T08:05:00+07:00" },
];

function paged(items: unknown[], pageSize: number) {
  return { ...ok(items), totalCount: items.length, totalPages: 1, pageIndex: 1, pageSize };
}

async function expectTouchTarget(locator: Locator) {
  await expect.poll(async () => (await locator.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44);
  await expect.poll(async () => (await locator.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
}

async function mockNotifications(page: Page, options: {
  failRead?: number;
  failReadAll?: number;
  failDelete?: number;
} = {}) {
  const state = {
    fullLoads: 0,
    dropdownLoads: 0,
    readRequests: 0,
    readAllRequests: 0,
    deleteRequests: 0,
    failLists: false,
    holdLists: false,
    releaseLists: () => {},
  };
  let readFailures = options.failRead ?? 0;
  let readAllFailures = options.failReadAll ?? 0;
  let deleteFailures = options.failDelete ?? 0;
  let releaseLists!: () => void;
  let heldLists = Promise.resolve();
  state.releaseLists = () => releaseLists?.();

  await page.addInitScript(() => {
    localStorage.setItem("pc_auth", JSON.stringify({
      id: 4, email: "player@example.test", role: "player", fullName: "Nguyễn Văn A",
      accessToken: "test-access-token", refreshToken: "test-refresh-token",
    }));
    let visibility: DocumentVisibilityState = "visible";
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => visibility });
    Object.assign(window, {
      __setNotificationVisibility(next: DocumentVisibilityState) {
        visibility = next;
        document.dispatchEvent(new Event("visibilitychange"));
      },
    });
  });

  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Notifications" && request.method() === "GET") {
      const pageSize = Number(url.searchParams.get("pageSize"));
      if (pageSize === 50) state.fullLoads += 1;
      if (pageSize === 8) state.dropdownLoads += 1;
      if (state.holdLists) {
        if (!releaseLists) heldLists = new Promise<void>((resolve) => { releaseLists = resolve; });
        await heldLists;
      }
      if (state.failLists) return route.fulfill({ status: 500, json: fail("List failed") });
      return route.fulfill({ json: paged(notifications, pageSize) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: notifications.length }) });
    if (/\/api\/Notifications\/\d+\/read$/.test(url.pathname)) {
      state.readRequests += 1;
      if (readFailures > 0) {
        readFailures -= 1;
        return route.fulfill({ status: 500, json: fail("Read failed") });
      }
      return route.fulfill({ json: ok(null) });
    }
    if (url.pathname === "/api/Notifications/read-all") {
      state.readAllRequests += 1;
      if (readAllFailures > 0) {
        readAllFailures -= 1;
        return route.fulfill({ status: 500, json: fail("Read all failed") });
      }
      return route.fulfill({ json: ok(null) });
    }
    if (/\/api\/Notifications\/\d+$/.test(url.pathname) && request.method() === "DELETE") {
      state.deleteRequests += 1;
      if (deleteFailures > 0) {
        deleteFailures -= 1;
        return route.fulfill({ status: 500, json: fail("Delete failed") });
      }
      return route.fulfill({ json: ok(null) });
    }
    return route.fulfill({ json: ok([]) });
  });

  return state;
}

test("notifications: full page maps destinations and keeps row actions accessible", async ({ page }) => {
  const state = await mockNotifications(page);

  for (const [title, href] of [
    ["Lịch đặt số 11", "/bookings/11"],
    ["Kèo đấu số 12", "/matches/12"],
    ["Sân số 13", "/venues/13"],
    ["Thanh toán số 14", "/player/bookings"],
  ]) {
    await page.goto("/player/notifications");
    await page.getByText(title, { exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  }

  await page.goto("/player/notifications");
  for (const title of ["Đánh giá mới", "Thông báo hệ thống"]) {
    await page.getByText(title, { exact: true }).click();
    await expect(page).toHaveURL(/\/player\/notifications$/);
  }
  expect(state.readRequests).toBe(6);

  await expect(page.locator("main button button")).toHaveCount(0);
  const deleteButtons = page.getByRole("button", { name: /^Xóa thông báo:/ });
  await expect(deleteButtons).toHaveCount(notifications.length);
  await expectTouchTarget(deleteButtons.first());

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test("notifications: dropdown opens the full history and the page loads older pages without duplicates", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("pc_auth", JSON.stringify({
    id: 4, email: "player@example.test", role: "player", fullName: "Nguyễn Văn A", accessToken: "test", refreshToken: "test",
  })));
  const requestedPages: number[] = [];
  const pageOne = Array.from({ length: 50 }, (_, index) => ({ ...notifications[0], id: index + 1, title: `Thông báo ${index + 1}` }));
  const pageTwo = [{ ...notifications[0], id: 50, title: "Thông báo 50" }, { ...notifications[0], id: 51, title: "Thông báo cũ nhất" }];
  await page.route("http://localhost:5187/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Notifications") {
      const pageIndex = Number(url.searchParams.get("pageIndex") ?? 1);
      const pageSize = Number(url.searchParams.get("pageSize") ?? 20);
      if (pageSize === 50) requestedPages.push(pageIndex);
      const items = pageSize === 8 ? pageOne.slice(0, 8) : pageIndex === 1 ? pageOne : pageTwo;
      return route.fulfill({ json: { ...ok(items), totalCount: 51, totalPages: 2, pageIndex, pageSize } });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 51 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/venues");
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await page.getByRole("menuitem", { name: "Xem tất cả thông báo" }).click();
  await expect(page).toHaveURL(/\/player\/notifications$/);
  await expect(page.getByText("Thông báo 1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tải thêm thông báo" }).click();
  await expect(page.getByText("Thông báo cũ nhất", { exact: true })).toBeVisible();
  await expect(page.getByText("Thông báo 50", { exact: true })).toHaveCount(1);
  expect(requestedPages.filter((pageIndex) => pageIndex === 2)).toHaveLength(1);
});

test("notifications: both surfaces refresh only while visible and ignore overlapping refreshes", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-07-19T09:00:00+07:00") });
  const state = await mockNotifications(page);
  await page.goto("/player/notifications");
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toBeVisible();
  const initialFullLoads = state.fullLoads;
  const initialDropdownLoads = state.dropdownLoads;

  await page.evaluate(() => window.__setNotificationVisibility("hidden"));
  await page.clock.fastForward(60_000);
  expect(state.fullLoads).toBe(initialFullLoads);
  expect(state.dropdownLoads).toBe(initialDropdownLoads);

  state.holdLists = true;
  await page.evaluate(() => window.__setNotificationVisibility("visible"));
  await expect.poll(() => state.fullLoads).toBe(initialFullLoads + 1);
  await expect.poll(() => state.dropdownLoads).toBe(initialDropdownLoads + 1);
  await page.evaluate(() => window.__setNotificationVisibility("visible"));
  await page.waitForTimeout(100);
  expect(state.fullLoads).toBe(initialFullLoads + 1);
  expect(state.dropdownLoads).toBe(initialDropdownLoads + 1);
  state.releaseLists();
});

test("notifications: background failures preserve data and can be retried", async ({ page }) => {
  const state = await mockNotifications(page);
  await page.goto("/player/notifications");
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toBeVisible();

  state.failLists = true;
  await page.evaluate(() => window.__setNotificationVisibility("hidden"));
  await page.evaluate(() => window.__setNotificationVisibility("visible"));
  await expect(page.getByText("Không thể tải thông báo")).toBeVisible();
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toBeVisible();

  state.failLists = false;
  await page.getByRole("button", { name: "Thử tải lại thông báo" }).click();
  await expect(page.getByText("Không thể tải thông báo")).toBeHidden();

  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: /Lịch đặt số 11/ })).toBeVisible();
});

test("notifications: mutation failures stay visible, retryable, and double-submit safe", async ({ page }) => {
  const state = await mockNotifications(page, { failRead: 1, failReadAll: 1, failDelete: 1 });
  await page.goto("/player/notifications");

  await page.getByText("Đánh giá mới", { exact: true }).evaluate((element) => {
    (element.closest("button") as HTMLButtonElement).click();
    (element.closest("button") as HTMLButtonElement).click();
  });
  await expect(page.getByText("Không thể đánh dấu thông báo đã đọc")).toBeVisible();
  expect(state.readRequests).toBe(1);
  await page.getByText("Đánh giá mới", { exact: true }).click();
  await expect.poll(() => state.readRequests).toBe(2);

  await page.getByRole("button", { name: "Đọc tất cả" }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.getByText("Không thể đánh dấu tất cả đã đọc")).toBeVisible();
  expect(state.readAllRequests).toBe(1);
  await page.getByRole("button", { name: "Đọc tất cả" }).click();
  await expect.poll(() => state.readAllRequests).toBe(2);

  await page.getByRole("button", { name: "Xóa thông báo: Lịch đặt số 11" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa", exact: true }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.getByText("Không thể xóa thông báo")).toBeVisible();
  expect(state.deleteRequests).toBe(1);
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Xóa thông báo: Lịch đặt số 11" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa", exact: true }).click();
  await expect.poll(() => state.deleteRequests).toBe(2);
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toHaveCount(0);
});

test("notifications: an older page refresh cannot restore a deleted notification", async ({ page }) => {
  const state = await mockNotifications(page);
  await page.goto("/player/notifications");
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toBeVisible();
  const initialLoads = state.fullLoads;

  state.holdLists = true;
  await page.evaluate(() => window.__setNotificationVisibility("hidden"));
  await page.evaluate(() => window.__setNotificationVisibility("visible"));
  await expect.poll(() => state.fullLoads).toBe(initialLoads + 1);

  await page.getByRole("button", { name: "Xóa thông báo: Lịch đặt số 11" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xóa", exact: true }).click();
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toHaveCount(0);

  const staleResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.pathname === "/api/Notifications" && url.searchParams.get("pageSize") === "50";
  });
  state.releaseLists();
  await staleResponse;
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toHaveCount(0);
});

test("notifications: an older page refresh cannot restore unread state after mark-all", async ({ page }) => {
  const state = await mockNotifications(page);
  await page.goto("/player/notifications");
  await expect(page.getByRole("button", { name: "Đọc tất cả" })).toBeVisible();
  const initialLoads = state.fullLoads;

  state.holdLists = true;
  await page.evaluate(() => window.__setNotificationVisibility("hidden"));
  await page.evaluate(() => window.__setNotificationVisibility("visible"));
  await expect.poll(() => state.fullLoads).toBe(initialLoads + 1);
  await page.getByRole("button", { name: "Đọc tất cả" }).click();
  await expect(page.getByRole("button", { name: "Đọc tất cả" })).toHaveCount(0);

  const staleResponse = page.waitForResponse((response) => new URL(response.url()).searchParams.get("pageSize") === "50");
  state.releaseLists();
  await staleResponse;
  await expect(page.getByRole("button", { name: "Đọc tất cả" })).toHaveCount(0);
});

test("notifications: an older dropdown refresh cannot restore unread count after mark-read", async ({ page }) => {
  const state = await mockNotifications(page);
  await page.goto("/venues");
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(page.getByText("6 chưa đọc", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  const initialLoads = state.dropdownLoads;

  state.holdLists = true;
  await page.evaluate(() => window.__setNotificationVisibility("hidden"));
  await page.evaluate(() => window.__setNotificationVisibility("visible"));
  await expect.poll(() => state.dropdownLoads).toBe(initialLoads + 1);
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await page.getByRole("menuitem", { name: /Đánh giá mới/ }).click();
  await expect.poll(() => state.readRequests).toBe(1);

  const staleResponse = page.waitForResponse((response) => new URL(response.url()).searchParams.get("pageSize") === "8");
  state.releaseLists();
  await staleResponse;
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(page.getByText("5 chưa đọc", { exact: true })).toBeVisible();
});

test("notifications: routed page reads remain visible and retry before navigation", async ({ page }) => {
  await mockNotifications(page, { failRead: 1 });
  await page.goto("/player/notifications");

  await page.getByText("Lịch đặt số 11", { exact: true }).click();
  await expect(page.getByText("Không thể đánh dấu thông báo đã đọc")).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/player\/notifications$/);

  await page.getByText("Lịch đặt số 11", { exact: true }).click();
  await expect(page).toHaveURL(/\/bookings\/11$/);
});

test("notifications: routed dropdown reads reopen the retry surface before navigation", async ({ page }) => {
  await mockNotifications(page, { failRead: 1 });
  await page.goto("/venues");
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await page.getByRole("menuitem", { name: /Lịch đặt số 11/ }).click();

  await expect(page).toHaveURL(/\/venues$/);
  await expect(page.getByRole("status")).toHaveText("Không thể đánh dấu thông báo đã đọc.");
  await page.getByRole("menuitem", { name: /Lịch đặt số 11/ }).click();
  await expect(page).toHaveURL(/\/bookings\/11$/);
});

test("notifications: initial failures show retry without false empty states", async ({ page }) => {
  const state = await mockNotifications(page);
  state.failLists = true;
  await page.goto("/player/notifications");

  await expect(page.getByText("Không thể tải thông báo", { exact: true })).toBeVisible();
  await expect(page.getByText("Không có thông báo nào", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Không thể tải thông báo.");
  await expect(page.getByText("Chưa có thông báo", { exact: true })).toHaveCount(0);

  state.failLists = false;
  await page.getByRole("menuitem", { name: "Thử lại", exact: true }).click();
  await page.getByRole("button", { name: "Thử tải lại thông báo" }).click();
  await expect(page.getByText("Lịch đặt số 11", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Thông báo", exact: true }).click();
  await expect(page.getByRole("menuitem", { name: /Lịch đặt số 11/ })).toBeVisible();
});

declare global {
  interface Window {
    __setNotificationVisibility(next: DocumentVisibilityState): void;
  }
}
