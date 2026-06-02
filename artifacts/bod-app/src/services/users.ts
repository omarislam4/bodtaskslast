import api from "./api";
import type { UserDoc, UpdateProfilePayload } from "@/types";

interface UpdateProfileResponse {
  message: string;
  user: UserDoc;
}

export interface CreateUserPayload {
  email: string;
  displayName: string;
  role?: "admin" | "member";
  password?: string;
}

export const usersService = {
  list: (): Promise<UserDoc[]> =>
    api.get<UserDoc[]>("/users").then((r) => r.data),

  create: (payload: CreateUserPayload): Promise<UserDoc> =>
    api.post<{ message: string; user: UserDoc }>("/users", payload).then((r) => r.data.user),

  update: (id: string, payload: Record<string, unknown>): Promise<UserDoc> =>
    api.patch<UpdateProfileResponse>(`/users/${id}`, payload).then((r) => r.data.user),

  updateProfile: (id: string, payload: UpdateProfilePayload): Promise<UserDoc> =>
    api.patch<UpdateProfileResponse>(`/users/${id}`, payload).then((r) => r.data.user),

  remove: (id: string): Promise<void> =>
    api.delete(`/users/${id}`).then(() => undefined),
};
