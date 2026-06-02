import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Plus, X, Trash2, Zap, ChevronRight } from "lucide-react";
import { useAutomations, useCreateAutomation, useUpdateAutomation, useDeleteAutomation } from "@/hooks/useAutomations";
import { useLang } from "@/contexts/LangContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TRIGGER_TYPES = [
  { value: "status_changes",   label: "Status changes to" },
  { value: "priority_changes", label: "Priority changes to" },
  { value: "assignee_added",   label: "Assignee is added" },
  { value: "task_created",     label: "Task is created" },
  { value: "due_date_reaches", label: "Due date reaches" },
];

const ACTION_TYPES = [
  { value: "change_status",    label: "Change status to" },
  { value: "change_priority",  label: "Change priority to" },
  { value: "send_notification", label: "Send notification" },
  { value: "create_task",      label: "Create a task" },
  { value: "webhook",          label: "Call webhook" },
];

const STATUS_VALUES = ["todo", "in-progress", "review", "done", "blocked"];
const PRIORITY_VALUES = ["low", "medium", "high", "urgent"];

const DEFAULT_FORM = {
  name: "",
  triggerType: "status_changes",
  triggerValue: "done",
  conditionType: "",
  conditionValue: "",
  actionType: "send_notification",
  actionValue: "Task completed!",
};

export default function Automations() {
  const { t } = useLang();
  const { data: rules = [], isLoading } = useAutomations();
  const createAutomation = useCreateAutomation();
  const updateAutomation = useUpdateAutomation();
  const deleteAutomation = useDeleteAutomation();

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    createAutomation.mutate(
      {
        name: form.name,
        triggerType: form.triggerType,
        triggerValue: form.triggerValue,
        conditionType: form.conditionType || null,
        conditionValue: form.conditionValue || null,
        actionType: form.actionType,
        actionValue: form.actionValue,
      },
      {
        onSuccess: () => {
          setShowCreate(false);
          setForm(DEFAULT_FORM);
        },
      }
    );
  };

  const toggleEnabled = (id: string, current: boolean) => {
    updateAutomation.mutate({ id, payload: { enabled: !current } });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this automation?")) return;
    deleteAutomation.mutate(id);
  };

  const getTriggerLabel = (triggerType: string) =>
    TRIGGER_TYPES.find((tt) => tt.value === triggerType)?.label || triggerType;
  const getActionLabel = (actionType: string) =>
    ACTION_TYPES.find((at) => at.value === actionType)?.label || actionType;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t.automations}</h1>
            <p className="text-sm text-muted-foreground">
              {rules.length} rules · {rules.filter((r) => r.enabled).length} active
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> {t.newAutomation}
        </motion.button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
        <Zap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          Automations are stored and can be executed via n8n or a Cloud Function. Rules trigger on matching task updates within the app.
        </p>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Bot className="w-12 h-12 opacity-20 mb-3" />
          <p className="font-semibold">{t.noAutomations}</p>
          <p className="text-sm">{t.noAutomationsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              layout
              className={cn(
                "bg-card border rounded-xl p-4 transition-all",
                rule.enabled ? "border-border" : "border-border/50 opacity-60"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", rule.enabled ? "bg-primary/10" : "bg-muted")}>
                  <Bot className={cn("w-4 h-4", rule.enabled ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{rule.name}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", rule.enabled ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground")}>
                      {rule.enabled ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-muted-foreground ms-auto">{rule.runCount} runs</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded-lg">
                      WHEN: {getTriggerLabel(rule.triggerType)}{" "}
                      <strong className="text-foreground">{rule.triggerValue}</strong>
                    </span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="bg-purple-500/10 text-purple-400 px-2 py-1 rounded-lg">
                      THEN: {getActionLabel(rule.actionType)}{" "}
                      <strong className="text-foreground">{rule.actionValue}</strong>
                    </span>
                  </div>
                  {rule.lastRunAt && (
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Last run: {format(new Date(rule.lastRunAt), "MMM d, HH:mm")}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleEnabled(rule.id, rule.enabled)}
                    disabled={updateAutomation.isPending && updateAutomation.variables?.id === rule.id}
                    className={cn("w-10 h-5 rounded-full transition-all relative disabled:opacity-60", rule.enabled ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn("absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm", rule.enabled ? "translate-x-5" : "translate-x-0.5")} />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    disabled={deleteAutomation.isPending && deleteAutomation.variables === rule.id}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
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
                <h2 className="text-lg font-bold text-foreground">{t.createAutomation}</h2>
                <button onClick={() => setShowCreate(false)} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t.automationName}
                  className="w-full px-3 py-2.5 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                />

                {/* Trigger */}
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{t.triggerLabel}</p>
                  <select
                    value={form.triggerType}
                    onChange={(e) => setForm((p) => ({ ...p, triggerType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {TRIGGER_TYPES.map((tt) => <option key={tt.value} value={tt.value}>{tt.label}</option>)}
                  </select>
                  {form.triggerType === "status_changes" && (
                    <select
                      value={form.triggerValue}
                      onChange={(e) => setForm((p) => ({ ...p, triggerValue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {STATUS_VALUES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  )}
                  {form.triggerType === "priority_changes" && (
                    <select
                      value={form.triggerValue}
                      onChange={(e) => setForm((p) => ({ ...p, triggerValue: e.target.value }))}
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {PRIORITY_VALUES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  )}
                  {form.triggerType !== "status_changes" && form.triggerType !== "priority_changes" && (
                    <input
                      value={form.triggerValue}
                      onChange={(e) => setForm((p) => ({ ...p, triggerValue: e.target.value }))}
                      placeholder="Value..."
                      className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  )}
                </div>

                {/* Action */}
                <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl space-y-3">
                  <p className="text-xs font-semibold text-purple-400 uppercase tracking-wide">{t.actionLabel}</p>
                  <select
                    value={form.actionType}
                    onChange={(e) => setForm((p) => ({ ...p, actionType: e.target.value }))}
                    className="w-full px-3 py-2 text-sm bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ACTION_TYPES.map((at) => <option key={at.value} value={at.value}>{at.label}</option>)}
                  </select>
                  <input
                    value={form.actionValue}
                    onChange={(e) => setForm((p) => ({ ...p, actionValue: e.target.value }))}
                    placeholder="Action value..."
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
                    disabled={createAutomation.isPending}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-60 transition-all"
                  >
                    {createAutomation.isPending ? t.creating : t.createAutomation}
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
