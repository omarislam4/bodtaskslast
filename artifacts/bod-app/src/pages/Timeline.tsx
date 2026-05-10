import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Calendar, AlertCircle } from "lucide-react";
import { useAllTasks } from "@/hooks/useTasks";
import { useSpaces } from "@/hooks/useSpaces";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { useLang } from "@/contexts/LangContext";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Timeline() {
  const { tasks, loading } = useAllTasks();
  const { spaces } = useSpaces();
  const [, navigate] = useLocation();
  const { t } = useLang();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthDays = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const tasksWithDeadline = tasks.filter((tk) => tk.deadline && tk.status !== "done");

  const getTasksForDay = (day: Date) =>
    tasksWithDeadline.filter((tk) => tk.deadline && isSameDay(tk.deadline, day));

  const upcomingTasks = tasksWithDeadline
    .sort((a, b) => (a.deadline?.getTime() || 0) - (b.deadline?.getTime() || 0));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="grid grid-cols-7 gap-2">
            {Array(35).fill(0).map((_, i) => <div key={i} className="h-20 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.timelineTab}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.upcomingDeadlines}</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground">{format(currentMonth, "MMMM yyyy")}</h3>
              <button
                onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array(startOfMonth(currentMonth).getDay()).fill(null).map((_, i) => (
                <div key={`empty-${i}`} className="h-16" />
              ))}
              {monthDays.map((day) => {
                const dayTasks = getTasksForDay(day);
                const today = isToday(day);
                return (
                  <motion.div
                    key={day.toISOString()}
                    className={`h-16 rounded-xl p-1.5 transition-colors ${today ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"} ${dayTasks.length > 0 ? "cursor-pointer" : ""}`}
                    whileHover={dayTasks.length > 0 ? { scale: 1.02 } : {}}
                  >
                    <span className={`text-xs font-medium block mb-0.5 ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {format(day, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((tk) => (
                        <div
                          key={tk.id}
                          onClick={() => navigate(`/spaces/${tk.spaceId}/tasks/${tk.id}`)}
                          className="text-xs px-1 py-0.5 rounded truncate font-medium"
                          style={{ backgroundColor: `${spaces.find((s) => s.id === tk.spaceId)?.color || "#6366f1"}20`, color: spaces.find((s) => s.id === tk.spaceId)?.color || "#6366f1" }}
                        >
                          {tk.title}
                        </div>
                      ))}
                      {dayTasks.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">+{dayTasks.length - 2}</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming tasks list */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">{t.upcomingDeadlines}</h3>
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {upcomingTasks.slice(0, 20).map((task) => {
                const space = spaces.find((s) => s.id === task.spaceId);
                const overdue = task.deadline && task.deadline < new Date();
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}
                    className="p-3 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">{task.title}</p>
                      <TaskStatusBadge status={task.status} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <TaskPriorityBadge priority={task.priority} size="sm" />
                      {task.deadline && (
                        <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-500" : "text-muted-foreground"}`}>
                          {overdue && <AlertCircle className="w-3 h-3" />}
                          <Calendar className="w-3 h-3" />
                          {format(task.deadline, "MMM d")}
                        </span>
                      )}
                    </div>
                    {space && (
                      <div className="flex items-center gap-1 mt-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: space.color }} />
                        <span className="text-xs text-muted-foreground">{space.name}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Calendar}
              title={t.noUpcomingDeadlines}
              description={t.upcomingDeadlines}
            />
          )}
        </div>
      </div>
    </div>
  );
}
