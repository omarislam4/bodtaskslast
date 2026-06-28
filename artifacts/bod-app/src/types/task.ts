export type TaskStatus = "todo" | "in-progress" | "review" | "done" | "blocked";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskType = "task" | "bug" | "feature" | "improvement";
export type BugSeverity = "critical" | "high" | "medium" | "low";
export type DependencyType = "blocking" | "blocked_by" | "related" | "duplicate";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  assigneeId?: string;
}

export interface Subtask {
  id: string;
  title: string;
  status: TaskStatus;
  assigneeIds: string[];
  createdAt: number;
  completedAt?: number;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  startTime: number;
  endTime?: number;
  duration: number;
  note?: string;
  billable: boolean;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  type: "file" | "screenshot" | "video" | "link";
  title?: string | null;
  url?: string | null;
  fileName?: string | null;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  meta?: unknown[];
  createdAt?: string;
}

export interface TaskDependency {
  taskId: string;
  type: DependencyType;
}

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  interval: number;
  endDate?: string | null;
  endAfterOccurrences?: number;
}

export interface ActivityLog {
  id: string;
  type: "message" | "reply" | "notification" | "comment";
  source: "whatsapp" | "manual" | "system";
  text: string;
  timestamp: number;
  sender?: string;
}

export interface Task {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  bugSeverity?: BugSeverity | null;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  tags: string[];
  checklistItems: ChecklistItem[];
  subtasks: Subtask[];
  timeEntries: TimeEntry[];
  attachments?: TaskAttachment[];
  dependencies: TaskDependency[];
  recurrence?: RecurrenceConfig | null;
  storyPoints?: number | null;
  startDate?: string | null;
  watchers: string[];
  sprintId?: string | null;
  milestone: boolean;
  assigneeIds: string[];
  senderId: string;
  deadline?: string | null;
  estimatedHours: number;
  progress: number;
  createdAt: string;
  createdBy: string;
  completedAt?: string | null;
  activityLog: ActivityLog[];
}

export interface CreateTaskPayload {
  spaceId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  bugSeverity?: BugSeverity | null;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  assigneeIds?: string[];
  senderId?: string;
  deadline?: string | null;
  estimatedHours?: number;
  progress?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  bugSeverity?: BugSeverity | null;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  assigneeIds?: string[];
  senderId?: string;
  deadline?: string | null;
  estimatedHours?: number;
  progress?: number;
  storyPoints?: number | null;
  startDate?: string | null;
  watchers?: string[];
  sprintId?: string | null;
  milestone?: boolean;
  recurrence?: RecurrenceConfig | null;
  completedAt?: string | null;
}

export interface TaskQueryParams {
  spaceId?: string;
  assigneeId?: string;
  type?: TaskType;
  status?: TaskStatus;
  bugSeverity?: BugSeverity;
  search?: string;
  includeCompleted?: boolean;
  deadlineFrom?: string;
  deadlineTo?: string;
  sprintId?: string;
  page?: number;
  perPage?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  lastPage: number;
  filteredTotal?: number;
}

export interface TaskCounts {
  today: number;
  overdue: number;
  upcoming: number;
  all: number;
  done: number;
  inProgress: number;
}

export interface TaskStats {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  bySeverity?: Record<string, number>;
}

export interface PaginatedMyTasksResponse {
  data: Task[];
  meta: PaginationMeta;
  links: Record<string, string | null>;
  counts: TaskCounts;
}

export interface PaginatedHistoryResponse {
  data: Task[];
  meta: PaginationMeta;
  links: Record<string, string | null>;
}

export interface PaginatedTasksResponse {
  data: Task[];
  meta: PaginationMeta;
  links: Record<string, string | null>;
  stats: TaskStats;
}
