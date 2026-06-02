import { Translations } from "@/locales";
import { BugSeverity, TaskStatus, TaskType } from "@/types";

type StatusItemType = {
  label: string;
  className?: string;
  color?: string;
};

export const taskStatusConfig = (
  t: Translations,
): Record<TaskStatus, StatusItemType> =>
  ({
    todo: {
      label: t.todo,
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
      color: "#94a3b8",
    },
    "in-progress": {
      label: t.inProgress,
      className:
        "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      color: "#3b82f6",
    },
    review: {
      label: t.review,
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      color: "#f59e0b",
    },
    done: {
      label: t.done,
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      color: "#10b981",
    },
    blocked: {
      label: t.blocked,
      className: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      color: "#ef4444",
    },
  }) as const;

export const statusOptions: (keyof ReturnType<typeof taskStatusConfig>)[] = [
  "todo",
  "in-progress",
  "review",
  "done",
  "blocked",
];

export const severityStatusConfig = (
  t: Translations,
): Record<BugSeverity, StatusItemType> =>
  ({
    critical: {
      label: t.critical,
      className: "bg-red-500/10 border-red-500/30 text-red-500",
    },
    high: {
      label: t.high,
      className: "bg-orange-500/10 border-orange-500/30 text-orange-500",
    },
    medium: {
      label: t.medium,
      className: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500",
    },
    low: {
      label: t.low,
      className: "bg-blue-500/10 border-blue-500/30 text-blue-500",
    },
  }) as const;

export const severityOptions: (keyof ReturnType<
  typeof severityStatusConfig
>)[] = ["low", "medium", "high", "critical"];

export const taskTypeConfig = (
  t: Translations,
): Record<TaskType, StatusItemType> =>
  ({
    task: {
      label: t.typeTask,
      className: "bg-primary/10 border-primary/50 text-primary",
    },
    bug: {
      label: t.typeBug,
      className: "bg-red-500/10 border-red-500/50 text-red-400",
    },
    feature: {
      label: t.typeFeature,
      className: "bg-purple-500/10 border-purple-500/50 text-purple-400",
    },
    improvement: {
      label: t.typeImprovement,
      className: "bg-blue-500/10 border-blue-500/50 text-blue-400",
    },
  }) as const;

export const taskTypes: (keyof ReturnType<typeof taskTypeConfig>)[] = [
  "task",
  "bug",
  "feature",
  "improvement",
];
