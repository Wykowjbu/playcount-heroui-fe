import { expect, test, type Page } from "@playwright/test";

const ok = (data: unknown) => ({ success: true, message: "ok", data, errors: [] });
const paged = (data: unknown[]) => ({ ...ok(data), totalCount: data.length, totalPages: 1, pageIndex: 1, pageSize: 50 });

async function authenticate(page: Page) {
  await page.addInitScript(() => localStorage.setItem("pc_auth", JSON.stringify({
    id: 1, email: "player@example.test", role: "player", fullName: "Player", accessToken: "test", refreshToken: "test",
  })));
}

function availability(date: string, sportId = 3) {
  const slots = Array.from({ length: 48 }, (_, index) => {
    const hour = String(Math.floor(index / 2)).padStart(2, "0");
    const minute = index % 2 ? "30" : "00";
    const next = new Date(Date.UTC(2026, 6, 19, 0, index * 30 + 30)).toISOString().slice(11, 16);
    const active = index >= 34 && index < 44;
    return {
      startAt: `${date}T${hour}:${minute}:00+07:00`, endAt: `${date}T${next}:00+07:00`,
      status: active ? "Available" : "Closed", estimatedPrice: active ? 100000 : null,
      canStartBooking: active && index <= 41,
    };
  });
  return {
    date,
    venue: { id: sportId === 3 ? 1 : 2, name: sportId === 3 ? "Liên Chiểu Arena" : "Hải Châu Football", address: "Đà Nẵng", openTime: "17:00:00", closeTime: "22:00:00", isClosed: false },
    courts: [{ id: sportId, name: sportId === 3 ? "Sân Tennis 2" : "Sân Bóng 1", sportId, sportName: sportId === 3 ? "Tennis" : "Bóng đá", slots }],
  };
}

