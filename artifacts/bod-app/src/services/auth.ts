import api from "./api";
import type { UserDoc, LoginPayload, RegisterPayload, AuthResponse } from "@/types";

export type { LoginPayload, RegisterPayload, AuthResponse };

export const authService = {
  login: (payload: LoginPayload): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/login", payload).then((r) => r.data),

  register: (payload: RegisterPayload): Promise<AuthResponse> =>
    api.post<AuthResponse>("/auth/register",{...payload, name: payload.displayName}).then((r) => r.data),

  me: (): Promise<UserDoc> =>
    api.get<UserDoc>("/auth/me").then((r) => r.data),
};
