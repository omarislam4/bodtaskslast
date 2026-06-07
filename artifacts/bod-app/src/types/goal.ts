export type GoalType = "number" | "percent" | "boolean" | "currency";
export type GoalStatus = "on_track" | "at_risk" | "off_track" | "completed";

export interface Goal {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  targetValue: number;
  currentValue: number;
  dueDate?: string | null;
  linkedTaskIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface CreateGoalPayload {
  spaceId?: string;
  title: string;
  description?: string;
  type?: GoalType;
  status?: GoalStatus;
  targetValue?: number;
  currentValue?: number;
  dueDate?: string | null;
}

export interface UpdateGoalPayload {
  title?: string;
  description?: string;
  type?: GoalType;
  status?: GoalStatus;
  targetValue?: number;
  currentValue?: number;
  dueDate?: string | null;
}

export interface GoalStats {
  total: number;
  onTrack: number;
  atRisk: number;
  offTrack: number;
  completed: number;
}

export interface PaginatedGoalsResponse {
  data: Goal[];
  meta: { total: number; page: number; perPage: number; lastPage: number };
  links: Record<string, string | null>;
  stats: GoalStats;
}
