import { expect, test, type Page } from "@playwright/test";

const api = (data: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify({ success: status < 400, message: status < 400 ? "ok" : "Khung giờ vừa được người khác đặt.", data, errors: [] }),
});

const venue = {
  id: 1, courtOwnerProfileId: 1, name: "An Phú Sports Center", description: "Sân trung tâm",
  address: "120 đường 2 Tháng 9, Đà Nẵng", latitude: null, longitude: null, phone: "0236100001",
  openTime: null, closeTime: null, status: "Approved", createdAt: "2026-07-01T00:00:00Z", updatedAt: null,
  images: [], amenities: [], openingHours: [],
};

const court = {
  id: 1, venueId: 1, sportId: 1, sportName: "Cầu lông", name: "Sân Cầu lông 01", indoor: true,
  status: "Available", createdAt: "2026-07-01T00:00:00Z", updatedAt: null,
};

function slots() {
  return Array.from({ length: 48 }, (_, index) => {
    const start = new Date(Date.UTC(2026, 6, 20, 0, index * 30));
    const status = index === 15 ? "Held" : index === 16 ? "Maintenance" : index === 17 ? "Booked" : index < 14 || index > 21 ? "Closed" : "Available";
    return {
      startAt: start.toISOString().replace(".000Z", "+00:00"),
      endAt: new Date(start.getTime() + 30 * 60_000).toISOString().replace(".000Z", "+00:00"),
      status,
      estimatedPrice: status === "Available" ? 50000 : null,
      canStartBooking: index === 18 || index === 19 || index === 20,
    };
  });
}

function fullDaySlots(unpricedIndexes: number[] = []) {
  const unpriced = new Set(unpricedIndexes);
  const result = Array.from({ length: 48 }, (_, index) => {
    const start = new Date(Date.UTC(2026, 6, 20, 0, index * 30));
    const status = index === 15 ? "Held" : index === 16 ? "Maintenance" : index === 17 ? "Booked" : "Available";
    return {
      startAt: start.toISOString().replace(".000Z", "+00:00"),
      endAt: new Date(start.getTime() + 30 * 60_000).toISOString().replace(".000Z", "+00:00"),
      status,
      estimatedPrice: status === "Available" && !unpriced.has(index) ? 50_000 : null,
      canStartBooking: false,
    };
  });
  result.forEach((slot, index) => {
    const next = result[index + 1];
    slot.canStartBooking = slot.status === "Available" && slot.estimatedPrice != null
      && next?.status === "Available" && next.estimatedPrice != null;
  });
  return result;
}

async function authenticate(page: Page) {
  await page.addInitScript(() => localStorage.setItem("pc_auth", JSON.stringify({
    id: 1, email: "player@example.test", role: "player", fullName: "Player", accessToken: "test", refreshToken: "test",
  })));
}

const booking = (id: number, status = "Pending") => ({
  id, courtId: 1, courtName: court.name, venueId: 1, venueName: venue.name,
  userProfileId: 1, playerName: "Player", startAt: "2026-07-20T09:00:00Z",
  endAt: "2026-07-20T10:00:00Z", totalPrice: 100000, platformFee: 5000,
  ownerEarnings: 95000, status, note: null, createdAt: new Date(Date.now() - 60_000).toISOString(), updatedAt: null,
});

const checkoutPath = "/bookings/checkout?venue=1&court=1&date=2026-07-20&time=09%3A00&duration=60&startAt=2026-07-20T09%3A00%3A00%2B00%3A00&endAt=2026-07-20T10%3A00%3A00%2B00%3A00";

async function fixtureSuccessfulCheckout(page: Page, checkoutUrl: string, paymentStatus = 200) {
  let bookingCreates = 0;
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/Venues/1") && !url.includes("/courts")) return route.fulfill(api(venue));
    if (url.includes("/venues/1/courts")) return route.fulfill(api([court]));
    if (url.includes("/courts/1/availability")) return route.fulfill(api({ courtId: 1, isAvailable: true, estimatedPrice: 100000, reason: null }));
    if (url.endsWith("/api/Bookings") && route.request().method() === "POST") {
      bookingCreates += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return route.fulfill(api(booking(17)));
    }
    if (url.endsWith("/api/Bookings/17")) return route.fulfill(api(booking(17)));
    if (url.endsWith("/api/Payments/bookings/17/payos")) return route.fulfill(api({ checkoutUrl }, paymentStatus));
    return route.fulfill(api([]));
  });
  return () => bookingCreates;
}

