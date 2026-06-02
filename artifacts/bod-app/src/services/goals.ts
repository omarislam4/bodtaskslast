import api from "./api";
import type { Goal, CreateGoalPayload, UpdateGoalPayload } from "@/types";

export const goalsService = {
  list: (spaceId?: string): Promise<Goal[]> =>
    api.get<Goal[]>("/goals", { params: spaceId ? { spaceId } : undefined }).then((r) => r.data),

  create: (payload: CreateGoalPayload): Promise<Goal> =>
    api
      .post<{ message: string; goal: Goal }>("/goals", payload)
      .then((r) => r.data.goal),

  update: (id: string, payload: UpdateGoalPayload): Promise<Goal> =>
    api
      .patch<{ message: string; goal: Goal }>(`/goals/${id}`, payload)
      .then((r) => r.data.goal),

  remove: (id: string): Promise<void> =>
    api.delete(`/goals/${id}`).then(() => undefined),
};
