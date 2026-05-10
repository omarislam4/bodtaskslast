import { useState, useEffect } from "react";
import { collection, onSnapshot, query, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

function toDate(val: unknown): Date {
  if (!val) return new Date();
  if (val instanceof Timestamp) return val.toDate();
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") {
    const d = new Date(val);
    return isNaN(d.getTime()) ? new Date() : d;
  }
  return new Date();
}

export interface SpaceDataItem {
  id: string;
  type: "folder" | "link";
  name: string;
  url?: string;
  notes?: string;
  parentId: string | null;
  createdAt: Date;
  createdBy: string;
}

export const useSpaceData = (spaceId: string | undefined) => {
  const [items, setItems] = useState<SpaceDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!spaceId) { setLoading(false); return; }

    const q = query(collection(db, "spaces", spaceId, "data"));

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map((d) => {
          const raw = d.data();
          return {
            type: (raw.type ?? "link") as "folder" | "link",
            name: (raw.name ?? "") as string,
            parentId: (raw.parentId ?? null) as string | null,
            createdBy: (raw.createdBy ?? "") as string,
            url: (raw.url ?? "") as string,
            notes: (raw.notes ?? "") as string,
            id: d.id,
            createdAt: toDate(raw.createdAt),
          } as SpaceDataItem;
        })
        .sort((a, b) => {
          if (a.type === "folder" && b.type === "link") return -1;
          if (a.type === "link" && b.type === "folder") return 1;
          return a.createdAt.getTime() - b.createdAt.getTime();
        });
      setItems(data);
      setLoading(false);
    });

    return () => unsub();
  }, [spaceId]);

  return { items, loading };
};
