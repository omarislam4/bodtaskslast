import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Clock, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useMyTasksInfiniteQuery } from "@/hooks/useTaskQueries";
import { useSpaces } from "@/hooks/useSpaces";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { useLocation } from "wouter";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";
import { useDebounce } from "@/hooks/useDebounce";
import { TaskRowSkeleton } from "@/components/shared/SkeletonLoader";

type Tab = "today" | "overdue" | "upcoming" | "all";

export default function MyTasks() {
  const { t } = useLang();
  const { spaces } = useSpaces();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [searchQ, setSearchQ] = useState("");
  const debouncedSearch = useDebounce(searchQ);

  const queryParams = {
    scope: activeTab,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useMyTasksInfiniteQuery(queryParams);

  const tasks = data?.pages.flatMap((p) => p.data) ?? [];
  const counts = data?.pages[0]?.counts;

  const { ref: sentinelRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const now = new Date();

  const getDeadlineLabel = (deadline: string | null | undefined) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    if (isToday(d)) return { text: "Today", color: "text-yellow-500" };
    if (isTomorrow(d)) return { text: "Tomorrow", color: "text-blue-400" };
    if (isPast(d)) return { text: `${Math.floor((now.getTime() - d.getTime()) / 86400000)}d overdue`, color: "text-red-500" };
    return { text: format(d, "MMM d"), color: "text-muted-foreground" };
  };

  const tabs: { id: Tab; label: string; count: number; icon: typeof Clock; color: string }[] = [
    { id: "today",    label: t.todayLabel,    count: counts?.today    ?? 0, icon: Calendar,      color: "text-blue-400" },
    { id: "overdue",  label: t.overdueLabel,  count: counts?.overdue  ?? 0, icon: AlertTriangle, color: "text-red-500" },
    { id: "upcoming", label: t.upcomingLabel, count: counts?.upcoming ?? 0, icon: Clock,         color: "text-yellow-500" },
    { id: "all",      label: t.allTasksLabel, count: counts?.all      ?? 0, icon: CheckSquare,   color: "text-primary" },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <CheckSquare className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{t.myTasks}</h1>
          <p className="text-sm text-muted-foreground">
            {counts ? `${counts.all} active tasks assigned to you` : "Loading…"}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center border gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-primary-foreground" : tab.color)} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={cn(
                    "text-xs rounded-full px-1.5 py-0.5 font-bold",
                    activeTab === tab.id
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        value={searchQ}
        onChange={(e) => setSearchQ(e.target.value)}
        placeholder={t.search}
        className="w-full px-4 py-2.5 text-sm bg-card border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      {/* Tasks */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <TaskRowSkeleton key={i} />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <CheckSquare className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noMyTasks}</p>
          <p className="text-sm">{t.noMyTasksDesc}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const space = spaces.find((s) => s.id === task.spaceId);
            const dl = getDeadlineLabel(task.deadline);
            return (
              <motion.div
                key={task.id}
                layout
                onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}
                className="flex items-center gap-4 bg-card border border-border rounded-xl px-4 py-3 cursor-pointer hover:border-primary/30 hover:bg-muted/50 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <TaskStatusBadge status={task.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {space && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: space.color || "#6366f1" }} />
                        {space.name}
                      </span>
                    )}
                    {dl && <span className={cn("text-xs font-medium", dl.color)}>{dl.text}</span>}
                    {task.storyPoints != null && (
                      <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                        {task.storyPoints} pts
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TaskPriorityBadge priority={task.priority} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="space-y-2">
              {[1, 2].map((i) => <TaskRowSkeleton key={i} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
