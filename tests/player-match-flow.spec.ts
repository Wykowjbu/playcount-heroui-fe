import { expect, test, type Page, type Request } from "@playwright/test";

test.use({ timezoneId: "Asia/Ho_Chi_Minh" });

const ok = (data: unknown) => ({ success: true, message: "ok", data, errors: [] });
const paged = (data: unknown[]) => ({ ...ok(data), totalCount: data.length, totalPages: 1, pageIndex: 1, pageSize: 12 });

async function auth(page: Page) {
  await page.addInitScript(() => localStorage.setItem("pc_auth", JSON.stringify({
    id: 1, email: "player@example.test", role: "player", fullName: "Player", accessToken: "test", refreshToken: "test",
  })));
}

async function matchRoutes(page: Page, onMatchRequest?: (request: Request) => void) {
  await auth(page);
  await page.route("http://localhost:5187/api/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([{ id: 3, name: "Tennis", code: "TENNIS", isActive: true }]) });
    if (url.pathname === "/api/Matches") { onMatchRequest?.(request); return route.fulfill({ json: paged([]) }); }
    if (url.pathname === "/api/Matches/invitations/me") return route.fulfill({ json: ok([]) });
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
}

const detailFixture = (isHost: boolean) => ({
  id: 7,
  hostProfileId: isHost ? 1 : 9,
  hostName: "Chủ kèo",
  hostAvatarUrl: null,
  sportId: 3,
  sportCode: "TENNIS",
  sportName: "Tennis",
  courtId: null,
  courtName: null,
  venueName: null,
  locationDescription: "Hải Châu",
  startAt: "2026-07-24T18:00:00+07:00",
  endAt: "2026-07-24T20:00:00+07:00",
  requiredSkillLevelMin: "Trung bình",
  requiredSkillLevelMax: "Nâng cao",
  maxParticipants: 4,
  participantCount: 1,
  availableSlots: 3,
  costDescription: null,
  description: "Kèo tennis tối",
  status: "Open",
  isHost,
  isParticipant: false,
  myJoinRequestStatus: null,
  createdAt: "2026-07-19T08:00:00+07:00",
});

async function detailRoutes(page: Page, isHost: boolean, handler?: (request: Request) => Promise<unknown> | unknown) {
  await auth(page);
  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const handled = await handler?.(request);
    if (handled !== undefined) return route.fulfill({ json: handled });
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches/7") return route.fulfill({ json: ok({ match: detailFixture(isHost), participants: [] }) });
    if (url.pathname === "/api/Matches/7/join-requests") return route.fulfill({ json: ok([]) });
    if (url.pathname === "/api/Matches/7/candidates") return route.fulfill({ json: ok([]) });
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
}

test("match browse applies only supported backend filters and resets them", async ({ page }) => {
  const requests: URL[] = [];
  await matchRoutes(page, (request) => requests.push(new URL(request.url())));
  await page.goto("/matches");

  await page.getByLabel("Địa điểm").fill("Hải Châu");
  await page.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await page.getByLabel("Trình độ").click();
  await page.getByRole("option", { name: "Trung bình" }).click();
  await page.getByLabel("Từ ngày").fill("2026-07-24");
  await page.getByLabel("Đến ngày").fill("2026-07-25");
  await page.getByText("Bao gồm kèo đã đủ người", { exact: true }).click();
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();

  await expect.poll(() => requests.length).toBeGreaterThan(1);
  const applied = requests.at(-1)!;
  expect(Object.fromEntries(applied.searchParams)).toEqual({
    SportId: "3", SkillLevel: "1", Location: "Hải Châu",
    StartFrom: "2026-07-24T00:00:00+07:00", StartTo: "2026-07-25T23:59:00+07:00",
    IncludeFull: "true", PageIndex: "1", PageSize: "12",
  });

  await page.getByRole("button", { name: "Đặt lại bộ lọc" }).click();
  await expect(page.getByLabel("Địa điểm")).toHaveValue("");
  await expect.poll(() => requests.at(-1)?.searchParams.toString()).toBe("PageIndex=1&PageSize=12");
});

test("match browse rejects an inverted date range without navigating or requesting", async ({ page }) => {
  const requests: URL[] = [];
  await matchRoutes(page, (request) => requests.push(new URL(request.url())));
  await page.goto("/matches");
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  const before = requests.length;

  await page.getByLabel("Từ ngày").fill("2026-07-25");
  await page.getByLabel("Đến ngày").fill("2026-07-24");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();

  await expect(page.getByText("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu")).toBeVisible();
  await expect(page.getByLabel("Đến ngày")).toHaveAttribute("aria-describedby", /.+/);
  await expect(page).toHaveURL(/\/matches$/);
  await page.waitForTimeout(200);
  expect(requests).toHaveLength(before);

  await page.getByRole("button", { name: "Đặt lại bộ lọc" }).click();
  await expect(page.getByText("Ngày kết thúc phải bằng hoặc sau ngày bắt đầu")).toHaveCount(0);
});

test("match browse restores draft controls when browser history changes the URL", async ({ page }) => {
  const requests: URL[] = [];
  await matchRoutes(page, (request) => requests.push(new URL(request.url())));
  await page.goto("/matches");
  await expect.poll(() => requests.length).toBeGreaterThan(0);
  await page.getByLabel("Địa điểm").fill("Hải Châu");
  await expect(page.getByLabel("Địa điểm")).toHaveValue("Hải Châu");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page).toHaveURL(/location=H%E1%BA%A3i/);
  await page.getByLabel("Địa điểm").fill("Sơn Trà");
  await expect(page.getByLabel("Địa điểm")).toHaveValue("Sơn Trà");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page).toHaveURL(/location=S%C6%A1n/);

  await page.goBack();
  await expect(page.getByLabel("Địa điểm")).toHaveValue("Hải Châu");
  await page.goForward();
  await expect(page.getByLabel("Địa điểm")).toHaveValue("Sơn Trà");
});