test("booking history appends a full page without duplicates then stops on a short page", async ({ page }) => {
  await authenticate(page);
  const requestedPages: string[] = [];
  await page.route("**/api/**", (route) => {
    const requestUrl = new URL(route.request().url());
    if (!requestUrl.pathname.endsWith("/api/Bookings/me")) return route.fulfill(api([]));
    const pageNumber = requestUrl.searchParams.get("Page") ?? requestUrl.searchParams.get("page") ?? "1";
    requestedPages.push(pageNumber);
    const data = pageNumber === "1"
      ? Array.from({ length: 10 }, (_, index) => booking(index + 1))
      : [booking(10), booking(11)];
    return route.fulfill(api(data));
  });

  await page.goto("/player/bookings");
  await expect(page.getByText(`Mã đặt #1`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Xem thêm" }).click();
  await expect(page.getByText(`Mã đặt #11`, { exact: true })).toBeVisible();
  await expect(page.getByText(`Mã đặt #10`)).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Xem thêm" })).toBeHidden();
  expect(requestedPages).toEqual(["1", "2"]);
});

test("pending booking list card routes actions through booking detail", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/**", (route) => route.fulfill(api([booking(13)])));

  await page.goto("/player/bookings");
  const detailLink = page.getByRole("link", { name: "Xem chi tiết" });
  await expect(detailLink).toHaveAttribute("href", "/bookings/13");
  await expect(detailLink.locator("button")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thanh toán", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Hủy đặt sân" })).toHaveCount(0);
  expect((await detailLink.boundingBox())?.height).toBeGreaterThanOrEqual(44);
});

test("booking history waits for an explicit retry after a load failure", async ({ page }) => {
  await authenticate(page);
  let attempts = 0;
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.endsWith("/api/Bookings/me")) return route.fulfill(api([]));
    attempts += 1;
    return route.fulfill(api(attempts === 1 ? null : [booking(1)], attempts === 1 ? 500 : 200));
  });

  await page.goto("/player/bookings");
  await expect(page.getByRole("button", { name: "Thử lại" })).toBeVisible();
  await page.waitForTimeout(250);
  expect(attempts).toBe(1);
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByText("Mã đặt #1", { exact: true })).toBeVisible();
  expect(attempts).toBe(2);
});

test("booking detail lifecycle expires payment and offers venue availability", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/api/Bookings/7")) return route.fulfill(api({
      ...booking(7, "Expired"),
      createdAt: new Date(Date.now() - 16 * 60_000).toISOString(),
    }));
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/7");
  await expect(page.getByText("Đặt sân đã hết hạn")).toBeVisible();
  await expect(page.getByRole("button", { name: /Thanh toán/ })).toHaveCount(0);
  const venueLink = page.getByRole("link", { name: "Chọn khung giờ mới" });
  await expect(venueLink).toHaveAttribute("href", "/venues/1");
  await expect(venueLink.locator("button")).toHaveCount(0);
});

test("booking detail ignores a delayed previous booking after in-place navigation", async ({ page }) => {
  await authenticate(page);
  let releaseFirst!: () => void;
  let firstRequested = false;
  const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Bookings/7") {
      firstRequested = true;
      await firstGate;
      return route.fulfill(api({ ...booking(7, "Completed"), venueName: "Sân cũ" }));
    }
    if (url.pathname === "/api/Bookings/8") return route.fulfill(api({ ...booking(8), venueName: "Sân mới" }));
    if (url.pathname.startsWith("/api/Payments/bookings/")) return route.fulfill(api([]));
    if (url.pathname === "/api/Reviews/my") return route.fulfill(api([]));
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill(api({ count: 0 }));
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/7");
  await expect.poll(() => firstRequested).toBe(true);
  await page.goto("/bookings/8");
  await expect(page.getByText("Chi tiết đặt sân #8")).toBeVisible();
  await expect(page.getByText("Sân mới", { exact: true })).toBeVisible();
  releaseFirst();
  await expect(page.getByText("Chi tiết đặt sân #8")).toBeVisible();
  await expect(page.getByText("Sân cũ", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Thanh toán ngay" })).toBeVisible();
});

test("pending booking keeps polling after its displayed hold deadline until expired", async ({ page }) => {
  await authenticate(page);
  let bookingLoads = 0;
  const firstLoadAt = Date.now();
  const createdAt = new Date(Date.now() - 14 * 60_000 - 58_000).toISOString();
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/api/Bookings/12")) {
      bookingLoads += 1;
      return route.fulfill(api({
        ...booking(12, Date.now() - firstLoadAt >= 6_000 ? "Expired" : "Pending"),
        createdAt,
      }));
    }
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/12");
  const countdown = page.getByText("Thời gian còn lại: 00:00");
  await expect(countdown).toBeVisible();
  await expect(countdown).not.toHaveAttribute("aria-live");
  await expect(page.getByRole("status")).toContainText("Thời gian giữ chỗ đã hết");
  await expect(page.getByRole("button", { name: "Thanh toán ngay" })).toBeDisabled();
  await expect(page.getByText("Đặt sân đã hết hạn")).toBeVisible({ timeout: 12_000 });
  await expect(page.getByRole("button", { name: /Thanh toán/ })).toHaveCount(0);
  expect(bookingLoads).toBeGreaterThanOrEqual(3);
});

test("deadline refresh failure preserves booking and offers a manual retry", async ({ page }) => {
  await authenticate(page);
  let bookingLoads = 0;
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/api/Bookings/14")) {
      bookingLoads += 1;
      if (bookingLoads === 3) return route.fulfill(api(null, 500));
      return route.fulfill(api({
        ...booking(14, bookingLoads >= 4 ? "Expired" : "Pending"),
        createdAt: new Date(Date.now() - 16 * 60_000).toISOString(),
      }));
    }
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/14");
  await expect(page.getByText("Chưa thể cập nhật trạng thái đặt sân")).toBeVisible();
  await expect(page.getByText("Chi tiết đặt sân #14")).toBeVisible();
  await page.getByRole("button", { name: "Thử tải lại trạng thái" }).click();
  await expect(page.getByText("Đặt sân đã hết hạn")).toBeVisible();
});

test("pending booking keeps pay and cancel failures retryable", async ({ page }) => {
  await authenticate(page);
  let cancelAttempts = 0;
  let cancelBody: unknown;
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/Bookings/9") && route.request().method() === "GET") {
      return route.fulfill(api(booking(9)));
    }
    if (url.pathname.endsWith("/api/Payments/bookings/9/payos")) {
      return route.fulfill(api({ checkoutUrl: "https://example.com/checkout" }));
    }
    if (url.pathname.endsWith("/api/Bookings/9/cancel")) {
      cancelAttempts += 1;
      cancelBody = route.request().postDataJSON();
      return route.fulfill(api(null, cancelAttempts === 1 ? 500 : 200));
    }
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/9");
  await expect(page.getByText(/Thời gian còn lại: 1[34]:\d{2}/)).toBeVisible();
  await page.getByRole("button", { name: "Thanh toán ngay" }).click();
  await expect(page.getByText("Liên kết thanh toán không hợp lệ")).toBeVisible();
  await page.getByRole("button", { name: "Hủy đặt sân" }).click();
  await page.getByLabel("Lý do hủy (không bắt buộc)").fill("Đổi kế hoạch");
  await page.getByRole("button", { name: "Xác nhận hủy" }).click();
  await expect(page.getByLabel("Xác nhận hủy đặt sân").getByText("Khung giờ vừa được người khác đặt.")).toBeVisible();
  await page.getByRole("button", { name: "Xác nhận hủy" }).click();
  expect(cancelAttempts).toBe(2);
  expect(cancelBody).toEqual({ reason: "Đổi kế hoạch" });
});

test("booking detail follows a trusted PayOS checkout URL", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.endsWith("/api/Bookings/18")) return route.fulfill(api(booking(18)));
    if (url.endsWith("/api/Payments/bookings/18/payos")) return route.fulfill(api({ checkoutUrl: "https://img.payos.vn/checkout/detail" }));
    return route.fulfill(api([]));
  });
  await page.route("https://img.payos.vn/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "PayOS" }));

  await page.goto("/bookings/18");
  await page.getByRole("button", { name: "Thanh toán ngay" }).click();
  await expect(page).toHaveURL("https://img.payos.vn/checkout/detail");
});

test("review images upload, persist, refetch, and delete after confirmation", async ({ page }) => {
  await authenticate(page);
  await page.addInitScript(() => {
    URL.createObjectURL = () => "blob:review-preview";
    URL.revokeObjectURL = () => undefined;
  });
  const image = { id: 91, reviewId: 31, imageUrl: "https://cdn.example.test/review.webp", displayOrder: 0, createdAt: new Date().toISOString() };
  const review = { id: 31, playerId: 1, playerName: "Player", playerAvatar: null, bookingId: 8, venueId: 1, venueName: venue.name, courtId: 1, courtName: court.name, rating: 5, reviewText: "Tốt", status: "Published", images: [image], createdAt: new Date().toISOString(), updatedAt: null };
  let created = false;
  let addedBody: unknown;
  let deleteAttempts = 0;
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/Bookings/8")) return route.fulfill(api(booking(8, "Completed")));
    if (url.pathname.endsWith("/api/upload")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: image.imageUrl, key: "reviews/review.webp" }) });
    if (url.pathname.endsWith("/api/Reviews") && route.request().method() === "POST") {
      created = true;
      return route.fulfill(api({ ...review, images: [] }));
    }
    if (url.pathname.endsWith("/api/Reviews/31/images") && route.request().method() === "POST") {
      addedBody = route.request().postDataJSON();
      return route.fulfill(api(image));
    }
    if (url.pathname.endsWith("/api/Reviews/31/images/91") && route.request().method() === "DELETE") {
      deleteAttempts += 1;
      return route.fulfill(api(null, deleteAttempts === 1 ? 500 : 200));
    }
    if (url.pathname.endsWith("/api/Reviews/my")) return route.fulfill(api(created ? [{ ...review, images: deleteAttempts > 1 ? [] : [image] }] : []));
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/8");
  await page.getByRole("button", { name: "Đánh giá sân" }).click();
  await page.getByLabel("Số sao").click();
  await page.getByRole("option", { name: "5 sao" }).click();
  await page.getByLabel("Nội dung").fill("Tốt");
  await page.getByLabel("Ảnh đánh giá").setInputFiles({ name: "review.txt", mimeType: "text/plain", buffer: Buffer.from("review") });
  await expect(page.getByText(/review\.txt: Chỉ chấp nhận ảnh/)).toBeVisible();
  await expect(page.getByAltText("Ảnh xem trước review.txt")).toHaveCount(0);
  await page.getByLabel("Ảnh đánh giá").setInputFiles({ name: "review.webp", mimeType: "image/webp", buffer: Buffer.from("review") });
  await expect(page.getByAltText("Ảnh xem trước review.webp")).toBeVisible();
  await page.getByRole("button", { name: "Gửi đánh giá" }).click();
  await expect(page.getByAltText(`Ảnh đánh giá sân ${venue.name}`)).toBeVisible();
  expect(addedBody).toEqual({ imageUrl: image.imageUrl, displayOrder: 0 });
  await page.getByRole("button", { name: "Xóa ảnh đánh giá" }).click();
  expect(deleteAttempts).toBe(0);
  await page.getByRole("button", { name: "Xóa ảnh", exact: true }).click();
  await expect(page.getByLabel("Xác nhận xóa ảnh đánh giá").getByText("Khung giờ vừa được người khác đặt.")).toBeVisible();
  await expect(page.getByAltText(`Ảnh đánh giá sân ${venue.name}`)).toBeVisible();
  await page.getByRole("button", { name: "Xóa ảnh", exact: true }).click();
  await expect(page.getByAltText(`Ảnh đánh giá sân ${venue.name}`)).toBeHidden();
  expect(deleteAttempts).toBe(2);
});

test("review image partial failure retries attachment without creating another review", async ({ page }) => {
  await authenticate(page);
  await page.addInitScript(() => {
    URL.createObjectURL = (file) => `blob:${(file as File).name}`;
    URL.revokeObjectURL = () => undefined;
  });
  const images = ["one.webp", "two.webp"].map((name, index) => ({
    id: 100 + index, reviewId: 32, imageUrl: `https://cdn.example.test/${name}`,
    displayOrder: index, createdAt: new Date().toISOString(),
  }));
  const baseReview = { id: 32, playerId: 1, playerName: "Player", playerAvatar: null, bookingId: 10, venueId: 1, venueName: venue.name, courtId: 1, courtName: court.name, rating: 5, reviewText: "Tốt", status: "Published", images: [], createdAt: new Date().toISOString(), updatedAt: null };
  let createCount = 0;
  let secondImageAttempts = 0;
  const secondImageOrders: number[] = [];
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/Bookings/10")) return route.fulfill(api(booking(10, "Completed")));
    if (url.pathname.endsWith("/api/upload")) {
      const body = route.request().postDataBuffer()?.toString() ?? "";
      const selected = body.includes("two.webp") ? images[1] : images[0];
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: selected.imageUrl, key: `reviews/${selected.id}` }) });
    }
    if (url.pathname.endsWith("/api/Reviews") && route.request().method() === "POST") {
      createCount += 1;
      return route.fulfill(api(baseReview));
    }
    if (url.pathname.endsWith("/api/Reviews/32/images") && route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { imageUrl: string; displayOrder: number };
      if (body.imageUrl === images[1].imageUrl) {
        secondImageOrders.push(body.displayOrder);
        if (++secondImageAttempts === 1) return route.fulfill(api(null, 500));
      }
      return route.fulfill(api(images.find(({ imageUrl }) => imageUrl === body.imageUrl)));
    }
    if (url.pathname.endsWith("/api/Reviews/my")) {
      const persisted = secondImageAttempts > 1 ? images : images.slice(0, 1);
      return route.fulfill(api(createCount ? [{ ...baseReview, images: persisted }] : []));
    }
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/10");
  await page.getByRole("button", { name: "Đánh giá sân" }).click();
  await page.getByLabel("Số sao").click();
  await page.getByRole("option", { name: "5 sao" }).click();
  await page.getByLabel("Ảnh đánh giá").setInputFiles([
    { name: "one.webp", mimeType: "image/webp", buffer: Buffer.from("one") },
    { name: "two.webp", mimeType: "image/webp", buffer: Buffer.from("two") },
  ]);
  await page.getByRole("button", { name: "Gửi đánh giá" }).click();
  await expect(page.getByText("Chưa lưu được: two.webp")).toBeVisible();
  await expect(page.getByAltText(`Ảnh đánh giá sân ${venue.name}`)).toBeVisible();
  await page.getByRole("button", { name: "Gửi đánh giá" }).click();
  await expect(page.getByText("Chưa lưu được: two.webp")).toBeHidden();
  expect(createCount).toBe(1);
  expect(secondImageAttempts).toBe(2);
  expect(secondImageOrders).toEqual([1, 1]);
});

test("review image selection caps queued uploads at five", async ({ page }) => {
  await authenticate(page);
  await page.addInitScript(() => {
    URL.createObjectURL = (file) => `blob:${(file as File).name}`;
    URL.revokeObjectURL = () => undefined;
  });
  let uploads = 0;
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/Bookings/15")) return route.fulfill(api(booking(15, "Completed")));
    if (url.pathname.endsWith("/api/Reviews/my")) return route.fulfill(api([]));
    if (url.pathname.endsWith("/api/upload")) {
      uploads += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: `https://cdn.example.test/${uploads}.webp`, key: `reviews/${uploads}` }) });
    }
    if (url.pathname.endsWith("/api/Reviews") && route.request().method() === "POST") {
      return route.fulfill(api({ id: 35, playerId: 1, playerName: "Player", playerAvatar: null, bookingId: 15, venueId: 1, venueName: venue.name, courtId: 1, courtName: court.name, rating: 5, reviewText: null, status: "Published", images: [], createdAt: new Date().toISOString(), updatedAt: null }));
    }
    if (url.pathname.endsWith("/api/Reviews/35/images")) return route.fulfill(api({ id: uploads, reviewId: 35, imageUrl: `https://cdn.example.test/${uploads}.webp`, displayOrder: uploads - 1, createdAt: new Date().toISOString() }));
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/15");
  await page.getByRole("button", { name: "Đánh giá sân" }).click();
  await page.getByLabel("Số sao").click();
  await page.getByRole("option", { name: "5 sao" }).click();
  await page.getByLabel("Ảnh đánh giá").setInputFiles(Array.from({ length: 6 }, (_, index) => ({
    name: `${index + 1}.webp`, mimeType: "image/webp", buffer: Buffer.from(String(index + 1)),
  })));
  await expect(page.getByText("Mỗi đánh giá tối đa 5 ảnh")).toBeVisible();
  await expect(page.getByAltText(/Ảnh xem trước/)).toHaveCount(5);
  await page.getByRole("button", { name: "Gửi đánh giá" }).click();
  expect(uploads).toBe(5);
});

test("review save remains successful when gallery refetch fails", async ({ page }) => {
  await authenticate(page);
  const image = { id: 120, reviewId: 36, imageUrl: "https://cdn.example.test/saved.webp", displayOrder: 0, createdAt: new Date().toISOString() };
  const savedReview = { id: 36, playerId: 1, playerName: "Player", playerAvatar: null, bookingId: 16, venueId: 1, venueName: venue.name, courtId: 1, courtName: court.name, rating: 5, reviewText: null, status: "Published", images: [], createdAt: new Date().toISOString(), updatedAt: null };
  let created = false;
  await page.route("**/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/api/Bookings/16")) return route.fulfill(api(booking(16, "Completed")));
    if (url.pathname.endsWith("/api/upload")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: image.imageUrl, key: "reviews/saved" }) });
    if (url.pathname.endsWith("/api/Reviews") && route.request().method() === "POST") {
      created = true;
      return route.fulfill(api(savedReview));
    }
    if (url.pathname.endsWith("/api/Reviews/36/images")) return route.fulfill(api(image));
    if (url.pathname.endsWith("/api/Reviews/my")) return route.fulfill(api(created ? null : [], created ? 500 : 200));
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/16");
  await page.getByRole("button", { name: "Đánh giá sân" }).click();
  await page.getByLabel("Số sao").click();
  await page.getByRole("option", { name: "5 sao" }).click();
  await page.getByLabel("Ảnh đánh giá").setInputFiles({ name: "saved.webp", mimeType: "image/webp", buffer: Buffer.from("saved") });
  await page.getByRole("button", { name: "Gửi đánh giá" }).click();
  await expect(page.getByRole("dialog", { name: "Đánh giá sân" })).toBeHidden();
  await expect(page.getByAltText(`Ảnh đánh giá sân ${venue.name}`)).toBeVisible();
  await expect(page.getByText("Đánh giá đã được lưu nhưng chưa thể làm mới dữ liệu")).toBeVisible();
});

