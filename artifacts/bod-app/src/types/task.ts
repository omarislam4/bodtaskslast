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
  search?: string;
  includeCompleted?: boolean;
  deadlineFrom?: string;
  deadlineTo?: string;
  sprintId?: string;
}
