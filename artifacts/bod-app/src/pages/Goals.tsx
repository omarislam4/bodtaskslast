import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, AlertTriangle, XCircle, CheckCircle2, X, Trash2 } from "lucide-react";
import { GoalCardSkeleton } from "@/components/shared/SkeletonLoader";
import { useLang } from "@/contexts/LangContext";
import { useGoalsInfiniteQuery, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoalQueries";
import type { Goal, GoalType, GoalStatus } from "@/types";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useInView } from "react-intersection-observer";

const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  on_track:  { label: "On Track",  color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  at_risk:   { label: "At Risk",   color: "text-yellow-500",  bg: "bg-yellow-500/10",  icon: AlertTriangle },
  off_track: { label: "Off Track", color: "text-red-500",     bg: "bg-red-500/10",     icon: XCircle },
  completed: { label: "Completed", color: "text-blue-500",    bg: "bg-blue-500/10",    icon: CheckCircle2 },
};

const TYPE_CONFIG: Record<GoalType, { label: string; suffix: string }> = {
  number:   { label: "Number", suffix: "" },
  percent:  { label: "%",      suffix: "%" },
  boolean:  { label: "T/F",    suffix: "" },
  currency: { label: "$",      suffix: "$" },
};

export default function Goals() {
  const { t } = useLang();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", type: "percent" as GoalType,
    targetValue: 100, currentValue: 0, folder: "", status: "on_track" as GoalStatus,
    dueDate: "",
  });

  const {
    data,
    isLoading: loading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useGoalsInfiniteQuery();

  const goals = data?.pages.flatMap((p) => p.data) ?? [];
  const apiStats = data?.pages[0]?.stats;

  const stats = {
    total:     apiStats?.total     ?? 0,
    onTrack:   apiStats?.onTrack   ?? 0,
    atRisk:    apiStats?.atRisk    ?? 0,
    offTrack:  apiStats?.offTrack  ?? 0,
    completed: apiStats?.completed ?? 0,
  };

  const { ref: sentinelRef } = useInView({
    threshold: 0.1,
    onChange: (inView) => {
      if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    },
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
        title: form.title, description: form.description, type: form.type,
        targetValue: form.targetValue, currentValue: form.currentValue,
        status: form.status, dueDate: form.dueDate || null,
      },
      {
        onSuccess: () => {
          toast.success("Goal created!");
          setShowCreate(false);
          setForm({ title: "", description: "", type: "percent", targetValue: 100, currentValue: 0, folder: "", status: "on_track", dueDate: "" });
        },
      }
    );
  };

  const handleUpdateProgress = (goal: Goal, newVal: number) => {
    updateGoal.mutate({ id: goal.id, payload: { currentValue: newVal } });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this goal?")) return;
    deleteGoal.mutate(id, { onSuccess: () => toast.success("Goal deleted") });
  };

  const handleStatusChange = (goal: Goal, status: GoalStatus) => {
    updateGoal.mutate({ id: goal.id, payload: { status } });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.goals}</h1>
            <p className="text-sm text-muted-foreground">{stats.total} goals total</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t.newGoal}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total",    value: stats.total,    color: "bg-primary/10 text-primary" },
          { label: t.onTrack,  value: stats.onTrack,  color: "bg-emerald-500/10 text-emerald-500" },
          { label: t.atRisk,   value: stats.atRisk,   color: "bg-yellow-500/10 text-yellow-500" },
          { label: t.offTrack, value: stats.offTrack, color: "bg-red-500/10 text-red-500" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Goals List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Target className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noGoals}</p>
          <p className="text-sm">{t.noGoalsDesc}</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {goals.map((goal) => {
              const pct = getProgress(goal);
              const cfg = STATUS_CONFIG[goal.status];
              const typeCfg = TYPE_CONFIG[goal.type];
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={goal.id}
                  layout
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
                      <Icon className={cn("w-4 h-4", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-foreground">{goal.title}</h3>
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", cfg.bg, cfg.color)}>{cfg.label}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{typeCfg.label}</span>
                        {goal.dueDate && (
                          <span className="text-xs text-muted-foreground ms-auto">
                            {format(new Date(goal.dueDate), "MMM d, yyyy")}
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      )}
                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
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
                      {/* Quick update */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-muted-foreground">{t.updateProgress}:</span>
                        {goal.type === "boolean" ? (
                          <button
                            onClick={() => handleUpdateProgress(goal, goal.currentValue >= 1 ? 0 : 1)}
                            className={cn(
                              "text-xs px-3 py-1 rounded-lg font-medium transition-all",
                              goal.currentValue >= 1
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-muted text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-500"
                            )}
                          >
                            {goal.currentValue >= 1 ? "Mark Incomplete" : "Mark Complete"}
                          </button>
                        ) : (
                          <input
                            type="number"
                            defaultValue={goal.currentValue}
                            min={0}
                            max={goal.targetValue * 2}
                            onBlur={(e) => handleUpdateProgress(goal, Number(e.target.value))}
                            className="w-24 px-2 py-1 text-xs bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                          />
                        )}
                        <Select value={goal.status} onValueChange={(v) => handleStatusChange(goal, v as GoalStatus)}>
                          <SelectTrigger className="h-7 text-xs w-28 ms-auto"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on_track">On Track</SelectItem>
                            <SelectItem value="at_risk">At Risk</SelectItem>
                            <SelectItem value="off_track">Off Track</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="space-y-3">
              {[1, 2].map((i) => <GoalCardSkeleton key={i} />)}
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-foreground">{t.createGoal}</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder={t.goalTitle}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder={t.goalDescription}
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.goalType}</label>
                    <Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v as GoalType }))}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">{t.percentGoal}</SelectItem>
                        <SelectItem value="number">{t.numberGoal}</SelectItem>
                        <SelectItem value="boolean">{t.booleanGoal}</SelectItem>
                        <SelectItem value="currency">{t.currencyGoal}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">{t.goalStatus}</label>
                    <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as GoalStatus }))}>
                      <SelectTrigger className="w-full text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_track">{t.onTrack}</SelectItem>
                        <SelectItem value="at_risk">{t.atRisk}</SelectItem>
                        <SelectItem value="off_track">{t.offTrack}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {form.type !== "boolean" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t.targetValue}</label>
                      <input
                        type="number"
                        value={form.targetValue}
                        onChange={(e) => setForm((p) => ({ ...p, targetValue: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t.currentValue}</label>
                      <input
                        type="number"
                        value={form.currentValue}
                        onChange={(e) => setForm((p) => ({ ...p, currentValue: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t.deadline}</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
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
                    disabled={createGoal.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
                  >
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
