import { useState, useEffect } from "react";
import { collection, onSnapshot, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";

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

export interface Space {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  memberIds: string[];
  createdAt: Date;
  createdBy: string;
}

export const useSpaces = () => {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, userDoc } = useAuth();

  useEffect(() => {
    if (!userDoc) return;

    let q;
    if (isAdmin) {
      q = query(collection(db, "spaces"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "spaces"),
        where("memberIds", "array-contains", userDoc.id)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        name: "",
        description: "",
        color: "#6366f1",
        icon: "",
        memberIds: [],
        createdBy: "",
        ...doc.data(),
        id: doc.id,
        createdAt: toDate(doc.data().createdAt),
      })) as Space[];
      setSpaces(data);
      setLoading(false);
    });

    return () => unsub();
  }, [isAdmin, userDoc]);

  return { spaces, loading };
};
