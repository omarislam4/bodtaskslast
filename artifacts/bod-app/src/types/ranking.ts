export interface RankInfo {
  name: string;
  minXp: number;
  image: string | null;
  next?: {
    name: string;
    minXp: number;
    remainingXp: number;
    image: string | null;
  } | null;
}

export interface TaskStatusCounts {
  todo: number;
  "in-progress": number;
  review: number;
  done: number;
  blocked: number;
}

export interface RankingSummary {
  position: number;
  userId: string;
  userName: string;
  userEmail: string;
  avatar: string;
  rank: RankInfo;
  xp: number;
  strikes: number;
  tasksNumber: number;
  tasksDone: number;
  taskStatuses: TaskStatusCounts;
}

export interface LeaderboardResponse {
  topThree: RankingSummary[];
  data: RankingSummary[];
}

export interface RankingQueryParams {
  rank?: string;
  xpMin?: number;
  xpMax?: number;
  strikesMin?: number;
  strikesMax?: number;
  top?: number;
}
