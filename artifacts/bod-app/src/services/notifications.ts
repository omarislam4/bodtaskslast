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
    api.get("/notifications").then((r) => r.data),

  markRead: (id: string): Promise<void> =>
    api.patch(`/notifications/${id}`, { read: true }).then(() => undefined),

  markAllRead: (): Promise<void> =>
    api.post("/notifications/read-all").then(() => undefined),

  create: (payload: NotificationPayload): Promise<void> =>
    api.post("/notifications", { ...payload, read: false }).then(() => undefined),
};
