import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { notificationsService } from "@/services/notifications";

export type NotificationType = "assignment" | "mention" | "comment" | "status_change" | "reminder" | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  taskId?: string;
  spaceId?: string;
  read: boolean;
  createdAt: Date;
  actorName?: string;
}

export const notificationKeys = {
  all: () => ["notifications"] as const,
};

export const useNotifications = (userId?: string) => {
  const query = useQuery({
    queryKey: notificationKeys.all(),
    queryFn: async () => {
      const data = await notificationsService.list();
      return data.map((n) => ({
        ...n,
        createdAt: n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt as unknown as string),
      })) as Notification[];
    },
    enabled: !!userId,
    refetchInterval: 60 * 1000,
    staleTime: 0,
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const prevUnreadRef = useRef<number | null>(null);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    if (prevUnreadRef.current !== null && unreadCount > prevUnreadRef.current) {
      setHasNew(true);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const clearNew = () => setHasNew(false);

  return {
    notifications,
    loading: query.isLoading,
    unreadCount,
    hasNew,
    clearNew,
  };
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all() });
    },
  });
};
