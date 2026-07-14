import { useQuery } from "@tanstack/react-query";
import { rankingsService } from "@/services/rankings";
import type { RankingQueryParams } from "@/types";

export const rankingKeys = {
  all: () => ["rankings"] as const,
  me: () => ["rankings", "me"] as const,
  user: (userId: string) => ["rankings", "user", userId] as const,
  leaderboard: (params?: RankingQueryParams) => ["rankings", "leaderboard", params] as const,
};

export const useMyRanking = () =>
  useQuery({
    queryKey: rankingKeys.me(),
    queryFn: () => rankingsService.me(),
  });

export const useUserRanking = (userId: string | undefined) =>
  useQuery({
    queryKey: rankingKeys.user(userId ?? ""),
    queryFn: () => rankingsService.forUser(userId!),
    enabled: !!userId,
  });

export const useLeaderboard = (params?: RankingQueryParams) =>
  useQuery({
    queryKey: rankingKeys.leaderboard(params),
    queryFn: () => rankingsService.leaderboard(params),
  });