test("match browse ignores a delayed response for an older URL", async ({ page }) => {
  await auth(page);
  let releaseOld!: () => void;
  const oldGate = new Promise<void>((resolve) => { releaseOld = resolve; });
  await page.route("http://localhost:5187/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Matches") {
      const location = url.searchParams.get("Location");
      if (location === "Cũ") await oldGate;
      const item = { ...detailFixture(false), id: location === "Cũ" ? 71 : 72, description: location === "Cũ" ? "Kèo cũ" : "Kèo mới" };
      return route.fulfill({ json: { ...paged([item]), totalCount: 1 } });
    }
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([]) });
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });

  await page.goto("/matches?location=C%C5%A9");
  await page.getByLabel("Địa điểm").fill("Mới");
  await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();
  await expect(page.getByText("Kèo mới", { exact: true })).toBeVisible();
  releaseOld();
  await expect(page.getByText("Kèo cũ", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Kèo mới", { exact: true })).toBeVisible();
});

test("match browse exposes retryable error and empty creation action", async ({ page }) => {
  let shouldFail = true;
  await auth(page);
  await page.route("http://localhost:5187/api/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Matches" && shouldFail) return route.fulfill({ status: 500, json: { success: false, message: "Không thể tải kèo", data: null, errors: [] } });
    if (url.pathname === "/api/Matches") return route.fulfill({ json: paged([]) });
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([]) });
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
  await page.goto("/matches");
  await expect(page.getByText("Không thể tải kèo")).toBeVisible();
  await expect(page.locator("a button")).toHaveCount(0);
  shouldFail = false;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByText("Không tìm thấy kèo đấu nào.")).toBeVisible();
  await expect(page.locator("a button")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tạo kèo mới" }).last()).toBeVisible();
});

