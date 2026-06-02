import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useTasksBySpace } from "@/hooks/useTaskQueries";
import type { Task } from "@/types";
import { cn } from "@/lib/utils";

interface Props {
  spaceId: string;
}

export function SpaceCalendarTab({ spaceId }: Props) {
  const [, navigate] = useLocation();
  const { data: tasks = [] } = useTasksBySpace(spaceId);

  return (
    <motion.div
      key="calendar"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6"
    >
      <CalendarView tasks={tasks} spaceId={spaceId} onNavigate={navigate} />
    </motion.div>
  );
}

function CalendarView({
  tasks,
  spaceId,
  onNavigate,
}: {
  tasks: Task[];
  spaceId?: string;
  onNavigate: (p: string) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const today = new Date();

  const getTasksForDay = (day: number) => {
    const d = new Date(year, month, day);
    return tasks.filter((t) => {
      if (!t.deadline) return false;
      const dl = new Date(t.deadline);
      return dl.getFullYear() === year && dl.getMonth() === month && dl.getDate() === day;
    });
  };

  const STATUS_COLORS: Record<string, string> = {
    todo: "bg-muted-foreground/60",
    "in-progress": "bg-blue-400",
    review: "bg-yellow-400",
    done: "bg-emerald-500",
    blocked: "bg-red-500",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-foreground">{monthName}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            className="px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-all"
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            className="px-3 py-1.5 text-xs bg-muted rounded-lg hover:bg-muted/80 transition-all"
          >
            Next →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 bg-muted/50">{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="bg-card min-h-[80px]" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const dayTasks = getTasksForDay(day);
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          return (
            <div key={day} className={cn("bg-card min-h-[80px] p-2 border-0", isToday && "bg-primary/5")}>
              <div className={cn(
                "text-xs font-bold mb-1 w-5 h-5 flex items-center justify-center rounded-full",
                isToday ? "bg-primary text-primary-foreground" : "text-foreground",
              )}>
                {day}
              </div>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onNavigate(`/spaces/${spaceId}/tasks/${task.id}`)}
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded text-white cursor-pointer truncate font-medium",
                      STATUS_COLORS[task.status] || "bg-primary",
                    )}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
