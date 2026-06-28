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
  PaginatedMyTasksResponse,
  PaginatedHistoryResponse,
  PaginatedTasksResponse,
} from "@/types";

export const tasksService = {
  list: (params?: TaskQueryParams): Promise<Task[]> =>
    api.get<Task[]>("/tasks", { params }).then((r) => r.data),

  listPaginated: (params: TaskQueryParams & { page: number; perPage: number }): Promise<PaginatedTasksResponse> =>
    api.get<PaginatedTasksResponse>("/tasks", { params }).then((r) => r.data),

  myTasks: (params?: { scope?: "today" | "overdue" | "upcoming" | "all"; search?: string }): Promise<Task[]> =>
    api.get<Task[]>("/my-tasks", { params }).then((r) => r.data),

  myTasksPaginated: (params: { scope?: "today" | "overdue" | "upcoming" | "all"; search?: string; page: number; perPage: number }): Promise<PaginatedMyTasksResponse> =>
    api.get<PaginatedMyTasksResponse>("/my-tasks", { params }).then((r) => r.data),

  timeline: (month: string): Promise<{ month: string; tasks: Task[] }> =>
    api.get("/tasks/timeline", { params: { month } }).then((r) => r.data),

  history: (params?: { search?: string; priority?: string }): Promise<Task[]> =>
    api.get<Task[]>("/history", { params }).then((r) => r.data),

  historyPaginated: (params: { search?: string; priority?: string; page: number; perPage: number }): Promise<PaginatedHistoryResponse> =>
    api.get<PaginatedHistoryResponse>("/history", { params }).then((r) => r.data),

  get: (id: string): Promise<Task> =>
    api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: CreateTaskPayload): Promise<Task> => {
    const hasFileAttachment = payload.attachmentType === "file" && payload.attachmentFile;
    const hasLinkAttachment = payload.attachmentType === "link" && payload.attachmentUrl?.trim();

    if (hasFileAttachment) {
      const formData = new FormData();
      const taskFields: Record<string, unknown> = {
        title: payload.title,
        description: payload.description ?? "",
        status: payload.status,
        priority: payload.priority,
        type: payload.type,
        bugSeverity: payload.bugSeverity,
        stepsToReproduce: payload.stepsToReproduce,
        expectedBehavior: payload.expectedBehavior,
        actualBehavior: payload.actualBehavior,
        assigneeIds: JSON.stringify(payload.assigneeIds ?? []),
        senderId: payload.senderId ?? "",
        spaceId: payload.spaceId,
        estimatedHours: payload.estimatedHours ?? 0,
        progress: payload.progress ?? 0,
      };

      Object.entries(taskFields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string);
        }
      });

      formData.append("attachments[0][type]", "file");
      if (payload.attachmentTitle?.trim()) {
        formData.append("attachments[0][title]", payload.attachmentTitle.trim());
      }
      formData.append("attachments[0][file]", payload.attachmentFile as File);

      return api
        .post<{ message: string; task: Task }>('/tasks', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.task);
    }

    if (hasLinkAttachment) {
      return api
        .post<{ message: string; task: Task }>('/tasks', {
          ...payload,
          attachments: [
            {
              type: 'link',
              title: payload.attachmentTitle?.trim() || undefined,
              url: payload.attachmentUrl?.trim(),
            },
          ],
        })
        .then((r) => r.data.task);
    }

    return api
      .post<{ message: string; task: Task }>('/tasks', payload)
      .then((r) => r.data.task);
  },

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

  addAttachment: (
    id: string,
    payload: { type: string; title?: string; url?: string; file?: File | null },
  ): Promise<{ id: string }> => {
    if (payload.type === "link") {
      return api
        .post<{ message: string; attachment: { id: string } }>(`/tasks/${id}/attachments`, {
          type: payload.type,
          title: payload.title?.trim() || undefined,
          url: payload.url?.trim(),
        })
        .then((r) => r.data.attachment);
    }

    const formData = new FormData();
    formData.append("type", payload.type);
    if (payload.title?.trim()) formData.append("title", payload.title.trim());
    if (payload.file) formData.append("file", payload.file);

    return api
      .post<{ message: string; attachment: { id: string } }>(`/tasks/${id}/attachments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data.attachment);
  },

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
