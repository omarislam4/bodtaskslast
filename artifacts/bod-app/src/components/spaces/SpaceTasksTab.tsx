import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Bug, AlertTriangle, Filter, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLang } from "@/contexts/LangContext";
import { useTasksBySpace, useCreateTask } from "@/hooks/useTaskQueries";
import type { TaskStatus, TaskPriority, TaskType, BugSeverity } from "@/types";
import { useSpaceMembers } from "@/hooks/useSpaces";
import { useSenders } from "@/hooks/useSenders";
import { TaskCard } from "@/components/tasks/TaskCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { TaskCardSkeleton } from "@/components/shared/SkeletonLoader";
import { useMembers } from "@/hooks/useMembers";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  priorityOptions,
  priorityStateConfig,
  severityOptions,
  severityStatusConfig,
  statusOptions,
  taskStatusConfig,
  taskTypeConfig,
  taskTypes,
} from "@/config/status-config";

const DEFAULT_FORM = {
  title: "",
  description: "",
  status: "todo" as TaskStatus,
  priority: "medium" as TaskPriority,
  deadline: "",
  estimatedHours: 0,
  assigneeIds: [] as string[],
  senderId: "",
  progress: 0,
  type: "task" as TaskType,
  bugSeverity: "medium" as BugSeverity,
  stepsToReproduce: "",
  expectedBehavior: "",
  actualBehavior: "",
};

interface Props {
  spaceId: string;
  isInSpace: boolean;
  showCreate: boolean;
  onShowCreateChange: (v: boolean) => void;
  createTaskType: TaskType;
}

