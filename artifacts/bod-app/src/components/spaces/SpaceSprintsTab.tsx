import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  X,
  CheckCircle2,
  ChevronRight,
  Archive,
  Play,
  Trash2,
  Pencil,
} from "lucide-react";
import { TaskRowSkeleton } from "@/components/shared/SkeletonLoader";
import { useLang } from "@/contexts/LangContext";
import {
  useSprintsInfiniteQuery,
  useCreateSprint,
  useUpdateSprint,
  useDeleteSprint,
  useAddTaskToSprint,
  useRemoveTaskFromSprint,
} from "@/hooks/useSprintQueries";
import { useAllTasksInfiniteQuery } from "@/hooks/useTaskQueries";
import { useInView } from "react-intersection-observer";
import type { Sprint, SprintStatus, Task } from "@/types";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocation } from "wouter";

const STATUS_CONFIG: Record<
  SprintStatus,
  { label: string; color: string; bg: string }
> = {
  planning: { label: "Planning", color: "text-blue-400", bg: "bg-blue-400/10" },
  active: {
    label: "Active",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  completed: { label: "Done", color: "text-muted-foreground", bg: "bg-muted" },
};

interface Props {
  spaceId: string;
}

export function SpaceSprintsTab({ spaceId }: Props) {
  const { t } = useLang();

  const {
    data: sprintsData,
    isLoading: loading,
    isFetchingNextPage: fetchingMoreSprints,
    fetchNextPage: fetchMoreSprints,
    hasNextPage: hasMoreSprints,
  } = useSprintsInfiniteQuery(spaceId);
  const sprints = sprintsData?.pages.flatMap((p) => p.data) ?? [];
  const sprintCounts = sprintsData?.pages[0]?.counts;

  const {
    data: tasksData,
    isFetchingNextPage: fetchingMoreTasks,
    fetchNextPage: fetchMoreTasks,
    hasNextPage: hasMoreTasks,
  } = useAllTasksInfiniteQuery({ spaceId });
  const tasks = tasksData?.pages.flatMap((p) => p.data) ?? [];

  const { ref: sentinelRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView) {
        if (hasMoreSprints && !fetchingMoreSprints) fetchMoreSprints();
        if (hasMoreTasks && !fetchingMoreTasks) fetchMoreTasks();
      }
    },
  });
  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const addTaskToSprint = useAddTaskToSprint();
  const removeTaskFromSprint = useRemoveTaskFromSprint();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });
  const [form, setForm] = useState({
    name: "",
    goal: "",
    startDate: "",
    endDate: "",
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createSprint.mutate(
      {
        spaceId,
        name: form.name,
        goal: form.goal || undefined,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      },
      {
        onSuccess: () => {
          toast.success("Sprint created!");
          setShowCreate(false);
          setForm({ name: "", goal: "", startDate: "", endDate: "" });
        },
      },
    );
  };

  const handleAddTaskToSprint = (sprint: Sprint, task: Task) => {
    if (sprint.taskIds.includes(task.id)) return;
    addTaskToSprint.mutate(
      { sprintId: sprint.id, taskId: task.id },
      {
        onSuccess: () => toast.success("Task added to sprint"),
      },
    );
  };

  const handleRemoveFromSprint = (sprint: Sprint, taskId: string) => {
    removeTaskFromSprint.mutate({ sprintId: sprint.id, taskId });
  };

  const handleChangeStatus = (sprint: Sprint, status: SprintStatus) => {
    updateSprint.mutate({ id: sprint.id, payload: { status } });
  };

  const handleDeleteSprint = (id: string) => {
    if (
      !confirm(
        "Delete this sprint? Tasks will remain but be removed from the sprint.",
      )
    )
      return;
    deleteSprint.mutate(id, {
      onSuccess: () => toast.success("Sprint deleted"),
    });
  };

  const openEdit = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setEditForm({
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate
        ? format(new Date(sprint.startDate), "yyyy-MM-dd")
        : "",
      endDate: sprint.endDate
        ? format(new Date(sprint.endDate), "yyyy-MM-dd")
        : "",
    });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSprint || !editForm.name.trim()) return;
    updateSprint.mutate(
      {
        id: editingSprint.id,
        payload: {
          name: editForm.name.trim(),
          goal: editForm.goal.trim() || undefined,
          startDate: editForm.startDate || null,
          endDate: editForm.endDate || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Sprint updated!");
          setEditingSprint(null);
        },
      },
    );
  };

  const getSprintTasks = (sprint: Sprint) =>
    tasks.filter((t) => sprint.taskIds.includes(t.id));
  const getDoneCount = (sprint: Sprint) =>
    getSprintTasks(sprint).filter((t) => t.status === "done").length;

  const activeSprints = sprints.filter((s) => s.status === "active");
  const planningSprints = sprints.filter((s) => s.status === "planning");
  const completedSprints = sprints.filter((s) => s.status === "completed");
  const backlogTasks = tasks.filter((t) => !t.sprintId && t.status !== "done");

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{t.sprints}</h2>
            <p className="text-xs text-muted-foreground">
              {sprintCounts?.total ?? sprints.length} sprints · {backlogTasks.length} in backlog
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> {t.newSprint}
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {activeSprints.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {t.activeSprint}
              </h3>
              {activeSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  tasks={getSprintTasks(sprint)}
                  doneCount={getDoneCount(sprint)}
                  onRemove={handleRemoveFromSprint}
                  onStatus={handleChangeStatus}
                  onNavigate={navigate}
                  onEdit={openEdit}
                  onDelete={handleDeleteSprint}
                />
              ))}
            </div>
          )}

          {planningSprints.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {t.planningSprint}
              </h3>
              {planningSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  tasks={getSprintTasks(sprint)}
                  doneCount={getDoneCount(sprint)}
                  onRemove={handleRemoveFromSprint}
                  onStatus={handleChangeStatus}
                  onNavigate={navigate}
                  onEdit={openEdit}
                  onDelete={handleDeleteSprint}
                />
              ))}
            </div>
          )}

          {/* Backlog */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Archive className="w-3.5 h-3.5" />
              {t.backlog} ({backlogTasks.length})
            </h3>
            {backlogTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2">
                {t.noTasksYet}
              </p>
            ) : (
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {backlogTasks.slice(0, 30).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() =>
                        navigate(`/spaces/${spaceId}/tasks/${task.id}`)
                      }
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {task.title}
                      </p>
                    </div>
                    <TaskPriorityBadge priority={task.priority} />
                    {sprints.filter((s) => s.status !== "completed").length >
                      0 && (
                      <Select
                        value=""
                        onValueChange={(spId) => {
                          const sp = sprints.find((s) => s.id === spId);
                          if (sp) handleAddTaskToSprint(sp, task);
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-28">
                          <SelectValue placeholder={t.addToSprint} />
                        </SelectTrigger>
                        <SelectContent>
                          {sprints
                            .filter((s) => s.status !== "completed")
                            .map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {completedSprints.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3 list-none">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t.sprintCompleted} ({completedSprints.length})
                <ChevronRight className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" />
              </summary>
              {completedSprints.map((sprint) => (
                <SprintCard
                  key={sprint.id}
                  sprint={sprint}
                  tasks={getSprintTasks(sprint)}
                  doneCount={getDoneCount(sprint)}
                  onRemove={handleRemoveFromSprint}
                  onStatus={handleChangeStatus}
                  onNavigate={navigate}
                  onEdit={openEdit}
                  onDelete={handleDeleteSprint}
                />
              ))}
            </details>
          )}

          {sprints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Zap className="w-10 h-10 opacity-20 mb-3" />
              <p className="font-semibold">{t.noSprints}</p>
              <p className="text-sm">{t.noSprintsDesc}</p>
            </div>
          )}

          <div ref={sentinelRef} className="h-4" />
          {(fetchingMoreSprints || fetchingMoreTasks) && (
            <div className="space-y-2">
              {[1, 2].map((i) => <TaskRowSkeleton key={i} />)}
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">
                  {t.createSprint}
                </h2>
                <button
                  onClick={() => setShowCreate(false)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder={t.sprintName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={form.goal}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, goal: e.target.value }))
                  }
                  placeholder={t.sprintGoal}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t.sprintStart}
                    </label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t.sprintEnd}
                    </label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={createSprint.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
                  >
                    {createSprint.isPending ? t.creating : t.createSprint}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingSprint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingSprint(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">
                  Edit Sprint
                </h2>
                <button
                  onClick={() => setEditingSprint(null)}
                  className="p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={saveEdit} className="space-y-4">
                <input
                  required
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder={t.sprintName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={editForm.goal}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, goal: e.target.value }))
                  }
                  placeholder={t.sprintGoal}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t.sprintStart}
                    </label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) =>
                        setEditForm((p) => ({
                          ...p,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {t.sprintEnd}
                    </label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingSprint(null)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={updateSprint.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
                  >
                    {updateSprint.isPending ? t.saving : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SprintCard({
  sprint,
  tasks,
  doneCount,
  onRemove,
  onStatus,
  onNavigate,
  onEdit,
  onDelete,
}: {
  sprint: Sprint;
  tasks: Task[];
  doneCount: number;
  onRemove: (s: Sprint, id: string) => void;
  onStatus: (s: Sprint, st: SprintStatus) => void;
  onNavigate: (path: string) => void;
  onEdit: (s: Sprint) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useLang();
  const pct =
    tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const cfg = STATUS_CONFIG[sprint.status];
  const daysLeft = sprint.endDate
    ? differenceInDays(new Date(sprint.endDate), new Date())
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm text-foreground">
              {sprint.name}
            </h3>
            <span
              className={cn(
                "text-xs px-2 py-0.5 rounded-full font-medium",
                cfg.bg,
                cfg.color,
              )}
            >
              {cfg.label}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-xs text-muted-foreground">{sprint.goal}</p>
          )}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {sprint.startDate && (
              <span>{format(new Date(sprint.startDate), "MMM d")}</span>
            )}
            {sprint.endDate && (
              <>
                <span>→</span>
                <span>{format(new Date(sprint.endDate), "MMM d")}</span>
              </>
            )}
            {daysLeft != null && sprint.status === "active" && (
              <span
                className={cn(
                  "font-medium",
                  daysLeft < 2 ? "text-red-500" : "text-muted-foreground",
                )}
              >
                {daysLeft}d left
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {sprint.status === "planning" && (
            <button
              onClick={() => onStatus(sprint, "active")}
              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all"
            >
              <Play className="w-3 h-3" /> Start
            </button>
          )}
          {sprint.status === "active" && (
            <button
              onClick={() => onStatus(sprint, "completed")}
              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all"
            >
              <CheckCircle2 className="w-3 h-3" /> Complete
            </button>
          )}
          <button
            onClick={() => onEdit(sprint)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(sprint.id)}
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs font-bold text-foreground">{pct}%</span>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{tasks.length} done
        </span>
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group"
          >
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() =>
                onNavigate(`/spaces/${task.spaceId}/tasks/${task.id}`)
              }
            >
              <p className="text-xs font-medium text-foreground truncate">
                {task.title}
              </p>
            </div>
            <TaskStatusBadge status={task.status} />
            <button
              onClick={() => onRemove(sprint, task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-muted-foreground px-3 py-2">
            {t.noTasksInThisSprintYet}
          </p>
        )}
      </div>
    </div>
  );
}
