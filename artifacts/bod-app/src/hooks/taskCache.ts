import type { QueryClient } from "@tanstack/react-query";
import type { Task, UpdateTaskPayload, ChecklistItem, Subtask } from "@/types";
import { taskKeys } from "./taskKeys";

// ─── Confirmed-state setters ──────────────────────────────────────────────────

export function setTaskDetail(qc: QueryClient, id: string, task: Task) {
  qc.setQueryData(taskKeys.detail(id), task);
}

// ─── Optimistic patch helpers — each returns the previous snapshot ────────────

export function applyTaskPatch(
  qc: QueryClient,
  taskId: string,
  patch: UpdateTaskPayload,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) =>
    old ? { ...old, ...patch } : old,
  );
  return previous;
}

export function applySubtaskPatch(
  qc: QueryClient,
  taskId: string,
  subtaskId: string,
  patch: Partial<Pick<Subtask, "status" | "title">>,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old) return old;
    return {
      ...old,
      subtasks: old.subtasks.map((s) =>
        s.id === subtaskId ? { ...s, ...patch } : s,
      ),
    };
  });
  return previous;
}

export function removeSubtask(
  qc: QueryClient,
  taskId: string,
  subtaskId: string,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old) return old;
    return { ...old, subtasks: old.subtasks.filter((s) => s.id !== subtaskId) };
  });
  return previous;
}

export function applyChecklistPatch(
  qc: QueryClient,
  taskId: string,
  itemId: string,
  patch: Partial<Pick<ChecklistItem, "done" | "text">>,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old) return old;
    return {
      ...old,
      checklistItems: old.checklistItems.map((c) =>
        c.id === itemId ? { ...c, ...patch } : c,
      ),
    };
  });
  return previous;
}

export function removeChecklistItem(
  qc: QueryClient,
  taskId: string,
  itemId: string,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old) return old;
    return {
      ...old,
      checklistItems: old.checklistItems.filter((c) => c.id !== itemId),
    };
  });
  return previous;
}

export function applyWatcherAdd(
  qc: QueryClient,
  taskId: string,
  userId: string,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old || old.watchers.includes(userId)) return old;
    return { ...old, watchers: [...old.watchers, userId] };
  });
  return previous;
}

export function applyWatcherRemove(
  qc: QueryClient,
  taskId: string,
  userId: string,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old) return old;
    return { ...old, watchers: old.watchers.filter((id) => id !== userId) };
  });
  return previous;
}

export function removeTaskTag(
  qc: QueryClient,
  taskId: string,
  tag: string,
): Task | undefined {
  const previous = qc.getQueryData<Task>(taskKeys.detail(taskId));
  qc.setQueryData<Task>(taskKeys.detail(taskId), (old) => {
    if (!old) return old;
    return { ...old, tags: old.tags.filter((t) => t !== tag) };
  });
  return previous;
}

// ─── Invalidation helpers ─────────────────────────────────────────────────────

export function invalidateTaskDetail(qc: QueryClient, taskId: string) {
  qc.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
}

export function invalidateTaskList(qc: QueryClient, spaceId?: string) {
  qc.invalidateQueries({ queryKey: taskKeys.all(spaceId ? { spaceId } : undefined) });
}