test("venue schedule stays inside its column when a full day loads", async ({ page }) => {
  await page.route("**/api/venues/1/availability?date=2026-07-20", (route) => route.fulfill(api({
    date: "2026-07-20",
    venue: { id: 1, name: venue.name, address: venue.address, openTime: "00:00:00", closeTime: "23:59:59", isClosed: false },
    courts: [{ id: 1, name: court.name, sportId: 1, sportName: court.sportName, slots: fullDaySlots() }],
  })));

  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByRole("button", { name: "Calendar Ngày chơi" }).click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();
  await expect(page.getByRole("button", { name: /09:00.*Trống/ })).toBeVisible();

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
  await expect(page.getByRole("heading", { name: "Thông tin đặt sân" })).toBeInViewport();
});

test("dragging priced available slots selects the complete booking range", async ({ page }) => {
  // The venue page is server-rendered from the read-only seeded venue/court bootstrap.
  // Every browser-side availability or mutation endpoint is route-fixtured in this file.
  await page.route("**/api/venues/1/availability?date=2026-07-20", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    await route.fulfill(api({
      date: "2026-07-20",
      venue: { id: 1, name: venue.name, address: venue.address, openTime: "00:00:00", closeTime: "23:59:59", isClosed: false },
      courts: [{ id: 1, name: court.name, sportId: 1, sportName: court.sportName, slots: fullDaySlots() }],
    }));
  });

  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByRole("button", { name: "Calendar Ngày chơi" }).click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();

  await expect(page.getByText("Đang tải lịch trống")).toBeVisible();
  await expect(page.getByRole("button", { name: /07:30.*Đang giữ/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /08:00.*Bảo trì/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /08:30.*Đã đặt/ })).toBeDisabled();
  await page.getByRole("button", { name: /09:00.*Trống/ }).click();
  await expect(page.getByText("09:00–10:00")).toBeVisible();
  await expect(page.getByLabel("Thời lượng")).toContainText("60 phút");
  await page.getByRole("button", { name: /09:00.*Trống/ }).dragTo(page.getByRole("button", { name: /10:00.*Trống/ }));

  await expect(page.getByText("Thông tin đặt sân")).toBeVisible();
  await expect(page.getByText("09:00–10:30")).toBeVisible();
  await expect(page.getByLabel("Thời lượng")).toContainText("90 phút");
  await expect(page.getByText("150.000đ")).toBeVisible();
  await page.getByRole("button", { name: "TIẾP TỤC ĐẶT SÂN" }).click();
  await expect(page).toHaveURL(/\/bookings\/checkout\?/);
  const checkout = new URL(page.url());
  expect(Object.fromEntries(checkout.searchParams)).toMatchObject({
    venue: "1",
    court: "1",
    date: "2026-07-20",
    time: "09:00",
    duration: "90",
    startAt: "2026-07-20T09:00:00+00:00",
    endAt: "2026-07-20T10:30:00+00:00",
  });
});

