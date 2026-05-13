import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export type FormFieldType = "text" | "number" | "date" | "dropdown" | "checkbox" | "email";

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  options?: string[];
}

export interface Form {
  id: string;
  title: string;
  description: string;
  spaceId: string;
  fields: FormField[];
  submissionCount: number;
  isPublic: boolean;
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

export const useForms = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setForms(snap.docs.map(doc => {
        const d = doc.data();
        return {
          title: "",
          description: "",
          spaceId: "",
          submissionCount: 0,
          isPublic: true,
          createdBy: "",
          ...d,
          id: doc.id,
          fields: Array.isArray(d.fields) ? d.fields as FormField[] : [],
          createdAt: toDate(d.createdAt) ?? new Date(),
        } as Form;
      }));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { forms, loading };
};
