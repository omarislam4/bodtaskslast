import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Bug, AlertTriangle } from "lucide-react";
import { useAllTasksInfiniteQuery } from "@/hooks/useTaskQueries";
import type { BugSeverity } from "@/types";
import { useMembers } from "@/hooks/useMembers";
import { useLang } from "@/contexts/LangContext";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";
import { TaskRowSkeleton } from "@/components/shared/SkeletonLoader";

const SEVERITY_CONFIG: Record<BugSeverity, { label: string; color: string; bg: string; border: string }> = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  medium: { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  low: { label: "Low", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30" },
};

interface Props {
  spaceId: string;
  isInSpace: boolean;
  onReportBug: () => void;
}

export function SpaceBugsTab({ spaceId, isInSpace, onReportBug }: Props) {
  const [, navigate] = useLocation();
  const {
    data,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useAllTasksInfiniteQuery({ type: "bug", spaceId });
  const bugs = data?.pages.flatMap((p) => p.data) ?? [];
  const apiStats = data?.pages[0]?.stats;
  const { members } = useMembers();
  const { t } = useLang();

  const { ref: sentinelRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
  });

  const bugCounts = {
    total: apiStats?.total ?? 0,
    open: apiStats?.byStatus?.["todo"] ?? 0,
    critical: apiStats?.bySeverity?.["critical"] ?? 0,
  };

  return (
    <motion.div
      key="bugs"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-6xl mx-auto"
    >
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total Bugs", value: bugCounts.total, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Open", value: bugCounts.open, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Critical", value: bugCounts.critical, color: "text-red-600", bg: "bg-red-600/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 shadow-sm text-center">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {isInSpace && (
        <div className="flex justify-end mb-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReportBug}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-xl hover:bg-red-600 transition-colors"
          >
            <Bug className="w-3.5 h-3.5" /> Report Bug
          </motion.button>
        </div>
      )}

      {bugs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bug className="w-10 h-10 mb-3 opacity-20" />
          <p className="text-sm font-medium">No bugs in this space</p>
          <p className="text-xs mt-1">Report a bug to start tracking issues.</p>
        </div>
      ) : (
        <>
        <div className="space-y-2">
          {bugs.map((bug) => {
            const assigned = bug.assigneeIds
              .map((id) => members.find((m) => m.id === id))
              .filter(Boolean) as typeof members;
            const cfg = SEVERITY_CONFIG[bug.bugSeverity || "medium"];
            return (
              <motion.div
                key={bug.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/spaces/${spaceId}/tasks/${bug.id}`)}
                className="bg-card border border-border rounded-xl p-3 sm:p-4 cursor-pointer hover:border-primary/30 transition-all group flex items-center gap-3 flex-wrap sm:flex-nowrap"
              >
                <Bug className="w-4 h-4 text-red-400 shrink-0" />
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0", cfg.bg, cfg.color, cfg.border)}>
                  <AlertTriangle className="w-3 h-3" />
                  {cfg.label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary truncate">{bug.title}</p>
                  {assigned.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {assigned.map((m) => m.displayName || m.email).join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <TaskStatusBadge status={bug.status} size="sm" />
                  {bug.deadline && (
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      {format(new Date(bug.deadline!), "MMM d")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
        <div ref={sentinelRef} className="h-4 mt-2" />
        {isFetchingNextPage && (
          <div className="space-y-2 mt-2">
            {[1, 2].map((i) => <TaskRowSkeleton key={i} />)}
          </div>
        )}
        </>
      )}
    </motion.div>
  );
}
