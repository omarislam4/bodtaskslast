import api from "./api";
import type { RankingSummary, LeaderboardResponse, RankingQueryParams } from "@/types";

export const rankingsService = {
  me: (): Promise<RankingSummary> =>
    api.get<RankingSummary>("/rankings/me").then((r) => r.data),

  forUser: (userId: string): Promise<RankingSummary> =>
    api.get<RankingSummary>(`/users/${userId}/ranking`).then((r) => r.data),

  leaderboard: (params?: RankingQueryParams): Promise<LeaderboardResponse> =>
    api.get<LeaderboardResponse>("/rankings", { params }).then((r) => r.data),
};
