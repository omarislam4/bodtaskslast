import api from "./api";
import type {
  Automation,
  CreateAutomationPayload,
  UpdateAutomationPayload,
} from "@/types";

export const automationsService = {
  list: (): Promise<Automation[]> =>
    api.get<Automation[]>("/automations").then((r) => r.data),

  create: (payload: CreateAutomationPayload): Promise<Automation> =>
    api
      .post<{ message: string; automation: Automation }>("/automations", payload)
      .then((r) => r.data.automation),

  update: (id: string, payload: UpdateAutomationPayload): Promise<Automation> =>
    api
      .patch<{ message: string; automation: Automation }>(`/automations/${id}`, payload)
      .then((r) => r.data.automation),

  remove: (id: string): Promise<void> =>
    api.delete(`/automations/${id}`).then(() => undefined),
};
