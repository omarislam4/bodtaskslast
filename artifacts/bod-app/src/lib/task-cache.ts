import type { QueryClient } from "@tanstack/react-query";
import type { Task, UpdateTaskPayload } from "@/types";
import { taskKeys } from "@/hooks/useTaskQueries";

export interface TaskCacheSnapshot {
  detail: Task | undefined;
  lists: [readonly unknown[], Task[] | undefined][];
}

/**
 * Instantly apply a task update across every cached task list and the detail
 * entry. Returns a snapshot so the caller can roll back on error.
 */
export function applyOptimisticTaskUpdate(
  queryClient: QueryClient,
  id: string,
  payload: UpdateTaskPayload,
): TaskCacheSnapshot {
  // Snapshot before touching anything
  const detail = queryClient.getQueryData<Task>(taskKeys.detail(id));
  const lists = queryClient.getQueriesData<Task[]>({ queryKey: ["tasks"] }) as [
    readonly unknown[],
    Task[] | undefined,
  ][];

  // Update the detail entry
  queryClient.setQueryData<Task | undefined>(taskKeys.detail(id), (old) =>
    old ? { ...old, ...payload } : old,
  );

  // Update every task list that contains this task
  queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) =>
    old?.map((t) => (t.id === id ? { ...t, ...payload } : t)) ?? old,
  );

  return { detail, lists };
}

/**
 * Restore all caches to the state captured by applyOptimisticTaskUpdate.
 */
export function rollbackTaskUpdate(
  queryClient: QueryClient,
  id: string,
  snapshot: TaskCacheSnapshot,
): void {
  queryClient.setQueryData(taskKeys.detail(id), snapshot.detail);
  for (const [queryKey, data] of snapshot.lists) {
    queryClient.setQueryData(queryKey, data);
  }
}
