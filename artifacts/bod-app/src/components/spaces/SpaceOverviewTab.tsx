import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import { useSpaceMembers } from "@/hooks/useSpaces";
import { useLang } from "@/contexts/LangContext";
import { statusOptions } from "@/components/tasks/TaskStatusBadge";
import { isWithinInterval, addDays, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  spaceId: string;
  onManageMembers: () => void;
}

export function SpaceOverviewTab({ spaceId, onManageMembers }: Props) {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { data: tasks = [] } = useTasksBySpace(spaceId);
  const { data: spaceMembers = [] } = useSpaceMembers(spaceId);

  const statusCounts = statusOptions.reduce(
    (acc, s) => {
      acc[s] = tasks.filter((tk) => tk.status === s).length;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-5xl mx-auto"
    >
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: t.totalTasks, value: tasks.length, color: "text-primary", bg: "bg-primary/10" },
          { label: t.inProgress, value: statusCounts["in-progress"] || 0, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: t.done, value: statusCounts["done"] || 0, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          {
            label: "Not Assigned",
            value: tasks.filter((tk) => !tk.assigneeIds || tk.assigneeIds.length === 0).length,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
          { label: t.membersLabel, value: spaceMembers.length, color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t.completion}</h3>
          {statusOptions.map((s) => {
            const count = statusCounts[s] || 0;
            const pct = tasks.length > 0 ? Math.round((count / tasks.length) * 100) : 0;
            const colors: Record<string, string> = {
              todo: "#94a3b8",
              "in-progress": "#3b82f6",
              review: "#f59e0b",
              done: "#10b981",
              blocked: "#ef4444",
            };
            return (
              <div key={s} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-muted-foreground w-16 sm:w-20 capitalize">
                  {s.replace("-", " ")}
                </span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: colors[s] }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-3">{t.upcomingDeadlines}</h3>
          {tasks
            .filter(
              (task) =>
                task.deadline &&
                task.status !== "done" &&
                isWithinInterval(new Date(task.deadline), { start: new Date(), end: addDays(new Date(), 14) }),
            )
            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
            .slice(0, 5)
            .map((task) => {
              const days = task.deadline ? differenceInDays(new Date(task.deadline), new Date()) : 0;
              return (
                <div
                  key={task.id}
                  className="flex items-center justify-between py-1.5 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                >
                  <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                  <span className={cn("text-xs font-medium shrink-0 ms-2", days <= 2 ? "text-red-500" : "text-muted-foreground")}>
                    {days === 0 ? t.today : days === 1 ? t.tomorrow : `${days}d`}
                  </span>
                </div>
              );
            })}
          {tasks.filter((task) => task.deadline && task.status !== "done").length === 0 && (
            <p className="text-xs text-muted-foreground">{t.noUpcomingDeadlines}</p>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">{t.teamMembers}</h3>
          <button onClick={onManageMembers} className="text-xs text-primary hover:underline">
            {t.manage}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {spaceMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {(m.displayName || m.email || "?")[0].toUpperCase()}
              </div>
              <span className="text-xs font-medium text-foreground">{m.displayName || m.email}</span>
            </div>
          ))}
          {spaceMembers.length === 0 && (
            <p className="text-xs text-muted-foreground">{t.noMembersYet}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
