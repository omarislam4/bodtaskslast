import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { useLocation } from "wouter";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, Layers, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAllTasks } from "@/hooks/useTasks";
import { useSpaces } from "@/hooks/useSpaces";
import { useMembers } from "@/hooks/useMembers";
import { DashboardStatSkeleton } from "@/components/shared/SkeletonLoader";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { useLang } from "@/contexts/LangContext";
import { format, isWithinInterval, addDays } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  todo: "#94a3b8",
  "in-progress": "#3b82f6",
  review: "#f59e0b",
  done: "#10b981",
  blocked: "#ef4444",
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] } }),
};

export default function Dashboard() {
  const { tasks, loading: tasksLoading } = useAllTasks();
  const { spaces, loading: spacesLoading } = useSpaces();
  const { members } = useMembers();
  const [, navigate] = useLocation();
  const { t } = useLang();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((tk) => tk.status === "done").length;
    const inProgress = tasks.filter((tk) => tk.status === "in-progress").length;
    const blocked = tasks.filter((tk) => tk.status === "blocked").length;
    const statusBreakdown = [
      { name: "To Do", value: tasks.filter((tk) => tk.status === "todo").length, key: "todo" },
      { name: "In Progress", value: inProgress, key: "in-progress" },
      { name: "Review", value: tasks.filter((tk) => tk.status === "review").length, key: "review" },
      { name: "Done", value: done, key: "done" },
      { name: "Blocked", value: blocked, key: "blocked" },
    ].filter((s) => s.value > 0);

    const upcoming = tasks
      .filter((tk) => tk.deadline && tk.status !== "done" && isWithinInterval(tk.deadline, { start: new Date(), end: addDays(new Date(), 7) }))
      .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0))
      .slice(0, 5);

    const recent = tasks.slice(0, 6);

    return { total, done, inProgress, blocked, statusBreakdown, upcoming, recent };
  }, [tasks]);

  const statCards = [
    { label: t.totalTasks, value: stats.total, icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { label: t.inProgress, value: stats.inProgress, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t.completed, value: stats.done, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Blocked", value: stats.blocked, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">{t.dashboard}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.completion}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {tasksLoading
          ? Array(4).fill(0).map((_, i) => <DashboardStatSkeleton key={i} />)
          : statCards.map((card, i) => (
              <motion.div
                key={card.label}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <card.icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground">{card.value}</p>
              </motion.div>
            ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Status chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">{t.tasksTab}</h3>
          {stats.statusBreakdown.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stats.statusBreakdown.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {stats.statusBreakdown.map((s) => (
                  <div key={s.key} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[s.key] }} />
                      <span className="text-muted-foreground">{s.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
              <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
              {t.noTasksYet}
            </div>
          )}
        </motion.div>

        {/* Upcoming deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">{t.upcomingDeadlines}</h3>
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          {stats.upcoming.length > 0 ? (
            <div className="space-y-2">
              {stats.upcoming.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TaskStatusBadge status={task.status} size="sm" />
                    <span className="text-xs text-foreground truncate">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2">
                    {task.deadline && format(task.deadline, "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Calendar className="w-7 h-7 mb-2 opacity-30" />
              {t.noUpcomingDeadlines}
            </div>
          )}
        </motion.div>

        {/* Spaces summary */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">{t.spaces}</h3>
            <button
              onClick={() => navigate("/spaces")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {t.viewAllTasks} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {spacesLoading ? (
            <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : spaces.length > 0 ? (
            <div className="space-y-2">
              {spaces.slice(0, 5).map((space) => {
                const spaceTasks = tasks.filter((tk) => tk.spaceId === space.id);
                const done = spaceTasks.filter((tk) => tk.status === "done").length;
                const pct = spaceTasks.length > 0 ? Math.round((done / spaceTasks.length) * 100) : 0;
                return (
                  <div
                    key={space.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/spaces/${space.id}`)}
                  >
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: space.color || "#6366f1" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{space.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{spaceTasks.length} {t.tasks}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
              <Layers className="w-7 h-7 mb-2 opacity-30" />
              {t.noSpacesFound}
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent tasks */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mt-6 bg-card border border-border rounded-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">{t.tasksTab}</h3>
        </div>
        {tasksLoading ? (
          <div className="space-y-2">{Array(4).fill(0).map((_, i) => <div key={i} className="h-10 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : stats.recent.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[t.tasksTab, t.status, t.priority, t.assignMembers, t.deadline].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-muted-foreground pb-2.5 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.recent.map((task) => {
                  const assigned = task.assigneeIds.map((id) => members.find((m) => m.id === id)?.displayName || "").filter(Boolean);
                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}
                    >
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-foreground line-clamp-1">{task.title}</span>
                      </td>
                      <td className="py-2.5 pr-4"><TaskStatusBadge status={task.status} size="sm" /></td>
                      <td className="py-2.5 pr-4"><TaskPriorityBadge priority={task.priority} size="sm" /></td>
                      <td className="py-2.5 pr-4">
                        <span className="text-xs text-muted-foreground">{assigned.slice(0, 2).join(", ") || "—"}</span>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground">
                        {task.deadline ? format(task.deadline, "MMM d, yyyy") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">{t.noTasksYet}</p>
        )}
      </motion.div>
    </div>
  );
}
