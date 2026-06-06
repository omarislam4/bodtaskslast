import { priorityStateConfig } from "@/config/status-config";
import { useLang } from "@/contexts/LangContext";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  className?: string;
  size?: "sm" | "md";
}

export const TaskPriorityBadge = ({
  priority,
  className,
  size = "md",
}: TaskPriorityBadgeProps) => {
  const { t } = useLang();
  const priorityConfig = priorityStateConfig(t);
  const config = priorityConfig[priority] ?? priorityConfig.medium;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium text-nowrap shrink-0",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className,
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full",
          config.color,
          priority === "urgent" && "animate-pulse",
        )}
      />
      {config.label}
    </span>
  );
};