test("available slots without pricing are dimmed and cannot start a selection", async ({ page }) => {
  await page.route("**/api/venues/1/availability?date=2026-07-20", (route) => route.fulfill(api({
    date: "2026-07-20",
    venue: { id: 1, name: venue.name, address: venue.address, openTime: "07:00:00", closeTime: "11:00:00", isClosed: false },
    courts: [{ id: 1, name: court.name, sportId: 1, sportName: court.sportName, slots: fullDaySlots([18, 19]) }],
  })));

  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByRole("button", { name: "Calendar Ngày chơi" }).click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();

  const unpricedSlot = page.getByRole("button", { name: /09:00.*Trống/ });
  await expect(unpricedSlot).toBeDisabled();
  expect(Number(await unpricedSlot.evaluate((element) => getComputedStyle(element).opacity))).toBeLessThan(0.6);
});

test("venue booking calendar disables dates before today", async ({ page }) => {
  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByRole("button", { name: "Calendar Ngày chơi" }).click();

  await expect(page.getByRole("gridcell", { name: /Sunday, July 19,/ })).toHaveAttribute("aria-disabled", "true");
});

test("venue schedule legend shows a swatch for every status", async ({ page }) => {
  await page.route("**/api/venues/1/availability?date=2026-07-20", (route) => route.fulfill(api({
    date: "2026-07-20",
    venue: { id: 1, name: venue.name, address: venue.address, openTime: "07:00:00", closeTime: "11:00:00", isClosed: false },
    courts: [{ id: 1, name: court.name, sportId: 1, sportName: court.sportName, slots: fullDaySlots() }],
  })));
  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByRole("button", { name: "Calendar Ngày chơi" }).click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();

  await expect(page.getByLabel("Chú thích trạng thái lịch").locator(":scope > span > span")).toHaveCount(4);
});

