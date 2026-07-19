import { expect, test, type Locator, type Page, type Request } from "@playwright/test";

const ok = (data: unknown) => ({ success: true, message: "", data, errors: [] });
const paged = (data: unknown[], pageSize: number) => ({
  ...ok(data), totalCount: data.length, totalPages: 1, pageIndex: 1, pageSize,
});

const profile = (city: string | null) => ({
  userId: 4, profileId: 4, email: "player@example.test", phone: null,
  role: "Player", status: "Active", isEmailVerified: true,
  fullName: "Nguyễn Văn A", avatarUrl: null, dateOfBirth: null,
  gender: null, address: null, city, country: null, courtOwnerProfile: null,
});

const sport = { id: 1, code: "FOOTBALL", name: "Bóng đá", description: null, playerCount: 10, isActive: true };

function venue(id: number, latitude: number, longitude = 106.7) {
  return {
    id, courtOwnerProfileId: 1, name: `Sân ${id}`, description: null,
    address: `Địa chỉ ${id}, Đà Nẵng`, latitude, longitude, phone: null,
    openTime: "00:00:00", closeTime: "23:59:59", status: "Active",
    createdAt: "2026-07-18T00:00:00Z", updatedAt: null, images: [], amenities: [], openingHours: [],
  };
}

async function mockHome(page: Page, options: {
  city?: string | null;
  sports?: unknown[];
  venues?: ReturnType<typeof venue>[];
  initialVenues?: ReturnType<typeof venue>[];
  failInitialVenues?: boolean;
  failSportPosts?: number;
  onSportPost?: (request: Request, attempt: number) => Promise<void> | void;
  onVenueResponse?: (url: URL) => void;
  venueTotalPages?: number;
  venueTotalCount?: number;
  onRequest?: (request: Request) => Promise<void> | void;
} = {}) {
  let remainingSportPostFailures = options.failSportPosts ?? 0;
  let sportPostAttempts = 0;
  await page.addInitScript(() => {
    localStorage.setItem("pc_auth", JSON.stringify({
      id: 4, email: "player@example.test", role: "player", fullName: "Nguyễn Văn A",
      accessToken: "test-access-token", refreshToken: "test-refresh-token",
    }));
  });
  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Users/me/sports" && request.method() === "POST") {
      sportPostAttempts += 1;
      await options.onSportPost?.(request, sportPostAttempts);
      if (remainingSportPostFailures > 0) {
        remainingSportPostFailures -= 1;
        return route.fulfill({ status: 500, json: { success: false, message: "Không thể lưu môn thể thao.", data: null, errors: [] } });
      }
    }
    await options.onRequest?.(request);
    if (url.pathname === "/api/Users/me") return route.fulfill({ json: ok(profile(options.city ?? null)) });
    if (url.pathname === "/api/Users/me/sports") return route.fulfill({ json: ok(options.sports ?? []) });
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([sport]) });
    if (url.pathname === "/api/Venues") {
      const pageSize = Number(url.searchParams.get("PageSize") ?? 6);
      if (pageSize === 6 && options.failInitialVenues) {
        await route.fulfill({ status: 500, json: { success: false, message: "Initial venues failed", data: null, errors: [] } });
        options.onVenueResponse?.(url);
        return;
      }
      const items = pageSize === 50 ? options.venues : options.initialVenues ?? options.venues;
      const response = paged(items ?? [venue(1, 16.06)], pageSize);
      response.totalPages = options.venueTotalPages ?? response.totalPages;
      response.totalCount = options.venueTotalCount ?? response.totalCount;
      await route.fulfill({ json: response });
      options.onVenueResponse?.(url);
      return;
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
}

