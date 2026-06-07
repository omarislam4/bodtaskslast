import api from "./api";
import type { Sprint, CreateSprintPayload, UpdateSprintPayload, PaginatedSprintsResponse } from "@/types";

export const sprintsService = {
  list: (spaceId?: string): Promise<Sprint[]> =>
    api.get<Sprint[]>("/sprints", { params: spaceId ? { spaceId } : undefined }).then((r) => r.data),

  listPaginated: (params: { spaceId?: string; page: number; perPage: number }): Promise<PaginatedSprintsResponse> =>
    api.get<PaginatedSprintsResponse>("/sprints", { params }).then((r) => r.data),

  create: (payload: CreateSprintPayload): Promise<Sprint> =>
    api
      .post<{ message: string; sprint: Sprint }>("/sprints", payload)
      .then((r) => r.data.sprint),

  update: (id: string, payload: UpdateSprintPayload): Promise<Sprint> =>
    api
      .patch<{ message: string; sprint: Sprint }>(`/sprints/${id}`, payload)
      .then((r) => r.data.sprint),

  remove: (id: string): Promise<void> =>
    api.delete(`/sprints/${id}`).then(() => undefined),

  addTask: (id: string, taskId: string): Promise<void> =>
    api.post(`/sprints/${id}/tasks`, { taskId }).then(() => undefined),

  removeTask: (id: string, taskId: string): Promise<void> =>
    api.delete(`/sprints/${id}/tasks/${taskId}`).then(() => undefined),
};
