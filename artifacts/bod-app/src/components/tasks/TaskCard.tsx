import { motion } from "framer-motion";
import { Calendar, Clock } from "lucide-react";
import { Task } from "@/hooks/useTasks";
import { UserDoc } from "@/contexts/AuthContext";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { AvatarGroup } from "@/components/shared/AvatarGroup";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TaskCardProps {
  task: Task;
  members: UserDoc[];
  onClick: () => void;
  index?: number;
}

export const TaskCard = ({ task, members, onClick, index = 0 }: TaskCardProps) => {
  const isOverdue = task.deadline && task.deadline < new Date() && task.status !== "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04, ease: "easeOut" }}
      whileHover={{ y: -1, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-xl p-4 cursor-pointer transition-shadow duration-200 group",
        task.status === "done" && "opacity-70"
      )}
      data-testid={`task-card-${task.id}`}
    >
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <h4 className={cn(
          "text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors duration-150 line-clamp-2",
          task.status === "done" && "line-through text-muted-foreground"
        )}>
          {task.title}
        </h4>
        <TaskStatusBadge status={task.status} size="sm" />
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <TaskPriorityBadge priority={task.priority} size="sm" />
        {task.deadline && (
          <span className={cn(
            "inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5",
            isOverdue
              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              : "bg-muted text-muted-foreground"
          )}>
            <Calendar className="w-3 h-3" />
            {format(task.deadline, "MMM d")}
          </span>
        )}
        {task.estimatedHours > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {task.estimatedHours}h
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <AvatarGroup memberIds={task.assigneeIds} members={members} max={3} size="sm" />
        <span className="text-xs text-muted-foreground font-medium">{task.progress}%</span>
      </div>

      {task.progress > 0 && (
        <ProgressBar value={task.progress} className="mt-2.5" />
      )}
    </motion.div>
  );
};