test("venue availability booking explains when 48 slots have no bookable start", async ({ page }) => {
  await page.route("**/api/venues/1/availability?date=2026-07-20", (route) => route.fulfill(api({
    date: "2026-07-20",
    venue: { id: 1, name: venue.name, address: venue.address, openTime: "07:00:00", closeTime: "11:00:00", isClosed: false },
    courts: [{
      id: 1,
      name: court.name,
      sportId: 1,
      sportName: court.sportName,
      slots: slots().map((slot) => ({ ...slot, canStartBooking: false })),
    }],
  })));

  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByLabel("Sân", { exact: true }).click();
  await page.getByRole("option", { name: court.name }).click();
  await page.getByRole("group", { name: "Chọn ngày chơi" }).getByRole("button").click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();

  await expect(page.getByText("Không có khung giờ có thể đặt trong ngày này")).toBeVisible();
  await expect(page.getByText("Vui lòng chọn ngày khác để xem lịch trống.")).toBeVisible();
  await expect(page.getByRole("button", { name: /09:00.*Trống/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: "TIẾP TỤC ĐẶT SÂN" })).toBeDisabled();
  await expect(page).toHaveURL(/\/venues\/1$/);
});

test("venue availability booking clears stale loading when context changes", async ({ page }) => {
  await page.route("**/api/venues/1/availability?date=2026-07-20", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await route.fulfill(api({
      date: "2026-07-20",
      venue: { id: 1, name: venue.name, address: venue.address, openTime: "07:00:00", closeTime: "11:00:00", isClosed: false },
      courts: [{ id: 1, name: court.name, sportId: 1, sportName: court.sportName, slots: slots() }],
    }));
  });

  await page.goto("/venues/1");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Cầu lông" }).click();
  await page.getByLabel("Sân", { exact: true }).click();
  await page.getByRole("option", { name: court.name }).click();
  await page.getByRole("group", { name: "Chọn ngày chơi" }).getByRole("button").click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();
  await expect(page.getByText("Đang tải lịch trống")).toBeVisible();

  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Pickleball" }).click();
  await expect(page.getByText("Đang tải lịch trống")).toBeHidden({ timeout: 500 });
  await page.waitForTimeout(3100);
  await expect(page.getByText("Đang tải lịch trống")).toBeHidden();
});

