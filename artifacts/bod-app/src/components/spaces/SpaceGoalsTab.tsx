import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, AlertTriangle, XCircle, CheckCircle2, X, Trash2 } from "lucide-react";
import { useLang } from "@/contexts/LangContext";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoalQueries";
import type { Goal, GoalType, GoalStatus } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  on_track:  { label: "On Track",  color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  at_risk:   { label: "At Risk",   color: "text-yellow-500",  bg: "bg-yellow-500/10",  icon: AlertTriangle },
  off_track: { label: "Off Track", color: "text-red-500",     bg: "bg-red-500/10",     icon: XCircle },
  completed: { label: "Completed", color: "text-blue-500",    bg: "bg-blue-500/10",    icon: CheckCircle2 },
};

const TYPE_CONFIG: Record<GoalType, { label: string; suffix: string }> = {
  number:   { label: "Number", suffix: "" },
  percent:  { label: "%",      suffix: "%" },
  boolean:  { label: "T/F",   suffix: "" },
  currency: { label: "$",     suffix: "$" },
};

interface Props { spaceId: string; }

export function SpaceGoalsTab({ spaceId }: Props) {
  const { t } = useLang();
  const { data: goals = [], isLoading: loading } = useGoals(spaceId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "percent" as GoalType,
    targetValue: 100, currentValue: 0, status: "on_track" as GoalStatus, dueDate: "",
  });

  const getProgress = (goal: Goal) => {
    if (goal.type === "boolean") return goal.currentValue >= 1 ? 100 : 0;
    if (goal.targetValue === 0) return 0;
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    createGoal.mutate(
      {
        spaceId,
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        status: form.status,
        targetValue: form.targetValue,
        currentValue: form.currentValue,
        dueDate: form.dueDate || null,
      },
      {
        onSuccess: () => {
          toast.success("Goal created!");
          setShowCreate(false);
          setForm({ title: "", description: "", type: "percent", targetValue: 100, currentValue: 0, status: "on_track", dueDate: "" });
        },
      },
    );
  };

  const handleUpdateProgress = (goal: Goal, newVal: number) => {
    updateGoal.mutate({ id: goal.id, payload: { currentValue: newVal } });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this goal?")) return;
    deleteGoal.mutate(id, {
      onSuccess: () => toast.success("Goal deleted"),
    });
  };

  const handleStatusChange = (goal: Goal, status: GoalStatus) => {
    updateGoal.mutate({ id: goal.id, payload: { status } });
  };

  const stats = {
    total: goals.length,
    onTrack: goals.filter(g => g.status === "on_track").length,
    atRisk: goals.filter(g => g.status === "at_risk").length,
    completed: goals.filter(g => g.status === "completed").length,
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">{t.goals}</h2>
            <p className="text-xs text-muted-foreground">{stats.total} goals</p>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-sm hover:bg-primary/90 transition-all">
          <Plus className="w-3.5 h-3.5" /> {t.newGoal}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,     color: "bg-primary/10 text-primary" },
          { label: t.onTrack,  value: stats.onTrack,   color: "bg-emerald-500/10 text-emerald-500" },
          { label: t.atRisk,   value: stats.atRisk,    color: "bg-yellow-500/10 text-yellow-500" },
          { label: "Done",     value: stats.completed, color: "bg-blue-500/10 text-blue-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}</div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Target className="w-10 h-10 opacity-20 mb-3" />
          <p className="font-semibold">{t.noGoals}</p>
          <p className="text-sm">{t.noGoalsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const pct = getProgress(goal);
            const cfg = STATUS_CONFIG[goal.status];
            const typeCfg = TYPE_CONFIG[goal.type];
            const Icon = cfg.icon;
            return (
              <motion.div key={goal.id} layout className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm text-foreground">{goal.title}</h3>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.bg, cfg.color)}>{cfg.label}</span>
                      {goal.dueDate && (
                        <span className="text-xs text-muted-foreground ms-auto">{format(new Date(goal.dueDate), "MMM d, yyyy")}</span>
                      )}
                    </div>
                    {goal.description && <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-primary" : "bg-yellow-500")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">{pct}%</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {goal.type === "boolean"
                          ? (goal.currentValue >= 1 ? "Done" : "Pending")
                          : `${typeCfg.suffix}${goal.currentValue} / ${typeCfg.suffix}${goal.targetValue}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{t.updateProgress}:</span>
                      {goal.type === "boolean" ? (
                        <button onClick={() => handleUpdateProgress(goal, goal.currentValue >= 1 ? 0 : 1)}
                          className={cn("text-xs px-2.5 py-1 rounded-lg font-medium transition-all", goal.currentValue >= 1 ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500")}>
                          {goal.currentValue >= 1 ? "Mark Incomplete" : "Mark Complete"}
                        </button>
                      ) : (
                        <input type="number" defaultValue={goal.currentValue} min={0} max={goal.targetValue * 2}
                          onBlur={e => handleUpdateProgress(goal, Number(e.target.value))}
                          className="w-20 px-2 py-1 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      )}
                      <select value={goal.status} onChange={e => handleStatusChange(goal, e.target.value as GoalStatus)}
                        className="text-xs px-2 py-1 bg-background border border-input rounded-lg focus:outline-none ms-auto">
                        <option value="on_track">On Track</option>
                        <option value="at_risk">At Risk</option>
                        <option value="off_track">Off Track</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button onClick={() => handleDelete(goal.id)} className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
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
                <h2 className="text-lg font-bold text-foreground">{t.createGoal}</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder={t.goalTitle}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder={t.goalDescription} rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.goalType}</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as GoalType }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                      <option value="percent">{t.percentGoal}</option>
                      <option value="number">{t.numberGoal}</option>
                      <option value="boolean">{t.booleanGoal}</option>
                      <option value="currency">{t.currencyGoal}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.goalStatus}</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as GoalStatus }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none">
                      <option value="on_track">{t.onTrack}</option>
                      <option value="at_risk">{t.atRisk}</option>
                      <option value="off_track">{t.offTrack}</option>
                    </select>
                  </div>
                </div>
                {form.type !== "boolean" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t.targetValue}</label>
                      <input type="number" value={form.targetValue} onChange={e => setForm(p => ({ ...p, targetValue: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t.currentValue}</label>
                      <input type="number" value={form.currentValue} onChange={e => setForm(p => ({ ...p, currentValue: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t.deadline}</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowCreate(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-all">
                    {t.cancel}
                  </button>
                  <button type="submit" disabled={createGoal.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {createGoal.isPending ? t.creating : t.createGoal}
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