async function fixtureMatchCreation(page: Page, mapBehavior: "load" | "failOnce" | "loadThenError" = "load") {
  await authenticate(page);
  await page.clock.install({ time: new Date("2026-07-19T08:00:00+07:00") });
  await page.addInitScript((behavior) => {
    class FakeMap {
      container: HTMLElement;
      listeners = new Map<string, Set<() => void>>();
      constructor(options: { container: HTMLElement }) {
        this.container = options.container;
        const state = window as unknown as { __matchMapConstructions: number };
        state.__matchMapConstructions += 1;
        const construction = state.__matchMapConstructions;
        queueMicrotask(() => {
          if (behavior === "failOnce" && construction === 1) this.emit("error");
          else {
            this.emit("load");
            if (behavior === "loadThenError") queueMicrotask(() => this.emit("error"));
          }
        });
      }
      addControl() {} fitBounds() {} flyTo() {}
      on(event: string, listener: () => void) { const listeners = this.listeners.get(event) ?? new Set(); listeners.add(listener); this.listeners.set(event, listeners); }
      off(event: string, listener: () => void) { this.listeners.get(event)?.delete(listener); }
      emit(event: string) { this.listeners.get(event)?.forEach((listener) => listener()); }
      remove() {}
    }
    class FakeMarker {
      constructor(private element?: HTMLElement) {}
      setLngLat() { return this; }
      addTo(map: FakeMap) { if (this.element) map.container.append(this.element); return this; }
      remove() { this.element?.remove(); }
    }
    Object.assign(window, { __matchMapConstructions: 0 });
    // @ts-expect-error Test-only Mapbox replacement.
    window.mapboxgl = { accessToken: "test", Map: FakeMap, Marker: FakeMarker, NavigationControl: class {}, LngLatBounds: class { extend() { return this; } } };
  }, mapBehavior);
  await page.route("http://localhost:5187/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([{ id: 3, name: "Tennis", code: "TENNIS", isActive: true }, { id: 4, name: "Bóng đá", code: "FOOTBALL", isActive: true }]) });
    if (url.pathname === "/api/Venues") return route.fulfill({ json: paged(url.searchParams.get("SportId") === "4" ? [
      { id: 2, name: "Hải Châu Football", address: "Hải Châu, Đà Nẵng", latitude: 16.06, longitude: 108.22, images: [], amenities: [], openingHours: [] },
    ] : [
      { id: 1, name: "Liên Chiểu Arena", address: "190 Tôn Đức Thắng, Đà Nẵng", latitude: 16.07, longitude: 108.15, images: [], amenities: [], openingHours: [] },
      { id: 9, name: "Sân không tọa độ", address: "Hải Châu, Đà Nẵng", latitude: null, longitude: null, images: [], amenities: [], openingHours: [] },
    ]) });
    if (url.pathname === "/api/venues/1/availability") return route.fulfill({ json: ok(availability(url.searchParams.get("date")!)) });
    if (url.pathname === "/api/venues/2/availability") return route.fulfill({ json: ok(availability(url.searchParams.get("date")!, 4)) });
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
}

test("venue picker uses list fallback and non-drag 120 minute selection", async ({ page }) => {
  await fixtureMatchCreation(page);
  let submitted: Record<string, unknown> | null = null;
  await page.route("http://localhost:5187/api/Matches", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    submitted = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: ok({ id: 99 }) });
  });
  await page.goto("/matches/create");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();

  await expect(page.getByRole("status")).toHaveText("Đang tải bản đồ…");
  await expect(page.getByRole("group", { name: "Danh sách sân có thể chọn" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn Liên Chiểu Arena" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn Sân không tọa độ" })).toBeVisible();
  await page.getByRole("button", { name: "Chọn Liên Chiểu Arena" }).click();
  await expect(page.getByRole("button", { name: "Chọn Liên Chiểu Arena" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("group", { name: "Chọn ngày" })).toBeVisible();
  await expect(page.getByRole("group", { name: "Chọn giờ bắt đầu" })).toBeVisible();
  await page.getByRole("button", { name: "Sân Tennis 2, 18:00: Trống" }).click();
  await expect(page.getByRole("button", { name: "Sân Tennis 2, 18:00: Trống" })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Thời lượng").click();
  await page.getByRole("option", { name: "2 giờ", exact: true }).click();

  await expect(page.getByText("18:00–20:00", { exact: true })).toBeVisible();
  await expect(page.getByText("400.000đ")).toBeVisible();
  await page.getByRole("button", { name: "Chọn sân và thời gian" }).last().click();
  await expect(page.getByText("Sân và thời gian đã chọn")).toBeVisible();
  await expect(page.getByText("18:00–20:00", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Tạo kèo đấu" }).click();
  await expect.poll(() => submitted).not.toBeNull();
  expect(submitted).toMatchObject({
    sportId: 3, courtId: 3, startAt: "2026-07-19T18:00:00+07:00", endAt: "2026-07-19T20:00:00+07:00", maxParticipants: 4,
  });
});

test("venue picker retries a pre-load Mapbox failure and becomes ready", async ({ page }) => {
  await fixtureMatchCreation(page, "failOnce");
  await page.goto("/matches/create");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();

  await expect(page.getByText("Không tải được bản đồ.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thử lại bản đồ" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Chọn Liên Chiểu Arena" })).toBeVisible();
  await page.getByRole("button", { name: "Thử lại bản đồ" }).click();
  await expect(page.getByTestId("match-venue-map")).toHaveAttribute("data-map-status", "ready");
  await expect.poll(() => page.evaluate(() => (window as unknown as { __matchMapConstructions: number }).__matchMapConstructions)).toBe(2);
});

test("venue picker ignores recoverable Mapbox errors after load", async ({ page }) => {
  await fixtureMatchCreation(page, "loadThenError");
  await page.goto("/matches/create");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();

  await expect(page.getByTestId("match-venue-map")).toHaveAttribute("data-map-status", "ready");
  await expect(page.getByText("Không tải được bản đồ.")).toHaveCount(0);
  await page.getByRole("button", { name: "Chọn Liên Chiểu Arena" }).click();
  await expect(page.getByText("Lịch sân")).toBeVisible();
});

test("venue picker clears stale court selection when sport changes", async ({ page }) => {
  await fixtureMatchCreation(page);
  await page.goto("/matches/create");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();
  await page.getByRole("button", { name: "Chọn Liên Chiểu Arena" }).click();
  await page.getByRole("button", { name: "Sân Tennis 2, 18:00: Trống" }).click();
  await expect(page.getByRole("button", { name: "Chọn sân và thời gian" }).last()).toBeEnabled();
  await page.getByRole("button", { name: "Hủy" }).last().click();

  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Bóng đá" }).click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();
  await expect(page.getByRole("button", { name: "Chọn sân và thời gian" }).last()).toBeDisabled();
  await expect(page.getByText("Thông tin đặt sân")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Chọn Liên Chiểu Arena" })).toHaveCount(0);
});

test("create match clears a confirmed venue before changing sport", async ({ page }) => {
  await fixtureMatchCreation(page);
  let submitted: Record<string, unknown> | null = null;
  await page.route("http://localhost:5187/api/Matches", (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    submitted = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({ json: ok({ id: 99 }) });
  });
  await page.goto("/matches/create");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();
  await page.getByRole("button", { name: "Chọn Liên Chiểu Arena" }).click();
  await page.getByRole("button", { name: "Sân Tennis 2, 18:00: Trống" }).click();
  await page.getByRole("button", { name: "Chọn sân và thời gian" }).last().click();

  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Bóng đá" }).click();
  await expect(page.getByText("Sân và thời gian đã chọn")).toHaveCount(0);
  await expect(page.getByLabel("Địa điểm")).toHaveValue("");
  await page.getByRole("button", { name: "Tạo kèo đấu" }).click();
  await expect(page.getByText("Vui lòng nhập địa điểm")).toBeVisible();
  expect(submitted).toBeNull();

  await page.getByLabel("Địa điểm").fill("Sân bóng mới");
  await page.getByRole("group", { name: /Ngày thi đấu/ }).getByRole("button").click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();
  await page.getByRole("spinbutton", { name: /hour, Giờ bắt đầu/ }).fill("18");
  await page.getByRole("spinbutton", { name: /minute, Giờ bắt đầu/ }).fill("00");
  await page.getByRole("spinbutton", { name: /hour, Giờ kết thúc/ }).fill("20");
  await page.getByRole("spinbutton", { name: /minute, Giờ kết thúc/ }).fill("00");
  await page.getByRole("button", { name: "Tạo kèo đấu" }).click();
  await expect.poll(() => submitted).not.toBeNull();
  expect(submitted).toMatchObject({ sportId: 4, locationDescription: "Sân bóng mới" });
  expect(submitted).not.toHaveProperty("courtId");
});