test("checkout conflict preserves note and offers another slot without mutating payment", async ({ page }) => {
  await authenticate(page);
  let paymentRequested = false;
  const availabilityWindows: { startAt: string | null; endAt: string | null }[] = [];
  let bookingBody: Record<string, unknown> | null = null;
  await page.route("**/api/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/Venues/1") && !url.includes("/courts")) return route.fulfill(api(venue));
    if (url.includes("/venues/1/courts")) return route.fulfill(api([court]));
    if (url.includes("/courts/1/availability")) {
      const requestUrl = new URL(url);
      availabilityWindows.push({ startAt: requestUrl.searchParams.get("StartAt"), endAt: requestUrl.searchParams.get("EndAt") });
      return route.fulfill(api({ courtId: 1, isAvailable: true, estimatedPrice: 100000, reason: null }));
    }
    if (url.endsWith("/api/Bookings") && route.request().method() === "POST") {
      bookingBody = route.request().postDataJSON() as Record<string, unknown>;
      return route.fulfill(api(null, 409));
    }
    if (url.includes("/Payments")) paymentRequested = true;
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/checkout?venue=1&court=1&date=2026-07-20&time=09%3A00&duration=60&startAt=2026-07-20T09%3A00%3A00%2B00%3A00&endAt=2026-07-20T10%3A00%3A00%2B00%3A00");
  await expect(page.getByText(/giữ chỗ trong 15 phút/i)).toBeVisible();
  await page.getByLabel("Ghi chú").fill("Để xe cạnh cổng");
  await page.getByRole("button", { name: /Xác nhận & Thanh toán/ }).click();

  await expect(page.getByText(/khung giờ.*không còn|người khác đặt/i)).toBeVisible();
  const chooseAnother = page.getByRole("link", { name: "Chọn khung giờ khác" });
  await expect(chooseAnother).toHaveAttribute("href", "/venues/1?court=1&date=2026-07-20");
  await expect(page.getByLabel("Ghi chú")).toHaveValue("Để xe cạnh cổng");
  expect(availabilityWindows.length).toBeGreaterThanOrEqual(2);
  expect(availabilityWindows.every(({ startAt, endAt }) => (
    startAt === "2026-07-20T09:00:00+00:00" && endAt === "2026-07-20T10:00:00+00:00"
  ))).toBe(true);
  expect(bookingBody).toEqual({
    courtId: 1,
    startAt: "2026-07-20T09:00:00+00:00",
    endAt: "2026-07-20T10:00:00+00:00",
    note: "Để xe cạnh cổng",
  });
  expect(paymentRequested).toBe(false);
});

