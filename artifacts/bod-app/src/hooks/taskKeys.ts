import type { TaskQueryParams } from "@/types";

export const taskKeys = {
  all: (params?: TaskQueryParams) =>
    params ? (["tasks", params] as const) : (["tasks"] as const),
  detail: (id: string) => ["task", id] as const,
  myTasks: (params?: { scope?: string; search?: string }) =>
    params ? (["my-tasks", params] as const) : (["my-tasks"] as const),
  timeline: (month: string) => ["tasks-timeline", month] as const,
  history: (params?: { search?: string; priority?: string }) =>
    params ? (["history", params] as const) : (["history"] as const),
};
