import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export interface ChatChannel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  memberIds: string[];
  createdBy: string;
  createdAt: Date;
  lastMessage?: string;
  lastMessageAt?: Date;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: Date;
  edited?: boolean;
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

export const useChannels = () => {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "chatChannels"), orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setChannels(snap.docs.map(doc => {
        const d = doc.data();
        return {
          name: "",
          isPrivate: false,
          createdBy: "",
          ...d,
          id: doc.id,
          memberIds: Array.isArray(d.memberIds) ? d.memberIds as string[] : [],
          createdAt: toDate(d.createdAt) ?? new Date(),
          lastMessageAt: toDate(d.lastMessageAt) ?? undefined,
        } as ChatChannel;
      }));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { channels, loading };
};

export const useMessages = (channelId?: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!channelId) { setLoading(false); return; }
    const q = query(
      collection(db, "chatMessages"),
      where("channelId", "==", channelId)
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => {
        const d = doc.data();
        return {
          channelId: "",
          senderId: "",
          senderName: "",
          text: "",
          ...d,
          id: doc.id,
          createdAt: toDate(d.createdAt) ?? new Date(),
        } as ChatMessage;
      });
      msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsub();
  }, [channelId]);

  return { messages, loading };
};
