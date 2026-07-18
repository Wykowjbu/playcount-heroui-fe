import { expect, test } from "@playwright/test";

const api = (data: unknown) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, message: "ok", data, errors: [] }) });

test("player drags across available slots and maps selection into create-match form", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("pc_auth", JSON.stringify({ id: 1, email: "player@example.test", role: "player", fullName: "Player", accessToken: "test", refreshToken: "test" }));
    class FakeMap {
      container: HTMLElement;
      constructor(options: { container: HTMLElement }) { this.container = options.container; }
      addControl() {} flyTo() {} remove() {}
    }
    class FakeMarker {
      constructor(private element?: HTMLElement) {}
      setLngLat() { return { addTo: (map: FakeMap) => map.container.append(this.element!) }; }
    }
    // @ts-expect-error Test-only Mapbox replacement.
    window.mapboxgl = { accessToken: "test", Map: FakeMap, Marker: FakeMarker, NavigationControl: class {} };
  });

  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/Sports")) return route.fulfill(api([{ id: 3, name: "Tennis", code: "TENNIS", isActive: true }]));
    if (url.includes("/Venues?") || url.endsWith("/Venues")) return route.fulfill({ ...api([{ id: 1, name: "Liên Chiểu Arena", address: "190 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng", latitude: 16.07, longitude: 108.15, images: [], amenities: [], openingHours: [] }]), body: JSON.stringify({ success: true, message: "ok", data: [{ id: 1, name: "Liên Chiểu Arena", address: "190 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng", latitude: 16.07, longitude: 108.15, images: [], amenities: [], openingHours: [] }], totalCount: 1, totalPages: 1, pageIndex: 1, pageSize: 12, errors: [] }) });
    if (url.includes("/availability")) {
      const slots = Array.from({ length: 48 }, (_, index) => {
        const hour = String(Math.floor(index / 2)).padStart(2, "0");
        const minute = index % 2 ? "30" : "00";
        const end = new Date(Date.UTC(2026, 6, 15, Math.floor(index / 2), index % 2 ? 30 : 0) + 30 * 60_000).toISOString().slice(11, 16);
        const active = index >= 34 && index < 44;
        return { startAt: `2026-07-15T${hour}:${minute}:00+00:00`, endAt: `2026-07-15T${end}:00+00:00`, status: active ? (index === 36 ? "Booked" : "Available") : "Closed", estimatedPrice: active ? 100000 : null, canStartBooking: active && index !== 35 && index !== 36 && index !== 43 };
      });
      return route.fulfill(api({ date: "2026-07-15", venue: { id: 1, name: "Liên Chiểu Arena", address: "190 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng", openTime: "17:00:00", closeTime: "22:00:00", isClosed: false }, courts: [{ id: 3, name: "Sân Tennis 2", sportId: 3, sportName: "Tennis", slots }] }));
    }
    if (url.includes("/Matches")) return route.fulfill(api([]));
    return route.fulfill(api([]));
  });

  await page.goto("/matches");
  await page.getByRole("button", { name: "Tạo kèo mới" }).first().click();
  await page.getByRole("button", { name: "Chọn sân và giờ" }).click();
  await page.getByRole("button", { name: "Chọn Liên Chiểu Arena" }).click();
  await expect(page.getByText("Lịch sân")).toBeVisible();
  const startSlot = page.getByRole("button", { name: "Sân Tennis 2, 18:30: Trống" });
  const endSlot = page.getByRole("button", { name: "Sân Tennis 2, 19:30: Trống" });
  const startBox = await startSlot.boundingBox();
  const endBox = await endSlot.boundingBox();
  if (!startBox || !endBox) throw new Error("Timeline slots are not visible");
  await page.mouse.move(startBox.x + startBox.width / 2, startBox.y + startBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(endBox.x + endBox.width / 2, endBox.y + endBox.height / 2, { steps: 4 });
  await page.mouse.up();
  await expect(page.getByText("Thông tin đặt sân")).toBeVisible();
  await expect(page.getByText("1 giờ 30 phút")).toBeVisible();
  await expect(page.getByText("300.000đ")).toBeVisible();
  await page.screenshot({ path: "test-results/venue-picker-selected.png", fullPage: true });
  await page.getByRole("button", { name: "Chọn sân và thời gian" }).last().click();
  const summary = page.getByText("Sân và thời gian đã chọn").locator("..");
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("18:30–20:00");
});