async function expectTouchTarget(locator: Locator) {
  await expect.poll(async () => (await locator.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(44);
  await expect.poll(async () => (await locator.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(44);
}

async function mockMapbox(page: Page, autoLoad = true) {
  await page.route("https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.css", (route) => route.fulfill({ contentType: "text/css", body: "" }));
  await page.addInitScript((shouldAutoLoad) => {
    const markers: HTMLElement[] = [];
    class MapMock {
      private listeners = new Map<string, Set<() => void>>();
      constructor() {
        testState.constructions += 1;
        testState.maps.push(this);
        if (shouldAutoLoad) queueMicrotask(() => this.emit("load"));
      }
      addControl() {}
      fitBounds() {}
      flyTo() {}
      on(event: string, listener: () => void) {
        const listeners = this.listeners.get(event) ?? new Set();
        listeners.add(listener);
        this.listeners.set(event, listeners);
      }
      off(event: string, listener: () => void) { this.listeners.get(event)?.delete(listener); }
      emit(event: string) { this.listeners.get(event)?.forEach((listener) => listener()); }
      remove() { markers.forEach((marker) => marker.remove()); }
    }
    class MarkerMock {
      constructor(private element = document.createElement("div")) {}
      setLngLat() { return this; }
      addTo() {
        markers.push(this.element);
        this.element.style.position = "absolute";
        this.element.style.left = `${80 + markers.length * 60}px`;
        this.element.style.top = "180px";
        this.element.style.zIndex = "5";
        document.querySelector('[data-testid="venue-results-map"]')?.append(this.element);
        return this;
      }
      remove() { this.element.remove(); }
    }
    class BoundsMock {
      extend() { return this; }
    }
    const testState = { constructions: 0, maps: [] as MapMock[] };
    Object.assign(window, {
      __mapboxTest: testState,
      mapboxgl: {
        accessToken: "",
        Map: MapMock,
        Marker: MarkerMock,
        NavigationControl: class {},
        LngLatBounds: BoundsMock,
      },
    });
  }, autoLoad);
}

async function mockAuth(page: Page, role: "player" | "admin") {
  await page.addInitScript((authRole) => {
    localStorage.setItem("pc_auth", JSON.stringify({
      id: 4,
      email: "player@example.test",
      role: authRole,
      fullName: "Nguyễn Văn A",
      accessToken: "test-access-token",
      refreshToken: "test-refresh-token",
    }));
  }, role);
  await page.route("http://localhost:5187/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/Users/me") {
      return route.fulfill({ json: ok({
        userId: 4, profileId: 4, email: "player@example.test", phone: null,
        role: "Player", status: "Active", isEmailVerified: true,
        fullName: "Nguyễn Văn A", avatarUrl: null, dateOfBirth: null,
        gender: null, address: null, city: null, country: null,
        courtOwnerProfile: null,
      }) });
    }
    if (path === "/api/Notifications/unread-count") {
      return route.fulfill({ json: ok({ count: 0 }) });
    }
    return route.fulfill({ json: ok([]) });
  });
}

test("player navigation uses the player route hierarchy", async ({ page }) => {
  await mockAuth(page, "player");
  await page.goto("/venues");

  const header = page.locator("header nav");
  const logo = header.locator('a[href="/"]').first();
  await expect(logo).toHaveAttribute("href", "/");
  await expectTouchTarget(logo);
  for (const [label, href] of [
    ["Sân bãi", "/venues"],
    ["Kèo đấu", "/matches"],
    ["Lịch đặt", "/player/bookings"],
    ["Yêu thích", "/player/favorites"],
  ]) {
    const link = header.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expectTouchTarget(link);
  }
  await page.evaluate(() => window.history.pushState(null, "", "/player/matches"));
  await expect(header.getByRole("link", { name: "Kèo đấu", exact: true })).toHaveAttribute("aria-current", "page");
  await page.evaluate(() => window.history.pushState(null, "", "/venues"));

  await page.setViewportSize({ width: 390, height: 844 });
  const mobileNav = page.getByRole("navigation", { name: "Điều hướng nhanh" });
  for (const [label, href] of [
    ["Sân bãi", "/venues"],
    ["Kèo đấu", "/matches"],
    ["Lịch đặt", "/player/bookings"],
    ["Tôi", "/player/profile"],
  ]) {
    const link = mobileNav.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expectTouchTarget(link);
  }
  await expect(mobileNav.getByRole("link", { name: "Sân bãi", exact: true })).toHaveAttribute("aria-current", "page");
  await page.evaluate(() => window.history.pushState(null, "", "/player/matches"));
  await expect(mobileNav.getByRole("link", { name: "Kèo đấu", exact: true })).toHaveAttribute("aria-current", "page");
  await expectTouchTarget(logo);

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/player/profile");
  for (const [label, href] of [
    ["Lịch đặt của tôi", "/player/bookings"],
    ["Kèo đấu của tôi", "/player/matches"],
    ["Sân yêu thích", "/player/favorites"],
  ]) {
    const link = page.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", href);
    await expectTouchTarget(link);
  }

  await page.goto("/venues");
  await page.evaluate(() => window.history.pushState(null, "", "/venues/4"));
  await expect(header.getByRole("link", { name: "Sân bãi", exact: true })).toHaveAttribute("aria-current", "page");
});

test("admin navigation exposes exactly one current link", async ({ page }) => {
  await mockAuth(page, "admin");
  await page.goto("/admin/venues");

  const currentLinks = page.locator('a[aria-current="page"]');
  await expect(currentLinks).toHaveCount(1);
  await expect(currentLinks).toHaveAttribute("href", "/admin/venues");
});

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
  await expect(page.locator("a button")).toHaveCount(0);
});

