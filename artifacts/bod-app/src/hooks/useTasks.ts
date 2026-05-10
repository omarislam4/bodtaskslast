import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

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

export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

// Activity items stored in task.activityLog array field
// Compatible with both the n8n WhatsApp flow replies and manual entries
export interface ActivityLog {
  id: string;
  type: "message" | "reply" | "notification" | "comment";
  source: "whatsapp" | "manual" | "system";
  text: string;
  timestamp: number; // unix ms
  sender?: string;   // display name or phone
}

export interface Task {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
  senderId: string;
  deadline: Date | null;
  estimatedHours: number;
  progress: number;
  createdAt: Date;
  createdBy: string;
  completedAt: Date | null;
  activityLog: ActivityLog[];
}

function mapTask(doc: { id: string; data: () => Record<string, unknown> }): Task {
  const d = doc.data();
  // Normalize activityLog: add generated id if missing
  const rawLog = Array.isArray(d.activityLog) ? d.activityLog : [];
  const activityLog: ActivityLog[] = rawLog.map((item: Record<string, unknown>, idx: number) => ({
    id: `${doc.id}-${idx}`,
    type: (item.type as ActivityLog["type"]) || "message",
    source: (item.source as ActivityLog["source"]) || "manual",
    text: (item.text as string) || "",
    timestamp: typeof item.timestamp === "number" ? item.timestamp : Date.now(),
    sender: item.sender as string | undefined,
  }));

  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    assigneeIds: [],
    senderId: "",
    spaceId: "",
    estimatedHours: 0,
    progress: 0,
    createdBy: "",
    ...d,
    id: doc.id,
    deadline: toDate(d.deadline),
    createdAt: toDate(d.createdAt) ?? new Date(),
    completedAt: toDate(d.completedAt),
    activityLog,
  } as Task;
}

export const useTasks = (spaceId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spaceId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "tasks"), where("spaceId", "==", spaceId));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(mapTask)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setTasks(data);
      setLoading(false);
    });

    return () => unsub();
  }, [spaceId]);

  return { tasks, loading };
};

export const useAllTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(mapTask));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { tasks, loading };
};
