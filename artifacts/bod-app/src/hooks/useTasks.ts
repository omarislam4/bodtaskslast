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
export type TaskType = "task" | "bug" | "feature" | "improvement";
export type BugSeverity = "critical" | "high" | "medium" | "low";
export type DependencyType = "blocking" | "blocked_by" | "related" | "duplicate";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  assigneeId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  assigneeIds: string[];
  createdAt: number;
  completedAt?: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  startTime: number;
  endTime?: number;
  duration: number;
  note?: string;
  billable: boolean;
}

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
}

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string | null;
  endAfterOccurrences?: number;
}

export interface ActivityLog {
  id: string;
  type: "message" | "reply" | "notification" | "comment";
  source: "whatsapp" | "manual" | "system";
  text: string;
  timestamp: number;
  sender?: string;
}

export interface Task {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  bugSeverity?: BugSeverity;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  tags?: string[];
  checklistItems?: ChecklistItem[];
  subtasks?: Subtask[];
  timeEntries?: TimeEntry[];
  dependencies?: TaskDependency[];
  recurrence?: RecurrenceConfig | null;
  storyPoints?: number;
  startDate?: Date | null;
  watchers?: string[];
  sprintId?: string;
  milestone?: boolean;
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
  const rawLog = Array.isArray(d.activityLog) ? d.activityLog : [];
  const activityLog: ActivityLog[] = rawLog.map((item: Record<string, unknown>, idx: number) => ({
    id: `${doc.id}-${idx}`,
    type: (item.type as ActivityLog["type"]) || "message",
    source: (item.source as ActivityLog["source"]) || "manual",
    text: (item.text as string) || "",
    timestamp: typeof item.timestamp === "number" ? item.timestamp : Date.now(),
    sender: item.sender as string | undefined,
  }));

  const rawChecklist = Array.isArray(d.checklistItems) ? d.checklistItems : [];
  const checklistItems: ChecklistItem[] = rawChecklist.map((item: Record<string, unknown>, idx: number) => ({
    id: (item.id as string) || `${doc.id}-cl-${idx}`,
    text: (item.text as string) || "",
    done: (item.done as boolean) || false,
    assigneeId: item.assigneeId as string | undefined,
  }));

  const rawSubtasks = Array.isArray(d.subtasks) ? d.subtasks : [];
  const subtasks: Subtask[] = rawSubtasks.map((item: Record<string, unknown>, idx: number) => ({
    id: (item.id as string) || `${doc.id}-st-${idx}`,
    title: (item.title as string) || "",
    status: (item.status as TaskStatus) || "todo",
    assigneeIds: Array.isArray(item.assigneeIds) ? (item.assigneeIds as string[]) : [],
    createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
    completedAt: typeof item.completedAt === "number" ? item.completedAt : undefined,
  }));

  const rawTimeEntries = Array.isArray(d.timeEntries) ? d.timeEntries : [];
  const timeEntries: TimeEntry[] = rawTimeEntries.map((item: Record<string, unknown>, idx: number) => ({
    id: (item.id as string) || `${doc.id}-te-${idx}`,
    userId: (item.userId as string) || "",
    userName: (item.userName as string) || "",
    startTime: typeof item.startTime === "number" ? item.startTime : Date.now(),
    endTime: typeof item.endTime === "number" ? item.endTime : undefined,
    duration: typeof item.duration === "number" ? item.duration : 0,
    note: item.note as string | undefined,
    billable: (item.billable as boolean) || false,
  }));

  const rawDependencies = Array.isArray(d.dependencies) ? d.dependencies : [];
  const dependencies: TaskDependency[] = rawDependencies.map((item: Record<string, unknown>) => ({
    taskId: (item.taskId as string) || "",
    type: (item.type as DependencyType) || "related",
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
    type: ((d.type as TaskType) || "task"),
    bugSeverity: d.bugSeverity as BugSeverity | undefined,
    stepsToReproduce: d.stepsToReproduce as string | undefined,
    expectedBehavior: d.expectedBehavior as string | undefined,
    actualBehavior: d.actualBehavior as string | undefined,
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    storyPoints: typeof d.storyPoints === "number" ? d.storyPoints : undefined,
    startDate: toDate(d.startDate),
    watchers: Array.isArray(d.watchers) ? (d.watchers as string[]) : [],
    sprintId: d.sprintId as string | undefined,
    milestone: (d.milestone as boolean) || false,
    recurrence: d.recurrence as RecurrenceConfig | null | undefined,
    deadline: toDate(d.deadline),
    createdAt: toDate(d.createdAt) ?? new Date(),
    completedAt: toDate(d.completedAt),
    activityLog,
    checklistItems,
    subtasks,
    timeEntries,
    dependencies,
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

export const useMyTasks = (userId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const q = query(collection(db, "tasks"), where("assigneeIds", "array-contains", userId));
    const unsub = onSnapshot(q, (snap) => {
      setTasks(snap.docs.map(mapTask).sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.getTime() - b.deadline.getTime();
      }));
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  return { tasks, loading };
};