test("venue list map defaults to list and keeps desktop list context beside the map", async ({ page }) => {
  await mockMapbox(page);
  await mockHome(page, { venues: [venue(1, 16.06), venue(2, 16.08), venue(3, Number.NaN)] });
  await page.goto("/venues");

  await expect(page.getByRole("tab", { name: "Danh sách" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("heading", { name: "Sân 1" })).toBeVisible();
  await expect(page.getByText(/^0(?:\.0)?(?:\s|$)/)).toHaveCount(0);

  await page.getByRole("tab", { name: "Bản đồ" }).click();

  await expect(page.getByTestId("venue-results-map")).toBeVisible();
  await expect(page.getByRole("region", { name: "Danh sách sân cạnh bản đồ" })).toContainText("Sân 1");
  await expect(page.getByRole("button", { name: "Chọn Sân 1" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn Sân 3" })).toHaveCount(0);
});

test("venue list map is map-forward on mobile with a selected card and persistent list return", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockMapbox(page);
  await mockHome(page, { venues: [venue(1, 16.06), venue(2, 16.08)] });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  const returnButton = page.getByRole("button", { name: "Xem danh sách" });
  await expectTouchTarget(returnButton);
  await page.getByRole("button", { name: "Chọn Sân 2" }).click();
  await expect(page.getByTestId("selected-venue-card")).toContainText("Sân 2");
  await expect(page.getByTestId("selected-venue-card")).toContainText("Địa chỉ 2");
  await returnButton.click();
  await expect(page.getByRole("tab", { name: "Danh sách" })).toHaveAttribute("aria-selected", "true");
});

test("venue list map gives textual fallbacks for loading and venues without coordinates", async ({ page }) => {
  await mockMapbox(page);
  await mockHome(page, { venues: [venue(3, Number.NaN)] });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  await expect(page.getByText("Không có sân nào có tọa độ để hiển thị trên bản đồ.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Xem danh sách" })).toBeVisible();
});

test("venue list map shows loading and retries an actionable Mapbox load error", async ({ page }) => {
  let scripts = 0;
  let stylesheets = 0;
  await page.route("https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.css", (route) => {
    stylesheets += 1;
    return stylesheets === 1 ? route.abort() : route.fulfill({ contentType: "text/css", body: "" });
  });
  await page.route("https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.js", async (route) => {
    scripts += 1;
    if (scripts === 1) return route.abort();
    return route.fulfill({
      contentType: "application/javascript",
      body: `window.__mapboxConstructions=0;window.mapboxgl={accessToken:"",Map:class{constructor(){window.__mapboxConstructions++;this.l={};queueMicrotask(()=>this.emit("load"))}on(e,f){(this.l[e]??=new Set).add(f)}off(e,f){this.l[e]?.delete(f)}emit(e){this.l[e]?.forEach(f=>f())}addControl(){}fitBounds(){}flyTo(){}remove(){}},Marker:class{constructor(e){this.e=e}setLngLat(){return this}addTo(){return this}remove(){}},NavigationControl:class{},LngLatBounds:class{extend(){return this}}}`,
    });
  });
  await mockHome(page, { venues: [venue(1, 16.06)] });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  await expect(page.getByText("Không tải được bản đồ.")).toBeVisible();
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByTestId("venue-results-map")).toHaveAttribute("data-map-status", "ready");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __mapboxConstructions: number }).__mapboxConstructions)).toBe(1);
  expect(scripts).toBe(2);
  expect(stylesheets).toBe(2);
});

