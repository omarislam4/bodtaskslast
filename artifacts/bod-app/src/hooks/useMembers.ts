import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { UserDoc } from "../contexts/AuthContext";

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

export const useMembers = () => {
  const [members, setMembers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("displayName"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        email: "",
        displayName: "",
        role: "member" as const,
        avatar: "",
        spaceIds: [],
        phone: "",
        countryCode: "+1",
        shiftEnd: "",
        shiftReminderSent: false,
        ...doc.data(),
        id: doc.id,
        createdAt: toDate(doc.data().createdAt),
      })) as UserDoc[];
      setMembers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { members, loading };
};
