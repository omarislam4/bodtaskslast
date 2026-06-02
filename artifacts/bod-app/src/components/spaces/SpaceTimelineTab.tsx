import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import { useMembers } from "@/hooks/useMembers";
import { useLang } from "@/contexts/LangContext";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

interface Props {
  spaceId: string;
}

export function SpaceTimelineTab({ spaceId }: Props) {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { data: tasks = [] } = useTasksBySpace(spaceId);
  const { members } = useMembers();

  return (
    <motion.div
      key="timeline"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-5xl mx-auto"
    >
      <h2 className="text-sm font-semibold text-foreground mb-4">{t.taskTimeline}</h2>

      {tasks.filter((task) => task.deadline).length === 0 ? (
        <EmptyState icon={Calendar} title={t.noDeadlinesSet} description={t.noUpcomingDeadlines} />
      ) : (
        <div className="space-y-2">
          {tasks
            .filter((tk) => tk.deadline)
            .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
            .map((task) => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "done";
              const days = task.deadline ? differenceInDays(new Date(task.deadline), new Date()) : 0;
              const assigned = task.assigneeIds
                .map((id) => members.find((m) => m.id === id))
                .filter(Boolean) as typeof members;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-card border border-border rounded-xl p-3 sm:p-4 cursor-pointer hover:border-primary/30 transition-all group shadow-sm"
                  onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={cn("text-center shrink-0 w-10 sm:w-12", isOverdue ? "text-red-500" : "text-muted-foreground")}>
                      <p className="text-xs font-medium">{task.deadline ? format(new Date(task.deadline), "MMM") : ""}</p>
                      <p className="text-lg sm:text-xl font-bold leading-tight">{task.deadline ? format(new Date(task.deadline), "d") : ""}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {task.title}
                        </h4>
                        <TaskStatusBadge status={task.status} size="sm" />
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        {assigned.length > 0 && (
                          <div className="flex -space-x-1.5">
                            {assigned.slice(0, 3).map((m) => (
                              <div
                                key={m.id}
                                className="w-5 h-5 rounded-full bg-primary/20 border border-background flex items-center justify-center text-[10px] font-bold text-primary"
                                title={m.displayName}
                              >
                                {(m.displayName || "?")[0].toUpperCase()}
                              </div>
                            ))}
                          </div>
                        )}
                        {isOverdue && <span className="text-xs text-red-500 font-medium">Overdue</span>}
                        {!isOverdue && task.status !== "done" && (
                          <span className="text-xs text-muted-foreground">
                            {days === 0 ? "Due today" : days === 1 ? "Due tomorrow" : `${days} days left`}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.progress > 0 && (
                      <div className="shrink-0 text-right">
                        <span className="text-xs font-bold text-foreground">{task.progress}%</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
        </div>
      )}
    </motion.div>
  );
}
