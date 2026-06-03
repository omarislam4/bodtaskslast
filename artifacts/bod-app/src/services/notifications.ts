import api from "./api";

export interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  taskId?: string | null;
  spaceId?: string | null;
}

export const notificationsService = {
  list: (): Promise<import("@/hooks/useNotifications").Notification[]> =>
    api.get("/inbox/notifications").then((r) => r.data),

  markRead: (id: string): Promise<void> =>
    api.post(`/inbox/notifications/${id}/read`).then(() => undefined),

  markAllRead: (): Promise<void> =>
    api.post("/inbox/notifications/mark-all-read").then(() => undefined),

  create: (payload: NotificationPayload): Promise<void> =>
    api.post("/inbox/notifications", { ...payload, read: false }).then(() => undefined),
};
