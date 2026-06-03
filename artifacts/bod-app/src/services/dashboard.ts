import api from "./api";
import type { Task, TaskPriority, TaskStatus } from "@/types";

export interface DashboardStats {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  bugs: number;
  unassigned: number;
}

export interface DashboardStatusItem {
  name: string;
  value: number;
  key: string;
}

export interface DashboardTask {
  id: string;
  spaceId: string;
  title: string;
  status: TaskStatus;
  priority?: TaskPriority;
  type?: string;
  assigneeIds?: string[];
  deadline?: string;
  createdAt?: string;
}

export interface DashboardSpace {
  id: string;
  name: string;
  color: string;
  taskCount: number;
  doneCount: number;
  completionRate: number;
}

export interface DashboardMemberPerf {
  userId: string | null;
  name: string;
  fullName: string;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  blocked: number;
  total: number;
  completionRate: number;
  color: string;
}

export interface DashboardData {
  stats: DashboardStats;
  statusBreakdown: DashboardStatusItem[];
  upcoming: DashboardTask[];
  overdue: DashboardTask[];
  recent: DashboardTask[];
  spaces: DashboardSpace[];
  memberPerformance: DashboardMemberPerf[];
  kanbanTasks: Task[];
}

export interface ReassignPayload {
  assigneeId: string;
  reason?: string;
  newDeadline?: string;
}

export const dashboardService = {
  get: (params?: { performanceSpaceId?: string }): Promise<DashboardData> =>
    api.get("/dashboard", { params }).then((r) => r.data),

  reassign: (taskId: string, payload: ReassignPayload): Promise<{ message: string; task: Task }> =>
    api.post(`/tasks/${taskId}/reassign`, payload).then((r) => r.data),
};
