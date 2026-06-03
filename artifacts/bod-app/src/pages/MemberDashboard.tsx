import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { CheckCircle2, Clock, AlertCircle, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { useMyTasksQuery } from "@/hooks/useTaskQueries";
import { useAuth } from "@/contexts/AuthContext";
import { useLang } from "@/contexts/LangContext";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { format, isPast, isWithinInterval, addDays } from "date-fns";

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  }),
};

export default function MemberDashboard() {
  const { data: myTasks = [] } = useMyTasksQuery({ scope: "all" });
  const { userDoc } = useAuth();
  const { t, isRTL } = useLang();
  const [, navigate] = useLocation();

  const stats = useMemo(() => {
    const total = myTasks.length;
    const done = myTasks.filter((tk) => tk.status === "done").length;
    const inProgress = myTasks.filter((tk) => tk.status === "in-progress").length;
    const overdue = myTasks.filter(
      (tk) => tk.deadline && isPast(new Date(tk.deadline)) && tk.status !== "done",
    ).length;

    const upcoming = myTasks
      .filter(
        (tk) =>
          tk.deadline &&
          tk.status !== "done" &&
          isWithinInterval(new Date(tk.deadline), { start: new Date(), end: addDays(new Date(), 7) }),
      )
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

    const active = myTasks.filter((tk) => tk.status !== "done").slice(0, 10);

    return { total, done, inProgress, overdue, upcoming, active };
  }, [myTasks]);

  const statCards = [
    { label: t.totalTasks, value: stats.total, icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
    { label: t.inProgress, value: stats.inProgress, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t.completed, value: stats.done, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: t.overdue, value: stats.overdue, icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t.welcomeBack}, {userDoc?.displayName?.split(" ")[0] || ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t.hereAreYourAssignedTasks}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider line-clamp-1">{card.label}</span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${card.bg} flex items-center justify-center shrink-0`}>
                <card.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-foreground">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
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
                    {task.deadline && format(new Date(task.deadline), "MMM d")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-muted-foreground text-sm">
              <Calendar className="w-7 h-7 mb-2 opacity-30" />
              {t.noUpcomingDeadlines}
            </div>
          )}
        </motion.div>

        {/* Active tasks */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">{t.activeTasks}</h3>
            <button
              onClick={() => navigate("/spaces")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {t.viewSpaces} {isRTL ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
          {stats.active.length > 0 ? (
            <div className="space-y-2">
              {stats.active.map((task) => {
                const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== "done";
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}
                  >
                    <TaskStatusBadge status={task.status} size="sm" />
                    <span className="text-xs text-foreground truncate flex-1">{task.title}</span>
                    <TaskPriorityBadge priority={task.priority} size="sm" />
                    {isOverdue && <span className="text-xs text-red-500 font-medium shrink-0">Overdue</span>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-28 text-muted-foreground text-sm">
              <CheckCircle2 className="w-7 h-7 mb-2 opacity-30" />
              {t.noPendingTasks}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
