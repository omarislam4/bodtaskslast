export interface AppSettings {
  webhookUrl: string;
  reminderMinutes: number;
}

export interface UpdateAppSettingsPayload {
  webhookUrl?: string;
  reminderMinutes?: number;
}
