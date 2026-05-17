import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

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

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function mapNotif(doc: { id: string; data: () => Record<string, unknown> }): Notification {
  const d = doc.data();
  return {
    userId: "",
    type: "system",
    title: "",
    body: "",
    read: false,
    ...d,
    id: doc.id,
    createdAt: toDate(d.createdAt) ?? new Date(),
  } as Notification;
}

export const useNotifications = (userId?: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // ↓ بدّل الـ onSnapshot القديم بده
    const unsub = onSnapshot(q, 
      (snap) => {
        console.log("Notifications count:", snap.docs.length);
        console.log("Notifications data:", snap.docs.map(d => d.data()));
        setNotifications(snap.docs.map(mapNotif));
        setLoading(false);
      },
      (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;
  return { notifications, loading, unreadCount };
};