test("venue list map waits for staggered resources to settle before offering one-click retry", async ({ page }) => {
  let scripts = 0;
  let stylesheets = 0;
  let releaseScript!: () => void;
  const scriptGate = new Promise<void>((resolve) => { releaseScript = resolve; });
  await page.route("https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.css", (route) => {
    stylesheets += 1;
    return stylesheets === 1 ? route.abort() : route.fulfill({ contentType: "text/css", body: "" });
  });
  await page.route("https://api.mapbox.com/mapbox-gl-js/v3.13.0/mapbox-gl.js", async (route) => {
    scripts += 1;
    await scriptGate;
    return route.fulfill({
      contentType: "application/javascript",
      body: `window.__mapboxConstructions=0;window.mapboxgl={accessToken:"",Map:class{constructor(){window.__mapboxConstructions++;this.l={};queueMicrotask(()=>this.emit("load"))}on(e,f){(this.l[e]??=new Set).add(f)}off(e,f){this.l[e]?.delete(f)}emit(e){this.l[e]?.forEach(f=>f())}addControl(){}fitBounds(){}flyTo(){}remove(){}},Marker:class{constructor(e){this.e=e}setLngLat(){return this}addTo(){return this}remove(){}},NavigationControl:class{},LngLatBounds:class{extend(){return this}}}`,
    });
  });
  await mockHome(page, { venues: [venue(1, 16.06)] });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  await expect.poll(() => stylesheets).toBe(1);
  await expect.poll(() => scripts).toBe(1);
  await expect(page.getByRole("status")).toHaveText("Đang tải bản đồ…");
  await expect(page.getByRole("button", { name: "Thử lại" })).toHaveCount(0);

  releaseScript();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByTestId("venue-results-map")).toHaveAttribute("data-map-status", "ready");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __mapboxConstructions: number }).__mapboxConstructions)).toBe(1);
  expect(scripts).toBe(1);
  expect(stylesheets).toBe(2);
});