test("create match page and dialog share labeled validation", async ({ page }) => {
  await matchRoutes(page);
  await page.goto("/matches/create");
  for (const label of ["Môn thể thao", "Địa điểm", "Ngày thi đấu", "Giờ bắt đầu", "Giờ kết thúc", "Số người tối đa", "Trình độ tối thiểu", "Trình độ tối đa", "Chi phí (tuỳ chọn)", "Mô tả (tuỳ chọn)"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: "Tạo kèo đấu" }).click();
  await expect(page.getByText("Vui lòng nhập địa điểm")).toBeVisible();
  await expect(page.getByLabel("Địa điểm")).toHaveAttribute("aria-describedby", /.+/);

  await page.goto("/matches");
  await page.getByRole("button", { name: "Tạo kèo mới" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Tạo kèo mới" });
  await expect(dialog.getByText("Mô tả (tuỳ chọn)", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Tạo kèo đấu" }).click();
  await expect(dialog.getByText("Vui lòng nhập địa điểm")).toBeVisible();
});

test("create match dialog blocks duplicate submits and exposes pending state", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-07-19T08:00:00+07:00") });
  let posts = 0;
  let releasePost!: () => void;
  const postGate = new Promise<void>((resolve) => { releasePost = resolve; });
  await auth(page);
  await page.route("http://localhost:5187/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([{ id: 3, name: "Tennis", code: "TENNIS", isActive: true }]) });
    if (url.pathname === "/api/Matches" && request.method() === "POST") {
      posts += 1;
      await postGate;
      return route.fulfill({ json: ok({ id: 99 }) });
    }
    if (url.pathname === "/api/Matches") return route.fulfill({ json: paged([]) });
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
  await page.goto("/matches");
  await page.getByRole("button", { name: "Tạo kèo mới" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Tạo kèo mới" });
  await dialog.getByLabel("Môn thể thao").click();
  await page.getByRole("option", { name: "Tennis" }).click();
  await dialog.getByLabel("Địa điểm").fill("Sân ngoài trời Hải Châu");
  await dialog.getByRole("group", { name: /Ngày thi đấu/ }).getByRole("button").click();
  await page.getByRole("gridcell", { name: /Monday, July 20,/ }).click();
  await dialog.getByRole("spinbutton", { name: /hour, Giờ bắt đầu/ }).fill("18");
  await dialog.getByRole("spinbutton", { name: /minute, Giờ bắt đầu/ }).fill("00");
  await dialog.getByRole("spinbutton", { name: /hour, Giờ kết thúc/ }).fill("20");
  await dialog.getByRole("spinbutton", { name: /minute, Giờ kết thúc/ }).fill("00");

  await dialog.locator("form").evaluate((form: HTMLFormElement) => {
    form.requestSubmit();
    form.requestSubmit();
  });

  await expect.poll(() => posts).toBe(1);
  const submit = dialog.getByRole("button", { name: "Đang tạo..." });
  await expect(submit).toBeDisabled();
  await expect(dialog.getByRole("button", { name: /close/i })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Hủy" }).click({ force: true });
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  expect(posts).toBe(1);
  releasePost();
  await expect(page).toHaveURL(/\/matches\/99$/);
});

test("my matches empty state links clearly to match creation", async ({ page }) => {
  await matchRoutes(page);
  await page.goto("/player/matches");
  await expect(page.getByText("Bạn chưa tổ chức kèo đấu nào.")).toBeVisible();
  await expect(page.locator("a button")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Tạo kèo mới" })).toHaveAttribute("href", "/matches/create");
});

test("received invitations render the backend report and accept with the reported status", async ({ page }) => {
  const responses: unknown[] = [];
  let releaseResponse!: () => void;
  const responseGate = new Promise<void>((resolve) => { releaseResponse = resolve; });
  await auth(page);
  await page.route("http://localhost:5187/api/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches") return route.fulfill({ json: paged([]) });
    if (url.pathname === "/api/Matches/invitations/me") return route.fulfill({ json: ok([{
      id: 44, matchId: 7, sportName: "Tennis", matchStartAt: "2026-07-24T18:00:00+07:00",
      inviterProfileId: 9, inviterName: "Chủ kèo", inviteeProfileId: 1, inviteeName: "Player",
      message: "Cùng chơi nhé", status: responses.length ? "Accepted" : "Pending",
      invitedAt: "2026-07-19T08:00:00+07:00", respondedAt: null,
    }, {
      id: 45, matchId: 8, sportName: "Cầu lông", matchStartAt: "2026-07-25T18:00:00+07:00",
      inviterProfileId: 10, inviterName: "Minh", inviteeProfileId: 1, inviteeName: "Player",
      message: null, status: "Pending", invitedAt: "2026-07-19T09:00:00+07:00", respondedAt: null,
    }]) });
    if (url.pathname === "/api/Matches/invitations/44" && request.method() === "PATCH") {
      responses.push(request.postDataJSON());
      return responseGate.then(() => route.fulfill({ json: ok(null) }));
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
  await page.goto("/player/matches");
  await page.getByRole("tab", { name: "Lời mời" }).click();
  await expect(page.getByRole("link", { name: "Tennis" })).toHaveAttribute("href", "/matches/7");
  await expect(page.getByText("Cùng chơi nhé")).toBeVisible();
  const accept = page.getByRole("button", { name: "Chấp nhận lời mời Tennis" });
  await accept.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect.poll(() => responses).toEqual([{ status: "Accepted" }]);
  await expect(page.getByRole("button", { name: "Đang phản hồi lời mời Tennis" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời Cầu lông" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Từ chối lời mời Cầu lông" })).toBeDisabled();
  releaseResponse();
  await expect(page.getByRole("button", { name: "Chấp nhận lời mời Tennis" })).toHaveCount(0);
});

test("a failed received-invitation response is visible and retryable without duplicates", async ({ page }) => {
  let patches = 0;
  await auth(page);
  await page.route("http://localhost:5187/api/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches") return route.fulfill({ json: paged([]) });
    if (url.pathname === "/api/Matches/invitations/me") return route.fulfill({ json: ok([{
      id: 44, matchId: 7, sportName: "Tennis", matchStartAt: "2026-07-24T18:00:00+07:00",
      inviterProfileId: 9, inviterName: "Chủ kèo", inviteeProfileId: 1, inviteeName: "Player",
      message: null, status: patches > 1 ? "Accepted" : "Pending",
      invitedAt: "2026-07-19T08:00:00+07:00", respondedAt: null,
    }]) });
    if (url.pathname === "/api/Matches/invitations/44" && request.method() === "PATCH") {
      patches += 1;
      return route.fulfill({ json: patches === 1
        ? { success: false, message: "Không thể phản hồi lời mời", data: null, errors: [] }
        : ok(null) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
  await page.goto("/player/matches");
  await page.getByRole("tab", { name: "Lời mời" }).click();
  const accept = page.getByRole("button", { name: "Chấp nhận lời mời Tennis" });
  await accept.evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect(page.getByText("Không thể phản hồi lời mời")).toBeVisible();
  expect(patches).toBe(1);
  await expect(accept).toBeEnabled();
  await accept.click();
  await expect.poll(() => patches).toBe(2);
  await expect(accept).toHaveCount(0);
});

test("match candidates are host-only and invitations send the reported request body once", async ({ page }) => {
  let candidateRequests = 0;
  const invitationBodies: unknown[] = [];
  let releaseInvite!: () => void;
  const inviteGate = new Promise<void>((resolve) => { releaseInvite = resolve; });
  await detailRoutes(page, true, async (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches/7/candidates") {
      candidateRequests += 1;
      expect(url.search).toBe("?limit=20");
      return ok([{ profileId: 20, fullName: "Nguyễn Minh Anh", avatarUrl: null, city: "Đà Nẵng", skillLevel: null, matchScore: 92 }]);
    }
    if (url.pathname === "/api/Matches/7/invitations" && request.method() === "POST") {
      invitationBodies.push(request.postDataJSON());
      await inviteGate;
      return ok({ id: 50, status: "Pending" });
    }
  });
  await page.goto("/matches/7");

  await expect(page.getByRole("heading", { name: "Gợi ý người chơi" })).toBeVisible();
  await expect(page.getByText("Nguyễn Minh Anh", { exact: true })).toBeVisible();
  await expect(page.getByText("Đà Nẵng")).toBeVisible();
  await expect(page.getByText("Chưa cập nhật", { exact: true })).toBeVisible();
  await expect(page.getByText("92% phù hợp")).toBeVisible();
  await page.getByLabel("Lời nhắn cho Nguyễn Minh Anh").fill("Tham gia cùng bọn mình nhé");
  await page.getByRole("button", { name: "Mời Nguyễn Minh Anh" }).evaluate((button: HTMLButtonElement) => {
    button.click();
    button.click();
  });
  await expect.poll(() => invitationBodies.length).toBe(1);
  expect(invitationBodies[0]).toEqual({ inviteeProfileId: 20, message: "Tham gia cùng bọn mình nhé" });
  await expect(page.getByRole("button", { name: "Đang gửi lời mời Nguyễn Minh Anh" })).toBeDisabled();
  releaseInvite();
  await expect(page.getByText("Đã gửi lời mời cho Nguyễn Minh Anh")).toBeVisible();
  await expect(page.getByRole("button", { name: "Đã mời Nguyễn Minh Anh" })).toBeDisabled();
  expect(candidateRequests).toBe(1);
});

test("candidate failures are visible and retryable", async ({ page }) => {
  let attempts = 0;
  await detailRoutes(page, true, (request) => {
    const url = new URL(request.url());
    if (url.pathname !== "/api/Matches/7/candidates") return;
    attempts += 1;
    return attempts === 1
      ? { success: false, message: "Không thể tải người chơi phù hợp", data: null, errors: [] }
      : ok([]);
  });
  await page.goto("/matches/7");
  await expect(page.getByText("Không thể tải người chơi phù hợp")).toBeVisible();
  await page.getByRole("button", { name: "Thử tải lại người chơi" }).click();
  await expect(page.getByText("Chưa tìm thấy người chơi phù hợp.")).toBeVisible();
  expect(attempts).toBe(2);
});

test("failed invitations keep the candidate retryable", async ({ page }) => {
  let posts = 0;
  await detailRoutes(page, true, (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches/7/candidates") {
      return ok([{ profileId: 20, fullName: "Nguyễn Minh Anh", avatarUrl: null, city: null, skillLevel: "Nâng cao", matchScore: 92 }]);
    }
    if (url.pathname === "/api/Matches/7/invitations" && request.method() === "POST") {
      posts += 1;
      return posts === 1
        ? { success: false, message: "Không thể gửi lời mời", data: null, errors: [] }
        : ok({ id: 50, status: "Pending" });
    }
  });
  await page.goto("/matches/7");
  const invite = page.getByRole("button", { name: "Mời Nguyễn Minh Anh" });
  await invite.click();
  await expect(page.getByText("Không thể gửi lời mời")).toBeVisible();
  await expect(invite).toBeEnabled();
  await invite.click();
  await expect(page.getByText("Đã gửi lời mời cho Nguyễn Minh Anh")).toBeVisible();
  expect(posts).toBe(2);
});

test("non-host match detail never requests or renders candidates", async ({ page }) => {
  let candidateRequests = 0;
  await detailRoutes(page, false, (request) => {
    if (new URL(request.url()).pathname === "/api/Matches/7/candidates") candidateRequests += 1;
  });
  await page.goto("/matches/7");
  await expect(page.getByRole("heading", { name: "Kèo tennis tối" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Gợi ý người chơi" })).toHaveCount(0);
  expect(candidateRequests).toBe(0);
});

test("host cancellation and join decisions require confirmation before mutation", async ({ page }) => {
  let cancelCalls = 0;
  let decisionCalls = 0;
  let releaseCancel!: () => void;
  const cancelGate = new Promise<void>((resolve) => { releaseCancel = resolve; });
  await detailRoutes(page, true, (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches/7/join-requests" && request.method() === "GET") {
      return ok([{ id: 12, matchId: 7, userId: 30, userName: "Lan", avatarUrl: null, status: "Pending", createdAt: "2026-07-19T09:00:00+07:00" }]);
    }
    if (url.pathname === "/api/Matches/7/cancel") { cancelCalls += 1; return cancelGate.then(() => ok(null)); }
    if (url.pathname === "/api/Matches/7/join-requests/12") {
      decisionCalls += 1;
      return decisionCalls === 1
        ? { success: false, message: "Không thể duyệt yêu cầu", data: null, errors: [] }
        : ok(null);
    }
  });
  await page.goto("/matches/7");

  await page.getByRole("button", { name: "Hủy kèo" }).click();
  expect(cancelCalls).toBe(0);
  const cancelDialog = page.getByRole("dialog", { name: "Xác nhận hủy kèo" });
  await expect(cancelDialog).toBeVisible();
  await cancelDialog.getByRole("button", { name: "Xác nhận hủy kèo" }).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect.poll(() => cancelCalls).toBe(1);
  await expect(cancelDialog).toBeVisible();
  await expect(cancelDialog.getByRole("button", { name: "Đang xử lý" })).toBeDisabled();
  await expect(cancelDialog.getByRole("button", { name: "Quay lại" })).toBeDisabled();
  releaseCancel();
  await expect(cancelDialog).toHaveCount(0);

  await page.getByRole("button", { name: "Duyệt Lan" }).click();
  expect(decisionCalls).toBe(0);
  const decisionDialog = page.getByRole("dialog", { name: "Xác nhận duyệt yêu cầu" });
  await expect(decisionDialog).toBeVisible();
  await decisionDialog.getByRole("button", { name: "Xác nhận duyệt" }).click();
  await expect(decisionDialog.getByText("Không thể duyệt yêu cầu")).toBeVisible();
  await expect(decisionDialog).toBeVisible();
  await decisionDialog.getByRole("button", { name: "Xác nhận duyệt" }).click();
  await expect.poll(() => decisionCalls).toBe(2);
  await expect(decisionDialog).toHaveCount(0);
});

test("a stale candidate response cannot overwrite a host-action refresh", async ({ page }) => {
  let candidateCalls = 0;
  let releaseFirst!: () => void;
  const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
  await detailRoutes(page, true, async (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/Matches/7/candidates") {
      candidateCalls += 1;
      if (candidateCalls === 1) {
        await firstGate;
        return ok([{ profileId: 20, fullName: "Kết quả cũ", avatarUrl: null, city: null, skillLevel: null, matchScore: 50 }]);
      }
      return ok([{ profileId: 21, fullName: "Kết quả mới", avatarUrl: null, city: null, skillLevel: "Nâng cao", matchScore: 95 }]);
    }
    if (url.pathname === "/api/Matches/7/cancel") return ok(null);
  });
  await page.goto("/matches/7");
  await expect.poll(() => candidateCalls).toBe(1);
  await page.getByRole("button", { name: "Hủy kèo" }).click();
  await page.getByRole("dialog", { name: "Xác nhận hủy kèo" }).getByRole("button", { name: "Xác nhận hủy kèo" }).click();
  await expect(page.getByText("Kết quả mới", { exact: true })).toBeVisible();
  releaseFirst();
  await expect(page.getByText("Kết quả cũ")).toHaveCount(0);
  await expect(page.getByText("Kết quả mới", { exact: true })).toBeVisible();
});

test("navigating to another match cannot render the stale match response", async ({ page }) => {
  let oldRequests = 0;
  let releaseOld!: () => void;
  const oldGate = new Promise<void>((resolve) => { releaseOld = resolve; });
  await auth(page);
  await page.route("http://localhost:5187/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/Matches/7") {
      oldRequests += 1;
      await oldGate;
      return route.fulfill({ json: ok({ match: { ...detailFixture(true), description: "Kèo cũ" }, participants: [] }) });
    }
    if (url.pathname === "/api/Matches/8") {
      return route.fulfill({ json: ok({ match: { ...detailFixture(false), id: 8, description: "Kèo mới" }, participants: [] }) });
    }
    if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
    return route.fulfill({ json: ok([]) });
  });
  const oldNavigation = page.goto("/matches/7").catch(() => null);
  await expect.poll(() => oldRequests).toBeGreaterThan(0);
  await page.goto("/matches/8");
  await expect(page.getByRole("heading", { name: "Kèo mới" })).toBeVisible();
  releaseOld();
  await oldNavigation;
  await expect(page.getByRole("heading", { name: "Kèo cũ" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Kèo mới" })).toBeVisible();
});

test.describe("New York selected-date offsets", () => {
  test.use({ timezoneId: "America/New_York" });

  test("match browse serializes each boundary with its selected date offset", async ({ page }) => {
    const requests: URL[] = [];
    await matchRoutes(page, (request) => requests.push(new URL(request.url())));
    await page.goto("/matches");
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    await page.getByLabel("Từ ngày").fill("2026-01-15");
    await expect(page.getByLabel("Từ ngày")).toHaveValue("2026-01-15");
    await page.getByLabel("Đến ngày").fill("2026-07-15");
    await page.getByRole("button", { name: "Áp dụng bộ lọc" }).click();

    await expect.poll(() => requests.at(-1)?.searchParams.get("StartFrom")).toBe("2026-01-15T00:00:00-05:00");
    expect(requests.at(-1)?.searchParams.get("StartTo")).toBe("2026-07-15T23:59:00-04:00");
  });

  test("create match rejects a nonexistent DST wall time", async ({ page }) => {
    await page.clock.install({ time: new Date("2026-03-01T08:00:00-05:00") });
    let posts = 0;
    await auth(page);
    await page.route("http://localhost:5187/api/**", (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === "/api/Sports") return route.fulfill({ json: ok([{ id: 3, name: "Tennis", code: "TENNIS", isActive: true }]) });
      if (url.pathname === "/api/Matches" && request.method() === "POST") posts += 1;
      if (url.pathname === "/api/Notifications/unread-count") return route.fulfill({ json: ok({ count: 0 }) });
      return route.fulfill({ json: ok([]) });
    });
    await page.goto("/matches/create");
    await page.getByLabel("Môn thể thao").click();
    await page.getByRole("option", { name: "Tennis" }).click();
    await page.getByLabel("Địa điểm").fill("Central Park");
    await page.getByRole("group", { name: /Ngày thi đấu/ }).getByRole("button").click();
    await page.getByRole("gridcell", { name: /Sunday, March 8,/ }).click();
    await page.getByRole("spinbutton", { name: /hour, Giờ bắt đầu/ }).fill("02");
    await page.getByRole("spinbutton", { name: /minute, Giờ bắt đầu/ }).fill("30");
    await page.getByRole("spinbutton", { name: /hour, Giờ kết thúc/ }).fill("03");
    await page.getByRole("spinbutton", { name: /minute, Giờ kết thúc/ }).fill("30");
    await page.getByRole("button", { name: "Tạo kèo đấu" }).click();

    await expect(page.getByText("Giờ bắt đầu không tồn tại trong múi giờ hiện tại")).toBeVisible();
    expect(posts).toBe(0);
  });
});