test("checkout recovers a created booking when PayOS returns an untrusted URL", async ({ page }) => {
  await authenticate(page);
  await fixtureSuccessfulCheckout(page, "http://pay.payos.vn/checkout/insecure");

  await page.goto(checkoutPath);
  await page.getByRole("button", { name: /Xác nhận & Thanh toán/ }).click();
  await expect(page).toHaveURL(/\/bookings\/17$/);
  await expect(page.getByText("Chi tiết đặt sân #17")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thanh toán ngay" })).toBeVisible();
});

test("checkout recovers a created booking when PayOS setup fails", async ({ page }) => {
  await authenticate(page);
  await fixtureSuccessfulCheckout(page, "", 500);

  await page.goto(checkoutPath);
  await page.getByRole("button", { name: /Xác nhận & Thanh toán/ }).click();
  await expect(page).toHaveURL(/\/bookings\/17$/);
  await expect(page.getByText("Chi tiết đặt sân #17")).toBeVisible();
  await expect(page.getByRole("button", { name: "Thanh toán ngay" })).toBeVisible();
});

test("checkout prevents duplicate booking creation", async ({ page }) => {
  await authenticate(page);
  const bookingCreates = await fixtureSuccessfulCheckout(page, "http://pay.payos.vn/checkout/insecure");

  await page.goto(checkoutPath);
  await page.getByRole("button", { name: /Xác nhận & Thanh toán/ }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page).toHaveURL(/\/bookings\/17$/);
  expect(bookingCreates()).toBe(1);
});

test("checkout follows a trusted PayOS checkout URL", async ({ page }) => {
  await authenticate(page);
  await fixtureSuccessfulCheckout(page, "https://img.payos.vn/checkout/new-booking");
  await page.route("https://img.payos.vn/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "PayOS" }));

  await page.goto(checkoutPath);
  await page.getByRole("button", { name: /Xác nhận & Thanh toán/ }).click();
  await expect(page).toHaveURL("https://img.payos.vn/checkout/new-booking");
});

test("checkout rejects invalid duration before availability or booking requests", async ({ page }) => {
  await authenticate(page);
  let availabilityRequests = 0;
  let bookingRequests = 0;
  await page.route("**/api/**", (route) => {
    const url = route.request().url();
    if (url.includes("/availability")) availabilityRequests += 1;
    if (url.endsWith("/api/Bookings")) bookingRequests += 1;
    return route.fulfill(api([]));
  });

  await page.goto("/bookings/checkout?venue=1&court=1&date=2026-07-20&time=09%3A00&duration=45&startAt=2026-07-20T09%3A00%3A00%2B00%3A00&endAt=2026-07-20T10%3A00%3A00%2B00%3A00");

  await expect(page.getByText("Thông tin đặt sân không hợp lệ")).toBeVisible();
  await expect(page.getByRole("link", { name: "Chọn lại khung giờ" })).toHaveAttribute("href", "/venues/1?court=1&date=2026-07-20");
  expect(availabilityRequests).toBe(0);
  expect(bookingRequests).toBe(0);
});
