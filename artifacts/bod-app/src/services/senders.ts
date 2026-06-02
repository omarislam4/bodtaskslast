import api from "./api";
import type { Sender, CreateSenderPayload } from "@/hooks/useSenders";

export const sendersService = {
  list: (): Promise<Sender[]> =>
    api.get<Sender[]>("/senders").then((r) => r.data),

  create: (payload: CreateSenderPayload): Promise<Sender> =>
    api.post<Sender>("/senders", payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateSenderPayload>): Promise<Sender> =>
    api.patch<Sender>(`/senders/${id}`, payload).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/senders/${id}`).then(() => undefined),
};
