const rankings = {
  rankings: "Rankings",
  leaderboard: "Leaderboard",
  myRank: "My Rank",
  xp: "XP",
  strikes: "Strikes",
  tasksCompleted: "Tasks Completed",
  topThree: "Top Performers",
  allMembers: "All Members",
  filterByRank: "Filter by rank",
  allRanks: "All ranks",
  minXp: "Min XP",
  maxXp: "Max XP",
  minStrikes: "Min strikes",
  maxStrikes: "Max strikes",
  clearFilters: "Clear filters",
  nextRank: "Next rank",
  xpToNextRank: "XP to next rank",
  noRankingsFound: "No rankings found",
  position: "Rank",
  viewLeaderboard: "View leaderboard",
  maxRankReached: "Top rank reached",
} as const;

export type RankingsKeys = keyof typeof rankings;
export default rankings;
