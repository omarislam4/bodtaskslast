import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TaskStatus } from "@/hooks/useTasks";

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  todo: { label: "To Do", className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  "in-progress": { label: "In Progress", className: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  review: { label: "Review", className: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  done: { label: "Done", className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  blocked: { label: "Blocked", className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  size?: "sm" | "md";
}

export const TaskStatusBadge = ({ status, className, size = "md" }: TaskStatusBadgeProps) => {
  const config = statusConfig[status] ?? statusConfig.todo;
  return (
    <motion.span
      layout
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all duration-200",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      {config.label}
    </motion.span>
  );
};

export const statusOptions: TaskStatus[] = ["todo", "in-progress", "review", "done", "blocked"];
export { statusConfig };
