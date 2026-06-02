import api from "./api";
import type {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskQueryParams,
  ChecklistItem,
  Subtask,
  TimeEntry,
  DependencyType,
  ActivityLog,
} from "@/types";

export const tasksService = {
  list: (params?: TaskQueryParams): Promise<Task[]> =>
    api.get<Task[]>("/tasks", { params }).then((r) => r.data),

  get: (id: string): Promise<Task> =>
    api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: CreateTaskPayload): Promise<Task> =>
    api
      .post<{ message: string; task: Task }>("/tasks", payload)
      .then((r) => r.data.task),

  update: (id: string, payload: UpdateTaskPayload): Promise<Task> =>
    api
      .patch<{ message: string; task: Task }>(`/tasks/${id}`, payload)
      .then((r) => r.data.task),

  remove: (id: string): Promise<void> =>
    api.delete(`/tasks/${id}`).then(() => undefined),

  // Comments
  addComment: (
    id: string,
    payload: { text: string; mentions?: string[] }
  ): Promise<ActivityLog> =>
    api
      .post<{ message: string; activity: ActivityLog }>(`/tasks/${id}/comments`, payload)
      .then((r) => r.data.activity),

  // Reminders
  sendReminder: (id: string, payload: { target: string }): Promise<void> =>
    api.post(`/tasks/${id}/reminders`, payload).then(() => undefined),

  // Checklist
  addChecklistItem: (
    id: string,
    payload: { text: string; assigneeId?: string }
  ): Promise<ChecklistItem> =>
    api
      .post<{ message: string; item: ChecklistItem }>(`/tasks/${id}/checklist-items`, payload)
      .then((r) => r.data.item),

  updateChecklistItem: (
    id: string,
    itemId: string,
    payload: { done?: boolean; text?: string }
  ): Promise<void> =>
    api
      .patch(`/tasks/${id}/checklist-items/${itemId}`, payload)
      .then(() => undefined),

  deleteChecklistItem: (id: string, itemId: string): Promise<void> =>
    api.delete(`/tasks/${id}/checklist-items/${itemId}`).then(() => undefined),

  // Subtasks
  addSubtask: (id: string, payload: { title: string }): Promise<Subtask> =>
    api
      .post<{ message: string; subtask: Subtask }>(`/tasks/${id}/subtasks`, payload)
      .then((r) => r.data.subtask),

  updateSubtask: (
    id: string,
    subtaskId: string,
    payload: { status?: string; title?: string }
  ): Promise<void> =>
    api.patch(`/tasks/${id}/subtasks/${subtaskId}`, payload).then(() => undefined),

  deleteSubtask: (id: string, subtaskId: string): Promise<void> =>
    api.delete(`/tasks/${id}/subtasks/${subtaskId}`).then(() => undefined),

  // Time Entries
  addTimeEntry: (
    id: string,
    payload: {
      duration: number;
      note?: string;
      billable?: boolean;
      startTime?: number;
      endTime?: number;
    }
  ): Promise<TimeEntry> =>
    api
      .post<{ message: string; timeEntry: TimeEntry }>(`/tasks/${id}/time-entries`, payload)
      .then((r) => r.data.timeEntry),

  deleteTimeEntry: (id: string, entryId: string): Promise<void> =>
    api.delete(`/tasks/${id}/time-entries/${entryId}`).then(() => undefined),

  // Dependencies
  addDependency: (
    id: string,
    payload: { taskId: string; type: DependencyType }
  ): Promise<void> =>
    api.post(`/tasks/${id}/dependencies`, payload).then(() => undefined),

  deleteDependency: (id: string, depTaskId: string): Promise<void> =>
    api.delete(`/tasks/${id}/dependencies/${depTaskId}`).then(() => undefined),

  // Tags
  addTag: (id: string, payload: { tag: string }): Promise<void> =>
    api.post(`/tasks/${id}/tags`, payload).then(() => undefined),

  deleteTag: (id: string, tag: string): Promise<void> =>
    api.delete(`/tasks/${id}/tags/${encodeURIComponent(tag)}`).then(() => undefined),

  // Watchers
  addWatcher: (id: string, payload: { userId: string }): Promise<void> =>
    api.post(`/tasks/${id}/watchers`, payload).then(() => undefined),

  removeWatcher: (id: string, userId: string): Promise<void> =>
    api.delete(`/tasks/${id}/watchers/${userId}`).then(() => undefined),
};
