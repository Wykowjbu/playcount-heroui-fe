import { apiFetch, apiFetchPaged, buildQuery } from "@/lib/api/client";
import type { NotificationDto, NotificationQueryDto } from "@/lib/types/api";

export async function getMyNotifications(query: NotificationQueryDto = {}) {
  const page = await getMyNotificationsPage(query);
  return page.items;
}

export async function getMyNotificationsPage(query: NotificationQueryDto = {}) {
  const normalizedQuery = {
    ...query,
    pageIndex: Math.max(1, query.pageIndex ?? 1),
    pageSize: Math.min(50, Math.max(1, query.pageSize ?? 20)),
  };
  const qs = buildQuery(normalizedQuery as Record<string, string | number | boolean | undefined | null>);
  const res = await apiFetchPaged<NotificationDto[]>(`/Notifications${qs}`);
  return {
    items: res.data ?? [],
    totalCount: res.totalCount,
    totalPages: res.totalPages,
    pageIndex: res.pageIndex,
    pageSize: res.pageSize,
  };
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiFetch<{ count: number }>("/Notifications/unread-count");
  return res.data?.count ?? 0;
}

export async function markAsRead(id: number) {
  await apiFetch(`/Notifications/${id}/read`, { method: "PATCH" });
}

export async function markAllAsRead() {
  await apiFetch("/Notifications/read-all", { method: "PATCH" });
}

export async function deleteNotification(id: number) {
  await apiFetch(`/Notifications/${id}`, { method: "DELETE" });
}
