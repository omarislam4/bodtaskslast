import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
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

export interface Sender {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: Date;
}

export const useSenders = () => {
  const [senders, setSenders] = useState<Sender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "senders"), orderBy("name"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        name: "",
        email: "",
        phone: "",
        company: "",
        ...doc.data(),
        id: doc.id,
        createdAt: toDate(doc.data().createdAt),
      })) as Sender[];
      setSenders(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { senders, loading };
};
