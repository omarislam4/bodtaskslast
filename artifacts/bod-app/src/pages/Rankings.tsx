import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Flame, Award } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useLeaderboard } from "@/hooks/useRankings";
import { cn } from "@/lib/utils";
import type { RankingQueryParams, RankingSummary } from "@/types";

const RANK_NAMES = [
  "Beginner",
  "Planner",
  "Organizer",
  "Achiever",
  "Performer",
  "Expert",
  "Master",
  "Productivity Guru",
];

const PODIUM_STYLES = [
  { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-500" },
  { bg: "bg-slate-400/10", border: "border-slate-400/40", text: "text-slate-400" },
  { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-500" },
];

function initialsFor(name: string, email: string) {
  return (name || email || "U")[0]?.toUpperCase() || "U";
}

export default function Rankings() {
  const { t } = useLang();
  const [filters, setFilters] = useState<RankingQueryParams>({});
  const { data, isLoading } = useLeaderboard(filters);

  const topThree = data?.topThree ?? [];
  const list = data?.data ?? [];

  const hasFilters = useMemo(
    () => Object.values(filters).some((v) => v !== undefined && v !== ""),
    [filters],
  );

  const updateFilter = (key: keyof RankingQueryParams, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : key === "rank" ? value : Number(value),
    }));
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t.rankings}</h1>
          <p className="text-sm text-muted-foreground">{t.leaderboard}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-3 gap-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
            ))}
        </div>
      ) : (
        topThree.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3">{t.topThree}</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {topThree.map((user, i) => {
                const style = PODIUM_STYLES[i] ?? PODIUM_STYLES[2];
                return (
                  <motion.div
                    key={user.userId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn("bg-card border rounded-2xl p-4 shadow-sm", style.border)}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", style.bg, style.text)}>
                        {initialsFor(user.userName, user.userEmail)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.userName}</p>
                        <p className="text-xs text-muted-foreground">{user.rank.name}</p>
                      </div>
                      <Medal className={cn("w-5 h-5 ms-auto shrink-0", style.text)} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Award className="w-3.5 h-3.5" /> {user.xp} {t.xp}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Flame className="w-3.5 h-3.5" /> {user.strikes} {t.strikes}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )
      )}

      <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
        <div className="grid sm:grid-cols-5 gap-2">
          <select
            value={filters.rank ?? ""}
            onChange={(e) => updateFilter("rank", e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">{t.allRanks}</option>
            {RANK_NAMES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={filters.xpMin ?? ""}
            onChange={(e) => updateFilter("xpMin", e.target.value)}
            placeholder={t.minXp}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="number"
            value={filters.xpMax ?? ""}
            onChange={(e) => updateFilter("xpMax", e.target.value)}
            placeholder={t.maxXp}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="number"
            value={filters.strikesMin ?? ""}
            onChange={(e) => updateFilter("strikesMin", e.target.value)}
            placeholder={t.minStrikes}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            type="number"
            value={filters.strikesMax ?? ""}
            onChange={(e) => updateFilter("strikesMax", e.target.value)}
            placeholder={t.maxStrikes}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        {hasFilters && (
          <button
            onClick={() => setFilters({})}
            className="mt-2 text-xs text-primary hover:underline"
          >
            {t.clearFilters}
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{t.allMembers}</h2>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array(5)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
              ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trophy className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-sm">{t.noRankingsFound}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {list.map((user: RankingSummary) => (
              <div key={user.userId} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xs font-semibold text-muted-foreground w-6 shrink-0">
                  #{user.position}
                </span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {initialsFor(user.userName, user.userEmail)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{user.userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.rank.name}</p>
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-semibold text-foreground">{user.xp} {t.xp}</p>
                  <p className="text-xs text-muted-foreground">
                    {user.tasksDone}/{user.tasksNumber} {t.tasksCompleted}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
