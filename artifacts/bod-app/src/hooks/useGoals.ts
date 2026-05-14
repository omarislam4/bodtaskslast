import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export type GoalType = "number" | "percent" | "boolean" | "currency";
export type GoalStatus = "on_track" | "at_risk" | "off_track" | "completed";

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  targetValue: number;
  currentValue: number;
  currency?: string;
  status: GoalStatus;
  folder?: string;
  spaceId?: string;
  linkedTaskIds: string[];
  createdBy: string;
  createdAt: Date;
  dueDate?: Date | null;
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

function mapGoal(doc: { id: string; data: () => Record<string, unknown> }): Goal {
  const d = doc.data();
  return {
    title: "",
    description: "",
    type: "percent",
    targetValue: 100,
    currentValue: 0,
    status: "on_track",
    createdBy: "",
    ...d,
    id: doc.id,
    linkedTaskIds: Array.isArray(d.linkedTaskIds) ? (d.linkedTaskIds as string[]) : [],
    createdAt: toDate(d.createdAt) ?? new Date(),
    dueDate: toDate(d.dueDate),
  } as Goal;
}

export const useGoals = (spaceId?: string) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "goals"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(mapGoal);
      setGoals(spaceId ? all.filter(g => g.spaceId === spaceId) : all);
      setLoading(false);
    });
    return () => unsub();
  }, [spaceId]);

  return { goals, loading };
};
