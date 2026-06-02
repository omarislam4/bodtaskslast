import api from "./api";
import type { Form, CreateFormPayload } from "@/hooks/useForms";

export const formsService = {
  list: (): Promise<Form[]> =>
    api.get<Form[]>("/forms").then((r) => r.data),

  create: (payload: CreateFormPayload): Promise<Form> =>
    api.post<Form>("/forms", payload).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/forms/${id}`).then(() => undefined),

  getPublic: (id: string): Promise<Form> =>
    api.get<Form>(`/forms/${id}/public`).then((r) => r.data),

  submit: (id: string, values: Record<string, string | boolean>): Promise<void> =>
    api.post(`/forms/${id}/submit`, { values }).then(() => undefined),
};
