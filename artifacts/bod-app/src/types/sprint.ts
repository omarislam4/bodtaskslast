export type SprintStatus = "planning" | "active" | "completed";

export interface Sprint {
  id: string;
  spaceId: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  taskIds: string[];
  totalPoints: number;
  completedPoints: number;
  startDate?: string | null;
  endDate?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface CreateSprintPayload {
  spaceId: string;
  name: string;
  goal?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface UpdateSprintPayload {
  name?: string;
  goal?: string;
  status?: SprintStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface SprintCounts {
  total: number;
  active: number;
  planning: number;
  completed: number;
}

export interface PaginatedSprintsResponse {
  data: Sprint[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
  links: Record<string, string | null>;
  counts: SprintCounts;
}
