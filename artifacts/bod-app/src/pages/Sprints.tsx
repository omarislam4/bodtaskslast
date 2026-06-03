import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Plus, X, CheckCircle2, ChevronRight, Archive, Play, Trash2, Pencil } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import {
  useSprints, useCreateSprint, useUpdateSprint, useDeleteSprint,
  useAddTaskToSprint, useRemoveTaskFromSprint,
} from "@/hooks/useSprintQueries";
import { useAllTasksQuery } from "@/hooks/useTaskQueries";
import { useSpaces } from "@/hooks/useSpaces";
import { TaskStatusBadge } from "@/components/tasks/TaskStatusBadge";
import { TaskPriorityBadge } from "@/components/tasks/TaskPriorityBadge";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { Sprint, SprintStatus, Task } from "@/types";

const STATUS_CONFIG: Record<SprintStatus, { label: string; color: string; bg: string }> = {
  planning:  { label: "Planning", color: "text-blue-400",   bg: "bg-blue-400/10" },
  active:    { label: "Active",   color: "text-emerald-500", bg: "bg-emerald-500/10" },
  completed: { label: "Done",     color: "text-muted-foreground", bg: "bg-muted" },
};

export default function Sprints() {
  const { t } = useLang();
  const { data: sprints = [], isLoading: sprintsLoading } = useSprints();
  const { data: tasks = [] } = useAllTasksQuery();
  const { data: spaces = [] } = useSpaces();
  const [, navigate] = useLocation();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", goal: "", spaceId: "", startDate: "", endDate: "" });

  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [editForm, setEditForm] = useState({ name: "", goal: "", startDate: "", endDate: "" });

  const createSprint = useCreateSprint();
  const updateSprint = useUpdateSprint();
  const deleteSprint = useDeleteSprint();
  const addTaskToSprint = useAddTaskToSprint();
  const removeTaskFromSprint = useRemoveTaskFromSprint();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.spaceId) return;
    createSprint.mutate({
      name: form.name,
      goal: form.goal,
      spaceId: form.spaceId,
      startDate: form.startDate || null,
      endDate: form.endDate || null,
    }, {
      onSuccess: () => {
        toast.success("Sprint created!");
        setShowCreate(false);
        setForm({ name: "", goal: "", spaceId: "", startDate: "", endDate: "" });
      },
    });
  };

  const handleAddTaskToSprint = (sprint: Sprint, task: Task) => {
    if (sprint.taskIds.includes(task.id)) return;
    addTaskToSprint.mutate({ sprintId: sprint.id, taskId: task.id }, {
      onSuccess: () => toast.success("Task added to sprint"),
      onError: () => toast.error("Failed"),
    });
  };

  const handleRemoveFromSprint = (sprint: Sprint, taskId: string) => {
    removeTaskFromSprint.mutate({ sprintId: sprint.id, taskId }, {
      onError: () => toast.error("Failed"),
    });
  };

  const handleChangeStatus = (sprint: Sprint, status: SprintStatus) => {
    updateSprint.mutate({ id: sprint.id, payload: { status } }, {
      onError: () => toast.error("Failed"),
    });
  };

  const handleDeleteSprint = (sprintId: string) => {
    if (!confirm("Delete this sprint? Tasks will remain but be removed from the sprint.")) return;
    deleteSprint.mutate(sprintId, {
      onSuccess: () => toast.success("Sprint deleted"),
      onError: () => toast.error("Failed to delete sprint"),
    });
  };

  const openEdit = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setEditForm({
      name: sprint.name,
      goal: sprint.goal || "",
      startDate: sprint.startDate ? format(new Date(sprint.startDate), "yyyy-MM-dd") : "",
      endDate: sprint.endDate ? format(new Date(sprint.endDate), "yyyy-MM-dd") : "",
    });
  };

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSprint || !editForm.name.trim()) return;
    updateSprint.mutate({
      id: editingSprint.id,
      payload: {
        name: editForm.name.trim(),
        goal: editForm.goal.trim(),
        startDate: editForm.startDate || null,
        endDate: editForm.endDate || null,
      },
    }, {
      onSuccess: () => {
        toast.success("Sprint updated!");
        setEditingSprint(null);
      },
      onError: () => toast.error("Failed to update sprint"),
    });
  };

  const activeSprints = sprints.filter(s => s.status === "active");
  const planningSprints = sprints.filter(s => s.status === "planning");
  const completedSprints = sprints.filter(s => s.status === "completed");
  const backlogTasks = tasks.filter(t => !t.sprintId && t.status !== "done");

  const getSprintTasks = (sprint: Sprint) => tasks.filter(t => sprint.taskIds.includes(t.id));
  const getDoneCount = (sprint: Sprint) => getSprintTasks(sprint).filter(t => t.status === "done").length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.sprints}</h1>
            <p className="text-sm text-muted-foreground">{sprints.length} sprints · {backlogTasks.length} in backlog</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" /> {t.newSprint}
        </motion.button>
      </div>

      {sprintsLoading ? (
        <div className="space-y-4">{[1,2].map(i => <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-6">
          {activeSprints.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />{t.activeSprint}
              </h2>
              {activeSprints.map(sprint => (
                <SprintCard key={sprint.id} sprint={sprint} tasks={getSprintTasks(sprint)}
                  doneCount={getDoneCount(sprint)} spaces={spaces} onRemove={handleRemoveFromSprint}
                  onStatus={handleChangeStatus} onNavigate={navigate} onEdit={openEdit} onDelete={handleDeleteSprint} />
              ))}
            </div>
          )}

          {planningSprints.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400" />{t.planningSprint}
              </h2>
              {planningSprints.map(sprint => (
                <SprintCard key={sprint.id} sprint={sprint} tasks={getSprintTasks(sprint)}
                  doneCount={getDoneCount(sprint)} spaces={spaces} onRemove={handleRemoveFromSprint}
                  onStatus={handleChangeStatus} onNavigate={navigate} onEdit={openEdit} onDelete={handleDeleteSprint} />
              ))}
            </div>
          )}

          {/* Backlog */}
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Archive className="w-4 h-4" />{t.backlog} ({backlogTasks.length})
            </h2>
            {backlogTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground px-2">{t.noTasksYet}</p>
            ) : (
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {backlogTasks.slice(0, 20).map(task => {
                  const space = spaces.find(s => s.id === task.spaceId);
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}>
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        {space && <p className="text-xs text-muted-foreground">{space.name}</p>}
                      </div>
                      <TaskPriorityBadge priority={task.priority} />
                      {sprints.filter(s => s.status !== "completed").length > 0 && (
                        <Select value="" onValueChange={(spId) => { const sp = sprints.find(s => s.id === spId); if (sp) handleAddTaskToSprint(sp, task); }}>
                          <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder={t.addToSprint} /></SelectTrigger>
                          <SelectContent>
                            {sprints.filter(s => s.status !== "completed").map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {completedSprints.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2 mb-3 list-none">
                <CheckCircle2 className="w-4 h-4" />{t.sprintCompleted} ({completedSprints.length})
                <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform" />
              </summary>
              {completedSprints.map(sprint => (
                <SprintCard key={sprint.id} sprint={sprint} tasks={getSprintTasks(sprint)}
                  doneCount={getDoneCount(sprint)} spaces={spaces} onRemove={handleRemoveFromSprint}
                  onStatus={handleChangeStatus} onNavigate={navigate} onEdit={openEdit} onDelete={handleDeleteSprint} />
              ))}
            </details>
          )}

          {sprints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Zap className="w-12 h-12 opacity-20 mb-3" />
              <p className="font-semibold">{t.noSprints}</p>
              <p className="text-sm">{t.noSprintsDesc}</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">{t.createSprint}</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.sprintName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))}
                  placeholder={t.sprintGoal} rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <Select value={form.spaceId} onValueChange={(v) => setForm(p => ({ ...p, spaceId: v }))}>
                  <SelectTrigger className="w-full text-sm"><SelectValue placeholder="Select Space..." /></SelectTrigger>
                  <SelectContent>
                    {spaces.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1 block">{t.sprintStart}</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">{t.sprintEnd}</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                  <button type="submit" disabled={createSprint.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {createSprint.isPending ? t.creating : t.createSprint}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingSprint && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingSprint(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">Edit Sprint</h2>
                <button onClick={() => setEditingSprint(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={saveEdit} className="space-y-4">
                <input required value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.sprintName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={editForm.goal} onChange={e => setEditForm(p => ({ ...p, goal: e.target.value }))}
                  placeholder={t.sprintGoal} rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground mb-1 block">{t.sprintStart}</label>
                    <input type="date" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">{t.sprintEnd}</label>
                    <input type="date" value={editForm.endDate} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setEditingSprint(null)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all">{t.cancel}</button>
                  <button type="submit" disabled={updateSprint.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {updateSprint.isPending ? t.saving : "Save Changes"}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SprintCard({ sprint, tasks, doneCount, spaces, onRemove, onStatus, onNavigate, onEdit, onDelete }: {
  sprint: Sprint; tasks: Task[]; doneCount: number;
  spaces: { id: string; name: string; color?: string }[];
  onRemove: (s: Sprint, id: string) => void;
  onStatus: (s: Sprint, st: SprintStatus) => void;
  onNavigate: (path: string) => void;
  onEdit: (s: Sprint) => void;
  onDelete: (id: string) => void;
}) {
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;
  const cfg = STATUS_CONFIG[sprint.status];
  const daysLeft = sprint.endDate ? differenceInDays(new Date(sprint.endDate), new Date()) : null;

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-3">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{sprint.name}</h3>
            <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.bg, cfg.color)}>{cfg.label}</span>
          </div>
          {sprint.goal && <p className="text-sm text-muted-foreground">{sprint.goal}</p>}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {sprint.startDate && <span>{format(new Date(sprint.startDate), "MMM d")}</span>}
            {sprint.endDate && <><span>→</span><span>{format(new Date(sprint.endDate), "MMM d")}</span></>}
            {daysLeft != null && sprint.status === "active" && (
              <span className={cn("font-medium", daysLeft < 2 ? "text-red-500" : "text-muted-foreground")}>{daysLeft}d left</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {sprint.status === "planning" && (
            <button onClick={() => onStatus(sprint, "active")} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-all">
              <Play className="w-3 h-3" /> Start
            </button>
          )}
          {sprint.status === "active" && (
            <button onClick={() => onStatus(sprint, "completed")} className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all">
              <CheckCircle2 className="w-3 h-3" /> Complete
            </button>
          )}
          <button onClick={() => onEdit(sprint)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(sprint.id)} className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-bold text-foreground">{pct}%</span>
        <span className="text-xs text-muted-foreground">{doneCount}/{tasks.length} done</span>
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {tasks.map(task => {
          const space = spaces.find(s => s.id === task.spaceId);
          return (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 group">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate(`/spaces/${task.spaceId}/tasks/${task.id}`)}>
                <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                {space && <p className="text-xs text-muted-foreground">{space.name}</p>}
              </div>
              <TaskStatusBadge status={task.status} />
              <button onClick={() => onRemove(sprint, task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        {tasks.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No tasks in this sprint yet</p>}
      </div>
    </div>
  );
}