export function SpaceTasksTab({
  spaceId,
  isInSpace,
  showCreate,
  onShowCreateChange,
  createTaskType,
}: Props) {
  const { t } = useLang();
  const [, navigate] = useLocation();
  const { data: tasks = [], isLoading: tasksLoading } =
    useTasksBySpace(spaceId);
  const createTask = useCreateTask();
  const { members } = useMembers();
  const { senders } = useSenders();
  const { data: spaceMembers = [] } = useSpaceMembers(spaceId);
  const statusConfig = taskStatusConfig(t);
  const severityConfig = severityStatusConfig(t);
  const taskConfig = taskTypeConfig(t);
  const priorityConfig = priorityStateConfig(t);

  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [form, setForm] = useState({ ...DEFAULT_FORM, type: createTaskType });

  useEffect(() => {
    setForm((f) => ({ ...f, type: createTaskType }));
  }, [createTaskType]);

  const filtered =
    statusFilter === "all"
      ? tasks
      : tasks.filter((tk) => tk.status === statusFilter);
  const statusCounts = statusOptions.reduce(
    (acc, s) => {
      acc[s] = tasks.filter((tk) => tk.status === s).length;
      return acc;
    },
    {} as Record<TaskStatus, number>,
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createTask.mutate(
      {
        spaceId,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        priority: form.priority,
        type: form.type,
        bugSeverity: form.type === "bug" ? form.bugSeverity : undefined,
        stepsToReproduce:
          form.type === "bug" ? form.stepsToReproduce : undefined,
        expectedBehavior:
          form.type === "bug" ? form.expectedBehavior : undefined,
        actualBehavior: form.type === "bug" ? form.actualBehavior : undefined,
        assigneeIds: form.assigneeIds,
        senderId: form.senderId || undefined,
        deadline: form.deadline || null,
        estimatedHours: form.estimatedHours,
        progress: form.progress,
      },
      {
        onSuccess: () => {
          toast.success("Task created");
          onShowCreateChange(false);
          setForm({ ...DEFAULT_FORM, type: createTaskType });
        },
        onError: () => toast.error(t.errCreateTask),
      },
    );
  };

  return (
    <motion.div
      key="tasks"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 sm:p-6 max-w-6xl mx-auto"
    >
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-6 overflow-hidden shadow-md"
          >
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {t.createTask}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder={t.taskTitle}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
                autoFocus
              />
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder={t.description}
                rows={2}
                className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
              />
              <div className="flex gap-2 flex-wrap">
                {taskTypes.map((tp) => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: tp }))}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all",
                      form.type === tp
                        ? taskConfig[tp].className
                        : "border-border text-muted-foreground hover:border-primary/50",
                    )}
                  >
                    {tp === "bug" && <Bug className="w-3 h-3" />}
                    {taskConfig[tp].label}
                  </button>
                ))}
              </div>

              {form.type === "bug" && (
                <div className="space-y-3 p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">
                      {t.bugSeverity}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {severityOptions.map((sv) => (
                        <button
                          key={sv}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, bugSeverity: sv }))
                          }
                          className={cn(
                            "px-3 py-1 text-xs font-medium rounded-lg border transition-all",
                            form.bugSeverity === sv
                              ? severityConfig[sv].className
                              : "border-border text-muted-foreground hover:border-border",
                          )}
                        >
                          <AlertTriangle className="w-3 h-3 inline me-1" />
                          {severityConfig[sv].label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={form.stepsToReproduce}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        stepsToReproduce: e.target.value,
                      }))
                    }
                    placeholder="Steps to reproduce..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <textarea
                      value={form.expectedBehavior}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          expectedBehavior: e.target.value,
                        }))
                      }
                      placeholder="Expected behavior..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none resize-none"
                    />
                    <textarea
                      value={form.actualBehavior}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          actualBehavior: e.target.value,
                        }))
                      }
                      placeholder="Actual behavior..."
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-background border border-input rounded-xl focus:outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t.status}
                  </label>
                  <Select
                    value={form.status}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, status: v as TaskStatus }))
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s} value={s}>
                          {statusConfig[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t.priority}
                  </label>
                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, priority: v as TaskPriority }))
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((p) => (
                        <SelectItem key={p} value={p}>
                          {priorityConfig[p].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t.deadline}
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, deadline: e.target.value }))
                    }
                    className="w-full px-3 pe-8 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t.estimatedHours}
                  </label>
                  <input
                    type="number"
                    value={form.estimatedHours}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        estimatedHours: Number(e.target.value),
                      }))
                    }
                    className="w-full px-3 pe-8 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  {t.assignMembers}
                </label>
                {spaceMembers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No members in this space yet
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {spaceMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            assigneeIds: f.assigneeIds.includes(m.id)
                              ? f.assigneeIds.filter((id) => id !== m.id)
                              : [...f.assigneeIds, m.id],
                          }))
                        }
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full border transition-all",
                          form.assigneeIds.includes(m.id)
                            ? "bg-primary/10 border-primary text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        <span className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {(m.displayName || "?")[0].toUpperCase()}
                        </span>
                        {m.displayName || m.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {senders.length > 0 && (
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">
                    {t.senderFrom}
                  </label>
                  <Select
                    value={form.senderId || "__none__"}
                    onValueChange={(v) =>
                      setForm((f) => ({
                        ...f,
                        senderId: v === "__none__" ? "" : v,
                      }))
                    }
                  >
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t.none}</SelectItem>
                      {senders.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => onShowCreateChange(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60"
                >
                  {createTask.isPending ? t.creating : t.createTask}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("all")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all",
            statusFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          <Filter className="w-3 h-3" /> {t.all} ({tasks.length})
        </button>
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all",
              statusFilter === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {statusConfig[s].label} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {tasksLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={
            statusFilter === "all"
              ? t.noTasksYet
              : t.noTasksMatchFilter(statusConfig[statusFilter].label)
          }
          description={
            isInSpace ? t.createYourFirstTask : t.noTasksMatchThisFilter
          }
          action={
            isInSpace && statusFilter === "all"
              ? {
                  label: t.createTask,
                  onClick: () => onShowCreateChange(true),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((task, i) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              index={i}
              onClick={() => navigate(`/spaces/${spaceId}/tasks/${task.id}`)}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
