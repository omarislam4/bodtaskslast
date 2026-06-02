import api from "./api";
import type { AppSettings, UpdateAppSettingsPayload } from "@/types";

interface UpdateSettingsResponse {
  message: string;
  settings: AppSettings;
}

export const settingsService = {
  getApp: (): Promise<AppSettings> =>
    api.get<AppSettings>("/settings/app").then((r) => r.data),

  updateApp: (payload: UpdateAppSettingsPayload): Promise<AppSettings> =>
    api.patch<UpdateSettingsResponse>("/settings/app", payload).then((r) => r.data.settings),
};
