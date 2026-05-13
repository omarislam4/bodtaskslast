import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export type SprintStatus = "planning" | "active" | "completed";

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  spaceId: string;
  status: SprintStatus;
  startDate: Date | null;
  endDate: Date | null;
  taskIds: string[];
  totalPoints: number;
  completedPoints: number;
  createdBy: string;
  createdAt: Date;
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

function mapSprint(doc: { id: string; data: () => Record<string, unknown> }): Sprint {
  const d = doc.data();
  return {
    name: "",
    goal: "",
    spaceId: "",
    status: "planning",
    totalPoints: 0,
    completedPoints: 0,
    createdBy: "",
    ...d,
    id: doc.id,
    taskIds: Array.isArray(d.taskIds) ? (d.taskIds as string[]) : [],
    startDate: toDate(d.startDate),
    endDate: toDate(d.endDate),
    createdAt: toDate(d.createdAt) ?? new Date(),
  } as Sprint;
}

export const useSprints = (spaceId?: string) => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "sprints"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(mapSprint);
      setSprints(spaceId ? all.filter(s => s.spaceId === spaceId) : all);
      setLoading(false);
    });
    return () => unsub();
  }, [spaceId]);

  return { sprints, loading };
};