test("venue list map waits for the Mapbox load event before becoming ready", async ({ page }) => {
  await mockMapbox(page, false);
  await mockHome(page, { venues: [venue(1, 16.06)] });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  await expect(page.getByRole("status")).toHaveText("Đang tải bản đồ…");
  await expect(page.getByTestId("venue-results-map")).toHaveAttribute("data-map-status", "loading");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __mapboxTest: { constructions: number } }).__mapboxTest.constructions)).toBe(1);
  await page.evaluate(() => (window as unknown as { __mapboxTest: { maps: { emit: (event: string) => void }[] } }).__mapboxTest.maps[0].emit("load"));
  await expect(page.getByTestId("venue-results-map")).toHaveAttribute("data-map-status", "ready");
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("venue list map exposes an async Mapbox map error and selected marker state", async ({ page }) => {
  await mockMapbox(page, false);
  await mockHome(page, { venues: [venue(1, 16.06), venue(2, 16.08)] });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  const first = page.getByRole("button", { name: "Chọn Sân 1" });
  const second = page.getByRole("button", { name: "Chọn Sân 2" });
  await expect(first).toHaveAttribute("aria-pressed", "true");
  await second.click();
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await expect(first).toHaveAttribute("aria-pressed", "false");

  await page.evaluate(() => (window as unknown as { __mapboxTest: { maps: { emit: (event: string) => void }[] } }).__mapboxTest.maps[0].emit("load"));
  await expect(page.getByTestId("venue-results-map")).toHaveAttribute("data-map-status", "ready");
  await page.evaluate(() => (window as unknown as { __mapboxTest: { maps: { emit: (event: string) => void }[] } }).__mapboxTest.maps[0].emit("error"));
  await expect(page.getByText("Không tải được bản đồ.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
});

test("venue list map keeps pagination available in map mode", async ({ page }) => {
  const requests: URL[] = [];
  await mockMapbox(page);
  await mockHome(page, {
    venues: [venue(1, 16.06), venue(2, 16.08)],
    venueTotalPages: 2,
    venueTotalCount: 13,
    onVenueResponse: (url) => requests.push(url),
  });
  await page.goto("/venues");
  await page.getByRole("tab", { name: "Bản đồ" }).click();

  const pagination = page.getByRole("navigation", { name: "Phân trang" });
  await expect(pagination).toBeVisible();
  await pagination.getByRole("button", { name: "2", exact: true }).click();
  await expect(page).toHaveURL(/PageIndex=2/);
  await expect.poll(() => requests.some((url) => url.searchParams.get("PageIndex") === "2")).toBe(true);
  await expect(page.getByRole("tab", { name: "Bản đồ" })).toHaveAttribute("aria-selected", "true");
});

test("venue breadcrumb returns to venue results, not a city anchor", async ({ page }) => {
  await page.goto("/venues/1");

  await expect(page.getByRole("link", { name: "Hồ Chí Minh" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Danh sách sân" })).toHaveAttribute("href", "/venues");
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("link", { name: "Quay lại" })).toHaveAttribute("href", "/venues");
});

test("venue results ignore a delayed response for an older URL", async ({ page }) => {
  await mockAuth(page, "player");
  let releaseOld!: () => void;
  const oldGate = new Promise<void>((resolve) => { releaseOld = resolve; });
  await page.route("http://localhost:5187/api/Venues?**", async (route) => {
    const url = new URL(route.request().url());
    const keyword = url.searchParams.get("Keyword");
    if (keyword === "Cũ") await oldGate;
    const item = {
      ...venue(keyword === "Cũ" ? 81 : keyword === "Mới" ? 82 : 80, 16.06),
      name: keyword === "Cũ" ? "Sân cũ" : keyword === "Mới" ? "Sân mới" : "Sân ban đầu",
    };
    return route.fulfill({ json: paged([item], 12) });
  });

  await page.goto("/venues");
  await expect(page.getByText("Sân ban đầu", { exact: true })).toBeVisible();
  const keyword = page.getByRole("textbox", { name: /Từ khóa/ });
  await keyword.fill("Cũ");
  await keyword.press("Enter");
  await expect(page).toHaveURL(/Keyword=C%C5%A9/);
  await keyword.fill("Mới");
  await keyword.press("Enter");
  await expect(page).toHaveURL(/Keyword=M%E1%BB%9Bi/);
  await expect(page.getByText("Sân mới", { exact: true })).toBeVisible();
  releaseOld();
  await expect(page.getByText("Sân cũ", { exact: true })).toHaveCount(0);
});

test("dismissing pending location consent ignores the late geolocation callback", async ({ page }) => {
  await page.addInitScript(() => {
    let success!: PositionCallback;
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: (next: PositionCallback) => { success = next; } },
    });
    Object.assign(window, {
      __resolveLocation: () => success({ coords: { latitude: 16, longitude: 106.7 } } as GeolocationPosition),
    });
  });
  const venueRequests: URL[] = [];
  await mockHome(page, { city: null, sports: [sport], onVenueResponse: (url) => venueRequests.push(url) });
  await page.goto("/");
  await page.getByRole("button", { name: "Dùng vị trí hiện tại" }).click();
  await page.getByRole("button", { name: "Không phải bây giờ" }).click({ force: true });
  await page.evaluate(() => (window as unknown as { __resolveLocation: () => void }).__resolveLocation());
  await expect(page.getByRole("dialog", { name: "Cho phép dùng vị trí hiện tại" })).toHaveCount(0);
  expect(venueRequests.filter((url) => url.searchParams.get("PageSize") === "50")).toHaveLength(0);
  await expect(page.getByText("Sân phổ biến")).toBeVisible();
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

test("home discovery submits only supported venue filters from visibly labeled fields", async ({ page }) => {
  await mockHome(page, {
    city: "Đà Nẵng",
    sports: [{ id: 7, sportId: 1, sportCode: "FOOTBALL", sportName: "Bóng đá", skillLevel: "Beginner", createdAt: "2026-07-18T00:00:00Z" }],
  });
  await page.goto("/");

  await expect(page.getByText("Từ khóa", { exact: true })).toBeVisible();
  await expect(page.locator('[data-slot="label"]', { hasText: "Môn thể thao" })).toBeVisible();
  await expect(page.getByLabel("Chọn ngày")).toHaveCount(0);

  await page.getByRole("textbox", { name: "Từ khóa" }).fill("  Hải Châu  ");
  await page.getByRole("button", { name: /Môn thể thao/ }).click();
  await page.getByRole("option", { name: "Bóng đá" }).click();
  await page.getByRole("button", { name: "Tìm sân" }).click();

  await expect(page).toHaveURL(/\/venues\?Keyword=H%E1%BA%A3i\+Ch%C3%A2u&SportId=1$/);
  const params = new URL(page.url()).searchParams;
  expect([...params.keys()]).toEqual(["Keyword", "SportId"]);
});

test("home discovery saves preferred sports through the existing API and refreshes personalized state", async ({ page }) => {
  const savedSports: unknown[] = [];
  const posted: unknown[] = [];
  await mockHome(page, {
    city: "Đà Nẵng",
    sports: savedSports,
    onRequest: async (request) => {
      if (new URL(request.url()).pathname === "/api/Users/me/sports" && request.method() === "POST") {
        const body = request.postDataJSON();
        posted.push(body);
        await new Promise((resolve) => setTimeout(resolve, 300));
        savedSports.push({ id: 7, sportId: body.sportId, sportCode: "FOOTBALL", sportName: "Bóng đá", skillLevel: "Beginner", createdAt: "2026-07-18T00:00:00Z" });
      }
    },
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Bóng đá" }).click();
  await page.getByRole("button", { name: "Lưu vào hồ sơ" }).click();
  await expect(page.getByRole("button", { name: "Đang lưu..." })).toBeVisible();
  await expect(page.getByText("Đã lưu môn thể thao vào hồ sơ.")).toBeVisible();
  expect(posted).toEqual([{ sportId: 1, skillLevel: 0 }]);
  await expect(page.getByRole("button", { name: "Bóng đá" })).toHaveCount(1);
});

test("home discovery makes a failed sports save visibly retryable", async ({ page }) => {
  const savedSports: unknown[] = [];
  let postCount = 0;
  await mockHome(page, {
    city: "Đà Nẵng",
    sports: savedSports,
    failSportPosts: 1,
    onSportPost: (request, attempt) => {
      postCount = attempt;
      if (attempt === 2) {
        const body = request.postDataJSON();
        savedSports.push({ id: 7, sportId: body.sportId, sportCode: "FOOTBALL", sportName: "Bóng đá", skillLevel: "Beginner", createdAt: "2026-07-18T00:00:00Z" });
      }
    },
  });
  await page.goto("/");

  await page.getByRole("button", { name: "Bóng đá" }).click();
  await page.getByRole("button", { name: "Lưu vào hồ sơ" }).click();

  await expect(page.getByText("Không thể lưu môn thể thao.")).toBeVisible();
  await page.getByRole("button", { name: "Thử lại" }).click();

  await expect(page.getByText("Đã lưu môn thể thao vào hồ sơ.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Bóng đá" })).toHaveCount(1);
  expect(postCount).toBe(2);
});

test("home discovery ranks at most six venues within the loaded location result set", async ({ page, context }) => {
  const loaded = [8, 6, 4, 2, 1, 3, 5, 7].map((id) => venue(id, 16 + id / 100));
  const venueRequests: URL[] = [];
  let initialVenueResponses = 0;
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 16, longitude: 106.7 });
  await mockHome(page, {
    sports: [{ id: 7, sportId: 1, sportCode: "FOOTBALL", sportName: "Bóng đá", skillLevel: "Beginner", createdAt: "2026-07-18T00:00:00Z" }],
    initialVenues: [venue(99, 16.9)],
    venues: loaded,
    onVenueResponse: (url) => {
      if (url.searchParams.get("PageSize") === "6") initialVenueResponses += 1;
    },
    onRequest: async (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/Venues") venueRequests.push(url);
      if (url.pathname === "/api/Venues" && url.searchParams.get("PageSize") === "6") {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    },
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Dùng vị trí hiện tại" }).click();

  await expect.poll(() => venueRequests.some((url) => url.searchParams.get("PageIndex") === "1" && url.searchParams.get("PageSize") === "50")).toBe(true);
  const locationRequest = venueRequests.find((url) => url.searchParams.get("PageSize") === "50")!;
  expect([...locationRequest.searchParams.keys()].map((key) => key.toLowerCase())).not.toContain("latitude");
  expect([...locationRequest.searchParams.keys()].map((key) => key.toLowerCase())).not.toContain("longitude");
  await expect(page.getByText("Gần bạn nhất trong các kết quả đã tải (tối đa 50 sân).")).toBeVisible();
  await expect(page.locator("section").filter({ hasText: "Gợi ý cho bạn" }).getByRole("heading", { level: 3 })).toHaveText([
    "Sân 1", "Sân 2", "Sân 3", "Sân 4", "Sân 5", "Sân 6",
  ]);
  await expect.poll(() => initialVenueResponses).toBeGreaterThan(0);
  await expect(page.locator("section").filter({ hasText: "Gợi ý cho bạn" }).getByRole("heading", { level: 3 })).toHaveText([
    "Sân 1", "Sân 2", "Sân 3", "Sân 4", "Sân 5", "Sân 6",
  ]);
});

test("home discovery ignores a late initial venue failure after location results succeed", async ({ page, context }) => {
  const loaded = [3, 1, 2].map((id) => venue(id, 16 + id / 100));
  let initialVenueResponses = 0;
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 16, longitude: 106.7 });
  await mockHome(page, {
    sports: [{ id: 7, sportId: 1, sportCode: "FOOTBALL", sportName: "Bóng đá", skillLevel: "Beginner", createdAt: "2026-07-18T00:00:00Z" }],
    venues: loaded,
    failInitialVenues: true,
    onVenueResponse: (url) => {
      if (url.searchParams.get("PageSize") === "6") initialVenueResponses += 1;
    },
    onRequest: async (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/Venues" && url.searchParams.get("PageSize") === "6") {
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    },
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Dùng vị trí hiện tại" }).click();

  await expect(page.getByText("Gần bạn nhất trong các kết quả đã tải (tối đa 50 sân).")).toBeVisible();
  await expect(page.locator("section").filter({ hasText: "Gợi ý cho bạn" }).getByRole("heading", { level: 3 })).toHaveText([
    "Sân 1", "Sân 2", "Sân 3",
  ]);
  await expect.poll(() => initialVenueResponses).toBeGreaterThan(0);
  await expect(page.locator("section").filter({ hasText: "Gợi ý cho bạn" }).getByRole("heading", { level: 3 })).toHaveText([
    "Sân 1", "Sân 2", "Sân 3",
  ]);
});

test("home discovery keeps normal recommendations and offers retry guidance after geolocation denial", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition: (_success: PositionCallback, error: PositionErrorCallback) => error({ code: 1, message: "denied", PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError) },
    });
  });
  await mockHome(page, {
    sports: [{ id: 7, sportId: 1, sportCode: "FOOTBALL", sportName: "Bóng đá", skillLevel: "Beginner", createdAt: "2026-07-18T00:00:00Z" }],
    initialVenues: [venue(99, 16.9)],
  });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sân 99" })).toBeVisible();

  await page.getByRole("button", { name: "Dùng vị trí hiện tại" }).click();

  await expect(page.getByText("Trình duyệt đã từ chối quyền vị trí. Hãy cấp quyền rồi thử lại.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sân 99" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại vị trí" })).toBeVisible();
});
