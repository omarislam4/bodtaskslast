import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/types";
import { useLang } from "@/contexts/LangContext";
import { taskStatusConfig } from "@/config/status-config";

interface TaskStatusBadgeProps {
  status: TaskStatus;
  className?: string;
  size?: "sm" | "md";
}

export const TaskStatusBadge = ({
  status,
  className,
  size = "md",
}: TaskStatusBadgeProps) => {
  const { t } = useLang();
  const statusConfig = taskStatusConfig(t);
  const config = statusConfig[status] ?? statusConfig.todo;
  return (
    <motion.span
      layout
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-all duration-200",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        config.className,
        className,
      )}
    >
      {config.label}
    </motion.span>
  );
};
