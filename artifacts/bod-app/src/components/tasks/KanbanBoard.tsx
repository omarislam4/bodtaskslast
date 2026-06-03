import { useLocation } from "wouter";
import { motion } from "framer-motion";
import type { Task, TaskStatus } from "@/types";
import { UserDoc } from "@/contexts/AuthContext";
import { TaskCard } from "./TaskCard";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { useLang } from "@/contexts/LangContext";

interface KanbanBoardProps {
  tasks: Task[];
  members: UserDoc[];
  spaceId?: string;
}

export function KanbanBoard({ tasks, members, spaceId }: KanbanBoardProps) {
  const [, navigate] = useLocation();
  const { t } = useLang();

  const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: "todo", label: t.todo, color: "bg-slate-400" },
    { id: "in-progress", label: t.inProgress, color: "bg-blue-500" },
    { id: "review", label: t.review, color: "bg-amber-500" },
    { id: "done", label: t.done, color: "bg-emerald-500" },
    { id: "blocked", label: t.blocked, color: "bg-red-500" },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-100">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        return (
          <div
            key={col.id}
            className="flex flex-col shrink-0 w-72 bg-muted/40 rounded-2xl border border-border shadow-sm"
          >
            {/* Column header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-xs font-semibold text-foreground">
                {col.label}
              </span>
              <span className="ml-auto text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5 font-medium">
                {colTasks.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
              {colTasks.length === 0 ? (
                <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border">
                  <p className="text-xs text-muted-foreground">No tasks</p>
                </div>
              ) : (
                colTasks.map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    members={members}
                    index={i}
                    onClick={() =>
                      navigate(
                        spaceId
                          ? `/spaces/${task.spaceId}/tasks/${task.id}`
                          : `/spaces/${task.spaceId}/tasks/${task.id}`,
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
