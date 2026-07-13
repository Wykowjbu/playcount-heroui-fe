import { apiFetch, buildQuery } from "@/lib/api/client";
import type { NotificationDto, NotificationQueryDto } from "@/lib/types/api";

export async function getMyNotifications(query: NotificationQueryDto = {}) {
  const qs = buildQuery(query as Record<string, string | number | boolean | undefined | null>);
  const res = await apiFetch<NotificationDto[]>(`/Notifications${qs}`);
  return res.data ?? [];
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
