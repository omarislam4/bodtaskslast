import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Layers } from "lucide-react";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import type { Task } from "@/types";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LangContext";

interface Props {
  spaceId: string;
}

export function SpaceGanttTab({ spaceId }: Props) {
  const [, navigate] = useLocation();
  const { data: tasks = [] } = useTasksBySpace(spaceId);

  return (
    <motion.div
      key="gantt"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 overflow-x-auto"
    >
      <GanttView tasks={tasks} spaceId={spaceId} onNavigate={navigate} />
    </motion.div>
  );
}

function GanttView({
  tasks,
  spaceId,
  onNavigate,
}: {
  tasks: Task[];
  spaceId?: string;
  onNavigate: (p: string) => void;
}) {
  const { t } = useLang();
  const tasksWithDates = tasks
    .filter((t) => t.deadline)
    .sort(
      (a, b) =>
        new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime(),
    );

  if (tasksWithDates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Layers className="w-12 h-12 opacity-20 mb-3" />
        <p className="font-semibold">{t.noTasksWithDeadlines}</p>
      </div>
    );
  }

  const minDate = new Date(
    tasksWithDates[0].startDate || tasksWithDates[0].createdAt,
  );
  const maxDate = new Date(tasksWithDates[tasksWithDates.length - 1].deadline!);
  const totalDays = Math.max(1, differenceInDays(maxDate, minDate) + 7);
  const today = new Date();

  const STATUS_COLORS: Record<string, string> = {
    todo: "#6b7280",
    "in-progress": "#3b82f6",
    review: "#f59e0b",
    done: "#10b981",
    blocked: "#ef4444",
  };

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground mb-4">
        Gantt Chart
      </h2>
      <div className="min-w-[600px]">
        {tasksWithDates.map((task) => {
          const start = new Date(task.startDate || task.createdAt);
          const end = new Date(task.deadline!);
          const startOffset = Math.max(0, differenceInDays(start, minDate));
          const duration = Math.max(1, differenceInDays(end, start));
          const leftPct = (startOffset / totalDays) * 100;
          const widthPct = (duration / totalDays) * 100;
          const isOverdue = end < today && task.status !== "done";
          const color = isOverdue
            ? "#ef4444"
            : STATUS_COLORS[task.status] || "#6366f1";

          return (
            <div
              key={task.id}
              className="flex items-center gap-3 mb-2 group cursor-pointer"
              onClick={() => onNavigate(`/spaces/${spaceId}/tasks/${task.id}`)}
            >
              <div className="w-40 shrink-0 text-xs text-foreground font-medium truncate group-hover:text-primary transition-colors">
                {task.title}
              </div>
              <div className="flex-1 h-7 relative bg-muted/50 rounded-lg overflow-hidden">
                <div
                  className="absolute h-full rounded-lg transition-all flex items-center px-2 overflow-hidden"
                  style={{
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    backgroundColor: color + "30",
                    borderLeft: `3px solid ${color}`,
                  }}
                >
                  <span
                    className="text-[10px] font-semibold truncate"
                    style={{ color }}
                  >
                    {task.progress}%
                  </span>
                </div>
                {today >= minDate && today <= maxDate && (
                  <div
                    className="absolute h-full w-0.5 bg-primary/60"
                    style={{
                      left: `${(differenceInDays(today, minDate) / totalDays) * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="w-16 text-xs text-muted-foreground shrink-0">
                {format(new Date(task.deadline!), "MMM d")}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
