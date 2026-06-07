import type { TaskQueryParams } from "@/types";

export const taskKeys = {
  all: (params?: TaskQueryParams) =>
    params ? (["tasks", params] as const) : (["tasks"] as const),
  allInfinite: (params?: TaskQueryParams) =>
    params ? (["tasks-infinite", params] as const) : (["tasks-infinite"] as const),
  detail: (id: string) => ["task", id] as const,
  myTasks: (params?: { scope?: string; search?: string }) =>
    params ? (["my-tasks", params] as const) : (["my-tasks"] as const),
  myTasksInfinite: (params?: { scope?: string; search?: string }) =>
    params ? (["my-tasks-infinite", params] as const) : (["my-tasks-infinite"] as const),
  timeline: (month: string) => ["tasks-timeline", month] as const,
  history: (params?: { search?: string; priority?: string }) =>
    params ? (["history", params] as const) : (["history"] as const),
  historyInfinite: (params?: { search?: string; priority?: string }) =>
    params ? (["history-infinite", params] as const) : (["history-infinite"] as const),
};
