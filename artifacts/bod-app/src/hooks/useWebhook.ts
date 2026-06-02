import { useAppSettings } from "@/hooks/useSettingsQueries";

export interface WebhookSettings {
  webhookUrl: string;
  reminderMinutes: number;
}

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

export const useWebhookSettings = () => {
  const { data, isLoading } = useAppSettings(true);
  const settings: WebhookSettings = {
    webhookUrl: data?.webhookUrl ?? "",
    reminderMinutes: data?.reminderMinutes ?? 30,
  };
  return { settings, loading: isLoading };
};

export async function sendToWebhook(
  webhookUrl: string,
  data: WebhookPayload,
  _taskId?: string
): Promise<void> {
  if (!webhookUrl) throw new Error("No webhook URL configured");

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error(`Webhook returned ${res.status}`);
}
