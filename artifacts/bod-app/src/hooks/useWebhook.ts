import { useState, useEffect } from "react";
import { doc, onSnapshot, setDoc, arrayUnion, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

export interface WebhookSettings {
  webhookUrl: string;
  reminderMinutes: number;
}

export const useWebhookSettings = () => {
  const [settings, setSettings] = useState<WebhookSettings>({ webhookUrl: "", reminderMinutes: 30 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "global"), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setSettings({
          webhookUrl: d.webhookUrl || "",
          reminderMinutes: d.reminderMinutes || 30,
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const saveSettings = async (next: WebhookSettings) => {
    await setDoc(doc(db, "settings", "global"), next, { merge: true });
  };

  return { settings, loading, saveSettings };
};

export type WebhookType = "manual" | "auto-shift";

export interface WebhookPayload {
  type: WebhookType;
  taskName?: string;
  taskId?: string;
  deadline?: string;
  phone?: string;
  assigneeIds?: string[];
  spaceId?: string;
  spaceTitle?: string;
  source: "dashboard";
}

// Send webhook and log notification in task.activityLog array (same field n8n writes to)
export async function sendToWebhook(
  webhookUrl: string,
  data: WebhookPayload,
  taskId?: string
): Promise<void> {
  if (!webhookUrl) throw new Error("No webhook URL configured");

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

  // Save notification in the task's activityLog array field (same as n8n reply handler)
  if (taskId) {
    try {
      await updateDoc(doc(db, "tasks", taskId), {
        activityLog: arrayUnion({
          type: "notification",
          source: "manual",
          text: `Shift reminder sent via WhatsApp (${data.type})`,
          timestamp: Date.now(),
          sender: "System",
        }),
      });
    } catch {
      // non-critical, ignore
    }
  }
}
