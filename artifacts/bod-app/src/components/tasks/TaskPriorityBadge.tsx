import { cn } from "@/lib/utils";
import { TaskPriority } from "@/hooks/useTasks";

const priorityConfig: Record<TaskPriority, { label: string; className: string; dot: string }> = {
  low: {
    label: "Low",
    className: "bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400",
    dot: "bg-sky-500",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  high: {
    label: "High",
    className: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
    dot: "bg-red-500",
  },
};

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  size?: "sm" | "md";
}

export const TaskPriorityBadge = ({ priority, className, size = "md" }: TaskPriorityBadgeProps) => {
  const config = priorityConfig[priority] ?? priorityConfig.medium;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot, priority === "urgent" && "animate-pulse")} />
      {config.label}
    </span>
  );
};

export const priorityOptions: TaskPriority[] = ["low", "medium", "high", "urgent"];
export { priorityConfig };
